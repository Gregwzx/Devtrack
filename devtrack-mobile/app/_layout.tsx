// app/_layout.tsx
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, Platform, useWindowDimensions, StyleSheet, TouchableOpacity, Text } from 'react-native';
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
    const { width } = useWindowDimensions();
    // Considera desktop se for Web e a tela for maior que um tablet (768px)
    const isWebDesktop = Platform.OS === 'web' && width > 768;
    const [isPhoneMode, setIsPhoneMode] = useState(false); // Inicia normal (tela cheia)

    return (
        <AuthProvider>
            <ThemeProvider value={DarkTheme}>
                <View style={isWebDesktop && isPhoneMode ? styles.webContainer : styles.mobileContainer}>
                    <View style={isWebDesktop && isPhoneMode ? styles.phoneWrapper : styles.mobileContainer}>
                        <InnerLayout />
                        <StatusBar style="light" />
                    </View>

                    {/* Botão de Toggle visível apenas no Web Desktop */}
                    {isWebDesktop && (
                        <TouchableOpacity
                            style={styles.toggleBtn}
                            onPress={() => setIsPhoneMode(!isPhoneMode)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.toggleText}>
                                {isPhoneMode ? 'Expandir Tela' : 'Modo Celular'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ThemeProvider>
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    mobileContainer: {
        flex: 1,
    },
    webContainer: {
        flex: 1,
        backgroundColor: '#050505', // Fundo escuro para destacar o "celular"
        alignItems: 'center',
        justifyContent: 'center',
    },
    phoneWrapper: {
        width: 390, // Largura padrão de iPhone
        height: 844, // Altura padrão de iPhone
        maxHeight: '95%', // Não ultrapassar a altura da janela
        backgroundColor: '#0d0d10',
        borderRadius: 44, // Bordas arredondadas do celular
        overflow: 'hidden',
        borderWidth: 8,
        borderColor: '#1a1a24', // Cor da "carcaça" do celular
        shadowColor: '#8b5cf6',
        shadowOpacity: 0.15,
        shadowRadius: 50,
        // No web, elevation não faz efeito, usamos box-shadow do CSS pelo React Native Web
    },
    toggleBtn: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: '#8b5cf6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 9999,
    },
    toggleText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    }
});