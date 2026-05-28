import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Animated, { 
    useSharedValue, useAnimatedStyle, withRepeat, 
    withTiming, Easing, withDelay, withSequence
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const COLUMN_WIDTH = 24;
const COLUMNS = Math.floor(width / COLUMN_WIDTH);
const DROPS = Array.from({ length: COLUMNS }).map((_, i) => i);

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%""\'#&_(),.;:?!\\|{}<>[]^~';

function MatrixColumn({ index, color }: { index: number; color: string }) {
    const translateY = useSharedValue(-height);
    const opacity = useSharedValue(0.1);
    const [stream, setStream] = useState('');

    useEffect(() => {
        // Gerar caracteres aleatórios estilo "código caindo"
        let str = '';
        const len = 15 + Math.floor(Math.random() * 10);
        for (let i = 0; i < len; i++) {
            str += CHARS.charAt(Math.floor(Math.random() * CHARS.length)) + '\n';
        }
        setStream(str);

        const duration = 2500 + Math.random() * 4000;
        const delay = Math.random() * 4000;
        
        translateY.value = withDelay(
            delay,
            withRepeat(withTiming(height + 200, { duration, easing: Easing.linear }), -1, false)
        );
        
        opacity.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(0.7, { duration: 200 }), 
                    withTiming(0.1, { duration: duration - 200 })
                ), 
                -1, false
            )
        );
    }, [height]);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value
    }));

    return (
        <Animated.View style={[styles.columnWrapper, { left: index * COLUMN_WIDTH }, style]}>
            <Text style={[styles.text, { color, textShadowColor: color }]} numberOfLines={30}>
                {stream}
            </Text>
        </Animated.View>
    );
}

export default function MatrixBackground({ color }: { color: string }) {
    return (
        <View style={[StyleSheet.absoluteFill, styles.container]}>
            {DROPS.map(i => (
                <MatrixColumn key={i} index={i} color={color} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        backgroundColor: 'transparent',
    },
    columnWrapper: {
        position: 'absolute',
        top: -200, // começa acima da tela
        width: COLUMN_WIDTH,
        alignItems: 'center',
    },
    text: {
        fontSize: 14,
        fontWeight: '900',
        fontFamily: 'monospace',
        textAlign: 'center',
        lineHeight: 18,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
        elevation: 5,
    }
});
