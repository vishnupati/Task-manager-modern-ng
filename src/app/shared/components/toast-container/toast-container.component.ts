import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [ CommonModule ],
    templateUrl: './toast-container.component.html',
    styleUrl: './toast-container.component.scss'
})
export class ToastContainerComponent {
    readonly notifications = inject(NotificationService);
    readonly toasts = this.notifications.toasts;

    dismiss(id: number): void {
        this.notifications.dismiss(id);
    }
}
