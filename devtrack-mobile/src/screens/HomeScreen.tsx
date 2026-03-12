// src/screens/HomeScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    ScrollView, StyleSheet, View, Text, TouchableOpacity,
    Pressable, Dimensions,
} from 'react-native';
import AddLearningModal from '../components/home/AddLearningModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeInDown, FadeInUp,
    useSharedValue, useAnimatedStyle, useAnimatedProps,
    withSpring, withRepeat, withTiming, withDelay,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Flame, BarChart2, Brain, Plus, BookOpen,
    Trash2, Clock, Star, Play, Pause, RotateCcw,
    Coffee, CheckCircle, Target, Zap, TrendingUp,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { saveStreak, saveLearnings, getStorageKeys } from '../services/userService';
import { AREA_CONFIG } from '../constants/areas';
import { todayKey, yesterdayKey, formatHeaderDate, formatAgo } from '../../utils/dateHelpers';
import type { StudyArea } from '../services/ai.service';

const { width: SW } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Types ────────────────────────────────────────────────────────────────────
interface StreakData { count: number; lastDate: string | null; }
interface Learning  { id: string; text: string; date: string; }
interface Stats     { totalHours: number; skills: number; learnings: number; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function checkAndUpdateStreak(
    streakKey: string, uid?: string, email?: string,
): Promise<StreakData> {
    const today     = todayKey();
    const yesterday = yesterdayKey();
    const raw       = await AsyncStorage.getItem(streakKey);
    const streak: StreakData = raw ? JSON.parse(raw) : { count: 0, lastDate: null };
    if (streak.lastDate === today) return streak;
    const newCount  = streak.lastDate === yesterday ? streak.count + 1 : 1;
    const updated: StreakData = { count: newCount, lastDate: today };
    await AsyncStorage.setItem(streakKey, JSON.stringify(updated));
    if (uid && email) await saveStreak(uid, email, newCount, today);
    return updated;
}

async function getSessionHours(sessionKey: string): Promise<number> {
    const raw = await AsyncStorage.getItem(sessionKey);
    if (!raw) { await AsyncStorage.setItem(sessionKey, Date.now().toString()); return 0; }
    const elapsed = (Date.now() - Number(raw)) / 3_600_000;
    return Math.round(elapsed * 10) / 10;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

// ─── Pomodoro Timer ───────────────────────────────────────────────────────────
const MODES = [
    { key: 'focus',  label: 'Foco',  minutes: 25, color: '#8b5cf6', Icon: Brain   },
    { key: 'short',  label: 'Pausa', minutes: 5,  color: '#10b981', Icon: Coffee  },
    { key: 'long',   label: 'Longa', minutes: 15, color: '#06b6d4', Icon: Target  },
] as const;
type ModeIdx = 0 | 1 | 2;

function PomodoroTimer({ onAddLearning }: {
    onAddLearning: (text: string, meta?: any) => void;
}) {
    const [modeIdx,    setModeIdx]    = useState<ModeIdx>(0);
    const [running,    setRunning]    = useState(false);
    const [seconds,    setSeconds]    = useState(MODES[0].minutes * 60);
    const [sessions,   setSessions]   = useState(0);
    const [modalOpen,  setModalOpen]  = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const mode    = MODES[modeIdx];
    const total   = mode.minutes * 60;
    const mins    = Math.floor(seconds / 60);
    const secs    = seconds % 60;
    const progress = (total - seconds) / total;

    // Animated SVG ring
    const RING_SIZE = 210;
    const RADIUS    = 86;
    const CIRCUM    = 2 * Math.PI * RADIUS;
    const ringAnim  = useSharedValue(0);

    useEffect(() => {
        ringAnim.value = withTiming(progress, { duration: 800 });
    }, [progress]);

    const ringProps = useAnimatedProps(() => ({
        strokeDashoffset: CIRCUM * (1 - Math.min(ringAnim.value, 1)),
    }));

    // Subtle pulse on the ring when running
    const glow = useSharedValue(0.6);
    useEffect(() => {
        if (running) {
            glow.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
        } else {
            glow.value = withTiming(0.6, { duration: 300 });
        }
    }, [running]);
    const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

    // Timer tick
    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                setSeconds(s => {
                    if (s <= 1) {
                        clearInterval(intervalRef.current!);
                        setRunning(false);
                        if (modeIdx === 0) setSessions(n => n + 1);
                        const next: ModeIdx = modeIdx === 0 ? 1 : 0;
                        setModeIdx(next);
                        setSeconds(MODES[next].minutes * 60);
                        return 0;
                    }
                    return s - 1;
                });
            }, 1000);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [running, modeIdx]);

    const switchMode = (i: ModeIdx) => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false);
        setModeIdx(i);
        setSeconds(MODES[i].minutes * 60);
    };

    const reset = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false);
        setSeconds(mode.minutes * 60);
    };

    const ModeIcon = mode.Icon;
    const pct = Math.round(progress * 100);

    return (
        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
                <Clock size={16} color="#8b5cf6" strokeWidth={2} />
                <Text style={styles.sectionTitle}>Pomodoro</Text>
                {sessions > 0 && (
                    <View style={pm.sessionsBadge}>
                        <CheckCircle size={11} color="#10b981" strokeWidth={2.5} />
                        <Text style={pm.sessionsBadgeText}>{sessions} foco{sessions !== 1 ? 's' : ''} hoje</Text>
                    </View>
                )}
            </View>

            <View style={pm.card}>
                {/* Mode selector */}
                <View style={pm.tabs}>
                    {MODES.map((m, i) => {
                        const active = modeIdx === i;
                        const TIcon = m.Icon;
                        return (
                            <TouchableOpacity
                                key={m.key}
                                style={[pm.tab, active && { backgroundColor: m.color + '20', borderColor: m.color + '55' }]}
                                onPress={() => switchMode(i as ModeIdx)}
                                activeOpacity={0.75}
                            >
                                <TIcon size={11} color={active ? m.color : '#44415a'} strokeWidth={2} />
                                <Text style={[pm.tabText, active && { color: m.color }]}>{m.label}</Text>
                                <Text style={[pm.tabMin, active && { color: m.color + 'aa' }]}>{m.minutes}m</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Ring clock */}
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                        {/* Outer track */}
                        <Circle
                            cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                            stroke={mode.color + '18'} strokeWidth={12} fill="none"
                        />
                        {/* Glow ring (animated opacity) — static behind progress */}
                        <Circle
                            cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                            stroke={mode.color + '30'} strokeWidth={16} fill="none"
                        />
                        {/* Progress arc */}
                        <AnimatedCircle
                            cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                            stroke={mode.color}
                            strokeWidth={12} fill="none"
                            strokeLinecap="round"
                            strokeDasharray={CIRCUM}
                            animatedProps={ringProps}
                            rotation="-90"
                            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                        />
                    </Svg>

                    {/* Centered content */}
                    <View style={pm.clockFace}>
                        <Animated.View style={glowStyle}>
                            <ModeIcon size={20} color={mode.color} strokeWidth={2} />
                        </Animated.View>
                        <Text style={[pm.timerDigits, { color: running ? mode.color : '#fff' }]}>
                            {pad(mins)}:{pad(secs)}
                        </Text>
                        <Text style={pm.modeName}>{mode.label}</Text>
                        {pct > 0 && (
                            <Text style={[pm.pctText, { color: mode.color + '99' }]}>{pct}%</Text>
                        )}
                    </View>
                </View>

                {/* Controls row */}
                <View style={pm.controls}>
                    <TouchableOpacity style={pm.sideBtn} onPress={reset} activeOpacity={0.8}>
                        <RotateCcw size={17} color="#6b6880" strokeWidth={2} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[pm.playBtn, { backgroundColor: mode.color, shadowColor: mode.color }]}
                        onPress={() => setRunning(r => !r)}
                        activeOpacity={0.85}
                    >
                        {running
                            ? <Pause size={26} color="#fff" strokeWidth={2.5} />
                            : <Play  size={26} color="#fff" strokeWidth={2.5} fill="#fff" />
                        }
                    </TouchableOpacity>

                    <TouchableOpacity style={pm.sideBtn} onPress={() => setModalOpen(true)} activeOpacity={0.8}>
                        <Plus size={17} color="#8b5cf6" strokeWidth={2.5} />
                    </TouchableOpacity>
                </View>

                <Text style={[pm.hint, { color: mode.color + '70' }]}>
                    {seconds === total
                        ? 'Pressione play para começar'
                        : running
                        ? `Faltam ${pad(mins)}:${pad(secs)}`
                        : 'Pausado'}
                </Text>
            </View>

            <AddLearningModal
                visible={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={(text, meta) => { onAddLearning(text, meta); setModalOpen(false); }}
            />
        </Animated.View>
    );
}

const pm = StyleSheet.create({
    card:             { backgroundColor: '#16151d', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#2a2040', alignItems: 'center', gap: 18 },
    tabs:             { flexDirection: 'row', gap: 8, width: '100%' },
    tab:              { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 12, backgroundColor: '#1a1826', borderWidth: 1, borderColor: '#2a2040', gap: 2 },
    tabText:          { color: '#44415a', fontSize: 11, fontWeight: '700' },
    tabMin:           { color: '#2a2040', fontSize: 9, fontWeight: '600' },
    clockFace:        { position: 'absolute', alignItems: 'center', justifyContent: 'center', gap: 4 },
    timerDigits:      { fontSize: 46, fontWeight: '900', letterSpacing: -2, lineHeight: 50 },
    modeName:         { color: '#6b6880', fontSize: 12, fontWeight: '600' },
    pctText:          { fontSize: 11, fontWeight: '600' },
    controls:         { flexDirection: 'row', alignItems: 'center', gap: 20 },
    sideBtn:          { width: 46, height: 46, borderRadius: 14, backgroundColor: '#1a1826', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2a2040' },
    playBtn:          { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.45, shadowRadius: 16, elevation: 10, shadowOffset: { width: 0, height: 5 } },
    hint:             { fontSize: 12, fontWeight: '500' },
    sessionsBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10b98115', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#10b98130' },
    sessionsBadgeText:{ color: '#10b981', fontSize: 10, fontWeight: '700' },
});

// ─── Streak Card ──────────────────────────────────────────────────────────────
function StreakCard({ streak }: { streak: number }) {
    const pulse = useSharedValue(1);
    const scale = useSharedValue(1);
    useEffect(() => {
        pulse.value = withRepeat(withTiming(1.06, { duration: 1800 }), -1, true);
    }, []);
    const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
    const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const label =
        streak === 0 ? 'Nenhuma sequência ativa' :
        streak < 7   ? 'Sequência iniciando' :
        streak < 30  ? 'Ritmo consistente' :
                       'Sequência lendária';

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
                            {streak === 0
                                ? 'Registre um aprendizado para começar.'
                                : 'Continue estudando hoje para manter a sequência.'}
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

// ─── Stats Card — 2x2 grid, sincronizado com dados reais do perfil ────────────
function StatsCard({ streak, learnings, xp, studyArea, sessionHours }: {
    streak: number;
    learnings: Learning[];
    xp: number;
    studyArea: StudyArea;
    sessionHours: number;
}) {
    const cfg = AREA_CONFIG[studyArea];

    const todayCount = learnings.filter(l =>
        new Date(l.date).toDateString() === new Date().toDateString()
    ).length;

    // Nível derivado do XP (alinhado com SuggestionsScreen)
    const level =
        xp >= 1500 ? { label: 'DevOps', color: '#FFD700', Icon: TrendingUp } :
        xp >= 800  ? { label: 'Sênior', color: '#8b5cf6', Icon: TrendingUp } :
        xp >= 300  ? { label: 'Pleno',  color: '#06b6d4', Icon: Zap        } :
                     { label: 'Júnior', color: '#10b981', Icon: Target     };

    const LvlIcon = level.Icon;

    const cells = [
        {
            Icon: Flame,    color: '#8b5cf6',
            value: `${streak}`,  unit: 'dias',
            label: 'Sequência',
            sub: streak === 0 ? 'Sem sequência' : streak >= 7 ? 'Consistente' : 'Em progresso',
        },
        {
            Icon: BookOpen, color: '#06b6d4',
            value: `${todayCount}`, unit: '',
            label: 'Hoje',
            sub: todayCount === 0 ? 'Nenhum registro' : `${todayCount} registro${todayCount !== 1 ? 's' : ''}`,
        },
        {
            Icon: Star,     color: '#f59e0b',
            value: `${xp}`, unit: 'xp',
            label: 'Experiência',
            sub: level.label,
        },
        {
            Icon: cfg.Icon, color: cfg.color,
            value: `${sessionHours}`, unit: 'h',
            label: 'Sessão',
            sub: cfg.label,
        },
    ];

    return (
        <Animated.View entering={FadeInDown.delay(40).duration(500).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
                <BarChart2 size={16} color="#8b5cf6" strokeWidth={2} />
                <Text style={styles.sectionTitle}>Métricas</Text>
                <View style={[sc.lvlChip, { borderColor: level.color + '40', backgroundColor: level.color + '12' }]}>
                    <LvlIcon size={10} color={level.color} strokeWidth={2} />
                    <Text style={[sc.lvlText, { color: level.color }]}>{level.label}</Text>
                </View>
            </View>

            <View style={sc.grid}>
                {cells.map((c, i) => {
                    const CIcon = c.Icon;
                    return (
                        <Animated.View
                            key={i}
                            entering={FadeInDown.delay(50 + i * 35).duration(400).springify()}
                            style={[sc.cell, { borderColor: c.color + '28' }]}
                        >
                            <View style={[sc.iconBox, { backgroundColor: c.color + '15' }]}>
                                <CIcon size={15} color={c.color} strokeWidth={2} />
                            </View>
                            <View style={sc.valueRow}>
                                <Text style={[sc.value, { color: c.color }]}>{c.value}</Text>
                                {c.unit ? <Text style={[sc.unit, { color: c.color + 'aa' }]}>{c.unit}</Text> : null}
                            </View>
                            <Text style={sc.label}>{c.label}</Text>
                            <Text style={sc.sub} numberOfLines={1}>{c.sub}</Text>
                        </Animated.View>
                    );
                })}
            </View>
        </Animated.View>
    );
}

const sc = StyleSheet.create({
    lvlChip:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
    lvlText:  { fontSize: 10, fontWeight: '800' },
    grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    cell:     { width: (SW - 42) / 2, backgroundColor: '#16151d', borderRadius: 16, padding: 14, borderWidth: 1, gap: 4 },
    iconBox:  { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
    valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
    value:    { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
    unit:     { fontSize: 13, fontWeight: '700' },
    label:    { color: '#9aa0aa', fontSize: 12, fontWeight: '600' },
    sub:      { color: '#44415a', fontSize: 10, fontWeight: '500' },
});

// ─── Learning Row ─────────────────────────────────────────────────────────────
function LearningRow({ item, onDelete }: { item: Learning; onDelete: () => void }) {
    const opacity = useSharedValue(1);
    const style   = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const handleDelete = () => {
        opacity.value = withTiming(0, { duration: 180 });
        setTimeout(onDelete, 160);
    };
    return (
        <Animated.View style={[styles.learningRow, style]}>
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
                onPress={handleDelete}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
                <Trash2 size={14} color="#ef444455" strokeWidth={2} />
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Learnings Card ───────────────────────────────────────────────────────────
function LearningsCard({ learnings, onAdd, onDelete }: {
    learnings: Learning[];
    onAdd: (text: string, meta?: any) => void;
    onDelete: (id: string) => void;
}) {
    const [modalVisible, setModalVisible] = useState(false);
    const [expanded,     setExpanded]     = useState(false);
    const shown = expanded ? learnings : learnings.slice(0, 4);

    return (
        <Animated.View
            entering={FadeInDown.delay(160).duration(500).springify()}
            style={[styles.section, { marginBottom: 48 }]}
        >
            <View style={styles.sectionHeader}>
                <BookOpen size={16} color="#8b5cf6" strokeWidth={2} />
                <Text style={styles.sectionTitle}>Registros</Text>
                <TouchableOpacity style={styles.addIconBtn} onPress={() => setModalVisible(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Plus size={16} color="#8b5cf6" strokeWidth={2.5} />
                </TouchableOpacity>
            </View>

            {learnings.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Brain size={24} color="#2a2040" strokeWidth={1.5} style={{ marginBottom: 8 }} />
                    <Text style={styles.emptyText}>Nenhum registro ainda. Comece agora!</Text>
                </View>
            ) : (
                shown.map(item => (
                    <LearningRow key={item.id} item={item} onDelete={() => onDelete(item.id)} />
                ))
            )}

            {learnings.length > 4 && (
                <TouchableOpacity style={styles.expandBtn} onPress={() => setExpanded(e => !e)}>
                    <Text style={styles.expandBtnText}>
                        {expanded ? 'Ver menos' : `Ver mais ${learnings.length - 4} registros`}
                    </Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
                <Plus size={16} color="#fff" strokeWidth={2.5} />
                <Text style={styles.addBtnText}>Novo registro</Text>
            </TouchableOpacity>

            <AddLearningModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={(text, meta) => { onAdd(text, meta); setModalVisible(false); }}
            />
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
    const [xp,        setXp]        = useState(0);

    const firstName = user?.displayName?.split(' ')[0] ?? 'Dev';
    const keys      = email ? getStorageKeys(email) : null;

    const loadData = useCallback(async () => {
        if (!keys) return;
        const [streakData, learnRaw, statsRaw, areaRaw, sessionHours, xpRaw] = await Promise.all([
            checkAndUpdateStreak(keys.streak, user?.uid, email),
            AsyncStorage.getItem(keys.learnings),
            AsyncStorage.getItem(keys.stats),
            AsyncStorage.getItem(keys.area),
            getSessionHours(keys.session),
            AsyncStorage.getItem(`${keys.profile}_SUGGESTIONS_XP`),
        ]);
        setStreak(streakData.count);
        const list: Learning[] = learnRaw ? JSON.parse(learnRaw) : [];
        setLearnings(list);
        const s: Stats = statsRaw ? JSON.parse(statsRaw) : { totalHours: 0, skills: 0, learnings: 0 };
        setStats({ ...s, totalHours: sessionHours, learnings: list.length });
        if (areaRaw) setStudyArea(areaRaw as StudyArea);
        if (xpRaw)   setXp(Number(xpRaw));
    }, [user?.uid, email]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleAddLearning = async (text: string, meta?: any) => {
        if (!keys) return;
        const item: Learning = { id: Date.now().toString(), text, date: new Date().toISOString() };
        const updated = [item, ...learnings];
        setLearnings(updated);
        await AsyncStorage.setItem(keys.learnings, JSON.stringify(updated));
        if (user?.uid) await saveLearnings(user.uid, email, updated);
        const newStats = { ...stats, learnings: updated.length };
        setStats(newStats);
        await AsyncStorage.setItem(keys.stats, JSON.stringify(newStats));
        if (meta?.area && keys) {
            const areaMap: Record<string, StudyArea> = {
                frontend: 'frontend', backend: 'backend',
                mobile: 'frontend',   devops: 'backend',
                fullstack: 'fullstack', security: 'backend',
            };
            const mapped = areaMap[meta.area] ?? 'fullstack';
            setStudyArea(mapped);
            await AsyncStorage.setItem(keys.area, mapped);
        }
        const newXp = xp + 10;
        setXp(newXp);
        await AsyncStorage.setItem(`${keys.profile}_SUGGESTIONS_XP`, String(newXp));
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
                <View style={styles.headerXp}>
                    <Star size={12} color="#f59e0b" strokeWidth={2} />
                    <Text style={styles.headerXpText}>{xp} XP</Text>
                </View>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                scrollEventThrottle={16}
            >
                <StreakCard streak={streak} />
                <StatsCard
                    streak={streak}
                    learnings={learnings}
                    xp={xp}
                    studyArea={studyArea}
                    sessionHours={stats.totalHours}
                />
                <PomodoroTimer onAddLearning={handleAddLearning} />
                <LearningsCard
                    learnings={learnings}
                    onAdd={handleAddLearning}
                    onDelete={handleDeleteLearning}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: '#0d0d10' },
    header:       { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    greeting:     { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
    date:         { color: '#6b6880', fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
    headerXp:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f59e0b18', borderWidth: 1, borderColor: '#f59e0b35', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    headerXpText: { color: '#f59e0b', fontSize: 12, fontWeight: '700' },
    content:      { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },
    section:      { marginBottom: 20 },
    sectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },

    // Streak
    streakCard:   { backgroundColor: '#16151d', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#2a2040' },
    streakCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center', marginRight: 18, shadowColor: '#8b5cf6', shadowOpacity: 0.5, shadowRadius: 14, elevation: 8 },
    streakNumber: { fontSize: 26, fontWeight: '900', color: '#fff', lineHeight: 28 },
    streakUnit:   { fontSize: 11, color: '#fff', opacity: 0.85, fontWeight: '600' },
    streakInfo:   { flex: 1 },
    streakLabel:  { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
    streakSub:    { color: '#7a7590', fontSize: 12, lineHeight: 17, marginBottom: 10 },
    streakDots:   { flexDirection: 'row', gap: 5 },
    dot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2a2040' },
    dotActive:    { backgroundColor: '#8b5cf6' },

    // Learnings
    addIconBtn:    { marginLeft: 'auto', padding: 4 },
    learningRow:   { flexDirection: 'row', backgroundColor: '#16151d', borderRadius: 14, padding: 14, marginBottom: 8, alignItems: 'flex-start', borderWidth: 1, borderColor: '#2a2040' },
    learningDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8b5cf6', marginTop: 6, marginRight: 10, flexShrink: 0 },
    learningText:  { color: '#d4d0e8', lineHeight: 20, fontSize: 14, marginBottom: 4 },
    learningMeta:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
    learningDate:  { color: '#44415a', fontSize: 10 },
    deleteBtn:     { padding: 6, marginLeft: 6 },
    expandBtn:     { alignItems: 'center', paddingVertical: 10, marginBottom: 2 },
    expandBtnText: { color: '#8b5cf6', fontSize: 13, fontWeight: '600' },
    emptyCard:     { backgroundColor: '#16151d', borderRadius: 14, padding: 28, borderWidth: 1, borderColor: '#2a2040', alignItems: 'center', marginBottom: 8 },
    emptyText:     { color: '#6b6880', fontSize: 13 },
    addBtn:        { backgroundColor: '#8b5cf6', borderRadius: 14, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6, shadowColor: '#8b5cf6', shadowOpacity: 0.35, shadowRadius: 12, elevation: 5 },
    addBtnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },
});