// src/screens/ExercisesScreen.tsx — com paralaxe + transições de filtro animadas
import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity,
    Modal, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeInDown, FadeInLeft,
    useSharedValue, useAnimatedStyle,
    withSpring, withDelay, withTiming, withSequence,
    interpolate, Extrapolation, runOnJS,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    CheckCircle, Circle, X, Star,
    ChevronRight, Lightbulb, BookOpen, Code2,
    Target, Zap,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { getStorageKeys } from '../services/userService';
import { useParallaxScroll } from '../hooks/useParallaxScroll';
import {
    EXERCISES, CATEGORY_META,
    type Exercise, type Category,
} from '../data/exercises';

const { width: SW } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DIFF_COLORS = {
    iniciante:     '#10b981',
    intermediário: '#f59e0b',
    avançado:      '#ef4444',
} as const;

function categoryColor(cat: Category): string {
    return CATEGORY_META.find(c => c.id === cat)?.color ?? '#8b5cf6';
}

// ─── Hook: transição suave ao trocar filtro ───────────────────────────────────
function useFilterTransition() {
    const opacity   = useSharedValue(1);
    const translateY = useSharedValue(0);

    const transition = (callback: () => void) => {
        // Fade out + slide up leve
        opacity.value    = withTiming(0, { duration: 110 });
        translateY.value = withTiming(-6, { duration: 110 });
        setTimeout(() => {
            callback();
            opacity.value    = withSpring(1, { damping: 20, stiffness: 220 });
            translateY.value = withSpring(0, { damping: 20, stiffness: 220 });
        }, 120);
    };

    const style = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return { transition, style };
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({
    visible, exercise, completed, onClose, onComplete,
}: {
    visible: boolean; exercise: Exercise | null;
    completed: boolean; onClose: () => void; onComplete: () => void;
}) {
    if (!exercise) return null;
    const color     = categoryColor(exercise.category);
    const diffColor = DIFF_COLORS[exercise.difficulty];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={dm.container} edges={['top', 'left', 'right']}>
                <View style={dm.header}>
                    <TouchableOpacity style={dm.closeBtn} onPress={onClose}>
                        <X size={18} color="#6b6880" strokeWidth={2} />
                    </TouchableOpacity>
                </View>

                <Animated.ScrollView
                    contentContainerStyle={dm.body}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeInDown.delay(60).duration(340).springify()} style={dm.iconRow}>
                        <View style={[dm.iconWrap, { backgroundColor: color + '18', borderColor: color + '40' }]}>
                            <Code2 size={28} color={color} strokeWidth={2} />
                        </View>
                        {completed && (
                            <View style={dm.doneBadge}>
                                <CheckCircle size={12} color="#10b981" strokeWidth={2.5} />
                                <Text style={dm.doneBadgeText}>Concluído</Text>
                            </View>
                        )}
                    </Animated.View>

                    <Animated.Text entering={FadeInDown.delay(90).duration(340)} style={dm.title}>
                        {exercise.title}
                    </Animated.Text>
                    <Animated.Text entering={FadeInDown.delay(110).duration(340)} style={dm.desc}>
                        {exercise.description}
                    </Animated.Text>

                    <Animated.View entering={FadeInDown.delay(130).duration(320)} style={dm.metaRow}>
                        <View style={[dm.badge, { backgroundColor: diffColor + '18', borderColor: diffColor + '40' }]}>
                            <Text style={[dm.badgeText, { color: diffColor }]}>{exercise.difficulty}</Text>
                        </View>
                        <View style={[dm.badge, { backgroundColor: color + '18', borderColor: color + '40' }]}>
                            <Text style={[dm.badgeText, { color }]}>
                                {CATEGORY_META.find(c => c.id === exercise.category)?.label}
                            </Text>
                        </View>
                        <View style={[dm.badge, { backgroundColor: '#f59e0b18', borderColor: '#f59e0b40' }]}>
                            <Star size={10} color="#f59e0b" strokeWidth={2} />
                            <Text style={[dm.badgeText, { color: '#f59e0b' }]}>{exercise.xp} XP</Text>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(160).duration(320)} style={dm.section}>
                        <View style={dm.sectionLabelRow}>
                            <BookOpen size={13} color="#44415a" strokeWidth={2} />
                            <Text style={dm.sectionLabel}>Enunciado</Text>
                        </View>
                        <Text style={dm.sectionBody}>{exercise.detail}</Text>
                    </Animated.View>

                    {exercise.example && (
                        <Animated.View entering={FadeInDown.delay(190).duration(320)} style={[dm.section, dm.exampleBox]}>
                            <View style={dm.sectionLabelRow}>
                                <Target size={13} color="#06b6d4" strokeWidth={2} />
                                <Text style={[dm.sectionLabel, { color: '#06b6d4' }]}>Exemplo</Text>
                            </View>
                            <Text style={dm.exampleText}>{exercise.example}</Text>
                        </Animated.View>
                    )}

                    <Animated.View entering={FadeInDown.delay(210).duration(320)} style={[dm.section, dm.hintBox]}>
                        <View style={dm.sectionLabelRow}>
                            <Lightbulb size={13} color="#f59e0b" strokeWidth={2} />
                            <Text style={[dm.sectionLabel, { color: '#f59e0b' }]}>Dica</Text>
                        </View>
                        <Text style={dm.hintText}>{exercise.hint}</Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(230).duration(320)} style={dm.tagsRow}>
                        {exercise.tags.map((tag, i) => (
                            <Animated.View key={tag} entering={FadeInDown.delay(230 + i * 30).duration(280)} style={dm.tag}>
                                <Text style={dm.tagText}>#{tag}</Text>
                            </Animated.View>
                        ))}
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(260).duration(340).springify()}>
                        <TouchableOpacity
                            style={[
                                dm.completeBtn,
                                completed
                                    ? { backgroundColor: '#10b98115', borderWidth: 1, borderColor: '#10b98140' }
                                    : { backgroundColor: color },
                            ]}
                            onPress={() => { if (!completed) onComplete(); }}
                            disabled={completed}
                            activeOpacity={0.85}
                        >
                            {completed ? (
                                <>
                                    <CheckCircle size={16} color="#10b981" strokeWidth={2.5} />
                                    <Text style={[dm.completeBtnText, { color: '#10b981' }]}>Exercício concluído!</Text>
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={16} color="#fff" strokeWidth={2.5} />
                                    <Text style={dm.completeBtnText}>Marcar como concluído</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

const dm = StyleSheet.create({
    container:     { flex: 1, backgroundColor: '#0d0d10' },
    header:        { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, paddingBottom: 8 },
    closeBtn:      { backgroundColor: '#1e1c2e', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#2a2040' },
    body:          { padding: 20, paddingBottom: 48 },
    iconRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    iconWrap:      { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    doneBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#10b98118', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#10b98140' },
    doneBadgeText: { color: '#10b981', fontSize: 12, fontWeight: '700' },
    title:         { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 8, lineHeight: 28 },
    desc:          { color: '#9aa0aa', fontSize: 14, lineHeight: 22, marginBottom: 16 },
    metaRow:       { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
    badge:         { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText:     { fontSize: 12, fontWeight: '700' },
    section:       { backgroundColor: '#16151d', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2a2040', marginBottom: 12 },
    sectionLabelRow:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    sectionLabel:  { color: '#44415a', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    sectionBody:   { color: '#d4d0e8', fontSize: 14, lineHeight: 24 },
    exampleBox:    { borderColor: '#06b6d430' },
    exampleText:   { color: '#d4d0e8', fontSize: 13, lineHeight: 22, fontFamily: 'monospace' },
    hintBox:       { borderColor: '#f59e0b30' },
    hintText:      { color: '#d4d0e8', fontSize: 13, lineHeight: 22 },
    tagsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 24 },
    tag:           { backgroundColor: '#1a1826', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#2a2040' },
    tagText:       { color: '#6b6880', fontSize: 11 },
    completeBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 16 },
    completeBtnText:{ color: '#fff', fontSize: 15, fontWeight: '700' },
});

// ─── Exercise Card com animação de check ─────────────────────────────────────
function ExerciseCard({
    exercise, completed, onPress, delay,
}: {
    exercise: Exercise; completed: boolean; onPress: () => void; delay: number;
}) {
    const color      = categoryColor(exercise.category);
    const diffColor  = DIFF_COLORS[exercise.difficulty];
    const scale      = useSharedValue(1);
    const checkScale = useSharedValue(completed ? 1 : 0);
    const checkOpacity = useSharedValue(completed ? 1 : 0);

    // Anima o check quando o exercício é concluído
    useEffect(() => {
        if (completed) {
            checkScale.value   = withSequence(withSpring(1.3, { damping: 10 }), withSpring(1, { damping: 14 }));
            checkOpacity.value = withTiming(1, { duration: 200 });
        } else {
            checkScale.value   = withTiming(0, { duration: 150 });
            checkOpacity.value = withTiming(0, { duration: 150 });
        }
    }, [completed]);

    const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    const checkStyle = useAnimatedStyle(() => ({
        transform: [{ scale: checkScale.value }],
        opacity: checkOpacity.value,
        position: 'absolute',
    }));
    const emptyStyle = useAnimatedStyle(() => ({
        opacity: interpolate(checkOpacity.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    }));

    return (
        <Animated.View entering={FadeInLeft.delay(delay).duration(320)} style={scaleStyle}>
            <TouchableOpacity
                style={[styles.card, completed && styles.cardDone]}
                onPress={onPress}
                activeOpacity={0.8}
                onPressIn={() => (scale.value = withSpring(0.97, { damping: 15 }))}
                onPressOut={() => (scale.value = withSpring(1, { damping: 12 }))}
            >
                <View style={[styles.cardAccent, { backgroundColor: color }]} />

                {/* Check animado */}
                <View style={styles.cardCheckWrap}>
                    <Animated.View style={checkStyle}>
                        <CheckCircle size={20} color="#10b981" strokeWidth={2.5} />
                    </Animated.View>
                    <Animated.View style={emptyStyle}>
                        <Circle size={20} color="#2a2040" strokeWidth={2} />
                    </Animated.View>
                </View>

                <View style={styles.cardBody}>
                    <Text style={[styles.cardTitle, completed && styles.cardTitleDone]} numberOfLines={1}>
                        {exercise.title}
                    </Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                        {exercise.description}
                    </Text>
                    <View style={styles.cardFooter}>
                        <View style={[styles.diffChip, { backgroundColor: diffColor + '20', borderColor: diffColor + '40' }]}>
                            <Text style={[styles.diffText, { color: diffColor }]}>{exercise.difficulty}</Text>
                        </View>
                        <View style={styles.xpChip}>
                            <Star size={9} color="#f59e0b" strokeWidth={2} />
                            <Text style={styles.xpText}>{exercise.xp} XP</Text>
                        </View>
                    </View>
                </View>

                <ChevronRight size={14} color="#44415a" strokeWidth={2} />
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Category Header com barra de progresso ───────────────────────────────────
function CategoryHeader({ catId, completedInCat, total, delay }: {
    catId: Category; completedInCat: number; total: number; delay: number;
}) {
    const meta     = CATEGORY_META.find(c => c.id === catId)!;
    const barWidth = useSharedValue(0);
    const pct      = total > 0 ? completedInCat / total : 0;

    useEffect(() => {
        barWidth.value = withDelay(delay + 200, withSpring(Math.min(pct, 1), { damping: 16, stiffness: 80 }));
    }, [pct]);

    const barStyle = useAnimatedStyle(() => ({
        width: `${Math.min(barWidth.value * 100, 100)}%` as any,
    }));

    return (
        <Animated.View entering={FadeInDown.delay(delay).duration(350).springify()} style={[ch.wrap, { borderColor: meta.color + '30' }]}>
            <View style={ch.row}>
                <Text style={ch.emoji}>{meta.emoji}</Text>
                <View style={{ flex: 1 }}>
                    <Text style={[ch.label, { color: meta.color }]}>{meta.label}</Text>
                    <Text style={ch.desc}>{meta.description}</Text>
                </View>
                <Text style={[ch.progress, { color: meta.color }]}>{completedInCat}/{total}</Text>
            </View>
            <View style={ch.track}>
                <Animated.View style={[ch.fill, { backgroundColor: meta.color }, barStyle]} />
            </View>
        </Animated.View>
    );
}

const ch = StyleSheet.create({
    wrap:     { backgroundColor: '#16151d', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1 },
    row:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    emoji:    { fontSize: 22 },
    label:    { fontSize: 14, fontWeight: '800' },
    desc:     { color: '#44415a', fontSize: 11, marginTop: 1 },
    progress: { fontSize: 14, fontWeight: '900' },
    track:    { height: 4, backgroundColor: '#1a1826', borderRadius: 2, overflow: 'hidden' },
    fill:     { height: '100%', borderRadius: 2 },
});

// ─── Summary Bar ──────────────────────────────────────────────────────────────
function SummaryBar({ completed, total, xp }: { completed: number; total: number; xp: number }) {
    return (
        <Animated.View entering={FadeInDown.delay(60).duration(380)} style={sb.wrap}>
            <View style={sb.item}>
                <CheckCircle size={15} color="#10b981" strokeWidth={2} />
                <Text style={sb.value}>{completed}</Text>
                <Text style={sb.label}>Concluídos</Text>
            </View>
            <View style={sb.divider} />
            <View style={sb.item}>
                <Target size={15} color="#8b5cf6" strokeWidth={2} />
                <Text style={sb.value}>{total - completed}</Text>
                <Text style={sb.label}>Restantes</Text>
            </View>
            <View style={sb.divider} />
            <View style={sb.item}>
                <Star size={15} color="#f59e0b" strokeWidth={2} />
                <Text style={sb.value}>{xp}</Text>
                <Text style={sb.label}>XP ganho</Text>
            </View>
        </Animated.View>
    );
}

const sb = StyleSheet.create({
    wrap:    { flexDirection: 'row', backgroundColor: '#16151d', borderRadius: 16, marginHorizontal: 16, marginBottom: 16, padding: 14, borderWidth: 1, borderColor: '#2a2040' },
    item:    { flex: 1, alignItems: 'center', gap: 3 },
    value:   { color: '#fff', fontSize: 18, fontWeight: '900' },
    label:   { color: '#6b6880', fontSize: 10, fontWeight: '600' },
    divider: { width: 1, backgroundColor: '#2a2040', marginVertical: 4 },
});

// ─── Filter Pill animado ──────────────────────────────────────────────────────
function FilterPill({
    label, active, color, onPress,
}: {
    label: string; active: boolean; color?: string; onPress: () => void;
}) {
    const scale   = useSharedValue(1);
    const bgOpacity = useSharedValue(active ? 1 : 0);

    useEffect(() => {
        bgOpacity.value = withSpring(active ? 1 : 0, { damping: 18, stiffness: 200 });
    }, [active]);

    const pillStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        backgroundColor: active
            ? (color ? color + '22' : '#8b5cf622')
            : '#16151d',
        borderColor: active
            ? (color ? color + '55' : '#8b5cf655')
            : '#2a2040',
    }));

    return (
        <Animated.View style={[styles.filterPill, pillStyle]}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={() => (scale.value = withSpring(0.93, { damping: 15 }))}
                onPressOut={() => (scale.value = withSpring(1, { damping: 12 }))}
                activeOpacity={1}
            >
                <Text style={[
                    styles.filterPillText,
                    active && { color: color ?? '#8b5cf6', fontWeight: '700' },
                ]}>
                    {label}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
type Filter = 'all' | 'pending' | 'done';
const FILTER_LABELS: Record<Filter, string> = { all: 'Todos', pending: 'Pendentes', done: 'Concluídos' };

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

    // ── Paralaxe ──────────────────────────────────────────────────────────────
    const {
        scrollHandler,
        titleStyle,
        subtitleStyle,
        collapsedTitleStyle,
        headerContainerStyle,
        headerBgStyle,
    } = useParallaxScroll();

    // ── Transição de filtro ───────────────────────────────────────────────────
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

    const setFilterAnimated = (f: Filter) => {
        filterTransition(() => setFilter(f));
    };

    const setCatAnimated = (c: Category | 'all') => {
        filterTransition(() => setCatFilter(c));
    };

    const filtered = EXERCISES.filter(ex => {
        const catMatch    = catFilter === 'all' || ex.category === catFilter;
        const statusMatch = filter === 'all' ? true : filter === 'done' ? completed.has(ex.id) : !completed.has(ex.id);
        return catMatch && statusMatch;
    });

    const visibleCats = CATEGORY_META.filter(cat => filtered.some(ex => ex.category === cat.id));

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

            {/* ── Header paralaxe ── */}
            <Animated.View style={[styles.headerContainer, headerContainerStyle]}>
                <Animated.View style={[styles.headerBg, headerBgStyle]} />

                <Animated.View style={[styles.headerExpanded, titleStyle]}>
                    <View>
                        <Text style={styles.headerTitle}>Exercícios</Text>
                        <Animated.Text style={[styles.headerSub, subtitleStyle]}>
                            Pratique · {EXERCISES.length} desafios · {CATEGORY_META.length} categorias
                        </Animated.Text>
                    </View>
                    <View style={styles.headerXp}>
                        <Zap size={12} color="#8b5cf6" strokeWidth={2} />
                        <Text style={styles.headerXpText}>{totalXp} XP</Text>
                    </View>
                </Animated.View>

                <Animated.View style={[styles.headerCollapsed, collapsedTitleStyle]}>
                    <Text style={styles.headerCollapsedText}>Exercícios</Text>
                    <View style={styles.headerXpSmall}>
                        <Zap size={10} color="#8b5cf6" strokeWidth={2} />
                        <Text style={styles.headerXpSmallText}>{totalXp} XP</Text>
                    </View>
                </Animated.View>
            </Animated.View>

            {/* ── Summary ── */}
            <SummaryBar completed={completed.size} total={EXERCISES.length} xp={totalXp} />

            {/* ── Filtros de status (animados) ── */}
            <Animated.View entering={FadeInDown.delay(100).duration(320)} style={styles.filterRow}>
                {(['all', 'pending', 'done'] as Filter[]).map(f => (
                    <FilterPill
                        key={f}
                        label={FILTER_LABELS[f]}
                        active={filter === f}
                        onPress={() => setFilterAnimated(f)}
                    />
                ))}
            </Animated.View>

            {/* ── Filtros de categoria ── */}
            <Animated.ScrollView
                entering={FadeInDown.delay(140).duration(320)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.catRow}
            >
                <FilterPill
                    label="Todas"
                    active={catFilter === 'all'}
                    onPress={() => setCatAnimated('all')}
                />
                {CATEGORY_META.map(cat => (
                    <FilterPill
                        key={cat.id}
                        label={`${cat.emoji} ${cat.label}`}
                        active={catFilter === cat.id}
                        color={cat.color}
                        onPress={() => setCatAnimated(catFilter === cat.id ? 'all' : cat.id)}
                    />
                ))}
            </Animated.ScrollView>

            {/* ── Lista com transição de filtro ── */}
            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                <Animated.View style={listStyle}>
                    {visibleCats.map((cat, gi) => {
                        const catExercises   = filtered.filter(ex => ex.category === cat.id);
                        const completedInCat = catExercises.filter(ex => completed.has(ex.id)).length;

                        return (
                            <View key={cat.id} style={styles.group}>
                                <CategoryHeader
                                    catId={cat.id}
                                    completedInCat={completedInCat}
                                    total={catExercises.length}
                                    delay={gi * 40}
                                />
                                {catExercises.map((ex, i) => (
                                    <ExerciseCard
                                        key={ex.id}
                                        exercise={ex}
                                        completed={completed.has(ex.id)}
                                        delay={gi * 40 + i * 30}
                                        onPress={() => { setSelected(ex); setShowModal(true); }}
                                    />
                                ))}
                            </View>
                        );
                    })}

                    {filtered.length === 0 && (
                        <Animated.View entering={FadeInDown.duration(300)} style={styles.empty}>
                            <BookOpen size={32} color="#2a2040" strokeWidth={1.5} style={{ marginBottom: 12 }} />
                            <Text style={styles.emptyText}>Nenhum exercício nessa seleção.</Text>
                        </Animated.View>
                    )}
                </Animated.View>

                <View style={{ height: 40 }} />
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:       { flex: 1, backgroundColor: '#0d0d10' },

    headerContainer:    { overflow: 'hidden', justifyContent: 'center', paddingHorizontal: 20 },
    headerBg:           { ...StyleSheet.absoluteFillObject, backgroundColor: '#0d0d10' },
    headerExpanded:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'absolute', left: 20, right: 20, bottom: 10 },
    headerCollapsed:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'absolute', left: 20, right: 20, bottom: 14 },
    headerCollapsedText:{ color: '#fff', fontSize: 17, fontWeight: '800' },
    headerXpSmall:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#8b5cf618', borderWidth: 1, borderColor: '#8b5cf635', borderRadius: 16, paddingHorizontal: 8, paddingVertical: 4 },
    headerXpSmallText:  { color: '#8b5cf6', fontSize: 11, fontWeight: '700' },
    headerTitle:     { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    headerSub:       { color: '#6b6880', fontSize: 12, marginTop: 2 },
    headerXp:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#8b5cf618', borderWidth: 1, borderColor: '#8b5cf635', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    headerXpText:    { color: '#8b5cf6', fontSize: 12, fontWeight: '700' },

    filterRow:       { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 10 },
    catRow:          { paddingHorizontal: 16, gap: 6, paddingBottom: 12 },

    filterPill:      { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
    filterPillText:  { color: '#6b6880', fontSize: 12, fontWeight: '600', paddingHorizontal: 14, paddingVertical: 7 },

    scroll:          { paddingBottom: 20 },
    group:           { paddingHorizontal: 16, marginBottom: 8 },

    card:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16151d', borderRadius: 14, marginBottom: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#2a2040', paddingRight: 12 },
    cardDone:        { borderColor: '#10b98125', backgroundColor: '#0d1a16' },
    cardAccent:      { width: 3, alignSelf: 'stretch' },
    cardCheckWrap:   { padding: 12, width: 44, alignItems: 'center', justifyContent: 'center' },
    cardBody:        { flex: 1, paddingVertical: 12, paddingRight: 8, gap: 3 },
    cardTitle:       { color: '#fff', fontSize: 13, fontWeight: '700' },
    cardTitleDone:   { color: '#10b981', textDecorationLine: 'line-through', opacity: 0.8 },
    cardDesc:        { color: '#7a7590', fontSize: 12, lineHeight: 17 },
    cardFooter:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    diffChip:        { borderWidth: 1, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
    diffText:        { fontSize: 10, fontWeight: '700' },
    xpChip:          { flexDirection: 'row', alignItems: 'center', gap: 3 },
    xpText:          { color: '#f59e0b', fontSize: 10, fontWeight: '700' },

    empty:           { alignItems: 'center', paddingVertical: 60 },
    emptyText:       { color: '#44415a', fontSize: 14 },
});