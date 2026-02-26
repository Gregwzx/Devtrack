import React, { useState } from 'react';
import {
    ScrollView,
    SafeAreaView,
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
interface Friend {
    id: string;
    name: string;
    username: string;
    streak: number;
    learnings: number;
    isYou?: boolean;
}

type SortKey = 'streak' | 'learnings';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_FRIENDS: Friend[] = [
    { id: '1', name: 'Você',   username: '@devuser',    streak: 7,  learnings: 24, isYou: true },
    { id: '2', name: 'Greg',   username: '@greg',       streak: 14, learnings: 41 },
    { id: '3', name: 'AnaDev', username: '@anadev',     streak: 12, learnings: 38 },
    { id: '4', name: 'Lucas',  username: '@lucasdev',   streak: 5,  learnings: 19 },
    { id: '5', name: 'Marina', username: '@marinacode', streak: 3,  learnings: 12 },
    { id: '6', name: 'Pedro',  username: '@pedrozin',   streak: 2,  learnings: 8  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function getMedal(rank: number) {
    if (rank === 1) return { emoji: '🥇', color: '#FFD700' };
    if (rank === 2) return { emoji: '🥈', color: '#C0C0C0' };
    if (rank === 3) return { emoji: '🥉', color: '#CD7F32' };
    return { emoji: null, color: '#3a3560' };
}

// ─── Podium ───────────────────────────────────────────────────────────────────
function Podium({ top3, sortKey }: { top3: Friend[]; sortKey: SortKey }) {
    const colWidth = Math.floor((SCREEN_WIDTH - 32 - 16) / 3);

    const slots = [
        { friend: top3[1], rank: 2, blockH: 72,  avatarSize: 48, offset: 24 },
        { friend: top3[0], rank: 1, blockH: 100, avatarSize: 58, offset: 0  },
        { friend: top3[2], rank: 3, blockH: 52,  avatarSize: 44, offset: 36 },
    ];

    return (
        <Animated.View entering={FadeInUp.duration(600).springify()} style={podStyles.wrapper}>
            {slots.map(({ friend, rank, blockH, avatarSize, offset }) => {
                if (!friend) return null;
                const medal = getMedal(rank);
                const value = sortKey === 'streak'
                    ? `${friend.streak}🔥`
                    : `${friend.learnings}📝`;

                return (
                    <View key={friend.id} style={[podStyles.col, { width: colWidth, marginTop: offset }]}>
                        <Text style={podStyles.medalEmoji}>{medal.emoji}</Text>

                        <View style={[
                            podStyles.avatar,
                            { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
                            rank === 1 && { borderColor: '#FFD700', borderWidth: 2 },
                            friend.isYou && { borderColor: '#8b5cf6', borderWidth: 2 },
                        ]}>
                            <Text style={[podStyles.avatarText, { fontSize: Math.floor(avatarSize * 0.3) }]}>
                                {getInitials(friend.name)}
                            </Text>
                        </View>

                        <Text style={[podStyles.name, friend.isYou && { color: '#8b5cf6' }]} numberOfLines={1}>
                            {friend.isYou ? 'Você' : friend.name.split(' ')[0]}
                        </Text>

                        <Text style={podStyles.score} numberOfLines={1}>{value}</Text>

                        <View style={[
                            podStyles.block,
                            { height: blockH, borderColor: medal.color + '50' },
                            rank === 1 && { backgroundColor: '#1e1830' },
                        ]}>
                            <Text style={[podStyles.rankLabel, { color: medal.color }]}>{rank}°</Text>
                        </View>
                    </View>
                );
            })}
        </Animated.View>
    );
}

const podStyles = StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 28,
    },
    col: {
        alignItems: 'center',
        overflow: 'hidden',
    },
    medalEmoji: {
        fontSize: 20,
        marginBottom: 4,
    },
    avatar: {
        backgroundColor: '#2a2040',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    avatarText: {
        color: '#fff',
        fontWeight: '800',
    },
    name: {
        color: '#d4d0e8',
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 2,
        textAlign: 'center',
        width: '100%',
    },
    score: {
        color: '#6b6880',
        fontSize: 10,
        marginBottom: 6,
        textAlign: 'center',
    },
    block: {
        width: '100%',
        backgroundColor: '#16151d',
        borderWidth: 1,
        borderBottomWidth: 0,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        alignItems: 'center',
        paddingTop: 8,
    },
    rankLabel: {
        fontSize: 13,
        fontWeight: '900',
    },
});

// ─── Rank Row ─────────────────────────────────────────────────────────────────
function RankRow({ friend, rank, sortKey, delay }: {
    friend: Friend;
    rank: number;
    sortKey: SortKey;
    delay: number;
}) {
    const medal = getMedal(rank);
    const value = sortKey === 'streak' ? friend.streak : friend.learnings;
    const label = sortKey === 'streak' ? 'dias' : 'registros';

    return (
        <Animated.View
            entering={FadeInDown.delay(delay).duration(400)}
            style={[styles.row, friend.isYou && styles.rowYou]}
        >
            <View style={styles.rankCol}>
                {medal.emoji
                    ? <Text style={styles.rowEmoji}>{medal.emoji}</Text>
                    : <Text style={[styles.rowNum, { color: medal.color }]}>#{rank}</Text>
                }
            </View>

            <View style={[styles.rowAvatar, friend.isYou && styles.rowAvatarYou]}>
                <Text style={styles.rowAvatarText}>{getInitials(friend.name)}</Text>
            </View>

            <View style={styles.rowInfo}>
                <Text style={[styles.rowName, friend.isYou && { color: '#8b5cf6' }]} numberOfLines={1}>
                    {friend.name}{friend.isYou ? ' (você)' : ''}
                </Text>
                <Text style={styles.rowUsername} numberOfLines={1}>{friend.username}</Text>
            </View>

            <View style={styles.rowScoreCol}>
                <Text style={[styles.rowValue, friend.isYou && { color: '#8b5cf6' }]}>{value}</Text>
                <Text style={styles.rowLabel}>{label}</Text>
            </View>
        </Animated.View>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function RankingScreen() {
    const [sortKey, setSortKey] = useState<SortKey>('streak');

    const sorted = [...MOCK_FRIENDS].sort((a, b) => b[sortKey] - a[sortKey]);
    const top3 = sorted.slice(0, 3);
    const yourRank = sorted.findIndex((f) => f.isYou) + 1;

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
                <Text style={styles.headerTitle}>🏆 Ranking</Text>
                <Text style={styles.headerSub}>Entre amigos</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.yourBanner}>
                <Text style={styles.yourBannerText}>
                    Você está em <Text style={styles.yourBannerRank}>#{yourRank}</Text> lugar 🎯
                </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(130).duration(400)} style={styles.toggle}>
                {(['streak', 'learnings'] as SortKey[]).map((key) => (
                    <TouchableOpacity
                        key={key}
                        style={[styles.toggleBtn, sortKey === key && styles.toggleBtnActive]}
                        onPress={() => setSortKey(key)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.toggleText, sortKey === key && styles.toggleTextActive]}>
                            {key === 'streak' ? '🔥 Sequência' : '📝 Registros'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </Animated.View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <Podium top3={top3} sortKey={sortKey} />

                <View style={styles.listSection}>
                    <Text style={styles.listLabel}>Classificação completa</Text>
                    {sorted.map((friend, i) => (
                        <RankRow
                            key={friend.id}
                            friend={friend}
                            rank={i + 1}
                            sortKey={sortKey}
                            delay={i * 50}
                        />
                    ))}
                </View>

                <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.cta}>
                    <Text style={styles.ctaIcon}>👥</Text>
                    <Text style={styles.ctaTitle}>Adicionar amigos</Text>
                    <Text style={styles.ctaText}>
                        Em breve você poderá convidar amigos e competir em tempo real.
                    </Text>
                    <View style={styles.ctaBadge}>
                        <Text style={styles.ctaBadgeText}>Em breve</Text>
                    </View>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d0d10' },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
    headerTitle: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
    headerSub: { color: '#6b6880', fontSize: 13, marginTop: 2 },
    yourBanner: {
        marginHorizontal: 16, marginTop: 12, marginBottom: 12,
        backgroundColor: '#1e1830', borderRadius: 12,
        paddingVertical: 10, paddingHorizontal: 16,
        borderWidth: 1, borderColor: '#2a2040',
    },
    yourBannerText: { color: '#d4d0e8', fontSize: 13, fontWeight: '600', textAlign: 'center' },
    yourBannerRank: { color: '#8b5cf6', fontWeight: '900', fontSize: 15 },
    toggle: {
        flexDirection: 'row', marginHorizontal: 16, marginBottom: 20,
        backgroundColor: '#16151d', borderRadius: 12, padding: 3,
        borderWidth: 1, borderColor: '#2a2040',
    },
    toggleBtn: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
    toggleBtnActive: { backgroundColor: '#8b5cf6' },
    toggleText: { color: '#6b6880', fontSize: 13, fontWeight: '700' },
    toggleTextActive: { color: '#fff' },
    scroll: { paddingBottom: 40 },
    listSection: { paddingHorizontal: 16 },
    listLabel: {
        color: '#6b6880', fontSize: 11, fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
    },
    row: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#16151d', borderRadius: 14,
        padding: 12, marginBottom: 8,
        borderWidth: 1, borderColor: '#2a2040',
    },
    rowYou: { borderColor: '#3d2f6a', backgroundColor: '#1a1630' },
    rankCol: { width: 30, alignItems: 'center', marginRight: 10 },
    rowEmoji: { fontSize: 18 },
    rowNum: { fontSize: 12, fontWeight: '800' },
    rowAvatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#2a2040', alignItems: 'center',
        justifyContent: 'center', marginRight: 10,
        borderWidth: 2, borderColor: '#2a2040',
    },
    rowAvatarYou: { borderColor: '#8b5cf6' },
    rowAvatarText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    rowInfo: { flex: 1, minWidth: 0 },
    rowName: { color: '#d4d0e8', fontSize: 13, fontWeight: '700' },
    rowUsername: { color: '#6b6880', fontSize: 11, marginTop: 1 },
    rowScoreCol: { alignItems: 'flex-end', marginLeft: 8, minWidth: 48 },
    rowValue: { color: '#fff', fontSize: 17, fontWeight: '900' },
    rowLabel: { color: '#6b6880', fontSize: 10, marginTop: 1 },
    cta: {
        marginHorizontal: 16, marginTop: 20,
        backgroundColor: '#16151d', borderRadius: 18,
        padding: 22, alignItems: 'center',
        borderWidth: 1, borderColor: '#2a2040', borderStyle: 'dashed',
    },
    ctaIcon: { fontSize: 28, marginBottom: 8 },
    ctaTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 6 },
    ctaText: { color: '#6b6880', fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 12 },
    ctaBadge: { backgroundColor: '#2a2040', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
    ctaBadgeText: { color: '#8b5cf6', fontSize: 11, fontWeight: '700' },
});