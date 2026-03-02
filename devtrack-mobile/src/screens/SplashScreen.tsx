// src/screens/SplashScreen.tsx
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
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const logoOpacity = useSharedValue(0);
    const logoScale = useSharedValue(0.7);
    const taglineOpacity = useSharedValue(0);
    const taglineY = useSharedValue(14);
    const containerOpacity = useSharedValue(1);

    useEffect(() => {
        logoOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
        logoScale.value = withDelay(300, withSpring(1, { damping: 14, stiffness: 100 }));
        taglineOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));
        taglineY.value = withDelay(900, withSpring(0, { damping: 14 }));

        const timeout = setTimeout(() => {
            containerOpacity.value = withTiming(0, {
                duration: 500,
                easing: Easing.out(Easing.cubic),
            }, (finished) => {
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
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0d0d10',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
    },
    logoWrapper: { alignItems: 'center' },
    logoBox: {
        width: 88, height: 88, borderRadius: 28,
        backgroundColor: '#8b5cf6',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 22,
        shadowColor: '#8b5cf6', shadowOpacity: 0.8, shadowRadius: 28, elevation: 18,
    },
    terminalIcon: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
    terminalChevron: {
        color: '#fff', fontSize: 30, fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', lineHeight: 34,
    },
    terminalUnderscore: {
        color: '#fff', fontSize: 30, fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', lineHeight: 34, marginBottom: -5,
    },
    logoText: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
    logoTextAccent: { color: '#8b5cf6' },
    tagline: {
        position: 'absolute', bottom: '35%',
        color: '#6b6880', fontSize: 14, fontWeight: '500', letterSpacing: 0.5,
    },
});