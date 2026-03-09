// src/screens/ProfileScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    ScrollView, StyleSheet, View, Text, TouchableOpacity,
    Image, TextInput, Modal, Pressable, Alert, Linking,
    ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeInDown, FadeInUp, FadeInLeft, FadeInRight,
    useSharedValue, useAnimatedStyle, withSpring,
    withTiming, withDelay, withSequence, interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import {
    LogOut, Edit2, Link, Image as ImageIcon, Flame, BookOpen,
    Plus, X, Check, Save, Code2, Server, Layers,
    RefreshCw, Trophy, Zap, Star, TrendingUp,
    Calendar, Award, ChevronRight, Clock, Camera,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { signOutUser } from '../services/authService';
import { getUserData, saveProfile, getStorageKeys } from '../services/userService';
import type { StudyArea } from '../services/ai.service';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
interface SocialLink   { id: string; label: string; url: string; }
interface LearningItem { id: string; text: string; date: string; }
interface LocalProfile {
    bio: string;
    photoURL: string | null; // URL remota (Firebase Storage) ou local temporária
    bannerColor: string;
    links: SocialLink[];
}

const DEFAULT_LOCAL: LocalProfile = {
    bio: '', photoURL: null, bannerColor: '#1a1040', links: [],
};

const BANNER_COLORS = [
    '#0d0b18','#1a1040','#13102a','#1e0a3a',
    '#0a0818','#160e30','#22104a','#0d0d10',
];

const AREA_CONFIG: Record<StudyArea, { label: string; Icon: any; color: string; bg: string }> = {
    frontend:  { label: 'Frontend',  Icon: Code2,  color: '#06b6d4', bg: '#06b6d412' },
    backend:   { label: 'Backend',   Icon: Server, color: '#10b981', bg: '#10b98112' },
    fullstack: { label: 'Fullstack', Icon: Layers, color: '#8b5cf6', bg: '#8b5cf612' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatAgo(date: Date): string {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60)  return `${mins}min atrás`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs}h atrás`;
    const days = Math.floor(hrs / 24);
    if (days < 7)   return `${days}d atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ─── Badges ───────────────────────────────────────────────────────────────────
interface Badge { id: string; label: string; desc: string; Icon: any; color: string; unlocked: boolean; }

function computeBadges(streak: number, learnings: number): Badge[] {
    return [
        { id: 'first',   label: 'Primeiro Passo', desc: '1º aprendizado',       Icon: Star,    color: '#f59e0b', unlocked: learnings >= 1   },
        { id: 'week',    label: 'Semana Sólida',  desc: '7 dias de sequência',   Icon: Flame,   color: '#ef4444', unlocked: streak >= 7      },
        { id: 'scholar', label: 'Estudioso',       desc: '10 registros',          Icon: BookOpen,color: '#8b5cf6', unlocked: learnings >= 10  },
        { id: 'month',   label: 'Mês Completo',   desc: '30 dias seguidos',      Icon: Trophy,  color: '#FFD700', unlocked: streak >= 30     },
        { id: 'master',  label: 'Mestre',          desc: '50 registros',          Icon: Award,   color: '#06b6d4', unlocked: learnings >= 50  },
        { id: 'legend',  label: 'Lendário',        desc: '100 dias de sequência', Icon: Zap,     color: '#10b981', unlocked: streak >= 100   },
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
    if (count === 0) return '#1a1826';
    if (count === 1) return '#3b1f7a';
    if (count === 2) return '#5b2fa0';
    if (count === 3) return '#7c3aed';
    return '#a855f7';
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ActivityHeatmap({ learnings }: { learnings: LearningItem[] }) {
    const grid  = buildHeatmap(learnings);
    const total = learnings.length;
    const days  = new Set(learnings.map(l => new Date(l.date).toDateString())).size;
    const CELL  = Math.floor((SCREEN_W - 48 - 18) / 10) - 2;

    return (
        <Animated.View entering={FadeInDown.delay(220).duration(500).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
                <Calendar size={15} color="#8b5cf6" strokeWidth={2} />
                <Text style={styles.sectionTitle}>Atividade</Text>
                <Text style={styles.sectionMeta}>{total} registros · {days} dias ativos</Text>
            </View>
            <View style={styles.card}>
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
                <View style={styles.heatmapLegend}>
                    <Text style={styles.heatmapLegendTxt}>Menos</Text>
                    {[0,1,2,3,4].map(v => (
                        <View key={v} style={[styles.heatmapLegendCell, { backgroundColor: heatColor(v) }]} />
                    ))}
                    <Text style={styles.heatmapLegendTxt}>Mais</Text>
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
        shadowOpacity: interpolate(glow.value, [0,1], [badge.unlocked ? 0.15 : 0, 0.5], Extrapolation.CLAMP),
    }));

    return (
        <Pressable
            onPressIn={() => (scale.value = withSpring(0.94))}
            onPressOut={() => (scale.value = withSpring(1))}
        >
            <Animated.View
                entering={FadeInDown.delay(delay).duration(400).springify()}
                style={[
                    styles.badgeCard,
                    badge.unlocked && { borderColor: badge.color + '45', backgroundColor: badge.color + '0c', shadowColor: badge.color },
                    cardStyle,
                ]}
            >
                <View style={[styles.badgeIconWrap, { backgroundColor: badge.unlocked ? badge.color + '22' : '#1a1826' }]}>
                    <badge.Icon size={22} color={badge.unlocked ? badge.color : '#2a2040'} strokeWidth={badge.unlocked ? 2 : 1.5} />
                </View>
                <Text style={[styles.badgeLabel, !badge.unlocked && styles.badgeLabelLocked]} numberOfLines={1}>
                    {badge.label}
                </Text>
                <Text style={styles.badgeDesc} numberOfLines={2}>{badge.desc}</Text>
                {badge.unlocked && <View style={[styles.badgeDot, { backgroundColor: badge.color }]} />}
            </Animated.View>
        </Pressable>
    );
}

function AnimatedBar({ label, value, max, color, delay }: {
    label: string; value: number; max: number; color: string; delay: number;
}) {
    const progress = useSharedValue(0);
    const pct = Math.min(value / max, 1);

    useEffect(() => {
        progress.value = withDelay(delay, withSpring(pct, { damping: 16, stiffness: 80 }));
    }, [pct]);

    const barStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%` as any,
    }));

    return (
        <View style={styles.barRow}>
            <Text style={styles.barLabel}>{label}</Text>
            <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, { backgroundColor: color }, barStyle]} />
            </View>
            <Text style={[styles.barValue, { color }]}>{value}</Text>
        </View>
    );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ visible, profile, onSave, onClose, saving }: {
    visible: boolean;
    profile: LocalProfile;
    onSave: (p: LocalProfile, localPhotoUri?: string) => Promise<void>;
    onClose: () => void;
    saving: boolean;
}) {
    const [draft, setDraft]           = useState<LocalProfile>(profile);
    const [localPhotoUri, setLocalPhotoUri] = useState<string | undefined>(undefined);
    const [newLabel, setNewLabel]     = useState('');
    const [newUrl, setNewUrl]         = useState('');
    const [tab, setTab]               = useState<'bio' | 'links' | 'banner'>('bio');

    useEffect(() => {
        if (visible) {
            setDraft(profile);
            setLocalPhotoUri(undefined);
            setTab('bio');
        }
    }, [profile, visible]);

    const pickAvatar = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert('Permissão necessária', 'Permita o acesso à galeria para trocar a foto.');
            return;
        }
        const r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!r.canceled) {
            const uri = r.assets[0].uri;
            setLocalPhotoUri(uri);
            setDraft(d => ({ ...d, photoURL: uri })); // preview local
        }
    };

    const takePhoto = async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
            Alert.alert('Permissão necessária', 'Permita o acesso à câmera para tirar uma foto.');
            return;
        }
        const r = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!r.canceled) {
            const uri = r.assets[0].uri;
            setLocalPhotoUri(uri);
            setDraft(d => ({ ...d, photoURL: uri }));
        }
    };

    const addLink = () => {
        if (!newLabel.trim() || !newUrl.trim()) return;
        const url = newUrl.trim().startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`;
        setDraft(d => ({ ...d, links: [...d.links, { id: Date.now().toString(), label: newLabel.trim(), url }] }));
        setNewLabel(''); setNewUrl('');
    };

    const TABS = [
        { key: 'bio'    as const, label: 'Perfil'  },
        { key: 'links'  as const, label: 'Links'   },
        { key: 'banner' as const, label: 'Visual'  },
    ];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={editStyles.container} edges={['top','left','right']}>
                <View style={editStyles.header}>
                    <TouchableOpacity onPress={onClose} disabled={saving}>
                        <Text style={editStyles.cancel}>Cancelar</Text>
                    </TouchableOpacity>
                    <Text style={editStyles.title}>Editar Perfil</Text>
                    <TouchableOpacity
                        onPress={() => onSave(draft, localPhotoUri)}
                        disabled={saving}
                        style={editStyles.saveBtn}
                    >
                        {saving
                            ? <ActivityIndicator size="small" color="#8b5cf6" />
                            : <><Save size={14} color="#8b5cf6" strokeWidth={2.5} /><Text style={editStyles.save}>Salvar</Text></>
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
                            {/* Avatar picker */}
                            <View style={editStyles.avatarSection}>
                                <View style={editStyles.avatarWrap}>
                                    {draft.photoURL
                                        ? <Image source={{ uri: draft.photoURL }} style={editStyles.avatarPreview} />
                                        : <View style={editStyles.avatarPlaceholder}>
                                            <ImageIcon size={28} color="#7a7590" strokeWidth={1.5} />
                                          </View>
                                    }
                                </View>
                                <View style={editStyles.avatarBtns}>
                                    <TouchableOpacity style={editStyles.photoBtn} onPress={pickAvatar}>
                                        <ImageIcon size={14} color="#8b5cf6" strokeWidth={2} />
                                        <Text style={editStyles.photoBtnText}>Galeria</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={editStyles.photoBtn} onPress={takePhoto}>
                                        <Camera size={14} color="#8b5cf6" strokeWidth={2} />
                                        <Text style={editStyles.photoBtnText}>Câmera</Text>
                                    </TouchableOpacity>
                                </View>
                                {localPhotoUri && (
                                    <Text style={editStyles.uploadHint}>
                                        📤 A foto será enviada ao salvar
                                    </Text>
                                )}
                            </View>

                            <Text style={editStyles.label}>Bio</Text>
                            <TextInput
                                style={[editStyles.input, { minHeight: 90, textAlignVertical: 'top' }]}
                                value={draft.bio}
                                onChangeText={v => setDraft(d => ({ ...d, bio: v }))}
                                placeholder="Suas tecnologias, objetivos..."
                                placeholderTextColor="#444"
                                multiline
                            />
                        </>
                    )}

                    {tab === 'links' && (
                        <>
                            <Text style={editStyles.label}>Label</Text>
                            <TextInput style={editStyles.input} value={newLabel} onChangeText={setNewLabel} placeholder="GitHub, LinkedIn..." placeholderTextColor="#444" />
                            <Text style={editStyles.label}>URL</Text>
                            <TextInput style={editStyles.input} value={newUrl} onChangeText={setNewUrl} placeholder="github.com/usuario" placeholderTextColor="#444" autoCapitalize="none" keyboardType="url" />
                            <TouchableOpacity style={editStyles.addBtn} onPress={addLink}>
                                <Plus size={16} color="#fff" strokeWidth={2.5} />
                                <Text style={editStyles.addBtnText}>Adicionar link</Text>
                            </TouchableOpacity>
                            {draft.links.map(link => (
                                <View key={link.id} style={editStyles.linkItem}>
                                    <View style={editStyles.linkDot} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={editStyles.linkLabel}>{link.label}</Text>
                                        <Text style={editStyles.linkUrl} numberOfLines={1}>{link.url}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setDraft(d => ({ ...d, links: d.links.filter(l => l.id !== link.id) }))} style={{ padding: 4 }}>
                                        <X size={15} color="#e05c7a" strokeWidth={2} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </>
                    )}

                    {tab === 'banner' && (
                        <>
                            <Text style={editStyles.label}>Cor do banner</Text>
                            <View style={editStyles.colorGrid}>
                                {BANNER_COLORS.map(c => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[editStyles.colorSwatch, { backgroundColor: c }, draft.bannerColor === c && editStyles.colorSwatchSelected]}
                                        onPress={() => setDraft(d => ({ ...d, bannerColor: c }))}
                                    >
                                        {draft.bannerColor === c && <Check size={16} color="#8b5cf6" strokeWidth={2.5} />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={editStyles.label}>Preview</Text>
                            <View style={[editStyles.preview, { backgroundColor: draft.bannerColor }]}>
                                <View style={editStyles.previewDots}>
                                    {[...Array(12)].map((_,i) => <View key={i} style={editStyles.previewDot} />)}
                                </View>
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
    const [streak, setStreak]           = useState(0);
    const [learnings, setLearnings]     = useState<LearningItem[]>([]);
    const [studyArea, setStudyArea]     = useState<StudyArea>('fullstack');
    const [editVisible, setEditVisible] = useState(false);
    const [saving, setSaving]           = useState(false);
    const [loading, setLoading]         = useState(true);
    const [loadError, setLoadError]     = useState(false);
    const [expanded, setExpanded]       = useState(false);

    const displayName   = user?.displayName ?? 'Dev';
    const initials      = displayName.split(' ').slice(0,2).map((n: string) => n[0]).join('').toUpperCase();
    const areaConfig    = AREA_CONFIG[studyArea];
    const badges        = computeBadges(streak, learnings.length);
    const unlockedCount = badges.filter(b => b.unlocked).length;
    const shownLearnings = expanded ? learnings.slice(0,10) : learnings.slice(0,3);

    // Usa chaves baseadas no email — dados isolados por conta
    const keys = email ? getStorageKeys(email) : null;

    const loadData = useCallback(async () => {
        if (!keys) return;
        setLoading(true); setLoadError(false);
        try {
            const [profRaw, streakRaw, learnRaw, areaRaw] = await Promise.all([
                AsyncStorage.getItem(keys.profile),
                AsyncStorage.getItem(keys.streak),
                AsyncStorage.getItem(keys.learnings),
                AsyncStorage.getItem(keys.area),
            ]);

            if (profRaw)   setLocal(JSON.parse(profRaw));
            if (streakRaw) setStreak(JSON.parse(streakRaw).count ?? 0);
            if (learnRaw)  setLearnings(JSON.parse(learnRaw));
            if (areaRaw)   setStudyArea(areaRaw as StudyArea);

            // Tenta sincronizar com Firestore
            if (user?.uid) {
                const remote = await getUserData(user.uid, email);
                if (remote) {
                    setLocal(prev => ({
                        ...prev,
                        bio:      prev.bio      || remote.bio      || '',
                        photoURL: prev.photoURL || remote.photoURL || null,
                        links:    prev.links.length ? prev.links : (remote.links ?? []),
                        bannerColor: prev.bannerColor !== '#1a1040' ? prev.bannerColor : (remote.bannerColor ?? '#1a1040'),
                    }));
                    if (remote.streak > 0)            setStreak(remote.streak);
                    if (remote.learnings?.length > 0) setLearnings(remote.learnings);
                    if (remote.studyArea)             setStudyArea(remote.studyArea);
                }
            }
        } catch { setLoadError(true); }
        finally  { setLoading(false); }
    }, [user?.uid, email]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSave = async (p: LocalProfile, localPhotoUri?: string) => {
        if (!user?.uid || !keys) return;
        setSaving(true);
        try {
            // saveProfile faz upload da foto se tiver URI local e retorna a URL final
            const finalPhotoURL = await saveProfile(user.uid, email, {
                bio:         p.bio,
                photoURL:    p.photoURL,
                bannerColor: p.bannerColor,
                links:       p.links,
                localPhotoUri,
            });

            const updated: LocalProfile = {
                ...p,
                photoURL: finalPhotoURL ?? p.photoURL,
            };

            // Persiste local com chave do email
            await AsyncStorage.setItem(keys.profile, JSON.stringify(updated));
            setLocal(updated);
            setEditVisible(false);
        } catch (err) {
            console.error(err);
            Alert.alert('Erro', 'Não foi possível salvar o perfil.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Sair', 'Deseja encerrar a sessão?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sair', style: 'destructive', onPress: signOutUser },
        ]);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top','left','right']}>
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                    <Text style={styles.loadingText}>Carregando perfil...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top','left','right']}>
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* Banner */}
                <Animated.View entering={FadeInUp.duration(500)}>
                    <View style={[styles.banner, { backgroundColor: local.bannerColor }]}>
                        <View style={styles.bannerPattern}>
                            {[...Array(24)].map((_,i) => (
                                <Animated.View key={i} entering={FadeInDown.delay(i * 25).duration(350)} style={styles.bannerDot} />
                            ))}
                        </View>
                    </View>
                </Animated.View>

                {/* Avatar row */}
                <View style={styles.avatarRow}>
                    <Animated.View entering={FadeInLeft.delay(80).duration(500).springify()} style={styles.avatarWrap}>
                        {local.photoURL
                            ? <Image source={{ uri: local.photoURL }} style={styles.avatar} />
                            : <View style={styles.avatarFallback}>
                                <Text style={styles.avatarInitials}>{initials}</Text>
                              </View>
                        }
                        <View style={styles.streakBadge}>
                            <Flame size={10} color="#fff" strokeWidth={2} />
                            <Text style={styles.streakBadgeTxt}>{streak}</Text>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInRight.delay(80).duration(500)} style={styles.avatarActions}>
                        {loadError && (
                            <TouchableOpacity style={styles.iconBtn} onPress={loadData}>
                                <RefreshCw size={15} color="#f87171" strokeWidth={2} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.iconBtn} onPress={() => setEditVisible(true)}>
                            <Edit2 size={16} color="#fff" strokeWidth={2} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDanger]} onPress={handleLogout}>
                            <LogOut size={16} color="#e05c7a" strokeWidth={2} />
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* Identity */}
                <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.identity}>
                    <Text style={styles.name}>{displayName}</Text>
                    <Text style={styles.email}>{email}</Text>
                    {local.bio
                        ? <Text style={styles.bio}>{local.bio}</Text>
                        : <TouchableOpacity onPress={() => setEditVisible(true)}>
                            <Text style={styles.bioPlaceholder}>Toque para adicionar uma bio...</Text>
                          </TouchableOpacity>
                    }
                    <View style={[styles.areaChip, { borderColor: areaConfig.color + '45', backgroundColor: areaConfig.bg }]}>
                        <areaConfig.Icon size={12} color={areaConfig.color} strokeWidth={2} />
                        <Text style={[styles.areaChipText, { color: areaConfig.color }]}>{areaConfig.label}</Text>
                    </View>
                </Animated.View>

                {/* Stat cards */}
                <View style={styles.statsGrid}>
                    {[
                        { label: 'Streak',     value: streak,           Icon: Flame,    color: '#8b5cf6', suffix: 'd', delay: 140 },
                        { label: 'Registros',  value: learnings.length, Icon: BookOpen, color: '#06b6d4', suffix: '',  delay: 200 },
                        { label: 'Conquistas', value: unlockedCount,    Icon: Trophy,   color: '#f59e0b', suffix: '',  delay: 260 },
                    ].map((s, i) => (
                        <Animated.View key={i} entering={FadeInDown.delay(s.delay).duration(400).springify()} style={styles.statCard}>
                            <s.Icon size={16} color={s.color} strokeWidth={2} style={{ marginBottom: 6 }} />
                            <Text style={[styles.statValue, { color: s.color }]}>{s.value}{s.suffix}</Text>
                            <Text style={styles.statLabel}>{s.label}</Text>
                        </Animated.View>
                    ))}
                </View>

                {/* Progress bars */}
                <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <TrendingUp size={15} color="#8b5cf6" strokeWidth={2} />
                        <Text style={styles.sectionTitle}>Progresso</Text>
                    </View>
                    <View style={styles.card}>
                        <AnimatedBar label="Sequência"    value={streak}           max={30} color="#8b5cf6" delay={300} />
                        <AnimatedBar label="Aprendizados" value={learnings.length} max={50} color="#06b6d4" delay={380} />
                        <AnimatedBar label="Conquistas"   value={unlockedCount}    max={6}  color="#f59e0b" delay={460} />
                    </View>
                </Animated.View>

                {/* Heatmap */}
                <ActivityHeatmap learnings={learnings} />

                {/* Badges */}
                <Animated.View entering={FadeInDown.delay(260).duration(500)} style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Trophy size={15} color="#8b5cf6" strokeWidth={2} />
                        <Text style={styles.sectionTitle}>Conquistas</Text>
                        <Text style={styles.sectionMeta}>{unlockedCount}/{badges.length}</Text>
                    </View>
                    <View style={styles.badgesGrid}>
                        {badges.map((badge, i) => (
                            <BadgeCard key={badge.id} badge={badge} delay={280 + i * 60} />
                        ))}
                    </View>
                </Animated.View>

                {/* Recent learnings */}
                {learnings.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(320).duration(500)} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <BookOpen size={15} color="#8b5cf6" strokeWidth={2} />
                            <Text style={styles.sectionTitle}>Últimos Aprendizados</Text>
                            <Text style={styles.sectionMeta}>{learnings.length} total</Text>
                        </View>
                        <View style={styles.card}>
                            {shownLearnings.map((item, i) => (
                                <Animated.View
                                    key={item.id}
                                    entering={FadeInLeft.delay(320 + i * 45).duration(350)}
                                    style={[styles.learnItem, i < shownLearnings.length - 1 && styles.learnItemBorder]}
                                >
                                    <View style={styles.learnDot} />
                                    <View style={styles.learnContent}>
                                        <Text style={styles.learnText}>{item.text}</Text>
                                        <View style={styles.learnMeta}>
                                            <Clock size={10} color="#44415a" strokeWidth={2} />
                                            <Text style={styles.learnDate}>{formatAgo(new Date(item.date))}</Text>
                                        </View>
                                    </View>
                                </Animated.View>
                            ))}
                            {learnings.length > 3 && (
                                <TouchableOpacity style={styles.expandBtn} onPress={() => setExpanded(e => !e)}>
                                    <Text style={styles.expandBtnText}>
                                        {expanded ? 'Ver menos' : `Ver mais ${learnings.length - 3}`}
                                    </Text>
                                    <ChevronRight size={14} color="#8b5cf6" strokeWidth={2}
                                        style={{ transform: [{ rotate: expanded ? '-90deg' : '90deg' }] }} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animated.View>
                )}

                {/* Links */}
                {local.links.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(360).duration(500)} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Link size={15} color="#8b5cf6" strokeWidth={2} />
                            <Text style={styles.sectionTitle}>Links</Text>
                        </View>
                        <View style={styles.linksWrap}>
                            {local.links.map(link => (
                                <TouchableOpacity key={link.id} style={styles.linkChip} onPress={() => Linking.openURL(link.url)}>
                                    <Text style={styles.linkChipText}>{link.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>
                )}

                {/* Streak detail */}
                <Animated.View entering={FadeInDown.delay(390).duration(500)} style={[styles.section, { marginBottom: 48 }]}>
                    <View style={styles.sectionHeader}>
                        <Flame size={15} color="#8b5cf6" strokeWidth={2} />
                        <Text style={styles.sectionTitle}>Sequência de estudos</Text>
                    </View>
                    <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', padding: 18 }]}>
                        <View style={styles.streakCircle}>
                            <Text style={styles.streakNum}>{streak}</Text>
                            <Text style={styles.streakUnit}>dias</Text>
                        </View>
                        <View style={styles.streakRight}>
                            <Text style={styles.streakStatus}>
                                {streak === 0 ? 'Nenhuma sequência ativa' :
                                 streak < 7   ? 'Sequência iniciando' :
                                 streak < 30  ? 'Ritmo consistente' : 'Sequência lendária'}
                            </Text>
                            <View style={styles.streakDots}>
                                {[...Array(7)].map((_,i) => (
                                    <View key={i} style={[styles.dot, i < Math.min(streak,7) && styles.dotActive]} />
                                ))}
                            </View>
                            <Text style={styles.streakHint}>
                                {streak > 0
                                    ? `${streak} dia${streak !== 1 ? 's' : ''} consecutivo${streak !== 1 ? 's' : ''}`
                                    : 'Registre um aprendizado para começar'}
                            </Text>
                        </View>
                    </View>
                </Animated.View>

            </ScrollView>

            <EditModal
                visible={editVisible}
                profile={local}
                onSave={handleSave}
                onClose={() => setEditVisible(false)}
                saving={saving}
            />
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#0d0d10' },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: '#6b6880', fontSize: 14 },

    banner:        { width: '100%', height: 130 },
    bannerPattern: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12, opacity: 0.15 },
    bannerDot:     { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff' },

    avatarRow:      { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: -44, marginBottom: 12 },
    avatarWrap:     { position: 'relative' },
    avatar:         { width: 86, height: 86, borderRadius: 43, borderWidth: 3, borderColor: '#0d0d10' },
    avatarFallback: { width: 86, height: 86, borderRadius: 43, backgroundColor: '#8b5cf6', borderWidth: 3, borderColor: '#0d0d10', alignItems: 'center', justifyContent: 'center' },
    avatarInitials: { color: '#fff', fontSize: 28, fontWeight: '800' },
    streakBadge:    { position: 'absolute', bottom: 0, right: -4, backgroundColor: '#1a1826', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 2, borderColor: '#0d0d10', flexDirection: 'row', alignItems: 'center', gap: 3 },
    streakBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
    avatarActions:  { flexDirection: 'row', gap: 8 },
    iconBtn:        { backgroundColor: '#1a1826', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#2a2040' },
    iconBtnDanger:  { borderColor: '#3a1a24' },

    identity:       { paddingHorizontal: 16, marginBottom: 16 },
    name:           { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    email:          { color: '#6b6880', fontSize: 13, marginTop: 2 },
    bio:            { color: '#9aa0aa', fontSize: 14, marginTop: 8, lineHeight: 20 },
    bioPlaceholder: { color: '#3a3460', fontSize: 13, marginTop: 8, fontStyle: 'italic' },
    areaChip:       { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, marginTop: 10, alignSelf: 'flex-start' },
    areaChipText:   { fontSize: 12, fontWeight: '700' },

    statsGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 24 },
    statCard:  { flex: 1, backgroundColor: '#16151d', borderRadius: 18, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2a2040' },
    statValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
    statLabel: { color: '#6b6880', fontSize: 11, marginTop: 3, fontWeight: '500' },

    section:       { paddingHorizontal: 16, marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle:  { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
    sectionMeta:   { color: '#44415a', fontSize: 11, fontWeight: '600' },
    card:          { backgroundColor: '#16151d', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#2a2040', gap: 14 },

    barRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
    barLabel: { color: '#7a7590', fontSize: 12, width: 96 },
    barTrack: { flex: 1, height: 6, backgroundColor: '#1a1826', borderRadius: 3, overflow: 'hidden' },
    barFill:  { height: '100%', borderRadius: 3 },
    barValue: { fontSize: 12, fontWeight: '700', width: 28, textAlign: 'right' },

    heatmapGrid:       { flexDirection: 'row', gap: 2 },
    heatmapCol:        { flexDirection: 'column', gap: 2 },
    heatmapCell:       { borderRadius: 2 },
    heatmapLegend:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, justifyContent: 'flex-end' },
    heatmapLegendTxt:  { color: '#44415a', fontSize: 10 },
    heatmapLegendCell: { width: 10, height: 10, borderRadius: 2 },

    badgesGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    badgeCard:        { width: (SCREEN_W - 32 - 20) / 3, backgroundColor: '#16151d', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2a2040', shadowRadius: 10, elevation: 4 },
    badgeIconWrap:    { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    badgeLabel:       { color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center', marginBottom: 3 },
    badgeLabelLocked: { color: '#2a2040' },
    badgeDesc:        { color: '#6b6880', fontSize: 9, textAlign: 'center', lineHeight: 12 },
    badgeDot:         { width: 5, height: 5, borderRadius: 2.5, marginTop: 6 },

    learnItem:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    learnItemBorder: { paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1e1c2e' },
    learnDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8b5cf6', marginTop: 5, flexShrink: 0 },
    learnContent:    { flex: 1 },
    learnText:       { color: '#d4d0e8', fontSize: 13, lineHeight: 19 },
    learnMeta:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    learnDate:       { color: '#44415a', fontSize: 10 },
    expandBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 4 },
    expandBtnText:   { color: '#8b5cf6', fontSize: 13, fontWeight: '600' },

    linksWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    linkChip:     { backgroundColor: '#16151d', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#2a2040' },
    linkChipText: { color: '#d4d0e8', fontSize: 13, fontWeight: '600' },

    streakCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center', marginRight: 16, shadowColor: '#8b5cf6', shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
    streakNum:    { color: '#fff', fontSize: 24, fontWeight: '900', lineHeight: 26 },
    streakUnit:   { color: '#fff', fontSize: 11, opacity: 0.85, fontWeight: '600' },
    streakRight:  { flex: 1 },
    streakStatus: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 10 },
    streakDots:   { flexDirection: 'row', gap: 5, marginBottom: 8 },
    dot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2a2040' },
    dotActive:    { backgroundColor: '#8b5cf6' },
    streakHint:   { color: '#6b6880', fontSize: 12 },
});

const editStyles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: '#0d0d10' },
    header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a2040' },
    cancel:       { color: '#7a7590', fontSize: 15 },
    title:        { color: '#fff', fontSize: 17, fontWeight: '700' },
    saveBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
    save:         { color: '#8b5cf6', fontSize: 15, fontWeight: '700' },
    tabs:         { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#2a2040' },
    tab:          { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabActive:    { borderBottomWidth: 2, borderBottomColor: '#8b5cf6' },
    tabText:      { color: '#7a7590', fontSize: 14, fontWeight: '600' },
    tabTextActive:{ color: '#8b5cf6' },
    body:         { padding: 16, paddingBottom: 60 },
    label:        { color: '#7a7590', fontSize: 11, fontWeight: '600', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
    input:        { backgroundColor: '#1a1826', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#2a2040' },

    // Avatar
    avatarSection:      { alignItems: 'center', gap: 14, marginTop: 8, marginBottom: 4 },
    avatarWrap:         { position: 'relative' },
    avatarPreview:      { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: '#2a2040' },
    avatarPlaceholder:  { width: 96, height: 96, borderRadius: 48, backgroundColor: '#1a1826', borderWidth: 2, borderColor: '#2a2040', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
    avatarBtns:         { flexDirection: 'row', gap: 10 },
    photoBtn:           { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1a1826', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#2a2040' },
    photoBtnText:       { color: '#8b5cf6', fontWeight: '700', fontSize: 13 },
    uploadHint:         { color: '#6b6880', fontSize: 11 },

    addBtn:     { backgroundColor: '#8b5cf6', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    linkItem:   { backgroundColor: '#1a1826', borderRadius: 12, padding: 14, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#2a2040' },
    linkDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8b5cf6', flexShrink: 0 },
    linkLabel:  { color: '#fff', fontWeight: '600', fontSize: 14 },
    linkUrl:    { color: '#7a7590', fontSize: 12, marginTop: 2 },

    colorGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
    colorSwatch:         { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
    colorSwatchSelected: { borderColor: '#8b5cf6' },
    preview:             { height: 72, borderRadius: 14, overflow: 'hidden', marginTop: 4 },
    previewDots:         { flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10, opacity: 0.2 },
    previewDot:          { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff' },
});