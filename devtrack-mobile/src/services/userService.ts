// src/services/userService.ts
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';

// ─── Types ────────────────────────────────────────────────────────────────────
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
    createdAt?: any;
    updatedAt?: any;
}

export interface Learning {
    id: string;
    text: string;
    date: string;
}

// ─── AsyncStorage keys (cache local) ─────────────────────────────────────────
const CACHE_KEY = 'DEVTRACK_USER_CACHE';

// ─── Criar / Atualizar perfil no Firestore ────────────────────────────────────
export async function createOrUpdateUserProfile(firebaseUser: User): Promise<void> {
    const ref = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        // Primeira vez — cria o documento
        const newUser: UserData = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName ?? 'Dev',
            username: `@${(firebaseUser.displayName ?? 'dev').toLowerCase().replace(/\s/g, '')}`,
            email: firebaseUser.email ?? '',
            photoURL: firebaseUser.photoURL,
            bio: '',
            streak: 0,
            lastStreakDate: null,
            learnings: [],
            totalHours: 0,
            skills: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        await setDoc(ref, newUser);
        await cacheLocally(newUser);
    } else {
        // Já existe — só atualiza updatedAt e foto
        await updateDoc(ref, {
            photoURL: firebaseUser.photoURL,
            updatedAt: serverTimestamp(),
        });
        const data = snap.data() as UserData;
        await cacheLocally(data);
    }
}

// ─── Busca dados do usuário ───────────────────────────────────────────────────
export async function getUserData(uid: string): Promise<UserData | null> {
    try {
        const ref = doc(db, 'users', uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const data = snap.data() as UserData;
            await cacheLocally(data);
            return data;
        }
        return null;
    } catch (error) {
        // Se offline, retorna cache
        console.warn('Firestore offline, usando cache local');
        return getLocalCache();
    }
}

// ─── Salva streak ─────────────────────────────────────────────────────────────
export async function saveStreak(uid: string, streak: number, lastDate: string): Promise<void> {
    try {
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, { streak, lastStreakDate: lastDate, updatedAt: serverTimestamp() });
    } catch (error) {
        console.warn('Erro ao salvar streak no Firestore, mantendo local');
    }
    // Sempre salva local também
    await AsyncStorage.setItem('DEVTRACK_STREAK', JSON.stringify({ count: streak, lastDate }));
}

// ─── Salva aprendizados ───────────────────────────────────────────────────────
export async function saveLearnings(uid: string, learnings: Learning[]): Promise<void> {
    try {
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, { learnings, updatedAt: serverTimestamp() });
    } catch (error) {
        console.warn('Erro ao salvar learnings no Firestore, mantendo local');
    }
    await AsyncStorage.setItem('DEVTRACK_LEARNINGS', JSON.stringify(learnings));
}

// ─── Salva perfil ─────────────────────────────────────────────────────────────
export async function saveProfile(uid: string, profile: Partial<UserData>): Promise<void> {
    try {
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, { ...profile, updatedAt: serverTimestamp() });
    } catch (error) {
        console.warn('Erro ao salvar perfil no Firestore, mantendo local');
    }
    await AsyncStorage.setItem('DEVTRACK_PROFILE', JSON.stringify(profile));
}

// ─── Cache local helpers ──────────────────────────────────────────────────────
async function cacheLocally(data: UserData): Promise<void> {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

async function getLocalCache(): Promise<UserData | null> {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
}