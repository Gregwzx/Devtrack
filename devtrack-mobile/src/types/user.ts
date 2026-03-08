// src/types/user.ts
import type { StudyArea } from '../services/ai.service';

export interface SocialLink {
    id: string;
    label: string;
    url: string;
}

export interface LocalProfile {
    bio: string;
    avatarUri: string | null;
    bannerColor: string;
    links: SocialLink[];
}

export interface UserStats {
    streak: number;
    learningsCount: number;
    totalHours: number;
    skills: number;
    studyArea: StudyArea;
    lastStreakDate: string | null;
}

export interface Badge {
    id: string;
    label: string;
    desc: string;
    Icon: any;
    color: string;
    unlocked: boolean;
}