import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { NotificationService } from '../../../core/services/notification.service';
import { UserAuthService } from '../../../core/services/user-auth.service';

@Component({
    selector: 'app-sso-callback-page',
    templateUrl: './sso-callback-page.component.html',
    styleUrl: './sso-callback-page.component.scss'
})
export class SsoCallbackPageComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly notifications = inject(NotificationService);
    private readonly auth = inject(UserAuthService);

    readonly message = signal('Completing single sign-on...');

    constructor() {
        const params = new URLSearchParams();
        this.route.snapshot.queryParamMap.keys.forEach((key) => {
            const value = this.route.snapshot.queryParamMap.get(key);
            if (value !== null) {
                params.set(key, value);
            }
        });

        this.auth.handleSsoCallback(params).subscribe((isSuccess) => {
            if (isSuccess) {
                this.notifications.success('Signed in successfully.');
                const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') ?? '/tasks';
                this.router.navigateByUrl(redirectTo);
                return;
            }

            this.message.set('We could not complete SSO. Please try again.');
            this.notifications.error('SSO sign-in failed.');
            this.router.navigate([ '/login' ], {
                queryParams: {
                    error: 'sso_failed'
                }
            });
        });
    }
}
