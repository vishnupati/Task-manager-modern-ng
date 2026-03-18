import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

import { NotificationService } from '../../../core/services/notification.service';
import { UserAuthService } from '../../../core/services/user-auth.service';

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

    submit(): void {
        this.errorMessage.set('');
        if (!this.isFormValid()) {
            this.signupForm.name().markAsTouched();
            this.signupForm.email().markAsTouched();
            this.signupForm.password().markAsTouched();
            return;
        }

        this.isSubmitting.set(true);
        this.auth.signup(this.signupModel()).subscribe({
            next: () => {
                this.notifications.success('Account created successfully.');
                this.isSubmitting.set(false);
                this.router.navigateByUrl('/tasks');
            },
            error: (error: HttpErrorResponse) => {
                this.isSubmitting.set(false);
                this.errorMessage.set(error.error?.message ?? 'Unable to create account right now.');
            }
        });
    }

    signupWithSso(provider: 'google' | 'github' | 'microsoft'): void {
        this.auth.startSso(provider, '/tasks');
    }
}
