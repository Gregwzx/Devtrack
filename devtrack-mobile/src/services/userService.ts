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

// ─── Chaves com namespace por email ───────────────────────────────────────────
// Isso garante que cada conta tem dados isolados no dispositivo.
function key(email: string, suffix: string) {
    // sanitiza o email para usar como chave
    const safe = email.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `DEVTRACK_${safe}_${suffix}`;
}

export function getStorageKeys(email: string) {
    return {
        profile:   key(email, 'PROFILE'),
        streak:    key(email, 'STREAK'),
        learnings: key(email, 'LEARNINGS'),
        stats:     key(email, 'STATS'),
        area:      key(email, 'STUDY_AREA'),
        session:   key(email, 'SESSION_START'),
        cache:     key(email, 'USER_CACHE'),
    };
}


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
        if (firebaseUser.email) {
            const keys = getStorageKeys(firebaseUser.email);
            await AsyncStorage.setItem(keys.cache, JSON.stringify(newUser));
        }
    } else {
        await updateDoc(ref, {
            photoURL:  firebaseUser.photoURL,
            updatedAt: serverTimestamp(),
        });
        if (firebaseUser.email) {
            const keys = getStorageKeys(firebaseUser.email);
            await AsyncStorage.setItem(keys.cache, JSON.stringify(snap.data()));
        }
    }
}

// ─── Busca dados do usuário ───────────────────────────────────────────────────
export async function getUserData(uid: string, email?: string): Promise<UserData | null> {
    try {
        const ref  = doc(db, 'users', uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const data = snap.data() as UserData;
            if (email) {
                const keys = getStorageKeys(email);
                await AsyncStorage.setItem(keys.cache, JSON.stringify(data));
            }
            return data;
        }
        return null;
    } catch {
        console.warn('Firestore offline, usando cache local');
        if (email) {
            const keys = getStorageKeys(email);
            const raw  = await AsyncStorage.getItem(keys.cache);
            return raw ? JSON.parse(raw) : null;
        }
        return null;
    }
}

// ─── Salva perfil completo ────────────────────────────────────────────────────
export async function saveProfile(
    uid: string,
    email: string,
    profile: Partial<UserData> & { localPhotoUri?: string },
): Promise<string | null> {
    // Foto salva como URI local (sem upload — Storage não disponível no plano gratuito)
    const finalPhotoURL: string | null = profile.localPhotoUri ?? profile.photoURL ?? null;

    const payload: Partial<UserData> = {
        ...profile,
        photoURL: finalPhotoURL,
        updatedAt: serverTimestamp(),
    };
    delete (payload as any).localPhotoUri;

    // Salva no Firestore
    try {
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, payload);
    } catch {
        console.warn('Erro ao salvar perfil no Firestore, mantendo local');
    }

    // Salva localmente com chave baseada no email
    const keys = getStorageKeys(email);
    const raw  = await AsyncStorage.getItem(keys.profile);
    const local = raw ? JSON.parse(raw) : {};
    const updated = { ...local, ...payload, photoURL: finalPhotoURL };
    await AsyncStorage.setItem(keys.profile, JSON.stringify(updated));
    await AsyncStorage.setItem(keys.cache, JSON.stringify(updated));

    return finalPhotoURL;
}

// ─── Salva streak ─────────────────────────────────────────────────────────────
export async function saveStreak(
    uid: string,
    email: string,
    streak: number,
    lastDate: string,
): Promise<void> {
    try {
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, { streak, lastStreakDate: lastDate, updatedAt: serverTimestamp() });
    } catch {
        console.warn('Erro ao salvar streak no Firestore');
    }
    const keys = getStorageKeys(email);
    await AsyncStorage.setItem(keys.streak, JSON.stringify({ count: streak, lastDate }));
}

// ─── Salva aprendizados ───────────────────────────────────────────────────────
export async function saveLearnings(
    uid: string,
    email: string,
    learnings: Learning[],
): Promise<void> {
    try {
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, { learnings, updatedAt: serverTimestamp() });
    } catch {
        console.warn('Erro ao salvar learnings no Firestore');
    }
    const keys = getStorageKeys(email);
    await AsyncStorage.setItem(keys.learnings, JSON.stringify(learnings));
}

// ─── Salva área de estudo ─────────────────────────────────────────────────────
export async function saveStudyArea(
    uid: string,
    email: string,
    area: StudyArea,
): Promise<void> {
    try {
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, { studyArea: area, updatedAt: serverTimestamp() });
    } catch {
        console.warn('Erro ao salvar studyArea no Firestore');
    }
    const keys = getStorageKeys(email);
    await AsyncStorage.setItem(keys.area, area);
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
                uid:       data.uid,
                name:      data.name,
                username:  data.username,
                streak:    data.streak ?? 0,
                learnings: data.learnings?.length ?? 0,
                studyArea: data.studyArea ?? 'fullstack',
                isYou:     data.uid === currentUid,
            };
        });
        return users.sort((a, b) => b[sortBy] - a[sortBy]);
    } catch (err) {
        console.warn('Erro ao buscar ranking:', err);
        return [];
    }
}