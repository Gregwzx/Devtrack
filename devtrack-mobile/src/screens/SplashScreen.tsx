import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    withSpring,
    runOnJS,
    Easing,
    FadeIn,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const logoScale = useSharedValue(0.3);
    const logoOpacity = useSharedValue(0);
    const taglineOpacity = useSharedValue(0);
    const taglineY = useSharedValue(20);
    const containerOpacity = useSharedValue(1);
    const glowScale = useSharedValue(0.5);
    const glowOpacity = useSharedValue(0);
    const ringScale = useSharedValue(0.6);
    const ringOpacity = useSharedValue(0);

    useEffect(() => {
        // Glow pulse
        glowOpacity.value = withDelay(200, withTiming(0.6, { duration: 600 }));
        glowScale.value = withDelay(200, withSpring(1.2, { damping: 8 }));

        // Ring expand
        ringOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
        ringScale.value = withDelay(300, withSpring(1, { damping: 10 }));

        // Logo pop in
        logoOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
        logoScale.value = withDelay(400, withSpring(1, { damping: 12, stiffness: 120 }));

        // Tagline slide up
        taglineOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
        taglineY.value = withDelay(800, withSpring(0, { damping: 14 }));

        // Fade out and finish
        const timeout = setTimeout(() => {
            containerOpacity.value = withTiming(0, {
                duration: 500,
                easing: Easing.out(Easing.cubic),
            }, (finished) => {
                if (finished) runOnJS(onFinish)();
            });
        }, 2200);

        return () => clearTimeout(timeout);
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
        opacity: logoOpacity.value,
    }));

    const taglineStyle = useAnimatedStyle(() => ({
        opacity: taglineOpacity.value,
        transform: [{ translateY: taglineY.value }],
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
        transform: [{ scale: glowScale.value }],
    }));

    const ringStyle = useAnimatedStyle(() => ({
        opacity: ringOpacity.value,
        transform: [{ scale: ringScale.value }],
    }));

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            {/* Background glow */}
            <Animated.View style={[styles.glow, glowStyle]} />

            {/* Outer ring */}
            <Animated.View style={[styles.ring, ringStyle]} />
            <Animated.View style={[styles.ringInner, ringStyle]} />

            {/* Logo mark */}
            <Animated.View style={[styles.logoWrapper, logoStyle]}>
                <View style={styles.logoBox}>
                    <Text style={styles.logoIcon}>⚡</Text>
                </View>
                <Text style={styles.logoText}>
                    Dev<Text style={styles.logoTextAccent}>Track</Text>
                </Text>
            </Animated.View>

            {/* Tagline */}
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
    glow: {
        position: 'absolute',
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: '#8b5cf6',
        opacity: 0,
    },
    ring: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: '#8b5cf640',
    },
    ringInner: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 1,
        borderColor: '#8b5cf620',
    },
    logoWrapper: {
        alignItems: 'center',
    },
    logoBox: {
        width: 80,
        height: 80,
        borderRadius: 26,
        backgroundColor: '#8b5cf6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#8b5cf6',
        shadowOpacity: 0.8,
        shadowRadius: 24,
        elevation: 16,
    },
    logoIcon: {
        fontSize: 36,
    },
    logoText: {
        fontSize: 34,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1,
    },
    logoTextAccent: {
        color: '#8b5cf6',
    },
    tagline: {
        color: '#6b6880',
        fontSize: 14,
        fontWeight: '500',
        marginTop: 12,
        letterSpacing: 0.5,
    },
});