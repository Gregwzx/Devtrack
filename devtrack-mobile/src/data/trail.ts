// src/data/trail.ts — trilhas expandidas: 8 paradas por área (básico → avançado)
// Cada parada agora tem 5 exercícios
import type { StudyArea } from '../services/ai.service';

export interface TrailStop {
    id: string;
    order: number;
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    level: 'basic' | 'intermediate' | 'advanced';
    exerciseIds: string[];
    xpReward: number;
}

export interface AreaTrail {
    area: StudyArea;
    label: string;
    icon: string;
    color: string;
    stops: TrailStop[];
}

// ─── FRONTEND ─────────────────────────────────────────────────────────────────
const FRONTEND: AreaTrail = {
    area: 'frontend', label: 'Frontend', icon: '🎨', color: '#06b6d4',
    stops: [
        { id: 'fe1', order: 1, title: 'HTML & CSS',        subtitle: 'Estrutura e estilo', icon: '</>',  color: '#06b6d4', level: 'basic',        exerciseIds: ['f1','l1','l2','l3','f2'],   xpReward: 60  },
        { id: 'fe2', order: 2, title: 'Layouts Modernos',  subtitle: 'Flexbox e Grid',     icon: '▦',    color: '#0891b2', level: 'basic',        exerciseIds: ['f2','l3','f3','l4','l1'],   xpReward: 75  },
        { id: 'fe3', order: 3, title: 'JavaScript Core',   subtitle: 'Lógica e funções',   icon: '{ }',  color: '#0e7490', level: 'basic',        exerciseIds: ['l4','l5','l6','l1','l2'],   xpReward: 90  },
        { id: 'fe4', order: 4, title: 'React Fundamentos', subtitle: 'Componentes e hooks',icon: '⚛',    color: '#f59e0b', level: 'intermediate', exerciseIds: ['f1','f2','f3','l5','l6'],   xpReward: 100 },
        { id: 'fe5', order: 5, title: 'Estado & Contexto', subtitle: 'useState e Context', icon: '🔄',   color: '#d97706', level: 'intermediate', exerciseIds: ['f4','l1','l2','f3','a1'],   xpReward: 115 },
        { id: 'fe6', order: 6, title: 'APIs no Frontend',  subtitle: 'Fetch e debounce',   icon: '[ ]',  color: '#b45309', level: 'intermediate', exerciseIds: ['a1','a2','a3','f4','l6'],   xpReward: 130 },
        { id: 'fe7', order: 7, title: 'Performance',       subtitle: 'Memo e otimização',  icon: '⚡',   color: '#8b5cf6', level: 'advanced',     exerciseIds: ['a3','f4','l6','a2','d4'],   xpReward: 155 },
        { id: 'fe8', order: 8, title: 'Arquitetura React', subtitle: 'Patterns avançados', icon: '🏗️',  color: '#7c3aed', level: 'advanced',     exerciseIds: ['f3','f4','a2','d3','l5'],   xpReward: 180 },
    ],
};

// ─── BACKEND ──────────────────────────────────────────────────────────────────
const BACKEND: AreaTrail = {
    area: 'backend', label: 'Backend', icon: '⚙️', color: '#10b981',
    stops: [
        { id: 'be1', order: 1, title: 'HTTP Básico',       subtitle: 'Métodos e status',   icon: '#',    color: '#10b981', level: 'basic',        exerciseIds: ['b1','l1','l2','l3','b2'],   xpReward: 60  },
        { id: 'be2', order: 2, title: 'Express & Rotas',   subtitle: 'Servidor e endpoints',icon: '@',   color: '#059669', level: 'basic',        exerciseIds: ['b2','l3','l4','b1','l2'],   xpReward: 75  },
        { id: 'be3', order: 3, title: 'CRUD Completo',     subtitle: 'Create, Read, Update',icon: '🗂',  color: '#047857', level: 'basic',        exerciseIds: ['b1','b2','l5','l4','l3'],   xpReward: 90  },
        { id: 'be4', order: 4, title: 'Banco de Dados',    subtitle: 'SQL e modelagem',    icon: '🗄️',  color: '#f59e0b', level: 'intermediate', exerciseIds: ['d1','d2','d3','b2','l6'],   xpReward: 110 },
        { id: 'be5', order: 5, title: 'Autenticação',      subtitle: 'JWT e middlewares',  icon: '🔐',   color: '#d97706', level: 'intermediate', exerciseIds: ['b3','l6','d1','b1','d2'],   xpReward: 125 },
        { id: 'be6', order: 6, title: 'APIs Avançadas',    subtitle: 'Paginação e cache',  icon: '📡',   color: '#b45309', level: 'intermediate', exerciseIds: ['b4','a1','d2','a2','b3'],   xpReward: 140 },
        { id: 'be7', order: 7, title: 'Performance SQL',   subtitle: 'Índices e queries',  icon: '⚡',   color: '#8b5cf6', level: 'advanced',     exerciseIds: ['d4','d3','b3','a3','b4'],   xpReward: 165 },
        { id: 'be8', order: 8, title: 'Arquitetura',       subtitle: 'Clean e microsserv.', icon: '🏗️', color: '#7c3aed', level: 'advanced',     exerciseIds: ['b4','d4','a3','d3','b3'],   xpReward: 190 },
    ],
};

// ─── MOBILE ───────────────────────────────────────────────────────────────────
const MOBILE: AreaTrail = {
    area: 'mobile', label: 'Mobile', icon: '📱', color: '#f59e0b',
    stops: [
        { id: 'mo1', order: 1, title: 'RN Fundamentos',   subtitle: 'Views e estilo',     icon: '📱',   color: '#f59e0b', level: 'basic',        exerciseIds: ['m1','l1','l2','l3','m2'],   xpReward: 60  },
        { id: 'mo2', order: 2, title: 'Listas & Scroll',  subtitle: 'FlatList e scroll',  icon: '📋',   color: '#d97706', level: 'basic',        exerciseIds: ['m2','l3','l4','m1','l2'],   xpReward: 75  },
        { id: 'mo3', order: 3, title: 'Navegação',        subtitle: 'Rotas e Stack',      icon: '🗺️',  color: '#b45309', level: 'basic',        exerciseIds: ['m1','l5','f1','m2','l4'],   xpReward: 90  },
        { id: 'mo4', order: 4, title: 'Estado & Hooks',   subtitle: 'useState e Context', icon: '{ }',  color: '#8b5cf6', level: 'intermediate', exerciseIds: ['f2','f3','m2','l6','f1'],   xpReward: 110 },
        { id: 'mo5', order: 5, title: 'Persistência',     subtitle: 'AsyncStorage e SQLite',icon: '💾', color: '#7c3aed', level: 'intermediate', exerciseIds: ['m2','a1','l6','f4','m1'],   xpReward: 125 },
        { id: 'mo6', order: 6, title: 'APIs Mobile',      subtitle: 'Fetch e offline',    icon: '📡',   color: '#6d28d9', level: 'intermediate', exerciseIds: ['a1','a2','m3','m4','a3'],   xpReward: 140 },
        { id: 'mo7', order: 7, title: 'Animações',        subtitle: 'Reanimated 3',       icon: '✨',   color: '#ef4444', level: 'advanced',     exerciseIds: ['m3','m4','a3','l5','l6'],   xpReward: 165 },
        { id: 'mo8', order: 8, title: 'Performance',      subtitle: 'Otimização nativa',  icon: '⚡',   color: '#dc2626', level: 'advanced',     exerciseIds: ['m4','l5','l6','a2','d4'],   xpReward: 190 },
    ],
};

// ─── FULLSTACK ────────────────────────────────────────────────────────────────
const FULLSTACK: AreaTrail = {
    area: 'fullstack', label: 'Fullstack', icon: '⚡', color: '#8b5cf6',
    stops: [
        { id: 'fs1', order: 1, title: 'Frontend Base',    subtitle: 'HTML, CSS e JS',     icon: '</>',  color: '#8b5cf6', level: 'basic',        exerciseIds: ['f1','l1','l2','l3','f2'],   xpReward: 60  },
        { id: 'fs2', order: 2, title: 'Backend Base',     subtitle: 'Node e Express',     icon: '#',    color: '#7c3aed', level: 'basic',        exerciseIds: ['b1','b2','l3','l4','l2'],   xpReward: 75  },
        { id: 'fs3', order: 3, title: 'Banco de Dados',   subtitle: 'SQL fundamental',    icon: '🗄️',  color: '#6d28d9', level: 'basic',        exerciseIds: ['d1','d2','l4','l5','b1'],   xpReward: 90  },
        { id: 'fs4', order: 4, title: 'React + API',      subtitle: 'Frontend e backend', icon: '⚛',    color: '#06b6d4', level: 'intermediate', exerciseIds: ['f2','a1','b3','f3','l6'],   xpReward: 110 },
        { id: 'fs5', order: 5, title: 'Autenticação',     subtitle: 'JWT end-to-end',     icon: '🔐',   color: '#0891b2', level: 'intermediate', exerciseIds: ['b3','f3','l5','a2','d2'],   xpReward: 130 },
        { id: 'fs6', order: 6, title: 'Deploy & CI/CD',   subtitle: 'Ambiente e pipeline',icon: '🚀',   color: '#0e7490', level: 'intermediate', exerciseIds: ['b4','a2','d3','b3','a1'],   xpReward: 145 },
        { id: 'fs7', order: 7, title: 'Escalabilidade',   subtitle: 'Cache e performance',icon: '⚡',   color: '#10b981', level: 'advanced',     exerciseIds: ['a3','d4','b4','l6','d3'],   xpReward: 170 },
        { id: 'fs8', order: 8, title: 'Arquitetura',      subtitle: 'Design patterns',    icon: '🏗️',  color: '#059669', level: 'advanced',     exerciseIds: ['d4','a3','l6','b4','f4'],   xpReward: 200 },
    ],
};

// ─── DEVOPS ───────────────────────────────────────────────────────────────────
const DEVOPS: AreaTrail = {
    area: 'devops', label: 'DevOps', icon: '🔧', color: '#e879f9',
    stops: [
        { id: 'do1', order: 1, title: 'Git Básico',       subtitle: 'Commits e histórico', icon: '🌿',  color: '#e879f9', level: 'basic',        exerciseIds: ['g1','g2','l1','l2','l3'],   xpReward: 60  },
        { id: 'do2', order: 2, title: 'Branches',         subtitle: 'Merge e conflitos',   icon: '⑂',  color: '#d946ef', level: 'basic',        exerciseIds: ['g3','g4','l2','g1','l4'],   xpReward: 75  },
        { id: 'do3', order: 3, title: 'Lógica Dev',       subtitle: 'Algoritmos base',     icon: '{ }', color: '#c026d3', level: 'basic',        exerciseIds: ['l3','l4','l5','l6','l1'],   xpReward: 90  },
        { id: 'do4', order: 4, title: 'APIs & REST',      subtitle: 'Integração de serviços',icon: '📡',color: '#f59e0b', level: 'intermediate', exerciseIds: ['a1','a2','b1','b2','l6'],   xpReward: 110 },
        { id: 'do5', order: 5, title: 'Banco de Dados',   subtitle: 'SQL e queries',       icon: '🗄️', color: '#d97706', level: 'intermediate', exerciseIds: ['d1','d2','l6','d3','b1'],   xpReward: 125 },
        { id: 'do6', order: 6, title: 'Segurança',        subtitle: 'Auth e middlewares',  icon: '🔐',  color: '#b45309', level: 'intermediate', exerciseIds: ['b3','b4','d3','a2','d2'],   xpReward: 145 },
        { id: 'do7', order: 7, title: 'Performance',      subtitle: 'Cache e otimização',  icon: '⚡',  color: '#8b5cf6', level: 'advanced',     exerciseIds: ['d4','a3','l6','b4','a2'],   xpReward: 170 },
        { id: 'do8', order: 8, title: 'Infraestrutura',   subtitle: 'Deploy e pipelines',  icon: '🚀',  color: '#7c3aed', level: 'advanced',     exerciseIds: ['b4','d4','a2','g4','a3'],   xpReward: 200 },
    ],
};

export const TRAILS: AreaTrail[] = [FRONTEND, BACKEND, MOBILE, FULLSTACK, DEVOPS];

export function getTrailForArea(area: StudyArea): AreaTrail {
    return TRAILS.find(t => t.area === area) ?? FULLSTACK;
}
