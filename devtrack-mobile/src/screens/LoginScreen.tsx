// src/screens/LoginScreen.tsx

import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, TextInput, KeyboardAvoidingView,
    Platform, ScrollView, Dimensions,
} from 'react-native';
import Animated, {
    FadeInDown, FadeInUp,
    useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Eye, EyeOff } from 'lucide-react-native';
import { router } from 'expo-router';
import { signInWithEmail, signUpWithEmail, signInAsGuest, getApiError } from '../services/authService';

const { height } = Dimensions.get('window');
type Mode = 'login' | 'register';

export default function LoginScreen() {
    const [mode, setMode] = useState<Mode>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const scale = useSharedValue(1);
    const btnStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const handleSubmit = async () => {
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Preencha todos os campos.');
            return;
        }

        if (mode === 'register' && !name.trim()) {
            setError('Digite seu nome.');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);

        scale.value = withSpring(0.97, {}, () => {
            scale.value = withSpring(1);
        });

        try {
            if (mode === 'login') {
                await signInWithEmail(email.trim(), password);
            } else {
                await signUpWithEmail(name.trim(), email.trim(), password);
            }

            // Navega para o app — o AuthContext também detectará a sessão
            router.replace('/(tabs)');

        } catch (err: any) {
            setError(getApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleGuest = async () => {
        setLoading(true);
        try {
            await signInAsGuest();
            router.replace('/(tabs)');
        } catch (err: any) {
            setError(getApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(m => m === 'login' ? 'register' : 'login');
        setError('');
        setName('');
        setEmail('');
        setPassword('');
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >

                {/* LOGO */}
                <Animated.View
                    entering={FadeInDown.delay(100).duration(700).springify()}
                    style={styles.logoArea}
                >
                    <View style={styles.logoBox}>
                        <View style={styles.terminalIcon}>
                            <Text style={styles.terminalChevron}>{'>'}</Text>
                            <Text style={styles.terminalUnderscore}>_</Text>
                        </View>
                    </View>

                    <Text style={styles.logoText}>
                        Dev<Text style={styles.logoAccent}>Track</Text>
                    </Text>

                    <Text style={styles.logoTagline}>
                        Sua evolução, visível.
                    </Text>
                </Animated.View>

                {/* FORM */}
                <Animated.View
                    entering={FadeInDown.delay(350).duration(600)}
                    style={styles.form}
                >
                    {/* TABS */}
                    <View style={styles.tabs}>
                        <TouchableOpacity
                            style={[styles.tab, mode === 'login' && styles.tabActive]}
                            onPress={() => mode !== 'login' && toggleMode()}
                        >
                            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                                Entrar
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tab, mode === 'register' && styles.tabActive]}
                            onPress={() => mode !== 'register' && toggleMode()}
                        >
                            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                                Cadastrar
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {mode === 'register' && (
                        <TextInput
                            style={styles.input}
                            placeholder="Seu nome"
                            placeholderTextColor="#555"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />
                    )}

                    <TextInput
                        style={styles.input}
                        placeholder="E-mail"
                        placeholderTextColor="#555"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Senha"
                            placeholderTextColor="#555"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                        >
                            {showPassword ? (
                                <EyeOff size={20} color="#8b5cf6" />
                            ) : (
                                <Eye size={20} color="#555" />
                            )}
                        </TouchableOpacity>
                    </View>

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <Animated.View style={btnStyle}>
                        <TouchableOpacity
                            style={[styles.btn, loading && styles.btnDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.9}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.btnText}>
                                    {mode === 'login' ? 'Entrar' : 'Criar conta'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>

                    <TouchableOpacity
                        style={styles.guestBtn}
                        onPress={handleGuest}
                        disabled={loading}
                    >
                        <Text style={styles.guestBtnText}>
                            Entrar sem conta (Visitante)
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* FOOTER */}
                <Animated.View
                    entering={FadeInUp.delay(500).duration(600)}
                    style={styles.footer}
                >
                    <Text style={styles.footerText}>
                        {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
                        <Text style={styles.footerLink} onPress={toggleMode}>
                            {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
                        </Text>
                    </Text>

                    <Text style={styles.terms}>
                        Ao continuar, você concorda com os termos de uso do DevTrack.
                    </Text>
                </Animated.View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#0d0d10',
        paddingHorizontal: 24,
        paddingTop: height * 0.1,
        paddingBottom: 40,
        justifyContent: 'space-between',
    },
    logoArea: { alignItems: 'center', marginBottom: 8 },
    logoBox: {
        width: 88,
        height: 88,
        borderRadius: 28,
        backgroundColor: '#8b5cf6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
        shadowColor: '#8b5cf6',
        shadowOpacity: 0.6,
        shadowRadius: 24,
        elevation: 14,
    },
    terminalIcon: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
    terminalChevron: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
        lineHeight: 32,
    },
    terminalUnderscore: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
        lineHeight: 32,
        marginBottom: -4,
    },
    logoText: {
        fontSize: 34,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1,
        marginBottom: 6,
    },
    logoAccent: { color: '#8b5cf6' },
    logoTagline: {
        color: '#6b6880',
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    form: {
        backgroundColor: '#16151d',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#2a2040',
        gap: 12,
        marginVertical: 24,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#0d0d10',
        borderRadius: 12,
        padding: 3,
    },
    tab: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 9,
        alignItems: 'center',
    },
    tabActive: { backgroundColor: '#8b5cf6' },
    tabText: {
        color: '#6b6880',
        fontSize: 14,
        fontWeight: '700',
    },
    tabTextActive: { color: '#fff' },
    input: {
        backgroundColor: '#0d0d10',
        borderRadius: 14,
        padding: 16,
        color: '#fff',
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#2a2040',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0d0d10',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#2a2040',
    },
    passwordInput: {
        flex: 1,
        padding: 16,
        color: '#fff',
        fontSize: 15,
    },
    eyeIcon: {
        padding: 16,
    },
    error: {
        color: '#f87171',
        fontSize: 13,
        textAlign: 'center',
    },
    btn: {
        backgroundColor: '#8b5cf6',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#8b5cf6',
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    guestBtn: {
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: -4,
    },
    guestBtnText: {
        color: '#6b6880',
        fontSize: 14,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    footer: { alignItems: 'center', gap: 10 },
    footerText: {
        color: '#6b6880',
        fontSize: 14,
    },
    footerLink: {
        color: '#8b5cf6',
        fontWeight: '700',
    },
    terms: {
        color: '#44415a',
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 16,
    },
});