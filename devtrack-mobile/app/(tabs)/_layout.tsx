// app/(tabs)/_layout.tsx — 3 abas: Home · Trilhas · Avatar + LivesProvider
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LivesProvider } from '../../src/context/LivesContext';

function TabButton({ focused, icon, label }: { focused: boolean; icon: string; label: string }) {
    const scale    = useSharedValue(focused ? 1.08 : 0.92);
    const dotScale = useSharedValue(focused ? 1 : 0);
    scale.value    = withSpring(focused ? 1.08 : 0.92, { damping: 12, stiffness: 200 });
    dotScale.value = withSpring(focused ? 1 : 0,        { damping: 14, stiffness: 180 });
    const containerStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: dotScale.value }], opacity: interpolate(dotScale.value, [0,1], [0,1]) }));
    const ACCENT = '#8b5cf6';
    return (
        <Animated.View style={[styles.btn, containerStyle]}>
            <View style={[styles.iconWrap, focused && { backgroundColor: ACCENT + '20' }]}>
                <Ionicons name={(focused ? icon : `${icon}-outline`) as any} size={20} color={focused ? ACCENT : '#4a4860'} />
            </View>
            <Text style={[styles.label, { color: focused ? ACCENT : '#4a4860' }]}>{label}</Text>
            <Animated.View style={[styles.dot, { backgroundColor: ACCENT }, dotStyle]} />
        </Animated.View>
    );
}

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    return (
        <LivesProvider>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    animation: 'shift',
                    tabBarStyle: {
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: 62 + insets.bottom, paddingBottom: insets.bottom,
                        backgroundColor: '#0f0e15', borderTopWidth: 1, borderTopColor: '#1e1c2e',
                        elevation: 24, shadowColor: '#000', shadowOpacity: 0.5,
                        shadowRadius: 20, shadowOffset: { width: 0, height: -4 },
                    },
                    tabBarShowLabel: false,
                }}
            >
                <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabButton focused={focused} icon="home" label="Home" /> }} />
                <Tabs.Screen name="TrailSelect" options={{ tabBarIcon: ({ focused }) => <TabButton focused={focused} icon="compass" label="Trilhas" /> }} />
                <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabButton focused={focused} icon="person-circle" label="Avatar" /> }} />
            </Tabs>
        </LivesProvider>
    );
}

const styles = StyleSheet.create({
    btn: { alignItems: 'center', justifyContent: 'center', gap: 2, paddingTop: 4 },
    iconWrap: { width: 40, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
    dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
});