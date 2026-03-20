import { InjectionToken } from '@angular/core';

export const LOCAL_STORAGE = new InjectionToken<Storage>('localStorage', {
    providedIn: 'root',
    factory: () => window.localStorage
});
