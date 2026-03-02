// src/screens/ProfileScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    ScrollView,
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
    TextInput,
    Modal,
    Pressable,
    Alert,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LogOut, Edit2, Link, Image as ImageIcon, Flame, BookOpen, Plus, X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { signOutUser } from '../services/authService';

const PROFILE_KEY = 'DEVTRACK_PROFILE';
const STREAK_KEY = 'DEVTRACK_STREAK';
const LEARNINGS_KEY = 'DEVTRACK_LEARNINGS';

interface SocialLink { id: string; label: string; url: string; }
interface ProjectImage { id: string; uri: string; title: string; }
interface LocalProfile {
    bio: string;
    avatarUri: string | null;
    bannerColor: string;
    links: SocialLink[];
    projects: ProjectImage[];
}

const DEFAULT_LOCAL: LocalProfile = {
    bio: '',
    avatarUri: null,
    bannerColor: '#1a1040',
    links: [],
    projects: [],
};

const BANNER_COLORS = ['#0d0b18','#1a1040','#13102a','#1e0a3a','#0a0818','#160e30','#22104a','#0d0d10'];

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ visible, profile, onSave, onClose }: {
    visible: boolean; profile: LocalProfile;
    onSave: (p: LocalProfile) => void; onClose: () => void;
}) {
    const [draft, setDraft] = useState<LocalProfile>(profile);
    const [newLabel, setNewLabel] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [tab, setTab] = useState<'bio' | 'links' | 'banner'>('bio');

    useEffect(() => { setDraft(profile); }, [profile, visible]);

    const pickAvatar = async () => {
        const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 0.8 });
        if (!r.canceled) setDraft(d => ({ ...d, avatarUri: r.assets[0].uri }));
    };

    const addLink = () => {
        if (!newLabel.trim() || !newUrl.trim()) return;
        const link: SocialLink = { id: Date.now().toString(), label: newLabel.trim(), url: newUrl.trim().startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}` };
        setDraft(d => ({ ...d, links: [...d.links, link] }));
        setNewLabel(''); setNewUrl('');
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={editStyles.container} edges={['top','left','right']}>
                <View style={editStyles.header}>
                    <TouchableOpacity onPress={onClose}><Text style={editStyles.cancel}>Cancelar</Text></TouchableOpacity>
                    <Text style={editStyles.title}>Editar Perfil</Text>
                    <TouchableOpacity onPress={() => onSave(draft)}><Text style={editStyles.save}>Salvar</Text></TouchableOpacity>
                </View>
                <View style={editStyles.tabs}>
                    {(['bio','links','banner'] as const).map(t => (
                        <TouchableOpacity key={t} style={[editStyles.tab, tab===t && editStyles.tabActive]} onPress={() => setTab(t)}>
                            <Text style={[editStyles.tabText, tab===t && editStyles.tabTextActive]}>
                                {t==='bio' ? 'Perfil' : t==='links' ? 'Links' : 'Visual'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <ScrollView contentContainerStyle={editStyles.body}>
                    {tab === 'bio' && (
                        <>
                            <TouchableOpacity style={editStyles.avatarPicker} onPress={pickAvatar}>
                                {draft.avatarUri
                                    ? <Image source={{ uri: draft.avatarUri }} style={editStyles.avatarPreview} />
                                    : <View style={editStyles.avatarPlaceholder}>
                                        <ImageIcon size={24} color="#7a7590" strokeWidth={1.5} />
                                        <Text style={editStyles.avatarPlaceholderLabel}>Foto de perfil</Text>
                                      </View>
                                }
                            </TouchableOpacity>
                            <Text style={editStyles.label}>Bio</Text>
                            <TextInput style={[editStyles.input, { minHeight: 90, textAlignVertical: 'top' }]} value={draft.bio} onChangeText={v => setDraft(d => ({...d, bio: v}))} placeholder="Fale sobre você..." placeholderTextColor="#444" multiline />
                        </>
                    )}
                    {tab === 'links' && (
                        <>
                            <Text style={editStyles.label}>Label</Text>
                            <TextInput style={editStyles.input} value={newLabel} onChangeText={setNewLabel} placeholder="GitHub" placeholderTextColor="#444" />
                            <Text style={editStyles.label}>URL</Text>
                            <TextInput style={editStyles.input} value={newUrl} onChangeText={setNewUrl} placeholder="github.com/user" placeholderTextColor="#444" autoCapitalize="none" keyboardType="url" />
                            <TouchableOpacity style={editStyles.addBtn} onPress={addLink}>
                                <Plus size={16} color="#fff" strokeWidth={2.5} />
                                <Text style={editStyles.addBtnText}>Adicionar link</Text>
                            </TouchableOpacity>
                            {draft.links.map(link => (
                                <View key={link.id} style={editStyles.linkItem}>
                                    <Text style={editStyles.linkLabel}>{link.label}</Text>
                                    <Text style={editStyles.linkUrl} numberOfLines={1}>{link.url}</Text>
                                    <TouchableOpacity onPress={() => setDraft(d => ({...d, links: d.links.filter(l => l.id !== link.id)}))}>
                                        <X size={16} color="#e05c7a" strokeWidth={2} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </>
                    )}
                    {tab === 'banner' && (
                        <>
                            <Text style={editStyles.label}>Cor do banner</Text>
                            <View style={editStyles.colorGrid}>
                                {BANNER_COLORS.map(c => (
                                    <TouchableOpacity key={c} style={[editStyles.colorSwatch, { backgroundColor: c }, draft.bannerColor===c && editStyles.colorSwatchSelected]} onPress={() => setDraft(d => ({...d, bannerColor: c}))} />
                                ))}
                            </View>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
    const { user } = useAuth();
    const [local, setLocal] = useState<LocalProfile>(DEFAULT_LOCAL);
    const [streak, setStreak] = useState(0);
    const [learningsCount, setLearningsCount] = useState(0);
    const [editVisible, setEditVisible] = useState(false);

    const displayName = user?.displayName ?? 'Dev';
    const email = user?.email ?? '';
    const initials = displayName.split(' ').slice(0,2).map((n: string) => n[0]).join('').toUpperCase();

    const loadData = useCallback(async () => {
        const [profRaw, streakRaw, learnRaw] = await Promise.all([
            AsyncStorage.getItem(PROFILE_KEY),
            AsyncStorage.getItem(STREAK_KEY),
            AsyncStorage.getItem(LEARNINGS_KEY),
        ]);
        if (profRaw) setLocal(JSON.parse(profRaw));
        if (streakRaw) setStreak(JSON.parse(streakRaw).count ?? 0);
        if (learnRaw) setLearningsCount(JSON.parse(learnRaw).length);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const saveLocal = async (p: LocalProfile) => {
        setLocal(p);
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
        setEditVisible(false);
    };

    const handleLogout = () => {
        Alert.alert('Sair', 'Deseja encerrar a sessão?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sair', style: 'destructive', onPress: signOutUser },
        ]);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top','left','right']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Banner */}
                <Animated.View entering={FadeInUp.duration(400)}>
                    <View style={[styles.banner, { backgroundColor: local.bannerColor }]}>
                        <View style={styles.bannerPattern}>
                            {[...Array(16)].map((_,i) => <View key={i} style={styles.bannerDot} />)}
                        </View>
                    </View>
                </Animated.View>

                {/* Avatar row */}
                <View style={styles.avatarRow}>
                    <View style={styles.avatarWrap}>
                        {local.avatarUri
                            ? <Image source={{ uri: local.avatarUri }} style={styles.avatar} />
                            : <View style={styles.avatarFallback}>
                                <Text style={styles.avatarInitials}>{initials}</Text>
                              </View>
                        }
                        <View style={styles.streakBadge}>
                            <Flame size={10} color="#fff" strokeWidth={2} />
                            <Text style={styles.streakBadgeText}>{streak}</Text>
                        </View>
                    </View>
                    <View style={styles.avatarActions}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => setEditVisible(true)}>
                            <Edit2 size={16} color="#fff" strokeWidth={2} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDanger]} onPress={handleLogout}>
                            <LogOut size={16} color="#e05c7a" strokeWidth={2} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Identity */}
                <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.identity}>
                    <Text style={styles.name}>{displayName}</Text>
                    <Text style={styles.email}>{email}</Text>
                    {local.bio ? <Text style={styles.bio}>{local.bio}</Text> : null}
                </Animated.View>

                {/* Stats */}
                <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{streak}</Text>
                        <Text style={styles.statLabel}>Streak</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{learningsCount}</Text>
                        <Text style={styles.statLabel}>Registros</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{local.links.length}</Text>
                        <Text style={styles.statLabel}>Links</Text>
                    </View>
                </Animated.View>

                {/* Links */}
                {local.links.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Link size={15} color="#8b5cf6" strokeWidth={2} />
                            <Text style={styles.sectionTitle}>Links</Text>
                        </View>
                        <View style={styles.linksWrap}>
                            {local.links.map(link => (
                                <TouchableOpacity key={link.id} style={styles.linkChip} onPress={() => Linking.openURL(link.url)}>
                                    <Text style={styles.linkChipText}>{link.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>
                )}

                {/* Streak detail */}
                <Animated.View entering={FadeInDown.delay(250).duration(500)} style={[styles.section, { marginBottom: 40 }]}>
                    <View style={styles.sectionHeader}>
                        <Flame size={15} color="#8b5cf6" strokeWidth={2} />
                        <Text style={styles.sectionTitle}>Sequência de estudos</Text>
                    </View>
                    <View style={styles.streakCard}>
                        <View style={styles.streakCircle}>
                            <Text style={styles.streakNum}>{streak}</Text>
                            <Text style={styles.streakUnit}>dias</Text>
                        </View>
                        <View style={styles.streakRight}>
                            <Text style={styles.streakStatus}>
                                {streak === 0 ? 'Nenhuma sequência ativa' : streak < 7 ? 'Sequência iniciando' : streak < 30 ? 'Ritmo consistente' : 'Sequência lendária'}
                            </Text>
                            <View style={styles.streakDots}>
                                {[...Array(7)].map((_,i) => (
                                    <View key={i} style={[styles.dot, i < Math.min(streak,7) && styles.dotActive]} />
                                ))}
                            </View>
                            <Text style={styles.streakHint}>
                                {streak > 0 ? `${streak} dias consecutivos` : 'Registre um aprendizado para começar'}
                            </Text>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>

            <EditModal visible={editVisible} profile={local} onSave={saveLocal} onClose={() => setEditVisible(false)} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d0d10' },
    banner: { width: '100%', height: 120 },
    bannerPattern: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 16, opacity: 0.2 },
    bannerDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff' },
    avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: -40, marginBottom: 12 },
    avatarWrap: { position: 'relative' },
    avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#0d0d10' },
    avatarFallback: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#8b5cf6', borderWidth: 3, borderColor: '#0d0d10', alignItems: 'center', justifyContent: 'center' },
    avatarInitials: { color: '#fff', fontSize: 26, fontWeight: '800' },
    streakBadge: { position: 'absolute', bottom: 0, right: -4, backgroundColor: '#1a1826', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 2, borderColor: '#0d0d10', flexDirection: 'row', alignItems: 'center', gap: 3 },
    streakBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
    avatarActions: { flexDirection: 'row', gap: 8 },
    iconBtn: { backgroundColor: '#1a1826', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#2a2040' },
    iconBtnDanger: { borderColor: '#3a1a24' },
    identity: { paddingHorizontal: 16, marginBottom: 16 },
    name: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
    email: { color: '#6b6880', fontSize: 13, marginTop: 2 },
    bio: { color: '#9aa0aa', fontSize: 14, marginTop: 8, lineHeight: 20 },
    statsRow: { flexDirection: 'row', backgroundColor: '#16151d', marginHorizontal: 16, borderRadius: 18, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#2a2040' },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
    statLabel: { color: '#6b6880', fontSize: 11, marginTop: 3, fontWeight: '500' },
    statDivider: { width: 1, backgroundColor: '#2a2040' },
    section: { paddingHorizontal: 16, marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
    linksWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    linkChip: { backgroundColor: '#16151d', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#2a2040' },
    linkChipText: { color: '#d4d0e8', fontSize: 13, fontWeight: '600' },
    streakCard: { backgroundColor: '#16151d', borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#2a2040' },
    streakCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center', marginRight: 16, shadowColor: '#8b5cf6', shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
    streakNum: { color: '#fff', fontSize: 24, fontWeight: '900', lineHeight: 26 },
    streakUnit: { color: '#fff', fontSize: 11, opacity: 0.85, fontWeight: '600' },
    streakRight: { flex: 1 },
    streakStatus: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 10 },
    streakDots: { flexDirection: 'row', gap: 5, marginBottom: 8 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2a2040' },
    dotActive: { backgroundColor: '#8b5cf6' },
    streakHint: { color: '#6b6880', fontSize: 12 },
});

const editStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d0d10' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a2040' },
    cancel: { color: '#7a7590', fontSize: 15 },
    title: { color: '#fff', fontSize: 17, fontWeight: '700' },
    save: { color: '#8b5cf6', fontSize: 15, fontWeight: '700' },
    tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#2a2040' },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: '#8b5cf6' },
    tabText: { color: '#7a7590', fontSize: 14, fontWeight: '600' },
    tabTextActive: { color: '#8b5cf6' },
    body: { padding: 16, paddingBottom: 40 },
    label: { color: '#7a7590', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { backgroundColor: '#1a1826', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#2a2040' },
    avatarPicker: { alignSelf: 'center', marginBottom: 8 },
    avatarPreview: { width: 90, height: 90, borderRadius: 45 },
    avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#1a1826', borderWidth: 2, borderColor: '#2a2040', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
    avatarPlaceholderLabel: { color: '#7a7590', fontSize: 10 },
    addBtn: { backgroundColor: '#8b5cf6', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    linkItem: { backgroundColor: '#1a1826', borderRadius: 12, padding: 14, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
    linkLabel: { color: '#fff', fontWeight: '600', fontSize: 14 },
    linkUrl: { color: '#7a7590', fontSize: 12, flex: 1 },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
    colorSwatch: { width: 44, height: 44, borderRadius: 12 },
    colorSwatchSelected: { borderWidth: 3, borderColor: '#8b5cf6' },
});