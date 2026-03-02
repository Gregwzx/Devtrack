// src/services/authService.ts
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    User,
} from 'firebase/auth';
import { auth } from './firebase';
import { createOrUpdateUserProfile } from './userService';

export async function signUpWithEmail(
    name: string,
    email: string,
    password: string
): Promise<User | null> {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        await createOrUpdateUserProfile(result.user);
        return result.user;
    } catch (error: any) {
        console.error('ERRO CADASTRO - code:', error.code, '| message:', error.message);
        throw error;
    }
}

export async function signInWithEmail(
    email: string,
    password: string
): Promise<User | null> {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error: any) {
        console.error('ERRO LOGIN - code:', error.code, '| message:', error.message);
        throw error;
    }
}

export async function signOutUser(): Promise<void> {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

export function onAuthChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
    return auth.currentUser;
}