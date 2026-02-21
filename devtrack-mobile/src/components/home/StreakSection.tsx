import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
    FadeInDown,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

export default function StreakSection() {
    const streakDays = 7;

    const scale = useSharedValue(1);
    const pulse = useSharedValue(1);

    useEffect(() => {
        pulse.value = withRepeat(
            withTiming(1.05, { duration: 1500 }),
            -1,
            true
        );
    }, []);

    const pressStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
    }));

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🔥 Sua sequência</Text>

            <Animated.View entering={FadeInDown.duration(600)}>
                <Pressable
                    onPressIn={() => (scale.value = withSpring(0.97))}
                    onPressOut={() => (scale.value = withSpring(1))}
                >
                    <Animated.View style={[styles.card, pressStyle]}>
                        <Animated.View style={[styles.streakCircle, pulseStyle]}>
                            <Text style={styles.days}>{streakDays}</Text>
                            <Text style={styles.daysLabel}>dias</Text>
                        </Animated.View>

                        <View style={styles.info}>
                            <Text style={styles.mainText}>
                                Você está consistente!
                            </Text>

                            <Text style={styles.subText}>
                                Continue estudando hoje para manter sua streak ativa 🚀
                            </Text>
                        </View>
                    </Animated.View>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        marginBottom: 28,
    },

    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 14,
    },

    card: {
        backgroundColor: '#1a1d24',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',

        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },

    streakCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#7c3aed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 18,
    },

    days: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
    },

    daysLabel: {
        fontSize: 12,
        color: '#fff',
        opacity: 0.9,
    },

    info: {
        flex: 1,
    },

    mainText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },

    subText: {
        color: '#9aa0a6',
        fontSize: 13,
        lineHeight: 18,
    },
});