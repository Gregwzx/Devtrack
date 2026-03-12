// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withSpring, interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

// ─── Custom tab button ────────────────────────────────────────────────────────
function TabButton({
    focused,
    icon,
    label,
}: {
    focused: boolean;
    icon: string;
    label: string;
}) {
    const scale    = useSharedValue(focused ? 1.08 : 0.92);
    const dotScale = useSharedValue(focused ? 1 : 0);

    if (focused) {
        scale.value    = withSpring(1.08, { damping: 12, stiffness: 200 });
        dotScale.value = withSpring(1,    { damping: 14, stiffness: 180 });
    } else {
        scale.value    = withSpring(0.92, { damping: 12, stiffness: 200 });
        dotScale.value = withSpring(0,    { damping: 14, stiffness: 180 });
    }

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));
    const dotStyle = useAnimatedStyle(() => ({
        transform: [{ scale: dotScale.value }],
        opacity: interpolate(dotScale.value, [0, 1], [0, 1]),
    }));

    const ACCENT = '#8b5cf6';

    return (
        <Animated.View style={[styles.btn, containerStyle]}>
            <View style={[
                styles.iconWrap,
                focused && { backgroundColor: ACCENT + '20' },
            ]}>
                <Ionicons
                    name={(focused ? icon : `${icon}-outline`) as any}
                    size={22}
                    color={focused ? ACCENT : '#4a4860'}
                />
            </View>
            <Text style={[styles.label, { color: focused ? ACCENT : '#4a4860' }]}>
                {label}
            </Text>
            <Animated.View style={[styles.dot, { backgroundColor: ACCENT }, dotStyle]} />
        </Animated.View>
    );
}

export default function TabsLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 62 + insets.bottom,
                    paddingBottom: insets.bottom,
                    backgroundColor: '#0f0e15',
                    borderTopWidth: 1,
                    borderTopColor: '#1e1c2e',
                    elevation: 24,
                    shadowColor: '#000',
                    shadowOpacity: 0.5,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: -4 },
                },
                tabBarShowLabel: false,
            }}
        >
            {/* ── As 3 tabs reais ── */}
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabButton focused={focused} icon="home" label="Home" />
                    ),
                }}
            />
            <Tabs.Screen
                name="Suggestions"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabButton focused={focused} icon="bulb" label="Sugestões" />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabButton focused={focused} icon="person" label="Perfil" />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    btn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        paddingTop: 8,
    },
    iconWrap: {
        width: 44,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 1,
    },
});