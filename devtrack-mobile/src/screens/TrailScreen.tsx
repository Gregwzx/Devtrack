// src/screens/TrailScreen.tsx — trilha por área com back button e separadores de nível
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useLives } from '../context/LivesContext';
import LivesBar from '../components/common/LivesBar';
import NoLivesModal from '../components/common/NoLivesModal';
import { EXERCISES, type Exercise } from '../data/exercises';
import { getTrailForArea, type TrailStop } from '../data/trail';
import type { StudyArea } from '../services/ai.service';
import { ChevronLeft } from 'lucide-react-native';

const { width: SW } = Dimensions.get('window');
const STORAGE_KEY = (email: string) => `DEVTRACK_TRAIL_${email}`;
const XP_KEY      = (email: string) => `DEVTRACK_XP_${email}`;

const LEVEL_LABELS = { basic: '🟢 Básico', intermediate: '🟡 Intermediário', advanced: '🔴 Avançado' };
const LEVEL_COLORS = { basic: '#10b981',   intermediate: '#f59e0b',           advanced: '#ef4444'    };

// ── Pulsating ring ────────────────────────────────────────────────────────────
function PulseRing({ color }: { color: string }) {
    const s = useSharedValue(1), o = useSharedValue(0.8);
    useEffect(() => {
        s.value = withRepeat(withSequence(withTiming(1.35,{duration:900}), withTiming(1,{duration:900})), -1, true);
        o.value = withRepeat(withSequence(withTiming(0.2,{duration:900}),  withTiming(0.7,{duration:900})), -1, true);
    }, []);
    const style = useAnimatedStyle(() => ({ transform:[{scale:s.value}], opacity:o.value }));
    return <Animated.View style={[ss.pulse, { borderColor: color }, style]} />;
}

type StopStatus = 'completed' | 'active' | 'locked';

// ── Trail node ────────────────────────────────────────────────────────────────
function Node({ stop, status, onPress, isLeft }: { stop: TrailStop; status: StopStatus; onPress:()=>void; isLeft:boolean }) {
    const scale = useSharedValue(1);
    const sStyle = useAnimatedStyle(()=>({ transform:[{scale:scale.value}] }));
    return (
        <View style={[ss.nodeRow, isLeft ? ss.nodeL : ss.nodeR]}>
            <Pressable onPressIn={()=>scale.value=withSpring(0.92)} onPressOut={()=>scale.value=withSpring(1)} onPress={onPress} disabled={status==='locked'}>
                <Animated.View style={sStyle}>
                    {status==='active' && <PulseRing color={stop.color} />}
                    <View style={[ss.node, status==='completed'&&{backgroundColor:stop.color,borderColor:stop.color}, status==='active'&&{backgroundColor:stop.color+'22',borderColor:stop.color,borderWidth:3}, status==='locked'&&{backgroundColor:'#1a1826',borderColor:'#2a2040'}]}>
                        <Text style={[ss.nodeIcon, status==='locked'&&{opacity:0.3}]}>
                            {status==='locked'?'🔒': status==='completed'?'✓': stop.icon}
                        </Text>
                    </View>
                    <View style={ss.nodeLabel}>
                        <Text style={[ss.nodeName, status==='locked'&&{color:'#2a2040'}]} numberOfLines={1}>{stop.title}</Text>
                        <Text style={[ss.nodeSub, status==='locked'&&{color:'#1a1826'}]} numberOfLines={1}>{status==='completed'?`✓ +${stop.xpReward} XP`:stop.subtitle}</Text>
                    </View>
                </Animated.View>
            </Pressable>
        </View>
    );
}

// ── Stop modal ────────────────────────────────────────────────────────────────
function StopModal({ stop, visible, onClose, completedIds, onSelect }: { stop:TrailStop|null; visible:boolean; onClose:()=>void; completedIds:Set<string>; onSelect:(e:Exercise)=>void }) {
    if (!stop) return null;
    const exs = stop.exerciseIds.map(id=>EXERCISES.find(e=>e.id===id)).filter(Boolean) as Exercise[];
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={ms.overlay}>
                <Animated.View entering={FadeInDown.springify()} style={ms.card}>
                    <View style={[ms.header,{borderBottomColor:stop.color+'30'}]}>
                        <Text style={ms.icon}>{stop.icon}</Text>
                        <View style={{flex:1}}>
                            <Text style={ms.title}>{stop.title}</Text>
                            <Text style={ms.sub}>{stop.subtitle}</Text>
                        </View>
                        <View style={[ms.xpBadge,{backgroundColor:stop.color+'20',borderColor:stop.color+'50'}]}>
                            <Text style={[ms.xpText,{color:stop.color}]}>+{stop.xpReward} XP</Text>
                        </View>
                    </View>
                    {exs.map((ex,i)=>{
                        const done = completedIds.has(ex.id);
                        return (
                            <TouchableOpacity key={ex.id} style={[ms.row, done&&ms.rowDone]} onPress={()=>onSelect(ex)} activeOpacity={0.8}>
                                <View style={[ms.num, done&&{backgroundColor:stop.color}]}><Text style={ms.numTxt}>{done?'✓':i+1}</Text></View>
                                <View style={{flex:1}}>
                                    <Text style={[ms.exTitle, done&&{color:'#6b6880'}]}>{ex.title}</Text>
                                    <Text style={ms.exDesc} numberOfLines={1}>{ex.description}</Text>
                                </View>
                                <Text style={[ms.exXp,{color:stop.color}]}>+{ex.xp} XP</Text>
                            </TouchableOpacity>
                        );
                    })}
                    <TouchableOpacity style={ms.closeBtn} onPress={onClose}><Text style={ms.closeBtnTxt}>Fechar</Text></TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

// ── Quiz modal ────────────────────────────────────────────────────────────────
function QuizModal({ exercise, visible, onClose, onCorrect, onWrong }: { exercise:Exercise|null; visible:boolean; onClose:()=>void; onCorrect:(xp:number)=>void; onWrong:()=>void }) {
    const [selected, setSelected] = useState<number|null>(null);
    const [answered, setAnswered] = useState(false);
    useEffect(()=>{ if(visible){setSelected(null);setAnswered(false);} }, [visible]);
    if (!exercise) return null;
    const handle = (i:number) => {
        if(answered) return;
        setSelected(i); setAnswered(true);
        if(i===exercise.quiz.correctIndex) onCorrect(exercise.xp); else onWrong();
    };
    const ok = selected===exercise.quiz.correctIndex;
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={qs.overlay}>
                <Animated.View entering={FadeInUp.springify()} style={qs.card}>
                    <View style={qs.header}>
                        <Text style={qs.cat}>{exercise.category.toUpperCase()}</Text>
                        <Text style={qs.xp}>+{exercise.xp} XP</Text>
                    </View>
                    <Text style={qs.detail} numberOfLines={4}>{exercise.detail}</Text>
                    <View style={qs.divider}/>
                    <Text style={qs.question}>{exercise.quiz.question}</Text>
                    {exercise.quiz.options.map((opt,i)=>{
                        let s = {};
                        if(answered){ if(i===exercise.quiz.correctIndex) s=qs.optOk; else if(i===selected) s=qs.optBad; else s=qs.optDim; }
                        return (
                            <TouchableOpacity key={i} style={[qs.opt,s]} onPress={()=>handle(i)} disabled={answered} activeOpacity={0.8}>
                                <Text style={qs.optLetter}>{String.fromCharCode(65+i)}</Text>
                                <Text style={qs.optText}>{opt}</Text>
                            </TouchableOpacity>
                        );
                    })}
                    {answered && (
                        <Animated.View entering={FadeInDown.duration(300)} style={[qs.exp, ok?qs.expOk:qs.expBad]}>
                            <Text>{ok?'✅':'❌'}</Text>
                            <Text style={[qs.expText,{color:ok?'#10b981':'#ef4444'}]}>{exercise.quiz.explanation}</Text>
                        </Animated.View>
                    )}
                    <TouchableOpacity style={qs.btn} onPress={onClose}><Text style={qs.btnTxt}>{answered?'Continuar':'Cancelar'}</Text></TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TrailScreen({ area }: { area: StudyArea }) {
    const router = useRouter();
    const { user } = useAuth();
    const { lives, loseLife } = useLives();
    const email = user?.email ?? 'guest';
    const trail = getTrailForArea(area);

    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
    const [xp, setXp] = useState(0);
    const [selectedStop, setSelectedStop] = useState<TrailStop|null>(null);
    const [selectedEx, setSelectedEx] = useState<Exercise|null>(null);
    const [showNoLives, setShowNoLives] = useState(false);
    const [stopVisible, setStopVisible] = useState(false);
    const [quizVisible, setQuizVisible] = useState(false);
    const pendingRef = useRef<Exercise|null>(null);

    useEffect(()=>{
        const load = async()=>{
            const [c,x] = await Promise.all([AsyncStorage.getItem(STORAGE_KEY(email)), AsyncStorage.getItem(XP_KEY(email))]);
            if(c) setCompletedIds(new Set(JSON.parse(c)));
            if(x) setXp(parseInt(x,10)||0);
        };
        load();
    },[email]);

    const getStatus = (stop:TrailStop, idx:number): StopStatus => {
        if(stop.exerciseIds.every(id=>completedIds.has(id))) return 'completed';
        if(idx===0) return 'active';
        const prev = trail.stops[idx-1];
        return prev.exerciseIds.every(id=>completedIds.has(id)) ? 'active' : 'locked';
    };

    const openStop = (stop:TrailStop)=>{ setSelectedStop(stop); setStopVisible(true); };

    const openQuiz = (ex:Exercise)=>{
        if(lives<=0){ pendingRef.current=ex; setStopVisible(false); setShowNoLives(true); return; }
        setSelectedEx(ex); setQuizVisible(true);
    };

    const handleCorrect = useCallback(async(earned:number)=>{
        if(!selectedEx) return;
        const newC = new Set([...completedIds, selectedEx.id]);
        const newX = xp+earned;
        setCompletedIds(newC); setXp(newX);
        await Promise.all([AsyncStorage.setItem(STORAGE_KEY(email), JSON.stringify([...newC])), AsyncStorage.setItem(XP_KEY(email), String(newX))]);
    },[selectedEx, completedIds, xp, email]);

    const handleWrong = useCallback(()=>loseLife(),[loseLife]);
    const handleLifeRestored = ()=>{ if(pendingRef.current){ setSelectedEx(pendingRef.current); setQuizVisible(true); pendingRef.current=null; }};

    // Agrupar paradas por nível para separadores
    const levels = (['advanced','intermediate','basic'] as const);

    return (
        <SafeAreaView style={ss.container} edges={['top','left','right']}>
            {/* Header */}
            <Animated.View entering={FadeIn.duration(400)} style={ss.header}>
                <TouchableOpacity onPress={()=>router.back()} style={ss.backBtn}>
                    <ChevronLeft size={22} color="#fff" strokeWidth={2.5}/>
                </TouchableOpacity>
                <View style={{flex:1}}>
                    <Text style={ss.headerSub}>Trilha</Text>
                    <Text style={ss.headerTitle}>{trail.label} {trail.icon}</Text>
                </View>
                <LivesBar/>
            </Animated.View>

            <ScrollView contentContainerStyle={ss.trail} showsVerticalScrollIndicator={false}>
                {/* Fim */}
                <Animated.View entering={FadeInDown.delay(60).duration(400)} style={ss.cap}>
                    <Text style={{fontSize:36}}>🏆</Text>
                    <Text style={ss.capText}>Fim da Trilha</Text>
                </Animated.View>

                {/* Paradas invertidas (topo = última) com separadores de nível */}
                {levels.map(lvl => {
                    const stopsInLevel = [...trail.stops].filter(s=>s.level===lvl);
                    if(!stopsInLevel.length) return null;
                    return (
                        <View key={lvl}>
                            {/* Separador de nível */}
                            <Animated.View entering={FadeInDown.duration(300)} style={[ss.lvlSep, {borderColor: LEVEL_COLORS[lvl]+'40'}]}>
                                <View style={[ss.lvlLine, {backgroundColor: LEVEL_COLORS[lvl]}]}/>
                                <Text style={[ss.lvlLabel, {color: LEVEL_COLORS[lvl]}]}>{LEVEL_LABELS[lvl]}</Text>
                                <View style={[ss.lvlLine, {backgroundColor: LEVEL_COLORS[lvl]}]}/>
                            </Animated.View>

                            {/* Paradas deste nível */}
                            {[...stopsInLevel].reverse().map((stop,i)=>{
                                const originalIdx = trail.stops.indexOf(stop);
                                const status = getStatus(stop, originalIdx);
                                const isLeft = originalIdx % 2 === 0;
                                return (
                                    <Animated.View key={stop.id} entering={FadeInDown.delay(80+i*60).duration(400)}>
                                        <Node stop={stop} status={status} onPress={()=>openStop(stop)} isLeft={isLeft}/>
                                        {i < stopsInLevel.length-1 && (
                                            <View style={[ss.connector, isLeft?ss.connL:ss.connR]}>
                                                {[...Array(4)].map((_,d)=>(
                                                    <View key={d} style={[ss.dot, {backgroundColor: status==='completed'? trail.color:'#2a2040'}]}/>
                                                ))}
                                            </View>
                                        )}
                                    </Animated.View>
                                );
                            })}
                        </View>
                    );
                })}

                {/* Início */}
                <Animated.View entering={FadeInDown.delay(500).duration(400)} style={ss.cap}>
                    <Text style={{fontSize:32}}>🚀</Text>
                    <Text style={[ss.capText, {color:'#6b6880', fontSize:13}]}>Início</Text>
                </Animated.View>
                <View style={{height:80}}/>
            </ScrollView>

            <StopModal stop={selectedStop} visible={stopVisible} onClose={()=>setStopVisible(false)} completedIds={completedIds}
                onSelect={ex=>{ setStopVisible(false); setTimeout(()=>openQuiz(ex),300); }}/>
            <QuizModal exercise={selectedEx} visible={quizVisible}
                onClose={()=>{ setQuizVisible(false); setStopVisible(true); }}
                onCorrect={handleCorrect} onWrong={handleWrong}/>
            <NoLivesModal visible={showNoLives} onClose={()=>setShowNoLives(false)} onLifeRestored={handleLifeRestored}/>
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
    container: {flex:1, backgroundColor:'#0d0d10'},
    header: {flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:16, paddingVertical:12, borderBottomWidth:1, borderBottomColor:'#1e1c2e'},
    backBtn: {width:36, height:36, borderRadius:12, backgroundColor:'#1e1c2e', alignItems:'center', justifyContent:'center'},
    headerSub: {color:'#6b6880', fontSize:11, fontWeight:'600'},
    headerTitle: {color:'#fff', fontSize:17, fontWeight:'900'},
    trail: {alignItems:'center', paddingTop:16},
    cap: {alignItems:'center', marginVertical:12, gap:4},
    capText: {color:'#FFD700', fontSize:14, fontWeight:'800'},
    lvlSep: {flexDirection:'row', alignItems:'center', marginVertical:20, paddingHorizontal:20, gap:10},
    lvlLine: {flex:1, height:1, opacity:0.5},
    lvlLabel: {fontSize:12, fontWeight:'800', letterSpacing:1},
    nodeRow: {width:SW, alignItems:'center', marginVertical:4},
    nodeL: {alignItems:'flex-start', paddingLeft:SW*0.18},
    nodeR: {alignItems:'flex-end', paddingRight:SW*0.18},
    node: {width:72, height:72, borderRadius:36, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'#2a2040', backgroundColor:'#16151d'},
    nodeIcon: {fontSize:26},
    nodeLabel: {alignItems:'center', marginTop:6},
    nodeName: {color:'#d4d0e8', fontSize:13, fontWeight:'700'},
    nodeSub: {color:'#6b6880', fontSize:11, marginTop:2},
    pulse: {position:'absolute', width:88, height:88, borderRadius:44, borderWidth:3, top:-8, left:-8},
    connector: {height:32, justifyContent:'space-around', alignItems:'center'},
    connL: {alignSelf:'flex-start', marginLeft:SW*0.18+32},
    connR: {alignSelf:'flex-end', marginRight:SW*0.18+32},
    dot: {width:5, height:5, borderRadius:2.5},
});

const ms = StyleSheet.create({
    overlay: {flex:1, backgroundColor:'rgba(0,0,0,0.8)', justifyContent:'flex-end'},
    card: {backgroundColor:'#16151d', borderTopLeftRadius:28, borderTopRightRadius:28, padding:24, gap:14, borderWidth:1, borderColor:'#2a2040'},
    header: {flexDirection:'row', alignItems:'center', gap:14, paddingBottom:14, borderBottomWidth:1},
    icon: {fontSize:26},
    title: {color:'#fff', fontSize:16, fontWeight:'800'},
    sub: {color:'#7a7590', fontSize:12},
    xpBadge: {marginLeft:'auto', borderRadius:10, paddingHorizontal:9, paddingVertical:4, borderWidth:1},
    xpText: {fontSize:12, fontWeight:'800'},
    row: {flexDirection:'row', alignItems:'center', gap:14, padding:14, borderRadius:16, backgroundColor:'#1e1c2e', borderWidth:1, borderColor:'#2a2040'},
    rowDone: {opacity:0.6},
    num: {width:30, height:30, borderRadius:15, backgroundColor:'#2a2040', alignItems:'center', justifyContent:'center'},
    numTxt: {color:'#fff', fontSize:12, fontWeight:'800'},
    exTitle: {color:'#d4d0e8', fontSize:13, fontWeight:'700'},
    exDesc: {color:'#6b6880', fontSize:11, marginTop:2},
    exXp: {fontSize:12, fontWeight:'700'},
    closeBtn: {backgroundColor:'#1e1c2e', borderRadius:14, padding:14, alignItems:'center', borderWidth:1, borderColor:'#2a2040'},
    closeBtnTxt: {color:'#6b6880', fontSize:13, fontWeight:'600'},
});

const qs = StyleSheet.create({
    overlay: {flex:1, backgroundColor:'rgba(0,0,0,0.85)', justifyContent:'flex-end'},
    card: {backgroundColor:'#16151d', borderTopLeftRadius:28, borderTopRightRadius:28, padding:22, gap:12, borderWidth:1, borderColor:'#2a2040', maxHeight:'90%'},
    header: {flexDirection:'row', justifyContent:'space-between', alignItems:'center'},
    cat: {color:'#6b6880', fontSize:10, fontWeight:'800', letterSpacing:1},
    xp: {color:'#8b5cf6', fontSize:13, fontWeight:'800'},
    detail: {color:'#9aa0aa', fontSize:12, lineHeight:18},
    divider: {height:1, backgroundColor:'#2a2040'},
    question: {color:'#fff', fontSize:15, fontWeight:'700', lineHeight:21},
    opt: {flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'#1e1c2e', borderRadius:14, padding:13, borderWidth:1, borderColor:'#2a2040'},
    optOk:  {backgroundColor:'#10b98120', borderColor:'#10b981'},
    optBad: {backgroundColor:'#ef444420', borderColor:'#ef4444'},
    optDim: {opacity:0.4},
    optLetter: {color:'#8b5cf6', fontSize:12, fontWeight:'900', width:20, height:20, borderRadius:10, backgroundColor:'#8b5cf620', textAlign:'center', lineHeight:20},
    optText: {color:'#d4d0e8', fontSize:13, flex:1},
    exp: {flexDirection:'row', gap:10, padding:13, borderRadius:14, alignItems:'flex-start'},
    expOk:  {backgroundColor:'#10b98115', borderWidth:1, borderColor:'#10b98130'},
    expBad: {backgroundColor:'#ef444415', borderWidth:1, borderColor:'#ef444430'},
    expText: {fontSize:12, lineHeight:18, flex:1},
    btn: {backgroundColor:'#8b5cf6', borderRadius:14, padding:15, alignItems:'center'},
    btnTxt: {color:'#fff', fontSize:14, fontWeight:'800'},
});
