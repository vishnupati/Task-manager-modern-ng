import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AUTH_API_URL } from '../config/api.config';
import { LOCAL_STORAGE } from '../config/local-storage.token';
import { AuthUser } from '../models/auth-user.model';
import { UserAuthService } from './user-auth.service';

const cachedUser: AuthUser = { id: 'u1', name: 'Cached Name', email: 'u1@example.com', provider: 'local' };

const createStorage = (entries: Record<string, string>): Storage => {
    const data = new Map(Object.entries(entries));
    return {
        get length() {
            return data.size;
        },
        clear: () => data.clear(),
        getItem: (key) => data.get(key) ?? null,
        key: (index) => [ ...data.keys() ][index] ?? null,
        removeItem: (key) => void data.delete(key),
        setItem: (key, value) => void data.set(key, value)
    };
};

describe('UserAuthService', () => {
    let http: HttpTestingController;

    const setup = (entries: Record<string, string>) => {
        const storage = createStorage(entries);
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                { provide: LOCAL_STORAGE, useValue: storage }
            ]
        });
        http = TestBed.inject(HttpTestingController);
        return { auth: TestBed.inject(UserAuthService), storage };
    };

    afterEach(() => http.verify());

    it('authenticates from the cached session without waiting for /me, then refreshes the profile', async () => {
        const { auth, storage } = setup({ tm_access_token: 'token-1', tm_user: JSON.stringify(cachedUser) });

        await firstValueFrom(auth.initializeAuth());
        expect(auth.isAuthenticated()).toBe(true);
        expect(auth.user()?.name).toBe('Cached Name');

        http.expectOne(`${AUTH_API_URL}/me`).flush({ user: { ...cachedUser, name: 'Server Name' } });
        expect(auth.user()?.name).toBe('Server Name');
        expect(JSON.parse(storage.getItem('tm_user') ?? '{}').name).toBe('Server Name');
    });

    it('keeps the session when /me fails for a non-auth reason (e.g. backend waking up)', async () => {
        const { auth, storage } = setup({ tm_access_token: 'token-1', tm_user: JSON.stringify(cachedUser) });

        await firstValueFrom(auth.initializeAuth());
        http.expectOne(`${AUTH_API_URL}/me`).error(new ProgressEvent('error'), { status: 0 });

        expect(auth.isAuthenticated()).toBe(true);
        expect(storage.getItem('tm_access_token')).toBe('token-1');
    });

    it('resolves the profile before the first navigation when none is cached', async () => {
        const { auth } = setup({ tm_access_token: 'token-1' });

        const initialized = firstValueFrom(auth.initializeAuth());
        expect(auth.isAuthenticated()).toBe(false);

        http.expectOne(`${AUTH_API_URL}/me`).flush({ user: cachedUser });
        await initialized;
        expect(auth.isAuthenticated()).toBe(true);
    });

    it('signs in with the user from the login response, without an extra /me request', async () => {
        const { auth, storage } = setup({});

        const loggedIn = firstValueFrom(auth.login({ email: 'u1@example.com', password: 'secret123' }));
        http.expectOne(`${AUTH_API_URL}/login`).flush({ token: 'token-2', user: cachedUser });
        await loggedIn;

        http.expectNone(`${AUTH_API_URL}/me`);
        expect(auth.isAuthenticated()).toBe(true);
        expect(storage.getItem('tm_access_token')).toBe('token-2');
    });
});
