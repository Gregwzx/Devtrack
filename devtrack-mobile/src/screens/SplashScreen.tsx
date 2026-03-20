// src/screens/SplashScreen.tsx
// Splash animada que fica na frente de tudo enquanto o app inicializa.
// Usa position absolute + zIndex pra ficar sobreposta ao layout real,
// e desaparece com fade quando o auth termina de checar.

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withSpring,
    runOnJS,
    Easing,
} from 'react-native-reanimated';

interface SplashScreenProps {
    onFinish: () => void;  // chamado após o fade out — é aí que o app navega
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    // logo entra depois de 300ms pra não parecer que piscou
    const logoOpacity     = useSharedValue(0);
    const logoScale       = useSharedValue(0.7);
    // tagline sobe com pequeno delay depois do logo aparecer
    const taglineOpacity  = useSharedValue(0);
    const taglineY        = useSharedValue(14);
    // o container inteiro some no final com fade
    const containerOpacity = useSharedValue(1);

    useEffect(() => {
        logoOpacity.value  = withDelay(300, withTiming(1, { duration: 600 }));
        logoScale.value    = withDelay(300, withSpring(1, { damping: 14, stiffness: 100 }));
        taglineOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));
        taglineY.value       = withDelay(900, withSpring(0, { damping: 14 }));

        // 2400ms no total — logo (300) + animação (600) + pausa pra ler + tagline (900+500)
        const timeout = setTimeout(() => {
            containerOpacity.value = withTiming(0, {
                duration: 500,
                easing: Easing.out(Easing.cubic),
            }, (finished) => {
                // runOnJS porque onFinish é uma função JS — não pode chamar direto no worklet
                if (finished) runOnJS(onFinish)();
            });
        }, 2400);

        return () => clearTimeout(timeout);
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ scale: logoScale.value }],
    }));
    const taglineStyle = useAnimatedStyle(() => ({
        opacity: taglineOpacity.value,
        transform: [{ translateY: taglineY.value }],
    }));
    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <Animated.View style={[styles.logoWrapper, logoStyle]}>
                <View style={styles.logoBox}>
                    {/* ícone de terminal: "> _" — simples, mas remete ao universo dev */}
                    <View style={styles.terminalIcon}>
                        <Text style={styles.terminalChevron}>{'>'}</Text>
                        <Text style={styles.terminalUnderscore}>_</Text>
                    </View>
                </View>
                <Text style={styles.logoText}>
                    Dev<Text style={styles.logoTextAccent}>Track</Text>
                </Text>
            </Animated.View>
            <Animated.Text style={[styles.tagline, taglineStyle]}>
                Sua evolução, visível.
            </Animated.Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,  // cobre a tela inteira sem flex
        backgroundColor: '#0d0d10',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,  // fica na frente de tudo
    },
    logoWrapper: { alignItems: 'center' },
    logoBox: {
        width: 88, height: 88, borderRadius: 28,
        backgroundColor: '#8b5cf6',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 22,
        // sombra roxa bem pronunciada — dá o brilho característico do app
        shadowColor: '#8b5cf6', shadowOpacity: 0.8, shadowRadius: 28, elevation: 18,
    },
    terminalIcon: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
    terminalChevron: {
        color: '#fff', fontSize: 30, fontWeight: '900',
        // monospace pro efeito de terminal — fallback pra Android
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', lineHeight: 34,
    },
    terminalUnderscore: {
        color: '#fff', fontSize: 30, fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', lineHeight: 34,
        marginBottom: -5,  // alinha o underscore na base do chevron visualmente
    },
    logoText: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
    logoTextAccent: { color: '#8b5cf6' },
    tagline: {
        position: 'absolute', bottom: '35%',
        color: '#6b6880', fontSize: 14, fontWeight: '500', letterSpacing: 0.5,
    },
});