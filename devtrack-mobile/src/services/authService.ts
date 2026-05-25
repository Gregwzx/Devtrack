// src/services/authService.ts
// Autenticação via Spring Boot — sem Firebase, sem Supabase.
// JWT salvo no SQLite via api.ts (saveTokens / clearTokens).

import { api, saveTokens, clearTokens, getStoredUser, ApiError } from './api';
import { initDb } from './localDb';

// Inicializa o banco de dados local (tabelas) em background
initDb().catch(console.error);

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AuthUser {
    id: string;
    name: string;
    email: string;
    photoUrl: string | null;
    bio: string | null;
    studyArea: string;
    bannerColor: string | null;
    streak: number;
    streakLastDate: string | null;
}

interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
}

// ─── Callbacks de mudança de sessão ──────────────────────────────────────────
type AuthCallback = (user: AuthUser | null) => void;
const listeners: Set<AuthCallback> = new Set();

function notifyListeners(user: AuthUser | null) {
    listeners.forEach(cb => cb(user));
}

// ─── Cadastro ─────────────────────────────────────────────────────────────────
export async function signUpWithEmail(
    name: string,
    email: string,
    password: string,
): Promise<AuthUser> {
    const data = await api.postPublic<AuthResponse>('/api/v1/auth/register', {
        name, email, password,
    });
    await saveTokens(data.accessToken, data.refreshToken, data.user);
    notifyListeners(data.user);
    return data.user;
}

// ─── Login ────────────────────────────────────────────────────────────────────
export async function signInWithEmail(
    email: string,
    password: string,
): Promise<AuthUser> {
    const data = await api.postPublic<AuthResponse>('/api/v1/auth/login', {
        email, password,
    });
    await saveTokens(data.accessToken, data.refreshToken, data.user);
    notifyListeners(data.user);
    return data.user;
}

// ─── Visitante (Offline) ──────────────────────────────────────────────────────
export async function signInAsGuest(): Promise<AuthUser> {
    const guestUser: AuthUser = {
        id: 'guest_local',
        name: 'Visitante',
        email: 'guest@devtrack.local',
        photoUrl: null,
        bio: 'Usando o DevTrack no modo offline.',
        studyArea: 'fullstack',
        bannerColor: '#8b5cf6',
        streak: 0,
        streakLastDate: null
    };
    await saveTokens('guest_access', 'guest_refresh', guestUser);
    notifyListeners(guestUser);
    return guestUser;
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function signOutUser(): Promise<void> {
    await clearTokens();
    notifyListeners(null);
}

// ─── Listener de sessão (substitui onAuthStateChanged do Firebase/Supabase) ──
// Lê a sessão salva localmente e dispara o callback imediatamente.
// Retorna uma função de cleanup (para usar no useEffect).
export function onAuthChanged(callback: AuthCallback): () => void {
    listeners.add(callback);
    // Dispara imediatamente com o estado atual
    getStoredUser().then((stored) => callback(stored as AuthUser | null));
    return () => listeners.delete(callback);
}

// ─── Usuário atual ────────────────────────────────────────────────────────────
export async function getCurrentUser(): Promise<AuthUser | null> {
    return (await getStoredUser()) as AuthUser | null;
}

// ─── Erro amigável ────────────────────────────────────────────────────────────
export function getApiError(err: unknown): string {
    if (err instanceof ApiError) {
        const msg = err.message.toLowerCase();
        if (msg.includes('já cadastrado') || msg.includes('already')) return 'Este e-mail já está cadastrado.';
        if (msg.includes('senha') || msg.includes('password')) return 'Senha incorreta.';
        if (msg.includes('não encontrado') || msg.includes('credencial')) return 'E-mail ou senha incorretos.';
        if (err.status === 401) return 'E-mail ou senha incorretos.';
        if (err.status === 409) return 'Este e-mail já está cadastrado.';
        return err.message || 'Ocorreu um erro. Tente novamente.';
    }
    const msg = (err as any)?.message?.toLowerCase() ?? '';
    if (msg.includes('network') || msg.includes('fetch')) return 'Sem conexão com o servidor. Verifique se o backend está rodando.';
    return 'Ocorreu um erro. Tente novamente.';
}