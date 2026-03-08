// utils/dateHelpers.ts

/**
 * Returns today's date as a locale-independent string key (YYYY-MM-DD).
 * Avoids timezone bugs when comparing streak days.
 */
export function todayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Returns yesterday's date key (YYYY-MM-DD).
 */
export function yesterdayKey(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Converts any Date or ISO string to a YYYY-MM-DD key.
 */
export function toDateKey(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Returns a human-readable "time ago" string in Portuguese.
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
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/**
 * Formats a date for display in the app header.
 */
export function formatHeaderDate(date: Date = new Date()): string {
    return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day:     'numeric',
        month:   'long',
    });
}

/**
 * Returns true if two date keys (YYYY-MM-DD) are consecutive days.
 */
export function areConsecutiveDays(keyA: string, keyB: string): boolean {
    const a = new Date(keyA);
    const b = new Date(keyB);
    const diff = Math.abs(a.getTime() - b.getTime());
    return diff === 86_400_000;
}