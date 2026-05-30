// src/screens/TrailSelectScreen.tsx — Layout premium com header rico e cards melhorados
import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Dimensions, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
    FadeIn, FadeInDown, FadeInLeft, FadeInUp,
    useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useLives } from '../context/LivesContext';
import LivesBar from '../components/common/LivesBar';
import { TRAILS } from '../data/trail';
import type { StudyArea } from '../services/ai.service';
import { Server, PenTool, Code, Smartphone, Database, Cloud, LayoutTemplate, Layers, Star, Zap, ChevronRight, BookOpen } from 'lucide-react-native';

const { width: SW } = Dimensions.get('window');
const STORAGE_KEY_PREFIX = 'DEVTRACK_TRAIL_';

const C_BG = '#131f24';

// Map area to Lucide icon
function getAreaIcon(area: string, color: string, size: number = 28) {
    switch (area) {
        case 'backend':   return <Server         size={size} color={color} strokeWidth={2.5} />;
        case 'frontend':  return <LayoutTemplate  size={size} color={color} strokeWidth={2.5} />;
        case 'mobile':    return <Smartphone      size={size} color={color} strokeWidth={2.5} />;
        case 'fullstack': return <Layers          size={size} color={color} strokeWidth={2.5} />;
        case 'database':  return <Database        size={size} color={color} strokeWidth={2.5} />;
        case 'devops':    return <Cloud           size={size} color={color} strokeWidth={2.5} />;
        default:          return <Code            size={size} color={color} strokeWidth={2.5} />;
    }
}

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
    const done = progress >= total && total > 0;

    // Cor mais escura para o efeito 3D
    const hex = trail.color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substring(0,2), 16) - 50);
    const g = Math.max(0, parseInt(hex.substring(2,4), 16) - 50);
    const b = Math.max(0, parseInt(hex.substring(4,6), 16) - 50);
    const bdColor = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;

    // XP estimado para a trilha
    const estimatedXP = total * 10;

    return (
        <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()} style={[scaleStyle, { marginBottom: 14 }]}>
            <Pressable
                onPressIn={() => (scale.value = withSpring(0.97))}
                onPressOut={() => (scale.value = withSpring(1))}
                onPress={onPress}
                style={[styles.card, { backgroundColor: trail.color, borderBottomColor: bdColor }]}
            >
                {/* Highlight 3D no topo do card */}
                <View style={[styles.cardTopShine, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />

                <View style={styles.cardContent}>
                    {/* Header: Icon + Title + Badge */}
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(0,0,0,0.25)' }]}>
                            {getAreaIcon(trail.area, '#fff', 26)}
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={styles.titleRow}>
                                <Text style={styles.cardTitle}>{trail.label}</Text>
                                {isUserArea && (
                                    <View style={styles.myAreaBadge}>
                                        <Star size={10} color={trail.color} strokeWidth={2.5} fill={trail.color} />
                                        <Text style={[styles.myAreaText, { color: trail.color }]}>Sua área</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.cardSub}>{total} unidades · ~{estimatedXP} XP</Text>
                        </View>

                        {/* Progresso circular ou arrow */}
                        <View style={styles.cardArrow}>
                            {done ? (
                                <View style={styles.doneCircle}>
                                    <Text style={{ fontSize: 16 }}>✅</Text>
                                </View>
                            ) : (
                                <ChevronRight size={22} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
                            )}
                        </View>
                    </View>

                    {/* Barra de progresso melhorada */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressRow}>
                            <View style={[styles.progressTrack, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                                <Animated.View
                                    style={[
                                        styles.progressBar,
                                        { width: `${pct}%` as any, backgroundColor: done ? '#ffc800' : '#fff' },
                                    ]}
                                />
                            </View>
                        </View>
                        <View style={styles.progressFooter}>
                            <Text style={styles.progressText}>
                                {progress} de {total} completos
                            </Text>
                            <Text style={styles.progressPct}>{pct}%</Text>
                        </View>
                    </View>
                </View>
            </Pressable>
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
    const totalCompleted = Object.values(progressMap).reduce((a, b) => a + b, 0);
    const totalStops = TRAILS.reduce((a, t) => a + t.stops.length, 0);

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

    // Trilha destaque (a do usuário) vem primeiro
    const sortedTrails = [...TRAILS].sort((a, b) => {
        if (a.area === userArea) return -1;
        if (b.area === userArea) return 1;
        return 0;
    });

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

            {/* Header premium */}
            <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerTitle}>Cursos</Text>
                    <Text style={styles.headerSub}>Escolha sua trilha de aprendizado</Text>
                </View>
                <LivesBar />
            </Animated.View>

            {/* Card de progresso geral */}
            <Animated.View entering={FadeInDown.delay(80).duration(400).springify()} style={styles.overallCard}>
                <View style={styles.overallLeft}>
                    <BookOpen size={20} color="#ffc800" strokeWidth={2.5} />
                    <View>
                        <Text style={styles.overallTitle}>Progresso Geral</Text>
                        <Text style={styles.overallSub}>{totalCompleted} de {totalStops} unidades</Text>
                    </View>
                </View>
                <View style={styles.overallRight}>
                    <Text style={styles.overallPct}>
                        {totalStops > 0 ? Math.round((totalCompleted / totalStops) * 100) : 0}%
                    </Text>
                </View>
            </Animated.View>

            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>

                {/* Seção: Sua área em destaque */}
                <Animated.View entering={FadeInLeft.delay(120).duration(350)}>
                    <Text style={styles.sectionLabel}>📍 Comece por aqui</Text>
                </Animated.View>

                {sortedTrails.map((trail, i) => {
                    // Separador de seção entre a trilha do usuário e as demais
                    const isFirst = i === 1 && sortedTrails[0].area === userArea;
                    return (
                        <React.Fragment key={trail.area}>
                            {isFirst && (
                                <Animated.View entering={FadeInLeft.delay(200).duration(300)}>
                                    <Text style={[styles.sectionLabel, { marginTop: 4 }]}>🌐 Todas as trilhas</Text>
                                </Animated.View>
                            )}
                            <AreaCard
                                trail={trail}
                                progress={progressMap[trail.area] ?? 0}
                                total={trail.stops.length}
                                isUserArea={trail.area === userArea}
                                delay={100 + i * 60}
                                onPress={() => router.push(`/trail/${trail.area}` as any)}
                            />
                        </React.Fragment>
                    );
                })}

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: C_BG },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 16,
        borderBottomWidth: 2, borderBottomColor: '#212b31',
    },
    headerLeft:  { gap: 3 },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.3 },
    headerSub:   { color: '#6b6880', fontSize: 13, fontWeight: '600' },

    // Overall progress card
    overallCard: {
        marginHorizontal: 16, marginTop: 14, marginBottom: 4,
        backgroundColor: '#16151d', borderRadius: 18, padding: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 2, borderColor: '#212b31', borderBottomWidth: 4, borderBottomColor: '#161c20',
    },
    overallLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
    overallTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
    overallSub:   { color: '#6b6880', fontSize: 12, fontWeight: '600', marginTop: 2 },
    overallRight: { alignItems: 'flex-end' },
    overallPct:   { color: '#ffc800', fontSize: 22, fontWeight: '900' },

    // Section label
    sectionLabel: { color: '#6b6880', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 16 },

    list:        { paddingHorizontal: 16, paddingTop: 4 },

    // Card
    card: {
        borderRadius: 22,
        borderWidth: 0,
        borderBottomWidth: 7,
        overflow: 'hidden',
    },
    cardTopShine: {
        position: 'absolute', top: 0, left: 0, right: 0, height: 36,
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
    },
    cardContent:  { padding: 20, gap: 14 },
    cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
    cardIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    titleRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    cardTitle:    { color: '#fff', fontSize: 17, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
    cardSub:      { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 3, fontWeight: '600' },

    cardArrow:    { alignItems: 'center', justifyContent: 'center' },
    doneCircle:   { alignItems: 'center', justifyContent: 'center' },

    myAreaBadge:  { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 4 },
    myAreaText:   { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.3 },

    progressSection: { gap: 6 },
    progressRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
    progressTrack:   { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
    progressBar:     { height: '100%', borderRadius: 5 },
    progressFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressText:    { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
    progressPct:     { fontSize: 13, fontWeight: '900', color: '#fff' },
});
