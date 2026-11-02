import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AUTH_API_URL } from '../config/api.config';
import { NotificationService } from '../services/notification.service';
import { UserAuthService } from '../services/user-auth.service';

// 401 from these means "wrong credentials", not "session expired"; the page shows the error itself.
const CREDENTIAL_ENDPOINTS = [ '/login', '/signup', '/force-login', '/sso' ].map((path) => `${AUTH_API_URL}${path}`);

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
    const notifications = inject(NotificationService);
    const auth = inject(UserAuthService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                if (!CREDENTIAL_ENDPOINTS.includes(req.url)) {
                    // Unauthorized: clear session and redirect to login
                    auth.handleUnauthorized();
                }
                return throwError(() => error);
            }

            const message = error.error?.message ?? 'Request failed. Please try again.';
            notifications.error(message);
            return throwError(() => error);
        })
    );
};
