import React from 'react';
import { FlatList } from 'react-native';
import PostCard from './PostCard';

const DATA = [
    {
        id: '1',
        user: 'Greg',
        content: 'Hoje aprendi sobre useEffect e ciclo de vida no React.',
        time: '2h atrás',
    },
    {
        id: '2',
        user: 'AnaDev',
        content: 'Finalmente entendi async/await 😭🔥',
        time: '5h atrás',
    },
];

export default function FeedList() {
    return (
        <FlatList
            data={DATA}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <PostCard
                    user={item.user}
                    content={item.content}
                    time={item.time}
                />
            )}
        />
    );
}