import React, { useEffect, useState, useCallback } from 'react';
import {
    ScrollView,
    SafeAreaView,
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput,
    Pressable,
    Alert,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withTiming,
    withSequence,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage Keys ────────────────────────────────────────────────────────────
const STREAK_KEY = 'DEVTRACK_STREAK';
const LEARNINGS_KEY = 'DEVTRACK_LEARNINGS';
const STATS_KEY = 'DEVTRACK_STATS';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StreakData {
    count: number;
    lastDate: string | null;
}

interface Learning {
    id: string;
    text: string;
    date: string;
}

interface Stats {
    totalHours: number;
    skills: number;
    learnings: number;
}

// ─── Streak Logic ─────────────────────────────────────────────────────────────
async function getStreak(): Promise<StreakData> {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    return raw ? JSON.parse(raw) : { count: 0, lastDate: null };
}

async function checkAndUpdateStreak(): Promise<StreakData> {
    const today = new Date().toDateString();
    const streak = await getStreak();

    if (streak.lastDate === today) {
        return streak;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const newCount =
        streak.lastDate === yesterdayStr ? streak.count + 1 : 1;

    const updated: StreakData = { count: newCount, lastDate: today };
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(updated));
    return updated;
}

// ─── Streak Section ───────────────────────────────────────────────────────────
function StreakSection({ streak }: { streak: number }) {
    const pulse = useSharedValue(1);
    const scale = useSharedValue(1);
    const glow = useSharedValue(0);

    useEffect(() => {
        pulse.value = withRepeat(withTiming(1.06, { duration: 1800 }), -1, true);
        glow.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
    }));

    const pressStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: interpolate(glow.value, [0, 1], [0.3, 0.7], Extrapolation.CLAMP),
    }));

    const streakLabel =
        streak === 0
            ? 'Comece hoje!'
            : streak === 1
                ? 'Primeiro dia 🌱'
                : streak < 7
                    ? 'Tá pegando ritmo 🔥'
                    : streak < 30
                        ? 'Você está imparável! 🚀'
                        : 'Lendário! 🏆';

    return (
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Sequência</Text>
            <Pressable
                onPressIn={() => (scale.value = withSpring(0.97))}
                onPressOut={() => (scale.value = withSpring(1))}
            >
                <Animated.View style={[styles.streakCard, pressStyle]}>
                    {/* Glow background */}
                    <Animated.View style={[styles.streakGlow, glowStyle]} />

                    <Animated.View style={[styles.streakCircle, pulseStyle]}>
                        <Text style={styles.streakNumber}>{streak}</Text>
                        <Text style={styles.streakDaysLabel}>dias</Text>
                    </Animated.View>

                    <View style={styles.streakInfo}>
                        <Text style={styles.streakMainText}>{streakLabel}</Text>
                        <Text style={styles.streakSubText}>
                            {streak === 0
                                ? 'Registre um aprendizado hoje para começar sua sequência.'
                                : 'Continue estudando hoje para manter sua streak ativa.'}
                        </Text>

                        <View style={styles.streakDots}>
                            {[...Array(7)].map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.streakDot,
                                        i < Math.min(streak, 7) && styles.streakDotActive,
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                </Animated.View>
            </Pressable>
        </Animated.View>
    );
}

// ─── Stats Section ────────────────────────────────────────────────────────────
function StatsSection({ stats }: { stats: Stats }) {
    const items = [
        { value: `${stats.totalHours}h`, label: 'Tempo total', icon: '⏱️' },
        { value: `${stats.skills}`, label: 'Skills', icon: '🧠' },
        { value: `${stats.learnings}`, label: 'Registros', icon: '📝' },
    ];

    return (
        <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Métricas</Text>
            <View style={styles.statsRow}>
                {items.map((item, i) => (
                    <Animated.View
                        key={i}
                        entering={FadeInDown.delay(150 + i * 80).duration(500)}
                        style={styles.statCard}
                    >
                        <Text style={styles.statIcon}>{item.icon}</Text>
                        <Text style={styles.statValue}>{item.value}</Text>
                        <Text style={styles.statLabel}>{item.label}</Text>
                    </Animated.View>
                ))}
            </View>
        </Animated.View>
    );
}

// ─── Learning Section ─────────────────────────────────────────────────────────
function LearningSection({
    learnings,
    onAdd,
}: {
    learnings: Learning[];
    onAdd: (text: string) => void;
}) {
    const [modalVisible, setModalVisible] = useState(false);
    const [text, setText] = useState('');

    const handleSubmit = () => {
        if (!text.trim()) return;
        onAdd(text.trim());
        setText('');
        setModalVisible(false);
    };

    return (
        <Animated.View entering={FadeInDown.delay(200).duration(600).springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Brain Storms</Text>

            {learnings.slice(0, 3).map((item, i) => (
                <Animated.View
                    key={item.id}
                    entering={FadeInDown.delay(250 + i * 60).duration(400)}
                    style={styles.learningCard}
                >
                    <View style={styles.learningDot} />
                    <Text style={styles.learningText}>{item.text}</Text>
                </Animated.View>
            ))}

            {learnings.length === 0 && (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>Nenhum registro ainda. Que tal começar agora?</Text>
                </View>
            )}

            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.addButtonText}>+ Registrar aprendizado</Text>
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                    <Pressable style={styles.modalCard} onPress={() => {}}>
                        <Text style={styles.modalTitle}>Novo aprendizado</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="O que você aprendeu hoje?"
                            placeholderTextColor="#555"
                            value={text}
                            onChangeText={setText}
                            multiline
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancel}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalConfirm} onPress={handleSubmit}>
                                <Text style={styles.modalConfirmText}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </Animated.View>
    );
}

// ─── AI Suggestion Section ────────────────────────────────────────────────────
function AISuggestions({ streak, learnings }: { streak: number; learnings: Learning[] }) {
    const getSuggestion = () => {
        if (streak === 0) return 'Que tal registrar seu primeiro aprendizado hoje e começar sua jornada?';
        if (streak < 3) return `${streak} dias de streak! Defina uma meta para a semana e mantenha o ritmo.`;
        if (learnings.length > 0) {
            const last = learnings[0].text;
            return `Você estudou sobre "${last.slice(0, 40)}...". Que tal aprofundar esse tema hoje?`;
        }
        return `Você está em uma sequência de ${streak} dias! Continue assim e revise seus últimos aprendizados.`;
    };

    return (
        <Animated.View entering={FadeInDown.delay(300).duration(600).springify()} style={styles.section}>
            <Text style={styles.sectionTitle}>🤖 Sugestão da IA</Text>
            <View style={styles.aiCard}>
                <View style={styles.aiHeader}>
                    <View style={styles.aiBadge}>
                        <Text style={styles.aiText}>AI</Text>
                    </View>
                    <Text style={styles.aiLabel}>DevTrack Assistant</Text>
                </View>
                <Text style={styles.aiSuggestion}>{getSuggestion()}</Text>
            </View>
        </Animated.View>
    );
}

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
    const [streak, setStreak] = useState(0);
    const [learnings, setLearnings] = useState<Learning[]>([]);
    const [stats, setStats] = useState<Stats>({ totalHours: 0, skills: 0, learnings: 0 });

    const loadData = useCallback(async () => {
        const [streakData, learnRaw, statsRaw] = await Promise.all([
            checkAndUpdateStreak(),
            AsyncStorage.getItem(LEARNINGS_KEY),
            AsyncStorage.getItem(STATS_KEY),
        ]);

        setStreak(streakData.count);

        const learningsList: Learning[] = learnRaw ? JSON.parse(learnRaw) : [];
        setLearnings(learningsList);

        const savedStats: Stats = statsRaw
            ? JSON.parse(statsRaw)
            : { totalHours: 0, skills: 0, learnings: learningsList.length };

        setStats({ ...savedStats, learnings: learningsList.length });
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAddLearning = async (text: string) => {
        const newItem: Learning = {
            id: Date.now().toString(),
            text,
            date: new Date().toISOString(),
        };

        const updated = [newItem, ...learnings];
        setLearnings(updated);
        await AsyncStorage.setItem(LEARNINGS_KEY, JSON.stringify(updated));

        const newStats = { ...stats, learnings: updated.length };
        setStats(newStats);
        await AsyncStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    };

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
                <Text style={styles.headerGreeting}>Olá, Dev 👋</Text>
                <Text style={styles.headerDate}>
                    {new Date().toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                    })}
                </Text>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <StreakSection streak={streak} />
                <StatsSection stats={stats} />
                <LearningSection learnings={learnings} onAdd={handleAddLearning} />
                <AISuggestions streak={streak} learnings={learnings} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d10',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    headerGreeting: {
        color: '#ffffff',
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    headerDate: {
        color: '#6b6880',
        fontSize: 13,
        marginTop: 2,
        textTransform: 'capitalize',
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        paddingTop: 8,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 12,
        letterSpacing: -0.3,
    },

    // Streak
    streakCard: {
        backgroundColor: '#16151d',
        borderRadius: 22,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2a2040',
        overflow: 'hidden',
    },
    streakGlow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#8b5cf622',
        top: -20,
        left: -20,
    },
    streakCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#8b5cf6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 18,
        shadowColor: '#8b5cf6',
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    streakNumber: {
        fontSize: 30,
        fontWeight: '900',
        color: '#fff',
        lineHeight: 34,
    },
    streakDaysLabel: {
        fontSize: 11,
        color: '#fff',
        opacity: 0.85,
        fontWeight: '600',
    },
    streakInfo: {
        flex: 1,
    },
    streakMainText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    streakSubText: {
        color: '#7a7590',
        fontSize: 12,
        lineHeight: 17,
        marginBottom: 10,
    },
    streakDots: {
        flexDirection: 'row',
        gap: 5,
    },
    streakDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2a2040',
    },
    streakDotActive: {
        backgroundColor: '#8b5cf6',
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#16151d',
        borderRadius: 18,
        paddingVertical: 18,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#2a2040',
        alignItems: 'flex-start',
    },
    statIcon: {
        fontSize: 18,
        marginBottom: 8,
    },
    statValue: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    statLabel: {
        color: '#6b6880',
        fontSize: 11,
        marginTop: 3,
        fontWeight: '500',
    },

    // Learnings
    learningCard: {
        flexDirection: 'row',
        backgroundColor: '#16151d',
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#2a2040',
    },
    learningDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#8b5cf6',
        marginTop: 6,
        marginRight: 10,
    },
    learningText: {
        color: '#d4d0e8',
        flex: 1,
        lineHeight: 20,
        fontSize: 14,
    },
    emptyCard: {
        backgroundColor: '#16151d',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#2a2040',
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyText: {
        color: '#6b6880',
        fontSize: 13,
        textAlign: 'center',
    },
    addButton: {
        backgroundColor: '#8b5cf6',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        marginTop: 4,
        shadowColor: '#8b5cf6',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 4,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(8,7,14,0.85)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: '#16151d',
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        padding: 24,
        borderWidth: 1,
        borderColor: '#2a2040',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    modalInput: {
        backgroundColor: '#0d0d10',
        borderRadius: 14,
        padding: 16,
        color: '#fff',
        fontSize: 15,
        minHeight: 100,
        borderWidth: 1,
        borderColor: '#2a2040',
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    modalCancel: {
        flex: 1,
        backgroundColor: '#2a2040',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#7a7590',
        fontWeight: '600',
    },
    modalConfirm: {
        flex: 1,
        backgroundColor: '#8b5cf6',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
    },
    modalConfirmText: {
        color: '#fff',
        fontWeight: '700',
    },

    // AI
    aiCard: {
        backgroundColor: '#16151d',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: '#2a2040',
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    aiBadge: {
        backgroundColor: '#a855f7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 8,
    },
    aiText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 11,
    },
    aiLabel: {
        color: '#7a7590',
        fontSize: 13,
    },
    aiSuggestion: {
        color: '#d4d0e8',
        lineHeight: 22,
        fontSize: 14,
    },
});