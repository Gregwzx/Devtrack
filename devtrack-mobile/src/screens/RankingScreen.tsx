// src/screens/RankingScreen.tsx — Ranking conectado ao backend real com fallback offline
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trophy, Flame, Zap, BookOpen, Crown, Medal, RefreshCw, WifiOff } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { getGlobalRanking } from '../services/userService';

const { width: SW } = Dimensions.get('window');

// Paleta roxa
const C_BG     = '#0d0b14';
const C_CARD   = '#13101e';
const C_BORDER = '#1e1a2e';
const C_DEEP   = '#0a0810';
const C_P1     = '#8b5cf6';
const C_P2     = '#7c3aed';
const C_GOLD   = '#ffc800';
const C_SILVER = '#c0c0c0';
const C_BRONZE = '#cd7f32';

type FilterType = 'streak' | 'xp' | 'learnings';

interface RankEntry {
    id: string;
    name: string;
    studyArea: string;
    streak: number;
    xp: number;
    learnings: number;
    isYou?: boolean;
}

const FILTERS: { key: FilterType; label: string; Icon: any; color: string }[] = [
    { key: 'streak',    label: 'Sequência',    Icon: Flame,    color: '#ff9600' },
    { key: 'xp',        label: 'XP',           Icon: Zap,      color: C_P1      },
    { key: 'learnings', label: 'Aprendizados', Icon: BookOpen, color: '#58cc02' },
];

// Mapa de área → emoji para identificação visual
const AREA_EMOJI: Record<string, string> = {
    frontend: '🎨', backend: '⚙️', mobile: '📱',
    devops: '☁️', fullstack: '🧱', security: '🔐',
};

function PodiumCard({ rank, name, value, area, color }: {
    rank: 1|2|3; name: string; value: number; area: string; color: string;
}) {
    const heights  = { 1: 90, 2: 68, 3: 52 };
    const colors   = { 1: C_GOLD, 2: C_SILVER, 3: C_BRONZE };
    const RankIcon = rank === 1 ? Crown : Medal;
    return (
        <View style={[pod.wrap, { width: rank === 1 ? '36%' : '30%' }]}>
            <View style={pod.nameBox}>
                <Text style={{ fontSize: 18 }}>{AREA_EMOJI[area] ?? '💻'}</Text>
                <RankIcon size={rank===1?20:16} color={colors[rank]} strokeWidth={2.5}/>
                <Text style={pod.name} numberOfLines={1}>{name}</Text>
            </View>
            <Text style={[pod.value, { color }]}>{value.toLocaleString()}</Text>
            <View style={[pod.bar, { height: heights[rank], backgroundColor: colors[rank] + '30', borderColor: colors[rank] + '60' }]}>
                <Text style={[pod.rank, { color: colors[rank] }]}>#{rank}</Text>
            </View>
        </View>
    );
}

function RankRow({ pos, entry, isYou, Icon, color }: {
    pos: number; entry: RankEntry; isYou: boolean; Icon: any; color: string;
}) {
    const scale = useSharedValue(1);
    const st = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    const getValue = () => {
        if (Icon === Flame) return entry.streak;
        if (Icon === Zap)   return entry.xp;
        return entry.learnings;
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(pos * 35).duration(300)}
            style={[row.card, isYou && { borderColor: C_P1, borderBottomColor: C_P2, backgroundColor: C_P1 + '08' }, st]}
        >
            <Text style={[row.pos, pos <= 3 && { color: [C_GOLD, C_SILVER, C_BRONZE][pos-1] }]}>
                #{pos}
            </Text>
            <View style={[row.avatar, { backgroundColor: isYou ? C_P1 + '30' : '#1e1a2e', borderColor: isYou ? C_P1 : '#2d2640' }]}>
                <Text style={{ fontSize: 16 }}>{AREA_EMOJI[entry.studyArea] ?? '💻'}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[row.name, isYou && { color: C_P1 }]} numberOfLines={1}>
                    {isYou ? `${entry.name} (você)` : entry.name}
                </Text>
                <Text style={row.area}>{entry.studyArea}</Text>
            </View>
            <View style={row.valueBadge}>
                <Icon size={13} color={color} strokeWidth={2.5} />
                <Text style={[row.valueText, { color }]}>{getValue().toLocaleString()}</Text>
            </View>
        </Animated.View>
    );
}

export default function RankingScreen() {
    const { user } = useAuth();
    const email    = user?.email ?? '';
    const uid      = (user as any)?.id ?? '';
    const myName   = user?.name ?? 'Você';

    const [filter,    setFilter]    = useState<FilterType>('streak');
    const [entries,   setEntries]   = useState<RankEntry[]>([]);
    const [loading,   setLoading]   = useState(true);
    const [refreshing,setRefreshing]= useState(false);
    const [offline,   setOffline]   = useState(false);

    // Dados locais do usuário logado (AsyncStorage)
    const [myStreak,    setMyStreak]    = useState(0);
    const [myXp,        setMyXp]        = useState(0);
    const [myLearnings, setMyLearnings] = useState(0);

    // Carrega dados locais do usuário atual
    useEffect(() => {
        (async () => {
            const sk = await AsyncStorage.getItem(`DEVTRACK_STREAK_${email}`);
            const xk = await AsyncStorage.getItem(`DEVTRACK_XP_${email}`);
            const lk = await AsyncStorage.getItem(`DEVTRACK_LEARNINGS_${email}`);
            if (sk) { try { setMyStreak(JSON.parse(sk).count ?? 0); } catch {} }
            if (xk) setMyXp(parseInt(xk, 10) || 0);
            if (lk) { try { setMyLearnings(JSON.parse(lk).length ?? 0); } catch {} }
        })();
    }, [email]);

    const loadRanking = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        setOffline(false);

        try {
            // Busca do backend real
            const apiData = await getGlobalRanking(uid, filter);

            if (apiData.length === 0) {
                // Backend sem dados ou offline — usa entrada local
                setOffline(true);
                const localEntry: RankEntry = {
                    id: uid || 'local',
                    name: myName,
                    studyArea: (user as any)?.studyArea ?? 'fullstack',
                    streak: myStreak,
                    xp: myXp,
                    learnings: myLearnings,
                    isYou: true,
                };
                setEntries([localEntry]);
            } else {
                // Garante que o usuário local está na lista com dados corretos
                const withMe = apiData.map(u => ({
                    id: u.uid,
                    name: u.name,
                    studyArea: u.studyArea,
                    streak: u.streak,
                    xp: (u as any).xp ?? u.learnings * 10,
                    learnings: u.learnings,
                    isYou: u.isYou || u.uid === uid,
                } as RankEntry));

                // Se o usuário logado não aparece na lista (ex: sem learnings ainda)
                const alreadyIn = withMe.some(e => e.isYou);
                if (!alreadyIn && uid && uid !== 'guest_local') {
                    withMe.push({
                        id: uid,
                        name: myName,
                        studyArea: (user as any)?.studyArea ?? 'fullstack',
                        streak: myStreak,
                        xp: myXp,
                        learnings: myLearnings,
                        isYou: true,
                    });
                }

                setEntries(withMe);
            }
        } catch (e) {
            setOffline(true);
            setEntries([{
                id: uid || 'local',
                name: myName,
                studyArea: (user as any)?.studyArea ?? 'fullstack',
                streak: myStreak,
                xp: myXp,
                learnings: myLearnings,
                isYou: true,
            }]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [uid, filter, myStreak, myXp, myLearnings, myName]);

    useEffect(() => { loadRanking(); }, [filter]);

    // Ordena localmente pelo filtro
    const getValue = (e: RankEntry) => {
        if (filter === 'xp') return e.xp;
        if (filter === 'learnings') return e.learnings;
        return e.streak;
    };

    const sorted = [...entries].sort((a, b) => getValue(b) - getValue(a));
    const top3   = sorted.slice(0, 3);
    const rest   = sorted.slice(3);

    const activeFilter = FILTERS.find(f => f.key === filter)!;

    return (
        <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <Animated.View entering={FadeInUp.duration(400)} style={s.header}>
                <View style={s.headerLeft}>
                    <Trophy size={26} color={C_P1} strokeWidth={2.5} />
                    <Text style={s.title}>Ranking</Text>
                    {offline && (
                        <View style={s.offlineBadge}>
                            <WifiOff size={12} color="#ff9600" strokeWidth={2.5} />
                            <Text style={s.offlineText}>Offline</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity
                    style={s.refreshBtn}
                    onPress={() => loadRanking(true)}
                    disabled={refreshing || loading}
                >
                    {refreshing
                        ? <ActivityIndicator size="small" color={C_P1} />
                        : <RefreshCw size={18} color={C_P1} strokeWidth={2.5} />
                    }
                </TouchableOpacity>
            </Animated.View>

            {/* Filter tabs */}
            <View style={s.filters}>
                {FILTERS.map(f => (
                    <TouchableOpacity
                        key={f.key}
                        style={[s.filterBtn, filter === f.key && { backgroundColor: f.color + '20', borderColor: f.color }]}
                        onPress={() => setFilter(f.key)}
                    >
                        <f.Icon size={14} color={filter === f.key ? f.color : '#6b6880'} strokeWidth={2.5} />
                        <Text style={[s.filterTxt, { color: filter === f.key ? f.color : '#6b6880' }]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={s.loadingWrap}>
                    <ActivityIndicator size="large" color={C_P1} />
                    <Text style={s.loadingText}>Carregando ranking...</Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => loadRanking(true)}
                            tintColor={C_P1}
                            colors={[C_P1]}
                        />
                    }
                >
                    {/* Banner offline */}
                    {offline && (
                        <Animated.View entering={FadeInDown.duration(300)} style={s.offlineCard}>
                            <WifiOff size={16} color="#ff9600" strokeWidth={2.5} />
                            <Text style={s.offlineCardText}>
                                Sem conexão com o servidor. Mostrando seus dados locais.
                            </Text>
                        </Animated.View>
                    )}

                    {/* Pódio — só mostra com 3+ usuários */}
                    {top3.length >= 3 && (
                        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={s.podium}>
                            <PodiumCard rank={2} name={top3[1].name} value={getValue(top3[1])} area={top3[1].studyArea} color={activeFilter.color} />
                            <PodiumCard rank={1} name={top3[0].name} value={getValue(top3[0])} area={top3[0].studyArea} color={activeFilter.color} />
                            <PodiumCard rank={3} name={top3[2].name} value={getValue(top3[2])} area={top3[2].studyArea} color={activeFilter.color} />
                        </Animated.View>
                    )}

                    {/* Estado vazio */}
                    {sorted.length === 0 && (
                        <View style={s.emptyWrap}>
                            <Trophy size={48} color="#2d2640" strokeWidth={2} />
                            <Text style={s.emptyTitle}>Ranking vazio</Text>
                            <Text style={s.emptyText}>Seja o primeiro a registrar um aprendizado!</Text>
                        </View>
                    )}

                    {/* Lista completa */}
                    <View style={s.list}>
                        {sorted.map((entry, i) => (
                            <RankRow
                                key={entry.id}
                                pos={i + 1}
                                entry={entry}
                                isYou={entry.isYou ?? false}
                                Icon={activeFilter.Icon}
                                color={activeFilter.color}
                            />
                        ))}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    container:   { flex: 1, backgroundColor: C_BG },
    header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 2, borderBottomColor: C_BORDER },
    headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
    title:       { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
    refreshBtn:  { padding: 8, borderRadius: 12, backgroundColor: C_P1 + '15', borderWidth: 1.5, borderColor: C_P1 + '40' },

    offlineBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ff960020', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#ff960050' },
    offlineText:     { color: '#ff9600', fontSize: 10, fontWeight: '800' },
    offlineCard:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 12, backgroundColor: '#ff960015', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#ff960040' },
    offlineCardText: { color: '#ff9600', fontSize: 13, fontWeight: '600', flex: 1 },

    filters:     { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
    filterBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 14, borderWidth: 2, borderColor: C_BORDER, borderBottomWidth: 4, borderBottomColor: C_DEEP, backgroundColor: C_CARD },
    filterTxt:   { fontSize: 12, fontWeight: '800' },
    podium:      { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 24 },
    list:        { paddingHorizontal: 16, gap: 8 },

    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 80 },
    loadingText: { color: '#6b6880', fontSize: 14, fontWeight: '600' },

    emptyWrap:  { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
    emptyText:  { color: '#6b6880', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});

const pod = StyleSheet.create({
    wrap:    { alignItems: 'center', gap: 6 },
    nameBox: { alignItems: 'center', gap: 4 },
    name:    { color: '#fff', fontSize: 11, fontWeight: '800', textAlign: 'center', maxWidth: 90 },
    value:   { fontSize: 13, fontWeight: '900' },
    bar:     { width: '100%', borderRadius: 12, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10, borderWidth: 2, borderBottomWidth: 5 },
    rank:    { fontSize: 18, fontWeight: '900' },
});

const row = StyleSheet.create({
    card:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: C_CARD, borderWidth: 2, borderColor: C_BORDER, borderBottomWidth: 5, borderBottomColor: C_DEEP },
    pos:        { color: '#6b6880', fontSize: 14, fontWeight: '900', width: 28, textAlign: 'center' },
    avatar:     { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
    name:       { color: '#fff', fontSize: 14, fontWeight: '800' },
    area:       { color: '#6b6880', fontSize: 11, fontWeight: '600', marginTop: 1 },
    valueBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#1e1a2e', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 2, borderColor: '#2d2640', borderBottomWidth: 3, borderBottomColor: C_DEEP },
    valueText:  { fontSize: 13, fontWeight: '900' },
});
