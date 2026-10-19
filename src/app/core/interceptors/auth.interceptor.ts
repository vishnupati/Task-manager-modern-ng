import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_BASE_URL } from '../config/api.config';
import { UserAuthService } from '../services/user-auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
    const token = inject(UserAuthService).token();

    // Never send the token to third-party hosts. It is sent on every API call (including /me)
    // because cross-site auth cookies are blocked by Safari/Firefox and can't be relied on.
    if (!token || !request.url.startsWith(API_BASE_URL)) {
        return next(request);
    }

    return next(request.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    }));
};
