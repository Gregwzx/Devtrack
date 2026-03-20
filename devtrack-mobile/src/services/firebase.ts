// src/services/firebase.ts
// Inicialização do Firebase. O getApps().length === 0 garante que não
// inicializamos duas vezes — em dev com hot reload isso acontece e quebra tudo.

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Credenciais do projeto DevTrack no console.firebase.google.com
// Não é segredo colocar aqui — o Firebase tem suas próprias regras de segurança
// (Firestore Rules) que protegem os dados de verdade no backend.
const firebaseConfig = {
    apiKey: 'AIzaSyCbPgMnzkTU2Lq-DVD28fbNgcsBROYN9yo',
    authDomain: 'devtrack-1427e.firebaseapp.com',
    projectId: 'devtrack-1427e',
    storageBucket: 'devtrack-1427e.firebasestorage.app',
    messagingSenderId: '807055384521',
    appId: '1:807055384521:web:bab038f1794894da981218',
};

// singleton — reutiliza a instância se já existir (evita erro em hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db   = getFirestore(app);
export default app;