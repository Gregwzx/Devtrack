// app/_layout.tsx
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import SplashScreen from '@/src/screens/SplashScreen';

function InnerLayout() {
    const { user, loading } = useAuth();
    const [splashDone, setSplashDone] = useState(false);

    useEffect(() => {
        if (!loading && splashDone) {
            if (user) {
                router.replace('/(tabs)');
            } else {
                router.replace('/login');
            }
        }
    }, [user, loading, splashDone]);

    return (
        <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="login" />
            </Stack>
            {(!splashDone || loading) && (
                <SplashScreen onFinish={() => setSplashDone(true)} />
            )}
        </View>
    );
}

export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
    return (
        <AuthProvider>
            <ThemeProvider value={DarkTheme}>
                <InnerLayout />
                <StatusBar style="light" />
            </ThemeProvider>
        </AuthProvider>
    );
}