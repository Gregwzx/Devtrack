import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function LearningSection() {

    // depois virá da API
    const learnings = [
        { id: 1, text: 'useEffect executa efeitos colaterais após renderização no React.' },
        { id: 2, text: 'Flexbox no React Native usa flexDirection column por padrão.' },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Brain Storms</Text>

            {learnings.map(item => (
                <View key={item.id} style={styles.card}>
                    <View style={styles.dot} />
                    <Text style={styles.learning}>{item.text}</Text>
                </View>
            ))}

            <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addText}>+ Registrar aprendizado</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 28,
    },

    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 14,
    },

    card: {
        flexDirection: 'row',
        backgroundColor: '#1a1d24',
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
        alignItems: 'flex-start',
    },

    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ff7a00',
        marginTop: 7,
        marginRight: 10,
    },

    learning: {
        color: '#ddd',
        flex: 1,
        lineHeight: 20,
        fontSize: 14,
    },

    addButton: {
        marginTop: 10,
        backgroundColor: '#ff7a00',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
    },

    addText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});