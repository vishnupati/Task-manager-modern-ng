import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';

import { AUTH_API_URL, SSO_CALLBACK_PATH } from '../config/api.config';
import { LOCAL_STORAGE } from '../config/local-storage.token';
import { AuthResponse, AuthUser, LoginPayload, SignupPayload, SsoProvider } from '../models/auth-user.model';

const TOKEN_STORAGE_KEY = 'tm_access_token';
const USER_STORAGE_KEY = 'tm_user';

@Injectable({ providedIn: 'root' })
export class UserAuthService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);
    private readonly storage = inject(LOCAL_STORAGE);

    readonly token = signal<string | null>(this.restoreToken());
    readonly user = signal<AuthUser | null>(this.restoreUser());
    readonly isAuthenticated = computed(() => Boolean(this.token() && this.user()));

    signup(payload: SignupPayload): Observable<AuthUser> {
        return this.http.post<AuthResponse>(`${AUTH_API_URL}/signup`, payload).pipe(
            tap((response) => this.persistSession(response)),
            map((response) => response.user)
        );
    }

    login(payload: LoginPayload): Observable<AuthUser> {
        return this.http.post<AuthResponse>(`${AUTH_API_URL}/login`, payload).pipe(
            tap((response) => this.persistSession(response)),
            map((response) => response.user)
        );
    }

    logout(): Observable<void> {
        const token = this.token();
        if (!token) {
            // If no token, just clear session and navigate
            this.clearSession();
            this.router.navigate([ '/login' ]);
            return of(void 0);
        }

        return this.http.post<void>(`${AUTH_API_URL}/logout`, { refresh_token: token }).pipe(
            tap(() => {
                this.clearSession();
                this.router.navigate([ '/login' ]);
            }),
            catchError(() => {
                // Even if the API call fails, clear the local session
                this.clearSession();
                this.router.navigate([ '/login' ]);
                return of(void 0);
            })
        );
    }

    updateLocalProfile(patch: Partial<Pick<AuthUser, 'name' | 'avatarUrl'>>): void {
        const user = this.user();
        if (!user) {
            return;
        }

        const nextUser: AuthUser = {
            ...user,
            ...patch
        };

        this.user.set(nextUser);
        this.storage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    }

    startSso(provider: SsoProvider, redirectTo?: string): void {
        console.log(`Starting SSO login with provider: ${provider}, redirectTo: ${redirectTo}`);
        const callbackUrl = new URL(SSO_CALLBACK_PATH, window.location.origin);
        if (redirectTo) {
            callbackUrl.searchParams.set('redirectTo', redirectTo);
        }

        const ssoUrl = new URL(`${AUTH_API_URL}/sso/${provider}`);
        ssoUrl.searchParams.set('redirectUri', callbackUrl.toString());
        window.location.assign(ssoUrl.toString());
    }

    handleSsoCallback(params: URLSearchParams): Observable<boolean> {
        const token = params.get('access_token');
        if (token) {
            const user = this.extractUserFromParams(params);
            if (!user) {
                return of(false);
            }

            this.persistSession({ token, user });
            return of(true);
        }

        const idToken = params.get('idToken');
        if (idToken) {
            return this.http
                .post<AuthResponse>(`${AUTH_API_URL}/sso/verify`, {
                    idToken
                })
                .pipe(
                    tap((response) => this.persistSession(response)),
                    map(() => true),
                    catchError(() => of(false))
                );
        }

        const code = params.get('code');
        if (!code) {
            return of(false);
        }

        return this.http
            .post<AuthResponse>(`${AUTH_API_URL}/sso/exchange`, {
                code,
                redirectUri: new URL(SSO_CALLBACK_PATH, window.location.origin).toString()
            })
            .pipe(
                tap((response) => this.persistSession(response)),
                map(() => true),
                catchError(() => of(false))
            );
    }

    private persistSession(payload: AuthResponse): void {
        this.token.set(payload.token);
        this.user.set(payload.user);

        this.storage.setItem(TOKEN_STORAGE_KEY, payload.token);
        this.storage.setItem(USER_STORAGE_KEY, JSON.stringify(payload.user));
    }

    googleSignUpOrLogin(idToken: string, isSignup: boolean = false): Observable<AuthUser> {
        return this.http.get<AuthResponse>(`${AUTH_API_URL}/sso/google`, {
            params: { idToken }
        }).pipe(
            tap((response) => this.persistSession(response)),
            map((response) => response.user)
        );
    }

    private clearSession(): void {
        this.token.set(null);
        this.user.set(null);

        this.storage.removeItem(TOKEN_STORAGE_KEY);
        this.storage.removeItem(USER_STORAGE_KEY);
    }

    private restoreToken(): string | null {
        return this.storage.getItem(TOKEN_STORAGE_KEY);
    }

    private restoreUser(): AuthUser | null {
        const raw = this.storage.getItem(USER_STORAGE_KEY);
        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw) as AuthUser;
        } catch {
            return null;
        }
    }

    private extractUserFromParams(params: URLSearchParams): AuthUser | null {
        const serializedUser = params.get('user');
        if (serializedUser) {
            try {
                return JSON.parse(serializedUser) as AuthUser;
            } catch {
                return null;
            }
        }

        const id = params.get('id');
        const email = params.get('email');
        const name = params.get('name');
        const provider = params.get('provider') as AuthUser[ 'provider' ] | null;

        if (!id || !email || !name || !provider) {
            return null;
        }

        return {
            id,
            email,
            name,
            provider,
            avatarUrl: params.get('avatarUrl') ?? undefined
        };
    }
}
