// src/services/firebase.ts
// ─────────────────────────────────────────────────────────────────────────────
// SETUP:
// 1. Acesse https://console.firebase.google.com
// 2. Crie um projeto (ex: "devtrack-app")
// 3. Adicione um app Web (ícone </>) — pegue o firebaseConfig abaixo
// 4. No console: Authentication → Sign-in method → ative "Google"
// 5. No console: Firestore Database → Criar banco (modo teste por ora)
// 6. Instale as dependências:
//    npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
//    npx expo install @react-native-google-signin/google-signin
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ⚠️ Substitua pelos seus valores do Firebase Console
const firebaseConfig = {
    apiKey: 'SUA_API_KEY',
    authDomain: 'SEU_PROJECT.firebaseapp.com',
    projectId: 'SEU_PROJECT_ID',
    storageBucket: 'SEU_PROJECT.appspot.com',
    messagingSenderId: 'SEU_SENDER_ID',
    appId: 'SEU_APP_ID',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;