import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { UserAuthService } from '../services/user-auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
    const auth = inject(UserAuthService);
    const token = auth.token();

    if (!token) {
        return next(request);
    }

    const authorizedRequest = request.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    });

    return next(authorizedRequest);
};
