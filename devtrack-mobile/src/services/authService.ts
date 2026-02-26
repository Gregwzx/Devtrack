// src/services/authService.ts
import {
    GoogleAuthProvider,
    signInWithCredential,
    signOut,
    onAuthStateChanged,
    User,
} from 'firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { auth } from './firebase';
import { createOrUpdateUserProfile } from './userService';

// ⚠️ Coloque aqui o Web Client ID do seu projeto Firebase
// Firebase Console → Authentication → Sign-in method → Google → Web client ID
GoogleSignin.configure({
    webClientId: 'SEU_WEB_CLIENT_ID.apps.googleusercontent.com',
});

// ─── Login com Google ─────────────────────────────────────────────────────────
export async function signInWithGoogle(): Promise<User | null> {
    try {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        const { idToken } = await GoogleSignin.getTokens();

        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);

        // Cria/atualiza o perfil no Firestore
        await createOrUpdateUserProfile(result.user);

        return result.user;
    } catch (error: any) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            console.log('Login cancelado pelo usuário');
        } else if (error.code === statusCodes.IN_PROGRESS) {
            console.log('Login já em andamento');
        } else {
            console.error('Erro no login com Google:', error);
        }
        return null;
    }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function signOutUser(): Promise<void> {
    try {
        await GoogleSignin.signOut();
        await signOut(auth);
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// ─── Observer de autenticação ─────────────────────────────────────────────────
export function onAuthChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
    return auth.currentUser;
}