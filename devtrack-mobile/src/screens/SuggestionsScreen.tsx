// src/screens/SuggestionsScreen.tsx — layout redesenhado
import React, { useState, useEffect, useCallback } from 'react';
import {
    ScrollView, StyleSheet, View, Text, TouchableOpacity,
    Dimensions, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeInDown, FadeInUp,
    useSharedValue, useAnimatedStyle,
    withSpring, withTiming, withDelay,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    CheckCircle, Lock, Star, Zap, Trophy, BookOpen, Code2, Server,
    Layers, Shield, Cpu, Brain, Rocket, Crown, Play, X, Target, Award,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { getStorageKeys } from '../services/userService';

const { width: SW } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
interface Suggestion {
    id: string;
    title: string;
    description: string;
    detail: string;
    tags: string[];
    difficulty: 'iniciante' | 'intermediário' | 'avançado';
    xp: number;
    unlockStreak: number;
    category: 'frontend' | 'backend' | 'devops' | 'mobile' | 'cs' | 'soft';
    Icon: any;
}

interface Level {
    level: number;
    title: string;
    subtitle: string;
    minStreak: number;
    maxStreak: number;
    color: string;
    Icon: any;
    desc: string;
}

const LEVELS: Level[] = [
    { level: 1, title: 'Júnior',  subtitle: 'Desenvolvedor Júnior',  minStreak: 0,  maxStreak: 3,        color: '#10b981', Icon: Code2,   desc: 'Construindo a base.' },
    { level: 2, title: 'Pleno',   subtitle: 'Desenvolvedor Pleno',   minStreak: 3,  maxStreak: 8,        color: '#06b6d4', Icon: Layers,  desc: 'Pegando ritmo.' },
    { level: 3, title: 'Sênior',  subtitle: 'Desenvolvedor Sênior',  minStreak: 8,  maxStreak: 15,       color: '#8b5cf6', Icon: Trophy,  desc: 'Você pensa em sistemas.' },
    { level: 4, title: 'DevOps',  subtitle: 'Engenheiro DevOps',     minStreak: 15, maxStreak: Infinity,  color: '#f59e0b', Icon: Crown,   desc: 'Domínio total.' },
];

const CATEGORY_COLORS: Record<string, string> = {
    frontend: '#06b6d4', backend: '#10b981', devops: '#8b5cf6',
    mobile: '#f59e0b', cs: '#e879f9', soft: '#f87171',
};

const DIFF_COLORS = { iniciante: '#10b981', intermediário: '#f59e0b', avançado: '#ef4444' };

function getCurrentLevel(completed: number): Level {
    return [...LEVELS].reverse().find(l => completed >= l.minStreak) ?? LEVELS[0];
}
function getNextLevel(completed: number): Level | null {
    return LEVELS.find(l => l.minStreak > completed) ?? null;
}

const ALL_SUGGESTIONS: Suggestion[] = [
    { id: 's1',  title: 'Git: fundamentos essenciais',          description: 'Domine os comandos básicos do Git.',                                    detail: 'Aprenda git init, add, commit, push, pull, branch e merge. Entenda staging area. Pratique criando um repo do zero com Conventional Commits.',                                                                                              tags: ['git', 'versionamento'],         difficulty: 'iniciante',     xp: 50,  unlockStreak: 0,  category: 'cs',       Icon: Code2   },
    { id: 's2',  title: 'HTML semântico na prática',            description: 'Escreva HTML que máquinas entendem.',                                   detail: 'Use tags corretas: <header>, <main>, <section>, <article>. Aprenda aria-* e role. HTML bem estruturado melhora SEO e acessibilidade.',                                                                                                        tags: ['html', 'semântica'],            difficulty: 'iniciante',     xp: 40,  unlockStreak: 0,  category: 'frontend', Icon: Code2   },
    { id: 's3',  title: 'CSS Flexbox do zero',                  description: 'Layouts flexíveis sem dor de cabeça.',                                  detail: 'Entenda flex container vs flex item. Domine justify-content, align-items, flex-wrap. Pratique com um card de perfil.',                                                                                                                   tags: ['css', 'flexbox'],               difficulty: 'iniciante',     xp: 45,  unlockStreak: 0,  category: 'frontend', Icon: Layers  },
    { id: 's4',  title: 'JavaScript: funções de array',         description: 'map, filter e reduce — coração do JS.',                                 detail: 'map transforma, filter seleciona, reduce acumula. Pratique encadeando os três.',                                                                                                                                                          tags: ['javascript', 'arrays'],         difficulty: 'iniciante',     xp: 60,  unlockStreak: 0,  category: 'frontend', Icon: Code2   },
    { id: 's5',  title: 'Terminal: produtividade no dia a dia', description: 'Navegue e execute scripts sem GUI.',                                    detail: 'Domine: cd, ls, mkdir, rm, cp, grep, find. Aprenda pipes e redirecionamento. Configure aliases no .zshrc.',                                                                                                                            tags: ['terminal', 'bash'],             difficulty: 'iniciante',     xp: 45,  unlockStreak: 0,  category: 'cs',       Icon: Cpu     },
    { id: 's6',  title: 'Lógica: algoritmos básicos',           description: 'Estruture raciocínio antes de codar.',                                  detail: 'Pratique no LeetCode Easy: busca linear/binária, ordenação básica, recursão simples.',                                                                                                                                                 tags: ['algoritmos', 'lógica'],         difficulty: 'iniciante',     xp: 55,  unlockStreak: 0,  category: 'cs',       Icon: Brain   },
    { id: 's7',  title: 'React: componentes e hooks',           description: 'A base de qualquer app React moderno.',                                 detail: 'Funcionais vs classe. Props fluindo de pai para filho. useState para estado local. Crie um formulário controlado do zero.',                                                                                                              tags: ['react', 'hooks'],               difficulty: 'iniciante',     xp: 80,  unlockStreak: 3,  category: 'frontend', Icon: Code2   },
    { id: 's8',  title: 'TypeScript: tipagem que salva',        description: 'Segurança e autocomplete no código.',                                   detail: 'Tipos básicos, interfaces, generics simples. Ative strict: true. Nunca deixe um any.',                                                                                                                                                  tags: ['typescript', 'tipos'],          difficulty: 'iniciante',     xp: 85,  unlockStreak: 3,  category: 'frontend', Icon: Shield  },
    { id: 's9',  title: 'REST API: consumindo e criando',       description: 'Integre qualquer serviço com Express.',                                 detail: 'Fetch com async/await. Express com GET/POST/PUT/DELETE. Use Thunder Client para testar.',                                                                                                                                             tags: ['api', 'rest', 'express'],       difficulty: 'intermediário', xp: 100, unlockStreak: 3,  category: 'backend',  Icon: Server  },
    { id: 's10', title: 'SQL: do básico ao JOIN',               description: 'Dados relacionais com PostgreSQL.',                                     detail: 'SELECT com WHERE, GROUP BY, HAVING. Todos os JOINs. Índices e transações. Pratique com Docker.',                                                                                                                                      tags: ['sql', 'postgresql'],            difficulty: 'intermediário', xp: 110, unlockStreak: 3,  category: 'backend',  Icon: Server  },
    { id: 's11', title: 'Autenticação: JWT + sessions',         description: 'Login seguro sem biblioteca mágica.',                                   detail: 'JWT: access + refresh token. Sessions: cookies httpOnly vs localStorage. Implemente fluxo completo.',                                                                                                                                 tags: ['jwt', 'auth', 'segurança'],     difficulty: 'intermediário', xp: 120, unlockStreak: 3,  category: 'backend',  Icon: Shield  },
    { id: 's12', title: 'CSS Grid: layouts 2D',                 description: 'Construa o que Flexbox não consegue.',                                  detail: 'grid-template-areas, grid-area. Grid para 2D, Flexbox para 1D. Recrie uma dashboard completa.',                                                                                                                                     tags: ['css', 'grid'],                  difficulty: 'intermediário', xp: 90,  unlockStreak: 3,  category: 'frontend', Icon: Layers  },
    { id: 's13', title: 'React Native: primeiro app',           description: 'Mobile cross-platform com sua stack.',                                  detail: 'View/Text vs div/p. FlatList. Expo Router. AsyncStorage. Publique na Expo Go.',                                                                                                                                                       tags: ['react native', 'mobile'],       difficulty: 'intermediário', xp: 115, unlockStreak: 3,  category: 'mobile',   Icon: Layers  },
    { id: 's14', title: 'React avançado: performance',          description: 'Elimine re-renders desnecessários.',                                    detail: 'Profiling com DevTools. memo, useMemo, useCallback. Compound components. Lazy loading.',                                                                                                                                             tags: ['react', 'performance'],         difficulty: 'avançado',     xp: 150, unlockStreak: 8,  category: 'frontend', Icon: Zap     },
    { id: 's15', title: 'TypeScript: generics avançados',       description: 'Código altamente reutilizável.',                                        detail: 'Generics com constraints. Utility types: Partial, Pick, Omit. Mapped e conditional types.',                                                                                                                                         tags: ['typescript', 'generics'],       difficulty: 'avançado',     xp: 155, unlockStreak: 8,  category: 'frontend', Icon: Code2   },
    { id: 's16', title: 'Clean Architecture no backend',        description: 'Código que dura anos.',                                                 detail: 'Entities → Use Cases → Adapters → Frameworks. DI sem framework. Repository pattern.',                                                                                                                                               tags: ['arquitetura', 'solid'],         difficulty: 'avançado',     xp: 180, unlockStreak: 8,  category: 'backend',  Icon: Brain   },
    { id: 's17', title: 'PostgreSQL: EXPLAIN e índices',        description: 'Queries lentas nunca mais.',                                            detail: 'EXPLAIN ANALYZE. Seq Scan vs Index Scan. B-Tree, GIN, GiST. Particionamento.',                                                                                                                                                    tags: ['postgresql', 'performance'],    difficulty: 'avançado',     xp: 160, unlockStreak: 8,  category: 'backend',  Icon: Server  },
    { id: 's18', title: 'Testes: unitários, integração, e2e',  description: 'Mude código sem medo.',                                                 detail: 'Jest/Vitest. Supertest. Playwright. TDD na prática.',                                                                                                                                                                             tags: ['testes', 'jest', 'tdd'],        difficulty: 'avançado',     xp: 165, unlockStreak: 8,  category: 'cs',       Icon: Shield  },
    { id: 's19', title: 'Web Performance: Core Web Vitals',     description: 'LCP, INP, CLS — SEO e conversão.',                                     detail: 'Lighthouse e PageSpeed. WebP, lazy loading, preload. Critical CSS inline.',                                                                                                                                                       tags: ['performance', 'web vitals'],    difficulty: 'avançado',     xp: 155, unlockStreak: 8,  category: 'frontend', Icon: Zap     },
    { id: 's20', title: 'Docker: do zero ao compose',           description: 'Containerize qualquer stack.',                                          detail: 'Multi-stage builds. docker-compose com health checks. Publique no Docker Hub.',                                                                                                                                                   tags: ['docker', 'containers'],         difficulty: 'avançado',     xp: 190, unlockStreak: 15, category: 'devops',   Icon: Cpu     },
    { id: 's21', title: 'CI/CD com GitHub Actions',             description: 'Automatize testes e deploys.',                                          detail: 'Workflows: lint + test em PRs, deploy em merge. Matrix builds. Cache de dependências.',                                                                                                                                          tags: ['ci/cd', 'github actions'],      difficulty: 'avançado',     xp: 200, unlockStreak: 15, category: 'devops',   Icon: Rocket  },
    { id: 's22', title: 'Kubernetes: orquestração',             description: 'Escale containers automaticamente.',                                    detail: 'Pods, Deployments, Services, Ingress. minikube local. HPA. Rolling updates.',                                                                                                                                                   tags: ['kubernetes', 'k8s'],            difficulty: 'avançado',     xp: 240, unlockStreak: 15, category: 'devops',   Icon: Shield  },
    { id: 's23', title: 'Sistemas distribuídos: CAP',           description: 'Como sistemas reais falham.',                                           detail: 'CAP Theorem. Eventual vs strong consistency. Raft. Event sourcing e CQRS.',                                                                                                                                                    tags: ['sistemas distribuídos'],        difficulty: 'avançado',     xp: 280, unlockStreak: 15, category: 'cs',       Icon: Brain   },
    { id: 's24', title: 'Compiladores: seu próprio parser',     description: 'O que separa devs de arquitetos.',                                      detail: 'Lexer, parser recursivo, AST, interpretador. Crafting Interpreters — gratuito.',                                                                                                                                                tags: ['compiladores', 'ast'],          difficulty: 'avançado',     xp: 320, unlockStreak: 15, category: 'cs',       Icon: Cpu     },
];

// ─── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ visible, suggestion, onConfirm, onCancel }: {
    visible: boolean; suggestion: Suggestion | null; onConfirm: () => void; onCancel: () => void;
}) {
    if (!suggestion) return null;
    const color = CATEGORY_COLORS[suggestion.category];
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <Pressable style={s.overlay} onPress={onCancel}>
                <Pressable style={s.confirmSheet} onPress={() => {}}>
                    <View style={[s.confirmIcon, { backgroundColor: color + '20', borderColor: color + '40' }]}>
                        <suggestion.Icon size={26} color={color} strokeWidth={2} />
                    </View>
                    <Text style={s.confirmTitle}>Você aprendeu isso?</Text>
                    <Text style={s.confirmBody}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>{suggestion.title}</Text>
                        {'\n\n'}Marcar vai te dar <Text style={{ color: '#f59e0b', fontWeight: '700' }}>+{suggestion.xp} XP</Text>. Só marque se realmente praticou.
                    </Text>
                    <View style={s.confirmActions}>
                        <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
                            <Text style={s.cancelText}>Ainda não</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.confirmBtn, { backgroundColor: color }]} onPress={onConfirm}>
                            <CheckCircle size={15} color="#fff" strokeWidth={2.5} />
                            <Text style={s.confirmText}>Aprendi!</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ visible, suggestion, completedCount, onClose, onComplete, completed }: {
    visible: boolean; suggestion: Suggestion | null; completedCount: number;
    onClose: () => void; onComplete: () => void; completed: boolean;
}) {
    if (!suggestion) return null;
    const unlocked  = completedCount >= suggestion.unlockStreak;
    const catColor  = CATEGORY_COLORS[suggestion.category];
    const diffColor = DIFF_COLORS[suggestion.difficulty];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={s.detailContainer} edges={['top', 'left', 'right']}>
                <View style={s.detailHeader}>
                    <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                        <X size={18} color="#6b6880" strokeWidth={2} />
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={s.detailBody} showsVerticalScrollIndicator={false}>
                    <View style={s.detailIconRow}>
                        <View style={[s.detailIconWrap, { backgroundColor: catColor + '18', borderColor: catColor + '40' }]}>
                            <suggestion.Icon size={26} color={catColor} strokeWidth={2} />
                        </View>
                        {completed && (
                            <View style={s.donePill}>
                                <CheckCircle size={11} color="#10b981" strokeWidth={2.5} />
                                <Text style={s.donePillText}>Concluído</Text>
                            </View>
                        )}
                    </View>
                    <Text style={s.detailTitle}>{suggestion.title}</Text>
                    <Text style={s.detailDesc}>{suggestion.description}</Text>
                    <View style={s.detailMeta}>
                        <View style={[s.pill, { backgroundColor: diffColor + '18', borderColor: diffColor + '40' }]}>
                            <Text style={[s.pillText, { color: diffColor }]}>{suggestion.difficulty}</Text>
                        </View>
                        <View style={[s.pill, { backgroundColor: catColor + '18', borderColor: catColor + '40' }]}>
                            <Text style={[s.pillText, { color: catColor }]}>{suggestion.category}</Text>
                        </View>
                        <View style={[s.pill, { backgroundColor: '#f59e0b18', borderColor: '#f59e0b40' }]}>
                            <Star size={10} color="#f59e0b" strokeWidth={2} />
                            <Text style={[s.pillText, { color: '#f59e0b' }]}>{suggestion.xp} XP</Text>
                        </View>
                    </View>
                    <View style={s.detailCard}>
                        <Text style={s.detailCardLabel}>Como aprender</Text>
                        <Text style={s.detailCardBody}>{suggestion.detail}</Text>
                    </View>
                    <View style={s.tagsRow}>
                        {suggestion.tags.map(t => (
                            <View key={t} style={s.tag}><Text style={s.tagText}>#{t}</Text></View>
                        ))}
                    </View>
                    {!unlocked && (
                        <View style={s.lockBox}>
                            <Lock size={16} color="#6b6880" strokeWidth={2} />
                            <Text style={s.lockBoxText}>
                                Disponível após {suggestion.unlockStreak} conclusões (você tem {completedCount})
                            </Text>
                        </View>
                    )}
                    {unlocked && (
                        <TouchableOpacity
                            style={[s.completeBtn, { backgroundColor: completed ? '#10b98118' : catColor },
                                completed && { borderWidth: 1, borderColor: '#10b98140' }]}
                            onPress={() => { if (!completed) onComplete(); }}
                            disabled={completed}
                        >
                            {completed
                                ? <><CheckCircle size={15} color="#10b981" strokeWidth={2.5} /><Text style={[s.completeBtnText, { color: '#10b981' }]}>Concluído!</Text></>
                                : <><Play size={15} color="#fff" strokeWidth={2.5} /><Text style={s.completeBtnText}>Marcar como aprendido</Text></>
                            }
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

// ─── Level Card compacto ───────────────────────────────────────────────────────
function LevelCard({ completedCount }: { completedCount: number }) {
    const level  = getCurrentLevel(completedCount);
    const next   = getNextLevel(completedCount);
    const pct    = next ? (completedCount - level.minStreak) / (next.minStreak - level.minStreak) : 1;
    const barW   = useSharedValue(0);
    const LvlIcon = level.Icon;

    useEffect(() => {
        barW.value = withDelay(300, withSpring(Math.min(pct, 1), { damping: 16, stiffness: 70 }));
    }, [pct]);

    const barStyle = useAnimatedStyle(() => ({
        width: `${Math.min(barW.value * 100, 100)}%` as any,
    }));

    return (
        <Animated.View entering={FadeInDown.duration(400)} style={[s.levelCard, { borderColor: level.color + '40' }]}>
            {/* Linha colorida no topo */}
            <View style={[s.levelTopBar, { backgroundColor: level.color }]} />

            <View style={s.levelRow}>
                <View style={[s.levelIconBox, { backgroundColor: level.color + '20' }]}>
                    <LvlIcon size={20} color={level.color} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={s.levelSubtitle}>{level.subtitle}</Text>
                    <Text style={[s.levelTitle, { color: level.color }]}>{level.title}</Text>
                </View>
                <View style={s.levelCount}>
                    <Text style={[s.levelCountNum, { color: level.color }]}>{completedCount}</Text>
                    <Text style={s.levelCountLabel}>concluídos</Text>
                </View>
            </View>

            {next ? (
                <View style={s.levelProgress}>
                    <View style={s.levelProgressRow}>
                        <Text style={s.levelProgressLabel}>Próximo: {next.title}</Text>
                        <Text style={s.levelProgressLabel}>{completedCount}/{next.minStreak}</Text>
                    </View>
                    <View style={s.track}>
                        <Animated.View style={[s.trackFill, { backgroundColor: level.color }, barStyle]} />
                    </View>
                </View>
            ) : (
                <View style={[s.maxBadge, { borderColor: level.color + '40' }]}>
                    <Crown size={11} color={level.color} strokeWidth={2} />
                    <Text style={[s.maxText, { color: level.color }]}>Nível máximo!</Text>
                </View>
            )}

            {/* Tier dots */}
            <View style={s.tierRow}>
                {LEVELS.map(lv => {
                    const reached = completedCount >= lv.minStreak;
                    const TIcon = lv.Icon;
                    return (
                        <View key={lv.level} style={s.tierItem}>
                            <View style={[s.tierDot, reached && { backgroundColor: lv.color + '20', borderColor: lv.color }]}>
                                <TIcon size={12} color={reached ? lv.color : '#2a2040'} strokeWidth={2} />
                            </View>
                            <Text style={[s.tierLabel, reached && { color: lv.color }]}>{lv.title}</Text>
                        </View>
                    );
                })}
            </View>
        </Animated.View>
    );
}

// ─── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar({ totalXp, completed }: { totalXp: number; completed: number }) {
    return (
        <Animated.View entering={FadeInDown.delay(80).duration(350)} style={s.statsBar}>
            <View style={s.statItem}>
                <Star size={14} color="#f59e0b" strokeWidth={2} />
                <Text style={s.statNum}>{totalXp}</Text>
                <Text style={s.statLabel}>XP total</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
                <CheckCircle size={14} color="#10b981" strokeWidth={2} />
                <Text style={s.statNum}>{completed}</Text>
                <Text style={s.statLabel}>Concluídos</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
                <Target size={14} color="#8b5cf6" strokeWidth={2} />
                <Text style={s.statNum}>{ALL_SUGGESTIONS.length - completed}</Text>
                <Text style={s.statLabel}>Restantes</Text>
            </View>
        </Animated.View>
    );
}

// ─── Suggestion Card ───────────────────────────────────────────────────────────
function SuggCard({ item, completedCount, completed, onPress, delay }: {
    item: Suggestion; completedCount: number; completed: boolean; onPress: () => void; delay: number;
}) {
    const unlocked  = completedCount >= item.unlockStreak;
    const catColor  = CATEGORY_COLORS[item.category];
    const diffColor = DIFF_COLORS[item.difficulty];
    const scale     = useSharedValue(1);
    const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Animated.View entering={FadeInDown.delay(delay).duration(320)} style={scaleStyle}>
            <TouchableOpacity
                style={[s.card, completed && s.cardDone, !unlocked && s.cardLocked]}
                onPress={onPress}
                activeOpacity={0.85}
                onPressIn={() => (scale.value = withSpring(0.97))}
                onPressOut={() => (scale.value = withSpring(1))}
            >
                {/* Accent bar esquerda */}
                <View style={[s.cardBar, { backgroundColor: unlocked ? catColor : '#2a2040' }]} />

                {/* Ícone */}
                <View style={[s.cardIconWrap, { backgroundColor: unlocked ? catColor + '15' : '#1a1826', borderColor: unlocked ? catColor + '35' : '#2a2040' }]}>
                    {unlocked
                        ? <item.Icon size={18} color={catColor} strokeWidth={2} />
                        : <Lock size={16} color="#2a2040" strokeWidth={2} />
                    }
                </View>

                {/* Conteúdo */}
                <View style={s.cardContent}>
                    <View style={s.cardTitleRow}>
                        <Text style={[s.cardTitle, !unlocked && s.cardTitleDim]} numberOfLines={1}>{item.title}</Text>
                        {completed && <CheckCircle size={13} color="#10b981" strokeWidth={2.5} />}
                    </View>
                    <Text style={[s.cardDesc, !unlocked && s.cardDescDim]} numberOfLines={1}>
                        {unlocked ? item.description : `Desbloqueio após ${item.unlockStreak} conclusões`}
                    </Text>
                    {unlocked && (
                        <View style={s.cardFooter}>
                            <View style={[s.diffPill, { backgroundColor: diffColor + '18', borderColor: diffColor + '40' }]}>
                                <Text style={[s.diffText, { color: diffColor }]}>{item.difficulty}</Text>
                            </View>
                            <View style={s.xpRow}>
                                <Star size={9} color="#f59e0b" strokeWidth={2} />
                                <Text style={s.xpText}>{item.xp} XP</Text>
                            </View>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
type Filter = 'all' | 'available' | 'locked' | 'done';

export default function SuggestionsScreen() {
    const { user }  = useAuth();
    const email     = user?.email ?? '';
    const keys      = email ? getStorageKeys(email) : null;
    const DONE_KEY  = keys ? `${keys.profile}_SUGGESTIONS_DONE` : null;
    const XP_KEY    = keys ? `${keys.profile}_SUGGESTIONS_XP`   : null;

    const [completed,     setCompleted]     = useState<Set<string>>(new Set());
    const [filter,        setFilter]        = useState<Filter>('all');
    const [selected,      setSelected]      = useState<Suggestion | null>(null);
    const [showDetail,    setShowDetail]    = useState(false);
    const [showConfirm,   setShowConfirm]   = useState(false);
    const [pendingConfirm,setPendingConfirm]= useState<Suggestion | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!DONE_KEY) return;
            const raw = await AsyncStorage.getItem(DONE_KEY);
            if (raw) setCompleted(new Set(JSON.parse(raw)));
        };
        load();
    }, [DONE_KEY]);

    const handleComplete = (sug: Suggestion) => {
        setPendingConfirm(sug);
        setShowDetail(false);
        setTimeout(() => setShowConfirm(true), 220);
    };

    const confirmComplete = async () => {
        if (!pendingConfirm || !DONE_KEY || !XP_KEY) return;
        const updated = new Set(completed).add(pendingConfirm.id);
        const newXp   = [...updated].reduce((acc, id) => {
            const sg = ALL_SUGGESTIONS.find(sg => sg.id === id);
            return acc + (sg?.xp ?? 0);
        }, 0);
        setCompleted(updated);
        await AsyncStorage.setItem(DONE_KEY, JSON.stringify([...updated]));
        await AsyncStorage.setItem(XP_KEY, String(newXp));
        setShowConfirm(false);
        setPendingConfirm(null);
    };

    const totalXp = [...completed].reduce((acc, id) => {
        const sg = ALL_SUGGESTIONS.find(sg => sg.id === id);
        return acc + (sg?.xp ?? 0);
    }, 0);

    const FILTER_LABELS: Record<Filter, string> = {
        all: 'Todos', available: 'Disponíveis', locked: 'Bloqueados', done: 'Concluídos',
    };

    const filtered = ALL_SUGGESTIONS.filter(sg => {
        if (filter === 'available') return completed.size >= sg.unlockStreak && !completed.has(sg.id);
        if (filter === 'locked')    return completed.size < sg.unlockStreak;
        if (filter === 'done')      return completed.has(sg.id);
        return true;
    });

    const grouped = LEVELS.map((lv, li) => {
        const next  = LEVELS[li + 1];
        const items = filtered.filter(sg =>
            sg.unlockStreak >= lv.minStreak && (!next || sg.unlockStreak < next.minStreak)
        );
        return { level: lv, items };
    }).filter(g => g.items.length > 0);

    return (
        <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>

            {/* Header */}
            <Animated.View entering={FadeInDown.duration(350)} style={s.header}>
                <Text style={s.headerTitle}>Sugestões</Text>
                <Text style={s.headerSub}>Trilha de aprendizado · {ALL_SUGGESTIONS.length} conteúdos</Text>
            </Animated.View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                {/* Level Card */}
                <LevelCard completedCount={completed.size} />

                {/* Stats Bar */}
                <StatsBar totalXp={totalXp} completed={completed.size} />

                {/* Filtros */}
                <Animated.ScrollView
                    entering={FadeInDown.delay(100).duration(300)}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.filterRow}
                >
                    {(['all', 'available', 'locked', 'done'] as Filter[]).map(f => {
                        const active = filter === f;
                        return (
                            <TouchableOpacity
                                key={f}
                                style={[s.filterBtn, active && s.filterBtnActive]}
                                onPress={() => setFilter(f)}
                            >
                                <Text style={[s.filterText, active && s.filterTextActive]}>
                                    {FILTER_LABELS[f]}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </Animated.ScrollView>

                {/* Grupos por nível */}
                {grouped.map(({ level, items }, gi) => {
                    const unlocked       = completed.size >= level.minStreak;
                    const completedInGrp = items.filter(sg => completed.has(sg.id)).length;
                    const GIcon          = level.Icon;

                    return (
                        <View key={level.level} style={s.group}>
                            {/* Group Header */}
                            <View style={[s.groupHeader, { borderColor: unlocked ? level.color + '30' : '#1e1c2e' }]}>
                                <View style={[s.groupIconWrap, { backgroundColor: unlocked ? level.color + '18' : '#1a1826', borderColor: unlocked ? level.color + '40' : '#2a2040' }]}>
                                    <GIcon size={16} color={unlocked ? level.color : '#2a2040'} strokeWidth={2} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[s.groupTitle, { color: unlocked ? level.color : '#44415a' }]}>{level.title}</Text>
                                    <Text style={s.groupDesc} numberOfLines={1}>{level.desc}</Text>
                                </View>
                                {unlocked
                                    ? <Text style={[s.groupCount, { color: level.color }]}>{completedInGrp}/{items.length}</Text>
                                    : (
                                        <View style={s.lockPill}>
                                            <Lock size={9} color="#44415a" strokeWidth={2} />
                                            <Text style={s.lockPillText}>{level.minStreak}</Text>
                                        </View>
                                    )
                                }
                            </View>

                            {/* Cards */}
                            {items.map((sg, i) => (
                                <SuggCard
                                    key={sg.id}
                                    item={sg}
                                    completedCount={completed.size}
                                    completed={completed.has(sg.id)}
                                    delay={gi * 40 + i * 30}
                                    onPress={() => { setSelected(sg); setShowDetail(true); }}
                                />
                            ))}
                        </View>
                    );
                })}

                {filtered.length === 0 && (
                    <View style={s.empty}>
                        <BookOpen size={28} color="#2a2040" strokeWidth={1.5} style={{ marginBottom: 10 }} />
                        <Text style={s.emptyText}>Nenhum conteúdo aqui.</Text>
                    </View>
                )}

                <View style={{ height: 48 }} />
            </ScrollView>

            <DetailModal
                visible={showDetail}
                suggestion={selected}
                completedCount={completed.size}
                onClose={() => setShowDetail(false)}
                onComplete={() => selected && handleComplete(selected)}
                completed={selected ? completed.has(selected.id) : false}
            />
            <ConfirmModal
                visible={showConfirm}
                suggestion={pendingConfirm}
                onConfirm={confirmComplete}
                onCancel={() => { setShowConfirm(false); setPendingConfirm(null); }}
            />
        </SafeAreaView>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#0d0d10' },
    scroll:      { paddingBottom: 24 },

    header:       { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
    headerTitle:  { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    headerSub:    { color: '#6b6880', fontSize: 12, marginTop: 2 },

    // Level Card
    levelCard:    { marginHorizontal: 16, marginBottom: 14, backgroundColor: '#16151d', borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
    levelTopBar:  { height: 3, width: '100%' },
    levelRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingBottom: 10 },
    levelIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    levelSubtitle:{ color: '#44415a', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    levelTitle:   { fontSize: 18, fontWeight: '900', letterSpacing: -0.3, marginTop: 1 },
    levelCount:   { alignItems: 'center', gap: 1 },
    levelCountNum:{ fontSize: 22, fontWeight: '900' },
    levelCountLabel:{ color: '#6b6880', fontSize: 9, fontWeight: '600' },
    levelProgress:{ paddingHorizontal: 14, paddingBottom: 12, gap: 5 },
    levelProgressRow:{ flexDirection: 'row', justifyContent: 'space-between' },
    levelProgressLabel:{ color: '#44415a', fontSize: 11 },
    track:        { height: 5, backgroundColor: '#1a1826', borderRadius: 3, overflow: 'hidden' },
    trackFill:    { height: '100%', borderRadius: 3 },
    maxBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, marginHorizontal: 14, marginBottom: 12, alignSelf: 'flex-start' },
    maxText:      { fontSize: 11, fontWeight: '700' },
    tierRow:      { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1e1c2e', paddingVertical: 10, paddingHorizontal: 8 },
    tierItem:     { flex: 1, alignItems: 'center', gap: 4 },
    tierDot:      { width: 28, height: 28, borderRadius: 8, backgroundColor: '#1a1826', borderWidth: 1, borderColor: '#2a2040', alignItems: 'center', justifyContent: 'center' },
    tierLabel:    { color: '#2a2040', fontSize: 9, fontWeight: '700' },

    // Stats Bar
    statsBar:     { flexDirection: 'row', backgroundColor: '#16151d', borderRadius: 14, marginHorizontal: 16, marginBottom: 14, padding: 12, borderWidth: 1, borderColor: '#2a2040' },
    statItem:     { flex: 1, alignItems: 'center', gap: 3 },
    statNum:      { color: '#fff', fontSize: 17, fontWeight: '900' },
    statLabel:    { color: '#6b6880', fontSize: 10, fontWeight: '600' },
    statDivider:  { width: 1, backgroundColor: '#2a2040', marginVertical: 2 },

    // Filtros
    filterRow:    { paddingHorizontal: 16, gap: 6, paddingBottom: 14 },
    filterBtn:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#16151d', borderWidth: 1, borderColor: '#2a2040' },
    filterBtnActive:{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
    filterText:   { color: '#6b6880', fontSize: 12, fontWeight: '600' },
    filterTextActive:{ color: '#fff' },

    // Grupo
    group:        { paddingHorizontal: 16, marginBottom: 6 },
    groupHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, backgroundColor: '#16151d', borderWidth: 1, marginBottom: 8, marginTop: 4 },
    groupIconWrap:{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    groupTitle:   { fontSize: 13, fontWeight: '800' },
    groupDesc:    { color: '#44415a', fontSize: 11, marginTop: 1 },
    groupCount:   { fontSize: 13, fontWeight: '900' },
    lockPill:     { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#1a1826', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: '#2a2040' },
    lockPillText: { color: '#44415a', fontSize: 10, fontWeight: '700' },

    // Card
    card:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16151d', borderRadius: 12, marginBottom: 6, borderWidth: 1, borderColor: '#2a2040', overflow: 'hidden' },
    cardDone:     { borderColor: '#10b98128', backgroundColor: '#0d1a16' },
    cardLocked:   { opacity: 0.5 },
    cardBar:      { width: 3, alignSelf: 'stretch' },
    cardIconWrap: { margin: 12, width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    cardContent:  { flex: 1, paddingVertical: 12, paddingRight: 12, gap: 3 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardTitle:    { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },
    cardTitleDim: { color: '#44415a' },
    cardDesc:     { color: '#7a7590', fontSize: 12 },
    cardDescDim:  { color: '#3a3560' },
    cardFooter:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
    diffPill:     { borderWidth: 1, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
    diffText:     { fontSize: 10, fontWeight: '700' },
    xpRow:        { flexDirection: 'row', alignItems: 'center', gap: 3 },
    xpText:       { color: '#f59e0b', fontSize: 10, fontWeight: '700' },

    empty:        { alignItems: 'center', paddingVertical: 60 },
    emptyText:    { color: '#44415a', fontSize: 14 },

    // Overlay
    overlay:      { flex: 1, backgroundColor: 'rgba(5,4,12,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },

    // Confirm Modal
    confirmSheet: { backgroundColor: '#13121a', borderRadius: 22, padding: 22, borderWidth: 1, borderColor: '#2a2040', width: '100%', maxWidth: 380 },
    confirmIcon:  { width: 52, height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, alignSelf: 'center', marginBottom: 14 },
    confirmTitle: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
    confirmBody:  { color: '#9aa0aa', fontSize: 13, lineHeight: 21, textAlign: 'center', marginBottom: 20 },
    confirmActions:{ flexDirection: 'row', gap: 10 },
    cancelBtn:    { flex: 1, backgroundColor: '#1a1826', borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: '#2a2040' },
    cancelText:   { color: '#6b6880', fontSize: 14, fontWeight: '700' },
    confirmBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 13 },
    confirmText:  { color: '#fff', fontSize: 14, fontWeight: '700' },

    // Detail Modal
    detailContainer:{ flex: 1, backgroundColor: '#0d0d10' },
    detailHeader:  { flexDirection: 'row', justifyContent: 'flex-end', padding: 14, paddingBottom: 6 },
    closeBtn:      { backgroundColor: '#1e1c2e', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#2a2040' },
    detailBody:    { padding: 20, paddingBottom: 48 },
    detailIconRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    detailIconWrap:{ width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    donePill:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#10b98118', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#10b98140' },
    donePillText:  { color: '#10b981', fontSize: 11, fontWeight: '700' },
    detailTitle:   { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 6, lineHeight: 26 },
    detailDesc:    { color: '#9aa0aa', fontSize: 14, lineHeight: 21, marginBottom: 14 },
    detailMeta:    { flexDirection: 'row', gap: 7, marginBottom: 18, flexWrap: 'wrap' },
    pill:          { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
    pillText:      { fontSize: 11, fontWeight: '700' },
    detailCard:    { backgroundColor: '#16151d', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2a2040', marginBottom: 14 },
    detailCardLabel:{ color: '#44415a', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 },
    detailCardBody:{ color: '#d4d0e8', fontSize: 14, lineHeight: 23 },
    tagsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
    tag:           { backgroundColor: '#1a1826', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: '#2a2040' },
    tagText:       { color: '#6b6880', fontSize: 11 },
    lockBox:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1826', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2a2040', marginBottom: 14 },
    lockBoxText:   { color: '#6b6880', fontSize: 13, flex: 1, lineHeight: 19 },
    completeBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 15 },
    completeBtnText:{ color: '#fff', fontSize: 14, fontWeight: '700' },
});