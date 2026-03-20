// src/constants/areas.ts
// Config centralizada das áreas de estudo. Em vez de redefinir ícone/cor
// em cada tela individualmente, importo daqui — mudou aqui, mudou em todo lugar.

import { Code2, Server, Layers } from 'lucide-react-native';
import type { StudyArea } from '../services/ai.service';

export interface AreaConfig {
    label: string;
    Icon: any;
    color: string;
    bg: string;    // versão transparente da cor, pra fundos de card
    desc: string;
}

// Por enquanto só 3 áreas mapeadas aqui, mas o modal de registro
// tem 6 (mobile, devops, security também). O mapeamento acontece no handleAddLearning
// da HomeScreen — mobile/devops batem em 'frontend'/'backend' por compatibilidade.
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

// Atalho pra quando só preciso do ícone e da cor (ex: chips rápidos)
export const AREA_ICON = Object.fromEntries(
    Object.entries(AREA_CONFIG).map(([k, v]) => [k, { Icon: v.Icon, color: v.color }])
) as Record<StudyArea, { Icon: any; color: string }>;