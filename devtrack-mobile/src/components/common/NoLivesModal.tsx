// src/components/common/NoLivesModal.tsx — Lucide icons, sem emojis, design 3D
import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
    FadeInDown, withSpring, useSharedValue, useAnimatedStyle,
    withSequence, withTiming, withRepeat,
} from 'react-native-reanimated';
import { Heart, Tv2, Play, Zap, Clock, X } from 'lucide-react-native';
import { useLives } from '../../context/LivesContext';

interface Props { visible:boolean; onClose:()=>void; onLifeRestored:()=>void; }

const AD_DURATION = 5;

export default function NoLivesModal({ visible, onClose, onLifeRestored }:Props) {
    const { restoreLife, activateInfinite, nextRefillIn, maxLives, lives } = useLives();
    const [watching,  setWatching]  = useState(false);
    const [countdown, setCountdown] = useState(AD_DURATION);
    const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null);

    const pulseScale = useSharedValue(1);
    const adProgress = useSharedValue(0);

    useEffect(()=>{
        if(visible){
            pulseScale.value = withRepeat(
                withSequence(withTiming(1.06,{duration:800}),withTiming(1,{duration:800})),-1,true
            );
        }
    },[visible]);

    const pulseStyle  = useAnimatedStyle(()=>({transform:[{scale:pulseScale.value}]}));
    const adBarStyle  = useAnimatedStyle(()=>({width:`${adProgress.value*100}%` as any}));

    const startAd = ()=>{
        setWatching(true); setCountdown(AD_DURATION);
        adProgress.value=0;
        adProgress.value = withTiming(1,{duration:AD_DURATION*1000});
        intervalRef.current = setInterval(()=>{
            setCountdown(c=>{
                if(c<=1){
                    clearInterval(intervalRef.current!);
                    setWatching(false);
                    restoreLife(); onLifeRestored(); onClose();
                    return 0;
                }
                return c-1;
            });
        },1000);
    };

    const handlePremium = ()=>{ activateInfinite(); onClose(); };
    useEffect(()=>()=>{ if(intervalRef.current) clearInterval(intervalRef.current); },[]);

    function fmt(s:number){ return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={s.overlay}>
                <Animated.View entering={FadeInDown.springify()} style={s.card}>

                    {/* Close */}
                    <TouchableOpacity style={s.closeX} onPress={onClose}>
                        <X size={20} color="#6b6880" strokeWidth={2.5}/>
                    </TouchableOpacity>

                    {/* Hearts */}
                    <Animated.View style={[s.heartsRow,pulseStyle]}>
                        {Array.from({length:maxLives},(_,i)=>(
                            <Heart key={i} size={30}
                                color={i<lives?'#ff4b4b':'#37464f'}
                                fill={i<lives?'#ff4b4b':'#37464f'}
                                strokeWidth={2}
                            />
                        ))}
                    </Animated.View>

                    <Text style={s.title}>Sem vidas!</Text>
                    <Text style={s.subtitle}>Você ficou sem vidas. Descanse ou continue agora.</Text>

                    {/* Timer */}
                    {nextRefillIn>0&&(
                        <View style={s.timerBadge}>
                            <Clock size={14} color="#1cb0f6" strokeWidth={2.5}/>
                            <Text style={s.timerTxt}>Próxima vida em {fmt(nextRefillIn)}</Text>
                        </View>
                    )}

                    <View style={s.divider}/>

                    {/* Ad button / watching */}
                    {watching?(
                        <View style={s.adContainer}>
                            <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
                                <Tv2 size={20} color="#1cb0f6" strokeWidth={2.5}/>
                                <Text style={s.adLabel}>Assistindo... {countdown}s</Text>
                            </View>
                            <View style={s.adTrack}>
                                <Animated.View style={[s.adBar,adBarStyle]}/>
                            </View>
                            <Text style={s.adHint}>Não feche esta tela!</Text>
                        </View>
                    ):(
                        <TouchableOpacity style={s.adBtn} onPress={startAd} activeOpacity={0.85}>
                            <View style={[s.adIcon,{backgroundColor:'#1cb0f620'}]}>
                                <Play size={20} color="#1cb0f6" fill="#1cb0f6" strokeWidth={2}/>
                            </View>
                            <View style={{flex:1}}>
                                <Text style={s.adBtnTitle}>Assistir anúncio</Text>
                                <Text style={s.adBtnSub}>Ganhe +1 vida grátis</Text>
                            </View>
                            <Heart size={18} color="#ff4b4b" fill="#ff4b4b" strokeWidth={2}/>
                        </TouchableOpacity>
                    )}

                    {/* Premium */}
                    <TouchableOpacity style={s.premiumBtn} onPress={handlePremium} activeOpacity={0.85}>
                        <View style={[s.adIcon,{backgroundColor:'#ffc80020'}]}>
                            <Zap size={20} color="#ffc800" fill="#ffc800" strokeWidth={2}/>
                        </View>
                        <View style={{flex:1}}>
                            <Text style={s.premiumTitle}>Vidas infinitas — 24h</Text>
                            <Text style={s.premiumSub}>Estude sem interrupções</Text>
                        </View>
                        <View style={s.infBadge}>
                            <Text style={s.infBadgeTxt}>∞</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                        <Text style={s.closeBtnTxt}>Fechar — esperar recarregar</Text>
                    </TouchableOpacity>

                </Animated.View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay:      { flex:1, backgroundColor:'rgba(0,0,0,0.82)', alignItems:'center', justifyContent:'center', padding:20 },
    card:         { backgroundColor:'#131f24', borderRadius:28, padding:28, width:'100%', borderWidth:2, borderColor:'#212b31', borderBottomWidth:7, borderBottomColor:'#0d161a', alignItems:'center', gap:16 },
    closeX:       { position:'absolute', top:16, right:16, padding:4 },
    heartsRow:    { flexDirection:'row', gap:8, marginTop:8 },
    title:        { color:'#fff', fontSize:26, fontWeight:'900', letterSpacing:-0.5 },
    subtitle:     { color:'#afb6b9', fontSize:14, textAlign:'center', lineHeight:20, fontWeight:'600' },
    timerBadge:   { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#1cb0f620', borderRadius:16, paddingHorizontal:14, paddingVertical:8, borderWidth:2, borderColor:'#1cb0f640' },
    timerTxt:     { color:'#1cb0f6', fontSize:13, fontWeight:'800' },
    divider:      { width:'100%', height:2, backgroundColor:'#212b31' },
    adBtn:        { width:'100%', backgroundColor:'#16151d', borderRadius:20, padding:18, flexDirection:'row', alignItems:'center', gap:14, borderWidth:2, borderColor:'#212b31', borderBottomWidth:5, borderBottomColor:'#161c20' },
    adIcon:       { width:44, height:44, borderRadius:22, alignItems:'center', justifyContent:'center' },
    adBtnTitle:   { color:'#fff', fontSize:15, fontWeight:'800' },
    adBtnSub:     { color:'#1cb0f6', fontSize:12, fontWeight:'700', marginTop:2 },
    adContainer:  { width:'100%', gap:12, alignItems:'center' },
    adLabel:      { color:'#1cb0f6', fontSize:14, fontWeight:'800' },
    adTrack:      { width:'100%', height:10, backgroundColor:'#212b31', borderRadius:5, overflow:'hidden' },
    adBar:        { height:'100%', backgroundColor:'#1cb0f6', borderRadius:5 },
    adHint:       { color:'#6b6880', fontSize:11, fontWeight:'600' },
    premiumBtn:   { width:'100%', backgroundColor:'#16151d', borderRadius:20, padding:18, flexDirection:'row', alignItems:'center', gap:14, borderWidth:2, borderColor:'#ffc80030', borderBottomWidth:5, borderBottomColor:'#161c20' },
    premiumTitle: { color:'#fff', fontSize:15, fontWeight:'800' },
    premiumSub:   { color:'#ffc800', fontSize:12, fontWeight:'700', marginTop:2 },
    infBadge:     { backgroundColor:'#ffc800', borderRadius:14, width:32, height:32, alignItems:'center', justifyContent:'center', borderBottomWidth:3, borderBottomColor:'#e5b400' },
    infBadgeTxt:  { color:'#fff', fontSize:16, fontWeight:'900' },
    closeBtn:     { paddingVertical:8 },
    closeBtnTxt:  { color:'#6b6880', fontSize:12, fontWeight:'700' },
});
