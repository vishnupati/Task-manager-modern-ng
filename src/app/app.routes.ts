import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'tasks'
    },
    {
        path: 'login',
        canActivate: [ guestGuard ],
        loadComponent: () => import('./features/auth/pages/login-page.component').then((m) => m.LoginPageComponent)
    },
    {
        path: 'signup',
        canActivate: [ guestGuard ],
        loadComponent: () => import('./features/auth/pages/signup-page.component').then((m) => m.SignupPageComponent)
    },
    {
        path: 'auth/callback',
        loadComponent: () =>
            import('./features/auth/pages/sso-callback-page.component').then((m) => m.SsoCallbackPageComponent)
    },
    {
        path: 'tasks',
        // canActivate: [ authGuard ],
        loadComponent: () => import('./features/tasks/pages/task-page.component').then((m) => m.TaskPageComponent)
    },
    {
        path: 'settings',
        // canActivate: [ authGuard ],
        loadComponent: () =>
            import('./features/auth/pages/user-settings-page.component').then((m) => m.UserSettingsPageComponent)
    },
    {
        path: '**',
        redirectTo: 'tasks'
    }
];
