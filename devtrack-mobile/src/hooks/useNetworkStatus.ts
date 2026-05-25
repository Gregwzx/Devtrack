// src/hooks/useNetworkStatus.ts
// Hook que monitora conectividade em tempo real.
// Usado para:
//  1. Exibir um banner "offline" na UI quando sem internet
//  2. Disparar sincronização pendente quando a internet voltar

import { useEffect, useState, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
    isConnected: boolean;
    isInternetReachable: boolean | null;
    /** true se há conectividade real (connected + internet reachable) */
    isOnline: boolean;
}

export function useNetworkStatus() {
    const [status, setStatus] = useState<NetworkStatus>({
        isConnected: true,
        isInternetReachable: true,
        isOnline: true,
    });

    useEffect(() => {
        // fetch estado inicial imediatamente
        NetInfo.fetch().then(updateStatus);

        // assina mudanças em tempo real
        const unsubscribe = NetInfo.addEventListener(updateStatus);
        return unsubscribe;
    }, []);

    function updateStatus(state: NetInfoState) {
        const isConnected = state.isConnected ?? false;
        const isInternetReachable = state.isInternetReachable;
        // considera "online" só quando ambos estão OK
        const isOnline = isConnected && (isInternetReachable !== false);
        setStatus({ isConnected, isInternetReachable, isOnline });
    }

    return status;
}
