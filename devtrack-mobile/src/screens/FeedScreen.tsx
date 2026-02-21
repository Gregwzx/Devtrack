import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import FeedList from '../components/feed/FeedList';

export default function FeedScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <FeedList />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f1117',
        padding: 16,
    },
});