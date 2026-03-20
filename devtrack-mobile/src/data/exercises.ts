// src/data/exercises.ts
// Dados mockados — nenhuma dependência externa.

export type Difficulty = 'iniciante' | 'intermediário' | 'avançado';
export type Category = 'logica' | 'frontend' | 'backend' | 'mobile' | 'git' | 'api' | 'banco';

export interface Exercise {
    id: string;
    title: string;
    description: string;       // resumo curto — aparece no card
    detail: string;            // enunciado completo — aparece no modal
    hint: string;              // dica sem entregar a resposta
    example?: string;          // exemplo de entrada/saída (opcional)
    tags: string[];
    difficulty: Difficulty;
    category: Category;
    xp: number;
}

export interface CategoryMeta {
    id: Category;
    label: string;
    emoji: string;
    color: string;
    description: string;
}

// ─── Metadados das categorias ─────────────────────────────────────────────────
export const CATEGORY_META: CategoryMeta[] = [
    { id: 'logica',    label: 'Lógica',        emoji: '🧠', color: '#8b5cf6', description: 'Algoritmos e raciocínio'  },
    { id: 'frontend',  label: 'Frontend',      emoji: '🎨', color: '#06b6d4', description: 'HTML, CSS e JavaScript'   },
    { id: 'backend',   label: 'Backend',       emoji: '⚙️', color: '#10b981', description: 'Node, APIs e servidores'  },
    { id: 'mobile',    label: 'Mobile',        emoji: '📱', color: '#f59e0b', description: 'React Native e Expo'      },
    { id: 'git',       label: 'Git',           emoji: '🌿', color: '#e879f9', description: 'Versionamento de código'  },
    { id: 'api',       label: 'API',           emoji: '🔌', color: '#f97316', description: 'REST, fetch e integração' },
    { id: 'banco',     label: 'Banco de Dados',emoji: '🗄️', color: '#38bdf8', description: 'SQL e modelagem'          },
];

// ─── Exercícios ───────────────────────────────────────────────────────────────
export const EXERCISES: Exercise[] = [

    // ── LÓGICA ────────────────────────────────────────────────────────────────
    {
        id: 'l1',
        title: 'FizzBuzz',
        description: 'Imprima números de 1 a 100 substituindo múltiplos por palavras.',
        detail:
            'Crie uma função `fizzBuzz()` que percorra os números de 1 a 100.\n\n' +
            '• Múltiplos de 3 → imprima "Fizz"\n' +
            '• Múltiplos de 5 → imprima "Buzz"\n' +
            '• Múltiplos de 3 E 5 → imprima "FizzBuzz"\n' +
            '• Demais → imprima o número normalmente\n\n' +
            'O desafio parece simples, mas a ordem das condições importa muito. Pense antes de codar!',
        hint: 'Verifique o caso "FizzBuzz" (divisível por 15) ANTES dos casos individuais.',
        example: '1, 2, Fizz, 4, Buzz, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz...',
        tags: ['loops', 'condicionais', 'clássico'],
        difficulty: 'iniciante',
        category: 'logica',
        xp: 20,
    },
    {
        id: 'l2',
        title: 'Inverter String',
        description: 'Crie uma função que retorne uma string ao contrário.',
        detail:
            'Implemente `reverseString(str: string): string` sem usar `.reverse()` diretamente na string.\n\n' +
            'Tente pelo menos duas abordagens diferentes:\n' +
            '1. Usando um loop simples\n' +
            '2. Usando métodos de array\n\n' +
            'Depois, responda: qual é mais legível? Qual é mais performática para strings longas?',
        hint: 'Strings em JS não têm .reverse(), mas arrays sim. Como transformar uma string em array?',
        example: 'reverseString("hello") → "olleh"\nreverseString("DevTrack") → "kcArTveD"',
        tags: ['strings', 'arrays', 'métodos'],
        difficulty: 'iniciante',
        category: 'logica',
        xp: 15,
    },
    {
        id: 'l3',
        title: 'Soma de Números Pares',
        description: 'Some todos os números pares de 1 a 100.',
        detail:
            'Crie uma função `sumEvens(max: number): number` que some todos os números pares de 1 até `max` (inclusive).\n\n' +
            'Depois de resolver com um loop, tente resolver em uma única linha usando `.filter()` e `.reduce()`.\n\n' +
            'Bônus: existe uma fórmula matemática que resolve isso sem loop?',
        hint: 'Um número é par quando número % 2 === 0.',
        example: 'sumEvens(10) → 30  (2+4+6+8+10)\nsumEvens(100) → 2550',
        tags: ['loops', 'reduce', 'matemática'],
        difficulty: 'iniciante',
        category: 'logica',
        xp: 15,
    },
    {
        id: 'l4',
        title: 'Palíndromo',
        description: 'Verifique se uma palavra lida ao contrário é igual à original.',
        detail:
            'Implemente `isPalindrome(str: string): boolean` que retorne `true` se a string for um palíndromo.\n\n' +
            'Regras:\n' +
            '• Ignore maiúsculas/minúsculas ("Ama" → true)\n' +
            '• Ignore espaços ("A man a plan a canal Panama" → true)\n' +
            '• Ignore pontuação\n\n' +
            'Dica: normalize a string antes de comparar.',
        hint: 'Use .toLowerCase() e .replace(/[^a-z0-9]/g, "") para normalizar antes de comparar.',
        example: 'isPalindrome("racecar") → true\nisPalindrome("hello") → false\nisPalindrome("Ama") → true',
        tags: ['strings', 'regex', 'lógica'],
        difficulty: 'iniciante',
        category: 'logica',
        xp: 25,
    },
    {
        id: 'l5',
        title: 'Fibonacci',
        description: 'Retorne o N-ésimo número da sequência de Fibonacci.',
        detail:
            'Implemente `fibonacci(n: number): number`.\n\n' +
            'A sequência começa: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34...\n' +
            'Cada número é a soma dos dois anteriores.\n\n' +
            'Resolva de duas formas:\n' +
            '1. Iterativa (loop)\n' +
            '2. Recursiva\n\n' +
            'Qual é mais eficiente? O que acontece com fibonacci(50) recursivo? Por quê?',
        hint: 'A versão recursiva pura tem complexidade O(2^n). Pesquise sobre "memoização" para otimizar.',
        example: 'fibonacci(0) → 0\nfibonacci(1) → 1\nfibonacci(7) → 13\nfibonacci(10) → 55',
        tags: ['recursão', 'iteração', 'sequência'],
        difficulty: 'intermediário',
        category: 'logica',
        xp: 40,
    },
    {
        id: 'l6',
        title: 'Busca Binária',
        description: 'Encontre um elemento em um array ordenado em O(log n).',
        detail:
            'Implemente `binarySearch(arr: number[], target: number): number` que retorne o índice do elemento ou -1 se não encontrado.\n\n' +
            'Regras:\n' +
            '• O array sempre estará ordenado\n' +
            '• Não use indexOf() — implemente o algoritmo manualmente\n' +
            '• A cada iteração, elimine metade dos elementos\n\n' +
            'Depois explique: por que busca binária é O(log n) enquanto busca linear é O(n)?',
        hint: 'Mantenha dois ponteiros: "esquerda" e "direita". O meio é Math.floor((esq + dir) / 2).',
        example: 'binarySearch([1,3,5,7,9,11], 7) → 3\nbinarySearch([1,3,5,7,9,11], 4) → -1',
        tags: ['algoritmos', 'busca', 'complexidade'],
        difficulty: 'intermediário',
        category: 'logica',
        xp: 50,
    },

    // ── FRONTEND ──────────────────────────────────────────────────────────────
    {
        id: 'f1',
        title: 'Contador com useState',
        description: 'Crie um contador com botões de incrementar, decrementar e resetar.',
        detail:
            'Construa um componente React `Counter` que:\n\n' +
            '• Exiba o valor atual do contador\n' +
            '• Tenha botões: +1, -1 e Reset\n' +
            '• Não permita valores negativos (mínimo: 0)\n' +
            '• Mude a cor do número conforme o valor (0 = cinza, >0 = verde, máximo atingido = vermelho)\n\n' +
            'Desafio extra: adicione um input para definir o valor máximo.',
        hint: 'Use useState para o valor e Math.max(0, count - 1) para evitar negativos.',
        example: 'Estado inicial: 0 → clicar +1 três vezes → exibe 3 (em verde)',
        tags: ['react', 'useState', 'componentes'],
        difficulty: 'iniciante',
        category: 'frontend',
        xp: 20,
    },
    {
        id: 'f2',
        title: 'Filtro de Lista',
        description: 'Filtre uma lista de itens em tempo real conforme o usuário digita.',
        detail:
            'Crie um componente com:\n\n' +
            '• Um array de pelo menos 10 tecnologias (React, Node, Python, etc.)\n' +
            '• Um input de busca\n' +
            '• A lista filtrada em tempo real conforme a digitação\n' +
            '• Mensagem "Nenhum resultado" quando não há correspondência\n' +
            '• Highlight do texto correspondente na busca (opcional)\n\n' +
            'Use useMemo para evitar recalcular o filtro a cada render.',
        hint: 'filter + includes + toLowerCase() formam a base. useMemo([searchTerm]) evita renders extras.',
        example: 'Digitando "re" → aparece "React", "React Native", "Prettier"',
        tags: ['react', 'useMemo', 'filtro', 'UX'],
        difficulty: 'iniciante',
        category: 'frontend',
        xp: 25,
    },
    {
        id: 'f3',
        title: 'Dark Mode Toggle',
        description: 'Implemente alternância de tema claro/escuro com Context API.',
        detail:
            'Crie um sistema de tema com:\n\n' +
            '1. Um `ThemeContext` com React Context API\n' +
            '2. Um provider que guarda o estado do tema\n' +
            '3. Um botão de toggle em qualquer lugar da árvore\n' +
            '4. Pelo menos 3 componentes consumindo o tema\n' +
            '5. Persista o tema escolhido no localStorage (ou AsyncStorage no RN)\n\n' +
            'Dica: use um objeto de tokens de design {background, text, primary} para cada tema.',
        hint: 'useContext + createContext + um custom hook useTheme() tornam o consumo limpo.',
        example: 'Clicar no ☀️/🌙 alterna o tema em toda a aplicação instantaneamente.',
        tags: ['context', 'tema', 'estado global'],
        difficulty: 'intermediário',
        category: 'frontend',
        xp: 45,
    },
    {
        id: 'f4',
        title: 'Validação de Formulário',
        description: 'Construa um formulário com validação completa sem biblioteca externa.',
        detail:
            'Crie um formulário de cadastro com os campos:\n' +
            '• Nome (obrigatório, mín. 3 caracteres)\n' +
            '• E-mail (obrigatório, formato válido)\n' +
            '• Senha (obrigatória, mín. 8 chars, 1 número, 1 maiúscula)\n' +
            '• Confirmar senha (deve ser igual à senha)\n\n' +
            'Requisitos:\n' +
            '• Erros aparecem apenas após o campo ser tocado (onBlur)\n' +
            '• O botão de submit fica desabilitado se houver erros\n' +
            '• Indicador visual de força da senha',
        hint: 'Crie um estado separado para erros e outro para "campos tocados". Valide no onBlur.',
        example: 'Ao sair do campo e-mail com "joao" → aparece "E-mail inválido"',
        tags: ['formulários', 'validação', 'UX'],
        difficulty: 'intermediário',
        category: 'frontend',
        xp: 50,
    },

    // ── BACKEND ───────────────────────────────────────────────────────────────
    {
        id: 'b1',
        title: 'Servidor Express Básico',
        description: 'Crie um servidor Node.js com Express com 3 rotas funcionais.',
        detail:
            'Configure um servidor Express com as seguintes rotas:\n\n' +
            '• GET /         → {"message": "API funcionando!"}\n' +
            '• GET /users    → retorna array de usuários mockados\n' +
            '• GET /users/:id → retorna um usuário pelo id ou 404\n\n' +
            'Requisitos:\n' +
            '• Use nodemon para auto-reload\n' +
            '• Configure CORS para aceitar qualquer origem\n' +
            '• Trate o caso de id inexistente com status 404',
        hint: 'app.use(express.json()) e app.use(cors()) devem vir antes das rotas.',
        example: 'GET /users/99 → status 404, {"error": "Usuário não encontrado"}',
        tags: ['node', 'express', 'http', 'rest'],
        difficulty: 'iniciante',
        category: 'backend',
        xp: 30,
    },
    {
        id: 'b2',
        title: 'CRUD Completo em Memória',
        description: 'Implemente todas as operações de um CRUD usando array em memória.',
        detail:
            'Crie uma API REST para gerenciar "tarefas" com:\n\n' +
            '• POST   /tasks       → criar tarefa\n' +
            '• GET    /tasks       → listar todas\n' +
            '• GET    /tasks/:id   → buscar por id\n' +
            '• PUT    /tasks/:id   → atualizar\n' +
            '• DELETE /tasks/:id   → deletar\n\n' +
            'Os dados ficam em um array JavaScript (sem banco de dados).\n' +
            'Cada tarefa tem: id, title, done, createdAt.',
        hint: 'Gere ids únicos com Date.now().toString() ou uuid. Filtre o array para DELETE.',
        example: 'POST /tasks {"title":"Estudar"} → 201, {id:"1",title:"Estudar",done:false}',
        tags: ['crud', 'rest', 'express', 'api'],
        difficulty: 'iniciante',
        category: 'backend',
        xp: 40,
    },
    {
        id: 'b3',
        title: 'Middleware de Autenticação',
        description: 'Proteja rotas com um middleware que valida um token simples.',
        detail:
            'Crie um middleware `authenticate` que:\n\n' +
            '• Leia o header Authorization: Bearer <token>\n' +
            '• Valide o token contra uma lista fixa (mockada)\n' +
            '• Se válido: chame next() e adicione o usuário em req.user\n' +
            '• Se inválido: retorne status 401 com mensagem de erro\n\n' +
            'Proteja a rota GET /dashboard com esse middleware.\n\n' +
            'Desafio extra: implemente rate limiting básico (máx. 5 req/min por IP).',
        hint: 'req.headers.authorization?.split(" ")[1] extrai o token do header.',
        example: 'GET /dashboard sem token → 401\nGET /dashboard com token válido → 200',
        tags: ['middleware', 'auth', 'express', 'segurança'],
        difficulty: 'intermediário',
        category: 'backend',
        xp: 55,
    },
    {
        id: 'b4',
        title: 'Paginação de Resultados',
        description: 'Implemente paginação com page, limit e metadados na resposta.',
        detail:
            'Crie um endpoint GET /products que suporte paginação:\n\n' +
            '• Query params: ?page=1&limit=10\n' +
            '• Resposta deve incluir:\n' +
            '  - data: array de produtos da página atual\n' +
            '  - total: total de produtos\n' +
            '  - page: página atual\n' +
            '  - totalPages: total de páginas\n' +
            '  - hasNext / hasPrev: booleans\n\n' +
            'Use um array de 50 produtos mockados.',
        hint: 'offset = (page - 1) * limit. Depois use arr.slice(offset, offset + limit).',
        example: 'GET /products?page=2&limit=5 → produtos 6 a 10, totalPages: 10',
        tags: ['paginação', 'api', 'query params'],
        difficulty: 'intermediário',
        category: 'backend',
        xp: 45,
    },

    // ── MOBILE ────────────────────────────────────────────────────────────────
    {
        id: 'm1',
        title: 'FlatList Performática',
        description: 'Renderize uma lista de 100 itens com FlatList sem travar a UI.',
        detail:
            'Crie uma tela React Native com:\n\n' +
            '• FlatList com 100 itens\n' +
            '• Cada item exibe nome e avatar (pode ser placeholder)\n' +
            '• Pull-to-refresh simulado (1.5s de loading)\n' +
            '• keyExtractor correto para evitar warnings\n\n' +
            'Propriedades obrigatórias:\n' +
            '• initialNumToRender={10}\n' +
            '• maxToRenderPerBatch={10}\n' +
            '• windowSize={5}\n\n' +
            'Observe a diferença de performance com e sem essas props.',
        hint: 'Envolva o componente de item em React.memo para evitar re-renders desnecessários.',
        example: 'Lista fluida ao rolar, pull-to-refresh mostra spinner por 1.5s e recarrega.',
        tags: ['flatlist', 'performance', 'react native'],
        difficulty: 'iniciante',
        category: 'mobile',
        xp: 30,
    },
    {
        id: 'm2',
        title: 'AsyncStorage: Persistência Local',
        description: 'Salve e carregue preferências do usuário com AsyncStorage.',
        detail:
            'Implemente um sistema de preferências que:\n\n' +
            '• Salva nome do usuário, tema (claro/escuro) e tamanho de fonte\n' +
            '• Persiste entre sessões com AsyncStorage\n' +
            '• Cria um custom hook usePreferences() para encapsular a lógica\n' +
            '• Exibe um loading enquanto lê do storage no início\n\n' +
            'O hook deve expor: preferences, updatePreference, resetPreferences.',
        hint: 'Combine useEffect (carregar no mount) + useCallback (salvar) para um hook limpo.',
        example: 'Fechar e reabrir o app mantém o nome e tema escolhidos pelo usuário.',
        tags: ['asyncstorage', 'hooks', 'persistência'],
        difficulty: 'iniciante',
        category: 'mobile',
        xp: 35,
    },
    {
        id: 'm3',
        title: 'Animação com Reanimated',
        description: 'Crie um botão com animação de press usando react-native-reanimated.',
        detail:
            'Construa um botão animado que:\n\n' +
            '• Diminui de escala ao pressionar (scale: 1 → 0.95)\n' +
            '• Volta ao tamanho normal ao soltar\n' +
            '• Tem um feedback visual de cor no press\n' +
            '• Usa useSharedValue + useAnimatedStyle + withSpring\n\n' +
            'Depois, adicione uma animação de "pulse" contínua quando o botão estiver inativo por 3 segundos.',
        hint: 'onPressIn inicia a animação, onPressOut reverte. withSpring dá a física natural.',
        example: 'Pressionar o botão: encolhe suavemente e muda a cor. Soltar: volta com "mola".',
        tags: ['reanimated', 'animação', 'UX', 'gestos'],
        difficulty: 'intermediário',
        category: 'mobile',
        xp: 45,
    },
    {
        id: 'm4',
        title: 'Formulário com Teclado',
        description: 'Crie um formulário que não fica escondido pelo teclado do celular.',
        detail:
            'Um dos problemas mais comuns no React Native!\n\n' +
            'Implemente um formulário de login que:\n' +
            '• Usa KeyboardAvoidingView com behavior correto por plataforma\n' +
            '• Ao focar no campo de senha, scrolla automaticamente\n' +
            '• Teclado fecha ao tocar fora dos inputs\n' +
            '• No iOS: behavior="padding". No Android: behavior="height"\n\n' +
            'Use ScrollView + KeyboardAvoidingView juntos.',
        hint: 'Platform.OS === "ios" ? "padding" : "height" resolve a diferença entre plataformas.',
        example: 'Campo senha no final da tela: ao focar, a view sobe e o campo fica visível.',
        tags: ['teclado', 'UX', 'KeyboardAvoidingView', 'formulário'],
        difficulty: 'intermediário',
        category: 'mobile',
        xp: 40,
    },

    // ── GIT ───────────────────────────────────────────────────────────────────
    {
        id: 'g1',
        title: 'Primeiro Commit Perfeito',
        description: 'Crie um repositório e faça um commit seguindo Conventional Commits.',
        detail:
            'Execute os seguintes passos em ordem:\n\n' +
            '1. git init em uma pasta nova\n' +
            '2. Crie um arquivo README.md com o título do projeto\n' +
            '3. git add README.md\n' +
            '4. git commit -m "docs: add README with project description"\n' +
            '5. Crie mais um arquivo index.js\n' +
            '6. git add . && git commit -m "feat: add initial project structure"\n\n' +
            'Padrão Conventional Commits: feat | fix | docs | style | refactor | test | chore',
        hint: 'git log --oneline mostra seu histórico de commits de forma compacta.',
        example: 'git log → dois commits com mensagens no padrão Conventional Commits.',
        tags: ['git', 'commit', 'conventional commits'],
        difficulty: 'iniciante',
        category: 'git',
        xp: 20,
    },
    {
        id: 'g2',
        title: 'Branches e Merge',
        description: 'Crie uma feature branch, desenvolva e faça merge sem conflitos.',
        detail:
            'Simule um fluxo de feature branch:\n\n' +
            '1. No branch main, crie um arquivo app.js com uma função simples\n' +
            '2. git checkout -b feat/nova-funcionalidade\n' +
            '3. Adicione uma nova função ao app.js\n' +
            '4. Commit no branch de feature\n' +
            '5. Volte para main: git checkout main\n' +
            '6. git merge feat/nova-funcionalidade\n' +
            '7. git branch -d feat/nova-funcionalidade\n\n' +
            'Verifique que main tem as mudanças de ambos.',
        hint: 'git log --all --oneline --graph visualiza os branches e merges graficamente.',
        example: 'git log --graph mostra o ponto de bifurcação e o merge commit.',
        tags: ['git', 'branch', 'merge', 'fluxo'],
        difficulty: 'iniciante',
        category: 'git',
        xp: 25,
    },
    {
        id: 'g3',
        title: 'Resolvendo Conflitos de Merge',
        description: 'Gere intencionalmente um conflito e resolva-o manualmente.',
        detail:
            'Crie um conflito de merge real:\n\n' +
            '1. No main, crie config.js com: const PORT = 3000\n' +
            '2. Crie e vá para o branch feat/config\n' +
            '3. Mude para: const PORT = 8080\n' +
            '4. Volte para main e mude para: const PORT = 5000\n' +
            '5. Tente fazer merge → vai conflitar!\n' +
            '6. Abra o arquivo, entenda os marcadores <<<<, ==== e >>>>\n' +
            '7. Escolha a versão correta, salve e finalize o merge\n\n' +
            'O conflito é uma habilidade essencial — não tenha medo dele.',
        hint: 'Os marcadores <<<<<<< HEAD mostram sua versão. >>>>>>> feat/config mostra a versão que vem.',
        example: 'Após resolver: git add config.js && git commit → merge concluído.',
        tags: ['git', 'conflito', 'merge', 'avançado'],
        difficulty: 'intermediário',
        category: 'git',
        xp: 45,
    },
    {
        id: 'g4',
        title: 'Git Rebase Interativo',
        description: 'Use rebase -i para limpar o histórico de commits antes de um PR.',
        detail:
            'Simule a limpeza de commits antes de abrir um Pull Request:\n\n' +
            '1. Faça 4 commits pequenos (pode ser mudanças triviais em README)\n' +
            '2. Execute: git rebase -i HEAD~4\n' +
            '3. Use "squash" para combinar os 4 em 1 commit limpo\n' +
            '4. Escreva uma mensagem de commit descritiva no padrão Conventional\n\n' +
            'Resultado: um histórico limpo e linear, ideal para PRs.\n\n' +
            'Atenção: nunca faça rebase em branches públicos compartilhados!',
        hint: 'No editor do rebase, mude "pick" para "s" ou "squash" nos commits que quer combinar.',
        example: '4 commits "wip", "fix", "fix2", "final" → 1 commit "feat: add user profile page"',
        tags: ['git', 'rebase', 'histórico', 'avançado'],
        difficulty: 'avançado',
        category: 'git',
        xp: 60,
    },

    // ── API ───────────────────────────────────────────────────────────────────
    {
        id: 'a1',
        title: 'Consumir API com Fetch',
        description: 'Busque dados de uma API pública e exiba com loading e tratamento de erro.',
        detail:
            'Use a API pública do GitHub (sem autenticação):\n\n' +
            'URL: https://api.github.com/users/{username}\n\n' +
            'Implemente:\n' +
            '• Estado de loading enquanto busca\n' +
            '• Exibição dos dados: avatar, nome, bio, seguidores\n' +
            '• Tratamento de erro: usuário não encontrado (404)\n' +
            '• Tratamento de erro: sem internet\n\n' +
            'Use async/await com try/catch, não .then/.catch.',
        hint: 'if (!response.ok) throw new Error(response.statusText) logo após o fetch.',
        example: 'Buscar "torvalds" → exibe foto, nome Linus Torvalds e número de repos.',
        tags: ['fetch', 'async/await', 'api pública', 'erros'],
        difficulty: 'iniciante',
        category: 'api',
        xp: 30,
    },
    {
        id: 'a2',
        title: 'Debounce em Busca',
        description: 'Evite chamadas excessivas à API ao digitar com debounce.',
        detail:
            'Implemente uma busca que:\n\n' +
            '• Chama a API do GitHub a cada digitação (problema)\n' +
            '• Aplica debounce de 500ms para resolver o problema\n' +
            '• Cancela requisições em andamento quando nova busca inicia (AbortController)\n\n' +
            'Implemente o debounce manualmente usando setTimeout/clearTimeout — não use biblioteca.\n\n' +
            'Depois explique: qual a diferença entre debounce e throttle?',
        hint: 'useEffect retorna uma função de cleanup. Use-a para clearTimeout e abort().',
        example: 'Digitando "torv" rapidamente → apenas 1 requisição após parar de digitar.',
        tags: ['debounce', 'performance', 'AbortController', 'UX'],
        difficulty: 'intermediário',
        category: 'api',
        xp: 50,
    },
    {
        id: 'a3',
        title: 'Cache Local de Requisições',
        description: 'Evite requisições repetidas guardando respostas em memória.',
        detail:
            'Crie um hook useCache que:\n\n' +
            '• Mantém um Map() como cache em memória\n' +
            '• Antes de buscar, verifica se a resposta já existe no cache\n' +
            '• Se existir e for recente (< 5 min), retorna do cache\n' +
            '• Se não, faz a requisição e salva no cache\n\n' +
            'Implemente para a API do GitHub.\n\n' +
            'Abra o DevTools (Network) e observe: a segunda busca pelo mesmo usuário não gera requisição.',
        hint: 'cache.set(url, { data, timestamp: Date.now() }). Na leitura: Date.now() - entry.timestamp < 300000.',
        example: 'Buscar "torvalds" duas vezes → 2ª vez instantânea, sem requisição de rede.',
        tags: ['cache', 'performance', 'Map', 'hooks'],
        difficulty: 'avançado',
        category: 'api',
        xp: 65,
    },

    // ── BANCO DE DADOS ────────────────────────────────────────────────────────
    {
        id: 'd1',
        title: 'SELECT com WHERE e ORDER BY',
        description: 'Filtre e ordene dados usando SQL básico.',
        detail:
            'Dado o schema:\n\n' +
            'CREATE TABLE produtos (\n' +
            '  id SERIAL PRIMARY KEY,\n' +
            '  nome VARCHAR(100),\n' +
            '  preco DECIMAL(10,2),\n' +
            '  categoria VARCHAR(50),\n' +
            '  estoque INT\n' +
            ');\n\n' +
            'Escreva queries para:\n' +
            '1. Produtos com preço entre R$50 e R$200\n' +
            '2. Produtos da categoria "eletrônicos" com estoque > 0\n' +
            '3. Top 5 produtos mais caros\n' +
            '4. Produtos cujo nome começa com "A" (case insensitive)',
        hint: 'BETWEEN, AND, ORDER BY DESC, LIMIT e ILIKE são seus aliados aqui.',
        example: 'Query 3: SELECT * FROM produtos ORDER BY preco DESC LIMIT 5;',
        tags: ['sql', 'select', 'where', 'order by'],
        difficulty: 'iniciante',
        category: 'banco',
        xp: 25,
    },
    {
        id: 'd2',
        title: 'JOIN entre tabelas',
        description: 'Combine dados de múltiplas tabelas com INNER e LEFT JOIN.',
        detail:
            'Schema com duas tabelas:\n\n' +
            'usuarios (id, nome, email)\n' +
            'pedidos (id, usuario_id, produto, valor, data)\n\n' +
            'Escreva queries para:\n' +
            '1. INNER JOIN: todos os pedidos com nome do usuário\n' +
            '2. LEFT JOIN: todos os usuários, mesmo sem pedidos\n' +
            '3. Total gasto por cada usuário (GROUP BY + SUM)\n' +
            '4. Usuários que fizeram mais de 2 pedidos (HAVING)\n\n' +
            'Explique: quando usar INNER vs LEFT JOIN?',
        hint: 'INNER JOIN retorna só os que têm correspondência em AMBAS as tabelas. LEFT JOIN mantém todos da esquerda.',
        example: 'Query 3: SELECT u.nome, SUM(p.valor) as total FROM usuarios u JOIN pedidos p ON u.id = p.usuario_id GROUP BY u.nome;',
        tags: ['sql', 'join', 'group by', 'aggregate'],
        difficulty: 'intermediário',
        category: 'banco',
        xp: 45,
    },
    {
        id: 'd3',
        title: 'Modelagem: Sistema de Blog',
        description: 'Projete as tabelas de um blog com posts, categorias e comentários.',
        detail:
            'Projete o banco de dados para um blog com as seguintes regras de negócio:\n\n' +
            '• Um post tem um autor\n' +
            '• Um post pode ter múltiplas categorias (many-to-many)\n' +
            '• Um post pode ter múltiplos comentários\n' +
            '• Comentários podem ter respostas (comentários aninhados)\n' +
            '• Cada entidade precisa de created_at e updated_at\n\n' +
            'Entregue:\n' +
            '1. Diagrama ER (pode ser texto descritivo)\n' +
            '2. CREATE TABLE para cada tabela\n' +
            '3. Justificativa das chaves estrangeiras',
        hint: 'Many-to-many precisa de tabela de junção. Comentário aninhado: coluna parent_id referenciando a mesma tabela.',
        example: 'Tabela post_categorias (post_id FK, categoria_id FK) resolve o many-to-many.',
        tags: ['modelagem', 'er', 'foreign key', 'design'],
        difficulty: 'intermediário',
        category: 'banco',
        xp: 55,
    },
    {
        id: 'd4',
        title: 'Índices e EXPLAIN ANALYZE',
        description: 'Otimize uma query lenta adicionando o índice correto.',
        detail:
            'Otimização de performance real:\n\n' +
            '1. Crie uma tabela com 100.000 registros (use generate_series)\n' +
            '2. Execute uma query sem índice e anote o tempo\n' +
            '3. Use EXPLAIN ANALYZE para ver o plano de execução\n' +
            '4. Crie o índice adequado: CREATE INDEX ...\n' +
            '5. Execute EXPLAIN ANALYZE novamente\n' +
            '6. Compare Seq Scan vs Index Scan\n\n' +
            'A diferença de tempo será dramática. Isso é o poder dos índices.',
        hint: 'EXPLAIN ANALYZE mostra o custo estimado e real de cada operação. Seq Scan em tabela grande = problema.',
        example: 'Sem índice: 45ms. Com índice em email: 0.1ms. 450x mais rápido.',
        tags: ['postgresql', 'índices', 'performance', 'explain'],
        difficulty: 'avançado',
        category: 'banco',
        xp: 70,
    },
];