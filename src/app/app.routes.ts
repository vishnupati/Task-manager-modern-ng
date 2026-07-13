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
        canActivate: [ authGuard ],
        loadComponent: () => import('./features/tasks/pages/task-page.component').then((m) => m.TaskPageComponent)
    },
    {
        path: 'task/new',
        canActivate: [ authGuard ],
        loadComponent: () => import('./features/tasks/components/task-form.component').then((m) => m.TaskFormComponent)
    },
    {
        path: 'task/:id',
        canActivate: [ authGuard ],
        loadComponent: () => import('./features/tasks/components/task-form.component').then((m) => m.TaskFormComponent)
    },
    {
        path: 'settings',
        canActivate: [ authGuard ],
        loadComponent: () =>
            import('./features/auth/pages/user-settings-page.component').then((m) => m.UserSettingsPageComponent)
    },
    {
        path: 'angular-apis-demo',
        loadComponent: () =>
            import('./features/demo/pages/angular-apis-demo.component').then((m) => m.AngularApisDemoComponent)
    },
    {
        path: 'component-decorator-demo',
        loadComponent: () =>
            import('./features/demo/pages/component-decorator-demo.component').then((m) => m.ComponentDecoratorDemoComponent)
    },
    {
        path: 'angular22-demo',
        loadComponent: () =>
            import('./features/demo/pages/angular22-demo.component').then((m) => m.Angular22DemoComponent)
    },
    {
        path: '**',
        redirectTo: 'tasks'
    }
];
