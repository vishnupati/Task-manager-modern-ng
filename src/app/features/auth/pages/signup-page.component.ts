import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { email, form, FormField, minLength, required, submit } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { NotificationService } from '../../../core/services/notification.service';
import { UserAuthService } from '../../../core/services/user-auth.service';
import { BACKEND_URL, GITHUB_CLIENT_ID, GOOGLE_CLIENT_ID } from '../../../core/config/api.config';

interface GoogleCredentialResponse {
    credential?: string;
    [ key: string ]: unknown;
}

interface GoogleIdentityServices {
    accounts?: {
        id?: {
            initialize(options: {
                client_id: string;
                callback: (response: GoogleCredentialResponse) => void;
            }): void;
            prompt(): void;
        };
    };
}

interface SignupForm {
    name: string;
    email: string;
    password: string;
}

@Component({
    selector: 'app-signup-page',
    imports: [ CommonModule, FormField, RouterLink ],
    templateUrl: './signup-page.component.html',
    styleUrl: './signup-page.component.scss'
})
export class SignupPageComponent implements OnInit {
    private readonly auth = inject(UserAuthService);
    private readonly notifications = inject(NotificationService);
    private readonly router = inject(Router);

    readonly isSubmitting = signal(false);
    readonly errorMessage = signal('');
    private googleInitialized = false;

    readonly signupModel = signal<SignupForm>({
        name: '',
        email: '',
        password: ''
    });

    readonly signupForm = form(this.signupModel, (p) => {
        required(p.name, { message: 'Name is required' });
        minLength(p.name, 2, { message: 'Name must be at least 2 characters' });
        required(p.email, { message: 'Email is required' });
        email(p.email, { message: 'Enter a valid email address' });
        required(p.password, { message: 'Password is required' });
        minLength(p.password, 8, { message: 'Password must be at least 8 characters' });
    });

    readonly isFormValid = computed(() =>
        this.signupForm.name().valid() && this.signupForm.email().valid() && this.signupForm.password().valid()
    );

    ngOnInit(): void {
        this.initializeGoogleIdentity();
    }

    onSubmit(event: Event): void {
        event.preventDefault();
        submit(this.signupForm, async () => {
            this.errorMessage.set('');
            this.isSubmitting.set(true);
            try {
                await firstValueFrom(this.auth.signup(this.signupModel()));
                this.notifications.success('Account created successfully.');
                this.router.navigateByUrl('/tasks');
            } catch (error) {
                if (error instanceof HttpErrorResponse) {
                    this.errorMessage.set(error.error?.message ?? 'Unable to create account right now.');
                }
            } finally {
                this.isSubmitting.set(false);
            }
        });
    }

    signupWithSso(provider: 'google' | 'github' | 'microsoft'): void {
        if (provider === 'google') {
            this.signupWithGoogle();
        } else if (provider === 'github') {
            this.signupWithGithub();
        } else {
            this.auth.startSso(provider, '/tasks');
        }
    }

    signupWithGithub() {
        window.location.href = 'https://github.com/login/oauth/authorize' +
            `?client_id=${GITHUB_CLIENT_ID}` +
            `&redirect_uri=${BACKEND_URL}/api/auth/github/callback` +
            `&scope=user:email`;
    }

    private signupWithGoogle(): void {
        this.isSubmitting.set(true);

        const google = this.getGoogleIdentityServices();

        if (!this.googleInitialized || !google?.accounts?.id) {
            this.errorMessage.set('Google SDK not loaded');
            this.isSubmitting.set(false);
            return;
        }

        google.accounts.id.prompt();
    }

    private handleGoogleResponse(response: GoogleCredentialResponse): void {
        console.log('Google callback:', response);

        if (!response?.credential) {
            this.errorMessage.set('Google did not return an ID token.');
            this.isSubmitting.set(false);
            return;
        }

        this.auth.googleSignUpOrLogin(response.credential).subscribe({
            next: () => {
                this.notifications.success('Signup successful');
                this.isSubmitting.set(false);
                this.router.navigateByUrl('/tasks');
            },
            error: (err) => {
                this.isSubmitting.set(false);
                this.errorMessage.set(err.error?.message || 'Google login failed');
            }
        });
    }

    private getGoogleClientId(): string {
        // return `${GOOGLE_CLIENT_ID}.apps.googleusercontent.com`;
        return `${GOOGLE_CLIENT_ID}`;
    }

    private initializeGoogleIdentity(): void {
        if (this.googleInitialized) {
            return;
        }

        const google = this.getGoogleIdentityServices();

        if (!google?.accounts?.id) {
            this.errorMessage.set('Google SDK not loaded');
            return;
        }

        google.accounts.id.initialize({
            client_id: this.getGoogleClientId(),
            callback: (response: GoogleCredentialResponse) => this.handleGoogleResponse(response)
        });

        this.googleInitialized = true;
    }

    private getGoogleIdentityServices(): GoogleIdentityServices | undefined {
        return (window as Window & { google?: GoogleIdentityServices }).google;
    }
}
