// src/types/learning.ts
import type { StudyArea } from '../services/ai.service';

export interface Learning {
    id: string;
    text: string;
    date: string; // ISO string
}

export interface StreakData {
    count: number;
    lastDate: string | null; // YYYY-MM-DD key
}

export interface Stats {
    totalHours: number;
    skills: number;
    learnings: number;
}

export type LearningState = {
    items:   Learning[];
    streak:  StreakData;
    stats:   Stats;
    area:    StudyArea;
};