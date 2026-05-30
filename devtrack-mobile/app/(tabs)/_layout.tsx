// app/(tabs)/_layout.tsx — 4 abas: DevTrack · Trilhas · Ranking · Perfil
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate } from 'react-native-reanimated';
import { Code2, Compass, Trophy, User } from 'lucide-react-native';
import { LivesProvider } from '../../src/context/LivesContext';

const ACCENT = '#8b5cf6';
const { width: SW } = Dimensions.get('window');
// Em telas estreitas (< 380px), usa fonte menor e ícones menores
const isNarrow = SW < 380;

function TabButton({ focused, Icon, label }: { focused: boolean; Icon: any; label: string }) {
    const scale    = useSharedValue(focused ? 1.05 : 0.92);
    const dotScale = useSharedValue(focused ? 1 : 0);
    scale.value    = withSpring(focused ? 1.05 : 0.92, { damping: 12, stiffness: 200 });
    dotScale.value = withSpring(focused ? 1 : 0, { damping: 14, stiffness: 180 });
    const containerStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    const dotStyle = useAnimatedStyle(() => ({
        transform: [{ scale: dotScale.value }],
        opacity: interpolate(dotScale.value, [0, 1], [0, 1]),
    }));

    const iconSize = isNarrow ? 18 : 20;

    return (
        <Animated.View style={[s.btn, containerStyle]}>
            <View style={[s.iconWrap, focused && { backgroundColor: ACCENT + '25' }]}>
                <Icon size={iconSize} color={focused ? ACCENT : '#4a4860'} strokeWidth={focused ? 2.5 : 2} />
            </View>
            <Text
                style={[s.label, { color: focused ? ACCENT : '#4a4860' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
            >
                {label}
            </Text>
            <Animated.View style={[s.dot, { backgroundColor: ACCENT }, dotStyle]} />
        </Animated.View>
    );
}

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    const TAB_HEIGHT = isNarrow ? 58 : 64;

    return (
        <LivesProvider>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    animation: 'shift',
                    tabBarStyle: {
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: TAB_HEIGHT + insets.bottom,
                        paddingBottom: insets.bottom,
                        backgroundColor: '#0d0b14',
                        borderTopWidth: 2, borderTopColor: '#1e1a2e',
                        elevation: 24, shadowColor: '#000',
                        shadowOpacity: 0.6, shadowRadius: 20,
                        shadowOffset: { width: 0, height: -4 },
                    },
                    tabBarShowLabel: false,
                }}
            >
                <Tabs.Screen name="index"      options={{ tabBarIcon: ({ focused }) => <TabButton focused={focused} Icon={Code2}   label="DevTrack" /> }} />
                <Tabs.Screen name="TrailSelect" options={{ tabBarIcon: ({ focused }) => <TabButton focused={focused} Icon={Compass} label="Trilhas"  /> }} />
                <Tabs.Screen name="ranking"     options={{ tabBarIcon: ({ focused }) => <TabButton focused={focused} Icon={Trophy}  label="Ranking"  /> }} />
                <Tabs.Screen name="profile"     options={{ tabBarIcon: ({ focused }) => <TabButton focused={focused} Icon={User}    label="Perfil"   /> }} />
            </Tabs>
        </LivesProvider>
    );
}

const s = StyleSheet.create({
    btn:      {
        alignItems: 'center', justifyContent: 'center',
        gap: 2, paddingTop: 4,
        // Garante que o label não corte em telas estreitas
        minWidth: isNarrow ? 60 : 72,
    },
    iconWrap: {
        width: isNarrow ? 38 : 42,
        height: isNarrow ? 28 : 32,
        borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    label:    {
        fontSize: isNarrow ? 9 : 10,
        fontWeight: '700',
        letterSpacing: 0.1,
        textAlign: 'center',
    },
    dot:      { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
});