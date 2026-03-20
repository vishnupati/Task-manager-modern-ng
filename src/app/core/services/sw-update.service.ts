import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent, VersionEvent } from '@angular/service-worker';

import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class SwUpdateService {
    private readonly swUpdate = inject(SwUpdate);
    private readonly notifications = inject(NotificationService);

    initialize(): void {
        if (!this.swUpdate.isEnabled) {
            return;
        }

        this.swUpdate.versionUpdates.subscribe((event: VersionEvent) => {
            if (event.type !== 'VERSION_READY') {
                return;
            }

            this.handleVersionReady(event);
        });
    }

    private handleVersionReady(_: VersionReadyEvent): void {
        this.notifications.info('A new app version is available.');

        const shouldReload = window.confirm('A new version is available. Reload now?');
        if (!shouldReload) {
            return;
        }

        this.swUpdate.activateUpdate().then(() => {
            window.location.reload();
        });
    }
}
