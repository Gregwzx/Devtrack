// src/services/userService.ts
// Dados do usuário e aprendizados — Spring Boot + cache SQLite local.
// Estratégia: mostra SQLite imediatamente, sincroniza API em background.

import { api, saveTokens, getRefreshToken, getStoredUser, ApiError } from './api';
import { kvGet, kvSet, kvGetJson, kvSetJson } from './localDb';
import type { StudyArea } from './ai.service';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Learning {
    id: string;
    text: string;
    date: string; // ISO string
    area?: string;
    type?: string;
    stacks?: string[];
}

export interface SocialLink {
    id: string;
    label: string;
    url: string;
}

export interface UserData {
    uid: string;
    name: string;
    email: string;
    photoURL: string | null;
    bio: string;
    streak: number;
    lastStreakDate: string | null;
    learnings: Learning[];
    totalHours: number;
    skills: number;
    studyArea: StudyArea;
    bannerColor: string;
    links: SocialLink[];
}

export interface RankingUser {
    uid: string;
    name: string;
    username: string;
    streak: number;
    learnings: number;
    studyArea: StudyArea;
    isYou?: boolean;
}

// ─── Chaves de cache AsyncStorage (mantidas por compatibilidade com ProfileScreen) ──
function key(email: string, suffix: string) {
    const safe = email.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `DEVTRACK_${safe}_${suffix}`;
}

export function getStorageKeys(email: string) {
    return {
        profile:  key(email, 'PROFILE'),
        streak:   key(email, 'STREAK'),
        learnings:key(email, 'LEARNINGS'),
        stats:    key(email, 'STATS'),
        area:     key(email, 'STUDY_AREA'),
        session:  key(email, 'SESSION_START'),
        cache:    key(email, 'USER_CACHE'),
    };
}

// ─── API types ────────────────────────────────────────────────────────────────
interface ApiUser {
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

interface ApiLearning {
    id: string;
    text: string;
    area: string | null;
    type: string | null;
    stacks: string[];
    createdAt: string;
}

// ─── Buscar dados do usuário ──────────────────────────────────────────────────
export async function getUserData(uid: string, email?: string): Promise<UserData | null> {
    const cacheKey = email ? getStorageKeys(email).cache : `user_cache_${uid}`;

    try {
        const [apiUser, learningsPage] = await Promise.all([
            api.get<ApiUser>('/api/v1/users/me'),
            api.get<{ content: ApiLearning[] }>('/api/v1/learnings?size=100'),
        ]);

        const data = await mapApiUser(apiUser, email ?? apiUser.email);
        data.learnings = learningsPage.content.map(l => ({
            id:    l.id,
            text:  l.text,
            date:  l.createdAt,
            area:  l.area ?? undefined,
            type:  l.type ?? undefined,
            stacks:l.stacks,
        }));

        // Salva no cache
        await kvSetJson(cacheKey, data);
        if (email) {
            const keys = getStorageKeys(email);
            await kvSetJson(keys.cache, data);
        }
        return data;
    } catch {
        // Offline — usa cache
        const cached = await kvGetJson<UserData>(cacheKey);
        return cached;
    }
}

async function mapApiUser(u: ApiUser, email: string): Promise<UserData> {
    const keys = getStorageKeys(email);
    // Pega links do cache local (backend não armazena links por ora)
    const cached = await kvGetJson<UserData>(keys.cache);
    return {
        uid:           u.id,
        name:          u.name,
        email:         u.email,
        photoURL:      u.photoUrl,
        bio:           u.bio ?? '',
        streak:        u.streak ?? 0,
        lastStreakDate:u.streakLastDate,
        learnings:     [],
        totalHours:    0,
        skills:        0,
        studyArea:     (u.studyArea as StudyArea) ?? 'fullstack',
        bannerColor:   u.bannerColor ?? '#1a1040',
        links:         cached?.links ?? [],
    };
}

// ─── Salvar perfil ────────────────────────────────────────────────────────────
export async function saveProfile(
    uid: string,
    email: string,
    profile: Partial<UserData> & { localPhotoUri?: string },
): Promise<string | null> {
    const finalPhotoURL = profile.localPhotoUri ?? profile.photoURL ?? null;

    try {
        await api.put('/api/v1/users/me', {
            name:        profile.name,
            bio:         profile.bio,
            photoUrl:    finalPhotoURL,
            bannerColor: profile.bannerColor,
            studyArea:   profile.studyArea,
        });

        // Atualiza o usuário armazenado
        const stored = await getStoredUser();
        if (stored) {
            const updated = { ...stored, ...profile, photoUrl: finalPhotoURL };
            const refresh = await getRefreshToken() ?? '';
            await saveTokens('', refresh, updated);
        }
    } catch (e) {
        console.warn('[userService] Erro ao salvar perfil na API:', e);
    }

    // Cache local — salva links e outros dados que o backend não persiste
    const keys = getStorageKeys(email);
    const cachedRaw = await kvGetJson<UserData>(keys.cache) ?? {} as UserData;
    const updated: Partial<UserData> = {
        ...cachedRaw,
        ...profile,
        photoURL: finalPhotoURL ?? undefined,
    };
    await kvSetJson(keys.cache,   updated);
    await kvSetJson(keys.profile, updated);

    return finalPhotoURL;
}

// ─── Streak ───────────────────────────────────────────────────────────────────
// O streak é calculado automaticamente no backend ao registrar um learning.
// Este método atualiza apenas o cache local.
export async function saveStreak(
    uid: string,
    email: string,
    streak: number,
    lastDate: string,
): Promise<void> {
    const keys = getStorageKeys(email);
    await kvSetJson(keys.streak, { count: streak, lastDate });
}

// ─── Aprendizados ─────────────────────────────────────────────────────────────
export async function saveLearnings(
    uid: string,
    email: string,
    learnings: Learning[],
): Promise<void> {
    const keys = getStorageKeys(email);
    await kvSetJson(keys.learnings, learnings);
}

// ─── Área de estudo ───────────────────────────────────────────────────────────
export async function saveStudyArea(
    uid: string,
    email: string,
    area: StudyArea,
): Promise<void> {
    try {
        await api.put('/api/v1/users/me', { studyArea: area });
    } catch {
        console.warn('[userService] Erro ao salvar studyArea');
    }
    const keys = getStorageKeys(email);
    await kvSet(keys.area, area);
}

// ─── Ranking global ───────────────────────────────────────────────────────────
// Backend não tem endpoint de ranking ainda — retorna lista vazia por ora.
export async function getGlobalRanking(
    currentUid: string,
    sortBy: 'streak' | 'learnings' = 'streak',
): Promise<RankingUser[]> {
    return [];
}

// ─── Criar perfil ─────────────────────────────────────────────────────────────
// Compatibilidade com ProfileScreen — chamado após register, não é mais necessário
// pois o backend já cria o usuário, mas mantemos para evitar erros de importação.
export async function createOrUpdateUserProfile(user: any): Promise<void> {
    // No-op: o backend (AuthService.register) já cria o usuário no MySQL.
}