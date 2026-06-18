// src/screens/ExercisesScreen.tsx
// Trilha de exercícios estilo Duolingo — paradas por área de estudo + quiz de vidas
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Modal, Pressable, Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeIn, FadeInDown, FadeInUp,
    useSharedValue, useAnimatedStyle,
    withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useLives } from '../context/LivesContext';
import LivesBar from '../components/common/LivesBar';
import NoLivesModal from '../components/common/NoLivesModal';
import { EXERCISES, type Exercise } from '../data/exercises';
import { getTrailForArea, type TrailStop } from '../data/trail';
import type { StudyArea } from '../services/ai.service';

const { width: SW } = Dimensions.get('window');
const STORAGE_KEY_PREFIX = 'DEVTRACK_TRAIL_';
const XP_KEY_PREFIX = 'DEVTRACK_XP_';

// ─── Pulsating stop indicator ─────────────────────────────────────────────────
function PulseRing({ color }: { color: string }) {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.8);
    useEffect(() => {
        scale.value = withRepeat(withSequence(withTiming(1.3, { duration: 900 }), withTiming(1, { duration: 900 })), -1, true);
        opacity.value = withRepeat(withSequence(withTiming(0.2, { duration: 900 }), withTiming(0.7, { duration: 900 })), -1, true);
    }, []);
    const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
    return <Animated.View style={[styles.pulseRing, { borderColor: color }, style]} />;
}

// ─── Trail stop node ───────────────────────────────────────────────────────────
type StopStatus = 'completed' | 'active' | 'locked';

function TrailNode({ stop, status, onPress, isLeft }: {
    stop: TrailStop; status: StopStatus; onPress: () => void; isLeft: boolean;
}) {
    const scale = useSharedValue(1);
    const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <View style={[styles.nodeRow, isLeft ? styles.nodeLeft : styles.nodeRight]}>
            <Pressable
                onPressIn={() => (scale.value = withTiming(0.94, { duration: 80 }))}
                onPressOut={() => (scale.value = withTiming(1, { duration: 120 }))}
                onPress={onPress}
                disabled={status === 'locked'}
            >
                <Animated.View style={pressStyle}>
                    {status === 'active' && <PulseRing color={stop.color} />}

                    <View style={[
                        styles.node,
                        status === 'completed' && { backgroundColor: stop.color, borderColor: stop.color },
                        status === 'active'    && { backgroundColor: stop.color + '22', borderColor: stop.color, borderWidth: 3 },
                        status === 'locked'    && { backgroundColor: '#1a1826', borderColor: '#2a2040' },
                    ]}>
                        <Text style={[styles.nodeIcon, status === 'locked' && { opacity: 0.3 }]}>
                            {status === 'locked' ? '🔒' : status === 'completed' ? '✓' : stop.icon}
                        </Text>
                    </View>

                    {/* Label abaixo */}
                    <View style={styles.nodeLabel}>
                        <Text style={[styles.nodeName, status === 'locked' && { color: '#2a2040' }]} numberOfLines={1}>
                            {stop.title}
                        </Text>
                        <Text style={[styles.nodeSub, status === 'locked' && { color: '#1a1826' }]} numberOfLines={1}>
                            {status === 'completed' ? `✓ ${stop.xpReward} XP` : stop.subtitle}
                        </Text>
                    </View>
                </Animated.View>
            </Pressable>
        </View>
    );
}

// ─── Quiz Modal ────────────────────────────────────────────────────────────────
function QuizModal({ exercise, visible, onClose, onCorrect, onWrong }: {
    exercise: Exercise | null;
    visible: boolean;
    onClose: () => void;
    onCorrect: (xp: number) => void;
    onWrong: () => void;
}) {
    const { lives, maxLives } = useLives();
    const [selected, setSelected] = useState<number | null>(null);
    const [answered, setAnswered] = useState(false);
    const shakeX = useSharedValue(0);
    const heartShake = useSharedValue(0);
    const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
    const heartShakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: heartShake.value }] }));

    useEffect(() => { if (visible) { setSelected(null); setAnswered(false); } }, [visible]);

    if (!exercise) return null;

    const handleAnswer = (idx: number) => {
        if (answered) return;
        setSelected(idx);
        setAnswered(true);

        if (idx === exercise.quiz.correctIndex) {
            onCorrect(exercise.xp);
        } else {
            shakeX.value = withSequence(
                withTiming(-8, { duration: 60 }), withTiming(8, { duration: 60 }),
                withTiming(-6, { duration: 60 }), withTiming(6, { duration: 60 }),
                withTiming(0, { duration: 60 }),
            );
            heartShake.value = withSequence(
                withTiming(-6, { duration: 80 }), withTiming(6, { duration: 80 }),
                withTiming(0, { duration: 80 }),
            );
            onWrong();
        }
    };

    const isCorrect = selected === exercise.quiz.correctIndex;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={qStyles.overlay}>
                <Animated.View entering={FadeInUp.duration(280)} style={qStyles.card}>

                    <View style={qStyles.header}>
                        <Text style={qStyles.category}>{exercise.category.toUpperCase()}</Text>
                        <Animated.View style={[{ flexDirection: 'row', gap: 4, alignItems: 'center' }, heartShakeStyle]}>
                            {Array.from({ length: maxLives }, (_, i) => (
                                <Text key={i} style={{ fontSize: 15, lineHeight: 20 }}>
                                    {i < lives ? '❤️' : '🖤'}
                                </Text>
                            ))}
                        </Animated.View>
                        <Text style={qStyles.xp}>+{exercise.xp} XP</Text>
                    </View>

                    <Text style={qStyles.detail} numberOfLines={4}>{exercise.detail}</Text>

                    <View style={qStyles.divider} />

                    <Text style={qStyles.question}>{exercise.quiz.question}</Text>

                    <Animated.View style={shakeStyle}>
                        {exercise.quiz.options.map((opt, i) => {
                            let optStyle = {};
                            if (answered) {
                                if (i === exercise.quiz.correctIndex) optStyle = qStyles.optCorrect;
                                else if (i === selected) optStyle = qStyles.optWrong;
                                else optStyle = qStyles.optDim;
                            }
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[qStyles.option, optStyle]}
                                    onPress={() => handleAnswer(i)}
                                    disabled={answered}
                                    activeOpacity={0.8}
                                >
                                    <Text style={qStyles.optLetter}>{String.fromCharCode(65 + i)}</Text>
                                    <Text style={qStyles.optText}>{opt}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </Animated.View>

                    {answered && (
                        <Animated.View
                            entering={FadeInDown.duration(300)}
                            style={[qStyles.explanation, isCorrect ? qStyles.expCorrect : qStyles.expWrong]}
                        >
                            <Text style={[qStyles.expIcon]}>{isCorrect ? '✅' : '❌'}</Text>
                            <Text style={[qStyles.expText, { color: isCorrect ? '#10b981' : '#ef4444' }]}>
                                {exercise.quiz.explanation}
                            </Text>
                        </Animated.View>
                    )}

                    <TouchableOpacity style={qStyles.closeBtn} onPress={onClose}>
                        <Text style={qStyles.closeBtnText}>{answered ? 'Continuar' : 'Cancelar'}</Text>
                    </TouchableOpacity>

                </Animated.View>
            </View>
        </Modal>
    );
}

// ─── Stop Modal (lista dos 3 exercícios) ──────────────────────────────────────
function StopModal({ stop, visible, onClose, completedIds, onSelectExercise }: {
    stop: TrailStop | null; visible: boolean; onClose: () => void;
    completedIds: Set<string>; onSelectExercise: (ex: Exercise) => void;
}) {
    if (!stop) return null;
    const exercises = stop.exerciseIds.map(id => EXERCISES.find(e => e.id === id)).filter(Boolean) as Exercise[];

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={sStyles.overlay}>
                <Animated.View entering={FadeInDown.duration(260)} style={sStyles.card}>
                    <View style={[sStyles.header, { borderBottomColor: stop.color + '30' }]}>
                        <Text style={sStyles.icon}>{stop.icon}</Text>
                        <View>
                            <Text style={sStyles.title}>{stop.title}</Text>
                            <Text style={sStyles.sub}>{stop.subtitle}</Text>
                        </View>
                        <View style={[sStyles.xpBadge, { backgroundColor: stop.color + '20', borderColor: stop.color + '50' }]}>
                            <Text style={[sStyles.xpText, { color: stop.color }]}>+{stop.xpReward} XP</Text>
                        </View>
                    </View>

                    {exercises.map((ex, i) => {
                        const done = completedIds.has(ex.id);
                        return (
                            <TouchableOpacity
                                key={ex.id}
                                style={[sStyles.exerciseRow, done && sStyles.exerciseRowDone]}
                                onPress={() => onSelectExercise(ex)}
                                activeOpacity={0.8}
                            >
                                <View style={[sStyles.exNum, done && { backgroundColor: stop.color }]}>
                                    <Text style={sStyles.exNumText}>{done ? '✓' : i + 1}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[sStyles.exTitle, done && { color: '#6b6880' }]}>{ex.title}</Text>
                                    <Text style={sStyles.exDesc} numberOfLines={1}>{ex.description}</Text>
                                </View>
                                <Text style={[sStyles.exXp, { color: stop.color }]}>+{ex.xp} XP</Text>
                            </TouchableOpacity>
                        );
                    })}

                    <TouchableOpacity style={sStyles.closeBtn} onPress={onClose}>
                        <Text style={sStyles.closeBtnText}>Fechar</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ExercisesScreen() {
    const { user } = useAuth();
    const { lives, loseLife } = useLives();
    const email = user?.email ?? 'guest';
    const area = ((user?.studyArea as StudyArea) ?? 'fullstack');
    const trail = getTrailForArea(area);

    const storageKey = STORAGE_KEY_PREFIX + email;
    const xpKey = XP_KEY_PREFIX + email;

    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
    const [xp, setXp] = useState(0);
    const [selectedStop, setSelectedStop] = useState<TrailStop | null>(null);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [showNoLives, setShowNoLives] = useState(false);
    const [stopModalVisible, setStopModalVisible] = useState(false);
    const [quizModalVisible, setQuizModalVisible] = useState(false);
    const pendingExerciseRef = useRef<Exercise | null>(null);

    // Carrega progresso salvo sempre que a tela ganha foco
    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                const [compRaw, xpRaw] = await Promise.all([
                    AsyncStorage.getItem(storageKey),
                    AsyncStorage.getItem(xpKey),
                ]);
                if (compRaw) setCompletedIds(new Set(JSON.parse(compRaw)));
                if (xpRaw) setXp(parseInt(xpRaw, 10) || 0);
            };
            load();
        }, [storageKey, xpKey])
    );

    const getStopStatus = (stop: TrailStop, idx: number): StopStatus => {
        const allDone = stop.exerciseIds.every(id => completedIds.has(id));
        if (allDone) return 'completed';
        if (idx === 0) return 'active';
        // Desbloqueada se a parada anterior está concluída
        const prevStop = trail.stops[idx - 1];
        const prevDone = prevStop.exerciseIds.every(id => completedIds.has(id));
        if (prevDone) return 'active';
        return 'locked';
    };

    const handleStopPress = (stop: TrailStop) => {
        setSelectedStop(stop);
        setStopModalVisible(true);
    };

    const handleExerciseSelect = (ex: Exercise) => {
        if (lives <= 0) {
            pendingExerciseRef.current = ex;
            setStopModalVisible(false);
            setShowNoLives(true);
            return;
        }
        setSelectedExercise(ex);
        setQuizModalVisible(true);
    };

    const handleCorrect = useCallback(async (earnedXp: number) => {
        if (!selectedExercise) return;
        const newCompleted = new Set([...completedIds, selectedExercise.id]);
        const newXp = xp + earnedXp;
        setCompletedIds(newCompleted);
        setXp(newXp);
        await Promise.all([
            AsyncStorage.setItem(storageKey, JSON.stringify([...newCompleted])),
            AsyncStorage.setItem(xpKey, String(newXp)),
        ]);
    }, [selectedExercise, completedIds, xp, storageKey, xpKey]);

    const handleWrong = useCallback(() => {
        // loseLife() lê o valor fresco via ref — retorna true se ainda tem vida, false se zerou
        const stillAlive = loseLife();
        if (!stillAlive) {
            // Pequeno delay para o usuário ver o coração ficando preto antes do modal aparecer
            setTimeout(() => {
                setQuizModalVisible(false);
                setStopModalVisible(false);
                setShowNoLives(true);
            }, 800);
        }
    }, [loseLife]);

    const handleLifeRestored = () => {
        if (pendingExerciseRef.current) {
            setSelectedExercise(pendingExerciseRef.current);
            setQuizModalVisible(true);
            pendingExerciseRef.current = null;
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

            {/* Header */}
            <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
                <View>
                    <Text style={styles.headerSub}>Sua trilha</Text>
                    <Text style={styles.headerTitle}>{trail.label}</Text>
                </View>
                <LivesBar />
            </Animated.View>

            <ScrollView contentContainerStyle={styles.trail} showsVerticalScrollIndicator={false}>

                {/* Fim da trilha */}
                <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.trailEnd}>
                    <Text style={styles.trailEndIcon}>🏆</Text>
                    <Text style={styles.trailEndText}>Fim da Trilha</Text>
                </Animated.View>

                {/* Paradas (invertidas — do topo = última, embaixo = primeira) */}
                {[...trail.stops].reverse().map((stop, i) => {
                    const originalIdx = trail.stops.length - 1 - i;
                    const status = getStopStatus(stop, originalIdx);
                    const isLeft = i % 2 === 0;

                    return (
                        <Animated.View key={stop.id} entering={FadeInDown.delay(120 + i * 80).duration(400)}>
                            <TrailNode
                                stop={stop}
                                status={status}
                                onPress={() => handleStopPress(stop)}
                                isLeft={isLeft}
                            />
                            {/* Linha conectora */}
                            {i < trail.stops.length - 1 && (
                                <View style={[styles.connector, isLeft ? styles.connectorLeft : styles.connectorRight]}>
                                    {[...Array(4)].map((_, d) => (
                                        <View key={d} style={[styles.connectorDot, { backgroundColor: status === 'completed' ? trail.color : '#2a2040' }]} />
                                    ))}
                                </View>
                            )}
                        </Animated.View>
                    );
                })}

                {/* Início */}
                <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.trailStart}>
                    <Text style={styles.trailStartIcon}>🚀</Text>
                    <Text style={styles.trailStartText}>Início</Text>
                </Animated.View>

                <View style={{ height: 80 }} />
            </ScrollView>

            {/* Modais */}
            <StopModal
                stop={selectedStop}
                visible={stopModalVisible}
                onClose={() => setStopModalVisible(false)}
                completedIds={completedIds}
                onSelectExercise={(ex) => {
                    setStopModalVisible(false);
                    setTimeout(() => handleExerciseSelect(ex), 300);
                }}
            />

            <QuizModal
                exercise={selectedExercise}
                visible={quizModalVisible}
                onClose={() => { 
                    setQuizModalVisible(false); 
                    if (selectedStop) {
                        // Verifica se após fechar, todos os exercícios dessa parada já foram concluídos
                        const allDone = selectedStop.exerciseIds.every(id => completedIds.has(id));
                        if (!allDone) {
                            setTimeout(() => setStopModalVisible(true), 350);
                        } else {
                            setSelectedStop(null); // Passou de fase!
                        }
                    }
                }}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
            />

            <NoLivesModal
                visible={showNoLives}
                onClose={() => setShowNoLives(false)}
                onLifeRestored={handleLifeRestored}
            />

        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d0d10' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2040',
    },
    headerSub: { color: '#6b6880', fontSize: 12, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
    trail: { alignItems: 'center', paddingTop: 20 },
    trailEnd: { alignItems: 'center', marginBottom: 16 },
    trailEndIcon: { fontSize: 36 },
    trailEndText: { color: '#8b5cf6', fontSize: 14, fontWeight: '800', marginTop: 4 },
    trailStart: { alignItems: 'center', marginTop: 8 },
    trailStartIcon: { fontSize: 32 },
    trailStartText: { color: '#6b6880', fontSize: 13, fontWeight: '700', marginTop: 4 },

    nodeRow: { width: SW, alignItems: 'center', marginVertical: 4 },
    nodeLeft: { alignItems: 'flex-start', paddingLeft: SW * 0.18 },
    nodeRight: { alignItems: 'flex-end', paddingRight: SW * 0.18 },

    node: {
        width: 72, height: 72, borderRadius: 36,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#2a2040',
        backgroundColor: '#16151d',
    },
    nodeIcon: { fontSize: 26 },
    nodeLabel: { alignItems: 'center', marginTop: 6 },
    nodeName: { color: '#d4d0e8', fontSize: 13, fontWeight: '700' },
    nodeSub: { color: '#6b6880', fontSize: 11, marginTop: 2 },
    pulseRing: {
        position: 'absolute', width: 88, height: 88,
        borderRadius: 44, borderWidth: 3,
        top: -8, left: -8,
    },

    connector: { height: 36, justifyContent: 'space-around', alignItems: 'center' },
    connectorLeft: { alignSelf: 'flex-start', marginLeft: SW * 0.18 + 32 },
    connectorRight: { alignSelf: 'flex-end', marginRight: SW * 0.18 + 32 },
    connectorDot: { width: 5, height: 5, borderRadius: 2.5 },
});

// ─── Quiz styles ──────────────────────────────────────────────────────────────
const qStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'flex-end' },
    card: {
        backgroundColor: '#16151d', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, gap: 14, borderWidth: 1, borderColor: '#2a2040',
        maxHeight: '90%',
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    category: { color: '#6b6880', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    xp: { color: '#8b5cf6', fontSize: 14, fontWeight: '800' },
    detail: { color: '#9aa0aa', fontSize: 13, lineHeight: 19 },
    divider: { height: 1, backgroundColor: '#2a2040' },
    question: { color: '#fff', fontSize: 16, fontWeight: '700', lineHeight: 22 },
    option: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#0d0d10', borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: '#2a2040',
    },
    optCorrect: { backgroundColor: '#10b98120', borderColor: '#10b981' },
    optWrong: { backgroundColor: '#ef444420', borderColor: '#ef4444' },
    optDim: { opacity: 0.4 },
    optLetter: {
        color: '#8b5cf6', fontSize: 13, fontWeight: '900',
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: '#8b5cf620', textAlign: 'center', lineHeight: 22,
    },
    optText: { color: '#d4d0e8', fontSize: 14, flex: 1 },
    explanation: {
        flexDirection: 'row', gap: 10, padding: 14,
        borderRadius: 14, alignItems: 'flex-start',
    },
    expCorrect: { backgroundColor: '#10b98115', borderWidth: 1, borderColor: '#10b98130' },
    expWrong: { backgroundColor: '#ef444415', borderWidth: 1, borderColor: '#ef444430' },
    expIcon: { fontSize: 18 },
    expText: { fontSize: 13, lineHeight: 19, flex: 1 },
    closeBtn: {
        backgroundColor: '#8b5cf6', borderRadius: 16, padding: 16, alignItems: 'center',
        borderBottomWidth: 4, borderBottomColor: '#6d28d9',
    },
    closeBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

// ─── Stop modal styles ────────────────────────────────────────────────────────
const sStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    card: {
        backgroundColor: '#16151d', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, gap: 16, borderWidth: 1, borderColor: '#2a2040',
    },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingBottom: 16, borderBottomWidth: 1,
    },
    icon: { fontSize: 28 },
    title: { color: '#fff', fontSize: 17, fontWeight: '800' },
    sub: { color: '#6b6880', fontSize: 13 },
    xpBadge: { marginLeft: 'auto', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
    xpText: { fontSize: 13, fontWeight: '800' },
    exerciseRow: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        padding: 14, borderRadius: 16,
        backgroundColor: '#0d0d10', borderWidth: 1, borderColor: '#2a2040',
    },
    exerciseRowDone: { opacity: 0.6 },
    exNum: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#2a2040', alignItems: 'center', justifyContent: 'center',
    },
    exNumText: { color: '#fff', fontSize: 13, fontWeight: '800' },
    exTitle: { color: '#d4d0e8', fontSize: 14, fontWeight: '700' },
    exDesc: { color: '#6b6880', fontSize: 12, marginTop: 2 },
    exXp: { fontSize: 13, fontWeight: '700' },
    closeBtn: {
        backgroundColor: '#16151d', borderRadius: 16, padding: 14, alignItems: 'center',
        borderWidth: 1, borderColor: '#2a2040',
    },
    closeBtnText: { color: '#6b6880', fontSize: 14, fontWeight: '600' },
});