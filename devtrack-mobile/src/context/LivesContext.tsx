// src/context/LivesContext.tsx
// Sistema de vidas estilo Duolingo — reescrito do zero com useRef para evitar stale closures
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_LIVES = 5;
const REFILL_MS = 30 * 60 * 1000; // 30 min
const KEY = 'DEVTRACK_LIVES_V3';

interface LivesContextType {
  lives: number;
  maxLives: number;
  isInfinite: boolean;
  nextRefillIn: number;
  loseLife: () => boolean;   // true = ok ainda tem vida | false = sem vidas
  activateInfinite: () => void;
  refillAll: () => void;
}

const Ctx = createContext<LivesContextType>({
  lives: MAX_LIVES, maxLives: MAX_LIVES, isInfinite: false,
  nextRefillIn: 0, loseLife: () => true, activateInfinite: () => {}, refillAll: () => {},
});

export function LivesProvider({ children }: { children: React.ReactNode }) {
  const [lives, setLives]           = useState(MAX_LIVES);
  const [lastRefill, setLastRefill] = useState(Date.now());
  const [infinite, setInfinite]     = useState(false);
  const [tick, setTick]             = useState(0);

  // refs para que os callbacks sempre leiam o valor mais recente sem precisar de deps
  const livesRef      = useRef(MAX_LIVES);
  const lastRefillRef = useRef(Date.now());
  const infiniteRef   = useRef(false);

  // mantém refs sincronizadas com o state
  useEffect(() => { livesRef.current      = lives;    }, [lives]);
  useEffect(() => { lastRefillRef.current = lastRefill; }, [lastRefill]);
  useEffect(() => { infiniteRef.current   = infinite;  }, [infinite]);

  // ─── Carrega do AsyncStorage na montagem ──────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (!raw) return;
        const saved = JSON.parse(raw) as { lives: number; lastRefill: number };
        const now = Date.now();
        const elapsed = now - saved.lastRefill;
        const earned  = Math.floor(elapsed / REFILL_MS);
        const newLives = Math.min(MAX_LIVES, saved.lives + earned);
        const newRefill = earned > 0
          ? saved.lastRefill + earned * REFILL_MS
          : saved.lastRefill;
        livesRef.current      = newLives;
        lastRefillRef.current = newRefill;
        setLives(newLives);
        setLastRefill(newRefill);
      } catch {}
    })();
  }, []);

  // ─── Timer a cada segundo ─────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const now     = Date.now();
      const elapsed = now - lastRefillRef.current;

      if (elapsed >= REFILL_MS && livesRef.current < MAX_LIVES) {
        const newLives   = Math.min(MAX_LIVES, livesRef.current + 1);
        const newRefill  = lastRefillRef.current + REFILL_MS;
        livesRef.current      = newLives;
        lastRefillRef.current = newRefill;
        setLives(newLives);
        setLastRefill(newRefill);
        AsyncStorage.setItem(KEY, JSON.stringify({ lives: newLives, lastRefill: newRefill }));
      }
      setTick(t => t + 1); // força re-render para atualizar nextRefillIn
    }, 1000);
    return () => clearInterval(id);
  }, []); // sem deps — usa refs

  // ─── Ações ────────────────────────────────────────────────────────────────
  const loseLife = useCallback((): boolean => {
    if (infiniteRef.current) return true;
    const current = livesRef.current;
    if (current <= 0) return false;           // já estava sem vida
    const newLives  = current - 1;
    const newRefill = current === MAX_LIVES ? Date.now() : lastRefillRef.current;
    livesRef.current      = newLives;
    lastRefillRef.current = newRefill;
    setLives(newLives);
    setLastRefill(newRefill);
    AsyncStorage.setItem(KEY, JSON.stringify({ lives: newLives, lastRefill: newRefill }));
    return newLives > 0;                       // true = ainda tem vida
  }, []);

  const refillAll = useCallback(() => {
    const now = Date.now();
    livesRef.current      = MAX_LIVES;
    lastRefillRef.current = now;
    setLives(MAX_LIVES);
    setLastRefill(now);
    AsyncStorage.setItem(KEY, JSON.stringify({ lives: MAX_LIVES, lastRefill: now }));
  }, []);

  const activateInfinite = useCallback(() => {
    infiniteRef.current = true;
    setInfinite(true);
    refillAll();
  }, [refillAll]);

  // ─── Derivados ────────────────────────────────────────────────────────────
  const remaining     = REFILL_MS - (Date.now() - lastRefillRef.current);
  const nextRefillIn  = lives < MAX_LIVES ? Math.max(0, Math.ceil(remaining / 1000)) : 0;

  return (
    <Ctx.Provider value={{ lives, maxLives: MAX_LIVES, isInfinite: infinite, nextRefillIn, loseLife, activateInfinite, refillAll }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLives() { return useContext(Ctx); }
