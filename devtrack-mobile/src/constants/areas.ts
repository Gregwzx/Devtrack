// src/constants/areas.ts
// Configuração centralizada de áreas de estudo.
// Importar daqui em vez de redefinir em cada tela.

import { Code2, Server, Layers } from 'lucide-react-native';
import type { StudyArea } from '../services/ai.service';

export interface AreaConfig {
    label: string;
    Icon: any;
    color: string;
    bg: string;
    desc: string;
}

export const AREA_CONFIG: Record<StudyArea, AreaConfig> = {
    frontend: {
        label: 'Frontend',
        Icon:  Code2,
        color: '#06b6d4',
        bg:    '#06b6d412',
        desc:  'UI · React · CSS · UX',
    },
    backend: {
        label: 'Backend',
        Icon:  Server,
        color: '#10b981',
        bg:    '#10b98112',
        desc:  'APIs · DB · Cloud',
    },
    fullstack: {
        label: 'Fullstack',
        Icon:  Layers,
        color: '#8b5cf6',
        bg:    '#8b5cf612',
        desc:  'Full stack dev',
    },
};

export const AREA_ICON = Object.fromEntries(
    Object.entries(AREA_CONFIG).map(([k, v]) => [k, { Icon: v.Icon, color: v.color }])
) as Record<StudyArea, { Icon: any; color: string }>;