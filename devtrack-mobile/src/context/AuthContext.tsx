// src/context/AuthContext.tsx
// Contexto de autenticação — envolve o app inteiro e expõe
// o usuário atual + o estado de loading pra qualquer tela que precisar.
// Simples de propósito: não tem lógica pesada aqui, só observa o Firebase.

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChanged } from '../services/authService';

interface AuthContextType {
    user: User | null;
    loading: boolean;  // true enquanto o Firebase ainda não respondeu na abertura do app
}

// valor padrão do contexto — loading: true evita flash de conteúdo autenticado
// antes de saber se o usuário realmente está logado
const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // onAuthStateChanged retorna um unsubscribe — chamamos ele no cleanup
        // pra não vazar listener quando o componente desmontar (não costuma acontecer
        // aqui, mas é boa prática manter)
        const unsubscribe = onAuthChanged((firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// hook de conveniência — em vez de useContext(AuthContext) em todo componente
export function useAuth() {
    return useContext(AuthContext);
}