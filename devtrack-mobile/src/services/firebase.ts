import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyCbPgMnzkTU2Lq-DVD28fbNgcsBROYN9yo',
    authDomain: 'devtrack-1427e.firebaseapp.com',
    projectId: 'devtrack-1427e',
    storageBucket: 'devtrack-1427e.firebasestorage.app',
    messagingSenderId: '807055384521',
    appId: '1:807055384521:web:bab038f1794894da981218',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db   = getFirestore(app);
export default app;