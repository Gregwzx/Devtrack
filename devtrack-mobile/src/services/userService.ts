// src/services/userService.ts
// Toda a comunicação com Firestore e AsyncStorage passa por aqui.
// A estratégia é sempre: tenta Firestore, se falhar usa cache local.
// Isso garante que o app funciona offline sem travar.

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
    createdAt?: any;  // serverTimestamp do Firestore — tipo any por conta do FieldValue
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

// ─── Chaves de storage com namespace por email ────────────────────────────────
// Cada conta tem suas próprias chaves no AsyncStorage — evita que dados de
// uma conta apareçam pra outra no mesmo dispositivo (ex: dois usuários no mesmo celular).
function key(email: string, suffix: string) {
    // sanitiza o email pra virar uma chave válida sem caracteres especiais
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
        session:   key(email, 'SESSION_START'),  // timestamp do início da sessão do dia
        cache:     key(email, 'USER_CACHE'),     // snapshot do Firestore pra uso offline
    };
}

// ─── Criar / atualizar perfil no Firestore ────────────────────────────────────
// Chamado logo após o cadastro. Se o documento já existir (ex: reinstalação
// do app), só atualiza a foto — não sobrescreve dados do usuário.
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
            studyArea:      'fullstack',  // padrão inicial — usuário pode mudar depois
            bannerColor:    '#1a1040',
            links:          [],
            createdAt:      serverTimestamp(),
            updatedAt:      serverTimestamp(),
        };
        await setDoc(ref, newUser);
        // salva no cache local também pra funcionar offline logo de cara
        if (firebaseUser.email) {
            const keys = getStorageKeys(firebaseUser.email);
            await AsyncStorage.setItem(keys.cache, JSON.stringify(newUser));
        }
    } else {
        // usuário já existe (reinstalação) — só atualiza a foto por segurança
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
// Tenta Firestore primeiro, cai pro cache se estiver offline.
// O cache é atualizado a cada leitura bem-sucedida do Firestore.
export async function getUserData(uid: string, email?: string): Promise<UserData | null> {
    try {
        const ref  = doc(db, 'users', uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const data = snap.data() as UserData;
            if (email) {
                // atualiza o cache enquanto tiver conexão
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
// Nota: upload de foto não está implementado (Firebase Storage é pago).
// Por enquanto a URI local fica salva diretamente — funciona, mas não persiste
// entre dispositivos. Fica pra uma versão futura quando tiver Storage configurado.
export async function saveProfile(
    uid: string,
    email: string,
    profile: Partial<UserData> & { localPhotoUri?: string },
): Promise<string | null> {
    const finalPhotoURL: string | null = profile.localPhotoUri ?? profile.photoURL ?? null;

    const payload: Partial<UserData> = {
        ...profile,
        photoURL: finalPhotoURL,
        updatedAt: serverTimestamp(),
    };
    delete (payload as any).localPhotoUri;  // não salva o campo extra no Firestore

    try {
        const ref = doc(db, 'users', uid);
        await updateDoc(ref, payload);
    } catch {
        console.warn('Erro ao salvar perfil no Firestore, mantendo local');
    }

    // sempre salva local, independente do Firestore funcionar ou não
    const keys = getStorageKeys(email);
    const raw  = await AsyncStorage.getItem(keys.profile);
    const local = raw ? JSON.parse(raw) : {};
    const updated = { ...local, ...payload, photoURL: finalPhotoURL };
    await AsyncStorage.setItem(keys.profile, JSON.stringify(updated));
    await AsyncStorage.setItem(keys.cache, JSON.stringify(updated));

    return finalPhotoURL;
}

// ─── Streak ───────────────────────────────────────────────────────────────────
// Salva em dois lugares ao mesmo tempo pra garantir consistência.
// O local é fonte de verdade no dia a dia; o Firestore é backup e ranking.
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

// ─── Aprendizados ─────────────────────────────────────────────────────────────
// Salva a lista inteira a cada mudança — simples e funciona bem na escala
// que o app está agora. Se a lista crescer muito, vai precisar de uma abordagem
// mais incremental (ex: subcoleção no Firestore).
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

// ─── Área de estudo ───────────────────────────────────────────────────────────
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
// Busca os top 50 por streak e deixa a chamada re-ordenar por learnings se precisar.
// Limit 50 é suficiente pra exibir um ranking motivador sem sobrecarregar a leitura.
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
                isYou:     data.uid === currentUid,  // destaca o usuário atual no ranking
            };
        });
        return users.sort((a, b) => b[sortBy] - a[sortBy]);
    } catch (err) {
        console.warn('Erro ao buscar ranking:', err);
        return [];
    }
}