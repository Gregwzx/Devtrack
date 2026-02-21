import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AISuggestions() {

    const suggestion =
        "Você estudou React por 3 dias seguidos. Que tal revisar hooks avançados hoje?";

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🤖 Sugestões da IA</Text>

            <View style={styles.card}>
                <View style={styles.header}>
                    <View style={styles.aiBadge}>
                        <Text style={styles.aiText}>AI</Text>
                    </View>
                    <Text style={styles.aiLabel}>DevTrack Assistant</Text>
                </View>

                <Text style={styles.text}>{suggestion}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 40,
    },

    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 14,
    },

    card: {
        backgroundColor: '#12141a',
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#2a2f3a',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },

    aiBadge: {
        backgroundColor: '#7c3aed',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 8,
    },

    aiText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },

    aiLabel: {
        color: '#aaa',
        fontSize: 13,
    },

    text: {
        color: '#ddd',
        lineHeight: 22,
        fontSize: 14,
    },
});