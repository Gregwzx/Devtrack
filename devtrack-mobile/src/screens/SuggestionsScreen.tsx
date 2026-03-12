// src/screens/SuggestionsScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    ScrollView, StyleSheet, View, Text, TouchableOpacity,
    Dimensions, ActivityIndicator, Modal, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeInDown, FadeInUp, FadeInLeft,
    useSharedValue, useAnimatedStyle,
    withSpring, withTiming, withDelay, withRepeat,
    interpolate, Extrapolation,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Flame, Lock, CheckCircle, Circle, ChevronRight,
    Star, Zap, Trophy, BookOpen, Code2, Server,
    Layers, Shield, Cpu, Brain, Rocket, Crown,
    Play, RotateCcw, X, ArrowRight, TrendingUp,
    Award, Target,
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
    unlockStreak: number; // dias necessários de streak
    category: 'frontend' | 'backend' | 'devops' | 'mobile' | 'cs' | 'soft';
    Icon: any;
    completed?: boolean;
}

interface Level {
    level: number;
    title: string;
    subtitle: string;
    minStreak: number;
    maxStreak: number; // exclusive
    color: string;
    gradientA: string;
    gradientB: string;
    Icon: any;
    badge: string; // emoji badge
    desc: string;
    perks: string[]; // what unlocks at this tier
}

// ─── Levels (4 career tiers) ──────────────────────────────────────────────────
const LEVELS: Level[] = [
    {
        level: 1, title: 'Júnior', subtitle: 'Desenvolvedor Júnior',
        minStreak: 0, maxStreak: 14,
        color: '#10b981', gradientA: '#10b981', gradientB: '#059669',
        Icon: Code2, badge: '🌱',
        desc: 'Você está construindo a base. Cada dia conta.',
        perks: ['Fundamentos de Git', 'HTML & CSS', 'JavaScript básico', 'Primeiro projeto'],
    },
    {
        level: 2, title: 'Pleno', subtitle: 'Desenvolvedor Pleno',
        minStreak: 14, maxStreak: 30,
        color: '#06b6d4', gradientA: '#06b6d4', gradientB: '#0284c7',
        Icon: Layers, badge: '⚡',
        desc: '2 semanas sólidas. Você está pegando ritmo.',
        perks: ['Frameworks modernos', 'APIs REST', 'Banco de dados', 'Autenticação'],
    },
    {
        level: 3, title: 'Sênior', subtitle: 'Desenvolvedor Sênior',
        minStreak: 30, maxStreak: 60,
        color: '#8b5cf6', gradientA: '#8b5cf6', gradientB: '#7c3aed',
        Icon: Trophy, badge: '🔥',
        desc: '1 mês de dedicação. Você pensa em sistemas.',
        perks: ['Arquitetura limpa', 'Performance avançada', 'CI/CD', 'TypeScript expert'],
    },
    {
        level: 4, title: 'DevOps', subtitle: 'Engenheiro DevOps',
        minStreak: 60, maxStreak: Infinity,
        color: '#FFD700', gradientA: '#FFD700', gradientB: '#f59e0b',
        Icon: Crown, badge: '👑',
        desc: '60 dias ininterruptos. Você opera em escala.',
        perks: ['Kubernetes & containers', 'Cloud architecture', 'Sistemas distribuídos', 'Compiladores'],
    },
];

function getCurrentLevel(streak: number): Level {
    return [...LEVELS].reverse().find(l => streak >= l.minStreak) ?? LEVELS[0];
}
function getNextLevel(streak: number): Level | null {
    return LEVELS.find(l => l.minStreak > streak) ?? null;
}

// ─── Suggestions Data ─────────────────────────────────────────────────────────
const ALL_SUGGESTIONS: Suggestion[] = [
    // ── JÚNIOR (0+ dias) — fundamentos ───────────────────────────────────────
    {
        id: 's1', title: 'Git: fundamentos essenciais',
        description: 'Domine os comandos básicos do Git que todo dev usa no dia a dia.',
        detail: 'Aprenda git init, add, commit, push, pull, branch e merge. Entenda o conceito de staging area e por que ela existe. Pratique criando um repositório do zero e fazendo seu primeiro commit com uma mensagem descritiva no padrão Conventional Commits.',
        tags: ['git', 'versionamento', 'terminal'],
        difficulty: 'iniciante', xp: 50, unlockStreak: 0,
        category: 'cs', Icon: Code2,
    },
    {
        id: 's2', title: 'HTML semântico na prática',
        description: 'Escreva HTML que máquinas e humanos conseguem entender.',
        detail: 'Use as tags corretas para cada conteúdo: <header>, <main>, <section>, <article>, <aside>, <footer>. Aprenda sobre acessibilidade com atributos aria-* e role. Um HTML bem estruturado melhora SEO e acessibilidade automaticamente.',
        tags: ['html', 'semântica', 'acessibilidade'],
        difficulty: 'iniciante', xp: 40, unlockStreak: 0,
        category: 'frontend', Icon: Code2,
    },
    {
        id: 's3', title: 'CSS Flexbox do zero',
        description: 'Layouts flexíveis sem dor de cabeça usando Flexbox.',
        detail: 'Entenda a diferença entre flex container e flex item. Domine as propriedades justify-content, align-items, flex-wrap e flex-grow. Um exercício prático: recrie um layout de cartão de perfil usando apenas Flexbox.',
        tags: ['css', 'flexbox', 'layout'],
        difficulty: 'iniciante', xp: 45, unlockStreak: 0,
        category: 'frontend', Icon: Layers,
    },
    {
        id: 's4', title: 'JavaScript: funções de array',
        description: 'map, filter e reduce são o coração do JS moderno.',
        detail: 'Entenda quando usar cada um: map transforma, filter seleciona, reduce acumula. Pratique encadeando os três. Dica: tente nunca mais usar um for loop quando um map/filter resolve.',
        tags: ['javascript', 'arrays', 'funcional'],
        difficulty: 'iniciante', xp: 60, unlockStreak: 0,
        category: 'frontend', Icon: Code2,
    },
    {
        id: 's5', title: 'Terminal: produtividade no dia a dia',
        description: 'Navegue, manipule arquivos e execute scripts sem depender de GUI.',
        detail: 'Domine os comandos essenciais: cd, ls, mkdir, rm, cp, mv, grep, find, cat, echo. Aprenda pipes (|) e redirecionamento (>). Configure aliases no .zshrc/.bashrc para agilizar tarefas repetitivas.',
        tags: ['terminal', 'bash', 'produtividade'],
        difficulty: 'iniciante', xp: 45, unlockStreak: 0,
        category: 'cs', Icon: Cpu,
    },
    {
        id: 's6', title: 'Lógica de programação: algoritmos básicos',
        description: 'Resolva problemas estruturando o raciocínio antes de codar.',
        detail: 'Pratique com HackerRank ou LeetCode (nível Easy). Foque em: busca linear/binária, ordenação básica (bubble/selection/insertion), recursão simples. Não memorize soluções — entenda o padrão de pensamento.',
        tags: ['algoritmos', 'lógica', 'leetcode'],
        difficulty: 'iniciante', xp: 55, unlockStreak: 0,
        category: 'cs', Icon: Brain,
    },

    // ── PLENO (14+ dias) — frameworks e backend ───────────────────────────────
    {
        id: 's7', title: 'React: componentes, props e estado',
        description: 'A base de qualquer aplicação React moderna.',
        detail: 'Entenda a diferença entre componentes funcionais e de classe (e por que funcionais venceram). Aprenda como props fluem de pai para filho. Domine useState para estado local. Pratique criando um componente de formulário controlado do zero.',
        tags: ['react', 'componentes', 'hooks'],
        difficulty: 'iniciante', xp: 80, unlockStreak: 14,
        category: 'frontend', Icon: Code2,
    },
    {
        id: 's8', title: 'TypeScript: tipagem que salva produção',
        description: 'Adicione segurança e autocomplete ao seu código.',
        detail: 'Tipos básicos, interfaces, types, enums. Aprenda a tipar funções e generics simples. Ative "strict: true" no tsconfig. Dica chave: never deixe um any — ele anula toda a proteção do TypeScript.',
        tags: ['typescript', 'tipos', 'interfaces'],
        difficulty: 'iniciante', xp: 85, unlockStreak: 14,
        category: 'frontend', Icon: Shield,
    },
    {
        id: 's9', title: 'REST API: consumindo e criando',
        description: 'Integre qualquer serviço e construa sua primeira API.',
        detail: 'Lado cliente: fetch com async/await, tratamento de erros, estados de loading. Lado servidor: Express.js com rotas GET/POST/PUT/DELETE, middlewares, CORS. Use Thunder Client ou Insomnia para testar. Pratique com a API pública do GitHub primeiro.',
        tags: ['api', 'rest', 'express', 'fetch'],
        difficulty: 'intermediário', xp: 100, unlockStreak: 14,
        category: 'backend', Icon: Server,
    },
    {
        id: 's10', title: 'SQL: da query básica ao JOIN complexo',
        description: 'Dados relacionais com SELECT, JOIN, índices e transações.',
        detail: 'Domine SELECT com WHERE, ORDER BY, GROUP BY, HAVING. Todos os tipos de JOIN. Subqueries e CTEs. Índices: quando e por que criar. Transações: ACID na prática. Pratique com PostgreSQL local via Docker.',
        tags: ['sql', 'postgresql', 'database'],
        difficulty: 'intermediário', xp: 110, unlockStreak: 14,
        category: 'backend', Icon: Server,
    },
    {
        id: 's11', title: 'Autenticação: JWT + sessions',
        description: 'Implemente login seguro sem depender de biblioteca mágica.',
        detail: 'JWT: header.payload.signature, access token curto + refresh token longo. Sessions: cookies httpOnly vs localStorage (e por que httpOnly é mais seguro). Implemente um fluxo completo: register → login → protected route → refresh → logout.',
        tags: ['jwt', 'auth', 'segurança', 'cookies'],
        difficulty: 'intermediário', xp: 120, unlockStreak: 14,
        category: 'backend', Icon: Shield,
    },
    {
        id: 's12', title: 'CSS Grid: o sistema de layout definitivo',
        description: 'Construa layouts 2D complexos que Flexbox não consegue.',
        detail: 'grid-template-columns, grid-template-rows, grid-area, grid-template-areas. Entenda a diferença: Grid para layout 2D (rows + cols), Flexbox para alinhamento 1D. Desafio: recrie o layout de uma dashboard completa sem position: absolute.',
        tags: ['css', 'grid', 'layout'],
        difficulty: 'intermediário', xp: 90, unlockStreak: 14,
        category: 'frontend', Icon: Layers,
    },
    {
        id: 's13', title: 'React Native: do zero ao primeiro app',
        description: 'Mobile cross-platform com a stack que você já conhece.',
        detail: 'Diferenças cruciais: View/Text/Image vs div/p/img, StyleSheet vs CSS, Flexbox como padrão. FlatList para listas performáticas. Navigation com Expo Router. AsyncStorage para persistência local. Publique um app na Expo Go.',
        tags: ['react native', 'mobile', 'expo'],
        difficulty: 'intermediário', xp: 115, unlockStreak: 14,
        category: 'mobile', Icon: Layers,
    },

    // ── SÊNIOR (30+ dias) — arquitetura e performance ─────────────────────────
    {
        id: 's14', title: 'React avançado: performance e padrões',
        description: 'Elimine re-renders desnecessários e domine padrões de composição.',
        detail: 'Profiling com React DevTools Profiler. React.memo, useMemo, useCallback — entenda referential equality. Padrões: compound components, render props, custom hooks. Lazy loading com React.lazy + Suspense. Code splitting com dynamic imports.',
        tags: ['react', 'performance', 'padrões'],
        difficulty: 'avançado', xp: 150, unlockStreak: 30,
        category: 'frontend', Icon: Zap,
    },
    {
        id: 's15', title: 'TypeScript avançado: generics e utility types',
        description: 'Escreva código altamente reutilizável com o TypeScript completo.',
        detail: 'Generics com constraints (<T extends object>). Utility types: Partial, Required, Pick, Omit, Record, ReturnType, Parameters. Mapped types e conditional types. Template literal types. Crie seus próprios utility types para o projeto.',
        tags: ['typescript', 'generics', 'tipos avançados'],
        difficulty: 'avançado', xp: 155, unlockStreak: 30,
        category: 'frontend', Icon: Code2,
    },
    {
        id: 's16', title: 'Clean Architecture no backend',
        description: 'Separe responsabilidades e escreva código que dura anos.',
        detail: 'Camadas: Entities → Use Cases → Interface Adapters → Frameworks. Dependency Injection sem framework. Repository pattern para abstrair o banco. Regra de ouro: a lógica de negócio não conhece Express nem PostgreSQL. Teste um Use Case sem levantar servidor.',
        tags: ['arquitetura', 'clean code', 'solid', 'di'],
        difficulty: 'avançado', xp: 180, unlockStreak: 30,
        category: 'backend', Icon: Brain,
    },
    {
        id: 's17', title: 'PostgreSQL avançado: EXPLAIN e índices',
        description: 'Queries lentas nunca mais. Otimize com dados reais.',
        detail: 'EXPLAIN ANALYZE: leia o plano de execução. Sequential Scan vs Index Scan vs Bitmap Heap Scan. Índices B-Tree, GIN, GiST. Índices compostos e parciais. Particionamento de tabelas grandes. CTEs vs subqueries: quando cada um é mais rápido.',
        tags: ['postgresql', 'performance', 'índices', 'explain'],
        difficulty: 'avançado', xp: 160, unlockStreak: 30,
        category: 'backend', Icon: Server,
    },
    {
        id: 's18', title: 'Testes: unitários, integração e e2e',
        description: 'Código que você consegue mudar sem medo.',
        detail: 'Unitários com Vitest/Jest: teste lógica pura sem dependências externas. Integração com Supertest: teste as rotas da sua API. E2E com Playwright: simule o usuário real. TDD na prática: escreva o teste antes, veja falhar, faça passar, refatore.',
        tags: ['testes', 'jest', 'tdd', 'playwright'],
        difficulty: 'avançado', xp: 165, unlockStreak: 30,
        category: 'cs', Icon: Shield,
    },
    {
        id: 's19', title: 'Web Performance: Core Web Vitals',
        description: 'LCP, INP e CLS — as métricas que afetam SEO e conversão.',
        detail: 'Meça com Lighthouse e PageSpeed Insights. LCP: otimize imagens (WebP, lazy loading, preload). INP: reduza blocking JavaScript. CLS: reserve espaço para imagens e ads. Técnicas: critical CSS inline, font-display: swap, resource hints (preload/prefetch).',
        tags: ['performance', 'web vitals', 'lighthouse', 'seo'],
        difficulty: 'avançado', xp: 155, unlockStreak: 30,
        category: 'frontend', Icon: Zap,
    },

    // ── DEVOPS (60+ dias) — infraestrutura e escala ───────────────────────────
    {
        id: 's20', title: 'Docker: do Dockerfile ao compose avançado',
        description: 'Containerize qualquer stack e gerencie ambientes com compose.',
        detail: 'Multi-stage builds para reduzir tamanho de imagem. docker-compose com health checks, volumes nomeados e redes. Secrets management sem expor variáveis no Dockerfile. Publique no Docker Hub e use no CI. Entenda por que containers são efêmeros.',
        tags: ['docker', 'containers', 'compose'],
        difficulty: 'avançado', xp: 190, unlockStreak: 60,
        category: 'devops', Icon: Cpu,
    },
    {
        id: 's21', title: 'CI/CD com GitHub Actions',
        description: 'Automatize testes, builds e deploys em cada push.',
        detail: 'Crie workflows: lint + test em PRs, build + deploy em merge para main. Matrix builds para testar múltiplas versões do Node. Secrets e environments para staging vs produção. Cache de dependências para builds mais rápidos. Deploy automatizado para Vercel/Railway/Render.',
        tags: ['ci/cd', 'github actions', 'automação', 'deploy'],
        difficulty: 'avançado', xp: 200, unlockStreak: 60,
        category: 'devops', Icon: Rocket,
    },
    {
        id: 's22', title: 'Kubernetes: orquestração em produção',
        description: 'Escale, gerencie e recupere containers automaticamente.',
        detail: 'Conceitos: Pods, Deployments, Services, Ingress, ConfigMaps, Secrets. minikube para praticar localmente. Liveness e readiness probes. HPA (Horizontal Pod Autoscaler) baseado em CPU/memória. Rolling updates e rollbacks. Helm charts para gerenciar aplicações complexas.',
        tags: ['kubernetes', 'k8s', 'orquestração'],
        difficulty: 'avançado', xp: 240, unlockStreak: 60,
        category: 'devops', Icon: Shield,
    },
    {
        id: 's23', title: 'Sistemas distribuídos: CAP e consistência',
        description: 'Entenda como sistemas reais falham e como projetá-los para isso.',
        detail: 'CAP Theorem: você só tem 2 dos 3 (Consistency, Availability, Partition tolerance). Eventual consistency vs strong consistency. Algoritmo Raft de consenso (mais legível que Paxos). Event sourcing e CQRS. Leitura essencial: "Designing Data-Intensive Applications" de Kleppmann.',
        tags: ['sistemas distribuídos', 'cap', 'consenso'],
        difficulty: 'avançado', xp: 280, unlockStreak: 60,
        category: 'cs', Icon: Brain,
    },
    {
        id: 's24', title: 'Compiladores: construindo seu próprio parser',
        description: 'O conhecimento que separa devs de arquitetos de linguagem.',
        detail: 'Implemente um lexer (tokenizer) e um parser descendente recursivo para uma linguagem simples. Construa a AST (Abstract Syntax Tree). Adicione um interpretador simples. Guia: "Crafting Interpreters" de Robert Nystrom (gratuito online). Esse conhecimento muda como você pensa em abstrações.',
        tags: ['compiladores', 'ast', 'parser', 'teoria'],
        difficulty: 'avançado', xp: 320, unlockStreak: 60,
        category: 'cs', Icon: Cpu,
    },
];

const CATEGORY_COLORS: Record<string, string> = {
    frontend: '#06b6d4',
    backend:  '#10b981',
    devops:   '#8b5cf6',
    mobile:   '#f59e0b',
    cs:       '#e879f9',
    soft:     '#f87171',
};

const CATEGORY_LABELS: Record<string, string> = {
    frontend: 'Frontend', backend: 'Backend',
    devops: 'DevOps', mobile: 'Mobile',
    cs: 'CS Fundamentos', soft: 'Soft Skills',
};

const DIFF_COLORS = { iniciante: '#10b981', intermediário: '#f59e0b', avançado: '#ef4444' };

// ─── Confirmation Modal ───────────────────────────────────────────────────────
function ConfirmModal({
    visible, suggestion, onConfirm, onCancel,
}: {
    visible: boolean;
    suggestion: Suggestion | null;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!suggestion) return null;
    const catColor = CATEGORY_COLORS[suggestion.category];

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <Pressable style={cm.overlay} onPress={onCancel}>
                <Pressable style={cm.sheet} onPress={() => {}}>
                    <View style={cm.iconWrap}>
                        <suggestion.Icon size={28} color={catColor} strokeWidth={2} />
                    </View>
                    <Text style={cm.title}>Você aprendeu isso?</Text>
                    <Text style={cm.body}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>{suggestion.title}</Text>
                        {'\n\n'}Marcar como concluído vai te dar{' '}
                        <Text style={{ color: '#f59e0b', fontWeight: '700' }}>+{suggestion.xp} XP</Text>.
                        {'\n\n'}Só marque se você realmente praticou e entendeu o conteúdo. A honestidade é o que faz você evoluir de verdade.
                    </Text>
                    <View style={cm.actions}>
                        <TouchableOpacity style={cm.cancelBtn} onPress={onCancel}>
                            <Text style={cm.cancelText}>Ainda não</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[cm.confirmBtn, { backgroundColor: catColor }]} onPress={onConfirm}>
                            <CheckCircle size={16} color="#fff" strokeWidth={2.5} />
                            <Text style={cm.confirmText}>Sim, aprendi!</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const cm = StyleSheet.create({
    overlay:    { flex: 1, backgroundColor: 'rgba(5,4,12,0.92)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    sheet:      { backgroundColor: '#13121a', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#2a2040', width: '100%', maxWidth: 380 },
    iconWrap:   { width: 56, height: 56, borderRadius: 16, backgroundColor: '#1a1826', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2a2040', marginBottom: 16, alignSelf: 'center' },
    title:      { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
    body:       { color: '#9aa0aa', fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
    actions:    { flexDirection: 'row', gap: 10 },
    cancelBtn:  { flex: 1, backgroundColor: '#1a1826', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2a2040' },
    cancelText: { color: '#6b6880', fontSize: 14, fontWeight: '700' },
    confirmBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14, paddingVertical: 14 },
    confirmText:{ color: '#fff', fontSize: 14, fontWeight: '700' },
});

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({
    visible, suggestion, streak, onClose, onComplete, completed,
}: {
    visible: boolean;
    suggestion: Suggestion | null;
    streak: number;
    onClose: () => void;
    onComplete: () => void;
    completed: boolean;
}) {
    if (!suggestion) return null;
    const unlocked    = streak >= suggestion.unlockStreak;
    const catColor    = CATEGORY_COLORS[suggestion.category];
    const diffColor   = DIFF_COLORS[suggestion.difficulty];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={dm.container} edges={['top', 'left', 'right']}>
                <View style={dm.header}>
                    <TouchableOpacity style={dm.closeBtn} onPress={onClose}>
                        <X size={18} color="#6b6880" strokeWidth={2} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={dm.body} showsVerticalScrollIndicator={false}>
                    <View style={dm.iconRow}>
                        <View style={[dm.iconWrap, { backgroundColor: catColor + '18', borderColor: catColor + '40' }]}>
                            <suggestion.Icon size={28} color={catColor} strokeWidth={2} />
                        </View>
                        {completed && (
                            <View style={dm.completedBadge}>
                                <CheckCircle size={12} color="#10b981" strokeWidth={2.5} />
                                <Text style={dm.completedText}>Concluído</Text>
                            </View>
                        )}
                    </View>

                    <Text style={dm.title}>{suggestion.title}</Text>
                    <Text style={dm.desc}>{suggestion.description}</Text>

                    <View style={dm.metaRow}>
                        <View style={[dm.diffBadge, { backgroundColor: diffColor + '18', borderColor: diffColor + '40' }]}>
                            <Text style={[dm.diffText, { color: diffColor }]}>{suggestion.difficulty}</Text>
                        </View>
                        <View style={dm.catBadge}>
                            <Text style={[dm.catText, { color: catColor }]}>{CATEGORY_LABELS[suggestion.category]}</Text>
                        </View>
                        <View style={dm.xpBadge}>
                            <Star size={11} color="#f59e0b" strokeWidth={2} />
                            <Text style={dm.xpText}>{suggestion.xp} XP</Text>
                        </View>
                    </View>

                    <View style={dm.detailCard}>
                        <Text style={dm.detailLabel}>Como aprender</Text>
                        <Text style={dm.detailBody}>{suggestion.detail}</Text>
                    </View>

                    <View style={dm.tagsRow}>
                        {suggestion.tags.map(tag => (
                            <View key={tag} style={dm.tag}>
                                <Text style={dm.tagText}>#{tag}</Text>
                            </View>
                        ))}
                    </View>

                    {!unlocked && (
                        <View style={dm.lockBox}>
                            <Lock size={18} color="#6b6880" strokeWidth={2} />
                            <Text style={dm.lockText}>
                                Disponível a partir de {suggestion.unlockStreak} dias de sequência{'\n'}
                                (você tem {streak} dias — faltam {suggestion.unlockStreak - streak})
                            </Text>
                        </View>
                    )}

                    {unlocked && (
                        <TouchableOpacity
                            style={[dm.completeBtn, completed && dm.completeBtnDone, { backgroundColor: completed ? '#10b98120' : catColor }]}
                            onPress={() => { if (!completed) onComplete(); }}
                            disabled={completed}
                        >
                            {completed
                                ? <><CheckCircle size={16} color="#10b981" strokeWidth={2.5} /><Text style={[dm.completeBtnText, { color: '#10b981' }]}>Concluído!</Text></>
                                : <><Play size={16} color="#fff" strokeWidth={2.5} /><Text style={dm.completeBtnText}>Marcar como aprendido</Text></>
                            }
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

const dm = StyleSheet.create({
    container:     { flex: 1, backgroundColor: '#0d0d10' },
    header:        { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, paddingBottom: 8 },
    closeBtn:      { backgroundColor: '#1e1c2e', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#2a2040' },
    body:          { padding: 20, paddingBottom: 48 },
    iconRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    iconWrap:      { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    completedBadge:{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#10b98118', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#10b98140' },
    completedText: { color: '#10b981', fontSize: 12, fontWeight: '700' },
    title:         { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 8, lineHeight: 28 },
    desc:          { color: '#9aa0aa', fontSize: 14, lineHeight: 22, marginBottom: 16 },
    metaRow:       { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
    diffBadge:     { flexDirection: 'row', borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    diffText:      { fontSize: 12, fontWeight: '700' },
    catBadge:      { backgroundColor: '#1a1826', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#2a2040' },
    catText:       { fontSize: 12, fontWeight: '700' },
    xpBadge:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f59e0b18', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#f59e0b40' },
    xpText:        { color: '#f59e0b', fontSize: 12, fontWeight: '700' },
    detailCard:    { backgroundColor: '#16151d', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2a2040', marginBottom: 16 },
    detailLabel:   { color: '#44415a', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
    detailBody:    { color: '#d4d0e8', fontSize: 14, lineHeight: 24 },
    tagsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 24 },
    tag:           { backgroundColor: '#1a1826', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#2a2040' },
    tagText:       { color: '#6b6880', fontSize: 11 },
    lockBox:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#1a1826', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2a2040', marginBottom: 16 },
    lockText:      { color: '#6b6880', fontSize: 13, lineHeight: 20, flex: 1 },
    completeBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 16, marginTop: 4 },
    completeBtnDone:{ borderWidth: 1, borderColor: '#10b98140' },
    completeBtnText:{ color: '#fff', fontSize: 15, fontWeight: '700' },
});

// ─── Suggestion Card ──────────────────────────────────────────────────────────
function SuggestionCard({
    s, streak, completed, onPress, delay,
}: {
    s: Suggestion; streak: number; completed: boolean; onPress: () => void; delay: number;
}) {
    const unlocked  = streak >= s.unlockStreak;
    const catColor  = CATEGORY_COLORS[s.category];
    const diffColor = DIFF_COLORS[s.difficulty];
    const scale     = useSharedValue(1);
    const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Animated.View entering={FadeInLeft.delay(delay).duration(350)} style={scaleStyle}>
            <TouchableOpacity
                style={[
                    styles.card,
                    completed && styles.cardDone,
                    !unlocked && styles.cardLocked,
                ]}
                onPress={onPress}
                activeOpacity={0.8}
                onPressIn={() => (scale.value = withSpring(0.97))}
                onPressOut={() => (scale.value = withSpring(1))}
            >
                {/* Left accent */}
                <View style={[styles.cardAccent, { backgroundColor: unlocked ? catColor : '#2a2040' }]} />

                <View style={styles.cardLeft}>
                    <View style={[styles.cardIcon, { backgroundColor: unlocked ? catColor + '18' : '#1a1826', borderColor: unlocked ? catColor + '40' : '#2a2040' }]}>
                        {!unlocked
                            ? <Lock size={16} color="#2a2040" strokeWidth={2} />
                            : <s.Icon size={16} color={catColor} strokeWidth={2} />
                        }
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.cardTitleRow}>
                        <Text style={[styles.cardTitle, !unlocked && styles.cardTitleLocked]} numberOfLines={1}>
                            {s.title}
                        </Text>
                        {completed && <CheckCircle size={14} color="#10b981" strokeWidth={2.5} />}
                    </View>
                    <Text style={[styles.cardDesc, !unlocked && styles.cardDescLocked]} numberOfLines={2}>
                        {unlocked ? s.description : `🔒 Desbloqueio: ${s.unlockStreak} dias de sequência`}
                    </Text>
                    <View style={styles.cardFooter}>
                        {unlocked && (
                            <View style={[styles.diffDot, { backgroundColor: diffColor + '25', borderColor: diffColor + '50' }]}>
                                <Text style={[styles.diffText, { color: diffColor }]}>{s.difficulty}</Text>
                            </View>
                        )}
                        <View style={styles.xpChip}>
                            <Star size={9} color={unlocked ? '#f59e0b' : '#44415a'} strokeWidth={2} />
                            <Text style={[styles.xpText, !unlocked && { color: '#44415a' }]}>{s.xp} XP</Text>
                        </View>
                        {!unlocked && (
                            <View style={styles.streakReq}>
                                <Flame size={9} color="#44415a" strokeWidth={2} />
                                <Text style={styles.streakReqText}>{s.unlockStreak}d</Text>
                            </View>
                        )}
                    </View>
                </View>

                <ChevronRight size={14} color={unlocked ? '#44415a' : '#2a2040'} strokeWidth={2} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Level Badge ──────────────────────────────────────────────────────────────
function LevelBadge({ level, streak }: { level: Level; streak: number }) {
    const next     = getNextLevel(streak);
    const progress = next ? (streak - level.minStreak) / (next.minStreak - level.minStreak) : 1;
    const barW     = useSharedValue(0);

    useEffect(() => {
        barW.value = withDelay(400, withSpring(progress, { damping: 14 }));
    }, [progress]);

    const barStyle = useAnimatedStyle(() => ({
        width: `${Math.min(barW.value * 100, 100)}%` as any,
    }));

    const isMax = !next;

    return (
        <Animated.View entering={FadeInUp.duration(500).springify()} style={[lb.wrap, { borderColor: level.color + '40' }]}>
            {/* Top row */}
            <View style={lb.topRow}>
                <View style={[lb.iconWrap, { backgroundColor: level.color + '20', borderColor: level.color + '50' }]}>
                    <Text style={lb.badge}>{level.badge}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={lb.subtitle}>{level.subtitle}</Text>
                    <Text style={[lb.title, { color: level.color }]}>{level.title}</Text>
                    <Text style={lb.desc}>{level.desc}</Text>
                </View>
                <View style={[lb.streakWrap, { backgroundColor: level.color + '18' }]}>
                    <Flame size={12} color={level.color} strokeWidth={2} />
                    <Text style={[lb.streakNum, { color: level.color }]}>{streak}</Text>
                    <Text style={lb.streakLabel}>dias</Text>
                </View>
            </View>

            {/* Progress to next */}
            {!isMax ? (
                <View style={lb.progressSection}>
                    <View style={lb.progressRow}>
                        <Text style={lb.progressLabel}>
                            Próximo: <Text style={{ color: next!.color, fontWeight: '700' }}>{next!.badge} {next!.title}</Text>
                        </Text>
                        <Text style={lb.progressLabel}>{streak}/{next!.minStreak}d</Text>
                    </View>
                    <View style={lb.track}>
                        <Animated.View style={[lb.fill, { backgroundColor: level.color }, barStyle]} />
                    </View>
                    <Text style={lb.progressHint}>
                        Faltam {next!.minStreak - streak} dia{next!.minStreak - streak !== 1 ? 's' : ''} de sequência
                    </Text>
                </View>
            ) : (
                <View style={[lb.maxBadge, { borderColor: level.color + '40', backgroundColor: level.color + '12' }]}>
                    <Crown size={12} color={level.color} strokeWidth={2} />
                    <Text style={[lb.maxText, { color: level.color }]}>Nível máximo atingido!</Text>
                </View>
            )}

            {/* All 4 tier indicators */}
            <View style={lb.tiersRow}>
                {LEVELS.map((lv, i) => {
                    const reached = streak >= lv.minStreak;
                    const current = lv.level === level.level;
                    return (
                        <View key={lv.level} style={lb.tierItem}>
                            <View style={[
                                lb.tierDot,
                                reached && { backgroundColor: lv.color },
                                current && { borderColor: lv.color, borderWidth: 2, width: 14, height: 14 },
                            ]}>
                                {reached && <Text style={{ fontSize: 7 }}>{lv.badge}</Text>}
                            </View>
                            <Text style={[lb.tierLabel, reached && { color: lv.color }]} numberOfLines={1}>
                                {lv.title}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </Animated.View>
    );
}

const lb = StyleSheet.create({
    wrap:          { backgroundColor: '#16151d', borderRadius: 20, padding: 16, marginHorizontal: 16, marginBottom: 16, borderWidth: 1 },
    topRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
    iconWrap:      { width: 52, height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
    badge:         { fontSize: 24 },
    subtitle:      { color: '#44415a', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
    title:         { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
    desc:          { color: '#6b6880', fontSize: 11, marginTop: 3 },
    streakWrap:    { alignItems: 'center', borderRadius: 12, padding: 8, gap: 2, minWidth: 50 },
    streakNum:     { fontSize: 22, fontWeight: '900', lineHeight: 24 },
    streakLabel:   { color: '#6b6880', fontSize: 9, fontWeight: '600' },
    progressSection: { gap: 6, marginBottom: 14 },
    progressRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressLabel: { color: '#44415a', fontSize: 11 },
    track:         { height: 6, backgroundColor: '#1a1826', borderRadius: 3, overflow: 'hidden' },
    fill:          { height: '100%', borderRadius: 3 },
    progressHint:  { color: '#2a2040', fontSize: 10 },
    maxBadge:      { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 14, alignSelf: 'flex-start' },
    maxText:       { fontSize: 12, fontWeight: '700' },
    tiersRow:      { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1e1c2e', paddingTop: 12 },
    tierItem:      { flex: 1, alignItems: 'center', gap: 5 },
    tierDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2a2040', alignItems: 'center', justifyContent: 'center' },
    tierLabel:     { color: '#2a2040', fontSize: 9, fontWeight: '700', textAlign: 'center' },
});

// ─── XP Summary ──────────────────────────────────────────────────────────────
function XPSummary({ totalXp, completed }: { totalXp: number; completed: number }) {
    return (
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={xp.wrap}>
            <View style={xp.item}>
                <Star size={16} color="#f59e0b" strokeWidth={2} />
                <Text style={xp.value}>{totalXp}</Text>
                <Text style={xp.label}>XP total</Text>
            </View>
            <View style={xp.divider} />
            <View style={xp.item}>
                <CheckCircle size={16} color="#10b981" strokeWidth={2} />
                <Text style={xp.value}>{completed}</Text>
                <Text style={xp.label}>Concluídos</Text>
            </View>
            <View style={xp.divider} />
            <View style={xp.item}>
                <Target size={16} color="#8b5cf6" strokeWidth={2} />
                <Text style={xp.value}>{ALL_SUGGESTIONS.length - completed}</Text>
                <Text style={xp.label}>Restantes</Text>
            </View>
        </Animated.View>
    );
}

const xp = StyleSheet.create({
    wrap:    { flexDirection: 'row', backgroundColor: '#16151d', borderRadius: 16, marginHorizontal: 16, marginBottom: 20, padding: 14, borderWidth: 1, borderColor: '#2a2040' },
    item:    { flex: 1, alignItems: 'center', gap: 4 },
    value:   { color: '#fff', fontSize: 18, fontWeight: '900' },
    label:   { color: '#6b6880', fontSize: 10, fontWeight: '600' },
    divider: { width: 1, backgroundColor: '#2a2040', marginVertical: 4 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SuggestionsScreen() {
    const { user } = useAuth();
    const email = user?.email ?? '';
    const keys  = email ? getStorageKeys(email) : null;

    const [streak,    setStreak]    = useState(0);
    const [completed, setCompleted] = useState<Set<string>>(new Set());
    const [filter,    setFilter]    = useState<'all' | 'available' | 'locked' | 'done'>('all');
    const [selected,  setSelected]  = useState<Suggestion | null>(null);
    const [showDetail,setShowDetail]= useState(false);
    const [showConfirm,setShowConfirm]=useState(false);
    const [pendingConfirm,setPendingConfirm]=useState<Suggestion|null>(null);

    const STORAGE_KEY = keys ? `${keys.profile}_SUGGESTIONS_DONE` : null;

    useEffect(() => {
        const load = async () => {
            if (!keys || !STORAGE_KEY) return;
            const [sRaw, dRaw] = await Promise.all([
                AsyncStorage.getItem(keys.streak),
                AsyncStorage.getItem(STORAGE_KEY),
            ]);
            if (sRaw) setStreak(JSON.parse(sRaw).count ?? 0);
            if (dRaw) setCompleted(new Set(JSON.parse(dRaw)));
        };
        load();
    }, []);

    const handleComplete = async (s: Suggestion) => {
        setPendingConfirm(s);
        setShowDetail(false);
        setTimeout(() => setShowConfirm(true), 200);
    };

    const confirmComplete = async () => {
        if (!pendingConfirm || !STORAGE_KEY) return;
        const updated = new Set(completed).add(pendingConfirm.id);
        setCompleted(updated);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...updated]));
        setShowConfirm(false);
        setPendingConfirm(null);
    };

    const currentLevel = getCurrentLevel(streak);
    const totalXp      = [...completed].reduce((acc, id) => {
        const s = ALL_SUGGESTIONS.find(s => s.id === id);
        return acc + (s?.xp ?? 0);
    }, 0);

    const filtered = ALL_SUGGESTIONS.filter(s => {
        if (filter === 'available') return streak >= s.unlockStreak && !completed.has(s.id);
        if (filter === 'locked')    return streak < s.unlockStreak;
        if (filter === 'done')      return completed.has(s.id);
        return true;
    });

    // Group by unlock level
    const grouped: { level: Level; items: Suggestion[] }[] = LEVELS.map(lv => {
        const next  = LEVELS[LEVELS.indexOf(lv) + 1];
        const items = filtered.filter(s =>
            s.unlockStreak >= lv.minStreak && (!next || s.unlockStreak < next.minStreak)
        );
        return { level: lv, items };
    }).filter(g => g.items.length > 0);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Sugestões</Text>
                    <Text style={styles.headerSub}>Trilha de aprendizado · {ALL_SUGGESTIONS.length} conteúdos</Text>
                </View>
            </Animated.View>

            {/* Level Badge */}
            <LevelBadge level={currentLevel} streak={streak} />

            {/* XP Summary */}
            <XPSummary totalXp={totalXp} completed={completed.size} />

            {/* Filter tabs */}
            <Animated.View entering={FadeInDown.delay(120).duration(350)} style={styles.filterRow}>
                {(['all', 'available', 'locked', 'done'] as const).map(f => {
                    const labels = { all: 'Todos', available: 'Disponíveis', locked: 'Bloqueados', done: 'Concluídos' };
                    const active = filter === f;
                    return (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterBtn, active && styles.filterBtnActive]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.filterText, active && styles.filterTextActive]}>
                                {labels[f]}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </Animated.View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {grouped.map(({ level, items }, gi) => {
                    const unlocked = streak >= level.minStreak;
                    const completedInGroup = items.filter(s => completed.has(s.id)).length;
                    return (
                        <View key={level.level} style={styles.group}>
                            {/* Group header */}
                            <View style={[styles.groupHeader, { borderColor: unlocked ? level.color + '35' : '#2a2040', backgroundColor: unlocked ? level.color + '08' : '#16151d' }]}>
                                <View style={[styles.groupIconWrap, { backgroundColor: unlocked ? level.color + '20' : '#1a1826', borderColor: unlocked ? level.color + '50' : '#2a2040' }]}>
                                    <Text style={{ fontSize: 18 }}>{level.badge}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.groupTitle, { color: unlocked ? level.color : '#44415a' }]}>
                                        {level.badge} {level.title}
                                    </Text>
                                    <Text style={[styles.groupSub, unlocked && { color: '#6b6880' }]}>
                                        {unlocked ? level.desc : `🔒 Disponível em ${level.minStreak} dias de sequência`}
                                    </Text>
                                </View>
                                <View style={styles.groupProgress}>
                                    {unlocked && (
                                        <Text style={[styles.groupProgressText, { color: level.color }]}>
                                            {completedInGroup}/{items.length}
                                        </Text>
                                    )}
                                    {!unlocked && (
                                        <View style={styles.lockChip}>
                                            <Flame size={10} color="#44415a" strokeWidth={2} />
                                            <Text style={styles.lockChipText}>{level.minStreak}d</Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {items.map((s, i) => (
                                <SuggestionCard
                                    key={s.id}
                                    s={s}
                                    streak={streak}
                                    completed={completed.has(s.id)}
                                    delay={gi * 60 + i * 45}
                                    onPress={() => { setSelected(s); setShowDetail(true); }}
                                />
                            ))}
                        </View>
                    );
                })}

                {filtered.length === 0 && (
                    <View style={styles.empty}>
                        <BookOpen size={32} color="#2a2040" strokeWidth={1.5} style={{ marginBottom: 12 }} />
                        <Text style={styles.emptyText}>Nenhum conteúdo nessa categoria.</Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Detail Modal */}
            <DetailModal
                visible={showDetail}
                suggestion={selected}
                streak={streak}
                onClose={() => setShowDetail(false)}
                onComplete={() => selected && handleComplete(selected)}
                completed={selected ? completed.has(selected.id) : false}
            />

            {/* Confirm Modal */}
            <ConfirmModal
                visible={showConfirm}
                suggestion={pendingConfirm}
                onConfirm={confirmComplete}
                onCancel={() => { setShowConfirm(false); setPendingConfirm(null); }}
            />
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: '#0d0d10' },
    header:       { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    headerTitle:  { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    headerSub:    { color: '#6b6880', fontSize: 12, marginTop: 2 },

    filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 16 },
    filterBtn:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#16151d', borderWidth: 1, borderColor: '#2a2040' },
    filterBtnActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
    filterText:      { color: '#6b6880', fontSize: 12, fontWeight: '600' },
    filterTextActive:{ color: '#fff' },

    scroll: { paddingBottom: 20 },

    group:       { paddingHorizontal: 16, marginBottom: 8 },
    groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 8, borderRadius: 14, padding: 12, borderWidth: 1 },
    groupHeaderLocked: { opacity: 0.6 },
    groupIconWrap:{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
    groupTitle:  { fontSize: 14, fontWeight: '800' },
    groupSub:    { color: '#44415a', fontSize: 11, marginTop: 2 },
    groupProgress:{ alignItems: 'flex-end', gap: 4 },
    groupProgressText: { fontSize: 13, fontWeight: '900' },
    lockChip:    { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#1a1826', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#2a2040' },
    lockChipText:{ color: '#44415a', fontSize: 11, fontWeight: '700' },

    card:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16151d', borderRadius: 14, marginBottom: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#2a2040' },
    cardDone:    { borderColor: '#10b98130', backgroundColor: '#0d1a16' },
    cardLocked:  { opacity: 0.55 },
    cardAccent:  { width: 3, alignSelf: 'stretch' },
    cardLeft:    { padding: 12, paddingRight: 0 },
    cardIcon:    { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    cardBody:    { flex: 1, padding: 12, gap: 3 },
    cardTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardTitle:   { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },
    cardTitleLocked: { color: '#44415a' },
    cardDesc:    { color: '#7a7590', fontSize: 12, lineHeight: 17 },
    cardDescLocked: { color: '#3a3560' },
    cardFooter:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    diffDot:     { borderWidth: 1, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
    diffText:    { fontSize: 10, fontWeight: '700' },
    xpChip:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
    xpText:      { color: '#f59e0b', fontSize: 10, fontWeight: '700' },
    streakReq:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
    streakReqText:{ color: '#44415a', fontSize: 10, fontWeight: '600' },

    empty:       { alignItems: 'center', paddingVertical: 60 },
    emptyText:   { color: '#44415a', fontSize: 14 },
});