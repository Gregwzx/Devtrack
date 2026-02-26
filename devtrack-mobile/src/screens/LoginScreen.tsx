// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Dimensions,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { signInWithGoogle } from '../services/authService';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const scale = useSharedValue(1);

    const btnStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        scale.value = withSpring(0.97);
        const user = await signInWithGoogle();
        scale.value = withSpring(1);
        setLoading(false);
        if (!user) {
            setError('Não foi possível fazer login. Tente novamente.');
        }
        // Se login OK, o AuthContext detecta automaticamente e redireciona
    };

    return (
        <View style={styles.container}>
            {/* Background glow */}
            <View style={styles.glow} />

            {/* Logo */}
            <Animated.View entering={FadeInDown.delay(100).duration(700).springify()} style={styles.logoArea}>
                <View style={styles.logoBox}>
                    <Text style={styles.logoIcon}>⚡</Text>
                </View>
                <Text style={styles.logoText}>
                    Dev<Text style={styles.logoAccent}>Track</Text>
                </Text>
                <Text style={styles.logoTagline}>Sua evolução, visível.</Text>
            </Animated.View>

            {/* Features */}
            <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.features}>
                {[
                    { icon: '🔥', text: 'Acompanhe sua sequência de estudos' },
                    { icon: '📝', text: 'Registre o que aprendeu cada dia' },
                    { icon: '🏆', text: 'Compare seu progresso com amigos' },
                ].map((item, i) => (
                    <View key={i} style={styles.featureRow}>
                        <Text style={styles.featureIcon}>{item.icon}</Text>
                        <Text style={styles.featureText}>{item.text}</Text>
                    </View>
                ))}
            </Animated.View>

            {/* Login button */}
            <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.bottom}>
                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Animated.View style={btnStyle}>
                    <TouchableOpacity
                        style={[styles.googleBtn, loading && styles.googleBtnDisabled]}
                        onPress={handleGoogleLogin}
                        disabled={loading}
                        activeOpacity={0.9}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Text style={styles.googleIcon}>G</Text>
                                <Text style={styles.googleBtnText}>Continuar com Google</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>

                <Text style={styles.terms}>
                    Ao continuar, você concorda com os termos de uso do DevTrack.
                </Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d10',
        paddingHorizontal: 24,
        justifyContent: 'space-between',
        paddingTop: height * 0.12,
        paddingBottom: 40,
    },
    glow: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#8b5cf6',
        opacity: 0.06,
        top: -60,
        alignSelf: 'center',
    },
    logoArea: {
        alignItems: 'center',
    },
    logoBox: {
        width: 80,
        height: 80,
        borderRadius: 26,
        backgroundColor: '#8b5cf6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#8b5cf6',
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 12,
    },
    logoIcon: { fontSize: 36 },
    logoText: {
        fontSize: 36,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1,
        marginBottom: 8,
    },
    logoAccent: { color: '#8b5cf6' },
    logoTagline: {
        color: '#6b6880',
        fontSize: 15,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    features: {
        gap: 16,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#16151d',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2a2040',
        gap: 14,
    },
    featureIcon: { fontSize: 22 },
    featureText: { color: '#d4d0e8', fontSize: 14, fontWeight: '500', flex: 1 },
    bottom: {
        gap: 12,
    },
    error: {
        color: '#f87171',
        fontSize: 13,
        textAlign: 'center',
    },
    googleBtn: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    googleBtnDisabled: {
        opacity: 0.7,
    },
    googleIcon: {
        fontSize: 18,
        fontWeight: '900',
        color: '#4285F4',
    },
    googleBtnText: {
        color: '#111',
        fontSize: 16,
        fontWeight: '700',
    },
    terms: {
        color: '#44415a',
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 16,
    },
});