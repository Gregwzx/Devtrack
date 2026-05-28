// src/data/dicebear.ts — opções de customização para DiceBear Micah (Estilo Premium/Figma)
// Documentação: https://www.dicebear.com/styles/micah/

export interface AvatarOption {
    id: string;
    label: string;
    color?: string;       // para preview visual (bolinha de cor)
    emoji?: string;       // para preview visual (ícone se não houver cor)
    xpRequired?: number;  // bloqueio por XP
}

export interface DiceBearConfig {
    hair: string;
    hairColor: string;
    baseColor: string; // tom de pele
    shirt: string;
    shirtColor: string;
    glasses: string;
    mouth: string;
    eyes: string;
    eyebrows: string;
    facialHair: string;
    earrings: string;
    backgroundColor: string;
}

// Configuração padrão ao criar um dev pela primeira vez
export const DEFAULT_CONFIG: DiceBearConfig = {
    hair:            'fonze',
    hairColor:       '000000',
    baseColor:       'f9c9b6',
    shirt:           'crew',
    shirtColor:      '9287ff',
    glasses:         'empty',
    mouth:           'smile',
    eyes:            'eyes',
    eyebrows:        'up',
    facialHair:      'empty',
    earrings:        'empty',
    backgroundColor: 'e05c7a', // Rosa Duolingo
};

// ─── Cabelos (Hair) ───────────────────────────────────────────────────────────
export const HAIR_OPTIONS: AvatarOption[] = [
    { id: 'mrClean',    label: 'Careca',     emoji: '🧑‍🦲', xpRequired: 0 },
    { id: 'fonze',      label: 'Curto Padrão',emoji: '💇', xpRequired: 0 },
    { id: 'dougFunny',  label: 'Curto Topete',emoji: '💇‍♂️', xpRequired: 0 },
    { id: 'mrT',        label: 'Moicano',    emoji: '🎸', xpRequired: 50 },
    { id: 'pixie',      label: 'Pixie',      emoji: '💁', xpRequired: 0 },
    { id: 'dannyPhantom',label: 'Moderno',   emoji: '💇‍♂️', xpRequired: 80 },
    { id: 'full',       label: 'Longo',      emoji: '👩', xpRequired: 0 },
    { id: 'turban',     label: 'Turbante',   emoji: '👳', xpRequired: 30 },
];

// ─── Cores do Cabelo (Hair Color) ─────────────────────────────────────────────
export const HAIR_COLORS: AvatarOption[] = [
    { id: '000000', label: 'Preto',       color: '#000000', xpRequired: 0 },
    { id: '77311d', label: 'Marrom',      color: '#77311d', xpRequired: 0 },
    { id: 'fc909f', label: 'Rosa',        color: '#fc909f', xpRequired: 100 },
    { id: 'f3b63a', label: 'Loiro',       color: '#f3b63a', xpRequired: 30 },
    { id: 'e0e0e0', label: 'Platinado',   color: '#e0e0e0', xpRequired: 80 },
    { id: '9287ff', label: 'Roxo Tech',   color: '#9287ff', xpRequired: 150 },
];

// ─── Tons de Pele (Base Color) ────────────────────────────────────────────────
export const SKIN_COLORS: AvatarOption[] = [
    { id: 'f9c9b6', label: 'Claro 1',    color: '#f9c9b6', xpRequired: 0 },
    { id: 'f3b63a', label: 'Dourado',    color: '#f3b63a', xpRequired: 0 },
    { id: 'ac6651', label: 'Moreno',     color: '#ac6651', xpRequired: 0 },
    { id: '77311d', label: 'Escuro 1',   color: '#77311d', xpRequired: 0 },
    { id: '000000', label: 'Escuro 2',   color: '#2a1a15', xpRequired: 0 },
];

// ─── Roupas (Shirt) ───────────────────────────────────────────────────────────
export const CLOTHES_OPTIONS: AvatarOption[] = [
    { id: 'crew',     label: 'Camiseta',   emoji: '👕', xpRequired: 0 },
    { id: 'collared', label: 'Gola Polo',  emoji: '👔', xpRequired: 40 },
    { id: 'open',     label: 'Jaqueta',    emoji: '🧥', xpRequired: 100 },
];

// ─── Cores da Roupa (Shirt Color) ─────────────────────────────────────────────
export const CLOTHING_COLORS: AvatarOption[] = [
    { id: '000000', label: 'Preto Dev',   color: '#1a1a1a', xpRequired: 0 },
    { id: 'ffffff', label: 'Branco Puro', color: '#ffffff', xpRequired: 0 },
    { id: '9287ff', label: 'Roxo Primary',color: '#9287ff', xpRequired: 0 },
    { id: '77311d', label: 'Marrom',      color: '#77311d', xpRequired: 30 },
    { id: 'f3b63a', label: 'Amarelo',     color: '#f3b63a', xpRequired: 50 },
    { id: 'fc909f', label: 'Rosa Pastel', color: '#fc909f', xpRequired: 80 },
];

// ─── Óculos e Acessórios (Glasses / Earrings) ─────────────────────────────────
export const GLASSES_OPTIONS: AvatarOption[] = [
    { id: 'empty',  label: 'Nenhum',      emoji: '❌', xpRequired: 0 },
    { id: 'round',  label: 'Redondo',     emoji: '👓', xpRequired: 50 },
    { id: 'square', label: 'Quadrado',    emoji: '🤓', xpRequired: 80 },
];

// ─── Expressões Faciais (Mouth / Eyes / Eyebrows) ─────────────────────────────
export const MOUTH_OPTIONS: AvatarOption[] = [
    { id: 'smile',    label: 'Sorriso',     emoji: '😊', xpRequired: 0 },
    { id: 'smirk',    label: 'Meio Sorriso',emoji: '😏', xpRequired: 30 },
    { id: 'pucker',   label: 'Sério',       emoji: '😐', xpRequired: 0 },
    { id: 'frown',    label: 'Bravo',       emoji: '😤', xpRequired: 50 },
    { id: 'surprised',label: 'Surpreso',    emoji: '😮', xpRequired: 80 },
    { id: 'laughing', label: 'Rindo',       emoji: '😄', xpRequired: 120 },
];

// ─── Fundos (Background Color) ────────────────────────────────────────────────
export const BACKGROUND_OPTIONS: AvatarOption[] = [
    { id: 'e05c7a', label: 'Vermelho',    color: '#e05c7a', xpRequired: 0 },
    { id: '58cc02', label: 'Verde',       color: '#58cc02', xpRequired: 0 },
    { id: '1cb0f6', label: 'Azul',        color: '#1cb0f6', xpRequired: 20 },
    { id: 'f59e0b', label: 'Laranja',     color: '#f59e0b', xpRequired: 40 },
    { id: 'ce82ff', label: 'Roxo',        color: '#ce82ff', xpRequired: 60 },
    { id: '1e1c2e', label: 'Dark Mode',   color: '#1e1c2e', xpRequired: 0 },
];

export const DICEBEAR_STORAGE_KEY = (email: string) => `DEVTRACK_DICEBEAR_MICAH_${email}`;
