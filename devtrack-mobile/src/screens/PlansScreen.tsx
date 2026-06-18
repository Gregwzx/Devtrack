// src/screens/PlansScreen.tsx
// Tela de planos: Starter vs DevTrack Pro
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, X, Zap, Crown, Heart, Palette, Star, ArrowLeft, Sparkles } from 'lucide-react-native';
import { usePlan } from '../context/PlanContext';
import { useLives } from '../context/LivesContext';
import { router } from 'expo-router';

const { width: SW } = Dimensions.get('window');

const FREE_FEATURES = [
    { icon: '❤️', label: '5 Vidas por sessão (regenera 30min)', included: true },
    { icon: '🎓', label: 'Trilhas de estudo completas', included: true },
    { icon: '🏆', label: 'Ranking global', included: true },
    { icon: '⏱️', label: 'Timer Pomodoro', included: true },
    { icon: '🎨', label: 'Customização básica do avatar', included: true },
    { icon: '💎', label: 'Avatar com opções exclusivas', included: false },
    { icon: '♾️', label: 'Vidas infinitas', included: false },
    { icon: '👑', label: 'Badge PRO no perfil', included: false },
    { icon: '🚀', label: 'Desbloqueia TUDO no avatar', included: false },
];

const PRO_FEATURES = [
    { icon: '❤️', label: '5 Vidas por sessão (regenera 30min)', included: true },
    { icon: '🎓', label: 'Trilhas de estudo completas', included: true },
    { icon: '🏆', label: 'Ranking global', included: true },
    { icon: '⏱️', label: 'Timer Pomodoro', included: true },
    { icon: '🎨', label: 'Customização básica do avatar', included: true },
    { icon: '💎', label: 'Avatar com opções exclusivas', included: true },
    { icon: '♾️', label: 'Vidas infinitas', included: true },
    { icon: '👑', label: 'Badge PRO no perfil', included: true },
    { icon: '🚀', label: 'Desbloqueia TUDO no avatar', included: true },
];

export default function PlansScreen() {
    const { isPro, activatePro, deactivatePro } = usePlan();
    const { activateInfinite, refillAll } = useLives();
    const [loading, setLoading] = useState(false);

    const scaleBtn = useSharedValue(1);
    const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: scaleBtn.value }] }));

    const handleUpgrade = () => {
        scaleBtn.value = withSpring(0.95, {}, () => { scaleBtn.value = withSpring(1); });
        Alert.alert(
            '🚀 Ativar DevTrack Pro',
            'Deseja ativar o plano Pro? Você terá vidas infinitas e acesso total ao avatar!',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Ativar Pro!',
                    onPress: () => {
                        setLoading(true);
                        setTimeout(() => {
                            activatePro();
                            activateInfinite();
                            setLoading(false);
                            Alert.alert('👑 Bem-vindo ao Pro!', 'Você agora tem acesso total ao DevTrack!', [
                                { text: 'Incrível!', onPress: () => router.back() }
                            ]);
                        }, 800);
                    }
                },
            ]
        );
    };

    const handleDowngrade = () => {
        Alert.alert(
            'Voltar ao Starter?',
            'Você perderá as vidas infinitas e os itens exclusivos do avatar.',
            [
                { text: 'Manter Pro', style: 'cancel' },
                { text: 'Confirmar', style: 'destructive', onPress: () => { deactivatePro(); refillAll(); router.back(); } },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                {/* Header */}
                <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Planos</Text>
                    <View style={{ width: 40 }} />
                </Animated.View>

                {/* Hero */}
                <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.hero}>
                    <LinearGradient
                        colors={['#1a0a35', '#2d1456', '#1a0a35']}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    />
                    <Text style={styles.heroEmoji}>👑</Text>
                    <Text style={styles.heroTitle}>DevTrack Pro</Text>
                    <Text style={styles.heroSub}>Desbloqueie seu potencial total de dev</Text>
                    <View style={styles.priceBadge}>
                        <Text style={styles.priceValue}>R$ 19</Text>
                        <Text style={styles.pricePer}>,90/mês</Text>
                    </View>
                </Animated.View>

                {/* Cards de plano lado a lado */}
                <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.cardsRow}>

                    {/* STARTER */}
                    <View style={[styles.planCard, styles.starterCard]}>
                        <View style={styles.planCardHeader}>
                            <Zap size={20} color="#6b6880" strokeWidth={2.5} />
                            <Text style={styles.planCardTitle}>Starter</Text>
                        </View>
                        <Text style={styles.planCardPrice}>Grátis</Text>
                        <View style={styles.planCardDivider} />
                        {FREE_FEATURES.map((f, i) => (
                            <View key={i} style={styles.featureRow}>
                                <View style={[styles.featureCheck, f.included ? styles.featureCheckOn : styles.featureCheckOff]}>
                                    {f.included
                                        ? <Check size={11} color="#10b981" strokeWidth={3} />
                                        : <X size={11} color="#3a3a4a" strokeWidth={3} />
                                    }
                                </View>
                                <Text style={[styles.featureLbl, !f.included && styles.featureLblOff]} numberOfLines={2}>
                                    {f.label}
                                </Text>
                            </View>
                        ))}
                        {!isPro && (
                            <View style={styles.currentBadge}>
                                <Text style={styles.currentBadgeTxt}>✓ Plano atual</Text>
                            </View>
                        )}
                    </View>

                    {/* PRO */}
                    <View style={[styles.planCard, styles.proCard]}>
                        <LinearGradient
                            colors={['#2d1456', '#1a0a35']}
                            style={StyleSheet.absoluteFillObject}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        />
                        <View style={styles.popularBadge}>
                            <Sparkles size={10} color="#f59e0b" />
                            <Text style={styles.popularTxt}>POPULAR</Text>
                        </View>
                        <View style={styles.planCardHeader}>
                            <Crown size={20} color="#f59e0b" strokeWidth={2.5} />
                            <Text style={[styles.planCardTitle, { color: '#f59e0b' }]}>Pro</Text>
                        </View>
                        <Text style={[styles.planCardPrice, { color: '#fff' }]}>R$ 19,90</Text>
                        <View style={[styles.planCardDivider, { backgroundColor: '#8b5cf640' }]} />
                        {PRO_FEATURES.map((f, i) => (
                            <View key={i} style={styles.featureRow}>
                                <View style={[styles.featureCheck, f.included ? styles.featureCheckPro : styles.featureCheckOff]}>
                                    {f.included
                                        ? <Check size={11} color="#8b5cf6" strokeWidth={3} />
                                        : <X size={11} color="#3a3a4a" strokeWidth={3} />
                                    }
                                </View>
                                <Text style={[styles.featureLbl, { color: '#d4d0e8' }]} numberOfLines={2}>
                                    {f.label}
                                </Text>
                            </View>
                        ))}
                        {isPro && (
                            <View style={[styles.currentBadge, { backgroundColor: '#f59e0b20', borderColor: '#f59e0b50' }]}>
                                <Text style={[styles.currentBadgeTxt, { color: '#f59e0b' }]}>👑 Plano atual</Text>
                            </View>
                        )}
                    </View>

                </Animated.View>

                {/* Botão CTA */}
                <Animated.View entering={FadeInDown.delay(350).duration(400)} style={{ paddingHorizontal: 20 }}>
                    {!isPro ? (
                        <Animated.View style={btnStyle}>
                            <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade} activeOpacity={0.9}>
                                <LinearGradient
                                    colors={['#7c3aed', '#8b5cf6', '#a78bfa']}
                                    style={StyleSheet.absoluteFillObject}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                />
                                <Crown size={20} color="#fff" strokeWidth={2.5} />
                                <Text style={styles.upgradeBtnTxt}>
                                    {loading ? 'Ativando...' : 'Assinar DevTrack Pro'}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        <TouchableOpacity style={styles.downgradeBtn} onPress={handleDowngrade} activeOpacity={0.8}>
                            <Text style={styles.downgradeBtnTxt}>Cancelar plano Pro</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>

                {/* Garantias */}
                <Animated.View entering={FadeInDown.delay(450).duration(400)} style={styles.guarantees}>
                    {[
                        { icon: '🔒', txt: 'Pagamento seguro' },
                        { icon: '↩️', txt: 'Cancele quando quiser' },
                        { icon: '⚡', txt: 'Ativação instantânea' },
                    ].map((g, i) => (
                        <View key={i} style={styles.guaranteeItem}>
                            <Text style={styles.guaranteeEmoji}>{g.icon}</Text>
                            <Text style={styles.guaranteeTxt}>{g.txt}</Text>
                        </View>
                    ))}
                </Animated.View>

                <View style={{ height: 80 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root:           { flex: 1, backgroundColor: '#0d0d10' },
    scroll:         { paddingBottom: 20 },
    header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
    backBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e1a2e', alignItems: 'center', justifyContent: 'center' },
    headerTitle:    { color: '#fff', fontSize: 18, fontWeight: '900' },
    hero:           { marginHorizontal: 20, marginBottom: 24, borderRadius: 28, padding: 32, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#3d1a6e' },
    heroEmoji:      { fontSize: 48, marginBottom: 8 },
    heroTitle:      { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    heroSub:        { color: '#9587b8', fontSize: 14, fontWeight: '600', marginTop: 4, textAlign: 'center' },
    priceBadge:     { flexDirection: 'row', alignItems: 'flex-end', marginTop: 20, backgroundColor: '#ffffff15', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: '#8b5cf640' },
    priceValue:     { color: '#fff', fontSize: 32, fontWeight: '900' },
    pricePer:       { color: '#9587b8', fontSize: 14, fontWeight: '700', marginBottom: 4 },
    cardsRow:       { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },
    planCard:       { flex: 1, borderRadius: 24, padding: 16, gap: 8, borderWidth: 1.5, overflow: 'hidden', position: 'relative' },
    starterCard:    { backgroundColor: '#16151d', borderColor: '#2a2040' },
    proCard:        { borderColor: '#8b5cf6' },
    planCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    planCardTitle:  { color: '#9587b8', fontSize: 16, fontWeight: '900' },
    planCardPrice:  { color: '#6b6880', fontSize: 20, fontWeight: '900', marginBottom: 4 },
    planCardDivider:{ height: 1, backgroundColor: '#2a2040', marginVertical: 6 },
    featureRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    featureCheck:   { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
    featureCheckOn: { backgroundColor: '#10b98120', borderWidth: 1, borderColor: '#10b98140' },
    featureCheckOff:{ backgroundColor: '#1e1a2e', borderWidth: 1, borderColor: '#2a2040' },
    featureCheckPro:{ backgroundColor: '#8b5cf620', borderWidth: 1, borderColor: '#8b5cf640' },
    featureLbl:     { color: '#9587b8', fontSize: 11, fontWeight: '600', flex: 1, lineHeight: 16 },
    featureLblOff:  { color: '#3a3a4a' },
    popularBadge:   { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f59e0b20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#f59e0b50' },
    popularTxt:     { color: '#f59e0b', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    currentBadge:   { marginTop: 8, paddingVertical: 6, borderRadius: 12, backgroundColor: '#10b98115', borderWidth: 1, borderColor: '#10b98130', alignItems: 'center' },
    currentBadgeTxt:{ color: '#10b981', fontSize: 12, fontWeight: '800' },
    upgradeBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 18, overflow: 'hidden', borderBottomWidth: 4, borderBottomColor: '#5b21b6' },
    upgradeBtnTxt:  { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },
    downgradeBtn:   { alignItems: 'center', paddingVertical: 16 },
    downgradeBtnTxt:{ color: '#4a4860', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
    guarantees:     { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginTop: 24 },
    guaranteeItem:  { alignItems: 'center', gap: 6 },
    guaranteeEmoji: { fontSize: 22 },
    guaranteeTxt:   { color: '#4a4860', fontSize: 11, fontWeight: '600', textAlign: 'center' },
});
