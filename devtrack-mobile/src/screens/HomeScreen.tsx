import React from 'react';
import { ScrollView, SafeAreaView, StyleSheet, View } from 'react-native';

import StreakSection from '../components/home/StreakSection';
import StatsSection from '../components/home/StatsSection';
import LearningSection from '../components/home/LearningSection';
import AISuggestions from '../components/home/AISuggestions';

export default function HomeScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <StreakSection />
                <StatsSection />
                <LearningSection />
                <AISuggestions />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f1117',
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
});