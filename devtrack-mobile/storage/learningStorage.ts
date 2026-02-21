import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'DEVTRACK_LEARNINGS';

export async function getLearnings() {
    const data = await AsyncStorage.getItem(KEY);
    return data ? JSON.parse(data) : [];
}

export async function addLearning(text: string) {
    const learnings = await getLearnings();

    const newLearning = {
        id: Date.now().toString(),
        text,
        date: new Date().toISOString(),
    };

    const updated = [newLearning, ...learnings];

    await AsyncStorage.setItem(KEY, JSON.stringify(updated));

    return updated;
}