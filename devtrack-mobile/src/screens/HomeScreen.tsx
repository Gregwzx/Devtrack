// src/screens/HomeScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    ScrollView, StyleSheet, View, Text, TouchableOpacity,
    Pressable, Alert,
} from 'react-native';
import AddLearningModal from '../components/home/AddLearningModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeInDown, FadeInUp,
    useSharedValue, useAnimatedStyle,
    withSpring, withRepeat, withTiming, withDelay,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Line, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Flame, BarChart2, Brain, Cpu, Plus,
    Zap, Lightbulb, BookOpen,
    RefreshCw, AlertCircle, Trash2, Clock,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { getAIResult, StudyArea, AIResult } from '../services/ai.service';
import { saveStreak, saveLearnings, getStorageKeys } from '../services/userService';
import { AREA_CONFIG } from '../constants/areas';
import { todayKey, yesterdayKey, formatHeaderDate, formatAgo } from '../../utils/dateHelpers';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StreakData { count: number; lastDate: string | null; }
interface Learning  { id: string; text: string; date: string; }
interface Stats     { totalHours: number; skills: number; learnings: number; }

// ─── Timezone-safe streak ─────────────────────────────────────────────────────
async function checkAndUpdateStreak(streakKey: string, uid?: string, email?: string): Promise<StreakData> {
    const today     = todayKey();
    const yesterday = yesterdayKey();

    const raw = await AsyncStorage.getItem(streakKey);
    const streak: StreakData = raw ? JSON.parse(raw) : { count: 0, lastDate: null };

    if (streak.lastDate === today) return streak;

    const newCount = streak.lastDate === yesterday ? streak.count + 1 : 1;
    const updated: StreakData = { count: newCount, lastDate: today };

    await AsyncStorage.setItem(streakKey, JSON.stringify(updated));
    if (uid && email) await saveStreak(uid, email, newCount, today);
    return updated;
}

// ─── Session timer ────────────────────────────────────────────────────────────
async function getSessionHours(sessionKey: string): Promise<number> {
    const raw = await AsyncStorage.getItem(sessionKey);
    if (!raw) {
        await AsyncStorage.setItem(sessionKey, Date.now().toString());
        return 0;
    }
    const elapsed = (Date.now() - Number(raw)) / 3_600_000;
    return Math.round(elapsed * 10) / 10;
}

// ─── Speedometer ─────────────────────────────────────────────────────────────
function Speedometer({ area, streak }: { area: StudyArea; streak: number }) {
    const cfg     = AREA_CONFIG[area];
    const color   = cfg.color;
    const percent = Math.min((streak / 30) * 100, 100);
    const SIZE = 190, CX = SIZE / 2, CY = SIZE / 2 + 8, R = 72;
    const START_DEG = -210, END_DEG = 30, ARC_SPAN = 240;

    function polar(deg: number) {
        const rad = ((deg - 90) * Math.PI) / 180;
        return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) };
    }
    function arc(from: number, to: number) {
        const s = polar(from), e = polar(to);
        return `M ${s.x} ${s.y} A ${R} ${R} 0 ${to - from > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
    }

    const needleDeg = START_DEG + (percent / 100) * ARC_SPAN;
    const needleTip = polar(needleDeg);
    const intensity =
        percent < 25 ? 'Iniciando' : percent < 50 ? 'Progredindo' :
        percent < 75 ? 'Consistente' : percent < 92 ? 'Intenso' : 'Lendário';

    const ticks = [0, 25, 50, 75, 100].map(p => {
        const deg = START_DEG + (p / 100) * ARC_SPAN;
        const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
        return {
            inner: { x: CX + (R - 10) * Math.cos(toRad(deg)), y: CY + (R - 10) * Math.sin(toRad(deg)) },
            outer: { x: CX + (R + 2)  * Math.cos(toRad(deg)), y: CY + (R + 2)  * Math.sin(toRad(deg)) },
        };
    });

    return (
        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
                <Zap size={16} color="#8b5cf6" strokeWidth={2} />
                <Text style={styles.sectionTitle}>Intensidade de Estudos</Text>
            </View>
            <View style={styles.speedoCard}>
                <View style={{ alignItems: 'center' }}>
                    <Svg width={SIZE} height={SIZE * 0.65} viewBox={`0 0 ${SIZE} ${SIZE * 0.67}`}>
                        <Defs>
                            <SvgLinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <Stop offset="0%" stopColor={color + '55'} />
                                <Stop offset="100%" stopColor={color} />
                            </SvgLinearGradient>
                        </Defs>
                        <Path d={arc(START_DEG, END_DEG)} stroke="#1e1c2e" strokeWidth={12} fill="none" strokeLinecap="round" />
                        {percent > 0 && (
                            <Path d={arc(START_DEG, START_DEG + (percent / 100) * ARC_SPAN)} stroke="url(#grad)" strokeWidth={12} fill="none" strokeLinecap="round" />
                        )}
                        {ticks.map((t, i) => (
                            <Line key={i} x1={t.inner.x} y1={t.inner.y} x2={t.outer.x} y2={t.outer.y} stroke="#44415a" strokeWidth={1.5} />
                        ))}
                        <Line x1={CX} y1={CY} x2={needleTip.x + 0.8} y2={needleTip.y + 0.8} stroke="#00000055" strokeWidth={3} strokeLinecap="round" />
                        <Line x1={CX} y1={CY} x2={needleTip.x} y2={needleTip.y} stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" />
                        <Circle cx={CX} cy={CY} r={6} fill={color} />
                        <Circle cx={CX} cy={CY} r={3} fill="#fff" />
                    </Svg>
                    <View style={styles.speedoCenterWrap}>
                        <Text style={[styles.speedoPercent, { color }]}>{Math.round(percent)}%</Text>
                        <Text style={styles.speedoIntensity}>{intensity}</Text>
                    </View>
                </View>
                <View style={[styles.speedoAreaPill, { borderColor: color + '40', backgroundColor: color + '12' }]}>
                    <cfg.Icon size={13} color={color} strokeWidth={2} />
                    <Text style={[styles.speedoAreaLabel, { color }]}>{cfg.label}</Text>
                    <View style={styles.speedoDivider} />
                    <Text style={styles.speedoAreaDesc}>{cfg.desc}</Text>
                </View>
                <Text style={styles.speedoNote}>
                    Baseado em {streak} dia{streak !== 1 ? 's' : ''} consecutivo{streak !== 1 ? 's' : ''} de estudo
                </Text>
            </View>
        </Animated.View>
    );
}

// ─── Streak Card ──────────────────────────────────────────────────────────────
function StreakCard({ streak }: { streak: number }) {
    const pulse = useSharedValue(1);
    const scale = useSharedValue(1);
    useEffect(() => { pulse.value = withRepeat(withTiming(1.05, { duration: 1800 }), -1, true); }, []);
    const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
    const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    const label = streak === 0 ? 'Nenhuma sequência ativa' : streak < 7 ? 'Sequência iniciando' : streak < 30 ? 'Ritmo consistente' : 'Sequência lendária';

    return (
        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
                <Flame size={16} color="#8b5cf6" strokeWidth={2} />
                <Text style={styles.sectionTitle}>Sequência</Text>
            </View>
            <Pressable onPressIn={() => (scale.value = withSpring(0.97))} onPressOut={() => (scale.value = withSpring(1))}>
                <Animated.View style={[styles.streakCard, pressStyle]}>
                    <Animated.View style={[styles.streakCircle, pulseStyle]}>
                        <Text style={styles.streakNumber}>{streak}</Text>
                        <Text style={styles.streakUnit}>dias</Text>
                    </Animated.View>
                    <View style={styles.streakInfo}>
                        <Text style={styles.streakLabel}>{label}</Text>
                        <Text style={styles.streakSub}>
                            {streak === 0 ? 'Registre um aprendizado para começar.' : 'Continue estudando hoje para manter a sequência.'}
                        </Text>
                        <View style={styles.streakDots}>
                            {[...Array(7)].map((_, i) => (
                                <View key={i} style={[styles.dot, i < Math.min(streak, 7) && styles.dotActive]} />
                            ))}
                        </View>
                    </View>
                </Animated.View>
            </Pressable>
        </Animated.View>
    );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatsCard({ stats }: { stats: Stats }) {
    const items = [
        { value: `${stats.totalHours}h`, label: 'Sessão atual', Icon: BarChart2 },
        { value: `${stats.skills}`,      label: 'Skills',       Icon: Cpu },
        { value: `${stats.learnings}`,   label: 'Registros',    Icon: Brain },
    ];
    return (
        <Animated.View entering={FadeInDown.delay(60).duration(500).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
                <BarChart2 size={16} color="#8b5cf6" strokeWidth={2} />
                <Text style={styles.sectionTitle}>Métricas</Text>
            </View>
            <View style={styles.statsRow}>
                {items.map((item, i) => (
                    <View key={i} style={styles.statCard}>
                        <item.Icon size={18} color="#8b5cf6" strokeWidth={1.8} style={{ marginBottom: 10 }} />
                        <Text style={styles.statValue}>{item.value}</Text>
                        <Text style={styles.statLabel}>{item.label}</Text>
                    </View>
                ))}
            </View>
        </Animated.View>
    );
}

// ─── Learnings Card ───────────────────────────────────────────────────────────
function LearningsCard({
    learnings, onAdd, onDelete,
}: {
    learnings: Learning[];
    onAdd: (text: string, meta?: { area: string; stacks: string[]; type: string }) => void;
    onDelete: (id: string) => void;
}) {
    const [modalVisible, setModalVisible] = useState(false);
    const [expanded, setExpanded]         = useState(false);

    const confirmDelete = (id: string, preview: string) => {
        Alert.alert(
            'Remover registro',
            `"${preview.slice(0, 60)}${preview.length > 60 ? '…' : ''}"`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Remover', style: 'destructive', onPress: () => onDelete(id) },
            ],
        );
    };

    const shown = expanded ? learnings : learnings.slice(0, 4);

    return (
        <Animated.View entering={FadeInDown.delay(160).duration(500).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
                <BookOpen size={16} color="#8b5cf6" strokeWidth={2} />
                <Text style={styles.sectionTitle}>Registros</Text>
                <TouchableOpacity style={styles.addIconBtn} onPress={() => setModalVisible(true)}>
                    <Plus size={16} color="#8b5cf6" strokeWidth={2.5} />
                </TouchableOpacity>
            </View>

            {learnings.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Brain size={24} color="#2a2040" strokeWidth={1.5} style={{ marginBottom: 8 }} />
                    <Text style={styles.emptyText}>Nenhum registro ainda. Comece agora.</Text>
                </View>
            ) : (
                shown.map((item, i) => (
                    <Animated.View key={item.id} entering={FadeInDown.delay(i * 50).duration(400)} style={styles.learningRow}>
                        <View style={styles.learningDot} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.learningText}>{item.text}</Text>
                            <View style={styles.learningMeta}>
                                <Clock size={10} color="#44415a" strokeWidth={2} />
                                <Text style={styles.learningDate}>{formatAgo(item.date)}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => confirmDelete(item.id, item.text)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Trash2 size={13} color="#44415a" strokeWidth={2} />
                        </TouchableOpacity>
                    </Animated.View>
                ))
            )}

            {learnings.length > 4 && (
                <TouchableOpacity style={styles.expandBtn} onPress={() => setExpanded(e => !e)}>
                    <Text style={styles.expandBtnText}>
                        {expanded ? 'Ver menos' : `Ver mais ${learnings.length - 4} registros`}
                    </Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                <Plus size={16} color="#fff" strokeWidth={2.5} />
                <Text style={styles.addBtnText}>Novo registro</Text>
            </TouchableOpacity>

            <AddLearningModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={(text, meta) => onAdd(text, meta)}
            />
        </Animated.View>
    );
}

// ─── AI Loading Dots ──────────────────────────────────────────────────────────
function LoadingDots() {
    const dots = [useSharedValue(0.3), useSharedValue(0.3), useSharedValue(0.3)];
    useEffect(() => {
        dots.forEach((sv, i) => {
            sv.value = withDelay(i * 160, withRepeat(withTiming(1, { duration: 400 }), -1, true));
        });
    }, []);
    const styles_ = dots.map(sv => useAnimatedStyle(() => ({ opacity: sv.value, transform: [{ translateY: sv.value * -4 }] })));
    return (
        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
            {styles_.map((s, i) => <Animated.View key={i} style={[aiDotStyle, s]} />)}
        </View>
    );
}
const aiDotStyle = { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8b5cf6' };

const MOOD_CONFIG = {
    motivating:  { color: '#8b5cf6', label: 'Motivado',  Icon: Zap       },
    challenging: { color: '#f59e0b', label: 'Desafio',   Icon: Zap       },
    reflective:  { color: '#06b6d4', label: 'Reflexivo', Icon: Lightbulb },
} as const;

// ─── AI Card ──────────────────────────────────────────────────────────────────
function AICard({ streak, learnings, firstName, onAreaDetected }: {
    streak: number;
    learnings: Learning[];
    firstName: string;
    onAreaDetected: (area: StudyArea) => void;
}) {
    const [result, setResult]   = useState<AIResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(false);
    const lastKey               = useRef('');

    const doFetch = useCallback(async (force = false) => {
        const key = `${streak}-${learnings.length}`;
        if (!force && lastKey.current === key && result) return;
        lastKey.current = key;
        setLoading(true); setError(false);
        try {
            const r = await getAIResult({ streak, learnings, firstName });
            setResult(r);
            onAreaDetected(r.detectedArea);
        } catch { setError(true); }
        finally  { setLoading(false); }
    }, [streak, learnings, firstName]);

    useEffect(() => { doFetch(); }, [streak, learnings.length]);

    const mood    = result?.mood ?? 'motivating';
    const moodCfg = MOOD_CONFIG[mood];

    return (
        <Animated.View entering={FadeInDown.delay(220).duration(500).springify()} style={[styles.section, { marginBottom: 40 }]}>
            <View style={styles.sectionHeader}>
                <Cpu size={16} color="#8b5cf6" strokeWidth={2} />
                <Text style={styles.sectionTitle}>Assistente IA</Text>
                {result && !loading && (
                    <View style={[styles.aiMoodBadge, { backgroundColor: moodCfg.color + '20', borderColor: moodCfg.color + '40' }]}>
                        <moodCfg.Icon size={10} color={moodCfg.color} strokeWidth={2.5} />
                        <Text style={[styles.aiMoodText, { color: moodCfg.color }]}>{moodCfg.label}</Text>
                    </View>
                )}
                <TouchableOpacity style={styles.refreshBtn} onPress={() => doFetch(true)} disabled={loading}>
                    <RefreshCw size={14} color={loading ? '#2a2040' : '#8b5cf6'} strokeWidth={2} />
                </TouchableOpacity>
            </View>

            {loading && (
                <View style={styles.aiLoadingCard}>
                    <View style={styles.aiLoadingInner}>
                        <View style={styles.aiAvatarWrap}>
                            <Cpu size={18} color="#8b5cf6" strokeWidth={2} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.aiLoadingLabel}>DevTrack Assistant</Text>
                            <Text style={styles.aiLoadingSubtitle}>Analisando seus registros...</Text>
                        </View>
                        <LoadingDots />
                    </View>
                    <View style={{ gap: 8 }}>
                        {['90%', '75%', '60%'].map((w, i) => (
                            <View key={i} style={[styles.aiSkeletonLine, { width: w as any }]} />
                        ))}
                    </View>
                </View>
            )}

            {!loading && error && (
                <View style={styles.aiErrorCard}>
                    <AlertCircle size={20} color="#f87171" strokeWidth={2} />
                    <Text style={styles.aiErrorTitle}>Falha na conexão com a IA</Text>
                    <Text style={styles.aiErrorSub}>Verifique sua chave Gemini no app.json</Text>
                    <TouchableOpacity style={styles.aiRetryBtn} onPress={() => doFetch(true)}>
                        <RefreshCw size={13} color="#8b5cf6" strokeWidth={2} />
                        <Text style={styles.aiRetryText}>Tentar novamente</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!loading && !error && result && (
                <Animated.View entering={FadeInDown.duration(400)} style={styles.aiResultCard}>
                    <View style={styles.aiResultHeader}>
                        <View style={styles.aiAvatarWrap}>
                            <Cpu size={16} color="#8b5cf6" strokeWidth={2} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.aiAssistantName}>DevTrack Assistant</Text>
                            <Text style={styles.aiAssistantSub}>Análise personalizada</Text>
                        </View>
                        <View style={styles.aiLiveDot} />
                    </View>
                    <View style={styles.aiDivider} />
                    <View style={styles.aiSuggestionWrap}>
                        <Lightbulb size={14} color="#8b5cf6" strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
                        <Text style={styles.aiSuggestionText}>{result.suggestion}</Text>
                    </View>
                    {result.nextTopics?.length > 0 && (
                        <View style={styles.aiTopicsSection}>
                            <Text style={styles.aiTopicsLabel}>Estude hoje</Text>
                            <View style={styles.aiTopicsRow}>
                                {result.nextTopics.map((topic, i) => (
                                    <Animated.View key={i} entering={FadeInDown.delay(i * 80).duration(300)} style={styles.aiTopicChip}>
                                        <BookOpen size={10} color="#8b5cf6" strokeWidth={2} />
                                        <Text style={styles.aiTopicText}>{topic}</Text>
                                    </Animated.View>
                                ))}
                            </View>
                        </View>
                    )}
                    {result.tip && (
                        <View style={styles.aiTipBox}>
                            <View style={styles.aiTipHeader}>
                                <Zap size={12} color="#f59e0b" strokeWidth={2.5} />
                                <Text style={styles.aiTipTitle}>Dica do dia</Text>
                            </View>
                            <Text style={styles.aiTipBody}>{result.tip}</Text>
                        </View>
                    )}
                </Animated.View>
            )}
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
    const { user } = useAuth();
    const email    = user?.email ?? '';

    const [streak,    setStreak]    = useState(0);
    const [learnings, setLearnings] = useState<Learning[]>([]);
    const [stats,     setStats]     = useState<Stats>({ totalHours: 0, skills: 0, learnings: 0 });
    const [studyArea, setStudyArea] = useState<StudyArea>('fullstack');

    const firstName = user?.displayName?.split(' ')[0] ?? 'Dev';

    // Chaves com namespace por e-mail — dados isolados por conta
    const keys = email ? getStorageKeys(email) : null;

    const loadData = useCallback(async () => {
        if (!keys) return;

        const [streakData, learnRaw, statsRaw, areaRaw, sessionHours] = await Promise.all([
            checkAndUpdateStreak(keys.streak, user?.uid, email),
            AsyncStorage.getItem(keys.learnings),
            AsyncStorage.getItem(keys.stats),
            AsyncStorage.getItem(keys.area),
            getSessionHours(keys.session),
        ]);

        setStreak(streakData.count);

        const list: Learning[] = learnRaw ? JSON.parse(learnRaw) : [];
        setLearnings(list);

        const s: Stats = statsRaw ? JSON.parse(statsRaw) : { totalHours: 0, skills: 0, learnings: 0 };
        setStats({ ...s, totalHours: sessionHours, learnings: list.length });

        if (areaRaw) setStudyArea(areaRaw as StudyArea);
    }, [user?.uid, email]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleAreaDetected = useCallback(async (area: StudyArea) => {
        if (!keys) return;
        setStudyArea(area);
        await AsyncStorage.setItem(keys.area, area);
    }, [keys]);

    const handleAddLearning = async (text: string, _meta?: { area: string; stacks: string[]; type: string }) => {
        if (!keys) return;
        const item: Learning = { id: Date.now().toString(), text, date: new Date().toISOString() };
        const updated = [item, ...learnings];
        setLearnings(updated);
        await AsyncStorage.setItem(keys.learnings, JSON.stringify(updated));
        if (user?.uid) await saveLearnings(user.uid, email, updated);
        const newStats = { ...stats, learnings: updated.length };
        setStats(newStats);
        await AsyncStorage.setItem(keys.stats, JSON.stringify(newStats));
    };

    const handleDeleteLearning = async (id: string) => {
        if (!keys) return;
        const updated = learnings.filter(l => l.id !== id);
        setLearnings(updated);
        await AsyncStorage.setItem(keys.learnings, JSON.stringify(updated));
        if (user?.uid) await saveLearnings(user.uid, email, updated);
        const newStats = { ...stats, learnings: updated.length };
        setStats(newStats);
        await AsyncStorage.setItem(keys.stats, JSON.stringify(newStats));
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Olá, {firstName}</Text>
                    <Text style={styles.date}>{formatHeaderDate()}</Text>
                </View>
            </Animated.View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <StreakCard streak={streak} />
                <StatsCard stats={stats} />
                <Speedometer area={studyArea} streak={streak} />
                <LearningsCard
                    learnings={learnings}
                    onAdd={handleAddLearning}
                    onDelete={handleDeleteLearning}
                />
                <AICard
                    streak={streak}
                    learnings={learnings}
                    firstName={firstName}
                    onAreaDetected={handleAreaDetected}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:  { flex: 1, backgroundColor: '#0d0d10' },
    header:     { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    greeting:   { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    date:       { color: '#6b6880', fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
    content:    { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },
    section:       { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle:  { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },

    streakCard:   { backgroundColor: '#16151d', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#2a2040' },
    streakCircle: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center', marginRight: 18, shadowColor: '#8b5cf6', shadowOpacity: 0.45, shadowRadius: 12, elevation: 8 },
    streakNumber: { fontSize: 28, fontWeight: '900', color: '#fff', lineHeight: 30 },
    streakUnit:   { fontSize: 11, color: '#fff', opacity: 0.85, fontWeight: '600' },
    streakInfo:   { flex: 1 },
    streakLabel:  { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
    streakSub:    { color: '#7a7590', fontSize: 12, lineHeight: 17, marginBottom: 10 },
    streakDots:   { flexDirection: 'row', gap: 5 },
    dot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2a2040' },
    dotActive:    { backgroundColor: '#8b5cf6' },

    statsRow: { flexDirection: 'row', gap: 10 },
    statCard: { flex: 1, backgroundColor: '#16151d', borderRadius: 18, paddingVertical: 18, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2a2040' },
    statValue: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    statLabel: { color: '#6b6880', fontSize: 11, marginTop: 3, fontWeight: '500' },

    speedoCard:        { backgroundColor: '#16151d', borderRadius: 20, paddingVertical: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: '#2a2040', alignItems: 'center' },
    speedoCenterWrap:  { marginTop: -12, alignItems: 'center', marginBottom: 12 },
    speedoPercent:     { fontSize: 30, fontWeight: '900', letterSpacing: -1 },
    speedoIntensity:   { color: '#7a7590', fontSize: 12, fontWeight: '600', marginTop: 2 },
    speedoAreaPill:    { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
    speedoAreaLabel:   { fontSize: 13, fontWeight: '700' },
    speedoDivider:     { width: 1, height: 12, backgroundColor: '#44415a' },
    speedoAreaDesc:    { color: '#6b6880', fontSize: 12 },
    speedoNote:        { color: '#44415a', fontSize: 11, marginTop: 10, textAlign: 'center' },

    addIconBtn:    { marginLeft: 'auto' },
    learningRow:   { flexDirection: 'row', backgroundColor: '#16151d', borderRadius: 14, padding: 14, marginBottom: 8, alignItems: 'flex-start', borderWidth: 1, borderColor: '#2a2040' },
    learningDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8b5cf6', marginTop: 6, marginRight: 10, flexShrink: 0 },
    learningText:  { color: '#d4d0e8', lineHeight: 20, fontSize: 14, marginBottom: 4 },
    learningMeta:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
    learningDate:  { color: '#44415a', fontSize: 10 },
    deleteBtn:     { padding: 4, marginLeft: 8 },
    expandBtn:     { alignItems: 'center', paddingVertical: 8, marginBottom: 4 },
    expandBtnText: { color: '#8b5cf6', fontSize: 13, fontWeight: '600' },
    emptyCard:     { backgroundColor: '#16151d', borderRadius: 14, padding: 24, borderWidth: 1, borderColor: '#2a2040', alignItems: 'center', marginBottom: 8 },
    emptyText:     { color: '#6b6880', fontSize: 13 },
    addBtn:        { backgroundColor: '#8b5cf6', borderRadius: 14, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, shadowColor: '#8b5cf6', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
    addBtnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },

    aiMoodBadge:       { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
    aiMoodText:        { fontSize: 10, fontWeight: '700' },
    refreshBtn:        { padding: 4 },
    aiLoadingCard:     { backgroundColor: '#16151d', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#2a2040' },
    aiLoadingInner:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    aiLoadingLabel:    { color: '#fff', fontSize: 13, fontWeight: '700' },
    aiLoadingSubtitle: { color: '#6b6880', fontSize: 11, marginTop: 2 },
    aiSkeletonLine:    { height: 10, borderRadius: 5, backgroundColor: '#1e1c2e' },
    aiErrorCard:       { backgroundColor: '#16151d', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#2a2040', alignItems: 'center', gap: 8 },
    aiErrorTitle:      { color: '#f87171', fontSize: 14, fontWeight: '700' },
    aiErrorSub:        { color: '#6b6880', fontSize: 12, textAlign: 'center' },
    aiRetryBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, backgroundColor: '#1e1826', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#2a2040' },
    aiRetryText:       { color: '#8b5cf6', fontWeight: '700', fontSize: 13 },
    aiResultCard:      { backgroundColor: '#16151d', borderRadius: 20, borderWidth: 1, borderColor: '#2a2040', overflow: 'hidden' },
    aiResultHeader:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 14 },
    aiAvatarWrap:      { width: 36, height: 36, borderRadius: 10, backgroundColor: '#8b5cf620', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#8b5cf630' },
    aiAssistantName:   { color: '#fff', fontSize: 13, fontWeight: '700' },
    aiAssistantSub:    { color: '#6b6880', fontSize: 11, marginTop: 1 },
    aiLiveDot:         { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#10b981', shadowColor: '#10b981', shadowOpacity: 0.8, shadowRadius: 4, elevation: 4 },
    aiDivider:         { height: 1, backgroundColor: '#1e1c2e', marginHorizontal: 16 },
    aiSuggestionWrap:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16, paddingBottom: 12 },
    aiSuggestionText:  { color: '#d4d0e8', lineHeight: 22, fontSize: 14, flex: 1 },
    aiTopicsSection:   { paddingHorizontal: 16, paddingBottom: 14 },
    aiTopicsLabel:     { color: '#44415a', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
    aiTopicsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    aiTopicChip:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#8b5cf615', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#8b5cf625' },
    aiTopicText:       { color: '#c4b5fd', fontSize: 11, fontWeight: '600' },
    aiTipBox:          { margin: 12, marginTop: 4, backgroundColor: '#1a1510', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#3a2e1080' },
    aiTipHeader:       { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
    aiTipTitle:        { color: '#f59e0b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    aiTipBody:         { color: '#c8a85a', fontSize: 12, lineHeight: 18 },
});