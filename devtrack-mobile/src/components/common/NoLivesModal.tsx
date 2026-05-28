// src/components/common/NoLivesModal.tsx
// Modal de "sem vidas" com opções: anúncio simulado ou premium
import React, { useState, useEffect, useRef } from 'react';
import {
    Modal, View, Text, TouchableOpacity, StyleSheet, Animated as RNAnimated,
} from 'react-native';
import Animated, {
    FadeIn, FadeInDown, withSpring, useSharedValue, useAnimatedStyle,
    withSequence, withTiming, withRepeat,
} from 'react-native-reanimated';
import { useLives } from '../../context/LivesContext';

interface NoLivesModalProps {
    visible: boolean;
    onClose: () => void;
    onLifeRestored: () => void;
}

const AD_DURATION = 5; // segundos do "anúncio"

export default function NoLivesModal({ visible, onClose, onLifeRestored }: NoLivesModalProps) {
    const { restoreLife, activateInfinite, nextRefillIn, maxLives, lives } = useLives();
    const [watching, setWatching] = useState(false);
    const [countdown, setCountdown] = useState(AD_DURATION);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const pulseScale = useSharedValue(1);
    const adProgress = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            pulseScale.value = withRepeat(
                withSequence(withTiming(1.05, { duration: 900 }), withTiming(1, { duration: 900 })),
                -1, true,
            );
        }
    }, [visible]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    const adBarStyle = useAnimatedStyle(() => ({
        width: `${adProgress.value * 100}%` as any,
    }));

    const startWatchingAd = () => {
        setWatching(true);
        setCountdown(AD_DURATION);
        adProgress.value = 0;
        adProgress.value = withTiming(1, { duration: AD_DURATION * 1000 });

        intervalRef.current = setInterval(() => {
            setCountdown(c => {
                if (c <= 1) {
                    clearInterval(intervalRef.current!);
                    setWatching(false);
                    restoreLife();
                    onLifeRestored();
                    onClose();
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
    };

    const handlePremium = () => {
        activateInfinite();
        onClose();
    };

    useEffect(() => {
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    function formatTime(seconds: number) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    }

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Animated.View entering={FadeInDown.springify()} style={styles.card}>

                    {/* Corações quebrados */}
                    <Animated.View style={[styles.heartsRow, pulseStyle]}>
                        {Array.from({ length: maxLives }, (_, i) => (
                            <Text key={i} style={[styles.heartIcon, i < lives && styles.heartFull]}>
                                {i < lives ? '❤️' : '🖤'}
                            </Text>
                        ))}
                    </Animated.View>

                    <Text style={styles.title}>Sem vidas!</Text>
                    <Text style={styles.subtitle}>
                        Você ficou sem vidas. Descanse ou continue agora.
                    </Text>

                    {/* Próxima vida */}
                    {nextRefillIn > 0 && (
                        <View style={styles.timerBadge}>
                            <Text style={styles.timerText}>
                                🕐 Próxima vida em {formatTime(nextRefillIn)}
                            </Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    {/* Assistir anúncio */}
                    {watching ? (
                        <View style={styles.adContainer}>
                            <Text style={styles.adLabel}>📺 Assistindo anúncio... {countdown}s</Text>
                            <View style={styles.adTrack}>
                                <Animated.View style={[styles.adBar, adBarStyle]} />
                            </View>
                            <Text style={styles.adHint}>Não feche esta tela!</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.adBtn} onPress={startWatchingAd} activeOpacity={0.85}>
                            <Text style={styles.adBtnIcon}>▶</Text>
                            <View>
                                <Text style={styles.adBtnTitle}>Assistir anúncio</Text>
                                <Text style={styles.adBtnSub}>Ganhe +1 ❤️ grátis</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Premium */}
                    <TouchableOpacity style={styles.premiumBtn} onPress={handlePremium} activeOpacity={0.85}>
                        <Text style={styles.premiumIcon}>⚡</Text>
                        <View>
                            <Text style={styles.premiumTitle}>Premium — 24 horas</Text>
                            <Text style={styles.premiumSub}>Vidas infinitas por 24h</Text>
                        </View>
                        <View style={styles.premiumBadge}>
                            <Text style={styles.premiumBadgeText}>∞</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Fechar */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeBtnText}>Fechar — esperar recarregar</Text>
                    </TouchableOpacity>

                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#16151d',
        borderRadius: 24,
        padding: 28,
        width: '100%',
        borderWidth: 1,
        borderColor: '#2a2040',
        alignItems: 'center',
        gap: 16,
    },
    heartsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    heartIcon: {
        fontSize: 28,
        opacity: 0.3,
    },
    heartFull: {
        opacity: 1,
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    subtitle: {
        color: '#7a7590',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    timerBadge: {
        backgroundColor: '#1e1c2e',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: '#2a2040',
    },
    timerText: {
        color: '#8b5cf6',
        fontSize: 13,
        fontWeight: '700',
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#2a2040',
    },
    adBtn: {
        width: '100%',
        backgroundColor: '#06b6d415',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderWidth: 1,
        borderColor: '#06b6d430',
    },
    adBtnIcon: {
        fontSize: 22,
        color: '#06b6d4',
    },
    adBtnTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    adBtnSub: {
        color: '#06b6d4',
        fontSize: 12,
        fontWeight: '600',
    },
    adContainer: {
        width: '100%',
        gap: 10,
        alignItems: 'center',
    },
    adLabel: {
        color: '#06b6d4',
        fontSize: 14,
        fontWeight: '700',
    },
    adTrack: {
        width: '100%',
        height: 8,
        backgroundColor: '#1a1826',
        borderRadius: 4,
        overflow: 'hidden',
    },
    adBar: {
        height: '100%',
        backgroundColor: '#06b6d4',
        borderRadius: 4,
    },
    adHint: {
        color: '#44415a',
        fontSize: 11,
    },
    premiumBtn: {
        width: '100%',
        backgroundColor: '#8b5cf615',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderWidth: 1,
        borderColor: '#8b5cf630',
    },
    premiumIcon: {
        fontSize: 22,
    },
    premiumTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    premiumSub: {
        color: '#8b5cf6',
        fontSize: 12,
        fontWeight: '600',
    },
    premiumBadge: {
        marginLeft: 'auto',
        backgroundColor: '#8b5cf6',
        borderRadius: 12,
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    premiumBadgeText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
    closeBtn: {
        paddingVertical: 8,
    },
    closeBtnText: {
        color: '#44415a',
        fontSize: 12,
        fontWeight: '600',
    },
});
