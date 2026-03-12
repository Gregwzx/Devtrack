// app/_layout.tsx
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '../src/context/AuthContext';
import SplashScreen from '../src/screens/SplashScreen';

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
                {/* Grupo de tabs — não aparece como tela avulsa */}
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                {/* Login fora das tabs — tela de stack normal */}
                <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />

                {/* Modal — apresentação modal real */}
                <Stack.Screen
                    name="modal"
                    options={{ presentation: 'modal', headerShown: false }}
                />
            </Stack>

            {/* Splash sobreposta até estar pronta */}
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