// src/context/PlanContext.tsx
// Gerencia o plano do usuário: Starter (free) ou Pro (premium)
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Plan = 'starter' | 'pro';

interface PlanContextType {
  plan: Plan;
  isPro: boolean;
  activatePro: () => void;
  deactivatePro: () => void;
}

const PlanContext = createContext<PlanContextType>({
  plan: 'starter',
  isPro: false,
  activatePro: () => {},
  deactivatePro: () => {},
});

const PLAN_KEY = 'DEVTRACK_PLAN_V1';

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<Plan>('starter');

  useEffect(() => {
    AsyncStorage.getItem(PLAN_KEY).then(v => {
      if (v === 'pro') setPlan('pro');
    });
  }, []);

  const activatePro = useCallback(() => {
    setPlan('pro');
    AsyncStorage.setItem(PLAN_KEY, 'pro');
  }, []);

  const deactivatePro = useCallback(() => {
    setPlan('starter');
    AsyncStorage.setItem(PLAN_KEY, 'starter');
  }, []);

  return (
    <PlanContext.Provider value={{ plan, isPro: plan === 'pro', activatePro, deactivatePro }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() { return useContext(PlanContext); }
