// src/screens/TrailScreen.tsx — Duolingo-style fullscreen quiz (Option B)
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
    FadeIn, FadeInDown, FadeInUp,
    useSharedValue, useAnimatedStyle,
    withRepeat, withSequence, withTiming, withSpring,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useLives } from '../context/LivesContext';
import LivesBar from '../components/common/LivesBar';
import NoLivesModal from '../components/common/NoLivesModal';
import { EXERCISES, type Exercise } from '../data/exercises';
import { getTrailForArea, type TrailStop } from '../data/trail';
import type { StudyArea } from '../services/ai.service';
import { ChevronLeft, Lock, Crown, Star, CheckCircle2, XCircle, X, Rocket, Trophy } from 'lucide-react-native';

const { width: SW } = Dimensions.get('window');
const STORAGE_KEY = (e: string) => `DEVTRACK_TRAIL_${e}`;
const XP_KEY      = (e: string) => `DEVTRACK_XP_${e}`;

const C_BG     = '#131f24';
const C_CARD   = '#16151d';
const C_BORDER = '#212b31';
const C_DEEP   = '#161c20';
const C_GOLD   = '#ffc800';
const C_GOLD_D = '#e5b400';
const C_GREEN  = '#58cc02';
const C_GREEN_D= '#58a700';
const C_RED    = '#ff4b4b';
const C_RED_D  = '#ea2b2b';
const C_BLUE   = '#1cb0f6';
const C_PURPLE = '#ce82ff';

const LEVEL_LABELS = { basic: 'NÍVEL 1 · BÁSICO', intermediate: 'NÍVEL 2 · INTERMEDIÁRIO', advanced: 'NÍVEL 3 · AVANÇADO' };
const LEVEL_COLORS = { basic: C_GREEN, intermediate: C_BLUE, advanced: C_PURPLE };
const LEVEL_BD     = { basic: C_GREEN_D, intermediate: '#1899d6', advanced: '#a568cc' };

const AMPLITUDE = SW * 0.22;
const FREQ      = 0.55;
const getOffsetX = (i: number) => Math.sin(i * FREQ) * AMPLITUDE;

const darken = (hex: string) => {
    const h = hex.replace('#','');
    const r = Math.max(0, parseInt(h.slice(0,2),16)-45);
    const g = Math.max(0, parseInt(h.slice(2,4),16)-45);
    const b = Math.max(0, parseInt(h.slice(4,6),16)-45);
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
};

// ── PulseRing ──────────────────────────────────────────────────────────────────
function PulseRing({ color }: { color: string }) {
    const s = useSharedValue(1), o = useSharedValue(0.7);
    useEffect(() => {
        s.value = withRepeat(withSequence(withTiming(1.4,{duration:900}),withTiming(1,{duration:900})),-1,true);
        o.value = withRepeat(withSequence(withTiming(0,{duration:900}),withTiming(0.5,{duration:900})),-1,true);
    },[]);
    const st = useAnimatedStyle(()=>({transform:[{scale:s.value}],opacity:o.value}));
    return <Animated.View style={[ss.pulse,{backgroundColor:color+'50'},st]}/>;
}

// ── Node ───────────────────────────────────────────────────────────────────────
type StopStatus = 'completed'|'active'|'locked';
function Node({ stop, status, onPress, di }: { stop:TrailStop; status:StopStatus; onPress:()=>void; di:number }) {
    const scale = useSharedValue(1);
    const ox = getOffsetX(di);
    const aStyle = useAnimatedStyle(()=>({transform:[{scale:scale.value},{translateX:ox}]}));
    const bg = status==='locked'?'#37464f':status==='completed'?C_GOLD:stop.color;
    const bd = status==='locked'?C_BORDER:status==='completed'?C_GOLD_D:darken(stop.color);
    return (
        <View style={ss.nodeRow}>
            <Pressable onPressIn={()=>scale.value=withSpring(0.88)} onPressOut={()=>scale.value=withSpring(1)} onPress={onPress} disabled={status==='locked'}>
                <Animated.View style={[ss.nodeWrapper,aStyle]}>
                    {status==='active'&&<PulseRing color={stop.color}/>}
                    <View style={[ss.node,{backgroundColor:bg,borderBottomColor:bd}]}>
                        {status==='locked'
                            ?<Lock size={24} color="#7a8c96" strokeWidth={2.5}/>
                            :status==='completed'
                                ?<CheckCircle2 size={26} color="#fff" strokeWidth={3}/>
                                :<Star size={26} color="#fff" fill="#fff" strokeWidth={2}/>}
                    </View>
                    <View style={[ss.floatingLabel,status==='locked'&&{borderColor:'#37464f'}]}>
                        <Text style={[ss.nodeName,status==='locked'&&{color:'#6b6880'}]} numberOfLines={1}>{stop.title}</Text>
                    </View>
                </Animated.View>
            </Pressable>
        </View>
    );
}

// ── Connectors ─────────────────────────────────────────────────────────────────
function Connectors({ fromIdx, color }: { fromIdx:number; color:string }) {
    return (
        <View style={ss.connectorWrap}>
            {[0,1,2,3].map(i=>{
                const frac=(i+1)/5;
                return <View key={i} style={[ss.dot,{transform:[{translateX:getOffsetX(fromIdx+frac)}],backgroundColor:color}]}/>;
            })}
        </View>
    );
}

// ── Fullscreen Quiz ─────────────────────────────────────────────────────────────
function FullscreenQuiz({
    stop, visible, completedIds, onClose, onExerciseComplete, onNoLives
}: {
    stop:TrailStop|null; visible:boolean; completedIds:Set<string>;
    onClose:()=>void; onExerciseComplete:(id:string,xp:number)=>void; onNoLives:()=>void;
}) {
    const { lives, loseLife, isInfinite } = useLives();
    const [exIdx,  setExIdx]  = useState(0);
    const [sel,    setSel]    = useState<number|null>(null);
    const [ans,    setAns]    = useState(false);
    const [done,   setDone]   = useState(false);
    const [earned, setEarned] = useState(0);

    const feedY  = useSharedValue(300);
    const shakeX = useSharedValue(0);
    const feedStyle  = useAnimatedStyle(()=>({transform:[{translateY:feedY.value}]}));
    const shakeStyle = useAnimatedStyle(()=>({transform:[{translateX:shakeX.value}]}));

    const exercises = stop ? stop.exerciseIds.map(id=>EXERCISES.find(e=>e.id===id)).filter(Boolean) as Exercise[] : [];
    const ex = exercises[exIdx];
    const isCorrect = sel === ex?.quiz.correctIndex;
    const progress = exercises.length > 0 ? (exIdx / exercises.length) : 0;
    const progressAnim = useSharedValue(0);
    const progressStyle = useAnimatedStyle(()=>({width:`${progressAnim.value*100}%` as any}));

    useEffect(()=>{ if(visible){ setExIdx(0);setSel(null);setAns(false);setDone(false);setEarned(0);feedY.value=300;progressAnim.value=0; }}, [visible]);

    const handleAnswer = (i:number) => {
        if(ans||!ex) return;
        setSel(i); setAns(true);
        if(i===ex.quiz.correctIndex){
            setEarned(p=>p+ex.xp);
            onExerciseComplete(ex.id, ex.xp);
            feedY.value = withSpring(0,{damping:18});
            progressAnim.value = withTiming((exIdx+1)/exercises.length, {duration:600});
        } else {
            const hasLife = loseLife();
            shakeX.value = withSequence(
                withTiming(-10,{duration:60}),withTiming(10,{duration:60}),
                withTiming(-7,{duration:60}),withTiming(7,{duration:60}),withTiming(0,{duration:60})
            );
            feedY.value = withSpring(0,{damping:18});
            if(!hasLife&&!isInfinite){ setTimeout(()=>{ onClose(); onNoLives(); },700); }
        }
    };

    const handleContinue = () => {
        if(!ans) return;
        feedY.value = withTiming(300,{duration:250});
        setTimeout(()=>{
            if(isCorrect && exIdx >= exercises.length-1){ setDone(true); }
            else if(!isCorrect && (lives-1)<=0 && !isInfinite){ onClose(); onNoLives(); }
            else { setExIdx(i=>i+1); setSel(null); setAns(false); }
        },260);
    };

    if(!stop||!ex) return null;
    const segColor = ans? (isCorrect?C_GREEN:C_RED) : stop.color;

    return (
        <Modal visible={visible} animationType="slide" statusBarTranslucent>
            <SafeAreaView style={qs.container} edges={['top','left','right']}>

                {!done ? (<>
                    {/* Header */}
                    <View style={qs.header}>
                        <TouchableOpacity onPress={onClose} style={qs.closeBtn}>
                            <X size={22} color="#afb6b9" strokeWidth={2.5}/>
                        </TouchableOpacity>
                        <View style={qs.progressTrack}>
                            <Animated.View style={[qs.progressBar,progressStyle,{backgroundColor:stop.color}]}/>
                        </View>
                        <LivesBar/>
                    </View>

                    {/* Exercise counter */}
                    <Text style={qs.exCounter}>{exIdx+1} de {exercises.length}</Text>

                    <ScrollView contentContainerStyle={qs.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {/* Context */}
                        <View style={[qs.contextCard,{borderColor:stop.color+'40'}]}>
                            <Text style={qs.contextText} numberOfLines={5}>{ex.detail}</Text>
                        </View>

                        {/* Question */}
                        <Text style={qs.question}>{ex.quiz.question}</Text>

                        {/* Options */}
                        <Animated.View style={shakeStyle}>
                            {ex.quiz.options.map((opt,i)=>{
                                let bg=C_CARD, bd=C_BORDER, bdb=C_DEEP, tc='#fff';
                                if(ans){
                                    if(i===ex.quiz.correctIndex){bg='#58cc0220';bd=C_GREEN;bdb=C_GREEN_D;}
                                    else if(i===sel){bg='#ff4b4b20';bd=C_RED;bdb=C_RED_D;}
                                    else{bg=C_CARD;bd=C_BORDER;bdb=C_DEEP;}
                                }
                                const letterBg = !ans?stop.color+'30':i===ex.quiz.correctIndex?C_GREEN+'30':i===sel?C_RED+'30':'#37464f30';
                                const letterCol= !ans?stop.color:i===ex.quiz.correctIndex?C_GREEN:i===sel?C_RED:'#6b6880';
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[qs.option,{backgroundColor:bg,borderColor:bd,borderBottomColor:bdb},ans&&i!==ex.quiz.correctIndex&&i!==sel&&{opacity:0.5}]}
                                        onPress={()=>handleAnswer(i)}
                                        disabled={ans}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[qs.letter,{backgroundColor:letterBg}]}>
                                            <Text style={[qs.letterTxt,{color:letterCol}]}>{String.fromCharCode(65+i)}</Text>
                                        </View>
                                        <Text style={[qs.optText,ans&&i!==ex.quiz.correctIndex&&i!==sel&&{color:'#6b6880'}]}>{opt}</Text>
                                        {ans&&i===ex.quiz.correctIndex&&<CheckCircle2 size={20} color={C_GREEN} strokeWidth={3}/>}
                                        {ans&&i===sel&&i!==ex.quiz.correctIndex&&<XCircle size={20} color={C_RED} strokeWidth={3}/>}
                                    </TouchableOpacity>
                                );
                            })}
                        </Animated.View>
                        <View style={{height:200}}/>
                    </ScrollView>

                    {/* Feedback panel */}
                    {ans&&(
                        <Animated.View style={[qs.feedPanel,{backgroundColor:isCorrect?C_GREEN_D:C_RED_D},feedStyle]}>
                            <View style={qs.feedContent}>
                                {isCorrect
                                    ?<CheckCircle2 size={28} color="#fff" strokeWidth={3}/>
                                    :<XCircle size={28} color="#fff" strokeWidth={3}/>}
                                <View style={{flex:1}}>
                                    <Text style={qs.feedTitle}>{isCorrect?'Correto!':'Errado!'}</Text>
                                    <Text style={qs.feedExp} numberOfLines={3}>{ex.quiz.explanation}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={[qs.continueBtn,{backgroundColor:isCorrect?C_GREEN:C_RED,borderBottomColor:isCorrect?C_GREEN_D:C_RED_D}]} onPress={handleContinue}>
                                <Text style={qs.continueBtnTxt}>CONTINUAR</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                    {!ans&&(
                        <View style={qs.feedPanel}>
                            <TouchableOpacity style={[qs.continueBtn,{backgroundColor:'#37464f',borderBottomColor:C_BORDER}]} onPress={onClose}>
                                <Text style={[qs.continueBtnTxt,{color:'#afb6b9'}]}>SAIR</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>) : (
                    // Completion screen
                    <Animated.View entering={FadeInUp.springify()} style={qs.completionWrap}>
                        <View style={[qs.trophyCircle,{backgroundColor:stop.color,borderBottomColor:darken(stop.color)}]}>
                            <Trophy size={48} color="#fff" strokeWidth={2}/>
                        </View>
                        <Text style={qs.compTitle}>Parada Concluída!</Text>
                        <Text style={qs.compSub}>{stop.title}</Text>
                        <View style={qs.xpBadge}>
                            <Star size={18} color={C_GOLD} fill={C_GOLD}/>
                            <Text style={qs.xpBadgeTxt}>+{earned} XP ganhos</Text>
                        </View>
                        <TouchableOpacity style={[qs.continueBtn,{backgroundColor:C_GREEN,borderBottomColor:C_GREEN_D,width:'100%',marginTop:32}]} onPress={onClose}>
                            <Text style={qs.continueBtnTxt}>CONTINUAR</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </SafeAreaView>
        </Modal>
    );
}

// ── Main Screen ─────────────────────────────────────────────────────────────────
export default function TrailScreen({ area }: { area: StudyArea }) {
    const router = useRouter();
    const { user } = useAuth();
    const email = user?.email ?? 'guest';
    const trail = getTrailForArea(area);

    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
    const [xp, setXp]                     = useState(0);
    const [activeStop, setActiveStop]      = useState<TrailStop|null>(null);
    const [quizVisible, setQuizVisible]    = useState(false);
    const [showNoLives, setShowNoLives]    = useState(false);
    const { lives } = useLives();

    useEffect(()=>{
        (async()=>{
            const [c,x] = await Promise.all([AsyncStorage.getItem(STORAGE_KEY(email)),AsyncStorage.getItem(XP_KEY(email))]);
            if(c) setCompletedIds(new Set(JSON.parse(c)));
            if(x) setXp(parseInt(x,10)||0);
        })();
    },[email]);

    const getStatus = (stop:TrailStop, idx:number): StopStatus => {
        if(stop.exerciseIds.every(id=>completedIds.has(id))) return 'completed';
        if(idx===0) return 'active';
        const prev = trail.stops[idx-1];
        return prev.exerciseIds.every(id=>completedIds.has(id)) ? 'active' : 'locked';
    };

    const openStop = (stop:TrailStop) => {
        if(lives<=0){ setShowNoLives(true); return; }
        setActiveStop(stop); setQuizVisible(true);
    };

    const handleExerciseComplete = useCallback(async(id:string, earned:number)=>{
        const newC = new Set([...completedIds, id]);
        const newX = xp + earned;
        setCompletedIds(newC); setXp(newX);
        await Promise.all([
            AsyncStorage.setItem(STORAGE_KEY(email), JSON.stringify([...newC])),
            AsyncStorage.setItem(XP_KEY(email), String(newX)),
        ]);
    },[completedIds, xp, email]);

    const LEVELS = (['basic','intermediate','advanced'] as const);
    let di = 0; // display index for sine wave (0 = top)

    return (
        <SafeAreaView style={ss.container} edges={['top','left','right']}>
            {/* Header */}
            <Animated.View entering={FadeIn.duration(400)} style={ss.header}>
                <TouchableOpacity onPress={()=>router.back()} style={ss.backBtn}>
                    <ChevronLeft size={24} color="#fff" strokeWidth={3}/>
                </TouchableOpacity>
                <View style={{flex:1,alignItems:'center',paddingRight:36}}>
                    <Text style={ss.headerTitle}>{trail.label}</Text>
                </View>
                <LivesBar/>
            </Animated.View>

            <ScrollView contentContainerStyle={ss.trail} showsVerticalScrollIndicator={false}>

                {/* ── Start cap ── */}
                <Animated.View entering={FadeInDown.delay(40).duration(400)} style={ss.cap}>
                    <View style={[ss.capCircle,{backgroundColor:'#37464f',borderBottomColor:C_BORDER}]}>
                        <Rocket size={30} color="#afb6b9" strokeWidth={2}/>
                    </View>
                    <Text style={ss.capLabel}>Início</Text>
                </Animated.View>

                {/* ── Levels: basic → intermediate → advanced ── */}
                {LEVELS.map(lvl => {
                    const stops = trail.stops.filter(s=>s.level===lvl);
                    if(!stops.length) return null;
                    return (
                        <View key={lvl} style={ss.levelSection}>
                            {/* Level header */}
                            <Animated.View entering={FadeInDown.duration(300)} style={[ss.levelHeader,{backgroundColor:LEVEL_COLORS[lvl],borderBottomColor:LEVEL_BD[lvl]}]}>
                                <Text style={ss.levelLabel}>{LEVEL_LABELS[lvl]}</Text>
                            </Animated.View>

                            {stops.map((stop,i)=>{
                                const origIdx = trail.stops.indexOf(stop);
                                const status  = getStatus(stop, origIdx);
                                const curDi   = di++;
                                const isLast  = i === stops.length-1 && lvl==='advanced';
                                const connColor = status==='completed'?C_GOLD : C_BORDER;
                                return (
                                    <Animated.View key={stop.id} entering={FadeInDown.delay(80+curDi*50).duration(400)}>
                                        <Node stop={stop} status={status} onPress={()=>openStop(stop)} di={curDi}/>
                                        {!isLast && (
                                            <Connectors fromIdx={curDi} color={connColor}/>
                                        )}
                                    </Animated.View>
                                );
                            })}
                        </View>
                    );
                })}

                {/* ── End cap (trophy) ── */}
                <Animated.View entering={FadeInDown.delay(500).duration(400)} style={[ss.cap,{marginTop:16}]}>
                    <View style={[ss.capCircle,{backgroundColor:C_GOLD,borderBottomColor:C_GOLD_D}]}>
                        <Crown size={30} color="#fff" strokeWidth={2.5}/>
                    </View>
                    <Text style={[ss.capLabel,{color:C_GOLD}]}>Meta Final</Text>
                </Animated.View>

                <View style={{height:120}}/>
            </ScrollView>

            <FullscreenQuiz
                stop={activeStop}
                visible={quizVisible}
                completedIds={completedIds}
                onClose={()=>setQuizVisible(false)}
                onExerciseComplete={handleExerciseComplete}
                onNoLives={()=>{ setQuizVisible(false); setShowNoLives(true); }}
            />
            <NoLivesModal
                visible={showNoLives}
                onClose={()=>setShowNoLives(false)}
                onLifeRestored={()=>{ if(activeStop){ setQuizVisible(true); } }}
            />
        </SafeAreaView>
    );
}

// ── Trail Styles ───────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
    container:    { flex:1, backgroundColor:C_BG },
    header:       { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:2, borderBottomColor:C_BORDER },
    backBtn:      { padding:4 },
    headerTitle:  { color:'#fff', fontSize:17, fontWeight:'900', textTransform:'uppercase', letterSpacing:1 },
    trail:        { alignItems:'center', paddingTop:20 },
    levelSection: { width:'100%', alignItems:'center', marginBottom:8 },
    levelHeader:  { width:'88%', borderRadius:16, padding:14, marginBottom:24, marginTop:8, borderBottomWidth:5, alignItems:'center' },
    levelLabel:   { color:'#fff', fontSize:15, fontWeight:'900', letterSpacing:1 },
    cap:          { alignItems:'center', marginBottom:20 },
    capCircle:    { width:70, height:70, borderRadius:35, alignItems:'center', justifyContent:'center', borderBottomWidth:6 },
    capLabel:     { color:'#afb6b9', fontSize:13, fontWeight:'800', textTransform:'uppercase', marginTop:8, letterSpacing:0.5 },
    nodeRow:      { width:SW, alignItems:'center', marginVertical:0, zIndex:10 },
    nodeWrapper:  { alignItems:'center', justifyContent:'center' },
    node:         { width:68, height:68, borderRadius:34, alignItems:'center', justifyContent:'center', borderBottomWidth:8 },
    floatingLabel:{ position:'absolute', top:-26, backgroundColor:'#fff', paddingHorizontal:10, paddingVertical:4, borderRadius:10, borderWidth:2, borderColor:'#e5e5e5', zIndex:20 },
    nodeName:     { color:'#37464f', fontSize:11, fontWeight:'900', textTransform:'uppercase' },
    pulse:        { position:'absolute', width:84, height:84, borderRadius:42 },
    connectorWrap:{ height:60, justifyContent:'space-evenly', alignItems:'center', zIndex:1 },
    dot:          { width:10, height:10, borderRadius:5 },
});

// ── Quiz Styles ────────────────────────────────────────────────────────────────
const qs = StyleSheet.create({
    container:     { flex:1, backgroundColor:C_BG },
    header:        { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:12, gap:12, borderBottomWidth:2, borderBottomColor:C_BORDER },
    closeBtn:      { padding:4 },
    progressTrack: { flex:1, height:12, backgroundColor:C_BORDER, borderRadius:6, overflow:'hidden' },
    progressBar:   { height:'100%', borderRadius:6 },
    exCounter:     { color:'#afb6b9', fontSize:12, fontWeight:'800', textAlign:'center', marginTop:8, letterSpacing:1, textTransform:'uppercase' },
    body:          { paddingHorizontal:16, paddingTop:12, gap:14 },
    contextCard:   { backgroundColor:C_CARD, borderRadius:16, padding:16, borderWidth:2, borderBottomWidth:5, borderColor:C_BORDER, borderBottomColor:C_DEEP },
    contextText:   { color:'#afb6b9', fontSize:13, lineHeight:20, fontWeight:'600' },
    question:      { color:'#fff', fontSize:18, fontWeight:'900', lineHeight:26 },
    option:        { flexDirection:'row', alignItems:'center', gap:12, borderRadius:18, padding:16, borderWidth:2, borderBottomWidth:5 },
    letter:        { width:34, height:34, borderRadius:17, alignItems:'center', justifyContent:'center', flexShrink:0 },
    letterTxt:     { fontSize:14, fontWeight:'900' },
    optText:       { color:'#fff', fontSize:15, flex:1, fontWeight:'700', lineHeight:20 },
    feedPanel:     { position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#16151d', padding:20, paddingBottom:32, borderTopWidth:2, borderTopColor:C_BORDER, gap:14 },
    feedContent:   { flexDirection:'row', gap:14, alignItems:'flex-start' },
    feedTitle:     { color:'#fff', fontSize:17, fontWeight:'900', marginBottom:4 },
    feedExp:       { color:'rgba(255,255,255,0.85)', fontSize:13, lineHeight:19, fontWeight:'600' },
    continueBtn:   { borderRadius:16, padding:18, alignItems:'center', borderBottomWidth:5 },
    continueBtnTxt:{ color:'#fff', fontSize:16, fontWeight:'900', letterSpacing:1 },
    completionWrap:{ flex:1, alignItems:'center', justifyContent:'center', padding:32 },
    trophyCircle:  { width:110, height:110, borderRadius:55, alignItems:'center', justifyContent:'center', borderBottomWidth:8, marginBottom:24 },
    compTitle:     { color:'#fff', fontSize:28, fontWeight:'900', textAlign:'center' },
    compSub:       { color:'#afb6b9', fontSize:16, fontWeight:'700', marginTop:8, textAlign:'center' },
    xpBadge:       { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:C_GOLD+'20', borderRadius:16, paddingHorizontal:20, paddingVertical:10, marginTop:16, borderWidth:2, borderColor:C_GOLD },
    xpBadgeTxt:    { color:C_GOLD, fontSize:16, fontWeight:'900' },
});
