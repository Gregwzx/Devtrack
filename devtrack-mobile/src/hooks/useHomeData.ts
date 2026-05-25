// src/hooks/useHomeData.ts
// Lógica de dados da HomeScreen extraída do componente.
// Estratégia offline-first:
//  1. Lê do SQLite imediatamente (sem loading spinner)
//  2. Busca do Spring Boot em background quando online
//  3. Salva no SQLite após cada resposta da API
//  4. Operações offline ficam na fila e sincronizam ao reconectar

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNetworkStatus } from './useNetworkStatus';
import {
    kvGet, kvSet, kvGetJson, kvSetJson,
    enqueuePendingOp, getPendingOps, deletePendingOp,
} from '../services/localDb';
import { api } from '../services/api';
import { saveTokens, getAccessToken, getRefreshToken, getStoredUser } from '../services/api';
import { todayKey, yesterdayKey } from '../../utils/dateHelpers';
import type { StudyArea } from '../services/ai.service';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Learning {
    id: string;
    text: string;
    date: string;
    area?: string;
    type?: string;
    stacks?: string[];
}

export interface StreakData {
    count: number;
    lastDate: string | null;
}

// ─── Chaves de cache ──────────────────────────────────────────────────────────
function cacheKey(userId: string, suffix: string) {
    return `user_${userId}_${suffix}`;
}

// ─── API types ────────────────────────────────────────────────────────────────
interface ApiLearning {
    id: string;
    text: string;
    area: string | null;
    type: string | null;
    stacks: string[];
    createdAt: string;
}

interface ApiUser {
    id: string;
    name: string;
    email: string;
    studyArea: string;
    streak: number;
    streakLastDate: string | null;
}

// ─── Hook principal ───────────────────────────────────────────────────────────
export function useHomeData() {
    const { user } = useAuth();
    const { isOnline } = useNetworkStatus();

    const [streak, setStreak] = useState(0);
    const [learnings, setLearnings] = useState<Learning[]>([]);
    const [studyArea, setStudyArea] = useState<StudyArea>('fullstack');
    const [xp, setXp] = useState(0);
    const [sessionHours, setSessionHours] = useState(0);
    const [syncing, setSyncing] = useState(false);

    const uid = user?.id ?? '';
    const wasOffline = useRef(!isOnline);

    // ── Chaves de cache ────────────────────────────────────────────────────────
    const keys = uid ? {
        streak:    cacheKey(uid, 'streak'),
        learnings: cacheKey(uid, 'learnings'),
        area:      cacheKey(uid, 'area'),
        xp:        cacheKey(uid, 'xp'),
        session:   cacheKey(uid, 'session_start'),
    } : null;

    // ── Carrega cache SQLite imediatamente (síncrono) ─────────────────────────
    async function loadFromCache() {
        if (!keys) return;

        const streakData = await kvGetJson<StreakData>(keys.streak);
        if (streakData) setStreak(streakData.count);

        const cachedLearnings = await kvGetJson<Learning[]>(keys.learnings);
        if (cachedLearnings) setLearnings(cachedLearnings);

        const area = await kvGet(keys.area) as StudyArea | null;
        if (area) setStudyArea(area);

        const cachedXp = await kvGet(keys.xp);
        if (cachedXp) setXp(Number(cachedXp));

        // horas de sessão
        const sessionStart = await kvGet(keys.session);
        if (!sessionStart) {
            await kvSet(keys.session, Date.now().toString());
        } else {
            const elapsed = (Date.now() - Number(sessionStart)) / 3_600_000;
            setSessionHours(Math.round(elapsed * 10) / 10);
        }
    }

    // ── Sincroniza com Spring Boot em background ──────────────────────────────
    const syncFromApi = useCallback(async () => {
        if (!keys || !uid) return;
        setSyncing(true);
        try {
            // Busca learnings e perfil em paralelo
            const [learningsPage, apiUser] = await Promise.all([
                api.get<{ content: ApiLearning[]; totalElements: number }>(
                    '/api/v1/learnings?size=100'
                ),
                api.get<ApiUser>('/api/v1/users/me'),
            ]);

            const mapped: Learning[] = learningsPage.content.map(l => ({
                id:    l.id,
                text:  l.text,
                date:  l.createdAt,
                area:  l.area ?? undefined,
                type:  l.type ?? undefined,
                stacks:l.stacks,
            }));
            setLearnings(mapped);
            await kvSetJson(keys.learnings, mapped);

            // Streak e área do perfil
            const newStreak: StreakData = {
                count:    apiUser.streak ?? 0,
                lastDate: apiUser.streakLastDate ?? null,
            };
            setStreak(newStreak.count);
            await kvSetJson(keys.streak, newStreak);

            if (apiUser.studyArea) {
                setStudyArea(apiUser.studyArea as StudyArea);
                await kvSet(keys.area, apiUser.studyArea);
            }

            // Atualiza o usuário armazenado com streak atual
            const stored = await getStoredUser();
            if (stored) {
                const access  = await getAccessToken() ?? '';
                const refresh = await getRefreshToken() ?? '';
                await saveTokens(access, refresh, { ...stored, streak: newStreak.count });
            }
        } catch (err) {
            console.warn('[useHomeData] Erro ao sincronizar com API:', err);
        } finally {
            setSyncing(false);
        }
    }, [uid, keys]);

    // ── Processa fila de operações pendentes ──────────────────────────────────
    const flushPendingOps = useCallback(async () => {
        if (!uid) return;
        const ops = await getPendingOps();
        if (ops.length === 0) return;

        console.log(`[useHomeData] Sincronizando ${ops.length} operação(ões) pendente(s)...`);

        for (const op of ops) {
            try {
                if (op.type === 'ADD_LEARNING') {
                    const { text, area, type, stacks } = op.payload as any;
                    await api.post('/api/v1/learnings', { text, area, type, stacks });
                } else if (op.type === 'DELETE_LEARNING') {
                    await api.delete(`/api/v1/learnings/${op.payload.id}`);
                }
                await deletePendingOp(op.id);
            } catch (err) {
                console.warn(`[useHomeData] Falha ao processar op ${op.type}:`, err);
                // não remove da fila — tenta de novo na próxima reconexão
            }
        }

        // após sync da fila, busca estado atualizado da API
        await syncFromApi();
    }, [uid, syncFromApi]);

    // ── Calcula streak local ──────────────────────────────────────────────────
    async function checkLocalStreak(): Promise<StreakData> {
        if (!keys) return { count: 0, lastDate: null };

        const today     = todayKey();
        const yesterday = yesterdayKey();
        const cached    = await kvGetJson<StreakData>(keys.streak) ?? { count: 0, lastDate: null };

        if (cached.lastDate === today) return cached;

        const newCount = cached.lastDate === yesterday ? cached.count + 1 : 1;
        const updated: StreakData = { count: newCount, lastDate: today };
        await kvSetJson(keys.streak, updated);
        setStreak(newCount);
        return updated;
    }

    // ── Adicionar learning ────────────────────────────────────────────────────
    async function handleAddLearning(text: string, meta?: any) {
        if (!keys) return;

        const newLearning: Learning = {
            id:     `local_${Date.now()}`,
            text,
            date:   new Date().toISOString(),
            area:   meta?.area,
            type:   meta?.type,
            stacks: meta?.stacks ?? [],
        };

        // Otimista: mostra na UI imediatamente
        const updated = [newLearning, ...learnings];
        setLearnings(updated);
        await kvSetJson(keys.learnings, updated);

        // XP local
        const newXp = xp + 10;
        setXp(newXp);
        await kvSet(keys.xp, String(newXp));

        if (meta?.area) {
            const areaMap: Record<string, StudyArea> = {
                frontend: 'frontend', backend: 'backend', mobile: 'frontend',
                devops: 'backend', fullstack: 'fullstack', security: 'backend',
            };
            const mapped = areaMap[meta.area] ?? 'fullstack';
            setStudyArea(mapped);
            await kvSet(keys.area, mapped);
        }

        // Sincroniza com Spring Boot
        if (isOnline) {
            try {
                await api.post('/api/v1/learnings', {
                    text,
                    area:   meta?.area,
                    type:   meta?.type,
                    stacks: meta?.stacks ?? [],
                });
                // Após salvar na API, re-busca para obter o ID real e o streak atualizado
                await syncFromApi();
            } catch {
                await enqueuePendingOp('ADD_LEARNING', {
                    text, area: meta?.area, type: meta?.type, stacks: meta?.stacks ?? [],
                });
            }
        } else {
            await enqueuePendingOp('ADD_LEARNING', {
                text, area: meta?.area, type: meta?.type, stacks: meta?.stacks ?? [],
            });
        }
    }

    // ── Deletar learning ──────────────────────────────────────────────────────
    async function handleDeleteLearning(id: string) {
        if (!keys) return;

        // Otimista: remove da UI imediatamente
        const updated = learnings.filter(l => l.id !== id);
        setLearnings(updated);
        await kvSetJson(keys.learnings, updated);

        if (isOnline) {
            try {
                if (!id.startsWith('local_')) {
                    await api.delete(`/api/v1/learnings/${id}`);
                }
            } catch {
                if (!id.startsWith('local_')) {
                    await enqueuePendingOp('DELETE_LEARNING', { id });
                }
            }
        } else {
            if (!id.startsWith('local_')) {
                await enqueuePendingOp('DELETE_LEARNING', { id });
            }
        }
    }

    // ── Effects ────────────────────────────────────────────────────────────────

    // 1. Ao montar: lê cache local imediatamente, depois busca da API
    useEffect(() => {
        if (!uid) return;
        loadFromCache().then(() => {
            checkLocalStreak();
            if (isOnline) {
                syncFromApi();
            }
        });
    }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps

    // 2. Ao reconectar: sincroniza operações pendentes
    useEffect(() => {
        if (isOnline && wasOffline.current && uid) {
            flushPendingOps();
        }
        wasOffline.current = !isOnline;
    }, [isOnline, uid, flushPendingOps]);

    return {
        streak,
        learnings,
        studyArea,
        xp,
        sessionHours,
        syncing,
        isOnline,
        handleAddLearning,
        handleDeleteLearning,
    };
}
