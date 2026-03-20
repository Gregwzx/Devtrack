// utils/dateHelpers.ts
// Funções de data que uso em várias telas. Centralizei aqui pra não
// ficar repetindo a mesma lógica em todo lugar — e pra não errar fuso horário
// em produção (já aprendi da forma difícil que Date() tem suas armadilhas).

/**
 * Retorna a data de hoje como string YYYY-MM-DD, independente de fuso.
 * Usei esse formato porque facilita comparação direta entre strings —
 * muito mais simples do que comparar timestamps no streak.
 */
export function todayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Ontem. Precisei separar porque o streak depende de saber
 * se o usuário estudou "hoje ou ontem" — não só "hoje".
 */
export function yesterdayKey(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Converte qualquer Date ou ISO string para a chave YYYY-MM-DD.
 * Útil quando preciso comparar datas vindas do AsyncStorage (sempre ISO string).
 */
export function toDateKey(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * "Há quanto tempo?" aparece embaixo de cada registro na home.
 * Os intervalos foram escolhidos pra parecer natural de ler, não cronômetro.
 */
export function formatAgo(date: Date | string): string {
    const d    = typeof date === 'string' ? new Date(date) : date;
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)   return 'agora mesmo';
    if (mins < 60)  return `${mins}min atrás`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs}h atrás`;
    const days = Math.floor(hrs / 24);
    if (days < 7)   return `${days}d atrás`;
    // depois de uma semana, mostra a data — "27 de jan" é mais legível que "9d atrás"
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/**
 * Data formatada pra aparecer no header da home: "segunda-feira, 27 de janeiro".
 * O textTransform: 'capitalize' no estilo cuida de deixar a primeira letra maiúscula.
 */
export function formatHeaderDate(date: Date = new Date()): string {
    return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day:     'numeric',
        month:   'long',
    });
}

/**
 * Verifica se dois dias são consecutivos — usado pra validar o streak.
 * A diferença exata de 86.400.000ms é um dia (sem DST isso funciona bem).
 */
export function areConsecutiveDays(keyA: string, keyB: string): boolean {
    const a = new Date(keyA);
    const b = new Date(keyB);
    const diff = Math.abs(a.getTime() - b.getTime());
    return diff === 86_400_000;
}