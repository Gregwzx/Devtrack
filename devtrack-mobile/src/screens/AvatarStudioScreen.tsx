// src/screens/AvatarStudioScreen.tsx — Perfil Premium v3 (Estilo Duolingo+)
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { signOutUser } from '../services/authService';
import { router } from 'expo-router';
import { Settings, Pencil, Flame, Zap, Award, Star, X, Sparkles, ShieldCheck, Trophy } from 'lucide-react-native';

import { createAvatar } from '@dicebear/core';
import { micah } from '@dicebear/collection';
import { SvgXml } from 'react-native-svg';

import { getAvatarLevel, getNextLevel, AVATAR_LEVELS } from '../data/avatars';
import {
    DEFAULT_CONFIG, DICEBEAR_STORAGE_KEY,
    HAIR_OPTIONS, HAIR_COLORS, SKIN_COLORS,
    CLOTHES_OPTIONS, CLOTHING_COLORS, GLASSES_OPTIONS,
    MOUTH_OPTIONS, BACKGROUND_OPTIONS,
    type DiceBearConfig, type AvatarOption
} from '../data/dicebear';

const { width: SW, height: SH } = Dimensions.get('window');
const XP_KEY     = (e: string) => `DEVTRACK_XP_${e}`;
const STREAK_KEY = (e: string) => `DEVTRACK_${e.replace(/[^a-z0-9]/gi,'_').toLowerCase()}_STREAK`;

// ─── Avatar SVG ───────────────────────────────────────────────────────────────
function DuoAvatar({ config, seed, size }: { config: DiceBearConfig; seed: string; size: number }) {
    const svg = React.useMemo(() => createAvatar(micah, {
        seed, size,
        backgroundColor: ['transparent'],
        hair: [config.hair] as any,
        hairColor: [config.hairColor] as any,
        baseColor: [config.baseColor] as any,
        shirt: [config.shirt] as any,
        shirtColor: [config.shirtColor] as any,
        glasses: [config.glasses] as any,
        mouth: [config.mouth] as any,
        eyes: [config.eyes] as any,
        eyebrows: [config.eyebrows] as any,
        facialHair: [config.facialHair] as any,
        earrings: [config.earrings] as any,
    }).toString(), [config, seed, size]);
    return <SvgXml xml={svg} width={size} height={size} />;
}

// ─── XP Progress Bar ──────────────────────────────────────────────────────────
function XPBar({ xp, levelColor }: { xp: number; levelColor: string }) {
    const level = getAvatarLevel(xp);
    const next  = getNextLevel(xp);
    const pct   = next ? Math.min(((xp - level.minXp) / (next.minXp - level.minXp)) * 100, 100) : 100;
    const width = useSharedValue(0);

    useEffect(() => { width.value = withTiming(pct, { duration: 1200 }); }, [xp]);
    const barStyle = useAnimatedStyle(() => ({ width: `${width.value}%` as any }));

    return (
        <View style={xpb.wrap}>
            <View style={xpb.header}>
                <View style={[xpb.badge, { backgroundColor: levelColor + '25', borderColor: levelColor + '60' }]}>
                    <ShieldCheck size={13} color={levelColor} />
                    <Text style={[xpb.levelTxt, { color: levelColor }]}>{level.label}</Text>
                </View>
                {next && <Text style={xpb.nextTxt}>{next.minXp - xp} XP para {next.label}</Text>}
            </View>
            <View style={xpb.track}>
                <Animated.View style={[xpb.fill, barStyle, { backgroundColor: levelColor }]} />
            </View>
            <View style={xpb.dots}>
                {AVATAR_LEVELS.map((l, i) => (
                    <View key={i} style={[xpb.dot, xp >= l.minXp && { backgroundColor: levelColor }]} />
                ))}
            </View>
        </View>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, accent }: { icon: React.ReactNode; value: string | number; label: string; accent: string }) {
    return (
        <View style={[sc.card, { borderColor: accent + '30' }]}>
            <LinearGradient colors={[accent + '20', 'transparent']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={[sc.iconWrap, { backgroundColor: accent + '25' }]}>{icon}</View>
            <Text style={sc.val}>{value}</Text>
            <Text style={sc.lbl}>{label}</Text>
        </View>
    );
}

// ─── Achievement Badge ─────────────────────────────────────────────────────────
function AchievementBadge({ emoji, label, unlocked }: { emoji: string; label: string; unlocked: boolean }) {
    return (
        <View style={[ab.wrap, !unlocked && ab.locked]}>
            <Text style={[ab.emoji, !unlocked && { opacity: 0.3 }]}>{unlocked ? emoji : '🔒'}</Text>
            <Text style={[ab.lbl, !unlocked && { color: '#3a3a4a' }]}>{label}</Text>
        </View>
    );
}

// ─── TABS Config ──────────────────────────────────────────────────────────────
const TABS = [
    { key: 'hair',            label: 'Cabelo',   emoji: '💇' },
    { key: 'hairColor',       label: 'Cor Cab.', emoji: '🎨' },
    { key: 'baseColor',       label: 'Pele',     emoji: '🤚' },
    { key: 'shirt',           label: 'Roupa',    emoji: '👕' },
    { key: 'shirtColor',      label: 'Cor Roupa',emoji: '🎨' },
    { key: 'glasses',         label: 'Óculos',   emoji: '🕶️' },
    { key: 'mouth',           label: 'Rosto',    emoji: '😊' },
    { key: 'backgroundColor', label: 'Fundo',    emoji: '🖼️' },
] as const;
type TabKey = typeof TABS[number]['key'];

const OPTIONS_MAP: Record<TabKey, AvatarOption[]> = {
    hair: HAIR_OPTIONS, hairColor: HAIR_COLORS, baseColor: SKIN_COLORS,
    shirt: CLOTHES_OPTIONS, shirtColor: CLOTHING_COLORS, glasses: GLASSES_OPTIONS,
    mouth: MOUTH_OPTIONS, backgroundColor: BACKGROUND_OPTIONS,
};

// ─── Editor Modal ─────────────────────────────────────────────────────────────
function EditorModal({ visible, onClose, config, seed, xp, onSelect }: {
    visible: boolean; onClose: () => void; config: DiceBearConfig;
    seed: string; xp: number; onSelect: (k: keyof DiceBearConfig, v: string) => void;
}) {
    const [activeTab, setActiveTab] = useState<TabKey>('hair');
    const opts     = OPTIONS_MAP[activeTab];
    const CARD_W   = (SW - 48) / 4;
    const bgColor  = config.backgroundColor !== 'transparent' ? `#${config.backgroundColor}` : '#e05c7a';

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={ed.root} edges={['top']}>
                {/* Header */}
                <View style={ed.header}>
                    <Text style={ed.title}>✏️  Editar Avatar</Text>
                    <TouchableOpacity onPress={onClose} style={ed.closeBtn}><X color="#fff" size={22} /></TouchableOpacity>
                </View>

                {/* Live Preview */}
                <View style={[ed.preview, { backgroundColor: bgColor }]}>
                    <DuoAvatar config={config} seed={seed} size={200} />
                </View>

                {/* Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ed.tabs}>
                    {TABS.map(t => {
                        const active = activeTab === t.key;
                        return (
                            <TouchableOpacity key={t.key} style={[ed.tab, active && ed.tabOn]} onPress={() => setActiveTab(t.key)}>
                                <Text style={ed.tabEmoji}>{t.emoji}</Text>
                                <Text style={[ed.tabLbl, active && { color: '#fff' }]}>{t.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Grid */}
                <ScrollView contentContainerStyle={ed.grid}>
                    {opts.map((opt) => {
                        const unlocked = xp >= (opt.xpRequired ?? 0);
                        const selected = config[activeTab as keyof DiceBearConfig] === opt.id;
                        return (
                            <TouchableOpacity
                                key={opt.id}
                                style={[ed.card, { width: CARD_W }, selected && ed.cardOn, !unlocked && ed.cardLocked]}
                                onPress={() => unlocked && onSelect(activeTab as keyof DiceBearConfig, opt.id)}
                                activeOpacity={unlocked ? 0.75 : 1}
                            >
                                {opt.color ? (
                                    <View style={[ed.colorCircle, { backgroundColor: opt.color }]}>
                                        {selected && <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>✓</Text>}
                                    </View>
                                ) : (
                                    <Text style={ed.optEmoji}>{unlocked ? opt.emoji : '🔒'}</Text>
                                )}
                                <Text style={ed.optLbl} numberOfLines={1}>{opt.label}</Text>
                                {!unlocked && (
                                    <View style={ed.xpPill}>
                                        <Sparkles size={9} color="#8b5cf6" />
                                        <Text style={ed.xpPillTxt}>{opt.xpRequired} XP</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AvatarStudioScreen() {
    const { user }  = useAuth();
    const insets    = useSafeAreaInsets();
    const email     = user?.email ?? 'guest';
    const seed      = user?.name ?? email;

    const [config, setConfig]   = useState<DiceBearConfig>(DEFAULT_CONFIG);
    const [xp, setXp]           = useState(0);
    const [streak, setStreak]   = useState(0);
    const [editorOpen, setEdit] = useState(false);

    useEffect(() => {
        (async () => {
            const [cfgR, xpR, strR] = await Promise.all([
                AsyncStorage.getItem(DICEBEAR_STORAGE_KEY(email)),
                AsyncStorage.getItem(XP_KEY(email)),
                AsyncStorage.getItem(STREAK_KEY(email)),
            ]);
            if (cfgR) setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(cfgR) });
            if (xpR)  setXp(parseInt(xpR, 10) || 0);
            if (strR) setStreak(JSON.parse(strR)?.count ?? 0);
        })();
    }, [email]);

    const handleSelect = useCallback(async (key: keyof DiceBearConfig, value: string) => {
        const nc = { ...config, [key]: value };
        setConfig(nc);
        await AsyncStorage.setItem(DICEBEAR_STORAGE_KEY(email), JSON.stringify(nc));
    }, [config, email]);

    const handleLogout = async () => { await signOutUser(); router.replace('/login'); };

    const level       = getAvatarLevel(xp);
    const bgColor     = config.backgroundColor !== 'transparent' ? `#${config.backgroundColor}` : '#e05c7a';
    const joinMonth   = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    // Conquistas simples baseadas em XP / streak
    const achievements = [
        { emoji: '⭐', label: 'Primeiro XP',  unlocked: xp >= 1 },
        { emoji: '🔥', label: '3 dias',        unlocked: streak >= 3 },
        { emoji: '🚀', label: '100 XP',        unlocked: xp >= 100 },
        { emoji: '💎', label: '7 dias',        unlocked: streak >= 7 },
        { emoji: '🏆', label: 'Sênior',        unlocked: xp >= 200 },
        { emoji: '👑', label: 'Lendário',      unlocked: xp >= 900 },
    ];

    return (
        <View style={s.root}>
            {/* ── TOP HEADER com Avatar ── */}
            <View style={[s.hero, { backgroundColor: bgColor, paddingTop: insets.top }]}>
                {/* Botão de sair */}
                <TouchableOpacity style={s.settingsBtn} onPress={handleLogout}>
                    <Settings color="rgba(255,255,255,0.85)" size={24} />
                </TouchableOpacity>

                {/* Avatar gigante */}
                <Animated.View entering={FadeIn.duration(600)} style={s.avatarWrap}>
                    <DuoAvatar config={config} seed={seed} size={300} />
                </Animated.View>
            </View>

            {/* ── CORPO ── */}
            <ScrollView style={s.body} showsVerticalScrollIndicator={false}>

                {/* Bloco de nome + botão editar */}
                <Animated.View entering={FadeInDown.delay(100).duration(400)} style={s.nameBlock}>
                    <View>
                        <Text style={s.name}>{user?.name ?? 'Dev Anônimo'}</Text>
                        <Text style={s.email}>{email}</Text>
                        <Text style={s.joined}>Membro desde {joinMonth}</Text>
                    </View>
                    <TouchableOpacity style={[s.editBtn, { borderColor: bgColor + '80', backgroundColor: bgColor + '18' }]} onPress={() => setEdit(true)}>
                        <Pencil size={16} color={bgColor} strokeWidth={2.5} />
                        <Text style={[s.editBtnTxt, { color: bgColor }]}>Editar</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* XP Bar */}
                <Animated.View entering={FadeInDown.delay(150).duration(400)} style={s.section}>
                    <XPBar xp={xp} levelColor={level.glowColor} />
                </Animated.View>

                <View style={s.divider} />

                {/* Stats */}
                <Animated.View entering={FadeInDown.delay(200).duration(400)} style={s.section}>
                    <Text style={s.sectionTitle}>Estatísticas</Text>
                    <View style={s.statsRow}>
                        <StatCard icon={<Flame size={20} color="#ff9600" fill="#ff9600" />} value={streak} label="Ofensiva" accent="#ff9600" />
                        <StatCard icon={<Zap size={20} color="#ffc800" fill="#ffc800" />} value={xp} label="XP Total" accent="#ffc800" />
                        <StatCard icon={<Trophy size={20} color="#a855f7" fill="#a855f7" />} value={level.label} label="Nível" accent="#a855f7" />
                        <StatCard icon={<Star size={20} color="#1cb0f6" fill="#1cb0f6" />} value={achievements.filter(a => a.unlocked).length} label="Badges" accent="#1cb0f6" />
                    </View>
                </Animated.View>

                <View style={s.divider} />

                {/* Conquistas */}
                <Animated.View entering={FadeInDown.delay(260).duration(400)} style={s.section}>
                    <Text style={s.sectionTitle}>Conquistas</Text>
                    <View style={s.achRow}>
                        {achievements.map((a, i) => (
                            <AchievementBadge key={i} emoji={a.emoji} label={a.label} unlocked={a.unlocked} />
                        ))}
                    </View>
                </Animated.View>

                <View style={s.divider} />

                {/* Próximo nível */}
                {getNextLevel(xp) && (
                    <Animated.View entering={FadeInDown.delay(320).duration(400)} style={s.section}>
                        <Text style={s.sectionTitle}>Próximo Nível</Text>
                        <View style={s.nextLvlCard}>
                            <LinearGradient colors={[level.glowColor + '20', 'transparent']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                            <Award size={28} color={level.glowColor} />
                            <View style={{ flex: 1 }}>
                                <Text style={s.nextLvlName}>{getNextLevel(xp)?.label}</Text>
                                <Text style={s.nextLvlDesc}>Faltam {(getNextLevel(xp)?.minXp ?? 0) - xp} XP — continue estudando nas trilhas!</Text>
                            </View>
                        </View>
                    </Animated.View>
                )}

                <View style={{ height: 110 }} />
            </ScrollView>

            <EditorModal
                visible={editorOpen}
                onClose={() => setEdit(false)}
                config={config}
                seed={seed}
                xp={xp}
                onSelect={handleSelect}
            />
        </View>
    );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root:        { flex: 1, backgroundColor: '#131f24' },
    hero:        { height: SH * 0.38, justifyContent: 'flex-end', overflow: 'hidden' },
    settingsBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20 },
    avatarWrap:  { alignItems: 'center', bottom: -8, overflow: 'hidden' },
    body:        { flex: 1 },
    nameBlock:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 22 },
    name:        { color: '#fff', fontSize: 26, fontWeight: '900' },
    email:       { color: '#77858f', fontSize: 13, fontWeight: '600', marginTop: 2 },
    joined:      { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 6 },
    editBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, marginTop: 4 },
    editBtnTxt:  { fontSize: 14, fontWeight: '900' },
    section:     { paddingHorizontal: 20, paddingVertical: 6 },
    divider:     { height: 1.5, backgroundColor: '#1e2d35', marginHorizontal: 20, marginVertical: 10 },
    sectionTitle:{ color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 14 },
    statsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    achRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    nextLvlCard: { flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1.5, borderColor: '#1e2d35', borderRadius: 18, padding: 18, overflow: 'hidden' },
    nextLvlName: { color: '#fff', fontSize: 17, fontWeight: '900' },
    nextLvlDesc: { color: '#77858f', fontSize: 13, fontWeight: '600', marginTop: 3 },
});

const sc = StyleSheet.create({
    card:    { width: (SW - 60) / 2, borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 8, overflow: 'hidden', marginBottom: 2 },
    iconWrap:{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    val:     { color: '#fff', fontSize: 20, fontWeight: '900' },
    lbl:     { color: '#77858f', fontSize: 13, fontWeight: '700' },
});

const ab = StyleSheet.create({
    wrap:  { width: (SW - 64) / 3, alignItems: 'center', backgroundColor: '#1a2832', borderRadius: 16, padding: 14, gap: 6, borderWidth: 1, borderColor: '#1e2d35' },
    locked:{ backgroundColor: '#131f24' },
    emoji: { fontSize: 30 },
    lbl:   { color: '#fff', fontSize: 11, fontWeight: '800', textAlign: 'center' },
});

const xpb = StyleSheet.create({
    wrap:     { gap: 8, paddingTop: 10 },
    header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    badge:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
    levelTxt: { fontSize: 13, fontWeight: '900' },
    nextTxt:  { color: '#77858f', fontSize: 12, fontWeight: '600' },
    track:    { height: 14, backgroundColor: '#1e2d35', borderRadius: 7, overflow: 'hidden' },
    fill:     { height: '100%', borderRadius: 7 },
    dots:     { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
    dot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1e2d35' },
});

const ed = StyleSheet.create({
    root:     { flex: 1, backgroundColor: '#0d1117' },
    header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1e2d35' },
    title:    { color: '#fff', fontSize: 18, fontWeight: '900' },
    closeBtn: { padding: 6, backgroundColor: '#1e2d35', borderRadius: 12 },
    preview:  { alignItems: 'center', justifyContent: 'flex-end', height: 200, overflow: 'hidden' },
    tabs:     { paddingHorizontal: 16, gap: 8, paddingVertical: 14 },
    tab:      { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: '#161b22' },
    tabOn:    { backgroundColor: 'rgba(139,92,246,0.2)', borderWidth: 1, borderColor: '#8b5cf6' },
    tabEmoji: { fontSize: 15 },
    tabLbl:   { color: '#77858f', fontSize: 12, fontWeight: '800' },
    grid:     { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, paddingBottom: 60 },
    card:     { aspectRatio: 0.9, borderRadius: 14, backgroundColor: '#161b22', borderWidth: 1, borderColor: '#1e2d35', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 6 },
    cardOn:   { borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.12)' },
    cardLocked:{ opacity: 0.5 },
    colorCircle:{ width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    optEmoji: { fontSize: 26 },
    optLbl:   { color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center' },
    xpPill:   { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(139,92,246,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    xpPillTxt:{ color: '#8b5cf6', fontSize: 9, fontWeight: '900' },
});
