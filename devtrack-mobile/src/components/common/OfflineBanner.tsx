// src/components/common/OfflineBanner.tsx
// Banner que aparece no topo da tela quando o app detecta ausência de internet.
// Desaparece automaticamente quando a conexão é restaurada.

import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { WifiOff } from 'lucide-react-native';

interface Props {
    visible: boolean;
}

export default function OfflineBanner({ visible }: Props) {
    const slideAnim = useRef(new Animated.Value(-60)).current;

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: visible ? 0 : -60,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
        }).start();
    }, [visible]);

    return (
        <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
            <WifiOff size={14} color="#fff" strokeWidth={2} />
            <Text style={styles.text}>Você está offline — dados em cache</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        backgroundColor: '#ef4444',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    text: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
});
