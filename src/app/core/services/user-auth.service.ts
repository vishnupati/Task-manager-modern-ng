import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';

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
    readonly user = signal<AuthUser | null>(null);

    private getCookie(name: string): string | null {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
        return null;
    }
    readonly isAuthenticated = computed(() => Boolean(this.token() && this.user()));

    signup(payload: SignupPayload): Observable<void> {
        return this.http.post<{ token: string }>(`${AUTH_API_URL}/signup`, payload, { withCredentials: true }).pipe(
            tap((response) => this.persistSession(response)),
            switchMap(() => this.getMe()),
            tap(user => {
                this.user.set(user);
            }),
            map(() => void 0)
        );
    }

    login(payload: LoginPayload): Observable<void> {
        return this.http.post<{ token: string }>(`${AUTH_API_URL}/login`, payload, { withCredentials: true }).pipe(
            tap((response) => this.persistSession(response)),
            switchMap(() => this.getMe()),
            tap(user => {
                this.user.set(user);
            }),
            map(() => void 0)
        );
    }

    logout(): Observable<void> {
        return this.http.post<void>(`${AUTH_API_URL}/logout`, {}, { withCredentials: true }).pipe(
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

    handleUnauthorized(): void {
        this.clearSession();
        this.router.navigate([ '/login' ]);
    }

    getMe(): Observable<AuthUser> {
        return this.http.get<AuthUser>(`${AUTH_API_URL}/me`, { withCredentials: true });
    }

    initializeAuth(): Observable<void> {
        const token = this.token();
        console.log('Initializing auth, found token:', token);
        if (token) {
            console.log('Token exists, fetching user from /me API');
            return this.getMe().pipe(
                tap(user => {
                    this.user.set(user);
                    // this.storage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
                    console.log('User fetched from /me and cached:', user);
                }),
                map(() => void 0),
                catchError(err => {
                    console.error('Failed to fetch user from /me:', err);
                    console.log('Token is invalid or expired, clearing session');
                    this.clearSession();
                    return of(void 0);
                })
            );
        }
        console.log('No token found, skipping auth initialization');
        return of(void 0);
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
            this.user.set(user);
            return of(true);
        }

        const idToken = params.get('idToken');
        if (idToken) {
            return this.http
                .post<AuthResponse>(`${AUTH_API_URL}/sso/verify`, {
                    idToken
                }, { withCredentials: true })
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
            }, { withCredentials: true })
            .pipe(
                tap((response) => this.persistSession(response)),
                map(() => true),
                catchError(() => of(false))
            );
    }

    private persistSession(payload: { token: string; user?: AuthUser }): void {
        this.token.set(payload.token);
        if (payload.user) {
            this.user.set(payload.user);
        }

        this.storage.setItem(TOKEN_STORAGE_KEY, payload.token);
        // if (payload.user) {
        //     this.storage.setItem(USER_STORAGE_KEY, JSON.stringify(payload.user));
        // }
    }

    googleSignUpOrLogin(idToken: string, isSignup: boolean = false): Observable<void> {
        return this.http.get<AuthResponse>(`${AUTH_API_URL}/sso/google`, {
            params: { idToken },
            withCredentials: true
        }).pipe(
            tap((response) => {
                this.persistSession(response);
                if (response.user) {
                    this.user.set(response.user);
                    this.storage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
                }
            }),
            map(() => void 0)
        );
    }

    private clearSession(): void {
        this.token.set(null);
        this.user.set(null);

        this.storage.removeItem(TOKEN_STORAGE_KEY);
        // this.storage.removeItem(USER_STORAGE_KEY);
    }

    private restoreToken(): string | null {
        const token = this.storage.getItem(TOKEN_STORAGE_KEY);
        console.log('Restoring token from localStorage:', token);
        return token;
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
