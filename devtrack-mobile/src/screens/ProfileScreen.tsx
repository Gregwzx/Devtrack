// src/screens/ProfileScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    ScrollView, StyleSheet, View, Text, TouchableOpacity,
    TextInput, Modal, Pressable, Alert, Linking,
    ActivityIndicator, Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeInDown, FadeInUp,
    useSharedValue, useAnimatedStyle, withSpring,
    withTiming, withDelay, withSequence, interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    LogOut, Edit2, Link, Camera,
    Flame, BookOpen, Plus, X, Check, Save,
    RefreshCw, Trophy, Zap, Star, TrendingUp,
    Calendar, Award, ChevronRight, Clock, Sparkles, Settings, Lock
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { signOutUser } from '../services/authService';
import { getUserData, saveProfile } from '../services/userService';
import { kvGet, kvGetJson } from '../services/localDb';
import { AREA_CONFIG } from '../constants/areas';
import { formatAgo } from '../../utils/dateHelpers';
import type { StudyArea } from '../services/ai.service';
import type { Learning } from '../types/learning';
import AvatarDisplay from '../components/avatar/AvatarDisplay';
import AvatarShop from '../components/avatar/AvatarShop';
import type { CosmeticType, CosmeticItem } from '../data/avatars';
import { getAvatarLevel, getNextLevel, AVATAR_LEVELS } from '../data/avatars';
import { useParallaxScroll } from '../hooks/useParallaxScroll';

const { width: SCREEN_W } = Dimensions.get('window');

const C_BG = '#131f24';
const C_CARD = '#1a262c';
const C_BORDER = '#212b31';
const C_GOLD = '#ffc800';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SocialLink   { id: string; label: string; url: string; }
interface LearningItem { id: string; text: string; date: string; }
interface LocalProfile {
    bio: string;
    bannerColor: string;
    links: SocialLink[];
    equippedHat: string | null;
    equippedBadge: string | null;
    equippedBackground: string | null;
}

const DEFAULT_LOCAL: LocalProfile = {
    bio: '', bannerColor: '#1cb0f6', links: [], // Duolingo Cyan default
    equippedHat: null, equippedBadge: null, equippedBackground: null,
};

const BANNER_COLORS = [
    '#58cc02', '#1cb0f6', '#ce82ff', '#ff9600',
    '#ff4b4b', '#ffc800', '#2b70c9', '#000000',
];

// ─── Badges ───────────────────────────────────────────────────────────────────
interface Badge { id: string; label: string; desc: string; Icon: any; color: string; unlocked: boolean; }

function computeBadges(streak: number, learnings: number): Badge[] {
    return [
        { id: 'first',   label: 'Primeiro Passo', desc: '1º aprendizado',       Icon: Star,    color: '#ffc800', unlocked: learnings >= 1   },
        { id: 'week',    label: 'Semana Sólida',  desc: '7 dias de sequência',   Icon: Flame,   color: '#ff9600', unlocked: streak >= 7      },
        { id: 'scholar', label: 'Estudioso',       desc: '10 registros',          Icon: BookOpen,color: '#ce82ff', unlocked: learnings >= 10  },
        { id: 'month',   label: 'Mês Completo',   desc: '30 dias seguidos',      Icon: Trophy,  color: '#58cc02', unlocked: streak >= 30     },
        { id: 'master',  label: 'Mestre',          desc: '50 registros',          Icon: Award,   color: '#1cb0f6', unlocked: learnings >= 50  },
        { id: 'legend',  label: 'Lendário',        desc: '100 dias de sequência', Icon: Zap,     color: '#ff4b4b', unlocked: streak >= 100   },
    ];
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────
function buildHeatmap(learnings: LearningItem[]): { date: string; count: number }[][] {
    const countMap: Record<string, number> = {};
    for (const l of learnings) {
        const d = new Date(l.date).toDateString();
        countMap[d] = (countMap[d] ?? 0) + 1;
    }
    const weeks: { date: string; count: number }[][] = [];
    const today = new Date(); today.setHours(0,0,0,0);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay() - 69);
    for (let w = 0; w < 10; w++) {
        const week: { date: string; count: number }[] = [];
        for (let d = 0; d < 7; d++) {
            const cur = new Date(startDate);
            cur.setDate(startDate.getDate() + w * 7 + d);
            week.push({ date: cur.toDateString(), count: countMap[cur.toDateString()] ?? 0 });
        }
        weeks.push(week);
    }
    return weeks;
}

function heatColor(count: number) {
    if (count === 0) return '#212b31';
    if (count === 1) return '#d7ffb8';
    if (count === 2) return '#a5ed6e';
    if (count === 3) return '#58cc02';
    return '#58a700';
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ActivityHeatmap({ learnings }: { learnings: LearningItem[] }) {
    const grid  = buildHeatmap(learnings);
    const total = learnings.length;
    const days  = new Set(learnings.map(l => new Date(l.date).toDateString())).size;
    const CELL  = Math.floor((SCREEN_W - 32 - 18) / 10) - 2;

    return (
        <Animated.View entering={FadeInDown.delay(220).duration(500).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Atividade de Estudo</Text>
            </View>
            <View style={styles.heatmapCard}>
                <View style={styles.heatmapGrid}>
                    {grid.map((week, wi) => (
                        <View key={wi} style={styles.heatmapCol}>
                            {week.map((day, di) => (
                                <View key={di} style={[
                                    styles.heatmapCell,
                                    { width: CELL, height: CELL, backgroundColor: heatColor(day.count) },
                                ]} />
                            ))}
                        </View>
                    ))}
                </View>
            </View>
        </Animated.View>
    );
}

function BadgeCard({ badge, delay }: { badge: Badge; delay: number }) {
    const scale = useSharedValue(1);
    const glow  = useSharedValue(0);

    useEffect(() => {
        if (badge.unlocked) {
            glow.value = withDelay(delay + 300, withSequence(
                withTiming(1, { duration: 350 }),
                withTiming(0.5, { duration: 350 }),
                withTiming(0, { duration: 300 }),
            ));
        }
    }, []);

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Pressable
            onPressIn={() => (scale.value = withSpring(0.96))}
            onPressOut={() => (scale.value = withSpring(1))}
            style={{ width: '100%', marginBottom: 12 }}
        >
            <Animated.View
                entering={FadeInDown.delay(delay).duration(400).springify()}
                style={[
                    styles.badgeCard,
                    cardStyle,
                    !badge.unlocked && { opacity: 0.5, borderColor: '#212b31', borderBottomColor: '#161c20' }
                ]}
            >
                <View style={[styles.badgeIconWrap, { backgroundColor: badge.unlocked ? badge.color : '#37464f', borderBottomColor: badge.unlocked ? '#00000030' : '#212b31', borderBottomWidth: 3 }]}>
                    <badge.Icon size={22} color={badge.unlocked ? '#fff' : '#6b6880'} strokeWidth={badge.unlocked ? 2.5 : 2} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.badgeLabel, !badge.unlocked && styles.badgeLabelLocked]}>
                        {badge.label}
                    </Text>
                    <Text style={styles.badgeDesc}>{badge.desc}</Text>
                </View>
                
                <View style={styles.badgeProgressContainer}>
                    {badge.unlocked ? (
                        <Text style={styles.badgeCompleteText}>CONCLUÍDO</Text>
                    ) : (
                        <View style={styles.badgeLock}>
                            <Lock size={16} color="#6b6880" strokeWidth={2.5} />
                        </View>
                    )}
                </View>
            </Animated.View>
        </Pressable>
    );
}

function StatCard({ icon: Icon, color, value, label }: { icon: any, color: string, value: string | number, label: string }) {
    const scale = useSharedValue(1);
    const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    
    return (
        <Pressable 
            style={styles.statCardWrapper}
            onPressIn={() => (scale.value = withSpring(0.95))}
            onPressOut={() => (scale.value = withSpring(1))}
        >
            <Animated.View style={[styles.statCard, style]}>
                <View style={[styles.statIconWrap, { backgroundColor: color + '20' }]}>
                    <Icon size={24} color={color} strokeWidth={2.5} />
                </View>
                <View style={styles.statTextWrap}>
                    <Text style={styles.statValue}>{value}</Text>
                    <Text style={styles.statLabel}>{label}</Text>
                </View>
            </Animated.View>
        </Pressable>
    );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ visible, profile, onSave, onClose, saving }: {
    visible: boolean;
    profile: LocalProfile;
    onSave: (p: LocalProfile) => Promise<void>;
    onClose: () => void;
    saving: boolean;
}) {
    const [draft, setDraft]       = useState<LocalProfile>(profile);
    const [newLabel, setNewLabel] = useState('');
    const [newUrl, setNewUrl]     = useState('');
    const [tab, setTab]           = useState<'bio' | 'links' | 'banner'>('bio');

    useEffect(() => {
        if (visible) { setDraft(profile); setTab('bio'); }
    }, [profile, visible]);

    const addLink = () => {
        if (!newLabel.trim() || !newUrl.trim()) return;
        const url = newUrl.trim().startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`;
        setDraft(d => ({ ...d, links: [...d.links, { id: Date.now().toString(), label: newLabel.trim(), url }] }));
        setNewLabel(''); setNewUrl('');
    };

    const TABS = [
        { key: 'bio'    as const, label: 'Bio'    },
        { key: 'links'  as const, label: 'Links'  },
        { key: 'banner' as const, label: 'Visual' },
    ];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={editStyles.container} edges={['top','left','right']}>
                <View style={editStyles.header}>
                    <TouchableOpacity onPress={onClose} disabled={saving} style={editStyles.headerBtn}>
                        <Text style={editStyles.cancel}>FECHAR</Text>
                    </TouchableOpacity>
                    <Text style={editStyles.title}>EDITAR PERFIL</Text>
                    <TouchableOpacity onPress={() => onSave(draft)} disabled={saving} style={[editStyles.headerBtn, {alignItems: 'flex-end'}]}>
                        {saving
                            ? <ActivityIndicator size="small" color="#1cb0f6" />
                            : <Text style={editStyles.save}>SALVAR</Text>
                        }
                    </TouchableOpacity>
                </View>

                <View style={editStyles.tabs}>
                    {TABS.map(t => (
                        <TouchableOpacity
                            key={t.key}
                            style={[editStyles.tab, tab === t.key && editStyles.tabActive]}
                            onPress={() => setTab(t.key)}
                        >
                            <Text style={[editStyles.tabText, tab === t.key && editStyles.tabTextActive]}>
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView contentContainerStyle={editStyles.body} keyboardShouldPersistTaps="handled">
                    {tab === 'bio' && (
                        <>
                            <Text style={editStyles.label}>SUA BIO</Text>
                            <TextInput
                                style={[editStyles.input, { minHeight: 120, textAlignVertical: 'top' }]}
                                value={draft.bio}
                                onChangeText={v => setDraft(d => ({ ...d, bio: v }))}
                                placeholder="Adicione uma bio legal..."
                                placeholderTextColor="#4b5563"
                                multiline
                            />
                        </>
                    )}

                    {tab === 'links' && (
                        <>
                            <Text style={editStyles.label}>NOME DO LINK</Text>
                            <TextInput style={editStyles.input} value={newLabel} onChangeText={setNewLabel} placeholder="GitHub, LinkedIn..." placeholderTextColor="#4b5563" />
                            <Text style={editStyles.label}>URL</Text>
                            <TextInput style={editStyles.input} value={newUrl} onChangeText={setNewUrl} placeholder="github.com/usuario" placeholderTextColor="#4b5563" autoCapitalize="none" keyboardType="url" />
                            <TouchableOpacity style={editStyles.addBtn} onPress={addLink}>
                                <Text style={editStyles.addBtnText}>ADICIONAR LINK</Text>
                            </TouchableOpacity>
                            {draft.links.map(link => (
                                <View key={link.id} style={editStyles.linkItem}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={editStyles.linkLabel}>{link.label}</Text>
                                        <Text style={editStyles.linkUrl} numberOfLines={1}>{link.url}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setDraft(d => ({ ...d, links: d.links.filter(l => l.id !== link.id) }))} style={{ padding: 4 }}>
                                        <X size={20} color="#ff4b4b" strokeWidth={2.5} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </>
                    )}

                    {tab === 'banner' && (
                        <>
                            <Text style={editStyles.label}>COR DO BANNER</Text>
                            <View style={editStyles.colorGrid}>
                                {BANNER_COLORS.map(c => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[editStyles.colorSwatch, { backgroundColor: c }, draft.bannerColor === c && editStyles.colorSwatchSelected]}
                                        onPress={() => setDraft(d => ({ ...d, bannerColor: c }))}
                                    >
                                        {draft.bannerColor === c && <Check size={20} color="#fff" strokeWidth={3} />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
    const { user } = useAuth();
    const email = user?.email ?? '';

    const [local, setLocal]             = useState<LocalProfile>(DEFAULT_LOCAL);
    const [streak, setStreak]           = useState(user?.streak ?? 0);
    const [learnings, setLearnings]     = useState<Learning[]>([]);
    const [studyArea, setStudyArea]     = useState<StudyArea>((user?.studyArea as StudyArea) ?? 'fullstack');
    const [editVisible, setEditVisible] = useState(false);
    const [saving, setSaving]           = useState(false);
    const [loading, setLoading]         = useState(true);
    const [loadError, setLoadError]     = useState(false);
    const [shopVisible, setShopVisible] = useState(false);
    const [totalXp, setTotalXp]         = useState(0);

    const displayName   = user?.name ?? 'Dev';
    const badges        = computeBadges(streak, learnings.length);
    const unlockedCount = badges.filter(b => b.unlocked).length;
    const unlockedAchievements: string[] = [
        ...(learnings.length >= 1 ? ['first_learning'] : []),
        ...(streak >= 7 ? ['streak_7'] : []),
    ];

    // Chave do local profile (bio/links/banner) — exclusivo do ProfileScreen
    const localProfileKey = email ? `local_profile_${email}` : null;
    // Chave das chaves compartilhadas com useHomeData (baseadas em userId)
    const uid = user?.id ?? '';
    const sharedKeys = uid ? {
        streak:    `user_${uid}_streak`,
        learnings: `user_${uid}_learnings`,
        area:      `user_${uid}_area`,
        xp:        `user_${uid}_xp`,
    } : null;

    const loadData = useCallback(async () => {
        if (!sharedKeys) return;
        setLoading(true); setLoadError(false);
        try {
            // Lê perfil local (bio/links/banner) do AsyncStorage
            if (localProfileKey) {
                const profRaw = await AsyncStorage.getItem(localProfileKey);
                if (profRaw) setLocal(JSON.parse(profRaw));
            }

            // Lê streak, learnings, area e XP das chaves unificadas com useHomeData (expo-sqlite)
            const [streakData, cachedLearnings, areaRaw, xpRaw] = await Promise.all([
                kvGetJson<{ count: number }>(sharedKeys.streak),
                kvGetJson<Learning[]>(sharedKeys.learnings),
                kvGet(sharedKeys.area),
                kvGet(sharedKeys.xp),
            ]);

            if (streakData)       setStreak(streakData.count ?? 0);
            if (cachedLearnings)  setLearnings(cachedLearnings);
            if (areaRaw)          setStudyArea(areaRaw as StudyArea);
            if (xpRaw)            setTotalXp(parseInt(xpRaw, 10) || 0);
        } catch { setLoadError(true); }
        finally  { setLoading(false); }
    }, [uid, email]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSave = async (p: LocalProfile) => {
        if (!localProfileKey) return;
        setSaving(true);
        try {
            await AsyncStorage.setItem(localProfileKey, JSON.stringify(p));
            setLocal(p);
            setEditVisible(false);
        } catch (err) {
            Alert.alert('Erro', 'Não foi possível salvar o perfil.');
        } finally {
            setSaving(false);
        }
    };

    const handleEquip = async (item: CosmeticItem) => {
        const key = `equipped${item.type.charAt(0).toUpperCase() + item.type.slice(1)}` as keyof LocalProfile;
        const updated = { ...local, [key]: item.id };
        setLocal(updated);
        if (localProfileKey) await AsyncStorage.setItem(localProfileKey, JSON.stringify(updated));
    };

    const handleUnequip = async (type: CosmeticType) => {
        const key = `equipped${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof LocalProfile;
        const updated = { ...local, [key]: null };
        setLocal(updated);
        if (localProfileKey) await AsyncStorage.setItem(localProfileKey, JSON.stringify(updated));
    };

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Deseja sair?')) signOutUser();
        } else {
            Alert.alert('Sair', 'Deseja encerrar a sessão?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: signOutUser },
            ]);
        }
    };

    // Parallax hook para o header
    const {
        scrollHandler,
        titleStyle,
        subtitleStyle,
        collapsedTitleStyle,
        headerContainerStyle,
        headerBgStyle,
    } = useParallaxScroll();

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top','left','right']}>
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#1cb0f6" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top','left','right']}>

            {/* ── Header colapsável com paralaxe (mesmo do HomeScreen) ── */}
            <Animated.View style={[styles.headerContainer, headerContainerStyle]}>
                <Animated.View style={[styles.headerBg, headerBgStyle]} />

                {/* Expanded */}
                <Animated.View style={[styles.headerExpanded, titleStyle]}>
                    <Text style={styles.greeting}>Meu Perfil</Text>
                </Animated.View>

                {/* Collapsed */}
                <Animated.View style={[styles.headerCollapsed, collapsedTitleStyle]}>
                    <Text style={styles.headerCollapsedText}>Perfil</Text>
                </Animated.View>

                {/* Ações fixas */}
                <View style={styles.headerActionsFixed}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setShopVisible(true)}>
                        <Sparkles size={22} color="#1cb0f6" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setEditVisible(true)}>
                        <Settings size={22} color="#afb6b9" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleLogout}>
                        <LogOut size={22} color="#ff4b4b" strokeWidth={2.5} />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                {/* ── Card de Perfil (Banner + Avatar + Info) ── */}
                <Animated.View entering={FadeInUp.duration(500)} style={styles.profileCardWrap}>
                    <View style={styles.profileCard}>
                        {/* Banner interno do card */}
                        <View style={[styles.bannerWrap, { backgroundColor: local.bannerColor }]}>
                            <View style={styles.bannerOverlay} />
                        </View>

                        {/* Avatar e Infos */}
                        <View style={styles.heroSection}>
                            <View style={styles.avatarRing}>
                                <AvatarDisplay
                                    xp={totalXp}
                                    size={110}
                                    equippedHat={local.equippedHat ?? undefined}
                                    equippedBadge={local.equippedBadge ?? undefined}
                                    equippedBackground={local.equippedBackground ?? undefined}
                                    animated
                                />
                            </View>
                            
                            <TouchableOpacity style={styles.editAvatarBtn} onPress={() => setShopVisible(true)} activeOpacity={0.85}>
                                <Camera size={15} color="#fff" strokeWidth={2.5} />
                                <Text style={styles.editAvatarText}>Editar Avatar</Text>
                            </TouchableOpacity>

                            <Text style={styles.name}>{displayName}</Text>
                            <Text style={styles.email}>{email}</Text>
                            {local.bio ? <Text style={styles.bio}>{local.bio}</Text> : null}
                            
                            {local.links.length > 0 && (
                                <View style={styles.linksWrap}>
                                    {local.links.map(link => (
                                        <TouchableOpacity key={link.id} style={styles.linkChip} onPress={() => Linking.openURL(link.url)}>
                                            <Link size={13} color="#1cb0f6" strokeWidth={2.5} style={{ marginRight: 5 }} />
                                            <Text style={styles.linkChipText}>{link.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                </Animated.View>

                <View style={styles.divider} />

                {/* Estatísticas (Grid Duolingo) */}
                <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.section}>
                    <Text style={styles.sectionTitle}>Estatísticas</Text>
                    <View style={styles.statsGrid}>
                        <StatCard icon={Flame} color="#ff9600" value={streak} label="Ofensiva" />
                        <StatCard icon={Zap} color="#ffc800" value={totalXp} label="Total de XP" />
                        <StatCard icon={BookOpen} color="#ce82ff" value={learnings.length} label="Aprendizados" />
                        <StatCard icon={Trophy} color="#58cc02" value={unlockedCount} label="Conquistas" />
                    </View>
                </Animated.View>

                <View style={styles.divider} />

                {/* Conquistas */}
                <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Conquistas</Text>
                        <Text style={styles.sectionMeta}>{unlockedCount}/{badges.length}</Text>
                    </View>
                    <View style={styles.badgesList}>
                        {badges.map((badge, i) => (
                            <BadgeCard key={badge.id} badge={badge} delay={220 + i * 50} />
                        ))}
                    </View>
                </Animated.View>
                
                <View style={styles.divider} />

                {/* Heatmap */}
                <ActivityHeatmap learnings={learnings} />

            </Animated.ScrollView>

            <EditModal
                visible={editVisible}
                profile={local}
                onSave={handleSave}
                onClose={() => setEditVisible(false)}
                saving={saving}
            />

            <AvatarShop
                visible={shopVisible}
                onClose={() => setShopVisible(false)}
                xp={totalXp}
                unlockedAchievements={unlockedAchievements}
                equippedItems={{
                    hat: local.equippedHat ?? null,
                    badge: local.equippedBadge ?? null,
                    background: local.equippedBackground ?? null,
                    pose: null,
                    outfit: null,
                    accessory: null,
                }}
                onEquip={handleEquip}
                onUnequip={handleUnequip}
            />
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#131f24' },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    // Parallax Header
    headerContainer:    { overflow: 'hidden', justifyContent: 'center', paddingHorizontal: 16 },
    headerBg:           { ...StyleSheet.absoluteFillObject, backgroundColor: '#131f24' },
    headerExpanded:     { flexDirection: 'row', alignItems: 'center', position: 'absolute', left: 16, bottom: 10 },
    headerCollapsed:    { flexDirection: 'row', alignItems: 'center', position: 'absolute', left: 16, bottom: 14 },
    headerCollapsedText:{ color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
    greeting:           { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.4 },
    headerActionsFixed: { position: 'absolute', right: 16, bottom: 8, flexDirection: 'row', gap: 14, alignItems: 'center', zIndex: 10 },
    actionBtn:          { padding: 4 },

    // Main Scroll Content
    content: { paddingBottom: 48, paddingTop: 10 },
    
    // Profile Card (3D)
    profileCardWrap: { paddingHorizontal: 16, marginBottom: 24 },
    profileCard: {
        backgroundColor: '#16151d',
        borderRadius: 24,
        borderWidth: 2, borderColor: '#212b31',
        borderBottomWidth: 5, borderBottomColor: '#161c20',
        overflow: 'hidden', // to clip the banner corners
    },
    bannerWrap: {
        height: 120,
        width: '100%',
    },
    bannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    heroSection: {
        alignItems: 'center',
        marginTop: -54,
        paddingHorizontal: 20,
        paddingBottom: 24,
        gap: 6,
    },
    avatarRing: {
        borderRadius: 70,
        borderWidth: 4,
        borderColor: '#16151d', // Match card background
        overflow: 'hidden',
        marginBottom: 8,
    },
    editAvatarBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        backgroundColor: '#1cb0f6', borderRadius: 14,
        paddingHorizontal: 16, paddingVertical: 10,
        borderWidth: 0, borderBottomWidth: 4, borderBottomColor: '#1899d6',
        marginTop: -4,
        marginBottom: 10,
    },
    editAvatarText: { color: '#fff', fontSize: 13, fontWeight: '900' },
    name:  { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 0.3 },
    email: { color: '#afb6b9', fontSize: 13, fontWeight: '600' },
    bio:   { color: '#fff', fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 12, marginTop: 4 },
    linksWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 12 },
    linkChip: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 12, borderWidth: 2, borderColor: '#212b31',
        borderBottomWidth: 4, borderBottomColor: '#161c20',
        backgroundColor: '#131f24',
    },
    linkChipText: { color: '#1cb0f6', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },

    divider: { height: 2, backgroundColor: '#212b31', marginHorizontal: 16, marginVertical: 8 },

    section: { paddingHorizontal: 16, paddingVertical: 14 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 14 },
    sectionMeta: { color: '#afb6b9', fontSize: 13, fontWeight: '800' },

    // ── Stat cards 3D ──
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCardWrapper: { width: '48%' },
    statCard: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 14, borderRadius: 20,
        backgroundColor: '#16151d',
        borderWidth: 2, borderColor: '#212b31',
        borderBottomWidth: 5, borderBottomColor: '#161c20',
    },
    statIconWrap: {
        width: 40, height: 40, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    statTextWrap: { flex: 1 },
    statValue: { color: '#fff', fontSize: 16, fontWeight: '900' },
    statLabel: { color: '#afb6b9', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

    // ── Badge cards 3D ──
    badgesList: { gap: 12 },
    badgeCard: {
        backgroundColor: '#16151d',
        flexDirection: 'row', alignItems: 'center', gap: 14,
        padding: 16, borderRadius: 20,
        borderWidth: 2, borderColor: '#212b31',
        borderBottomWidth: 5, borderBottomColor: '#161c20',
    },
    badgeIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    badgeLabel: { color: '#fff', fontSize: 16, fontWeight: '900' },
    badgeLabelLocked: { color: '#afb6b9' },
    badgeDesc: { color: '#afb6b9', fontSize: 13, marginTop: 2 },
    badgeProgressContainer: { alignItems: 'center', justifyContent: 'center' },
    badgeCompleteText: { color: '#ffc800', fontSize: 10, fontWeight: '900' },
    badgeLock: { backgroundColor: '#212b31', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

    // ── Heatmap ──
    heatmapCard: {
        backgroundColor: '#16151d', borderRadius: 20,
        borderWidth: 2, borderColor: '#212b31',
        borderBottomWidth: 5, borderBottomColor: '#161c20',
        padding: 16,
    },
    sectionHeader: { marginBottom: 12 },
    heatmapGrid: { flexDirection: 'row', gap: 4 },
    heatmapCol:  { flexDirection: 'column', gap: 4 },
    heatmapCell: { borderRadius: 4 },
});

const editStyles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: C_BG },
    header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 2, borderBottomColor: '#212b31' },
    headerBtn:    { width: 80 },
    cancel:       { color: '#1cb0f6', fontSize: 13, fontWeight: '800' },
    title:        { color: '#fff', fontSize: 15, fontWeight: '900' },
    save:         { color: '#1cb0f6', fontSize: 13, fontWeight: '800' },
    tabs:         { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#212b31' },
    tab:          { flex: 1, paddingVertical: 14, alignItems: 'center' },
    tabActive:    { borderBottomWidth: 4, borderBottomColor: '#1cb0f6' },
    tabText:      { color: '#afb6b9', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
    tabTextActive:{ color: '#1cb0f6' },
    body:         { padding: 16, paddingBottom: 60 },
    label:        { color: '#afb6b9', fontSize: 12, fontWeight: '900', marginBottom: 8, marginTop: 16 },
    input:        { backgroundColor: '#212b31', borderRadius: 16, padding: 14, color: '#fff', fontSize: 15, fontWeight: '600', borderWidth: 2, borderColor: '#37464f', borderBottomWidth: 4, borderBottomColor: '#161c20' },

    addBtn:     { backgroundColor: '#1cb0f6', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 16, borderBottomWidth: 5, borderBottomColor: '#1899d6' },
    addBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    linkItem:   { backgroundColor: '#212b31', borderRadius: 16, padding: 14, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 2, borderColor: '#37464f', borderBottomWidth: 4, borderBottomColor: '#161c20' },
    linkLabel:  { color: '#fff', fontWeight: '800', fontSize: 14 },
    linkUrl:    { color: '#1cb0f6', fontSize: 12, marginTop: 2, fontWeight: '600' },

    colorGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
    colorSwatch:         { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'transparent', borderBottomWidth: 6, borderBottomColor: 'rgba(0,0,0,0.3)' },
    colorSwatchSelected: { borderColor: '#fff' },
});
