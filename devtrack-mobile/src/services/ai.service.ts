// src/services/ai.service.ts
import Constants from 'expo-constants';

const GEMINI_API_KEY = (Constants.expoConfig?.extra?.geminiApiKey as string) ?? '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export type StudyArea = 'frontend' | 'backend' | 'fullstack';

export interface AISuggestionInput {
    streak: number;
    learnings: { text: string; date: string }[];
    firstName: string;
}

export interface AIResult {
    suggestion: string;       // Análise personalizada (2-3 frases)
    tip: string;              // Dica rápida de produtividade
    nextTopics: string[];     // 3 tópicos específicos para estudar hoje
    detectedArea: StudyArea;
    mood: 'motivating' | 'challenging' | 'reflective'; // Tom da mensagem
}

async function callGemini(prompt: string): Promise<string> {
    const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.85,
                maxOutputTokens: 500,
                topP: 0.9,
            },
        }),
    });
    if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return raw.replace(/```json|```/g, '').trim();
}

function buildPrompt(input: AISuggestionInput): string {
    const { streak, learnings, firstName } = input;

    const recentLearnings = learnings
        .slice(0, 8)
        .map((l, i) => {
            const daysAgo = Math.floor((Date.now() - new Date(l.date).getTime()) / 86400000);
            const when = daysAgo === 0 ? 'hoje' : daysAgo === 1 ? 'ontem' : `${daysAgo} dias atrás`;
            return `  ${i + 1}. [${when}] ${l.text}`;
        })
        .join('\n');

    const streakContext =
        streak === 0 ? 'nunca estudou ou perdeu a sequência recentemente' :
        streak < 3   ? 'está começando uma nova sequência, precisa de motivação' :
        streak < 7   ? 'tem uma sequência curta, está ganhando ritmo' :
        streak < 14  ? 'tem uma boa sequência, está consistente' :
        streak < 30  ? 'tem uma sequência impressionante, está no ritmo certo' :
                       'tem uma sequência lendária, é extremamente dedicado';

    return `Você é o DevTrack Assistant — um mentor de carreira especializado em desenvolvimento de software. Seu tom é direto, específico, técnico e motivador. Você NÃO é genérico. Você analisa os aprendizados reais do usuário e dá orientações concretas.

DADOS DO USUÁRIO:
- Nome: ${firstName}
- Sequência atual: ${streak} dias (contexto: ${streakContext})
- Aprendizados registrados recentemente:
${recentLearnings || '  (nenhum aprendizado registrado ainda — usuário está começando)'}

REGRAS OBRIGATÓRIAS:
1. "suggestion": analise os aprendizados REAIS acima. Identifique padrões, gaps ou evolução. Seja ESPECÍFICO ao tema (ex: se estudou useEffect, mencione useEffect). 2-3 frases densas. Nunca diga "continue assim" sem contexto.
2. "tip": uma técnica ou recurso CONCRETO relacionado ao que foi estudado (ex: "Leia a RFC do React 19 sobre hooks", não "estude mais").
3. "nextTopics": exatamente 3 tópicos ESPECÍFICOS para estudar HOJE, baseados no que foi registrado. Formato curto: "React Query v5", "CSS Container Queries", "JWT refresh tokens". Não coloque verbos como "Estudar" ou "Aprender" — só o tópico.
4. "detectedArea": "frontend" | "backend" | "fullstack"
5. "mood": "motivating" se streak >= 7 ou muitos registros, "challenging" se está estagnado ou poucos registros recentes, "reflective" se os temas são variados ou complexos.

Responda APENAS com JSON válido, sem markdown, sem explicações:
{
  "suggestion": "...",
  "tip": "...",
  "nextTopics": ["...", "...", "..."],
  "detectedArea": "...",
  "mood": "..."
}`;
}

export async function getAIResult(input: AISuggestionInput): Promise<AIResult> {
    if (!GEMINI_API_KEY) return fallback(input);

    try {
        const raw    = await callGemini(buildPrompt(input));
        const parsed = JSON.parse(raw);

        const area = (['frontend', 'backend', 'fullstack'] as StudyArea[]).includes(parsed.detectedArea)
            ? (parsed.detectedArea as StudyArea)
            : detectAreaFromText(input.learnings);

        const mood = (['motivating', 'challenging', 'reflective'] as const).includes(parsed.mood)
            ? parsed.mood
            : 'motivating';

        return {
            suggestion:  parsed.suggestion   ?? 'Continue evoluindo!',
            tip:         parsed.tip          ?? 'Consistência é a chave.',
            nextTopics:  Array.isArray(parsed.nextTopics) ? parsed.nextTopics.slice(0, 3) : [],
            detectedArea: area,
            mood,
        };
    } catch {
        return fallback(input);
    }
}

function detectAreaFromText(learnings: { text: string }[]): StudyArea {
    const txt = learnings.map(l => l.text.toLowerCase()).join(' ');
    const isFront = /react|css|html|ui|ux|component|vue|angular|tailwind|figma|design|mobile|next\.?js|svelte/.test(txt);
    const isBack  = /node|api|server|database|sql|python|java|docker|cloud|auth|backend|rest|graphql|redis|postgres|mongo/.test(txt);
    return isFront && !isBack ? 'frontend' : isBack && !isFront ? 'backend' : 'fullstack';
}

function fallback(input: AISuggestionInput): AIResult {
    const area = detectAreaFromText(input.learnings);
    const hasLearnings = input.learnings.length > 0;

    const suggestions: Record<StudyArea, string> = {
        frontend: hasLearnings
            ? `Você tem registros sobre ${input.learnings[0]?.text.slice(0, 40)}... Aprofunde os fundamentos antes de avançar para padrões mais complexos.`
            : `Comece registrando o que está estudando hoje, ${input.firstName}. Isso ajuda a criar conexões entre os temas.`,
        backend: hasLearnings
            ? `Seus estudos de backend estão evoluindo. Foque em entender o fluxo completo de uma requisição antes de adicionar mais tecnologias.`
            : `Registre seu primeiro aprendizado de hoje, ${input.firstName}. O hábito de documentar acelera muito o aprendizado.`,
        fullstack: hasLearnings
            ? `Você está estudando temas variados. Tente conectar o que aprendeu no frontend com conceitos equivalentes no backend.`
            : `Comece seu primeiro registro, ${input.firstName}. Pode ser algo simples — o importante é criar o hábito.`,
    };

    const topicsByArea: Record<StudyArea, string[]> = {
        frontend: ['React Server Components', 'CSS Cascade Layers', 'Web Performance APIs'],
        backend:  ['Database Indexing', 'JWT Best Practices', 'API Rate Limiting'],
        fullstack:['TypeScript Generics', 'HTTP Caching', 'Monorepo Setup'],
    };

    return {
        suggestion:   suggestions[area],
        tip:          'Use o método Feynman: explique o que estudou como se fosse ensinar alguém.',
        nextTopics:   topicsByArea[area],
        detectedArea: area,
        mood:         input.streak >= 7 ? 'motivating' : input.learnings.length < 3 ? 'challenging' : 'reflective',
    };
}