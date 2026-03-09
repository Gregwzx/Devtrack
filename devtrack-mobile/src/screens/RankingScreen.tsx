// src/screens/RankingScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    ScrollView, StyleSheet, View, Text, TouchableOpacity,
    Dimensions, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
    Trophy, Flame, BookOpen, Users, Medal,
    TrendingUp, RefreshCw, WifiOff,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { getGlobalRanking, RankingUser } from '../services/userService';
import { AREA_ICON } from '../constants/areas';
import type { StudyArea } from '../services/ai.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SortKey = 'streak' | 'learnings';

// ─── Mock fallback ────────────────────────────────────────────────────────────
const MOCK_FRIENDS: RankingUser[] = [
    { uid: '1', name: 'Você',   username: '@devuser',    streak: 7,  learnings: 24, studyArea: 'fullstack' },
    { uid: '2', name: 'Greg',   username: '@greg',       streak: 14, learnings: 41, studyArea: 'frontend'  },
    { uid: '3', name: 'AnaDev', username: '@anadev',     streak: 12, learnings: 38, studyArea: 'backend'   },
    { uid: '4', name: 'Lucas',  username: '@lucasdev',   streak: 5,  learnings: 19, studyArea: 'frontend'  },
    { uid: '5', name: 'Marina', username: '@marinacode', streak: 3,  learnings: 12, studyArea: 'fullstack'  },
    { uid: '6', name: 'Pedro',  username: '@pedrozin',   streak: 2,  learnings: 8,  studyArea: 'backend'   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

const MEDAL_COLOR: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

// ─── Podium ───────────────────────────────────────────────────────────────────
function Podium({ top3, sortKey }: { top3: RankingUser[]; sortKey: SortKey }) {
    const colW = Math.floor((SCREEN_WIDTH - 32 - 16) / 3);
    const slots = [
        { f: top3[1], rank: 2, blockH: 72,  avSize: 48, offset: 24 },
        { f: top3[0], rank: 1, blockH: 100, avSize: 58, offset: 0  },
        { f: top3[2], rank: 3, blockH: 52,  avSize: 44, offset: 36 },
    ];

    return (
        <Animated.View entering={FadeInUp.duration(600).springify()} style={podStyles.wrapper}>
            {slots.map(({ f, rank, blockH, avSize, offset }) => {
                if (!f) return null;
                const mc      = MEDAL_COLOR[rank];
                const value   = sortKey === 'streak' ? f.streak : f.learnings;
                const ValIcon = sortKey === 'streak' ? Flame : BookOpen;
                const areaC   = AREA_ICON[f.studyArea ?? 'fullstack'];

                return (
                    <View key={f.uid} style={[podStyles.col, { width: colW, marginTop: offset }]}>
                        <Medal size={20} color={mc} strokeWidth={2} fill={mc + '22'} style={{ marginBottom: 4 }} />
                        <View style={[
                            podStyles.avatar,
                            { width: avSize, height: avSize, borderRadius: avSize / 2 },
                            rank === 1 && { borderColor: '#FFD700', borderWidth: 2 },
                            f.isYou && { borderColor: '#8b5cf6', borderWidth: 2 },
                        ]}>
                            <Text style={[podStyles.avatarText, { fontSize: Math.floor(avSize * 0.3) }]}>
                                {getInitials(f.name)}
                            </Text>
                        </View>
                        <View style={podStyles.nameRow}>
                            <Text style={[podStyles.name, f.isYou && { color: '#8b5cf6' }]} numberOfLines={1}>
                                {f.isYou ? 'Você' : f.name.split(' ')[0]}
                            </Text>
                            <areaC.Icon size={9} color={areaC.color} strokeWidth={2} />
                        </View>
                        <View style={podStyles.scoreRow}>
                            <ValIcon size={10} color="#6b6880" strokeWidth={2} />
                            <Text style={podStyles.score}>{value}</Text>
                        </View>
                        <View style={[podStyles.block, { height: blockH, borderColor: mc + '50' }, rank === 1 && { backgroundColor: '#1e1830' }]}>
                            <Text style={[podStyles.rankLabel, { color: mc }]}>{rank}°</Text>
                        </View>
                    </View>
                );
            })}
        </Animated.View>
    );
}

const podStyles = StyleSheet.create({
    wrapper:    { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, gap: 8, marginBottom: 28 },
    col:        { alignItems: 'center', overflow: 'hidden' },
    avatar:     { backgroundColor: '#2a2040', alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
    avatarText: { color: '#fff', fontWeight: '800' },
    nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 },
    name:       { color: '#d4d0e8', fontSize: 11, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
    scoreRow:   { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
    score:      { color: '#6b6880', fontSize: 10 },
    block:      { width: '100%', backgroundColor: '#16151d', borderWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: 10, borderTopRightRadius: 10, alignItems: 'center', paddingTop: 8 },
    rankLabel:  { fontSize: 13, fontWeight: '900' },
});

// ─── Rank Row ─────────────────────────────────────────────────────────────────
function RankRow({ friend, rank, sortKey, delay }: {
    friend: RankingUser; rank: number; sortKey: SortKey; delay: number;
}) {
    const value   = sortKey === 'streak' ? friend.streak : friend.learnings;
    const label   = sortKey === 'streak' ? 'dias' : 'registros';
    const ValIcon = sortKey === 'streak' ? Flame : BookOpen;
    const areaC   = AREA_ICON[friend.studyArea ?? 'fullstack'];
    const mc      = MEDAL_COLOR[rank];

    return (
        <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={[styles.row, friend.isYou && styles.rowYou]}>
            <View style={styles.rankCol}>
                {mc
                    ? <Medal size={18} color={mc} strokeWidth={2} fill={mc + '22'} />
                    : <Text style={styles.rowNum}>#{rank}</Text>
                }
            </View>
            <View style={[styles.rowAvatar, friend.isYou && styles.rowAvatarYou]}>
                <Text style={styles.rowAvatarText}>{getInitials(friend.name)}</Text>
            </View>
            <View style={styles.rowInfo}>
                <View style={styles.rowNameRow}>
                    <Text style={[styles.rowName, friend.isYou && { color: '#8b5cf6' }]} numberOfLines={1}>
                        {friend.name}{friend.isYou ? ' (você)' : ''}
                    </Text>
                    <areaC.Icon size={11} color={areaC.color} strokeWidth={2} />
                </View>
                <Text style={styles.rowUsername}>{friend.username}</Text>
            </View>
            <View style={styles.rowScoreCol}>
                <View style={styles.rowScoreInner}>
                    <ValIcon size={12} color={friend.isYou ? '#8b5cf6' : '#6b6880'} strokeWidth={2} />
                    <Text style={[styles.rowValue, friend.isYou && { color: '#8b5cf6' }]}>{value}</Text>
                </View>
                <Text style={styles.rowLabel}>{label}</Text>
            </View>
        </Animated.View>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function RankingScreen() {
    const { user } = useAuth();
    const [sortKey,    setSortKey]    = useState<SortKey>('streak');
    const [users,      setUsers]      = useState<RankingUser[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isOffline,  setIsOffline]  = useState(false);

    const fetchRanking = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else           setLoading(true);

        try {
            const data = await getGlobalRanking(user?.uid ?? '', sortKey);
            if (data.length > 0) {
                setUsers(data);
                setIsOffline(false);
            } else {
                const mock = MOCK_FRIENDS.map(f => ({ ...f, isYou: f.uid === '1' }));
                setUsers(mock);
                setIsOffline(false);
            }
        } catch {
            const mock = MOCK_FRIENDS.map(f => ({ ...f, isYou: f.uid === '1' }));
            setUsers(mock);
            setIsOffline(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.uid, sortKey]);

    useEffect(() => { fetchRanking(); }, [sortKey]);

    const sorted   = [...users].sort((a, b) => b[sortKey] - a[sortKey]);
    const top3     = sorted.slice(0, 3);
    const yourRank = sorted.findIndex(f => f.isYou) + 1;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
                <View style={styles.headerLeft}>
                    <Trophy size={22} color="#FFD700" strokeWidth={2} fill="#FFD70018" />
                    <Text style={styles.headerTitle}>Ranking</Text>
                    {isOffline && (
                        <View style={styles.offlineBadge}>
                            <WifiOff size={10} color="#f87171" strokeWidth={2} />
                            <Text style={styles.offlineText}>Offline</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity onPress={() => fetchRanking(true)} disabled={refreshing}>
                    <RefreshCw size={18} color={refreshing ? '#2a2040' : '#6b6880'} strokeWidth={2} />
                </TouchableOpacity>
            </Animated.View>
            <Text style={styles.headerSub}>Ranking global · {users.length} usuários</Text>

            {/* Your position */}
            {yourRank > 0 && (
                <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.yourBanner}>
                    <TrendingUp size={14} color="#8b5cf6" strokeWidth={2} />
                    <Text style={styles.yourBannerText}>
                        Você está em <Text style={styles.yourBannerRank}>#{yourRank}</Text> lugar
                    </Text>
                </Animated.View>
            )}

            {/* Sort toggle */}
            <Animated.View entering={FadeInDown.delay(110).duration(400)} style={styles.toggle}>
                {(['streak', 'learnings'] as SortKey[]).map(key => {
                    const Icon   = key === 'streak' ? Flame : BookOpen;
                    const active = sortKey === key;
                    return (
                        <TouchableOpacity
                            key={key}
                            style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                            onPress={() => setSortKey(key)}
                            activeOpacity={0.8}
                        >
                            <Icon size={13} color={active ? '#fff' : '#6b6880'} strokeWidth={2} />
                            <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                                {key === 'streak' ? 'Sequência' : 'Registros'}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </Animated.View>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                    <Text style={styles.loadingText}>Carregando ranking...</Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scroll}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchRanking(true)}
                            tintColor="#8b5cf6"
                            colors={['#8b5cf6']}
                        />
                    }
                >
                    <Podium top3={top3} sortKey={sortKey} />

                    <View style={styles.listSection}>
                        <Text style={styles.listLabel}>Classificação completa</Text>
                        {sorted.map((friend, i) => (
                            <RankRow key={friend.uid} friend={friend} rank={i + 1} sortKey={sortKey} delay={i * 45} />
                        ))}
                    </View>

                    {/* CTA */}
                    <Animated.View entering={FadeInDown.delay(320).duration(500)} style={styles.cta}>
                        <Users size={28} color="#2a2040" strokeWidth={1.5} style={{ marginBottom: 8 }} />
                        <Text style={styles.ctaTitle}>Convide amigos</Text>
                        <Text style={styles.ctaText}>
                            Compartilhe seu perfil e compete com quem você conhece em tempo real.
                        </Text>
                        <View style={styles.ctaBadge}>
                            <Text style={styles.ctaBadgeText}>Em breve</Text>
                        </View>
                    </Animated.View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#0d0d10' },
    header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 2 },
    headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    headerSub:   { color: '#6b6880', fontSize: 12, paddingHorizontal: 20, marginBottom: 12 },

    offlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2a1010', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: '#5a1a1a' },
    offlineText:  { color: '#f87171', fontSize: 10, fontWeight: '700' },

    yourBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1e1830', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#2a2040' },
    yourBannerText: { color: '#d4d0e8', fontSize: 13, fontWeight: '600' },
    yourBannerRank: { color: '#8b5cf6', fontWeight: '900', fontSize: 15 },

    toggle:          { flexDirection: 'row', marginHorizontal: 16, marginBottom: 20, backgroundColor: '#16151d', borderRadius: 12, padding: 3, borderWidth: 1, borderColor: '#2a2040' },
    toggleBtn:       { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    toggleBtnActive: { backgroundColor: '#8b5cf6' },
    toggleText:      { color: '#6b6880', fontSize: 13, fontWeight: '700' },
    toggleTextActive:{ color: '#fff' },

    loadingWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText:  { color: '#6b6880', fontSize: 14 },

    scroll:      { paddingBottom: 40 },
    listSection: { paddingHorizontal: 16 },
    listLabel:   { color: '#6b6880', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

    row:           { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16151d', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2a2040' },
    rowYou:        { borderColor: '#3d2f6a', backgroundColor: '#1a1630' },
    rankCol:       { width: 30, alignItems: 'center', marginRight: 10 },
    rowNum:        { fontSize: 12, fontWeight: '800', color: '#3a3560' },
    rowAvatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2a2040', alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 2, borderColor: '#2a2040' },
    rowAvatarYou:  { borderColor: '#8b5cf6' },
    rowAvatarText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    rowInfo:       { flex: 1, minWidth: 0 },
    rowNameRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
    rowName:       { color: '#d4d0e8', fontSize: 13, fontWeight: '700', flexShrink: 1 },
    rowUsername:   { color: '#6b6880', fontSize: 11, marginTop: 1 },
    rowScoreCol:   { alignItems: 'flex-end', marginLeft: 8, minWidth: 52 },
    rowScoreInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    rowValue:      { color: '#fff', fontSize: 17, fontWeight: '900' },
    rowLabel:      { color: '#6b6880', fontSize: 10, marginTop: 1 },

    cta:          { marginHorizontal: 16, marginTop: 20, backgroundColor: '#16151d', borderRadius: 18, padding: 22, alignItems: 'center', borderWidth: 1, borderColor: '#2a2040', borderStyle: 'dashed' },
    ctaTitle:     { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 6 },
    ctaText:      { color: '#6b6880', fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 12 },
    ctaBadge:     { backgroundColor: '#2a2040', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
    ctaBadgeText: { color: '#8b5cf6', fontSize: 11, fontWeight: '700' },
});