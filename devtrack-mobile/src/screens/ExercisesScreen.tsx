// src/screens/ExercisesScreen.tsx — layout redesenhado
import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity,
    Modal, Dimensions, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeInDown, FadeInLeft,
    useSharedValue, useAnimatedStyle,
    withSpring, withDelay, withTiming, withSequence,
    interpolate, Extrapolation,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    CheckCircle, Circle, X, Star,
    Lightbulb, BookOpen, Code2, Target, Zap, Lock,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { getStorageKeys } from '../services/userService';
import {
    EXERCISES, CATEGORY_META,
    type Exercise, type Category,
} from '../data/exercises';

const { width: SW } = Dimensions.get('window');

const DIFF_COLORS = {
    iniciante:     '#10b981',
    intermediário: '#f59e0b',
    avançado:      '#ef4444',
} as const;

function categoryColor(cat: Category): string {
    return CATEGORY_META.find(c => c.id === cat)?.color ?? '#8b5cf6';
}

// ─── Filter Transition Hook ───────────────────────────────────────────────────
function useFilterTransition() {
    const opacity    = useSharedValue(1);
    const translateY = useSharedValue(0);
    const transition = (callback: () => void) => {
        opacity.value    = withTiming(0, { duration: 100 });
        translateY.value = withTiming(-4, { duration: 100 });
        setTimeout(() => {
            callback();
            opacity.value    = withSpring(1, { damping: 20, stiffness: 220 });
            translateY.value = withSpring(0, { damping: 20, stiffness: 220 });
        }, 110);
    };
    const style = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));
    return { transition, style };
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ visible, exercise, completed, onClose, onComplete }: {
    visible: boolean; exercise: Exercise | null;
    completed: boolean; onClose: () => void; onComplete: () => void;
}) {
    if (!exercise) return null;
    const color     = categoryColor(exercise.category);
    const diffColor = DIFF_COLORS[exercise.difficulty];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={s.detailContainer} edges={['top', 'left', 'right']}>
                <View style={s.detailHeader}>
                    <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                        <X size={18} color="#6b6880" strokeWidth={2} />
                    </TouchableOpacity>
                </View>
                <Animated.ScrollView contentContainerStyle={s.detailBody} showsVerticalScrollIndicator={false}>
                    <Animated.View entering={FadeInDown.delay(50).duration(320)} style={s.detailIconRow}>
                        <View style={[s.detailIconWrap, { backgroundColor: color + '18', borderColor: color + '40' }]}>
                            <Code2 size={26} color={color} strokeWidth={2} />
                        </View>
                        {completed && (
                            <View style={s.donePill}>
                                <CheckCircle size={11} color="#10b981" strokeWidth={2.5} />
                                <Text style={s.donePillText}>Concluído</Text>
                            </View>
                        )}
                    </Animated.View>

                    <Animated.Text entering={FadeInDown.delay(80).duration(300)} style={s.detailTitle}>
                        {exercise.title}
                    </Animated.Text>
                    <Animated.Text entering={FadeInDown.delay(100).duration(300)} style={s.detailDesc}>
                        {exercise.description}
                    </Animated.Text>

                    <Animated.View entering={FadeInDown.delay(120).duration(280)} style={s.metaRow}>
                        <View style={[s.pill, { backgroundColor: diffColor + '18', borderColor: diffColor + '40' }]}>
                            <Text style={[s.pillText, { color: diffColor }]}>{exercise.difficulty}</Text>
                        </View>
                        <View style={[s.pill, { backgroundColor: color + '18', borderColor: color + '40' }]}>
                            <Text style={[s.pillText, { color }]}>
                                {CATEGORY_META.find(c => c.id === exercise.category)?.label}
                            </Text>
                        </View>
                        <View style={[s.pill, { backgroundColor: '#f59e0b18', borderColor: '#f59e0b40' }]}>
                            <Star size={10} color="#f59e0b" strokeWidth={2} />
                            <Text style={[s.pillText, { color: '#f59e0b' }]}>{exercise.xp} XP</Text>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(150).duration(280)} style={s.detailCard}>
                        <View style={s.detailCardLabelRow}>
                            <BookOpen size={12} color="#44415a" strokeWidth={2} />
                            <Text style={s.detailCardLabel}>Enunciado</Text>
                        </View>
                        <Text style={s.detailCardBody}>{exercise.detail}</Text>
                    </Animated.View>

                    {exercise.example && (
                        <Animated.View entering={FadeInDown.delay(170).duration(280)} style={[s.detailCard, s.exampleCard]}>
                            <View style={s.detailCardLabelRow}>
                                <Target size={12} color="#06b6d4" strokeWidth={2} />
                                <Text style={[s.detailCardLabel, { color: '#06b6d4' }]}>Exemplo</Text>
                            </View>
                            <Text style={s.exampleText}>{exercise.example}</Text>
                        </Animated.View>
                    )}

                    <Animated.View entering={FadeInDown.delay(190).duration(280)} style={[s.detailCard, s.hintCard]}>
                        <View style={s.detailCardLabelRow}>
                            <Lightbulb size={12} color="#f59e0b" strokeWidth={2} />
                            <Text style={[s.detailCardLabel, { color: '#f59e0b' }]}>Dica</Text>
                        </View>
                        <Text style={s.hintText}>{exercise.hint}</Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(210).duration(280)} style={s.tagsRow}>
                        {exercise.tags.map((tag, i) => (
                            <Animated.View key={tag} entering={FadeInDown.delay(210 + i * 25).duration(250)} style={s.tag}>
                                <Text style={s.tagText}>#{tag}</Text>
                            </Animated.View>
                        ))}
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(230).duration(300)}>
                        <TouchableOpacity
                            style={[s.completeBtn,
                                completed
                                    ? { backgroundColor: '#10b98115', borderWidth: 1, borderColor: '#10b98140' }
                                    : { backgroundColor: color },
                            ]}
                            onPress={() => { if (!completed) onComplete(); }}
                            disabled={completed}
                        >
                            {completed
                                ? <><CheckCircle size={15} color="#10b981" strokeWidth={2.5} /><Text style={[s.completeBtnText, { color: '#10b981' }]}>Concluído!</Text></>
                                : <><CheckCircle size={15} color="#fff" strokeWidth={2.5} /><Text style={s.completeBtnText}>Marcar como concluído</Text></>
                            }
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

// ─── Summary Bar ───────────────────────────────────────────────────────────────
function SummaryBar({ completed, total, xp }: { completed: number; total: number; xp: number }) {
    return (
        <Animated.View entering={FadeInDown.delay(50).duration(350)} style={s.summaryBar}>
            <View style={s.summaryItem}>
                <CheckCircle size={14} color="#10b981" strokeWidth={2} />
                <Text style={s.summaryNum}>{completed}</Text>
                <Text style={s.summaryLabel}>Concluídos</Text>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryItem}>
                <Target size={14} color="#8b5cf6" strokeWidth={2} />
                <Text style={s.summaryNum}>{total - completed}</Text>
                <Text style={s.summaryLabel}>Restantes</Text>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryItem}>
                <Star size={14} color="#f59e0b" strokeWidth={2} />
                <Text style={s.summaryNum}>{xp}</Text>
                <Text style={s.summaryLabel}>XP ganho</Text>
            </View>
        </Animated.View>
    );
}

// ─── Filter Pill ──────────────────────────────────────────────────────────────
function FilterPill({ label, active, color, onPress }: {
    label: string; active: boolean; color?: string; onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[s.filterPill,
                active && { backgroundColor: color ? color + '20' : '#8b5cf620', borderColor: color ? color + '50' : '#8b5cf650' }
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text style={[s.filterPillText, active && { color: color ?? '#8b5cf6', fontWeight: '700' }]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

// ─── Exercise Card ─────────────────────────────────────────────────────────────
function ExerciseCard({ exercise, completed, onPress, delay }: {
    exercise: Exercise; completed: boolean; onPress: () => void; delay: number;
}) {
    const color      = categoryColor(exercise.category);
    const diffColor  = DIFF_COLORS[exercise.difficulty];
    const scale      = useSharedValue(1);
    const checkScale = useSharedValue(completed ? 1 : 0);

    useEffect(() => {
        if (completed) {
            checkScale.value = withSequence(withSpring(1.3, { damping: 10 }), withSpring(1, { damping: 14 }));
        } else {
            checkScale.value = withTiming(0, { duration: 150 });
        }
    }, [completed]);

    const scaleStyle  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    const checkStyle  = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }], opacity: checkScale.value > 0 ? 1 : 0, position: 'absolute' as const }));
    const emptyStyle  = useAnimatedStyle(() => ({ opacity: interpolate(checkScale.value, [0, 1], [1, 0], Extrapolation.CLAMP) }));

    return (
        <Animated.View entering={FadeInLeft.delay(delay).duration(300)} style={scaleStyle}>
            <TouchableOpacity
                style={[s.card, completed && s.cardDone]}
                onPress={onPress}
                activeOpacity={0.82}
                onPressIn={() => (scale.value = withSpring(0.97, { damping: 15 }))}
                onPressOut={() => (scale.value = withSpring(1, { damping: 12 }))}
            >
                <View style={[s.cardAccent, { backgroundColor: color }]} />

                {/* Check animado */}
                <View style={s.cardCheck}>
                    <Animated.View style={checkStyle}>
                        <CheckCircle size={19} color="#10b981" strokeWidth={2.5} />
                    </Animated.View>
                    <Animated.View style={emptyStyle}>
                        <Circle size={19} color="#2a2040" strokeWidth={2} />
                    </Animated.View>
                </View>

                <View style={s.cardBody}>
                    <Text style={[s.cardTitle, completed && s.cardTitleDone]} numberOfLines={1}>
                        {exercise.title}
                    </Text>
                    <Text style={s.cardDesc} numberOfLines={1}>{exercise.description}</Text>
                    <View style={s.cardFooter}>
                        <View style={[s.diffChip, { backgroundColor: diffColor + '18', borderColor: diffColor + '40' }]}>
                            <Text style={[s.diffChipText, { color: diffColor }]}>{exercise.difficulty}</Text>
                        </View>
                        <View style={s.xpRow}>
                            <Star size={9} color="#f59e0b" strokeWidth={2} />
                            <Text style={s.xpText}>{exercise.xp} XP</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Category Header ──────────────────────────────────────────────────────────
function CategoryHeader({ catId, completedInCat, total, delay }: {
    catId: Category; completedInCat: number; total: number; delay: number;
}) {
    const meta   = CATEGORY_META.find(c => c.id === catId)!;
    const barW   = useSharedValue(0);
    const pct    = total > 0 ? completedInCat / total : 0;

    useEffect(() => {
        barW.value = withDelay(delay + 150, withSpring(Math.min(pct, 1), { damping: 16, stiffness: 80 }));
    }, [pct]);

    const barStyle = useAnimatedStyle(() => ({
        width: `${Math.min(barW.value * 100, 100)}%` as any,
    }));

    return (
        <Animated.View entering={FadeInDown.delay(delay).duration(320)} style={[s.catHeader, { borderColor: meta.color + '28' }]}>
            <Text style={s.catEmoji}>{meta.emoji}</Text>
            <View style={{ flex: 1 }}>
                <Text style={[s.catLabel, { color: meta.color }]}>{meta.label}</Text>
                <View style={s.catTrack}>
                    <Animated.View style={[s.catFill, { backgroundColor: meta.color }, barStyle]} />
                </View>
            </View>
            <Text style={[s.catCount, { color: meta.color }]}>{completedInCat}/{total}</Text>
        </Animated.View>
    );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
type Filter = 'all' | 'pending' | 'done';

export default function ExercisesScreen() {
    const { user }  = useAuth();
    const email     = user?.email ?? '';
    const keys      = email ? getStorageKeys(email) : null;
    const DONE_KEY  = keys ? `${keys.profile}_EXERCISES_DONE` : null;
    const XP_KEY    = keys ? `${keys.profile}_EXERCISES_XP`   : null;

    const [completed, setCompleted] = useState<Set<string>>(new Set());
    const [filter,    setFilter]    = useState<Filter>('all');
    const [catFilter, setCatFilter] = useState<Category | 'all'>('all');
    const [selected,  setSelected]  = useState<Exercise | null>(null);
    const [showModal, setShowModal] = useState(false);

    const { transition: filterTransition, style: listStyle } = useFilterTransition();

    useEffect(() => {
        const load = async () => {
            if (!DONE_KEY) return;
            const raw = await AsyncStorage.getItem(DONE_KEY);
            if (raw) setCompleted(new Set(JSON.parse(raw)));
        };
        load();
    }, [DONE_KEY]);

    const handleComplete = useCallback(async () => {
        if (!selected || !DONE_KEY || !XP_KEY) return;
        const updated = new Set(completed).add(selected.id);
        const newXp   = [...updated].reduce((acc, id) => {
            const ex = EXERCISES.find(e => e.id === id);
            return acc + (ex?.xp ?? 0);
        }, 0);
        setCompleted(updated);
        await AsyncStorage.setItem(DONE_KEY, JSON.stringify([...updated]));
        await AsyncStorage.setItem(XP_KEY, String(newXp));
    }, [selected, completed, DONE_KEY, XP_KEY]);

    const totalXp = [...completed].reduce((acc, id) => {
        const ex = EXERCISES.find(e => e.id === id);
        return acc + (ex?.xp ?? 0);
    }, 0);

    const setFilterAnimated = (f: Filter) => filterTransition(() => setFilter(f));
    const setCatAnimated    = (c: Category | 'all') => filterTransition(() => setCatFilter(c));

    const filtered = EXERCISES.filter(ex => {
        const catOk    = catFilter === 'all' || ex.category === catFilter;
        const statusOk = filter === 'all' ? true : filter === 'done' ? completed.has(ex.id) : !completed.has(ex.id);
        return catOk && statusOk;
    });

    const visibleCats = CATEGORY_META.filter(cat => filtered.some(ex => ex.category === cat.id));
    const FILTER_LABELS: Record<Filter, string> = { all: 'Todos', pending: 'Pendentes', done: 'Concluídos' };

    return (
        <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>

            {/* Header estático simples */}
            <Animated.View entering={FadeInDown.duration(350)} style={s.header}>
                <View>
                    <Text style={s.headerTitle}>Exercícios</Text>
                    <Text style={s.headerSub}>{EXERCISES.length} desafios · {CATEGORY_META.length} categorias</Text>
                </View>
                <View style={s.headerXp}>
                    <Zap size={12} color="#8b5cf6" strokeWidth={2} />
                    <Text style={s.headerXpText}>{totalXp} XP</Text>
                </View>
            </Animated.View>

            {/* Summary Bar */}
            <SummaryBar completed={completed.size} total={EXERCISES.length} xp={totalXp} />

            {/* Filtros status */}
            <Animated.View entering={FadeInDown.delay(90).duration(300)} style={s.filterStatusRow}>
                {(['all', 'pending', 'done'] as Filter[]).map(f => (
                    <FilterPill
                        key={f}
                        label={FILTER_LABELS[f]}
                        active={filter === f}
                        onPress={() => setFilterAnimated(f)}
                    />
                ))}
            </Animated.View>

            {/* Filtros categoria */}
            <Animated.ScrollView
                entering={FadeInDown.delay(120).duration(300)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.filterCatRow}
            >
                <FilterPill label="Todas" active={catFilter === 'all'} onPress={() => setCatAnimated('all')} />
                {CATEGORY_META.map(cat => (
                    <FilterPill
                        key={cat.id}
                        label={`${cat.emoji} ${cat.label}`}
                        active={catFilter === cat.id}
                        color={cat.color}
                        onPress={() => setCatAnimated(catFilter === cat.id ? 'all' : cat.id as Category)}
                    />
                ))}
            </Animated.ScrollView>

            {/* Lista */}
            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scroll}
            >
                <Animated.View style={listStyle}>
                    {visibleCats.map((cat, gi) => {
                        const catExercises   = filtered.filter(ex => ex.category === cat.id);
                        const completedInCat = catExercises.filter(ex => completed.has(ex.id)).length;

                        return (
                            <View key={cat.id} style={s.group}>
                                <CategoryHeader
                                    catId={cat.id}
                                    completedInCat={completedInCat}
                                    total={catExercises.length}
                                    delay={gi * 35}
                                />
                                {catExercises.map((ex, i) => (
                                    <ExerciseCard
                                        key={ex.id}
                                        exercise={ex}
                                        completed={completed.has(ex.id)}
                                        delay={gi * 35 + i * 28}
                                        onPress={() => { setSelected(ex); setShowModal(true); }}
                                    />
                                ))}
                            </View>
                        );
                    })}

                    {filtered.length === 0 && (
                        <Animated.View entering={FadeInDown.duration(280)} style={s.empty}>
                            <BookOpen size={28} color="#2a2040" strokeWidth={1.5} style={{ marginBottom: 10 }} />
                            <Text style={s.emptyText}>Nenhum exercício aqui.</Text>
                        </Animated.View>
                    )}
                </Animated.View>
                <View style={{ height: 48 }} />
            </Animated.ScrollView>

            <DetailModal
                visible={showModal}
                exercise={selected}
                completed={selected ? completed.has(selected.id) : false}
                onClose={() => setShowModal(false)}
                onComplete={handleComplete}
            />
        </SafeAreaView>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#0d0d10' },
    scroll:      { paddingBottom: 24 },

    header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    headerSub:   { color: '#6b6880', fontSize: 12, marginTop: 2 },
    headerXp:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#8b5cf618', borderWidth: 1, borderColor: '#8b5cf635', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    headerXpText:{ color: '#8b5cf6', fontSize: 12, fontWeight: '700' },

    summaryBar:     { flexDirection: 'row', backgroundColor: '#16151d', borderRadius: 14, marginHorizontal: 16, marginBottom: 14, padding: 12, borderWidth: 1, borderColor: '#2a2040' },
    summaryItem:    { flex: 1, alignItems: 'center', gap: 3 },
    summaryNum:     { color: '#fff', fontSize: 17, fontWeight: '900' },
    summaryLabel:   { color: '#6b6880', fontSize: 10, fontWeight: '600' },
    summaryDivider: { width: 1, backgroundColor: '#2a2040', marginVertical: 2 },

    filterStatusRow:{ flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 8 },
    filterCatRow:   { paddingHorizontal: 16, gap: 6, paddingBottom: 14 },
    filterPill:     { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, backgroundColor: '#16151d', borderWidth: 1, borderColor: '#2a2040' },
    filterPillText: { color: '#6b6880', fontSize: 12, fontWeight: '600' },

    group:          { paddingHorizontal: 16, marginBottom: 6 },

    catHeader:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#16151d', borderRadius: 12, padding: 10, marginBottom: 8, marginTop: 4, borderWidth: 1 },
    catEmoji:       { fontSize: 20, width: 28, textAlign: 'center' },
    catLabel:       { fontSize: 13, fontWeight: '800', marginBottom: 4 },
    catTrack:       { height: 4, backgroundColor: '#1a1826', borderRadius: 2, overflow: 'hidden' },
    catFill:        { height: '100%', borderRadius: 2 },
    catCount:       { fontSize: 13, fontWeight: '900' },

    card:           { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16151d', borderRadius: 12, marginBottom: 6, borderWidth: 1, borderColor: '#2a2040', overflow: 'hidden' },
    cardDone:       { borderColor: '#10b98125', backgroundColor: '#0d1a16' },
    cardAccent:     { width: 3, alignSelf: 'stretch' },
    cardCheck:      { padding: 12, width: 44, alignItems: 'center', justifyContent: 'center' },
    cardBody:       { flex: 1, paddingVertical: 11, paddingRight: 12, gap: 3 },
    cardTitle:      { color: '#fff', fontSize: 13, fontWeight: '700' },
    cardTitleDone:  { color: '#10b981', textDecorationLine: 'line-through', opacity: 0.75 },
    cardDesc:       { color: '#7a7590', fontSize: 12 },
    cardFooter:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
    diffChip:       { borderWidth: 1, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
    diffChipText:   { fontSize: 10, fontWeight: '700' },
    xpRow:          { flexDirection: 'row', alignItems: 'center', gap: 3 },
    xpText:         { color: '#f59e0b', fontSize: 10, fontWeight: '700' },

    empty:          { alignItems: 'center', paddingVertical: 60 },
    emptyText:      { color: '#44415a', fontSize: 14 },

    // Detail Modal
    detailContainer: { flex: 1, backgroundColor: '#0d0d10' },
    detailHeader:    { flexDirection: 'row', justifyContent: 'flex-end', padding: 14, paddingBottom: 6 },
    closeBtn:        { backgroundColor: '#1e1c2e', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#2a2040' },
    detailBody:      { padding: 20, paddingBottom: 48 },
    detailIconRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    detailIconWrap:  { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    donePill:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#10b98118', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#10b98140' },
    donePillText:    { color: '#10b981', fontSize: 11, fontWeight: '700' },
    detailTitle:     { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 6, lineHeight: 26 },
    detailDesc:      { color: '#9aa0aa', fontSize: 14, lineHeight: 21, marginBottom: 14 },
    metaRow:         { flexDirection: 'row', gap: 7, marginBottom: 18, flexWrap: 'wrap' },
    pill:            { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
    pillText:        { fontSize: 11, fontWeight: '700' },
    detailCard:      { backgroundColor: '#16151d', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2a2040', marginBottom: 12 },
    detailCardLabelRow:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    detailCardLabel: { color: '#44415a', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
    detailCardBody:  { color: '#d4d0e8', fontSize: 14, lineHeight: 23 },
    exampleCard:     { borderColor: '#06b6d430' },
    exampleText:     { color: '#d4d0e8', fontSize: 13, lineHeight: 21, fontFamily: 'monospace' },
    hintCard:        { borderColor: '#f59e0b30' },
    hintText:        { color: '#d4d0e8', fontSize: 13, lineHeight: 21 },
    tagsRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
    tag:             { backgroundColor: '#1a1826', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: '#2a2040' },
    tagText:         { color: '#6b6880', fontSize: 11 },
    completeBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 15, marginTop: 4 },
    completeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});