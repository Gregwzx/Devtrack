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
import Animated, {
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

// ─── Keys ─────────────────────────────────────────────────────────────────────
const PROFILE_KEY = 'DEVTRACK_PROFILE';
const STREAK_KEY = 'DEVTRACK_STREAK';
const LEARNINGS_KEY = 'DEVTRACK_LEARNINGS';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SocialLink {
    id: string;
    label: string;
    url: string;
    icon: string;
}

interface ProjectImage {
    id: string;
    uri: string;
    title: string;
}

interface Profile {
    name: string;
    username: string;
    bio: string;
    avatarUri: string | null;
    bannerUri: string | null;
    bannerColor: string;
    links: SocialLink[];
    projects: ProjectImage[];
}

const DEFAULT_PROFILE: Profile = {
    name: 'Dev Anônimo',
    username: '@devuser',
    bio: 'Desenvolvedor apaixonado por tecnologia 🚀',
    avatarUri: null,
    bannerUri: null,
    bannerColor: '#1a1040',
    links: [],
    projects: [],
};

const BANNER_COLORS = [
    '#0d0b18', '#1a1040', '#13102a', '#1e0a3a',
    '#0a0818', '#160e30', '#22104a', '#0d0d10',
];

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({
    visible,
    profile,
    onSave,
    onClose,
}: {
    visible: boolean;
    profile: Profile;
    onSave: (p: Profile) => void;
    onClose: () => void;
}) {
    const [draft, setDraft] = useState<Profile>(profile);
    const [newLinkLabel, setNewLinkLabel] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [tab, setTab] = useState<'info' | 'links' | 'banner'>('info');

    useEffect(() => {
        setDraft(profile);
    }, [profile, visible]);

    const pickAvatar = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) {
            setDraft((d) => ({ ...d, avatarUri: result.assets[0].uri }));
        }
    };

    const pickBanner = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 6],
            quality: 0.8,
        });
        if (!result.canceled) {
            setDraft((d) => ({ ...d, bannerUri: result.assets[0].uri }));
        }
    };

    const addLink = () => {
        if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
        const link: SocialLink = {
            id: Date.now().toString(),
            label: newLinkLabel.trim(),
            url: newLinkUrl.trim().startsWith('http')
                ? newLinkUrl.trim()
                : `https://${newLinkUrl.trim()}`,
            icon: '🔗',
        };
        setDraft((d) => ({ ...d, links: [...d.links, link] }));
        setNewLinkLabel('');
        setNewLinkUrl('');
    };

    const removeLink = (id: string) => {
        setDraft((d) => ({ ...d, links: d.links.filter((l) => l.id !== id) }));
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={editStyles.container} edges={['top', 'left', 'right']}>
                <View style={editStyles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={editStyles.cancel}>Cancelar</Text>
                    </TouchableOpacity>
                    <Text style={editStyles.title}>Editar Perfil</Text>
                    <TouchableOpacity onPress={() => onSave(draft)}>
                        <Text style={editStyles.save}>Salvar</Text>
                    </TouchableOpacity>
                </View>

                <View style={editStyles.tabs}>
                    {(['info', 'links', 'banner'] as const).map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[editStyles.tab, tab === t && editStyles.tabActive]}
                            onPress={() => setTab(t)}
                        >
                            <Text style={[editStyles.tabText, tab === t && editStyles.tabTextActive]}>
                                {t === 'info' ? 'Perfil' : t === 'links' ? 'Links' : 'Visual'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView contentContainerStyle={editStyles.body}>
                    {tab === 'info' && (
                        <>
                            <TouchableOpacity style={editStyles.avatarPicker} onPress={pickAvatar}>
                                {draft.avatarUri ? (
                                    <Image source={{ uri: draft.avatarUri }} style={editStyles.avatarPreview} />
                                ) : (
                                    <View style={editStyles.avatarPlaceholder}>
                                        <Text style={editStyles.avatarPlaceholderText}>📷</Text>
                                        <Text style={editStyles.avatarPlaceholderLabel}>Foto de perfil</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <Text style={editStyles.label}>Nome</Text>
                            <TextInput
                                style={editStyles.input}
                                value={draft.name}
                                onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))}
                                placeholder="Seu nome"
                                placeholderTextColor="#444"
                            />

                            <Text style={editStyles.label}>Username</Text>
                            <TextInput
                                style={editStyles.input}
                                value={draft.username}
                                onChangeText={(v) => setDraft((d) => ({ ...d, username: v }))}
                                placeholder="@username"
                                placeholderTextColor="#444"
                                autoCapitalize="none"
                            />

                            <Text style={editStyles.label}>Bio</Text>
                            <TextInput
                                style={[editStyles.input, { minHeight: 90, textAlignVertical: 'top' }]}
                                value={draft.bio}
                                onChangeText={(v) => setDraft((d) => ({ ...d, bio: v }))}
                                placeholder="Fale sobre você..."
                                placeholderTextColor="#444"
                                multiline
                            />
                        </>
                    )}

                    {tab === 'links' && (
                        <>
                            <Text style={editStyles.label}>Adicionar link</Text>
                            <TextInput
                                style={editStyles.input}
                                value={newLinkLabel}
                                onChangeText={setNewLinkLabel}
                                placeholder="Label (ex: GitHub)"
                                placeholderTextColor="#444"
                            />
                            <TextInput
                                style={editStyles.input}
                                value={newLinkUrl}
                                onChangeText={setNewLinkUrl}
                                placeholder="URL (ex: github.com/user)"
                                placeholderTextColor="#444"
                                autoCapitalize="none"
                                keyboardType="url"
                            />
                            <TouchableOpacity style={editStyles.addLinkBtn} onPress={addLink}>
                                <Text style={editStyles.addLinkBtnText}>+ Adicionar link</Text>
                            </TouchableOpacity>

                            {draft.links.map((link) => (
                                <View key={link.id} style={editStyles.linkItem}>
                                    <Text style={editStyles.linkItemLabel}>🔗 {link.label}</Text>
                                    <Text style={editStyles.linkItemUrl} numberOfLines={1}>
                                        {link.url}
                                    </Text>
                                    <TouchableOpacity onPress={() => removeLink(link.id)}>
                                        <Text style={editStyles.linkRemove}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </>
                    )}

                    {tab === 'banner' && (
                        <>
                            <TouchableOpacity style={editStyles.bannerPicker} onPress={pickBanner}>
                                {draft.bannerUri ? (
                                    <Image source={{ uri: draft.bannerUri }} style={editStyles.bannerPreview} />
                                ) : (
                                    <View style={[editStyles.bannerPlaceholder, { backgroundColor: draft.bannerColor }]}>
                                        <Text style={editStyles.bannerPlaceholderText}>📷 Escolher imagem de capa</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {draft.bannerUri && (
                                <TouchableOpacity
                                    style={editStyles.removeBannerBtn}
                                    onPress={() => setDraft((d) => ({ ...d, bannerUri: null }))}
                                >
                                    <Text style={editStyles.removeBannerText}>Remover imagem</Text>
                                </TouchableOpacity>
                            )}

                            <Text style={[editStyles.label, { marginTop: 16 }]}>Cor de fundo do banner</Text>
                            <View style={editStyles.colorGrid}>
                                {BANNER_COLORS.map((c) => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[
                                            editStyles.colorSwatch,
                                            { backgroundColor: c },
                                            draft.bannerColor === c && editStyles.colorSwatchSelected,
                                        ]}
                                        onPress={() => setDraft((d) => ({ ...d, bannerColor: c }))}
                                    />
                                ))}
                            </View>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

// ─── Add Project Modal ────────────────────────────────────────────────────────
function AddProjectModal({
    visible,
    onAdd,
    onClose,
}: {
    visible: boolean;
    onAdd: (p: ProjectImage) => void;
    onClose: () => void;
}) {
    const [uri, setUri] = useState<string | null>(null);
    const [title, setTitle] = useState('');

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.85,
        });
        if (!result.canceled) setUri(result.assets[0].uri);
    };

    const handleAdd = () => {
        if (!uri) return;
        onAdd({ id: Date.now().toString(), uri, title: title.trim() || 'Projeto' });
        setUri(null);
        setTitle('');
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <Pressable style={editStyles.overlay} onPress={onClose}>
                <Pressable style={editStyles.projectModal} onPress={() => {}}>
                    <Text style={editStyles.title}>Adicionar imagem</Text>

                    <TouchableOpacity style={editStyles.imagePick} onPress={pickImage}>
                        {uri ? (
                            <Image source={{ uri }} style={editStyles.imagePickPreview} />
                        ) : (
                            <Text style={editStyles.imagePickText}>📁 Escolher imagem</Text>
                        )}
                    </TouchableOpacity>

                    <TextInput
                        style={[editStyles.input, { marginTop: 12 }]}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Título (ex: App DevTrack)"
                        placeholderTextColor="#444"
                    />

                    <TouchableOpacity
                        style={[editStyles.addLinkBtn, { marginTop: 12, opacity: uri ? 1 : 0.4 }]}
                        onPress={handleAdd}
                        disabled={!uri}
                    >
                        <Text style={editStyles.addLinkBtnText}>Adicionar</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

// ─── Main ProfileScreen ───────────────────────────────────────────────────────
export default function ProfileScreen() {
    const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
    const [streak, setStreak] = useState(0);
    const [learningsCount, setLearningsCount] = useState(0);
    const [editVisible, setEditVisible] = useState(false);
    const [addProjectVisible, setAddProjectVisible] = useState(false);

    const loadData = useCallback(async () => {
        const [profRaw, streakRaw, learnRaw] = await Promise.all([
            AsyncStorage.getItem(PROFILE_KEY),
            AsyncStorage.getItem(STREAK_KEY),
            AsyncStorage.getItem(LEARNINGS_KEY),
        ]);

        if (profRaw) setProfile(JSON.parse(profRaw));
        if (streakRaw) setStreak(JSON.parse(streakRaw).count ?? 0);
        if (learnRaw) setLearningsCount(JSON.parse(learnRaw).length);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const saveProfile = async (p: Profile) => {
        setProfile(p);
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
        setEditVisible(false);
    };

    const addProject = async (proj: ProjectImage) => {
        const updated = { ...profile, projects: [...profile.projects, proj] };
        await saveProfile(updated);
    };

    const removeProject = (id: string) => {
        Alert.alert('Remover', 'Deseja remover esta imagem?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Remover',
                style: 'destructive',
                onPress: async () => {
                    const updated = { ...profile, projects: profile.projects.filter((p) => p.id !== id) };
                    await saveProfile(updated);
                },
            },
        ]);
    };

    const avatarInitials = profile.name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* ── Banner ── */}
                <Animated.View entering={FadeInUp.duration(400)}>
                    {profile.bannerUri ? (
                        <Image source={{ uri: profile.bannerUri }} style={styles.banner} />
                    ) : (
                        <View style={[styles.banner, { backgroundColor: profile.bannerColor }]}>
                            <View style={styles.bannerPattern}>
                                {[...Array(12)].map((_, i) => (
                                    <View key={i} style={styles.bannerPatternDot} />
                                ))}
                            </View>
                        </View>
                    )}
                </Animated.View>

                {/* ── Avatar + Edit Button ── */}
                <View style={styles.avatarRow}>
                    <View style={styles.avatarContainer}>
                        {profile.avatarUri ? (
                            <Image source={{ uri: profile.avatarUri }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarFallback}>
                                <Text style={styles.avatarInitials}>{avatarInitials}</Text>
                            </View>
                        )}

                        <View style={styles.streakBadge}>
                            <Text style={styles.streakBadgeText}>🔥 {streak}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setEditVisible(true)}
                    >
                        <Text style={styles.editButtonText}>✏️ Editar</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Identity ── */}
                <Animated.View
                    entering={FadeInDown.delay(100).duration(500)}
                    style={styles.identity}
                >
                    <Text style={styles.name}>{profile.name}</Text>
                    <Text style={styles.username}>{profile.username}</Text>
                    {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
                </Animated.View>

                {/* ── Mini Stats ── */}
                <Animated.View
                    entering={FadeInDown.delay(150).duration(500)}
                    style={styles.miniStats}
                >
                    <View style={styles.miniStat}>
                        <Text style={styles.miniStatValue}>{streak}</Text>
                        <Text style={styles.miniStatLabel}>Streak</Text>
                    </View>
                    <View style={styles.miniStatDivider} />
                    <View style={styles.miniStat}>
                        <Text style={styles.miniStatValue}>{learningsCount}</Text>
                        <Text style={styles.miniStatLabel}>Registros</Text>
                    </View>
                    <View style={styles.miniStatDivider} />
                    <View style={styles.miniStat}>
                        <Text style={styles.miniStatValue}>{profile.links.length}</Text>
                        <Text style={styles.miniStatLabel}>Links</Text>
                    </View>
                    <View style={styles.miniStatDivider} />
                    <View style={styles.miniStat}>
                        <Text style={styles.miniStatValue}>{profile.projects.length}</Text>
                        <Text style={styles.miniStatLabel}>Projetos</Text>
                    </View>
                </Animated.View>

                {/* ── Links ── */}
                {profile.links.length > 0 && (
                    <Animated.View
                        entering={FadeInDown.delay(200).duration(500)}
                        style={styles.section}
                    >
                        <Text style={styles.sectionTitle}>🔗 Links</Text>
                        <View style={styles.linksGrid}>
                            {profile.links.map((link) => (
                                <TouchableOpacity
                                    key={link.id}
                                    style={styles.linkChip}
                                    onPress={() => Linking.openURL(link.url)}
                                >
                                    <Text style={styles.linkChipText}>{link.icon} {link.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>
                )}

                {/* ── Projects / Images ── */}
                <Animated.View
                    entering={FadeInDown.delay(250).duration(500)}
                    style={styles.section}
                >
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>🖼️ Projetos & Estudos</Text>
                        <TouchableOpacity
                            style={styles.addProjectBtn}
                            onPress={() => setAddProjectVisible(true)}
                        >
                            <Text style={styles.addProjectBtnText}>+ Adicionar</Text>
                        </TouchableOpacity>
                    </View>

                    {profile.projects.length === 0 ? (
                        <TouchableOpacity
                            style={styles.emptyProjects}
                            onPress={() => setAddProjectVisible(true)}
                        >
                            <Text style={styles.emptyProjectsIcon}>📁</Text>
                            <Text style={styles.emptyProjectsText}>
                                Adicione imagens de projetos e estudos recentes
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.projectsGrid}>
                            {profile.projects.map((proj) => (
                                <TouchableOpacity
                                    key={proj.id}
                                    style={styles.projectCard}
                                    onLongPress={() => removeProject(proj.id)}
                                >
                                    <Image source={{ uri: proj.uri }} style={styles.projectImage} />
                                    {proj.title ? (
                                        <View style={styles.projectLabel}>
                                            <Text style={styles.projectLabelText} numberOfLines={1}>
                                                {proj.title}
                                            </Text>
                                        </View>
                                    ) : null}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </Animated.View>

                {/* ── Streak detail ── */}
                <Animated.View
                    entering={FadeInDown.delay(300).duration(500)}
                    style={[styles.section, { marginBottom: 40 }]}
                >
                    <Text style={styles.sectionTitle}>🔥 Sequência de estudos</Text>
                    <View style={styles.streakCard}>
                        <View style={styles.streakCircle}>
                            <Text style={styles.streakNumber}>{streak}</Text>
                            <Text style={styles.streakUnit}>dias</Text>
                        </View>
                        <View style={styles.streakRight}>
                            <Text style={styles.streakStatus}>
                                {streak === 0
                                    ? 'Nenhuma sequência ativa'
                                    : streak < 7
                                        ? 'Sequência iniciando 🌱'
                                        : streak < 30
                                            ? 'Você está pegando ritmo! 🚀'
                                            : 'Sequência lendária! 🏆'}
                            </Text>
                            <View style={styles.streakDotsRow}>
                                {[...Array(7)].map((_, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.streakDot,
                                            i < Math.min(streak, 7) && styles.streakDotOn,
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={styles.streakHint}>
                                {streak > 0 ? `${streak} dias consecutivos de estudo` : 'Registre um aprendizado para começar'}
                            </Text>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>

            <EditProfileModal
                visible={editVisible}
                profile={profile}
                onSave={saveProfile}
                onClose={() => setEditVisible(false)}
            />
            <AddProjectModal
                visible={addProjectVisible}
                onAdd={addProject}
                onClose={() => setAddProjectVisible(false)}
            />
        </SafeAreaView>
    );
}

// ─── Profile Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d0d10' },
    banner: { width: '100%', height: 130 },
    bannerPattern: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 20,
        gap: 18,
        opacity: 0.3,
    },
    bannerPatternDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ffffff',
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginTop: -44,
        marginBottom: 12,
    },
    avatarContainer: { position: 'relative' },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        borderWidth: 4,
        borderColor: '#0d0d10',
    },
    avatarFallback: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#8b5cf6',
        borderWidth: 4,
        borderColor: '#0d0d10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitials: { color: '#fff', fontSize: 28, fontWeight: '800' },
    streakBadge: {
        position: 'absolute',
        bottom: 0,
        right: -4,
        backgroundColor: '#1a1826',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderWidth: 2,
        borderColor: '#0d0d10',
    },
    streakBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
    editButton: {
        backgroundColor: '#1a1826',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#2a2040',
    },
    editButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    identity: { paddingHorizontal: 16, marginBottom: 16 },
    name: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    username: { color: '#6b6880', fontSize: 14, marginTop: 2 },
    bio: { color: '#9aa0aa', fontSize: 14, marginTop: 8, lineHeight: 20 },

    miniStats: {
        flexDirection: 'row',
        backgroundColor: '#16151d',
        marginHorizontal: 16,
        borderRadius: 18,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#2a2040',
    },
    miniStat: { flex: 1, alignItems: 'center' },
    miniStatValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
    miniStatLabel: { color: '#6b6880', fontSize: 11, marginTop: 3, fontWeight: '500' },
    miniStatDivider: { width: 1, backgroundColor: '#2a2040' },

    section: { paddingHorizontal: 16, marginBottom: 24 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12, letterSpacing: -0.3 },

    linksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    linkChip: {
        backgroundColor: '#16151d',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#2a2040',
    },
    linkChipText: { color: '#d4d0e8', fontSize: 13, fontWeight: '600' },

    addProjectBtn: {
        backgroundColor: '#2a2040',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    addProjectBtnText: { color: '#8b5cf6', fontSize: 12, fontWeight: '700' },

    projectsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    projectCard: {
        width: '47%',
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#16151d',
        borderWidth: 1,
        borderColor: '#2a2040',
    },
    projectImage: { width: '100%', height: 120 },
    projectLabel: { padding: 8, backgroundColor: '#16151d' },
    projectLabelText: { color: '#d4d0e8', fontSize: 12, fontWeight: '600' },

    emptyProjects: {
        backgroundColor: '#16151d',
        borderRadius: 18,
        padding: 32,
        borderWidth: 1,
        borderColor: '#2a2040',
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    emptyProjectsIcon: { fontSize: 32, marginBottom: 10 },
    emptyProjectsText: { color: '#6b6880', fontSize: 13, textAlign: 'center', lineHeight: 20 },

    streakCard: {
        backgroundColor: '#16151d',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2a2040',
    },
    streakCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: '#8b5cf6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#8b5cf6',
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    streakNumber: { color: '#fff', fontSize: 26, fontWeight: '900', lineHeight: 28 },
    streakUnit: { color: '#fff', fontSize: 11, opacity: 0.85, fontWeight: '600' },
    streakRight: { flex: 1 },
    streakStatus: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 10 },
    streakDotsRow: { flexDirection: 'row', gap: 5, marginBottom: 8 },
    streakDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2a2040' },
    streakDotOn: { backgroundColor: '#8b5cf6' },
    streakHint: { color: '#6b6880', fontSize: 12 },
});

// ─── Edit Modal Styles ────────────────────────────────────────────────────────
const editStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d0d10' },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(8,7,14,0.85)',
        justifyContent: 'flex-end',
    },
    projectModal: {
        backgroundColor: '#16151d',
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        padding: 24,
        borderWidth: 1,
        borderColor: '#2a2040',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2040',
    },
    cancel: { color: '#7a7590', fontSize: 15 },
    title: { color: '#fff', fontSize: 17, fontWeight: '700' },
    save: { color: '#8b5cf6', fontSize: 15, fontWeight: '700' },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#2a2040',
    },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: '#8b5cf6' },
    tabText: { color: '#7a7590', fontSize: 14, fontWeight: '600' },
    tabTextActive: { color: '#8b5cf6' },
    body: { padding: 16, paddingBottom: 40 },
    label: { color: '#7a7590', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        backgroundColor: '#1a1826',
        borderRadius: 12,
        padding: 14,
        color: '#fff',
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#2a2040',
    },
    avatarPicker: { alignSelf: 'center', marginBottom: 8 },
    avatarPreview: { width: 90, height: 90, borderRadius: 45 },
    avatarPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#1a1826',
        borderWidth: 2,
        borderColor: '#2a2040',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarPlaceholderText: { fontSize: 24 },
    avatarPlaceholderLabel: { color: '#7a7590', fontSize: 10, marginTop: 4 },
    addLinkBtn: {
        backgroundColor: '#8b5cf6',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    addLinkBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    linkItem: {
        backgroundColor: '#1a1826',
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    linkItemLabel: { color: '#fff', fontWeight: '600', fontSize: 14 },
    linkItemUrl: { color: '#7a7590', fontSize: 12, flex: 1 },
    linkRemove: { color: '#e05c7a', fontSize: 16 },
    bannerPicker: { borderRadius: 14, overflow: 'hidden', marginBottom: 8 },
    bannerPreview: { width: '100%', height: 100 },
    bannerPlaceholder: {
        width: '100%',
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#2a2040',
        borderStyle: 'dashed',
    },
    bannerPlaceholderText: { color: '#7a7590', fontSize: 14 },
    removeBannerBtn: { alignItems: 'center', marginTop: 4 },
    removeBannerText: { color: '#e05c7a', fontSize: 13 },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
    colorSwatch: { width: 44, height: 44, borderRadius: 12 },
    colorSwatchSelected: { borderWidth: 3, borderColor: '#8b5cf6' },
    imagePick: {
        backgroundColor: '#1a1826',
        borderRadius: 14,
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#2a2040',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    imagePickText: { color: '#7a7590', fontSize: 15 },
    imagePickPreview: { width: '100%', height: '100%' },
});