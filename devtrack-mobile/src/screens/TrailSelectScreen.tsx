// src/screens/TrailSelectScreen.tsx
// Tela de seleção de área — cartões animados para cada trilha disponível
import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
    FadeIn, FadeInDown, FadeInLeft,
    useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useLives } from '../context/LivesContext';
import LivesBar from '../components/common/LivesBar';
import { TRAILS } from '../data/trail';
import type { StudyArea } from '../services/ai.service';

const { width: SW } = Dimensions.get('window');
const STORAGE_KEY_PREFIX = 'DEVTRACK_TRAIL_';

function AreaCard({ trail, progress, total, isUserArea, onPress, delay }: {
    trail: typeof TRAILS[0];
    progress: number;
    total: number;
    isUserArea: boolean;
    onPress: () => void;
    delay: number;
}) {
    const scale = useSharedValue(1);
    const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

    return (
        <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()} style={scaleStyle}>
            <TouchableOpacity
                activeOpacity={0.85}
                onPressIn={() => (scale.value = withSpring(0.96))}
                onPressOut={() => (scale.value = withSpring(1))}
                onPress={onPress}
                style={[styles.card, isUserArea && { borderColor: trail.color }]}
            >
                {/* Faixa de cor lateral */}
                <View style={[styles.cardAccent, { backgroundColor: trail.color }]} />

                <View style={styles.cardContent}>
                    {/* Header */}
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIconWrap, { backgroundColor: trail.color + '20' }]}>
                            <Text style={styles.cardIcon}>{trail.icon}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{trail.label}</Text>
                            <Text style={styles.cardSub}>{total} paradas · {total * 3} exercícios</Text>
                        </View>
                        {isUserArea && (
                            <View style={[styles.myAreaBadge, { backgroundColor: trail.color + '25', borderColor: trail.color + '50' }]}>
                                <Text style={[styles.myAreaText, { color: trail.color }]}>Sua área</Text>
                            </View>
                        )}
                    </View>

                    {/* Barra de progresso */}
                    <View style={styles.progressRow}>
                        <View style={styles.progressTrack}>
                            <Animated.View
                                style={[
                                    styles.progressBar,
                                    { width: `${pct}%` as any, backgroundColor: trail.color },
                                ]}
                            />
                        </View>
                        <Text style={[styles.progressText, { color: trail.color }]}>
                            {progress}/{total}
                        </Text>
                    </View>

                    {/* Nível atual / preview */}
                    <View style={styles.levelRow}>
                        {(['basic', 'intermediate', 'advanced'] as const).map((lvl, i) => {
                            const labels = { basic: 'Básico', intermediate: 'Intermediário', advanced: 'Avançado' };
                            const colors = { basic: '#10b981', intermediate: '#f59e0b', advanced: '#ef4444' };
                            const stopsInLevel = trail.stops.filter(s => s.level === lvl).length;
                            return (
                                <View key={lvl} style={[styles.levelChip, { backgroundColor: colors[lvl] + '20' }]}>
                                    <Text style={[styles.levelChipText, { color: colors[lvl] }]}>
                                        {labels[lvl]} · {stopsInLevel}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Seta */}
                <Text style={[styles.arrow, { color: trail.color }]}>›</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function TrailSelectScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { lives } = useLives();
    const email = user?.email ?? 'guest';
    const userArea = (user?.studyArea as StudyArea) ?? 'fullstack';

    const [progressMap, setProgressMap] = useState<Record<string, number>>({});

    useEffect(() => {
        const load = async () => {
            const map: Record<string, number> = {};
            for (const trail of TRAILS) {
                const raw = await AsyncStorage.getItem(STORAGE_KEY_PREFIX + email);
                const completed: string[] = raw ? JSON.parse(raw) : [];
                const done = trail.stops.filter(s =>
                    s.exerciseIds.every(id => completed.includes(id))
                ).length;
                map[trail.area] = done;
            }
            setProgressMap(map);
        };
        load();
    }, [email]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

            {/* Header */}
            <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
                <View>
                    <Text style={styles.headerSub}>Escolha sua trilha</Text>
                    <Text style={styles.headerTitle}>Trilhas de Estudo</Text>
                </View>
                <LivesBar />
            </Animated.View>

            {/* Subtítulo */}
            <Animated.View entering={FadeInLeft.delay(100).duration(400)} style={styles.subBox}>
                <Text style={styles.subText}>
                    Cada trilha vai do básico ao avançado. Você pode explorar qualquer área! 🚀
                </Text>
            </Animated.View>

            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                {TRAILS.map((trail, i) => (
                    <AreaCard
                        key={trail.area}
                        trail={trail}
                        progress={progressMap[trail.area] ?? 0}
                        total={trail.stops.length}
                        isUserArea={trail.area === userArea}
                        delay={80 + i * 70}
                        onPress={() => router.push(`/trail/${trail.area}` as any)}
                    />
                ))}
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#0d0d10' },
    header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e1c2e' },
    headerSub:   { color: '#6b6880', fontSize: 12, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
    subBox:      { paddingHorizontal: 20, paddingVertical: 12 },
    subText:     { color: '#7a7590', fontSize: 13, lineHeight: 19 },
    list:        { padding: 16, gap: 14 },

    card: {
        backgroundColor: '#16151d',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#2a2040',
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
    },
    cardAccent:  { width: 4, alignSelf: 'stretch' },
    cardContent: { flex: 1, padding: 16, gap: 12 },
    cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardIconWrap:{ width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    cardIcon:    { fontSize: 22 },
    cardTitle:   { color: '#fff', fontSize: 16, fontWeight: '800' },
    cardSub:     { color: '#6b6880', fontSize: 12, marginTop: 2 },
    myAreaBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
    myAreaText:  { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    progressTrack:{ flex: 1, height: 6, backgroundColor: '#1e1c2e', borderRadius: 3, overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: 3 },
    progressText: { fontSize: 11, fontWeight: '700', minWidth: 28, textAlign: 'right' },

    levelRow: { flexDirection: 'row', gap: 6 },
    levelChip: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
    levelChipText: { fontSize: 10, fontWeight: '700' },

    arrow: { fontSize: 28, paddingRight: 14, fontWeight: '300' },
});
