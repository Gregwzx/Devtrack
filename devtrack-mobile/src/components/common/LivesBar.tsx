// src/components/common/LivesBar.tsx
// Exibe os corações de vida no header — estilo Duolingo
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withSequence, withTiming, withSpring,
} from 'react-native-reanimated';
import { useLives } from '../../context/LivesContext';

function Heart({ filled, index, justLost }: { filled: boolean; index: number; justLost: boolean }) {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    useEffect(() => {
        if (justLost && !filled) {
            scale.value = withSequence(
                withTiming(1.4, { duration: 120 }),
                withTiming(0.6, { duration: 120 }),
                withSpring(1, { damping: 10 }),
            );
            opacity.value = withSequence(
                withTiming(0.3, { duration: 150 }),
                withTiming(1, { duration: 200 }),
            );
        }
    }, [filled, justLost]);

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.Text style={[styles.heart, style, filled ? styles.heartFull : styles.heartEmpty]}>
            {filled ? '❤️' : '🖤'}
        </Animated.Text>
    );
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

export default function LivesBar() {
    const { lives, maxLives, isInfinite, nextRefillIn } = useLives();
    const prevLives = React.useRef(lives);
    const justLostIndex = React.useRef(-1);

    if (prevLives.current !== lives) {
        if (lives < prevLives.current) {
            justLostIndex.current = lives; // índice do coração que acabou de ser perdido
        }
        prevLives.current = lives;
    }

    if (isInfinite) {
        return (
            <View style={styles.container}>
                <Text style={styles.infiniteIcon}>⚡</Text>
                <Text style={styles.infiniteText}>∞</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.hearts}>
                {Array.from({ length: maxLives }, (_, i) => (
                    <Heart
                        key={i}
                        filled={i < lives}
                        index={i}
                        justLost={i === justLostIndex.current}
                    />
                ))}
            </View>
            {lives < maxLives && nextRefillIn > 0 && (
                <View style={styles.refillBadge}>
                    <Text style={styles.refillText}>🕐 {formatTime(nextRefillIn)}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    hearts: {
        flexDirection: 'row',
        gap: 2,
        alignItems: 'center',
    },
    heart: {
        fontSize: 16,
    },
    heartFull: {},
    heartEmpty: {
        opacity: 0.4,
    },
    refillBadge: {
        backgroundColor: '#1e1c2e',
        borderRadius: 10,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: '#2a2040',
    },
    refillText: {
        color: '#6b6880',
        fontSize: 10,
        fontWeight: '600',
    },
    infiniteIcon: {
        fontSize: 14,
    },
    infiniteText: {
        color: '#8b5cf6',
        fontSize: 18,
        fontWeight: '900',
    },
});
