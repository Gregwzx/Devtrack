// src/components/home/AddLearningModal.tsx
// Modal de 3 etapas pra registrar um aprendizado de forma estruturada.
// A ideia é que o usuário não precise pensar no que escrever —
// área → stack → tipo já gera um texto pronto. Ele só edita se quiser.

import React, { useState, useCallback, useEffect } from 'react';
import {
    Modal, View, Text, StyleSheet, TouchableOpacity,
    TextInput, Pressable, ScrollView, Dimensions,
} from 'react-native';
import Animated, {
    FadeInDown, FadeInRight, FadeOutLeft, FadeOutRight,
    SlideInRight, SlideOutLeft, SlideInLeft, SlideOutRight,
    useSharedValue, useAnimatedStyle, withSpring, withTiming,
    interpolateColor,
} from 'react-native-reanimated';
import {
    X, Check, ChevronRight, ChevronLeft,
    Code2, Server, Layers, Smartphone, Cloud, Shield,
    BookOpen, Bug, Zap, Wrench, Lightbulb, Eye,
} from 'lucide-react-native';

const { width: SW } = Dimensions.get('window');

// ─── Tipos internos do modal ──────────────────────────────────────────────────
type Area         = { id: string; label: string; emoji: string; color: string; Icon: any };
type Stack        = { id: string; label: string; area: string[] };
type LearningType = { id: string; label: string; emoji: string; template: string; Icon: any };

// 6 áreas — mais amplo que as 3 do AREA_CONFIG porque aqui é contexto de registro,
// não de perfil. O mapeamento pra StudyArea acontece na HomeScreen.
const AREAS: Area[] = [
    { id: 'frontend',  label: 'Frontend',  emoji: '🎨', color: '#06b6d4', Icon: Code2       },
    { id: 'backend',   label: 'Backend',   emoji: '⚙️', color: '#10b981', Icon: Server      },
    { id: 'mobile',    label: 'Mobile',    emoji: '📱', color: '#f59e0b', Icon: Smartphone  },
    { id: 'devops',    label: 'DevOps',    emoji: '☁️', color: '#8b5cf6', Icon: Cloud       },
    { id: 'fullstack', label: 'Fullstack', emoji: '🧱', color: '#e879f9', Icon: Layers      },
    { id: 'security',  label: 'Security',  emoji: '🔐', color: '#ef4444', Icon: Shield      },
];

// Cada stack tem um array de áreas compatíveis pra filtrar no passo 2
const STACKS: Stack[] = [
    // Frontend
    { id: 'React',          label: 'React',          area: ['frontend', 'fullstack'] },
    { id: 'React Native',   label: 'React Native',   area: ['mobile', 'frontend', 'fullstack'] },
    { id: 'TypeScript',     label: 'TypeScript',     area: ['frontend', 'backend', 'fullstack', 'mobile'] },
    { id: 'CSS',            label: 'CSS',            area: ['frontend'] },
    { id: 'Next.js',        label: 'Next.js',        area: ['frontend', 'fullstack'] },
    { id: 'Tailwind',       label: 'Tailwind',       area: ['frontend'] },
    { id: 'Vue',            label: 'Vue',            area: ['frontend', 'fullstack'] },
    { id: 'HTML',           label: 'HTML',           area: ['frontend'] },
    // Backend
    { id: 'Node.js',        label: 'Node.js',        area: ['backend', 'fullstack'] },
    { id: 'Python',         label: 'Python',         area: ['backend', 'fullstack', 'devops'] },
    { id: 'PostgreSQL',     label: 'PostgreSQL',     area: ['backend', 'fullstack'] },
    { id: 'MongoDB',        label: 'MongoDB',        area: ['backend', 'fullstack'] },
    { id: 'GraphQL',        label: 'GraphQL',        area: ['backend', 'fullstack'] },
    { id: 'REST API',       label: 'REST API',       area: ['backend', 'fullstack'] },
    { id: 'Java',           label: 'Java',           area: ['backend'] },
    { id: 'Go',             label: 'Go',             area: ['backend', 'devops'] },
    // DevOps
    { id: 'Docker',         label: 'Docker',         area: ['devops', 'backend'] },
    { id: 'AWS',            label: 'AWS',            area: ['devops', 'backend'] },
    { id: 'Git',            label: 'Git',            area: ['frontend', 'backend', 'fullstack', 'devops', 'mobile', 'security'] },
    { id: 'CI/CD',          label: 'CI/CD',          area: ['devops'] },
    { id: 'Firebase',       label: 'Firebase',       area: ['mobile', 'frontend', 'fullstack'] },
    // Mobile
    { id: 'Expo',           label: 'Expo',           area: ['mobile'] },
    { id: 'Swift',          label: 'Swift',          area: ['mobile'] },
    { id: 'Kotlin',         label: 'Kotlin',         area: ['mobile'] },
    // Security
    { id: 'JWT',            label: 'JWT',            area: ['security', 'backend'] },
    { id: 'OAuth',          label: 'OAuth',          area: ['security', 'backend'] },
];

// Templates com {stack} como placeholder — substituído no buildText
const LEARNING_TYPES: LearningType[] = [
    { id: 'concept',  label: 'Conceito',       emoji: '💡', template: 'Aprendi o conceito de {stack}',       Icon: Lightbulb },
    { id: 'bug',      label: 'Bug resolvido',  emoji: '🐛', template: 'Resolvi um bug em {stack}',           Icon: Bug       },
    { id: 'project',  label: 'Projeto',        emoji: '🛠',  template: 'Implementei algo com {stack}',        Icon: Wrench    },
    { id: 'reading',  label: 'Leitura/Docs',   emoji: '📖', template: 'Li sobre {stack}',                    Icon: BookOpen  },
    { id: 'tip',      label: 'Dica',           emoji: '⚡', template: 'Descobri uma dica de {stack}',        Icon: Zap       },
    { id: 'review',   label: 'Revisão',        emoji: '👁',  template: 'Revisei conceitos de {stack}',        Icon: Eye       },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
// Monta o texto legível a partir do tipo + stacks selecionados.
// "React, TypeScript e Next.js" > "React, TypeScript, Next.js" — a vírgula antes do "e" some.
function buildText(type: LearningType, stacks: string[]): string {
    const stackLabel = stacks.length === 0 ? 'programação'
        : stacks.length === 1 ? stacks[0]
        : stacks.slice(0, -1).join(', ') + ' e ' + stacks[stacks.length - 1];
    return type.template.replace('{stack}', stackLabel);
}

// ─── Indicador de progresso (bolinhas) ───────────────────────────────────────
// A bolinha ativa estica pra virar uma pílula — detalhe visual pequeno mas bonito
function StepDots({ step, total }: { step: number; total: number }) {
    return (
        <View style={s.stepDots}>
            {Array.from({ length: total }).map((_, i) => (
                <View
                    key={i}
                    style={[
                        s.stepDot,
                        i < step  && s.stepDotDone,    // passos anteriores: contorno roxo
                        i === step && s.stepDotActive,  // passo atual: pílula cheia
                    ]}
                />
            ))}
        </View>
    );
}

// ─── Passo 1 — Área ───────────────────────────────────────────────────────────
// Toque em uma área avança direto pro passo 2, sem botão de confirmar
function StepArea({ onSelect }: { onSelect: (a: Area) => void }) {
    return (
        <Animated.View entering={SlideInRight.duration(280)} exiting={SlideOutLeft.duration(200)} style={s.stepWrap}>
            <Text style={s.stepTitle}>Qual área?</Text>
            <Text style={s.stepSub}>Selecione a área do que você aprendeu</Text>
            <View style={s.areaGrid}>
                {AREAS.map((area, i) => (
                    // delay escalonado nos cards — entrada em cascata
                    <Animated.View key={area.id} entering={FadeInDown.delay(i * 45).duration(300).springify()}>
                        <TouchableOpacity
                            style={[s.areaCard, { borderColor: area.color + '40' }]}
                            onPress={() => onSelect(area)}
                            activeOpacity={0.75}
                        >
                            <View style={[s.areaIconWrap, { backgroundColor: area.color + '18' }]}>
                                <area.Icon size={22} color={area.color} strokeWidth={2} />
                            </View>
                            <Text style={s.areaEmoji}>{area.emoji}</Text>
                            <Text style={[s.areaLabel, { color: area.color }]}>{area.label}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>
        </Animated.View>
    );
}

// ─── Passo 2 — Stacks ─────────────────────────────────────────────────────────
// Seleção múltipla — o botão muda o label pra mostrar quantos foram selecionados.
// "Pular" disponível pra quem não quer categorizar.
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
        <Animated.View entering={SlideInRight.duration(280)} exiting={SlideOutLeft.duration(200)} style={s.stepWrap}>
            <Text style={s.stepTitle}>Qual stack?</Text>
            <Text style={s.stepSub}>Pode selecionar mais de uma</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }} contentContainerStyle={s.stackList}>
                {filtered.map((stack, i) => {
                    const active = selected.includes(stack.id);
                    return (
                        <Animated.View key={stack.id} entering={FadeInDown.delay(i * 30).duration(260)}>
                            <TouchableOpacity
                                style={[s.stackChip, active && { backgroundColor: area.color + '20', borderColor: area.color + '70' }]}
                                onPress={() => onToggle(stack.id)}
                                activeOpacity={0.7}
                            >
                                {/* checkbox customizado — mais bonito que o nativo */}
                                <View style={[s.stackCheck, active && { backgroundColor: area.color, borderColor: area.color }]}>
                                    {active && <Check size={11} color="#fff" strokeWidth={3} />}
                                </View>
                                <Text style={[s.stackLabel, active && { color: area.color, fontWeight: '700' }]}>
                                    {stack.label}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}
            </ScrollView>

            <View style={s.navRow}>
                <TouchableOpacity style={s.backBtn} onPress={onBack}>
                    <ChevronLeft size={16} color="#6b6880" strokeWidth={2} />
                    <Text style={s.backBtnText}>Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[s.nextBtn, { backgroundColor: area.color }]}
                    onPress={onNext}
                >
                    <Text style={s.nextBtnText}>
                        {selected.length === 0 ? 'Pular' : `Continuar (${selected.length})`}
                    </Text>
                    <ChevronRight size={16} color="#fff" strokeWidth={2.5} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

// ─── Passo 3 — Tipo + texto ────────────────────────────────────────────────────
// Gera o texto automaticamente ao selecionar o tipo.
// O botão "Editar" troca o preview por um TextInput — experiência fluida.
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
    // usa o texto customizado se o usuário editou, senão usa o gerado
    const finalText     = editingText ? customText : generatedText;

    const handleTypeSelect = (t: LearningType) => {
        setSelectedType(t);
        setCustomText(buildText(t, stacks));  // pré-preenche o campo de edição
        setEditingText(false);
    };

    const handleSave = () => {
        const text = finalText.trim();
        if (!text) return;  // não salva vazio
        onSave(text, {
            area:   area.id,
            stacks,
            type:   selectedType?.id ?? 'custom',
        });
    };

    return (
        <Animated.View entering={SlideInRight.duration(280)} exiting={SlideOutLeft.duration(200)} style={s.stepWrap}>
            <Text style={s.stepTitle}>Que tipo?</Text>
            <Text style={s.stepSub}>Como foi esse aprendizado?</Text>

            <View style={s.typeGrid}>
                {LEARNING_TYPES.map((t, i) => {
                    const active = selectedType?.id === t.id;
                    return (
                        <Animated.View key={t.id} entering={FadeInDown.delay(i * 40).duration(280)}>
                            <TouchableOpacity
                                style={[s.typeCard, active && { borderColor: area.color, backgroundColor: area.color + '14' }]}
                                onPress={() => handleTypeSelect(t)}
                                activeOpacity={0.75}
                            >
                                <Text style={s.typeEmoji}>{t.emoji}</Text>
                                <Text style={[s.typeLabel, active && { color: area.color, fontWeight: '700' }]}>
                                    {t.label}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}
            </View>

            {/* Preview do texto gerado — aparece com animação depois de selecionar o tipo */}
            {selectedType && (
                <Animated.View entering={FadeInDown.duration(300)} style={s.previewWrap}>
                    <View style={s.previewHeader}>
                        <Text style={s.previewLabel}>Registro gerado</Text>
                        <TouchableOpacity onPress={() => { setEditingText(true); }}>
                            <Text style={[s.previewEdit, { color: area.color }]}>Editar</Text>
                        </TouchableOpacity>
                    </View>
                    {editingText ? (
                        // TextInput aparece com autoFocus quando usuário clica em "Editar"
                        <TextInput
                            style={[s.previewInput, { borderColor: area.color + '50' }]}
                            value={customText}
                            onChangeText={setCustomText}
                            multiline
                            autoFocus
                            placeholderTextColor="#555"
                        />
                    ) : (
                        // toque no texto também ativa a edição — mais intuitivo
                        <TouchableOpacity onPress={() => setEditingText(true)}>
                            <Text style={s.previewText}>{generatedText}</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            )}

            <View style={s.navRow}>
                <TouchableOpacity style={s.backBtn} onPress={onBack}>
                    <ChevronLeft size={16} color="#6b6880" strokeWidth={2} />
                    <Text style={s.backBtnText}>Voltar</Text>
                </TouchableOpacity>
                {/* botão fica cinza até selecionar um tipo */}
                <TouchableOpacity
                    style={[s.nextBtn, { backgroundColor: selectedType ? area.color : '#2a2040' }]}
                    onPress={handleSave}
                    disabled={!selectedType}
                >
                    <Check size={16} color="#fff" strokeWidth={2.5} />
                    <Text style={s.nextBtnText}>Salvar</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

// ─── Modal principal ──────────────────────────────────────────────────────────
interface AddLearningModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (text: string, meta?: { area: string; stacks: string[]; type: string }) => void;
}

export default function AddLearningModal({ visible, onClose, onSave }: AddLearningModalProps) {
    const [step,           setStep]           = useState(0);
    const [selectedArea,   setSelectedArea]   = useState<Area | null>(null);
    const [selectedStacks, setSelectedStacks] = useState<string[]>([]);

    // reseta tudo ao abrir — evita que estado de uma sessão anterior apareça
    useEffect(() => {
        if (visible) {
            setStep(0);
            setSelectedArea(null);
            setSelectedStacks([]);
        }
    }, [visible]);

    const handleAreaSelect = (area: Area) => {
        setSelectedArea(area);
        setSelectedStacks([]);  // limpa stacks ao trocar de área
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
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            {/* Pressable no overlay fecha o modal ao tocar fora */}
            <Pressable style={s.overlay} onPress={onClose}>
                {/* Pressable no sheet impede que o toque no conteúdo feche o modal */}
                <Pressable style={s.sheet} onPress={() => {}}>

                    <View style={s.handle} />

                    <View style={s.header}>
                        <View>
                            <Text style={s.headerTitle}>Novo registro</Text>
                            <StepDots step={step} total={3} />
                        </View>
                        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                            <X size={18} color="#6b6880" strokeWidth={2} />
                        </TouchableOpacity>
                    </View>

                    {/* Breadcrumb de contexto — mostra área e stacks selecionados */}
                    {selectedArea && (
                        <Animated.View entering={FadeInDown.duration(250)} style={s.breadcrumb}>
                            <View style={[s.breadcrumbChip, { borderColor: selectedArea.color + '40', backgroundColor: selectedArea.color + '12' }]}>
                                <selectedArea.Icon size={11} color={selectedArea.color} strokeWidth={2} />
                                <Text style={[s.breadcrumbText, { color: selectedArea.color }]}>{selectedArea.label}</Text>
                            </View>
                            {selectedStacks.length > 0 && (
                                <>
                                    <Text style={s.breadcrumbArrow}>›</Text>
                                    {/* mostra no máximo 3 stacks pra não estourar a linha */}
                                    {selectedStacks.slice(0, 3).map(id => (
                                        <View key={id} style={s.breadcrumbChipSmall}>
                                            <Text style={s.breadcrumbSmallText}>{id}</Text>
                                        </View>
                                    ))}
                                    {selectedStacks.length > 3 && (
                                        <Text style={s.breadcrumbMore}>+{selectedStacks.length - 3}</Text>
                                    )}
                                </>
                            )}
                        </Animated.View>
                    )}

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

                </Pressable>
            </Pressable>
        </Modal>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(5,4,12,0.88)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#13121a',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingBottom: 40,
        borderWidth: 1,
        borderColor: '#2a2040',
        maxHeight: '90%',
    },
    handle: {
        width: 36, height: 4, borderRadius: 2,
        backgroundColor: '#2a2040',
        alignSelf: 'center', marginTop: 12, marginBottom: 4,
    },
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
    },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 8 },
    closeBtn: {
        backgroundColor: '#1e1c2e', borderRadius: 10,
        padding: 8, borderWidth: 1, borderColor: '#2a2040',
    },

    stepDots: { flexDirection: 'row', gap: 5 },
    stepDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2a2040' },
    stepDotActive: { backgroundColor: '#8b5cf6', width: 18 },  // pílula no passo atual
    stepDotDone:   { backgroundColor: '#8b5cf620', borderWidth: 1, borderColor: '#8b5cf6' },

    breadcrumb: {
        flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
        gap: 6, paddingHorizontal: 20, marginBottom: 12,
    },
    breadcrumbChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        borderWidth: 1, borderRadius: 20,
        paddingHorizontal: 10, paddingVertical: 4,
    },
    breadcrumbText: { fontSize: 12, fontWeight: '700' },
    breadcrumbArrow: { color: '#44415a', fontSize: 14 },
    breadcrumbChipSmall: {
        backgroundColor: '#1e1c2e', borderRadius: 10,
        paddingHorizontal: 8, paddingVertical: 3,
        borderWidth: 1, borderColor: '#2a2040',
    },
    breadcrumbSmallText: { color: '#9aa0aa', fontSize: 11, fontWeight: '600' },
    breadcrumbMore: { color: '#44415a', fontSize: 11 },

    stepWrap: { paddingHorizontal: 20, paddingTop: 4 },
    stepTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 4 },
    stepSub:   { color: '#6b6880', fontSize: 13, marginBottom: 16 },

    areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
    areaCard: {
        width: (SW - 40 - 20) / 3,
        backgroundColor: '#1a1826',
        borderRadius: 18, borderWidth: 1,
        paddingVertical: 16, alignItems: 'center', gap: 6,
    },
    areaIconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    areaEmoji:  { fontSize: 10, marginTop: -4 },
    areaLabel:  { fontSize: 12, fontWeight: '700' },

    stackList: { gap: 8, paddingBottom: 8 },
    stackChip: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#1a1826', borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: '#2a2040',
    },
    stackCheck: {
        width: 20, height: 20, borderRadius: 6,
        borderWidth: 1.5, borderColor: '#2a2040',
        alignItems: 'center', justifyContent: 'center',
    },
    stackLabel: { color: '#d4d0e8', fontSize: 14, fontWeight: '500' },

    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 16 },
    typeCard: {
        width: (SW - 40 - 18) / 3,
        backgroundColor: '#1a1826', borderRadius: 14, borderWidth: 1,
        borderColor: '#2a2040', paddingVertical: 14,
        alignItems: 'center', gap: 5,
    },
    typeEmoji: { fontSize: 20 },
    typeLabel: { color: '#9aa0aa', fontSize: 11, fontWeight: '600', textAlign: 'center' },

    previewWrap: {
        backgroundColor: '#0d0d10', borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: '#2a2040', marginBottom: 16,
    },
    previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    previewLabel:  { color: '#44415a', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
    previewEdit:   { fontSize: 12, fontWeight: '700' },
    previewText:   { color: '#d4d0e8', fontSize: 14, lineHeight: 21 },
    previewInput: {
        color: '#d4d0e8', fontSize: 14, lineHeight: 21,
        borderWidth: 1, borderRadius: 10, padding: 10,
        minHeight: 60, textAlignVertical: 'top',
    },

    navRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    backBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#1a1826', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
        borderWidth: 1, borderColor: '#2a2040',
    },
    backBtnText: { color: '#6b6880', fontSize: 14, fontWeight: '600' },
    nextBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 6,
        borderRadius: 14, paddingVertical: 14,
    },
    nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});