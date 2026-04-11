import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { UserAuthService } from '../services/user-auth.service';

export const authGuard: CanActivateFn = async (_, state) => {
    const auth = inject(UserAuthService);
        const router = inject(Router);

    if (auth.isAuthenticated()) {
        return true;
    }

    return router.createUrlTree([ '/login' ], {
        queryParams: { redirectTo: state.url }
    });
};

export const guestGuard: CanActivateFn = async () => {
    const auth = inject(UserAuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
        return true;
    }

    return router.createUrlTree([ '/tasks' ]);
};


// import { inject } from '@angular/core';
// import { CanActivateFn, Router } from '@angular/router';
// import { lastValueFrom } from 'rxjs';

// import { UserAuthService } from '../services/user-auth.service';

// export const authGuard: CanActivateFn = async (_, state) => {
//     const auth = inject(UserAuthService);

//     try {
//         const user = await lastValueFrom(auth.getMe());
//         return !!user;
//     } catch {
//         const router = inject(Router);
//         return router.createUrlTree([ '/login' ], { queryParams: { redirectTo: state.url } });
//     }
// };

// export const guestGuard: CanActivateFn = () => {
//     const auth = inject(UserAuthService);
//     const router = inject(Router);

//     if (!auth.isAuthenticated()) {
//         return true;
//     }

//     return router.createUrlTree([ '/tasks' ]);
// };