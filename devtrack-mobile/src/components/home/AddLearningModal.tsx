// src/components/home/AddLearningModal.tsx
// Modal fullscreen de 3 etapas — igual ao estilo das atividades/trilhas.
// Área → Stack → Tipo gera texto automaticamente.

import React, { useState, useCallback, useEffect } from 'react';
import {
    Modal, View, Text, StyleSheet, TouchableOpacity,
    TextInput, Pressable, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeInDown, FadeInRight, FadeOutLeft,
    SlideInRight, SlideOutLeft, SlideInLeft, SlideOutRight,
    useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
import {
    X, Check, ChevronRight, ChevronLeft,
    Code2, Server, Layers, Smartphone, Cloud, Shield,
    BookOpen, Bug, Zap, Wrench, Lightbulb, Eye,
} from 'lucide-react-native';

const { width: SW } = Dimensions.get('window');

// ─── Tipos internos ────────────────────────────────────────────────────────────
type Area         = { id: string; label: string; emoji: string; color: string; Icon: any };
type Stack        = { id: string; label: string; area: string[] };
type LearningType = { id: string; label: string; emoji: string; template: string; Icon: any };

const AREAS: Area[] = [
    { id: 'frontend',  label: 'Frontend',  emoji: '🎨', color: '#06b6d4', Icon: Code2       },
    { id: 'backend',   label: 'Backend',   emoji: '⚙️', color: '#10b981', Icon: Server      },
    { id: 'mobile',    label: 'Mobile',    emoji: '📱', color: '#f59e0b', Icon: Smartphone  },
    { id: 'devops',    label: 'DevOps',    emoji: '☁️', color: '#8b5cf6', Icon: Cloud       },
    { id: 'fullstack', label: 'Fullstack', emoji: '🧱', color: '#e879f9', Icon: Layers      },
    { id: 'security',  label: 'Security',  emoji: '🔐', color: '#ef4444', Icon: Shield      },
];

const STACKS: Stack[] = [
    { id: 'React',          label: 'React',          area: ['frontend', 'fullstack'] },
    { id: 'React Native',   label: 'React Native',   area: ['mobile', 'frontend', 'fullstack'] },
    { id: 'TypeScript',     label: 'TypeScript',     area: ['frontend', 'backend', 'fullstack', 'mobile'] },
    { id: 'CSS',            label: 'CSS',            area: ['frontend'] },
    { id: 'Next.js',        label: 'Next.js',        area: ['frontend', 'fullstack'] },
    { id: 'Tailwind',       label: 'Tailwind',       area: ['frontend'] },
    { id: 'Vue',            label: 'Vue',            area: ['frontend', 'fullstack'] },
    { id: 'HTML',           label: 'HTML',           area: ['frontend'] },
    { id: 'Node.js',        label: 'Node.js',        area: ['backend', 'fullstack'] },
    { id: 'Python',         label: 'Python',         area: ['backend', 'fullstack', 'devops'] },
    { id: 'PostgreSQL',     label: 'PostgreSQL',     area: ['backend', 'fullstack'] },
    { id: 'MongoDB',        label: 'MongoDB',        area: ['backend', 'fullstack'] },
    { id: 'GraphQL',        label: 'GraphQL',        area: ['backend', 'fullstack'] },
    { id: 'REST API',       label: 'REST API',       area: ['backend', 'fullstack'] },
    { id: 'Java',           label: 'Java',           area: ['backend'] },
    { id: 'Go',             label: 'Go',             area: ['backend', 'devops'] },
    { id: 'Docker',         label: 'Docker',         area: ['devops', 'backend'] },
    { id: 'AWS',            label: 'AWS',            area: ['devops', 'backend'] },
    { id: 'Git',            label: 'Git',            area: ['frontend', 'backend', 'fullstack', 'devops', 'mobile', 'security'] },
    { id: 'CI/CD',          label: 'CI/CD',          area: ['devops'] },
    { id: 'Firebase',       label: 'Firebase',       area: ['mobile', 'frontend', 'fullstack'] },
    { id: 'Expo',           label: 'Expo',           area: ['mobile'] },
    { id: 'Swift',          label: 'Swift',          area: ['mobile'] },
    { id: 'Kotlin',         label: 'Kotlin',         area: ['mobile'] },
    { id: 'JWT',            label: 'JWT',            area: ['security', 'backend'] },
    { id: 'OAuth',          label: 'OAuth',          area: ['security', 'backend'] },
];

const LEARNING_TYPES: LearningType[] = [
    { id: 'concept',  label: 'Conceito',       emoji: '💡', template: 'Aprendi o conceito de {stack}',       Icon: Lightbulb },
    { id: 'bug',      label: 'Bug resolvido',  emoji: '🐛', template: 'Resolvi um bug em {stack}',           Icon: Bug       },
    { id: 'project',  label: 'Projeto',        emoji: '🛠',  template: 'Implementei algo com {stack}',        Icon: Wrench    },
    { id: 'reading',  label: 'Leitura/Docs',   emoji: '📖', template: 'Li sobre {stack}',                    Icon: BookOpen  },
    { id: 'tip',      label: 'Dica',           emoji: '⚡', template: 'Descobri uma dica de {stack}',        Icon: Zap       },
    { id: 'review',   label: 'Revisão',        emoji: '👁',  template: 'Revisei conceitos de {stack}',        Icon: Eye       },
];

function buildText(type: LearningType, stacks: string[]): string {
    const stackLabel = stacks.length === 0 ? 'programação'
        : stacks.length === 1 ? stacks[0]
        : stacks.slice(0, -1).join(', ') + ' e ' + stacks[stacks.length - 1];
    return type.template.replace('{stack}', stackLabel);
}

// ─── Barra de progresso ────────────────────────────────────────────────────────
function ProgressBar({ step, total, color }: { step: number; total: number; color: string }) {
    const prog = useSharedValue(0);
    prog.value = withTiming(step / total, { duration: 400 });
    const barStyle = useAnimatedStyle(() => ({ width: `${prog.value * 100}%` as any }));
    return (
        <View style={fs.progressTrack}>
            <Animated.View style={[fs.progressBar, { backgroundColor: color }, barStyle]} />
        </View>
    );
}

// ─── Passo 1 — Área ────────────────────────────────────────────────────────────
function StepArea({ onSelect }: { onSelect: (a: Area) => void }) {
    return (
        <Animated.View entering={SlideInRight.duration(280)} exiting={SlideOutLeft.duration(200)} style={fs.stepWrap}>
            <Text style={fs.stepTitle}>Qual área?</Text>
            <Text style={fs.stepSub}>Selecione a área do que você aprendeu hoje</Text>
            <View style={fs.areaGrid}>
                {AREAS.map((area, i) => (
                    <Animated.View key={area.id} entering={FadeInDown.delay(i * 50).duration(350).springify()}>
                        <TouchableOpacity
                            style={[fs.areaCard, { borderColor: area.color + '50', borderBottomColor: area.color + '80' }]}
                            onPress={() => onSelect(area)}
                            activeOpacity={0.75}
                        >
                            <View style={[fs.areaIconWrap, { backgroundColor: area.color + '20' }]}>
                                <area.Icon size={26} color={area.color} strokeWidth={2.5} />
                            </View>
                            <Text style={fs.areaEmoji}>{area.emoji}</Text>
                            <Text style={[fs.areaLabel, { color: area.color }]}>{area.label}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>
        </Animated.View>
    );
}

// ─── Passo 2 — Stacks ──────────────────────────────────────────────────────────
function StepStack({
    area, selected, onToggle, onNext, onBack,
}: {
    area: Area;
    selected: string[];
    onToggle: (id: string) => void;
    onNext: () => void;
    onBack: () => void;
}) {
    const filtered = STACKS.filter(s => s.area.includes(area.id));

    return (
        <Animated.View entering={SlideInRight.duration(280)} exiting={SlideOutLeft.duration(200)} style={fs.stepWrap}>
            <Text style={fs.stepTitle}>Qual stack?</Text>
            <Text style={fs.stepSub}>Pode selecionar mais de uma tecnologia</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }} contentContainerStyle={fs.stackList}>
                {filtered.map((stack, i) => {
                    const active = selected.includes(stack.id);
                    return (
                        <Animated.View key={stack.id} entering={FadeInDown.delay(i * 25).duration(260)}>
                            <TouchableOpacity
                                style={[fs.stackChip, active && { backgroundColor: area.color + '18', borderColor: area.color + '60', borderBottomColor: area.color + '40' }]}
                                onPress={() => onToggle(stack.id)}
                                activeOpacity={0.7}
                            >
                                <View style={[fs.stackCheck, active && { backgroundColor: area.color, borderColor: area.color }]}>
                                    {active && <Check size={12} color="#fff" strokeWidth={3} />}
                                </View>
                                <Text style={[fs.stackLabel, active && { color: area.color, fontWeight: '800' }]}>
                                    {stack.label}
                                </Text>
                                {active && <View style={[fs.stackActiveDot, { backgroundColor: area.color }]} />}
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}
            </ScrollView>

            <View style={fs.navRow}>
                <TouchableOpacity style={fs.backBtn} onPress={onBack}>
                    <ChevronLeft size={18} color="#6b6880" strokeWidth={2.5} />
                    <Text style={fs.backBtnText}>Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[fs.nextBtn, { backgroundColor: area.color, borderBottomColor: area.color + 'aa' }]}
                    onPress={onNext}
                >
                    <Text style={fs.nextBtnText}>
                        {selected.length === 0 ? 'Pular' : `Continuar (${selected.length})`}
                    </Text>
                    <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

// ─── Passo 3 — Tipo + texto ────────────────────────────────────────────────────
function StepType({
    area, stacks, onSave, onBack,
}: {
    area: Area;
    stacks: string[];
    onSave: (text: string, meta: { area: string; stacks: string[]; type: string }) => void;
    onBack: () => void;
}) {
    const [selectedType, setSelectedType] = useState<LearningType | null>(null);
    const [customText, setCustomText]     = useState('');
    const [editingText, setEditingText]   = useState(false);

    const generatedText = selectedType ? buildText(selectedType, stacks) : '';
    const finalText     = editingText ? customText : generatedText;

    const handleTypeSelect = (t: LearningType) => {
        setSelectedType(t);
        setCustomText(buildText(t, stacks));
        setEditingText(false);
    };

    const handleSave = () => {
        const text = finalText.trim();
        if (!text) return;
        onSave(text, { area: area.id, stacks, type: selectedType?.id ?? 'custom' });
    };

    return (
        <Animated.View entering={SlideInRight.duration(280)} exiting={SlideOutLeft.duration(200)} style={fs.stepWrap}>
            <Text style={fs.stepTitle}>Como foi?</Text>
            <Text style={fs.stepSub}>Selecione o tipo do seu aprendizado</Text>

            <View style={fs.typeGrid}>
                {LEARNING_TYPES.map((t, i) => {
                    const active = selectedType?.id === t.id;
                    const TIcon  = t.Icon;
                    return (
                        <Animated.View key={t.id} entering={FadeInDown.delay(i * 45).duration(300)}>
                            <TouchableOpacity
                                style={[fs.typeCard, active && { borderColor: area.color, backgroundColor: area.color + '18', borderBottomColor: area.color + '80' }]}
                                onPress={() => handleTypeSelect(t)}
                                activeOpacity={0.75}
                            >
                                <View style={[fs.typeIconWrap, active && { backgroundColor: area.color + '25' }]}>
                                    <TIcon size={22} color={active ? area.color : '#6b6880'} strokeWidth={2.5} />
                                </View>
                                <Text style={fs.typeEmoji}>{t.emoji}</Text>
                                <Text style={[fs.typeLabel, active && { color: area.color, fontWeight: '800' }]}>
                                    {t.label}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}
            </View>

            {selectedType && (
                <Animated.View entering={FadeInDown.duration(300)} style={[fs.previewWrap, { borderColor: area.color + '40' }]}>
                    <View style={fs.previewHeader}>
                        <Text style={[fs.previewLabel, { color: area.color + '99' }]}>REGISTRO GERADO</Text>
                        <TouchableOpacity onPress={() => setEditingText(true)} style={[fs.previewEditBtn, { borderColor: area.color + '40' }]}>
                            <Text style={[fs.previewEdit, { color: area.color }]}>Editar</Text>
                        </TouchableOpacity>
                    </View>
                    {editingText ? (
                        <TextInput
                            style={[fs.previewInput, { borderColor: area.color + '50' }]}
                            value={customText}
                            onChangeText={setCustomText}
                            multiline
                            autoFocus
                            placeholderTextColor="#555"
                        />
                    ) : (
                        <TouchableOpacity onPress={() => setEditingText(true)}>
                            <Text style={fs.previewText}>{generatedText}</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            )}

            <View style={fs.navRow}>
                <TouchableOpacity style={fs.backBtn} onPress={onBack}>
                    <ChevronLeft size={18} color="#6b6880" strokeWidth={2.5} />
                    <Text style={fs.backBtnText}>Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[fs.nextBtn, { backgroundColor: selectedType ? area.color : '#2a2040', borderBottomColor: selectedType ? area.color + 'aa' : '#1a1435' }]}
                    onPress={handleSave}
                    disabled={!selectedType}
                >
                    <Check size={18} color="#fff" strokeWidth={3} />
                    <Text style={fs.nextBtnText}>Salvar registro</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

// ─── Modal principal — tela cheia ─────────────────────────────────────────────
interface AddLearningModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (text: string, meta?: { area: string; stacks: string[]; type: string }) => void;
}

const STEP_LABELS = ['Área', 'Stack', 'Tipo'];
const STEP_COLORS = ['#06b6d4', '#8b5cf6', '#10b981'];

export default function AddLearningModal({ visible, onClose, onSave }: AddLearningModalProps) {
    const [step,           setStep]           = useState(0);
    const [selectedArea,   setSelectedArea]   = useState<Area | null>(null);
    const [selectedStacks, setSelectedStacks] = useState<string[]>([]);

    useEffect(() => {
        if (visible) {
            setStep(0);
            setSelectedArea(null);
            setSelectedStacks([]);
        }
    }, [visible]);

    const activeColor = selectedArea?.color ?? STEP_COLORS[step] ?? '#8b5cf6';

    const handleAreaSelect = (area: Area) => {
        setSelectedArea(area);
        setSelectedStacks([]);
        setStep(1);
    };

    const handleStackToggle = (id: string) => {
        setSelectedStacks(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleSave = (text: string, meta: { area: string; stacks: string[]; type: string }) => {
        onSave(text, meta);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" statusBarTranslucent presentationStyle="fullScreen">
            <SafeAreaView style={fs.container} edges={['top', 'left', 'right']}>

                {/* Header */}
                <View style={fs.header}>
                    <TouchableOpacity style={fs.closeBtn} onPress={onClose}>
                        <X size={22} color="#afb6b9" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <View style={fs.headerCenter}>
                        <Text style={fs.headerTitle}>Novo Registro</Text>
                        <Text style={fs.headerStep}>{STEP_LABELS[step]} · {step + 1} de {STEP_LABELS.length}</Text>
                    </View>
                    {/* Breadcrumb de área */}
                    {selectedArea ? (
                        <View style={[fs.areaBadge, { borderColor: selectedArea.color + '50', backgroundColor: selectedArea.color + '15' }]}>
                            <selectedArea.Icon size={12} color={selectedArea.color} strokeWidth={2.5} />
                            <Text style={[fs.areaBadgeText, { color: selectedArea.color }]}>{selectedArea.label}</Text>
                        </View>
                    ) : (
                        <View style={{ width: 72 }} />
                    )}
                </View>

                {/* Progress bar */}
                <ProgressBar step={step + 1} total={3} color={activeColor} />

                {/* Stacks selecionadas (passo 2+) */}
                {step >= 2 && selectedStacks.length > 0 && (
                    <Animated.View entering={FadeInDown.duration(250)} style={fs.breadcrumb}>
                        {selectedStacks.slice(0, 4).map(id => (
                            <View key={id} style={[fs.breadcrumbChip, { borderColor: activeColor + '40', backgroundColor: activeColor + '10' }]}>
                                <Text style={[fs.breadcrumbText, { color: activeColor }]}>{id}</Text>
                            </View>
                        ))}
                        {selectedStacks.length > 4 && (
                            <Text style={fs.breadcrumbMore}>+{selectedStacks.length - 4}</Text>
                        )}
                    </Animated.View>
                )}

                {/* Conteúdo das etapas */}
                <ScrollView contentContainerStyle={fs.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {step === 0 && <StepArea onSelect={handleAreaSelect} />}
                    {step === 1 && selectedArea && (
                        <StepStack
                            area={selectedArea}
                            selected={selectedStacks}
                            onToggle={handleStackToggle}
                            onNext={() => setStep(2)}
                            onBack={() => setStep(0)}
                        />
                    )}
                    {step === 2 && selectedArea && (
                        <StepType
                            area={selectedArea}
                            stacks={selectedStacks}
                            onSave={handleSave}
                            onBack={() => setStep(1)}
                        />
                    )}
                    <View style={{ height: 60 }} />
                </ScrollView>

            </SafeAreaView>
        </Modal>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const fs = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#131f24' },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 2, borderBottomColor: '#212b31',
        gap: 10,
    },
    closeBtn: {
        width: 40, height: 40, borderRadius: 14,
        backgroundColor: '#1e2b31', alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#2a3940', borderBottomWidth: 4, borderBottomColor: '#161c20',
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
    headerStep:  { color: '#6b6880', fontSize: 11, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },

    areaBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        borderWidth: 1.5, borderRadius: 12,
        paddingHorizontal: 10, paddingVertical: 5,
    },
    areaBadgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

    progressTrack: { height: 6, backgroundColor: '#212b31', overflow: 'hidden' },
    progressBar:   { height: '100%' },

    breadcrumb: {
        flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
        gap: 6, paddingHorizontal: 16, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: '#212b31',
    },
    breadcrumbChip: {
        borderWidth: 1, borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: 4,
    },
    breadcrumbText: { fontSize: 12, fontWeight: '700' },
    breadcrumbMore: { color: '#6b6880', fontSize: 11, fontWeight: '600' },

    scrollContent: { paddingBottom: 20 },

    stepWrap:  { paddingHorizontal: 16, paddingTop: 20 },
    stepTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 6, letterSpacing: -0.3 },
    stepSub:   { color: '#6b6880', fontSize: 14, marginBottom: 20, fontWeight: '600' },

    // Área
    areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
    areaCard: {
        width: (SW - 32 - 24) / 3,
        backgroundColor: '#16151d',
        borderRadius: 20, borderWidth: 2, borderBottomWidth: 5,
        paddingVertical: 18, alignItems: 'center', gap: 8,
    },
    areaIconWrap: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    areaEmoji:  { fontSize: 11, marginTop: -4 },
    areaLabel:  { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },

    // Stack
    stackList: { gap: 10, paddingBottom: 8 },
    stackChip: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: '#16151d', borderRadius: 16, padding: 16,
        borderWidth: 2, borderColor: '#212b31', borderBottomWidth: 4, borderBottomColor: '#161c20',
    },
    stackCheck: {
        width: 22, height: 22, borderRadius: 7,
        borderWidth: 2, borderColor: '#37464f',
        alignItems: 'center', justifyContent: 'center',
    },
    stackLabel:     { color: '#d4d0e8', fontSize: 15, fontWeight: '600', flex: 1 },
    stackActiveDot: { width: 8, height: 8, borderRadius: 4 },

    // Tipo
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    typeCard: {
        width: (SW - 32 - 20) / 3,
        backgroundColor: '#16151d', borderRadius: 18, borderWidth: 2,
        borderColor: '#212b31', borderBottomWidth: 5, borderBottomColor: '#161c20',
        paddingVertical: 16, alignItems: 'center', gap: 6,
    },
    typeIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#212b31' },
    typeEmoji:   { fontSize: 16 },
    typeLabel:   { color: '#6b6880', fontSize: 11, fontWeight: '600', textAlign: 'center' },

    // Preview
    previewWrap: {
        backgroundColor: '#16151d', borderRadius: 18, padding: 16,
        borderWidth: 2, borderBottomWidth: 5, borderBottomColor: '#161c20',
        marginBottom: 16,
    },
    previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    previewLabel:  { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
    previewEditBtn:{ borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
    previewEdit:   { fontSize: 12, fontWeight: '800' },
    previewText:   { color: '#fff', fontSize: 15, lineHeight: 22, fontWeight: '600' },
    previewInput: {
        color: '#fff', fontSize: 15, lineHeight: 22, fontWeight: '600',
        borderWidth: 2, borderRadius: 12, padding: 12,
        minHeight: 70, textAlignVertical: 'top', backgroundColor: '#212b31',
        borderColor: '#37464f',
    },

    // Nav
    navRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    backBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#16151d', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16,
        borderWidth: 2, borderColor: '#212b31', borderBottomWidth: 5, borderBottomColor: '#161c20',
    },
    backBtnText: { color: '#6b6880', fontSize: 15, fontWeight: '700' },
    nextBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8,
        borderRadius: 16, paddingVertical: 16,
        borderBottomWidth: 5,
    },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
});