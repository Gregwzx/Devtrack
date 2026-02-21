import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatsSection() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>📊 Suas métricas</Text>

            <View style={styles.row}>
                <View style={styles.card}>
                    <Text style={styles.value}>42h</Text>
                    <Text style={styles.label}>Tempo total</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.value}>18</Text>
                    <Text style={styles.label}>Skills</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.value}>96</Text>
                    <Text style={styles.label}>Aprendizados</Text>
                </View>
            </View>
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
        marginBottom: 12,
    },

    row: {
        flexDirection: 'row',
        gap: 12,
    },

    card: {
        flex: 1,
        backgroundColor: '#1a1d24',
        paddingVertical: 18,
        paddingHorizontal: 14,
        borderRadius: 16,

        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },

    value: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
    },

    label: {
        color: '#9aa0a6',
        fontSize: 12,
        marginTop: 6,
    },
});