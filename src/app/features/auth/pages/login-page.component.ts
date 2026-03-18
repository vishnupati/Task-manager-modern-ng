import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { NotificationService } from '../../../core/services/notification.service';
import { UserAuthService } from '../../../core/services/user-auth.service';

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

    submit(): void {
        this.errorMessage.set('');
        if (!this.isFormValid()) {
            this.loginForm.email().markAsTouched();
            this.loginForm.password().markAsTouched();
            return;
        }

        this.isSubmitting.set(true);
        this.auth.login(this.loginModel()).subscribe({
            next: () => {
                this.notifications.success('Welcome back.');
                this.isSubmitting.set(false);
                this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('redirectTo') ?? '/tasks');
            },
            error: (error: HttpErrorResponse) => {
                this.isSubmitting.set(false);
                this.errorMessage.set(error.error?.message ?? 'Unable to login. Please try again.');
            }
        });
    }

    loginWithSso(provider: 'google' | 'github' | 'microsoft'): void {
        this.auth.startSso(provider, this.route.snapshot.queryParamMap.get('redirectTo') ?? '/tasks');
    }
}
