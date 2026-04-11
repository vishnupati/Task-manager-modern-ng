import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { UserAuthService } from '../services/user-auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
    const auth = inject(UserAuthService);
    const token = auth.token();

    console.log('Auth interceptor - Request URL:', request.url, 'Token present:', !!token);

    if (!token || request.url.includes('/me')) {
        console.log('Skipping auth header for request:', request.url);
        return next(request);
    }

    console.log('Adding auth header to request:', request.url);
    const authorizedRequest = request.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    });

    return next(authorizedRequest);
};
