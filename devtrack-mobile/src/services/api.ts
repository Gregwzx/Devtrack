// src/services/api.ts
// Cliente HTTP central para o Spring Boot backend.
// Gerencia JWT (salvo no SQLite), refresh automático e headers padrão.

import { kvGet, kvSet, kvDelete } from './localDb';

// ─── Configuração ─────────────────────────────────────────────────────────────
// Em dispositivo físico/Expo Go: use o IP da sua rede local (ex: 192.168.1.X)
// Em emulador Android: use 10.0.2.2
// Configure em devtrack-mobile/.env.local → EXPO_PUBLIC_API_URL
export const BASE_URL =
    (process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.1:8080').replace(/\/$/, '');

// ─── Chaves de armazenamento JWT ──────────────────────────────────────────────
const KEY_ACCESS  = 'jwt_access_token';
const KEY_REFRESH = 'jwt_refresh_token';
const KEY_USER    = 'auth_user';

// ─── Helpers de token ─────────────────────────────────────────────────────────
export async function getAccessToken(): Promise<string | null>  { return await kvGet(KEY_ACCESS); }
export async function getRefreshToken(): Promise<string | null> { return await kvGet(KEY_REFRESH); }
export async function getStoredUser(): Promise<Record<string, any> | null> {
    const raw = await kvGet(KEY_USER);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

export async function saveTokens(access: string, refresh: string, user: Record<string, any>): Promise<void> {
    await kvSet(KEY_ACCESS,  access);
    await kvSet(KEY_REFRESH, refresh);
    await kvSet(KEY_USER, JSON.stringify(user));
}

export async function clearTokens(): Promise<void> {
    await kvDelete(KEY_ACCESS);
    await kvDelete(KEY_REFRESH);
    await kvDelete(KEY_USER);
}

// ─── Erros tipados ────────────────────────────────────────────────────────────
export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

// ─── Requisição base ──────────────────────────────────────────────────────────
async function request<T>(
    path: string,
    options: RequestInit = {},
    requireAuth = true,
): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (requireAuth) {
        const token = await getAccessToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    // Tenta refresh se o token expirou (401)
    if (res.status === 401 && requireAuth) {
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
            try {
                const refreshRes = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Refresh-Token': refreshToken,
                    },
                });
                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    await saveTokens(data.accessToken, data.refreshToken, data.user);
                    // Retry com novo token
                    headers['Authorization'] = `Bearer ${data.accessToken}`;
                    const retry = await fetch(`${BASE_URL}${path}`, { ...options, headers });
                    if (!retry.ok) {
                        const errBody = await retry.json().catch(() => ({}));
                        throw new ApiError(retry.status, errBody.message ?? 'Erro na requisição');
                    }
                    return retry.json() as Promise<T>;
                }
            } catch (e) {
                if (e instanceof ApiError) throw e;
                // refresh falhou — sessão inválida, limpa tokens
                await clearTokens();
            }
        }
    }

    if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new ApiError(res.status, errBody.message ?? `Erro ${res.status}`);
    }

    // DELETE geralmente retorna 204 sem corpo
    if (res.status === 204) return undefined as unknown as T;

    return res.json() as Promise<T>;
}

// ─── Métodos públicos ─────────────────────────────────────────────────────────
export const api = {
    get:    <T>(path: string) => request<T>(path, { method: 'GET' }),
    post:   <T>(path: string, body: unknown) =>
                request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
    put:    <T>(path: string, body: unknown) =>
                request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

    // Sem autenticação — usado no login/register
    postPublic: <T>(path: string, body: unknown) =>
                request<T>(path, { method: 'POST', body: JSON.stringify(body) }, false),
};
