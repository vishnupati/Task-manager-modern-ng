import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { email, form, FormField, minLength, required, submit } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { NotificationService } from '../../../core/services/notification.service';
import { UserAuthService } from '../../../core/services/user-auth.service';
import { GITHUB_CLIENT_ID, GOOGLE_CLIENT_ID } from '../../../core/config/api.config';

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
export class SignupPageComponent {
    private readonly auth = inject(UserAuthService);
    private readonly notifications = inject(NotificationService);
    private readonly router = inject(Router);

    readonly isSubmitting = signal(false);
    readonly errorMessage = signal('');

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
            `&redirect_uri=http://localhost:9000/api/auth/github/callback` +
            `&scope=user:email`;
    }

    // private signupWithGoogle(): void {
    //     this.isSubmitting.set(true);

    //     if (!(window as any).google?.accounts?.oauth2) {
    //         this.errorMessage.set('Google SDK not loaded');
    //         this.isSubmitting.set(false);
    //         return;
    //     }

    //     (window as any).google.accounts.oauth2.initTokenClient({
    //         client_id: this.getGoogleClientId(),
    //         scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
    //         callback: (response: any) => this.handleGoogleResponse(response),
    //     }).requestAccessToken({ prompt: 'consent' });
    // }
    private signupWithGoogle(): void {
        this.isSubmitting.set(true);

        const google = (window as any).google;

        if (!google?.accounts?.id) {
            this.errorMessage.set('Google SDK not loaded');
            this.isSubmitting.set(false);
            return;
        }

        google.accounts.id.initialize({
            client_id: this.getGoogleClientId(),
            callback: (response: any, error: Error) => this.handleGoogleResponse(response, error),
        });

        google.accounts.id.prompt(); // opens Google popup
    }

    // private handleGoogleResponse(response: any): void {
    //     if (!response.access_token) {
    //         this.errorMessage.set('Failed to get Google authorization');
    //         this.isSubmitting.set(false);
    //         return;
    //     }

    //     this.auth.googleSignUpOrLogin(response.access_token, true).subscribe({
    //         next: () => {
    //             this.notifications.success('Account created successfully with Google.');
    //             this.isSubmitting.set(false);
    //             this.router.navigateByUrl('/tasks');
    //         },
    //         error: (error: HttpErrorResponse) => {
    //             this.isSubmitting.set(false);
    //             this.errorMessage.set(error.error?.message ?? 'Google sign-up failed. Please try again.');
    //         }
    //     });
    // }

    private handleGoogleResponse(response: any, error: Error): void {
        if (error) {
            this.errorMessage.set('Failed to get Google authorization');
            this.isSubmitting.set(false);
            return;
        }

        const idToken = response.credential;
        console.log('Received Google ID token:', idToken);

        this.auth.googleSignUpOrLogin(idToken, true).subscribe({
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
}
