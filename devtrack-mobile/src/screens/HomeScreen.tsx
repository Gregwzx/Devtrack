// src/screens/HomeScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    ScrollView,
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withTiming,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Flame, BarChart2, Brain, Cpu, Plus, X, Check } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const STREAK_KEY = 'DEVTRACK_STREAK';
const LEARNINGS_KEY = 'DEVTRACK_LEARNINGS';
const STATS_KEY = 'DEVTRACK_STATS';

interface StreakData { count: number; lastDate: string | null; }
interface Learning { id: string; text: string; date: string; }
interface Stats { totalHours: number; skills: number; learnings: number; }

async function checkAndUpdateStreak(): Promise<StreakData> {
    const today = new Date().toDateString();
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    const streak: StreakData = raw ? JSON.parse(raw) : { count: 0, lastDate: null };

    if (streak.lastDate === today) return streak;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const newCount = streak.lastDate === yesterday.toDateString() ? streak.count + 1 : 1;
    const updated = { count: newCount, lastDate: today };
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(updated));
    return updated;
}

// ─── Streak ───────────────────────────────────────────────────────────────────
function StreakCard({ streak }: { streak: number }) {
    const pulse = useSharedValue(1);
    const scale = useSharedValue(1);

    useEffect(() => {
        pulse.value = withRepeat(withTiming(1.05, { duration: 1800 }), -1, true);
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
    const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const streakLabel =
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
            <Pressable
                onPressIn={() => (scale.value = withSpring(0.97))}
                onPressOut={() => (scale.value = withSpring(1))}
            >
                <Animated.View style={[styles.streakCard, pressStyle]}>
                    <Animated.View style={[styles.streakCircle, pulseStyle]}>
                        <Text style={styles.streakNumber}>{streak}</Text>
                        <Text style={styles.streakUnit}>dias</Text>
                    </Animated.View>
                    <View style={styles.streakInfo}>
                        <Text style={styles.streakLabel}>{streakLabel}</Text>
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

// ─── Stats ────────────────────────────────────────────────────────────────────
function StatsCard({ stats }: { stats: Stats }) {
    const items = [
        { value: `${stats.totalHours}h`, label: 'Tempo total', Icon: BarChart2 },
        { value: `${stats.skills}`,      label: 'Skills',      Icon: Cpu },
        { value: `${stats.learnings}`,   label: 'Registros',   Icon: Brain },
    ];

    return (
        <Animated.View entering={FadeInDown.delay(80).duration(500).springify()} style={styles.section}>
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

// ─── Learnings ────────────────────────────────────────────────────────────────
function LearningsCard({ learnings, onAdd }: { learnings: Learning[]; onAdd: (text: string) => void }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [text, setText] = useState('');

    const handleSubmit = () => {
        if (!text.trim()) return;
        onAdd(text.trim());
        setText('');
        setModalVisible(false);
    };

    return (
        <Animated.View entering={FadeInDown.delay(160).duration(500).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
                <Brain size={16} color="#8b5cf6" strokeWidth={2} />
                <Text style={styles.sectionTitle}>Registros</Text>
                <TouchableOpacity style={styles.addIconBtn} onPress={() => setModalVisible(true)}>
                    <Plus size={16} color="#8b5cf6" strokeWidth={2.5} />
                </TouchableOpacity>
            </View>

            {learnings.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>Nenhum registro ainda. Comece agora.</Text>
                </View>
            ) : (
                learnings.slice(0, 4).map((item, i) => (
                    <Animated.View
                        key={item.id}
                        entering={FadeInDown.delay(i * 50).duration(400)}
                        style={styles.learningRow}
                    >
                        <View style={styles.learningDot} />
                        <Text style={styles.learningText}>{item.text}</Text>
                    </Animated.View>
                ))
            )}

            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                <Plus size={16} color="#fff" strokeWidth={2.5} />
                <Text style={styles.addBtnText}>Novo registro</Text>
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
                    <Pressable style={styles.modal} onPress={() => {}}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Novo registro</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={20} color="#6b6880" strokeWidth={2} />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="O que você aprendeu hoje?"
                            placeholderTextColor="#555"
                            value={text}
                            onChangeText={setText}
                            multiline
                            autoFocus
                        />
                        <TouchableOpacity style={styles.modalBtn} onPress={handleSubmit}>
                            <Check size={18} color="#fff" strokeWidth={2.5} />
                            <Text style={styles.modalBtnText}>Salvar</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </Animated.View>
    );
}

// ─── AI ───────────────────────────────────────────────────────────────────────
function AICard({ streak, learnings }: { streak: number; learnings: Learning[] }) {
    const getSuggestion = () => {
        if (streak === 0) return 'Registre seu primeiro aprendizado hoje e inicie sua sequência de estudos.';
        if (learnings.length > 0) {
            const last = learnings[0].text;
            return `Você registrou: "${last.slice(0, 50)}${last.length > 50 ? '...' : ''}". Que tal aprofundar esse tema?`;
        }
        return `Você está em ${streak} dias de sequência. Continue assim e revise seus últimos registros.`;
    };

    return (
        <Animated.View entering={FadeInDown.delay(240).duration(500).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
                <Cpu size={16} color="#8b5cf6" strokeWidth={2} />
                <Text style={styles.sectionTitle}>Assistente</Text>
                <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>IA</Text></View>
            </View>
            <View style={styles.aiCard}>
                <Text style={styles.aiText}>{getSuggestion()}</Text>
            </View>
        </Animated.View>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
    const { user } = useAuth();
    const [streak, setStreak] = useState(0);
    const [learnings, setLearnings] = useState<Learning[]>([]);
    const [stats, setStats] = useState<Stats>({ totalHours: 0, skills: 0, learnings: 0 });

    const firstName = user?.displayName?.split(' ')[0] ?? 'Dev';

    const loadData = useCallback(async () => {
        const [streakData, learnRaw, statsRaw] = await Promise.all([
            checkAndUpdateStreak(),
            AsyncStorage.getItem(LEARNINGS_KEY),
            AsyncStorage.getItem(STATS_KEY),
        ]);
        setStreak(streakData.count);
        const list: Learning[] = learnRaw ? JSON.parse(learnRaw) : [];
        setLearnings(list);
        const s: Stats = statsRaw ? JSON.parse(statsRaw) : { totalHours: 0, skills: 0, learnings: list.length };
        setStats({ ...s, learnings: list.length });
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleAddLearning = async (text: string) => {
        const item: Learning = { id: Date.now().toString(), text, date: new Date().toISOString() };
        const updated = [item, ...learnings];
        setLearnings(updated);
        await AsyncStorage.setItem(LEARNINGS_KEY, JSON.stringify(updated));
        const newStats = { ...stats, learnings: updated.length };
        setStats(newStats);
        await AsyncStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Olá, {firstName}</Text>
                    <Text style={styles.date}>
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>
                </View>
            </Animated.View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <StreakCard streak={streak} />
                <StatsCard stats={stats} />
                <LearningsCard learnings={learnings} onAdd={handleAddLearning} />
                <AICard streak={streak} learnings={learnings} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d0d10' },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    greeting: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    date: { color: '#6b6880', fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
    content: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },

    section: { marginBottom: 24 },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
    },
    sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },

    // Streak
    streakCard: {
        backgroundColor: '#16151d', borderRadius: 20, padding: 20,
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: '#2a2040',
    },
    streakCircle: {
        width: 82, height: 82, borderRadius: 41,
        backgroundColor: '#8b5cf6',
        justifyContent: 'center', alignItems: 'center', marginRight: 18,
        shadowColor: '#8b5cf6', shadowOpacity: 0.45, shadowRadius: 12, elevation: 8,
    },
    streakNumber: { fontSize: 28, fontWeight: '900', color: '#fff', lineHeight: 30 },
    streakUnit: { fontSize: 11, color: '#fff', opacity: 0.85, fontWeight: '600' },
    streakInfo: { flex: 1 },
    streakLabel: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
    streakSub: { color: '#7a7590', fontSize: 12, lineHeight: 17, marginBottom: 10 },
    streakDots: { flexDirection: 'row', gap: 5 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2a2040' },
    dotActive: { backgroundColor: '#8b5cf6' },

    // Stats
    statsRow: { flexDirection: 'row', gap: 10 },
    statCard: {
        flex: 1, backgroundColor: '#16151d', borderRadius: 18,
        paddingVertical: 18, paddingHorizontal: 12,
        borderWidth: 1, borderColor: '#2a2040',
    },
    statValue: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    statLabel: { color: '#6b6880', fontSize: 11, marginTop: 3, fontWeight: '500' },

    // Learnings
    addIconBtn: { marginLeft: 'auto' },
    learningRow: {
        flexDirection: 'row', backgroundColor: '#16151d',
        borderRadius: 14, padding: 14, marginBottom: 8,
        alignItems: 'flex-start', borderWidth: 1, borderColor: '#2a2040',
    },
    learningDot: {
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: '#8b5cf6', marginTop: 6, marginRight: 10,
    },
    learningText: { color: '#d4d0e8', flex: 1, lineHeight: 20, fontSize: 14 },
    emptyCard: {
        backgroundColor: '#16151d', borderRadius: 14, padding: 20,
        borderWidth: 1, borderColor: '#2a2040', alignItems: 'center', marginBottom: 8,
    },
    emptyText: { color: '#6b6880', fontSize: 13 },
    addBtn: {
        backgroundColor: '#8b5cf6', borderRadius: 14, padding: 15,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: 4, shadowColor: '#8b5cf6', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
    },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    // Modal
    overlay: { flex: 1, backgroundColor: 'rgba(8,7,14,0.85)', justifyContent: 'flex-end' },
    modal: {
        backgroundColor: '#16151d', borderTopLeftRadius: 26, borderTopRightRadius: 26,
        padding: 24, borderWidth: 1, borderColor: '#2a2040',
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
    modalInput: {
        backgroundColor: '#0d0d10', borderRadius: 14, padding: 16,
        color: '#fff', fontSize: 15, minHeight: 100,
        borderWidth: 1, borderColor: '#2a2040', textAlignVertical: 'top', marginBottom: 16,
    },
    modalBtn: {
        backgroundColor: '#8b5cf6', borderRadius: 14, padding: 15,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    // AI
    aiBadge: {
        backgroundColor: '#2a2040', borderRadius: 6,
        paddingHorizontal: 7, paddingVertical: 3,
    },
    aiBadgeText: { color: '#8b5cf6', fontSize: 10, fontWeight: '800' },
    aiCard: {
        backgroundColor: '#16151d', borderRadius: 18, padding: 18,
        borderWidth: 1, borderColor: '#2a2040',
    },
    aiText: { color: '#d4d0e8', lineHeight: 22, fontSize: 14 },
});