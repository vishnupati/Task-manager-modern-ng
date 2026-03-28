import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { NotificationService } from '../../../core/services/notification.service';
import { UserAuthService } from '../../../core/services/user-auth.service';
import { GOOGLE_CLIENT_ID } from '../../../core/config/api.config';

interface LoginForm {
    email: string;
    password: string;
}

@Component({
    selector: 'app-login-page',
    imports: [ CommonModule, FormField, RouterLink ],
    templateUrl: './login-page.component.html',
    styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
    private readonly auth = inject(UserAuthService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly notifications = inject(NotificationService);

    readonly isSubmitting = signal(false);
    readonly errorMessage = signal('');

    readonly loginModel = signal<LoginForm>({
        email: '',
        password: ''
    });

    readonly loginForm = form(this.loginModel, (p) => {
        required(p.email, { message: 'Email is required' });
        email(p.email, { message: 'Enter a valid email address' });
        required(p.password, { message: 'Password is required' });
    });

    readonly isFormValid = computed(() => this.loginForm.email().valid() && this.loginForm.password().valid());

    onSubmit(event: Event): void {
        event.preventDefault();
        submit(this.loginForm, async () => {
            this.errorMessage.set('');
            this.isSubmitting.set(true);
            try {
                await firstValueFrom(this.auth.login(this.loginModel()));
                this.notifications.success('Welcome back.');
                this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('redirectTo') ?? '/tasks');
            } catch (error) {
                if (error instanceof HttpErrorResponse) {
                    this.errorMessage.set(error.error?.message ?? 'Unable to login. Please try again.');
                }
            } finally {
                this.isSubmitting.set(false);
            }
        });
    }

    loginWithSso(provider: 'google' | 'github' | 'microsoft'): void {
        if (provider === 'google') {
            this.loginWithGoogle();
        } else {
            console.log(`Initiating SSO login with provider: ${provider}`);
            this.auth.startSso(provider, this.route.snapshot.queryParamMap.get('redirectTo') ?? '/tasks');
        }
    }

    private loginWithGoogle(): void {
        this.isSubmitting.set(true);

        const google = (window as any).google;

        if (!google?.accounts?.id) {
            this.errorMessage.set('Google SDK not loaded');
            this.isSubmitting.set(false);
            return;
        }

        console.log("NEW GOOGLE FLOW RUNNING ✅");

        google.accounts.id.initialize({
            client_id: this.getGoogleClientId(),
            callback: (response: any, error: Error) => this.handleGoogleResponse(response, error),
        });

        google.accounts.id.prompt();
    }

    private handleGoogleResponse(response: any, error: Error): void {
        if (error) {
            this.errorMessage.set('Failed to get Google authorization');
            this.isSubmitting.set(false);
            return;
        }

        this.auth.googleSignUpOrLogin(response.access_token, false).subscribe({
            next: () => {
                this.notifications.success('Welcome back.');
                this.isSubmitting.set(false);
                this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('redirectTo') ?? '/tasks');
            },
            error: (error: HttpErrorResponse) => {
                this.isSubmitting.set(false);
                this.errorMessage.set(error.error?.message ?? 'Google login failed. Please try again.');
            }
        });
    }

    private getGoogleClientId(): string {
        return GOOGLE_CLIENT_ID;
    }
}
