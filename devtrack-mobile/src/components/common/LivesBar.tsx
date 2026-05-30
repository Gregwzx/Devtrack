// src/components/common/LivesBar.tsx — Lucide icons, sem emojis
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withSpring } from 'react-native-reanimated';
import { Heart, Zap, Clock } from 'lucide-react-native';
import { useLives } from '../../context/LivesContext';

function HeartIcon({ filled, justLost }: { filled:boolean; justLost:boolean }) {
    const scale = useSharedValue(1);
    const rotate = useSharedValue(0);

    useEffect(()=>{
        if(justLost && !filled){
            scale.value = withSequence(
                withTiming(1.5,{duration:100}),
                withTiming(0.7,{duration:100}),
                withSpring(1,{damping:8}),
            );
            rotate.value = withSequence(
                withTiming(-15,{duration:80}),
                withTiming(15,{duration:80}),
                withTiming(0,{duration:80}),
            );
        }
    },[filled,justLost]);

    const style = useAnimatedStyle(()=>({
        transform:[{scale:scale.value},{rotate:`${rotate.value}deg`}],
    }));

    return (
        <Animated.View style={style}>
            <Heart
                size={20}
                color={filled?'#ff4b4b':'#37464f'}
                fill={filled?'#ff4b4b':'#37464f'}
                strokeWidth={filled?2:1.5}
            />
        </Animated.View>
    );
}

function formatTime(seconds:number):string {
    const m = Math.floor(seconds/60);
    const s = seconds%60;
    return `${m}:${String(s).padStart(2,'0')}`;
}

export default function LivesBar() {
    const { lives, maxLives, isInfinite, nextRefillIn } = useLives();
    const prevLives = React.useRef(lives);
    const justLostIdx = React.useRef(-1);

    if(prevLives.current !== lives){
        if(lives < prevLives.current) justLostIdx.current = lives;
        prevLives.current = lives;
    }

    if(isInfinite){
        return (
            <View style={s.container}>
                <Zap size={18} color="#ffc800" fill="#ffc800" strokeWidth={2}/>
                <Text style={s.infiniteText}>∞</Text>
            </View>
        );
    }

    return (
        <View style={s.container}>
            <View style={s.hearts}>
                {Array.from({length:maxLives},(_,i)=>(
                    <HeartIcon key={i} filled={i<lives} justLost={i===justLostIdx.current}/>
                ))}
            </View>
            {lives < maxLives && nextRefillIn > 0 && (
                <View style={s.badge}>
                    <Clock size={10} color="#afb6b9" strokeWidth={2.5}/>
                    <Text style={s.badgeTxt}>{formatTime(nextRefillIn)}</Text>
                </View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container:   { flexDirection:'row', alignItems:'center', gap:6 },
    hearts:      { flexDirection:'row', gap:3, alignItems:'center' },
    infiniteText:{ color:'#ffc800', fontSize:20, fontWeight:'900', marginLeft:4 },
    badge:       { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#212b31', borderRadius:10, paddingHorizontal:8, paddingVertical:4, borderWidth:2, borderColor:'#37464f', borderBottomWidth:3, borderBottomColor:'#161c20' },
    badgeTxt:    { color:'#afb6b9', fontSize:10, fontWeight:'800' },
});
