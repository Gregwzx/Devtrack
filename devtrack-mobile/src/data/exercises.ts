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
    quiz: {
        question: string;      // pergunta conceitual sobre o tema
        options: string[];     // 4 opções de resposta
        correctIndex: number;  // índice da resposta correta (0–3)
        explanation: string;   // explicação mostrada após responder
    };
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
        quiz: {
            question: 'No FizzBuzz, qual condição DEVE ser verificada primeiro?',
            options: ['Checar se é múltiplo de 3', 'Checar se é múltiplo de 5', 'Checar se é múltiplo de 15 (FizzBuzz)', 'Qualquer ordem funciona'],
            correctIndex: 2,
            explanation: 'Múltiplo de 15 deve vir primeiro — se checar 3 antes, múltiplos de 15 seriam "Fizz" em vez de "FizzBuzz".',
        },
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
        quiz: {
            question: 'Qual combinação de métodos inverte uma string em JavaScript?',
            options: ['.reverse()', '.split("").reverse().join("")', '.charAt(0)', '.substring(1)'],
            correctIndex: 1,
            explanation: 'Strings não têm .reverse(). O padrão é split("") para virar array, reverse() no array, e join("") para juntar de volta.',
        },
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
        quiz: {
            question: 'Qual operador identifica se um número é PAR?',
            options: ['número / 2 === 0', 'número % 2 === 0', 'número & 2 === 0', 'número ** 2 === 0'],
            correctIndex: 1,
            explanation: 'O operador módulo (%) retorna o resto da divisão. Se número % 2 === 0, o resto é zero, portanto é par.',
        },
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
        quiz: {
            question: '"arara" é um palíndromo?',
            options: ['Sim, pois lido ao contrário é "arara"', 'Não, pois tem letras repetidas', 'Só se ignorarmos acentos', 'Depende da linguagem'],
            correctIndex: 0,
            explanation: '"arara" invertido é "arara" — portanto é um palíndromo clássico do português!',
        },
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
        quiz: {
            question: 'Qual é o 6º número da sequência de Fibonacci? (começando em 0)',
            options: ['5', '8', '13', '7'],
            correctIndex: 1,
            explanation: 'Sequência: 0, 1, 1, 2, 3, 5, 8... O 6º elemento (índice 6) é 8.',
        },
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
        quiz: {
            question: 'A busca binária funciona em qual tipo de array?',
            options: ['Qualquer array', 'Arrays com números pares', 'Arrays ordenados', 'Arrays com tamanho par'],
            correctIndex: 2,
            explanation: 'A busca binária exige que o array esteja ordenado — ela divide ao meio e decide qual metade explorar com base na comparação.',
        },
    },

    // ── FRONTEND ──────────────────────────────────────────────────────────────
    {
        id: 'f1',
        title: 'Contador com useState',
        description: 'Crie um contador com botões de incrementar, decrementar e resetar.',
        detail: 'Construa um componente React `Counter` com botões +1, -1 e Reset. Não permita valores negativos.',
        hint: 'Use useState para o valor e Math.max(0, count - 1) para evitar negativos.',
        example: 'Estado inicial: 0 → clicar +1 três vezes → exibe 3',
        tags: ['react', 'useState', 'componentes'],
        difficulty: 'iniciante',
        category: 'frontend',
        xp: 20,
        quiz: {
            question: 'Qual hook é usado para gerenciar estado local em React?',
            options: ['useEffect', 'useState', 'useContext', 'useRef'],
            correctIndex: 1,
            explanation: 'useState é o hook para estado local — retorna [valor, setValor] e re-renderiza o componente ao mudar.',
        },
    },
    {
        id: 'f2',
        title: 'Filtro de Lista',
        description: 'Filtre uma lista de itens em tempo real conforme o usuário digita.',
        detail: 'Crie um componente com input de busca e lista filtrada em tempo real. Use useMemo para evitar recalcular a cada render.',
        hint: 'filter + includes + toLowerCase() formam a base. useMemo([searchTerm]) evita renders extras.',
        example: 'Digitando "re" → aparece "React", "React Native", "Prettier"',
        tags: ['react', 'useMemo', 'filtro'],
        difficulty: 'iniciante',
        category: 'frontend',
        xp: 25,
        quiz: {
            question: 'Qual hook evita recálculos desnecessários em uma lista filtrada?',
            options: ['useCallback', 'useEffect', 'useMemo', 'useState'],
            correctIndex: 2,
            explanation: 'useMemo memoriza o resultado de uma computação cara e só recalcula quando as dependências mudam.',
        },
    },
    {
        id: 'f3',
        title: 'Dark Mode Toggle',
        description: 'Implemente alternância de tema claro/escuro com Context API.',
        detail: 'Crie um ThemeContext com React Context API, provider com estado do tema e pelo menos 3 componentes consumindo.',
        hint: 'useContext + createContext + um custom hook useTheme() tornam o consumo limpo.',
        example: 'Clicar no ☀️/🌙 alterna o tema em toda a aplicação.',
        tags: ['context', 'tema', 'estado global'],
        difficulty: 'intermediário',
        category: 'frontend',
        xp: 45,
        quiz: {
            question: 'O que o React Context API resolve?',
            options: ['Animações entre telas', 'Prop drilling — passar dados sem props manuais', 'Chamadas de API', 'Gerenciamento de rotas'],
            correctIndex: 1,
            explanation: 'Context API resolve prop drilling: compartilha dados globalmente sem precisar passar props em cada nível da árvore.',
        },
    },
    {
        id: 'f4',
        title: 'Validação de Formulário',
        description: 'Construa um formulário com validação completa sem biblioteca externa.',
        detail: 'Formulário de cadastro com nome, e-mail, senha e confirmar senha. Erros aparecem após onBlur.',
        hint: 'Crie um estado separado para erros e outro para "campos tocados". Valide no onBlur.',
        example: 'Ao sair do campo e-mail com "joao" → aparece "E-mail inválido"',
        tags: ['formulários', 'validação', 'UX'],
        difficulty: 'intermediário',
        category: 'frontend',
        xp: 50,
        quiz: {
            question: 'Quando é ideal mostrar erros de validação num formulário?',
            options: ['Ao carregar a página', 'Ao digitar cada caractere', 'Após o usuário sair do campo (onBlur)', 'Apenas no submit'],
            correctIndex: 2,
            explanation: 'onBlur é o padrão de UX — mostrar erro só depois que o usuário interagiu com o campo evita frustração prematura.',
        },
    },

    // ── BACKEND ───────────────────────────────────────────────────────────────
    {
        id: 'b1',
        title: 'Servidor Express Básico',
        description: 'Crie um servidor Node.js com Express com 3 rotas funcionais.',
        detail: 'Configure um servidor Express com GET /, GET /users e GET /users/:id. Trate 404 para id inexistente.',
        hint: 'app.use(express.json()) e app.use(cors()) devem vir antes das rotas.',
        example: 'GET /users/99 → status 404, {"error": "Usuário não encontrado"}',
        tags: ['node', 'express', 'rest'],
        difficulty: 'iniciante',
        category: 'backend',
        xp: 30,
        quiz: {
            question: 'Qual método HTTP é usado para BUSCAR dados sem modificar nada?',
            options: ['POST', 'PUT', 'GET', 'DELETE'],
            correctIndex: 2,
            explanation: 'GET é o método de leitura — idempotente e seguro. Nunca deve modificar estado no servidor.',
        },
    },
    {
        id: 'b2',
        title: 'CRUD Completo em Memória',
        description: 'Implemente todas as operações de um CRUD usando array em memória.',
        detail: 'API REST para tarefas: POST, GET, PUT, DELETE. Dados em array JavaScript sem banco.',
        hint: 'Gere ids únicos com Date.now().toString(). Filtre o array para DELETE.',
        example: 'POST /tasks {"title":"Estudar"} → 201, {id:"1", title:"Estudar", done:false}',
        tags: ['crud', 'rest', 'express'],
        difficulty: 'iniciante',
        category: 'backend',
        xp: 40,
        quiz: {
            question: 'Qual método HTTP é correto para ATUALIZAR um recurso existente?',
            options: ['GET', 'POST', 'PUT', 'HEAD'],
            correctIndex: 2,
            explanation: 'PUT substitui o recurso completo. PATCH atualiza parcialmente. GET apenas lê. POST cria um novo.',
        },
    },
    {
        id: 'b3',
        title: 'Middleware de Autenticação',
        description: 'Proteja rotas com um middleware que valida um token simples.',
        detail: 'Crie middleware que lê Authorization: Bearer <token>, valida e chama next() ou retorna 401.',
        hint: 'req.headers.authorization?.split(" ")[1] extrai o token do header.',
        example: 'GET /dashboard sem token → 401\nGET /dashboard com token válido → 200',
        tags: ['middleware', 'auth', 'segurança'],
        difficulty: 'intermediário',
        category: 'backend',
        xp: 55,
        quiz: {
            question: 'O que um middleware Express faz quando chama next()?',
            options: ['Encerra a requisição', 'Passa o controle para o próximo middleware/rota', 'Reinicia o servidor', 'Retorna status 200'],
            correctIndex: 1,
            explanation: 'next() passa o controle ao próximo middleware na cadeia. Sem chamá-lo, a requisição fica "presa".',
        },
    },
    {
        id: 'b4',
        title: 'Paginação de Resultados',
        description: 'Implemente paginação com page, limit e metadados na resposta.',
        detail: 'Endpoint GET /products com ?page=1&limit=10. Resposta inclui data, total, totalPages, hasNext, hasPrev.',
        hint: 'offset = (page - 1) * limit. Depois use arr.slice(offset, offset + limit).',
        example: 'GET /products?page=2&limit=5 → produtos 6 a 10, totalPages: 10',
        tags: ['paginação', 'api', 'query params'],
        difficulty: 'intermediário',
        category: 'backend',
        xp: 45,
        quiz: {
            question: 'Como calcular o offset para buscar a página 3 com limit 10?',
            options: ['offset = 3', 'offset = 30', 'offset = 20', 'offset = 10'],
            correctIndex: 2,
            explanation: 'offset = (page - 1) * limit = (3 - 1) * 10 = 20. Pula os primeiros 20 itens para chegar à página 3.',
        },
    },

    // ── MOBILE ────────────────────────────────────────────────────────────────
    {
        id: 'm1',
        title: 'FlatList Performática',
        description: 'Renderize uma lista de 100 itens com FlatList sem travar a UI.',
        detail: 'FlatList com 100 itens, pull-to-refresh e props de performance: initialNumToRender, maxToRenderPerBatch, windowSize.',
        hint: 'Envolva o componente de item em React.memo para evitar re-renders desnecessários.',
        example: 'Lista fluida ao rolar, pull-to-refresh mostra spinner por 1.5s.',
        tags: ['flatlist', 'performance', 'react native'],
        difficulty: 'iniciante',
        category: 'mobile',
        xp: 30,
        quiz: {
            question: 'Por que FlatList é melhor que ScrollView para listas longas?',
            options: ['FlatList tem mais estilos', 'FlatList renderiza só os itens visíveis (lazy)', 'ScrollView é mais antigo', 'Não há diferença'],
            correctIndex: 1,
            explanation: 'FlatList usa virtualização — renderiza apenas os itens visíveis na tela, economizando memória e melhorando performance.',
        },
    },
    {
        id: 'm2',
        title: 'AsyncStorage: Persistência Local',
        description: 'Salve e carregue preferências do usuário com AsyncStorage.',
        detail: 'Sistema de preferências com nome, tema e tamanho de fonte. Custom hook usePreferences() com load/save/reset.',
        hint: 'Combine useEffect (carregar no mount) + useCallback (salvar) para um hook limpo.',
        example: 'Fechar e reabrir o app mantém o tema escolhido.',
        tags: ['asyncstorage', 'hooks', 'persistência'],
        difficulty: 'iniciante',
        category: 'mobile',
        xp: 35,
        quiz: {
            question: 'AsyncStorage é síncrono ou assíncrono?',
            options: ['Síncrono — bloqueia até terminar', 'Assíncrono — retorna uma Promise', 'Depende da plataforma', 'Síncrono no iOS e assíncrono no Android'],
            correctIndex: 1,
            explanation: 'AsyncStorage é assíncrono — todas as operações retornam Promises. Use await/async para ler e escrever.',
        },
    },
    {
        id: 'm3',
        title: 'Animação com Reanimated',
        description: 'Crie um botão com animação de press usando react-native-reanimated.',
        detail: 'Botão que encolhe ao pressionar (scale 1→0.95) e volta com mola. Use useSharedValue + useAnimatedStyle + withSpring.',
        hint: 'onPressIn inicia a animação, onPressOut reverte. withSpring dá a física natural.',
        example: 'Pressionar: encolhe suavemente. Soltar: volta com "mola".',
        tags: ['reanimated', 'animação', 'gestos'],
        difficulty: 'intermediário',
        category: 'mobile',
        xp: 45,
        quiz: {
            question: 'Qual a vantagem do react-native-reanimated sobre o Animated padrão?',
            options: ['Tem mais animações prontas', 'Roda na thread de UI nativa (não na JS thread)', 'É mais simples de usar', 'Suporta apenas iOS'],
            correctIndex: 1,
            explanation: 'Reanimated executa animações na thread nativa, evitando o gargalo da JS thread e garantindo 60fps mesmo com a CPU ocupada.',
        },
    },
    {
        id: 'm4',
        title: 'Formulário com Teclado',
        description: 'Crie um formulário que não fica escondido pelo teclado do celular.',
        detail: 'Formulário de login com KeyboardAvoidingView. No iOS: behavior="padding". No Android: behavior="height".',
        hint: 'Platform.OS === "ios" ? "padding" : "height" resolve a diferença entre plataformas.',
        example: 'Campo senha ao fundo: ao focar, a view sobe e o campo fica visível.',
        tags: ['teclado', 'UX', 'KeyboardAvoidingView'],
        difficulty: 'intermediário',
        category: 'mobile',
        xp: 40,
        quiz: {
            question: 'Qual behavior do KeyboardAvoidingView usar no iOS?',
            options: ['"height"', '"position"', '"padding"', '"margin"'],
            correctIndex: 2,
            explanation: '"padding" funciona melhor no iOS pois adiciona padding ao container. No Android, "height" é mais adequado.',
        },
    },

    // ── GIT ───────────────────────────────────────────────────────────────────
    {
        id: 'g1',
        title: 'Primeiro Commit Perfeito',
        description: 'Crie um repositório e faça um commit seguindo Conventional Commits.',
        detail: 'git init, README.md, git add, commit com mensagem no padrão feat/fix/docs/chore.',
        hint: 'git log --oneline mostra seu histórico de commits de forma compacta.',
        example: 'git log → commits com mensagens "docs: add README" e "feat: add structure"',
        tags: ['git', 'commit', 'conventional commits'],
        difficulty: 'iniciante',
        category: 'git',
        xp: 20,
        quiz: {
            question: 'Qual prefixo Conventional Commits usar ao adicionar uma nova funcionalidade?',
            options: ['fix:', 'docs:', 'feat:', 'chore:'],
            correctIndex: 2,
            explanation: '"feat:" indica nova funcionalidade. "fix:" para correções, "docs:" para documentação, "chore:" para tarefas de manutenção.',
        },
    },
    {
        id: 'g2',
        title: 'Branches e Merge',
        description: 'Crie uma feature branch, desenvolva e faça merge sem conflitos.',
        detail: 'Fluxo completo: criar branch, desenvolver, commit, voltar ao main, fazer merge e deletar a branch.',
        hint: 'git log --all --oneline --graph visualiza os branches e merges graficamente.',
        example: 'git log --graph mostra o ponto de bifurcação e o merge commit.',
        tags: ['git', 'branch', 'merge'],
        difficulty: 'iniciante',
        category: 'git',
        xp: 25,
        quiz: {
            question: 'Qual comando cria e muda para uma nova branch ao mesmo tempo?',
            options: ['git branch nova', 'git checkout nova', 'git checkout -b nova', 'git merge nova'],
            correctIndex: 2,
            explanation: 'git checkout -b nome cria a branch e muda para ela. Equivalente a: git branch nome + git checkout nome.',
        },
    },
    {
        id: 'g3',
        title: 'Resolvendo Conflitos de Merge',
        description: 'Gere intencionalmente um conflito e resolva-o manualmente.',
        detail: 'Criar conflito alterando a mesma linha em dois branches e resolver os marcadores <<<<<<, ====== e >>>>>>.',
        hint: 'Os marcadores <<<<<<< HEAD mostram sua versão. >>>>>>> feat/config mostra a versão que vem.',
        example: 'Após resolver: git add config.js && git commit → merge concluído.',
        tags: ['git', 'conflito', 'merge'],
        difficulty: 'intermediário',
        category: 'git',
        xp: 45,
        quiz: {
            question: 'O que os marcadores <<<<<<< HEAD indicam num conflito de merge?',
            options: ['A versão do branch remoto', 'A versão do seu branch atual', 'Um erro do Git', 'A versão mais antiga'],
            correctIndex: 1,
            explanation: 'HEAD aponta para o seu branch atual. O conteúdo entre <<<<<<< HEAD e ======= é sua versão local.',
        },
    },
    {
        id: 'g4',
        title: 'Git Rebase Interativo',
        description: 'Use rebase -i para limpar o histórico de commits antes de um PR.',
        detail: 'Fazer 4 commits pequenos, usar git rebase -i HEAD~4 e squash para combiná-los em 1 commit limpo.',
        hint: 'No editor do rebase, mude "pick" para "s" ou "squash" nos commits a combinar.',
        example: '4 commits "wip", "fix", "fix2", "final" → 1 commit "feat: add user profile"',
        tags: ['git', 'rebase', 'histórico'],
        difficulty: 'avançado',
        category: 'git',
        xp: 60,
        quiz: {
            question: 'O que "squash" faz no rebase interativo?',
            options: ['Deleta o commit', 'Combina o commit com o anterior', 'Renomeia o commit', 'Reverte as mudanças'],
            correctIndex: 1,
            explanation: '"squash" combina o commit com o anterior, unindo as mudanças. Útil para limpar histórico antes de abrir um PR.',
        },
    },

    // ── API ───────────────────────────────────────────────────────────────────
    {
        id: 'a1',
        title: 'Consumir API com Fetch',
        description: 'Busque dados de uma API pública e exiba com loading e tratamento de erro.',
        detail: 'Use a API do GitHub (https://api.github.com/users/{username}) com loading, exibição e tratamento de erros.',
        hint: 'if (!response.ok) throw new Error(response.statusText) logo após o fetch.',
        example: 'Buscar "torvalds" → exibe foto, nome e número de repos.',
        tags: ['fetch', 'async/await', 'api pública'],
        difficulty: 'iniciante',
        category: 'api',
        xp: 30,
        quiz: {
            question: 'O que response.ok verifica numa chamada fetch?',
            options: ['Se a resposta é JSON', 'Se o status HTTP está entre 200-299', 'Se há conexão com a internet', 'Se o body não está vazio'],
            correctIndex: 1,
            explanation: 'response.ok é true quando o status HTTP está entre 200-299. Status 404 ou 500, por exemplo, resultam em ok = false.',
        },
    },
    {
        id: 'a2',
        title: 'Debounce em Busca',
        description: 'Evite chamadas excessivas à API ao digitar com debounce.',
        detail: 'Busca com debounce de 500ms implementado manualmente com setTimeout/clearTimeout e AbortController.',
        hint: 'useEffect retorna uma função de cleanup. Use-a para clearTimeout e abort().',
        example: 'Digitando "torv" rapidamente → apenas 1 requisição após parar de digitar.',
        tags: ['debounce', 'performance', 'AbortController'],
        difficulty: 'intermediário',
        category: 'api',
        xp: 50,
        quiz: {
            question: 'Qual a diferença entre debounce e throttle?',
            options: [
                'São a mesma coisa',
                'Debounce aguarda parar de digitar; throttle limita chamadas por intervalo fixo',
                'Throttle aguarda parar; debounce limita por intervalo',
                'Debounce é síncrono; throttle é assíncrono',
            ],
            correctIndex: 1,
            explanation: 'Debounce executa só após o usuário parar. Throttle executa no máximo 1x por intervalo fixo. Cada um resolve problemas diferentes.',
        },
    },
    {
        id: 'a3',
        title: 'Cache Local de Requisições',
        description: 'Evite requisições repetidas guardando respostas em memória.',
        detail: 'Hook useCache com Map() que verifica se a resposta existe e é recente (< 5min) antes de buscar.',
        hint: 'cache.set(url, { data, timestamp: Date.now() }). Na leitura: Date.now() - entry.timestamp < 300000.',
        example: 'Buscar "torvalds" duas vezes → 2ª vez instantânea, sem requisição de rede.',
        tags: ['cache', 'performance', 'Map'],
        difficulty: 'avançado',
        category: 'api',
        xp: 65,
        quiz: {
            question: 'Por que usar Map() para cache em vez de um objeto {}?',
            options: ['Map é mais rápido para números', 'Map mantém a ordem de inserção e funciona melhor como dicionário dinâmico', 'Objetos não aceitam strings como chave', 'Não há diferença prática'],
            correctIndex: 1,
            explanation: 'Map é otimizado para inserções/buscas frequentes, mantém ordem e qualquer tipo pode ser chave. Para cache, é mais semântico e performático.',
        },
    },

    // ── BANCO DE DADOS ────────────────────────────────────────────────────────
    {
        id: 'd1',
        title: 'SELECT com WHERE e ORDER BY',
        description: 'Filtre e ordene dados usando SQL básico.',
        detail: 'Queries para filtrar produtos por preço, categoria, estoque e nome. Use BETWEEN, ORDER BY DESC, LIMIT e ILIKE.',
        hint: 'BETWEEN, AND, ORDER BY DESC, LIMIT e ILIKE são seus aliados.',
        example: 'SELECT * FROM produtos ORDER BY preco DESC LIMIT 5;',
        tags: ['sql', 'select', 'where'],
        difficulty: 'iniciante',
        category: 'banco',
        xp: 25,
        quiz: {
            question: 'Qual cláusula SQL ordena os resultados em ordem decrescente?',
            options: ['ORDER BY campo ASC', 'ORDER BY campo DESC', 'SORT BY campo', 'GROUP BY campo'],
            correctIndex: 1,
            explanation: 'ORDER BY campo DESC ordena do maior para o menor. ASC (padrão) ordena crescente.',
        },
    },
    {
        id: 'd2',
        title: 'JOIN entre tabelas',
        description: 'Combine dados de múltiplas tabelas com INNER e LEFT JOIN.',
        detail: 'Queries com INNER JOIN, LEFT JOIN, GROUP BY + SUM e HAVING em tabelas usuarios/pedidos.',
        hint: 'INNER JOIN retorna só correspondências em ambas. LEFT JOIN mantém todos da esquerda.',
        example: 'SELECT u.nome, SUM(p.valor) FROM usuarios u JOIN pedidos p ON u.id = p.usuario_id GROUP BY u.nome;',
        tags: ['sql', 'join', 'group by'],
        difficulty: 'intermediário',
        category: 'banco',
        xp: 45,
        quiz: {
            question: 'Quando usar LEFT JOIN em vez de INNER JOIN?',
            options: [
                'Quando quero só registros com correspondência nas duas tabelas',
                'Quando quero todos da tabela esquerda, mesmo sem correspondência',
                'Quando a tabela esquerda é menor',
                'São equivalentes',
            ],
            correctIndex: 1,
            explanation: 'LEFT JOIN mantém todos os registros da tabela esquerda. Se não houver correspondência na direita, os campos ficam NULL.',
        },
    },
    {
        id: 'd3',
        title: 'Modelagem: Sistema de Blog',
        description: 'Projete as tabelas de um blog com posts, categorias e comentários.',
        detail: 'Modelar: posts com autor, categorias many-to-many, comentários aninhados, timestamps em tudo.',
        hint: 'Many-to-many precisa de tabela de junção. Comentário aninhado: coluna parent_id.',
        example: 'Tabela post_categorias (post_id FK, categoria_id FK) resolve o many-to-many.',
        tags: ['modelagem', 'er', 'foreign key'],
        difficulty: 'intermediário',
        category: 'banco',
        xp: 55,
        quiz: {
            question: 'Como representar um relacionamento many-to-many em SQL?',
            options: ['Coluna de array em uma das tabelas', 'Tabela de junção com duas chaves estrangeiras', 'Coluna TEXT com IDs separados por vírgula', 'Não é possível em SQL'],
            correctIndex: 1,
            explanation: 'Many-to-many exige uma tabela de junção (pivot) com foreign keys para ambas as tabelas. Ex: post_categorias(post_id, categoria_id).',
        },
    },
    {
        id: 'd4',
        title: 'Índices e EXPLAIN ANALYZE',
        description: 'Otimize uma query lenta adicionando o índice correto.',
        detail: 'Criar tabela com 100k registros, executar query sem índice, usar EXPLAIN ANALYZE, criar índice e comparar.',
        hint: 'EXPLAIN ANALYZE mostra o custo estimado e real. Seq Scan em tabela grande = problema.',
        example: 'Sem índice: 45ms. Com índice em email: 0.1ms. 450x mais rápido.',
        tags: ['postgresql', 'índices', 'performance'],
        difficulty: 'avançado',
        category: 'banco',
        xp: 70,
        quiz: {
            question: 'O que um índice de banco de dados faz?',
            options: [
                'Duplica os dados para backup',
                'Cria uma estrutura auxiliar para buscas mais rápidas',
                'Remove dados duplicados',
                'Ordena a tabela permanentemente',
            ],
            correctIndex: 1,
            explanation: 'Um índice cria uma estrutura auxiliar (B-tree geralmente) que permite encontrar linhas sem varrer a tabela inteira — de O(n) para O(log n).',
        },
    },
];
