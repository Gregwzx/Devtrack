// src/data/avatars.ts  — sistema de avatar evoluível + cosméticos + poses + roupas
import type { StudyArea } from '../services/ai.service';

export type CosmeticType = 'hat' | 'badge' | 'background' | 'accessory' | 'pose' | 'outfit';

export interface AvatarLevel {
    minXp: number;
    label: string;
    baseEmoji: string;      // emoji base padrão deste nível
    glowColor: string;
    frameType: 'plain' | 'glow' | 'double' | 'electric' | 'legendary';
    description: string;
}

export interface CosmeticItem {
    id: string;
    name: string;
    type: CosmeticType;
    emoji: string;
    xpRequired?: number;
    achievementRequired?: string;
    description: string;
    color: string;
}

export interface AvatarConfig {
    pose: string | null;
    outfit: string | null;
    hat: string | null;
    accessory: string | null;
    background: string | null;
    badge: string | null;
}

export const DEFAULT_AVATAR: AvatarConfig = {
    pose: null, outfit: null, hat: null,
    accessory: null, background: null, badge: null,
};

// ─── Níveis por XP ────────────────────────────────────────────────────────────
export const AVATAR_LEVELS: AvatarLevel[] = [
    {
        minXp: 0,    label: 'Júnior Dev',  baseEmoji: '🧑‍💻',
        glowColor: '#10b981', frameType: 'plain',
        description: 'Começando a jornada',
    },
    {
        minXp: 75,   label: 'Dev Pleno',   baseEmoji: '👨‍💻',
        glowColor: '#06b6d4', frameType: 'glow',
        description: 'Código fluindo!',
    },
    {
        minXp: 200,  label: 'Sênior',      baseEmoji: '👾',
        glowColor: '#8b5cf6', frameType: 'double',
        description: 'Dominando as bases',
    },
    {
        minXp: 450,  label: 'Arquiteto',   baseEmoji: '🤖',
        glowColor: '#f59e0b', frameType: 'electric',
        description: 'Arquitetando soluções',
    },
    {
        minXp: 900,  label: 'Lendário',    baseEmoji: '🦾',
        glowColor: '#FFD700', frameType: 'legendary',
        description: 'Lendário entre os devs',
    },
];

export function getAvatarLevel(xp: number): AvatarLevel {
    let level = AVATAR_LEVELS[0];
    for (const l of AVATAR_LEVELS) { if (xp >= l.minXp) level = l; }
    return level;
}

export function getNextLevel(xp: number): AvatarLevel | null {
    for (let i = AVATAR_LEVELS.length - 1; i >= 0; i--) {
        if (xp < AVATAR_LEVELS[i].minXp) return AVATAR_LEVELS[i];
    }
    return null;
}

// ─── Cosméticos ───────────────────────────────────────────────────────────────
export const COSMETICS: CosmeticItem[] = [

    // ── POSES ────────────────────────────────────────────────────────────────
    { id: 'pose_normal',   type: 'pose', name: 'Normal',     emoji: '🧍',  color: '#10b981', description: 'Pose padrão',           xpRequired: 0   },
    { id: 'pose_coding',   type: 'pose', name: 'Codando',    emoji: '💻',  color: '#06b6d4', description: 'No modo foco',           xpRequired: 50  },
    { id: 'pose_chill',    type: 'pose', name: 'Relaxado',   emoji: '😎',  color: '#f59e0b', description: 'Descansando entre bugs', xpRequired: 100 },
    { id: 'pose_flex',     type: 'pose', name: 'Flexindo',   emoji: '💪',  color: '#ef4444', description: 'Mostrando força',        xpRequired: 200 },
    { id: 'pose_hero',     type: 'pose', name: 'Herói',      emoji: '🦸',  color: '#8b5cf6', description: 'Salvando o sistema',     xpRequired: 350 },
    { id: 'pose_wizard',   type: 'pose', name: 'Mago',       emoji: '🧙',  color: '#e879f9', description: 'Feiticeiro do código',   xpRequired: 500 },
    { id: 'pose_robot',    type: 'pose', name: 'Robô',       emoji: '🤖',  color: '#FFD700', description: 'Máquina de produtividade', xpRequired: 750 },

    // ── ROUPAS ───────────────────────────────────────────────────────────────
    { id: 'outfit_casual',     type: 'outfit', name: 'Casual',      emoji: '👕',  color: '#10b981', description: 'Confortável',        xpRequired: 0   },
    { id: 'outfit_hoodie',     type: 'outfit', name: 'Moletom',     emoji: '🧥',  color: '#06b6d4', description: 'Dev modo noturno',   xpRequired: 60  },
    { id: 'outfit_formal',     type: 'outfit', name: 'Social',      emoji: '👔',  color: '#8b5cf6', description: 'Para a demo',        xpRequired: 150 },
    { id: 'outfit_ninja',      type: 'outfit', name: 'Ninja',       emoji: '🥷',  color: '#1a1a2e', description: 'Stealth mode ON',    xpRequired: 300 },
    { id: 'outfit_astronaut',  type: 'outfit', name: 'Astronauta',  emoji: '👨‍🚀', color: '#38bdf8', description: 'Explorando o código', xpRequired: 500 },
    { id: 'outfit_king',       type: 'outfit', name: 'Rei do Stack', emoji: '🤴', color: '#FFD700', description: 'Domina tudo',        xpRequired: 800 },

    // ── CHAPÉUS ──────────────────────────────────────────────────────────────
    { id: 'hat_hacker',  type: 'hat', name: 'Chapéu Hacker',  emoji: '🎩',  color: '#10b981', description: 'Para quem programa no escuro', xpRequired: 100 },
    { id: 'hat_matrix',  type: 'hat', name: 'Óculos Matrix',  emoji: '🕶️', color: '#06b6d4', description: 'Pill vermelha ou azul?',       xpRequired: 200 },
    { id: 'hat_crown',   type: 'hat', name: 'Coroa Dev',      emoji: '👑',  color: '#FFD700', description: 'Rei/Rainha do código',         xpRequired: 500 },
    { id: 'hat_wizard',  type: 'hat', name: 'Chapéu Mágico',  emoji: '🧢',  color: '#8b5cf6', description: 'Magias de algoritmos',         xpRequired: 300 },
    { id: 'hat_party',   type: 'hat', name: 'Festa',          emoji: '🎉',  color: '#f97316', description: 'Deploy na sexta!',             achievementRequired: 'first_learning' },

    // ── ACESSÓRIOS ───────────────────────────────────────────────────────────
    { id: 'acc_coffee',  type: 'accessory', name: 'Café',         emoji: '☕',  color: '#92400e', description: 'Combustível do dev',   xpRequired: 0   },
    { id: 'acc_laptop',  type: 'accessory', name: 'Laptop',       emoji: '💻',  color: '#06b6d4', description: 'Ferramenta essencial', xpRequired: 80  },
    { id: 'acc_gamepad', type: 'accessory', name: 'Controle',     emoji: '🎮',  color: '#8b5cf6', description: 'Gamificando a vida',   xpRequired: 200 },
    { id: 'acc_fire',    type: 'accessory', name: 'Em Chamas 🔥', emoji: '🔥',  color: '#ef4444', description: '7 dias de streak',     achievementRequired: 'streak_7' },
    { id: 'acc_diamond', type: 'accessory', name: 'Diamante',     emoji: '💎',  color: '#06b6d4', description: 'Determinação máxima',  xpRequired: 400 },
    { id: 'acc_rocket',  type: 'accessory', name: 'Foguete',      emoji: '🚀',  color: '#f97316', description: 'Lançando features',    xpRequired: 150 },

    // ── FUNDOS ───────────────────────────────────────────────────────────────
    { id: 'bg_dark',    type: 'background', name: 'Dark',     emoji: '🌑',  color: '#0d0d10', description: 'Clássico',              xpRequired: 0   },
    { id: 'bg_galaxy',  type: 'background', name: 'Galáxia',  emoji: '🌌',  color: '#8b5cf6', description: 'Um dev no cosmos',      xpRequired: 300 },
    { id: 'bg_matrix',  type: 'background', name: 'Matrix',   emoji: '💻',  color: '#10b981', description: 'Chuva de código verde', xpRequired: 150 },
    { id: 'bg_fire',    type: 'background', name: 'Chamas',   emoji: '🔥',  color: '#ef4444', description: 'Ardente',               xpRequired: 250 },
    { id: 'bg_ocean',   type: 'background', name: 'Ocean',    emoji: '🌊',  color: '#38bdf8', description: 'Profundo como SQL',     xpRequired: 400 },
    { id: 'bg_city',    type: 'background', name: 'Cidade',   emoji: '🏙️', color: '#94a3b8', description: 'Urbano e tech',         xpRequired: 600 },

    // ── BADGES ───────────────────────────────────────────────────────────────
    { id: 'badge_first',   type: 'badge', name: 'Primeiro Passo', emoji: '⭐', color: '#f59e0b', description: 'Primeiro aprendizado', achievementRequired: 'first_learning' },
    { id: 'badge_fire',    type: 'badge', name: 'Em Chamas',      emoji: '🔥', color: '#ef4444', description: '7 dias de sequência',  achievementRequired: 'streak_7'       },
    { id: 'badge_diamond', type: 'badge', name: 'Diamante',       emoji: '💎', color: '#06b6d4', description: 'Determinação',          xpRequired: 400 },
    { id: 'badge_rocket',  type: 'badge', name: 'Foguete',        emoji: '🚀', color: '#f97316', description: 'Evolução acelerada',    xpRequired: 150 },
    { id: 'badge_legend',  type: 'badge', name: 'Lendário',       emoji: '🏆', color: '#FFD700', description: 'Máximo nível',          xpRequired: 900 },
];

// ─── Gradientes de fundo por ID ───────────────────────────────────────────────
export const BG_GRADIENTS: Record<string, [string, string]> = {
    bg_dark:   ['#0d0d10', '#16151d'],
    bg_galaxy: ['#0a0520', '#1a0a3a'],
    bg_matrix: ['#001a00', '#003300'],
    bg_fire:   ['#2a0a00', '#3a1200'],
    bg_ocean:  ['#001a2e', '#003a5e'],
    bg_city:   ['#0a0f1a', '#1a2030'],
};

// ─── Cores ambiente por fundo ─────────────────────────────────────────────────
export const BG_GLOW: Record<string, string> = {
    bg_dark:   '#8b5cf6',
    bg_galaxy: '#8b5cf6',
    bg_matrix: '#10b981',
    bg_fire:   '#ef4444',
    bg_ocean:  '#38bdf8',
    bg_city:   '#94a3b8',
};
