// src/services/authService.ts
// Camada fina sobre o Firebase Auth. Centralizar aqui facilita trocar
// de provider no futuro sem tocar nas telas.

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

// Cadastro: cria o usuário no Auth, define o displayName e já cria o documento
// no Firestore em sequência — tudo numa tacada só.
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
        // Logar o code aqui facilita muito debugar erros específicos do Firebase
        console.error('ERRO CADASTRO - code:', error.code, '| message:', error.message);
        throw error;  // re-throw pra a tela de login mostrar a mensagem adequada
    }
}

// Login padrão. Se der erro, o código do Firebase é bem específico
// (veja getFirebaseError em LoginScreen.tsx).
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

// Retorna a função de unsubscribe — importante chamar no cleanup do useEffect
export function onAuthChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}

// Útil pra pegar o usuário de forma síncrona fora de componentes React
export function getCurrentUser(): User | null {
    return auth.currentUser;
}