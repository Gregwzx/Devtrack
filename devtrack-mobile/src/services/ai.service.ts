// src/services/ai.service.ts
// Integração com o Gemini 1.5 Flash. A API key vem do app.json via expo-constants
// porque não dá pra colocar no .env de forma segura em apps mobile — a key
// acaba no bundle de qualquer forma, mas pelo menos não fica exposta no código.

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
    suggestion: string;       // análise personalizada dos aprendizados reais (2-3 frases)
    tip: string;              // dica técnica concreta pra aplicar hoje
    nextTopics: string[];     // 3 tópicos específicos pra estudar — sem verbos, só o tema
    detectedArea: StudyArea;
    mood: 'motivating' | 'challenging' | 'reflective';
}

// Função base de chamada à API — lida com a request e limpa o markdown que
// o Gemini às vezes coloca em volta do JSON mesmo quando pedimos pra não colocar
async function callGemini(prompt: string): Promise<string> {
    const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.85,   // um pouco de criatividade, mas sem delirar
                maxOutputTokens: 500,
                topP: 0.9,
            },
        }),
    });
    if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    // o Gemini às vezes envolve o JSON em ```json ... ``` mesmo com instrução contrária
    return raw.replace(/```json|```/g, '').trim();
}

// O prompt é a parte mais importante de tudo isso.
// Quanto mais específico e contextualizado, mais útil a resposta.
// Testei várias versões — essa é a que gerou resultados menos genéricos.
function buildPrompt(input: AISuggestionInput): string {
    const { streak, learnings, firstName } = input;

    // monta o histórico de aprendizados com contexto de quando foi
    const recentLearnings = learnings
        .slice(0, 8)  // últimos 8 são suficientes pra ter contexto sem estourar o contexto do modelo
        .map((l, i) => {
            const daysAgo = Math.floor((Date.now() - new Date(l.date).getTime()) / 86400000);
            const when = daysAgo === 0 ? 'hoje' : daysAgo === 1 ? 'ontem' : `${daysAgo} dias atrás`;
            return `  ${i + 1}. [${when}] ${l.text}`;
        })
        .join('\n');

    // contexto do streak ajuda o modelo a calibrar o tom (motivar vs desafiar)
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
    // se não tiver API key configurada, vai direto pro fallback — útil em dev local
    if (!GEMINI_API_KEY) return fallback(input);

    try {
        const raw    = await callGemini(buildPrompt(input));
        const parsed = JSON.parse(raw);

        // valida se a área veio num valor esperado — o modelo às vezes inventa
        const area = (['frontend', 'backend', 'fullstack'] as StudyArea[]).includes(parsed.detectedArea)
            ? (parsed.detectedArea as StudyArea)
            : detectAreaFromText(input.learnings);  // fallback heurístico

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
        // qualquer erro (rede, JSON inválido, etc.) cai aqui sem travar o app
        return fallback(input);
    }
}

// Detecta a área pelo texto dos aprendizados — regex simples mas funciona
// bem pra 90% dos casos. Fullstack é o default quando não dá pra decidir.
function detectAreaFromText(learnings: { text: string }[]): StudyArea {
    const txt = learnings.map(l => l.text.toLowerCase()).join(' ');
    const isFront = /react|css|html|ui|ux|component|vue|angular|tailwind|figma|design|mobile|next\.?js|svelte/.test(txt);
    const isBack  = /node|api|server|database|sql|python|java|docker|cloud|auth|backend|rest|graphql|redis|postgres|mongo/.test(txt);
    return isFront && !isBack ? 'frontend' : isBack && !isFront ? 'backend' : 'fullstack';
}

// Respostas pré-definidas pra quando a API não está disponível.
// Tentei deixar menos genéricas possível mesmo sendo estáticas.
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