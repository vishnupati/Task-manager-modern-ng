import { Injectable, signal } from '@angular/core';

type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private toastId = 0;
    readonly toasts = signal<ToastMessage[]>([]);

    show(message: string, type: ToastType = 'info', timeoutMs = 3000): void {
        const id = ++this.toastId;
        this.toasts.update((items) => [ ...items, { id, message, type } ]);

        window.setTimeout(() => this.dismiss(id), timeoutMs);
    }

    success(message: string): void {
        this.show(message, 'success');
    }

    error(message: string): void {
        this.show(message, 'error', 4000);
    }

    info(message: string): void {
        this.show(message, 'info');
    }

    dismiss(id: number): void {
        this.toasts.update((items) => items.filter((item) => item.id !== id));
    }
}
