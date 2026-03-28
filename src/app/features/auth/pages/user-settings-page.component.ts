import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { form, FormField, minLength, required, submit } from '@angular/forms/signals';

import { NotificationService } from '../../../core/services/notification.service';
import { UserAuthService } from '../../../core/services/user-auth.service';

interface SettingsForm {
    name: string;
    email: string;
}

@Component({
    selector: 'app-user-settings-page',
    imports: [ CommonModule, FormField ],
    templateUrl: './user-settings-page.component.html',
    styleUrl: './user-settings-page.component.scss'
})
export class UserSettingsPageComponent {
    private readonly auth = inject(UserAuthService);
    private readonly notifications = inject(NotificationService);

    readonly currentUser = this.auth.user;
    readonly isSaving = signal(false);

    readonly settingsModel = signal<SettingsForm>({
        name: '',
        email: ''
    });

    readonly settingsForm = form(this.settingsModel, (p) => {
        required(p.name, { message: 'Name is required' });
        minLength(p.name, 2, { message: 'Name must be at least 2 characters' });
        required(p.email, { message: 'Email is required' });
    });

    readonly isFormValid = computed(() => this.settingsForm.name().valid() && this.settingsForm.email().valid());

    readonly canSave = computed(() => this.settingsForm().valid() && !this.isSaving());

    constructor() {
        effect(() => {
            const user = this.currentUser();
            if (!user) {
                this.settingsModel.set({ name: '', email: '' });
                return;
            }

            this.settingsModel.set({
                name: user.name,
                email: user.email
            });
        });
    }

    onSave(event: Event): void {
        event.preventDefault();
        submit(this.settingsForm, async () => {
            this.isSaving.set(true);
            try {
                this.auth.updateLocalProfile({ name: this.settingsModel().name });
                this.notifications.success('Profile updated.');
            } finally {
                this.isSaving.set(false);
            }
        });
    }
}
