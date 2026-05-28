// app/trail/[area].tsx — rota dinâmica para a trilha de uma área específica
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import TrailScreen from '../../src/screens/TrailScreen';
import type { StudyArea } from '../../src/services/ai.service';

const VALID_AREAS: StudyArea[] = ['frontend', 'backend', 'mobile', 'fullstack', 'devops'];

export default function TrailAreaRoute() {
    const { area } = useLocalSearchParams<{ area: string }>();
    const safeArea: StudyArea = VALID_AREAS.includes(area as StudyArea)
        ? (area as StudyArea)
        : 'fullstack';

    return <TrailScreen area={safeArea} />;
}
