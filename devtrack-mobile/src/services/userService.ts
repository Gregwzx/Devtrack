// src/services/userService.ts
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    collection,
    query,
    orderBy,
    limit,
    getDocs,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';
import type { StudyArea } from './ai.service';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Learning {
    id: string;
    text: string;
    date: string;
}

export interface SocialLink {
    id: string;
    label: string;
    url: string;
}

export interface UserData {
    uid: string;
    name: string;
    username: string;
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
    createdAt?: any;
    updatedAt?: any;
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

// ─── Cache ────────────────────────────────────────────────────────────────────
const CACHE_KEY = 'DEVTRACK_USER_CACHE';

// ─── Criar / Atualizar perfil no Firestore ────────────────────────────────────
export async function createOrUpdateUserProfile(firebaseUser: User): Promise<void> {
    const ref  = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        const newUser: UserData = {
            uid:            firebaseUser.uid,
            name:           firebaseUser.displayName ?? 'Dev',
            username:       `@${(firebaseUser.displayName ?? 'dev').toLowerCase().replace(/\s/g, '')}`,
            email:          firebaseUser.email ?? '',
            photoURL:       firebaseUser.photoURL,
            bio:            '',
            streak:         0,
            lastStreakDate: null,
            learnings:      [],
            totalHours:     0,
            skills:         0,
            studyArea:      'fullstack',
            bannerColor:    '#1a1040',
            links:          [],
            createdAt:      serverTimestamp(),
            updatedAt:      serverTimestamp(),
        };
        await setDoc(ref, newUser);
        await cacheLocally(newUser);
    } else {
        await updateDoc(ref, {
            photoURL:  firebaseUser.photoURL,
            updatedAt: serverTimestamp(),
        });
        await cacheLocally(snap.data() as UserData);
    }
}

// ─── Busca dados do usuário ───────────────────────────────────────────────────
export async function getUserData(uid: string): Promise<UserData | null> {
    try {
        const ref  = doc(db, 'users', uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const data = snap.data() as UserData;
            await cacheLocally(data);
            return data;
        }
        return null;
    } catch {
        console.warn('Firestore offline, usando cache local');
        return getLocalCache();
    }
}

// ─── Salva perfil completo ────────────────────────────────────────────────────
export async function saveProfile(uid: string, profile: Partial<UserData>): Promise<void> {
    try {
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, { ...profile, updatedAt: serverTimestamp() });
    } catch {
        console.warn('Erro ao salvar perfil no Firestore, mantendo local');
    }
    // Always persist locally too
    const raw   = await AsyncStorage.getItem(CACHE_KEY);
    const local = raw ? JSON.parse(raw) : {};
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ ...local, ...profile }));
    await AsyncStorage.setItem('DEVTRACK_PROFILE', JSON.stringify(profile));
}

// ─── Salva streak ─────────────────────────────────────────────────────────────
export async function saveStreak(uid: string, streak: number, lastDate: string): Promise<void> {
    try {
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, { streak, lastStreakDate: lastDate, updatedAt: serverTimestamp() });
    } catch {
        console.warn('Erro ao salvar streak no Firestore');
    }
    await AsyncStorage.setItem('DEVTRACK_STREAK', JSON.stringify({ count: streak, lastDate }));
}

// ─── Salva aprendizados ───────────────────────────────────────────────────────
export async function saveLearnings(uid: string, learnings: Learning[]): Promise<void> {
    try {
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, { learnings, updatedAt: serverTimestamp() });
    } catch {
        console.warn('Erro ao salvar learnings no Firestore');
    }
    await AsyncStorage.setItem('DEVTRACK_LEARNINGS', JSON.stringify(learnings));
}

// ─── Salva área de estudo ─────────────────────────────────────────────────────
export async function saveStudyArea(uid: string, area: StudyArea): Promise<void> {
    try {
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, { studyArea: area, updatedAt: serverTimestamp() });
    } catch {
        console.warn('Erro ao salvar studyArea no Firestore');
    }
    await AsyncStorage.setItem('DEVTRACK_STUDY_AREA', area);
}

// ─── Ranking global ───────────────────────────────────────────────────────────
export async function getGlobalRanking(
    currentUid: string,
    sortBy: 'streak' | 'learnings' = 'streak',
): Promise<RankingUser[]> {
    try {
        const q    = query(collection(db, 'users'), orderBy('streak', 'desc'), limit(50));
        const snap = await getDocs(q);
        const users: RankingUser[] = snap.docs.map(d => {
            const data = d.data() as UserData;
            return {
                uid:        data.uid,
                name:       data.name,
                username:   data.username,
                streak:     data.streak ?? 0,
                learnings:  data.learnings?.length ?? 0,
                studyArea:  data.studyArea ?? 'fullstack',
                isYou:      data.uid === currentUid,
            };
        });
        return users.sort((a, b) => b[sortBy] - a[sortBy]);
    } catch (err) {
        console.warn('Erro ao buscar ranking:', err);
        return [];
    }
}

// ─── Cache helpers ────────────────────────────────────────────────────────────
async function cacheLocally(data: UserData): Promise<void> {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

async function getLocalCache(): Promise<UserData | null> {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
}