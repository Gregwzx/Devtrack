// src/screens/HomeScreen.tsx — com paralaxe no header + animações de seção
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity,
    Pressable, Dimensions,
} from 'react-native';
import AddLearningModal from '../components/home/AddLearningModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeInDown, FadeInUp,
    useSharedValue, useAnimatedStyle, useAnimatedProps,
    withSpring, withRepeat, withTiming, withDelay, withSequence,
    interpolate, Extrapolation,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import {
    Flame, BarChart2, Brain, Plus, BookOpen,
    Trash2, Clock, Star, Play, Pause, RotateCcw,
    Coffee, CheckCircle, Target, Zap, TrendingUp,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useHomeData } from '../hooks/useHomeData';
import OfflineBanner from '../components/common/OfflineBanner';
import { AREA_CONFIG } from '../constants/areas';
import { formatHeaderDate, formatAgo } from '../../utils/dateHelpers';
import { useParallaxScroll, useFilterTransition, PARALLAX_HEIGHT } from '../hooks/useParallaxScroll';
import type { StudyArea } from '../services/ai.service';
import type { Learning } from '../types/learning';

const { width: SW } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Stats { totalHours: number; skills: number; learnings: number; }

function pad(n: number) { return String(n).padStart(2, '0'); }

// ─── Pomodoro Timer ───────────────────────────────────────────────────────────
const MODES = [
    { key: 'focus',  label: 'Foco',  minutes: 25, color: '#8b5cf6', Icon: Brain   },
    { key: 'short',  label: 'Pausa', minutes: 5,  color: '#10b981', Icon: Coffee  },
    { key: 'long',   label: 'Longa', minutes: 15, color: '#06b6d4', Icon: Target  },
] as const;
type ModeIdx = 0 | 1 | 2;

function PomodoroTimer() {
    const [modeIdx,    setModeIdx]    = useState<ModeIdx>(0);
    const [running,    setRunning]    = useState(false);
    const [seconds,    setSeconds]    = useState(MODES[0].minutes * 60);
    const [sessions,   setSessions]   = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const mode    = MODES[modeIdx];
    const total   = mode.minutes * 60;
    const mins    = Math.floor(seconds / 60);
    const secs    = seconds % 60;
    const progress = (total - seconds) / total;

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

    const glow = useSharedValue(0.6);
    useEffect(() => {
        if (running) {
            glow.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
        } else {
            glow.value = withTiming(0.6, { duration: 300 });
        }
    }, [running]);
    const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

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

    // Efeito de press do play button
    const scale = useSharedValue(1);
    const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
                <Clock size={18} color="#8b5cf6" strokeWidth={2.5} />
                <Text style={styles.sectionTitle}>Pomodoro</Text>
                {sessions > 0 && (
                    <View style={pm.sessionsBadge}>
                        <CheckCircle size={14} color="#10b981" strokeWidth={2.5} />
                        <Text style={pm.sessionsBadgeText}>{sessions} foco{sessions !== 1 ? 's' : ''} hoje</Text>
                    </View>
                )}
            </View>

            <View style={pm.card}>
                <View style={pm.tabs}>
                    {MODES.map((m, i) => {
                        const active = modeIdx === i;
                        const TIcon = m.Icon;
                        return (
                            <TouchableOpacity
                                key={m.key}
                                style={[pm.tab, active && { backgroundColor: m.color + '20', borderColor: m.color, borderBottomColor: m.color }]}
                                onPress={() => switchMode(i as ModeIdx)}
                                activeOpacity={0.75}
                            >
                                <TIcon size={14} color={active ? m.color : '#6b6880'} strokeWidth={active ? 2.5 : 2} />
                                <Text style={[pm.tabText, active && { color: m.color }]}>{m.label}</Text>
                                <Text style={[pm.tabMin, active && { color: m.color + 'aa' }]}>{m.minutes}m</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                    <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                        <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} stroke="#212b31" strokeWidth={14} fill="none" />
                        <AnimatedCircle
                            cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                            stroke={mode.color} strokeWidth={14} fill="none"
                            strokeLinecap="round" strokeDasharray={CIRCUM}
                            animatedProps={ringProps}
                            rotation="-90" origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                        />
                    </Svg>
                    <View style={pm.clockFace}>
                        <Animated.View style={glowStyle}>
                            <ModeIcon size={24} color={mode.color} strokeWidth={2.5} />
                        </Animated.View>
                        <Text style={[pm.timerDigits, { color: running ? mode.color : '#fff' }]}>
                            {pad(mins)}:{pad(secs)}
                        </Text>
                        <Text style={pm.modeName}>{mode.label}</Text>
                        {pct > 0 && <Text style={[pm.pctText, { color: mode.color + '99' }]}>{pct}%</Text>}
                    </View>
                </View>

                <View style={pm.controls}>
                    <TouchableOpacity style={pm.sideBtn} onPress={reset} activeOpacity={0.8}>
                        <RotateCcw size={20} color="#afb6b9" strokeWidth={2.5} />
                    </TouchableOpacity>
                    
                    <Pressable 
                        onPressIn={() => (scale.value = withSpring(0.9))} 
                        onPressOut={() => (scale.value = withSpring(1))} 
                        onPress={() => setRunning(r => !r)}
                    >
                        <Animated.View style={[pm.playBtn, pressStyle, { backgroundColor: mode.color, borderBottomColor: mode.color.replace('f', 'd') }]}>
                            {running
                                ? <Pause size={28} color="#fff" strokeWidth={3} />
                                : <Play  size={28} color="#fff" strokeWidth={3} fill="#fff" />
                            }
                        </Animated.View>
                    </Pressable>

                    <View style={pm.sideBtn} />
                </View>
            </View>

        </Animated.View>
    );
}

const pm = StyleSheet.create({
    card:             { backgroundColor: '#16151d', borderRadius: 24, padding: 20, borderWidth: 2, borderColor: '#212b31', borderBottomWidth: 5, borderBottomColor: '#161c20', alignItems: 'center', gap: 18 },
    tabs:             { flexDirection: 'row', gap: 8, width: '100%' },
    tab:              { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 16, backgroundColor: '#212b31', borderWidth: 2, borderColor: '#37464f', borderBottomWidth: 4, borderBottomColor: '#161c20', gap: 2 },
    tabText:          { color: '#afb6b9', fontSize: 13, fontWeight: '800' },
    tabMin:           { color: '#6b6880', fontSize: 10, fontWeight: '700' },
    clockFace:        { position: 'absolute', alignItems: 'center', justifyContent: 'center', gap: 4 },
    timerDigits:      { fontSize: 46, fontWeight: '900', letterSpacing: -2, lineHeight: 50 },
    modeName:         { color: '#6b6880', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
    pctText:          { fontSize: 12, fontWeight: '800' },
    controls:         { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 10 },
    sideBtn:          { width: 56, height: 56, borderRadius: 18, backgroundColor: '#212b31', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#37464f', borderBottomWidth: 4, borderBottomColor: '#161c20' },
    playBtn:          { width: 76, height: 76, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 0, borderBottomWidth: 6 },
    sessionsBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#10b98120', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
    sessionsBadgeText:{ color: '#10b981', fontSize: 12, fontWeight: '800' },
});

// ─── Streak Card ──────────────────────────────────────────────────────────────
function StreakCard({ streak }: { streak: number }) {
    const pulse = useSharedValue(1);
    const scale = useSharedValue(1);
    useEffect(() => {
        pulse.value = withRepeat(withTiming(1.04, { duration: 1800 }), -1, true);
    }, []);
    const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
    const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const label = streak === 0 ? 'Nenhuma sequência ativa' : streak < 7 ? 'Sequência iniciando' : streak < 30 ? 'Ritmo consistente' : 'Sequência lendária';

    return (
        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
                <Flame size={18} color="#ff9600" strokeWidth={2.5} />
                <Text style={styles.sectionTitle}>Ofensiva</Text>
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
                    </View>
                </Animated.View>
            </Pressable>
        </Animated.View>
    );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatsCard({ streak, learnings, xp, studyArea, sessionHours }: {
    streak: number; learnings: Learning[]; xp: number; studyArea: StudyArea; sessionHours: number;
}) {
    const cfg = AREA_CONFIG[studyArea];
    const todayCount = learnings.filter(l => new Date(l.date).toDateString() === new Date().toDateString()).length;
    const level = xp >= 1500 ? { label: 'DevOps', color: '#ffc800', Icon: TrendingUp } :
                  xp >= 800  ? { label: 'Sênior', color: '#ce82ff', Icon: TrendingUp } :
                  xp >= 300  ? { label: 'Pleno',  color: '#1cb0f6', Icon: Zap        } :
                               { label: 'Júnior', color: '#58cc02', Icon: Target     };
    const LvlIcon = level.Icon;

    const cells = [
        { Icon: Flame,    color: '#ff9600', value: `${streak}`,        unit: 'dias', label: 'Ofensiva', sub: streak === 0 ? 'Sem sequência' : streak >= 7 ? 'Consistente' : 'Em progresso' },
        { Icon: BookOpen, color: '#1cb0f6', value: `${todayCount}`,    unit: '',     label: 'Hoje',     sub: todayCount === 0 ? 'Nenhum registro' : `${todayCount} registro${todayCount !== 1 ? 's' : ''}` },
        { Icon: Star,     color: '#ffc800', value: `${xp}`,            unit: 'xp',   label: 'Total XP', sub: level.label },
        { Icon: cfg.Icon, color: cfg.color, value: `${sessionHours}`,  unit: 'h',    label: 'Sessão',   sub: cfg.label },
    ];

    return (
        <Animated.View entering={FadeInDown.delay(40).duration(500).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
                <BarChart2 size={18} color="#ce82ff" strokeWidth={2.5} />
                <Text style={styles.sectionTitle}>Métricas</Text>
                <View style={[sc.lvlChip, { borderColor: level.color + '40', backgroundColor: level.color + '12' }]}>
                    <LvlIcon size={12} color={level.color} strokeWidth={2.5} />
                    <Text style={[sc.lvlText, { color: level.color }]}>{level.label}</Text>
                </View>
            </View>
            <View style={sc.grid}>
                {cells.map((c, i) => {
                    const CIcon = c.Icon;
                    return (
                        <Animated.View key={i} entering={FadeInDown.delay(50 + i * 35).duration(400).springify()} style={[sc.cell, { borderColor: '#212b31' }]}>
                            <View style={[sc.iconBox, { backgroundColor: c.color + '20' }]}>
                                <CIcon size={20} color={c.color} strokeWidth={2.5} />
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
    lvlChip:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 2, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
    lvlText:  { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
    grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    cell:     { width: (SW - 44) / 2, backgroundColor: '#16151d', borderRadius: 20, padding: 16, borderWidth: 2, borderBottomWidth: 5, borderBottomColor: '#161c20', gap: 6 },
    iconBox:  { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    value:    { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
    unit:     { fontSize: 13, fontWeight: '800' },
    label:    { color: '#afb6b9', fontSize: 13, fontWeight: '800' },
    sub:      { color: '#6b6880', fontSize: 11, fontWeight: '700' },
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
                    <Clock size={12} color="#6b6880" strokeWidth={2.5} />
                    <Text style={styles.learningDate}>{formatAgo(item.date)}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Trash2 size={18} color="#ff4b4b" strokeWidth={2.5} />
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Learnings Card ───────────────────────────────────────────────────────────
function LearningsCard({ learnings, onAdd, onDelete }: {
    learnings: Learning[]; onAdd: (text: string, meta?: any) => void; onDelete: (id: string) => void;
}) {
    const [modalVisible, setModalVisible] = useState(false);
    const [expanded,     setExpanded]     = useState(false);
    const shown = expanded ? learnings : learnings.slice(0, 4);

    return (
        <Animated.View entering={FadeInDown.delay(160).duration(500).springify()} style={[styles.section, { marginBottom: 48 }]}>
            <View style={styles.sectionHeader}>
                <BookOpen size={18} color="#1cb0f6" strokeWidth={2.5} />
                <Text style={styles.sectionTitle}>Registros</Text>
                <TouchableOpacity style={styles.addIconBtn} onPress={() => setModalVisible(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Plus size={20} color="#1cb0f6" strokeWidth={3} />
                </TouchableOpacity>
            </View>

            {learnings.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Brain size={32} color="#44415a" strokeWidth={2} style={{ marginBottom: 10 }} />
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
                <Plus size={18} color="#fff" strokeWidth={3} />
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

    // Toda a lógica de dados, cache e sync vive no hook
    const {
        streak, learnings, studyArea, xp, sessionHours,
        syncing, isOnline,
        handleAddLearning, handleDeleteLearning,
    } = useHomeData();

    const stats: Stats = { totalHours: sessionHours, skills: 0, learnings: learnings.length };

    const firstName = user?.name?.split(' ')[0] ?? 'Dev';

    // ── Paralaxe ──────────────────────────────────────────────────────────────
    const {
        scrollHandler,
        titleStyle,
        subtitleStyle,
        collapsedTitleStyle,
        headerContainerStyle,
        headerBgStyle,
    } = useParallaxScroll();

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

            {/* Banner de offline — desliza de cima quando sem internet */}
            <OfflineBanner visible={!isOnline} />

            {/* ── Header colapsável com paralaxe ── */}
            <Animated.View style={[styles.headerContainer, headerContainerStyle]}>
                {/* Fundo sólido que aparece ao rolar */}
                <Animated.View style={[styles.headerBg, headerBgStyle]} />

                {/* Título expandido */}
                <Animated.View style={[styles.headerExpanded, titleStyle]}>
                    <View>
                        <Text style={styles.greeting}>Olá, {firstName}</Text>
                        <Animated.Text style={[styles.date, subtitleStyle]}>
                            {formatHeaderDate()}
                        </Animated.Text>
                    </View>
                    <View style={styles.headerXp}>
                        <Star size={16} color="#ffc800" fill="#ffc800" strokeWidth={2} />
                        <Text style={styles.headerXpText}>{xp} XP</Text>
                    </View>
                </Animated.View>

                {/* Mini-título colapsado */}
                <Animated.View style={[styles.headerCollapsed, collapsedTitleStyle]}>
                    <Text style={styles.headerCollapsedText}>DevTrack</Text>
                    <View style={styles.headerXpSmall}>
                        <Star size={12} color="#ffc800" fill="#ffc800" strokeWidth={2} />
                        <Text style={styles.headerXpSmallText}>{xp} XP</Text>
                    </View>
                </Animated.View>
            </Animated.View>

            {/* ── Scroll com handler de paralaxe ── */}
            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <StreakCard streak={streak} />
                <LearningsCard learnings={learnings} onAdd={handleAddLearning} onDelete={handleDeleteLearning} />
                <StatsCard streak={streak} learnings={learnings} xp={xp} studyArea={studyArea} sessionHours={stats.totalHours} />
                <PomodoroTimer />
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: '#131f24' },

    // Header paralaxe
    headerContainer:    { overflow: 'hidden', justifyContent: 'center', paddingHorizontal: 16 },
    headerBg:           { ...StyleSheet.absoluteFillObject, backgroundColor: '#131f24' },
    headerExpanded:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'absolute', left: 16, right: 16, bottom: 10 },
    headerCollapsed:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'absolute', left: 16, right: 16, bottom: 14 },
    headerCollapsedText:{ color: '#fff', fontSize: 18, fontWeight: '900' },
    headerXpSmall:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffc80020', borderWidth: 2, borderColor: '#ffc800', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
    headerXpSmallText:  { color: '#ffc800', fontSize: 13, fontWeight: '800' },

    greeting:     { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.4 },
    date:         { color: '#afb6b9', fontSize: 14, marginTop: 4, textTransform: 'capitalize', fontWeight: '600' },
    headerXp:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffc80020', borderWidth: 2, borderColor: '#ffc800', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
    headerXpText: { color: '#ffc800', fontSize: 14, fontWeight: '900' },

    content:      { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 10 },
    section:      { marginBottom: 24 },
    sectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '900', flex: 1 },

    streakCard:   { backgroundColor: '#16151d', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#212b31', borderBottomWidth: 5, borderBottomColor: '#161c20' },
    streakCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#ff9600', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 0, borderBottomWidth: 6, borderBottomColor: '#e58700' },
    streakNumber: { fontSize: 28, fontWeight: '900', color: '#fff', lineHeight: 30 },
    streakUnit:   { fontSize: 12, color: '#fff', opacity: 0.9, fontWeight: '800', textTransform: 'uppercase' },
    streakInfo:   { flex: 1 },
    streakLabel:  { color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 4 },
    streakSub:    { color: '#afb6b9', fontSize: 13, lineHeight: 18, fontWeight: '600' },

    addIconBtn:    { marginLeft: 'auto', padding: 6 },
    learningRow:   { flexDirection: 'row', backgroundColor: '#16151d', borderRadius: 16, padding: 16, marginBottom: 10, alignItems: 'flex-start', borderWidth: 2, borderColor: '#212b31', borderBottomWidth: 4, borderBottomColor: '#161c20' },
    learningDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1cb0f6', marginTop: 6, marginRight: 12, flexShrink: 0 },
    learningText:  { color: '#fff', lineHeight: 22, fontSize: 15, marginBottom: 6, fontWeight: '700' },
    learningMeta:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
    learningDate:  { color: '#6b6880', fontSize: 12, fontWeight: '600' },
    deleteBtn:     { padding: 8, marginLeft: 8 },
    expandBtn:     { alignItems: 'center', paddingVertical: 12, marginBottom: 4 },
    expandBtnText: { color: '#1cb0f6', fontSize: 14, fontWeight: '800' },
    emptyCard:     { backgroundColor: '#16151d', borderRadius: 20, padding: 32, borderWidth: 2, borderColor: '#212b31', borderBottomWidth: 4, borderBottomColor: '#161c20', alignItems: 'center', marginBottom: 10 },
    emptyText:     { color: '#afb6b9', fontSize: 14, fontWeight: '700' },
    addBtn:        { backgroundColor: '#1cb0f6', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 6, borderWidth: 0, borderBottomWidth: 5, borderBottomColor: '#1899d6' },
    addBtnText:    { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
});