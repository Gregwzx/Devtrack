// src/types/learning.ts
// Tipo canônico de Learning — fonte única de verdade.
// Importe DAQUI em vez de redefinir localmente em cada arquivo.

export interface Learning {
    id: string;
    text: string;
    date: string;   // ISO string
    area?: string;
    type?: string;
    stacks?: string[];
}
