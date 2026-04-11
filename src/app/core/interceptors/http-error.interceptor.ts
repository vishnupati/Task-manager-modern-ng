import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { NotificationService } from '../services/notification.service';
import { UserAuthService } from '../services/user-auth.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
    const notifications = inject(NotificationService);
    const auth = inject(UserAuthService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // Unauthorized: clear session and redirect to login
                auth.handleUnauthorized();
                return throwError(() => error);
            }

            const message = error.error?.message ?? 'Request failed. Please try again.';
            notifications.error(message);
            return throwError(() => error);
        })
    );
};
