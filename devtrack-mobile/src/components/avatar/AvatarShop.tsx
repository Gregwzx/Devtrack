// src/components/avatar/AvatarShop.tsx
// Loja de cosméticos — grid de itens com lock/unlock baseado em XP e conquistas
import React, { useState } from 'react';
import {
    Modal, View, Text, TouchableOpacity, StyleSheet,
    ScrollView, Dimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COSMETICS, CosmeticItem, CosmeticType } from '../../data/avatars';

const { width: SCREEN_W } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_W - 48 - 20) / 3;

interface AvatarShopProps {
    visible: boolean;
    onClose: () => void;
    xp: number;
    unlockedAchievements: string[];
    equippedItems: Record<CosmeticType, string | null>;
    onEquip: (item: CosmeticItem) => void;
    onUnequip: (type: CosmeticType) => void;
}

const TYPE_LABELS: Record<CosmeticType, string> = {
    hat: '🎩 Chapéus',
    badge: '🏅 Badges',
    background: '🖼️ Fundos',
    pose: '🧍 Poses',
    outfit: '👕 Roupas',
    accessory: '☕ Extras',
};

const TABS: CosmeticType[] = ['hat', 'badge', 'background'];

export default function AvatarShop({
    visible, onClose, xp, unlockedAchievements,
    equippedItems, onEquip, onUnequip,
}: AvatarShopProps) {
    const [activeTab, setActiveTab] = useState<CosmeticType>('hat');

    const isUnlocked = (item: CosmeticItem) => {
        if (item.xpRequired && xp < item.xpRequired) return false;
        if (item.achievementRequired && !unlockedAchievements.includes(item.achievementRequired)) return false;
        return true;
    };

    const filtered = COSMETICS.filter(c => c.type === activeTab);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.container}>

                <View style={styles.header}>
                    <Text style={styles.title}>🛒 Loja de Cosméticos</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Text style={styles.closeBtnText}>✕</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.xpBar}>
                    <Text style={styles.xpText}>⚡ {xp} XP disponível</Text>
                </View>

                {/* Tabs de categoria */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.tabActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                {TYPE_LABELS[tab]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Grid de itens */}
                <ScrollView contentContainerStyle={styles.grid}>
                    {filtered.map((item, i) => {
                        const unlocked = isUnlocked(item);
                        const equipped = equippedItems[item.type] === item.id;

                        return (
                            <Animated.View
                                key={item.id}
                                entering={FadeInDown.delay(i * 60).duration(300)}
                            >
                                <TouchableOpacity
                                    style={[
                                        styles.item,
                                        !unlocked && styles.itemLocked,
                                        equipped && { borderColor: item.color, backgroundColor: item.color + '15' },
                                    ]}
                                    onPress={() => {
                                        if (!unlocked) return;
                                        if (equipped) onUnequip(item.type);
                                        else onEquip(item);
                                    }}
                                    activeOpacity={unlocked ? 0.8 : 1}
                                >
                                    {/* Emoji do item */}
                                    <Text style={[styles.itemEmoji, !unlocked && styles.itemEmojiLocked]}>
                                        {unlocked ? item.emoji : '🔒'}
                                    </Text>

                                    <Text style={[styles.itemName, !unlocked && styles.itemNameLocked]} numberOfLines={1}>
                                        {item.name}
                                    </Text>

                                    {/* Requisito */}
                                    {!unlocked && (
                                        <Text style={styles.itemReq} numberOfLines={1}>
                                            {item.xpRequired ? `${item.xpRequired} XP` : 'Conquista'}
                                        </Text>
                                    )}

                                    {/* Badge equipado */}
                                    {equipped && (
                                        <View style={[styles.equippedBadge, { backgroundColor: item.color }]}>
                                            <Text style={styles.equippedText}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                </ScrollView>

            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d0d10' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#1e1c2e',
    },
    title: { color: '#fff', fontSize: 18, fontWeight: '800' },
    closeBtn: { padding: 8 },
    closeBtnText: { color: '#7a7590', fontSize: 18, fontWeight: '700' },
    xpBar: {
        backgroundColor: '#16151d',
        padding: 10,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#1e1c2e',
    },
    xpText: { color: '#8b5cf6', fontSize: 14, fontWeight: '700' },
    tabs: { maxHeight: 50, borderBottomWidth: 1, borderBottomColor: '#1e1c2e' },
    tabsContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
    tab: { paddingHorizontal: 14, paddingVertical: 10 },
    tabActive: { borderBottomWidth: 2, borderBottomColor: '#8b5cf6' },
    tabText: { color: '#6b6880', fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#8b5cf6' },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 10,
    },
    item: {
        width: ITEM_SIZE,
        backgroundColor: '#16151d',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2a2040',
        gap: 6,
        position: 'relative',
    },
    itemLocked: { opacity: 0.5 },
    itemEmoji: { fontSize: 32 },
    itemEmojiLocked: { opacity: 0.4 },
    itemName: { color: '#d4d0e8', fontSize: 11, fontWeight: '700', textAlign: 'center' },
    itemNameLocked: { color: '#44415a' },
    itemReq: { color: '#8b5cf6', fontSize: 10, fontWeight: '600' },
    equippedBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    equippedText: { color: '#fff', fontSize: 10, fontWeight: '900' },
});
