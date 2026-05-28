// src/components/avatar/AvatarDisplay.tsx — mini preview do avatar (usado no ProfileScreen legado se necessário)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { getAvatarLevel, COSMETICS, BG_GRADIENTS, BG_GLOW } from '../../data/avatars';

interface AvatarDisplayProps {
    xp: number;
    size?: number;
    equippedHat?: string;
    equippedBadge?: string;
    equippedBackground?: string;
    showLevel?: boolean;
}

export default function AvatarDisplay({ xp, size = 80, equippedHat, equippedBadge, equippedBackground, showLevel = false }: AvatarDisplayProps) {
    const level = getAvatarLevel(xp);
    const hat    = equippedHat    ? COSMETICS.find(c => c.id === equippedHat)    : null;
    const badge  = equippedBadge  ? COSMETICS.find(c => c.id === equippedBadge)  : null;
    const bgId   = equippedBackground ?? 'bg_dark';
    const bgColors = BG_GRADIENTS[bgId] ?? BG_GRADIENTS['bg_dark'];
    const glowColor = BG_GLOW[bgId] ?? level.glowColor;

    const glowStyle = {
        shadowColor: glowColor,
        shadowOpacity: 0.6,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
        elevation: 10,
    };

    return (
        <Animated.View entering={FadeIn.duration(400)}>
            <View style={[
                styles.container,
                { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColors[0], borderColor: glowColor + '60', borderWidth: 2 },
                glowStyle,
            ]}>
                <Text style={{ fontSize: size * 0.45, lineHeight: size * 0.6 }}>
                    {level.baseEmoji}
                </Text>
                {hat && (
                    <View style={[styles.hat, { top: -size * 0.15 }]}>
                        <Text style={{ fontSize: size * 0.28 }}>{hat.emoji}</Text>
                    </View>
                )}
                {badge && (
                    <View style={[styles.badge, { bottom: -size * 0.05, right: -size * 0.05, width: size * 0.35, height: size * 0.35, borderRadius: size * 0.175 }]}>
                        <Text style={{ fontSize: size * 0.2 }}>{badge.emoji}</Text>
                    </View>
                )}
            </View>
            {showLevel && (
                <View style={styles.levelBadge}>
                    <Text style={[styles.levelText, { color: level.glowColor }]}>{level.label}</Text>
                </View>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
    hat:       { position: 'absolute', alignItems: 'center', zIndex: 2 },
    badge:     { position: 'absolute', backgroundColor: '#16151d', borderWidth: 2, borderColor: '#0d0d10', alignItems: 'center', justifyContent: 'center', zIndex: 3 },
    levelBadge:{ marginTop: 8, alignItems: 'center' },
    levelText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
});
