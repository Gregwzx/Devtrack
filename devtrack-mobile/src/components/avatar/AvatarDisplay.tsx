// src/components/avatar/AvatarDisplay.tsx — Avatar 3D premium com camadas e animações
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    FadeIn, useSharedValue, useAnimatedStyle,
    withRepeat, withTiming, withSequence,
} from 'react-native-reanimated';
import { getAvatarLevel, COSMETICS, BG_GRADIENTS, BG_GLOW } from '../../data/avatars';

interface AvatarDisplayProps {
    xp: number;
    size?: number;
    equippedHat?: string;
    equippedBadge?: string;
    equippedBackground?: string;
    showLevel?: boolean;
    animated?: boolean;
}

// Mapeamento de emoji base para versões mais detalhadas por nível
const LEVEL_AVATAR_STACKS: Record<number, { base: string; accent?: string; layer?: string }> = {
    0: { base: '🧑‍💻', accent: '💻' },          // Júnior — codando
    1: { base: '👨‍💻', accent: '⌨️' },          // Dev Pleno — teclado
    2: { base: '🦾', accent: '⚡' },             // Sênior — braço robótico + raio
    3: { base: '🤖', accent: '🔮', layer: '✨' }, // Arquiteto — robô + bola de cristal
    4: { base: '🦸‍♂️', accent: '🏆', layer: '👑' }, // Lendário — super herói + troféu + coroa
};

export default function AvatarDisplay({
    xp,
    size = 80,
    equippedHat,
    equippedBadge,
    equippedBackground,
    showLevel = false,
    animated = true,
}: AvatarDisplayProps) {
    const level = getAvatarLevel(xp);
    const lvlIndex = [0, 75, 200, 450, 900].filter(m => xp >= m).length - 1;
    const stack = LEVEL_AVATAR_STACKS[Math.min(lvlIndex, 4)] ?? LEVEL_AVATAR_STACKS[0];

    const hat    = equippedHat    ? COSMETICS.find(c => c.id === equippedHat)    : null;
    const badge  = equippedBadge  ? COSMETICS.find(c => c.id === equippedBadge)  : null;
    const bgId   = equippedBackground ?? 'bg_dark';
    const bgColors = BG_GRADIENTS[bgId] ?? BG_GRADIENTS['bg_dark'];
    const glowColor = BG_GLOW[bgId] ?? level.glowColor;

    // ── Animações ──────────────────────────────────────────────────────────────
    const floatY  = useSharedValue(0);
    const ringRot = useSharedValue(0);
    const pulse   = useSharedValue(1);
    const accentY = useSharedValue(0);

    useEffect(() => {
        if (!animated) return;
        // Flutuação suave do avatar
        floatY.value = withRepeat(
            withSequence(withTiming(-6, { duration: 1800 }), withTiming(0, { duration: 1800 })),
            -1, true
        );
        // Pulsação do anel
        pulse.value = withRepeat(
            withSequence(withTiming(1.08, { duration: 2200 }), withTiming(1, { duration: 2200 })),
            -1, true
        );
        // Flutuação do acessório
        accentY.value = withRepeat(
            withSequence(withTiming(-4, { duration: 1400 }), withTiming(2, { duration: 1400 })),
            -1, true
        );
    }, [animated]);

    const floatStyle  = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));
    const pulseStyle  = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
    const accentStyle = useAnimatedStyle(() => ({ transform: [{ translateY: accentY.value }] }));

    const RING_SIZE = size + 28;
    const INNER     = size + 10;

    return (
        <Animated.View entering={FadeIn.duration(500)} style={styles.wrapper}>

            {/* Anel de brilho pulsante (externo) */}
            <Animated.View style={[
                styles.outerRing,
                {
                    width: RING_SIZE + 8,
                    height: RING_SIZE + 8,
                    borderRadius: (RING_SIZE + 8) / 2,
                    borderColor: glowColor + '30',
                    shadowColor: glowColor,
                },
                pulseStyle,
            ]} />

            {/* Anel principal */}
            <View style={[
                styles.ring,
                {
                    width: RING_SIZE,
                    height: RING_SIZE,
                    borderRadius: RING_SIZE / 2,
                    borderColor: glowColor + '70',
                    shadowColor: glowColor,
                    shadowOpacity: 0.8,
                    shadowRadius: size * 0.3,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: 18,
                },
            ]}>

                {/* Avatar flutuante */}
                <Animated.View style={floatStyle}>

                    {/* Corpo principal */}
                    <View style={[
                        styles.body,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                            backgroundColor: bgColors[0],
                            borderColor: glowColor + '50',
                            // Efeito 3D com sombra bottom
                            shadowColor: glowColor,
                            shadowOpacity: 0.5,
                            shadowRadius: size * 0.25,
                            shadowOffset: { width: 0, height: size * 0.12 },
                            elevation: 12,
                        },
                    ]}>
                        {/* Inner glow layer */}
                        <View style={[styles.innerGlow, { borderColor: glowColor + '25', borderRadius: size / 2 }]} />

                        {/* Emoji base — avatar principal */}
                        <Text style={{ fontSize: size * 0.48, lineHeight: size * 0.62, textAlign: 'center' }}>
                            {hat ? '' : level.baseEmoji}
                        </Text>

                        {/* Chapéu equipado — sobrepõe o emoji base */}
                        {hat && (
                            <Text style={{ fontSize: size * 0.52, lineHeight: size * 0.64, textAlign: 'center' }}>
                                {hat.emoji}
                            </Text>
                        )}

                        {/* Reflexo 3D no topo */}
                        <View style={[styles.specular, { borderRadius: size / 2, width: size * 0.45, height: size * 0.25, top: size * 0.08, left: size * 0.15 }]} />
                    </View>

                    {/* Acessório flutuante (accent emoji) — canto superior direito */}
                    {stack.accent && !hat && (
                        <Animated.View style={[
                            styles.accentWrap,
                            {
                                top: -size * 0.1,
                                right: -size * 0.08,
                                width: size * 0.34,
                                height: size * 0.34,
                                borderRadius: size * 0.17,
                                backgroundColor: bgColors[0],
                                borderColor: glowColor + '60',
                            },
                            accentStyle,
                        ]}>
                            <Text style={{ fontSize: size * 0.18 }}>{stack.accent}</Text>
                        </Animated.View>
                    )}

                    {/* Layer especial (apenas níveis altos) */}
                    {stack.layer && (
                        <Animated.View style={[
                            styles.layerWrap,
                            {
                                bottom: -size * 0.08,
                                left: -size * 0.1,
                                width: size * 0.32,
                                height: size * 0.32,
                                borderRadius: size * 0.16,
                                backgroundColor: '#ffc80020',
                                borderColor: '#ffc80060',
                            },
                            accentStyle,
                        ]}>
                            <Text style={{ fontSize: size * 0.16 }}>{stack.layer}</Text>
                        </Animated.View>
                    )}

                </Animated.View>
            </View>

            {/* Badge equipado — canto inferior direito do anel */}
            {badge && (
                <View style={[
                    styles.badgeWrap,
                    {
                        width: size * 0.4,
                        height: size * 0.4,
                        borderRadius: size * 0.2,
                        right: -4,
                        bottom: 0,
                        backgroundColor: '#16151d',
                        borderColor: glowColor + '80',
                        shadowColor: glowColor,
                        elevation: 8,
                    },
                ]}>
                    <Text style={{ fontSize: size * 0.22 }}>{badge.emoji}</Text>
                </View>
            )}

            {/* Nível + XP abaixo */}
            {showLevel && (
                <View style={styles.levelWrap}>
                    <View style={[styles.levelChip, { borderColor: glowColor + '50', backgroundColor: glowColor + '15' }]}>
                        <Text style={[styles.levelText, { color: glowColor }]}>{level.label}</Text>
                    </View>
                    <Text style={styles.xpText}>{xp} XP</Text>
                </View>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper:    { alignItems: 'center', justifyContent: 'center' },
    outerRing:  { position: 'absolute', borderWidth: 1.5 },
    ring:       { alignItems: 'center', justifyContent: 'center', borderWidth: 2.5 },
    body:       {
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, overflow: 'visible',
    },
    innerGlow: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        borderWidth: 3,
    },
    specular: {
        position: 'absolute',
        backgroundColor: 'rgba(255,255,255,0.12)',
        transform: [{ rotate: '-30deg' }],
    },
    accentWrap: {
        position: 'absolute',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2,
        shadowOpacity: 0.4, shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 6,
    },
    layerWrap: {
        position: 'absolute',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5,
        elevation: 4,
    },
    badgeWrap: {
        position: 'absolute',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2.5,
        shadowOpacity: 0.5, shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    levelWrap: { marginTop: 12, alignItems: 'center', gap: 4 },
    levelChip: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
    levelText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
    xpText:    { color: '#6b6880', fontSize: 11, fontWeight: '700' },
});
