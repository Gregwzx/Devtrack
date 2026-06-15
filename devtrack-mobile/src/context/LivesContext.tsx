// src/context/LivesContext.tsx
// Contexto global para o sistema de vidas estilo Duolingo
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_LIVES = 5;
const REFILL_INTERVAL_MS = 30 * 60 * 1000; // 30 minutos em ms
const STORAGE_KEY = 'DEVTRACK_LIVES_V2';
const INFINITE_KEY = 'DEVTRACK_INFINITE_UNTIL';

interface LivesState {
  lives: number;
  lastRefillTime: number; // timestamp ms
}

interface LivesContextType {
  lives: number;
  maxLives: number;
  isInfinite: boolean;
  nextRefillIn: number; // segundos até próxima vida
  loseLife: () => boolean; // retorna false se não tem vidas
  restoreLife: () => void;
  activateInfinite: () => void;
  refillAll: () => void;
}

const LivesContext = createContext<LivesContextType>({
  lives: MAX_LIVES,
  maxLives: MAX_LIVES,
  isInfinite: false,
  nextRefillIn: 0,
  loseLife: () => true,
  restoreLife: () => { },
  activateInfinite: () => { },
  refillAll: () => { },
});

export function LivesProvider({ children }: { children: React.ReactNode }) {
  const [lives, setLives] = useState(MAX_LIVES);
  const [lastRefillTime, setLastRefillTime] = useState(Date.now());
  const [infiniteUntil, setInfiniteUntil] = useState(0);
  const [nextRefillIn, setNextRefillIn] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isInfinite = infiniteUntil > Date.now();

  // Carrega estado persistido ao montar — NÃO carrega infinito (session-only)
  useEffect(() => {
    const load = async () => {
      try {
        // Limpa qualquer sessão infinite travada de sessões anteriores
        await AsyncStorage.removeItem(INFINITE_KEY);
        const livesRaw = await AsyncStorage.getItem(STORAGE_KEY);
        const now = Date.now();

        if (livesRaw) {
          const state: LivesState = JSON.parse(livesRaw);
          const elapsed = now - state.lastRefillTime;
          const refillsEarned = Math.floor(elapsed / REFILL_INTERVAL_MS);
          const newLives = Math.min(MAX_LIVES, state.lives + refillsEarned);
          const newLastRefill = refillsEarned > 0
            ? state.lastRefillTime + refillsEarned * REFILL_INTERVAL_MS
            : state.lastRefillTime;

          setLives(newLives);
          setLastRefillTime(newLastRefill);

          if (newLives !== state.lives) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
              lives: newLives,
              lastRefillTime: newLastRefill,
            }));
          }
        }
      } catch (e) {
        console.warn('[LivesContext] Erro ao carregar vidas:', e);
      }
    };
    load();
  }, []);

  // Timer de recarga — atualiza a cada segundo
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastRefillTime;
      const remaining = REFILL_INTERVAL_MS - elapsed;

      if (remaining <= 0 && lives < MAX_LIVES) {
        const newLives = Math.min(MAX_LIVES, lives + 1);
        const newLastRefill = lastRefillTime + REFILL_INTERVAL_MS;
        setLives(newLives);
        setLastRefillTime(newLastRefill);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ lives: newLives, lastRefillTime: newLastRefill }));
        setNextRefillIn(REFILL_INTERVAL_MS / 1000);
      } else if (lives < MAX_LIVES) {
        setNextRefillIn(Math.ceil(remaining / 1000));
      } else {
        setNextRefillIn(0);
      }
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lives, lastRefillTime]);

  const persist = useCallback(async (newLives: number, newLastRefill: number) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      lives: newLives,
      lastRefillTime: newLastRefill,
    }));
  }, []);

  const loseLife = useCallback(() => {
    if (isInfinite) return true; // infinito: não perde vida
    if (lives <= 0) return false;
    const newLives = lives - 1;
    const newLastRefill = lives === MAX_LIVES ? Date.now() : lastRefillTime;
    setLives(newLives);
    setLastRefillTime(newLastRefill);
    persist(newLives, newLastRefill);
    return true;
  }, [lives, isInfinite, lastRefillTime, persist]);

  const restoreLife = useCallback(() => {
    const newLives = Math.min(MAX_LIVES, lives + 1);
    const newLastRefill = Date.now();
    setLives(newLives);
    setLastRefillTime(newLastRefill);
    persist(newLives, newLastRefill);
  }, [lives, persist]);

  const refillAll = useCallback(() => {
    setLives(MAX_LIVES);
    setLastRefillTime(Date.now());
    persist(MAX_LIVES, Date.now());
  }, [persist]);

  const activateInfinite = useCallback(async () => {
    // Apenas session-only — não persiste no AsyncStorage
    // (evita que a demo fique com vidas infinitas travadas por 24h)
    const until = Date.now() + 30 * 60 * 1000; // só 30 min de demonstração
    setInfiniteUntil(until);
    setLives(MAX_LIVES);
    persist(MAX_LIVES, Date.now());
  }, [persist]);

  return (
    <LivesContext.Provider value={{
      lives,
      maxLives: MAX_LIVES,
      isInfinite,
      nextRefillIn,
      loseLife,
      restoreLife,
      activateInfinite,
      refillAll,
    }}>
      {children}
    </LivesContext.Provider>
  );
}

export function useLives() {
  return useContext(LivesContext);
}
