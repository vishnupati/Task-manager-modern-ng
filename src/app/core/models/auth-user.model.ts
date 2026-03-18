export type SsoProvider = 'google' | 'github' | 'microsoft';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    provider: 'local' | SsoProvider;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface SignupPayload {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: AuthUser;
}
