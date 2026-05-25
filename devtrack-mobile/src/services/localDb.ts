// src/services/localDb.ts
// Cache local usando expo-sqlite.
// Funciona no Expo Go e substitui AsyncStorage de forma estruturada.
// Estratégia: SQLite é a "fonte de verdade local"; Spring Boot é a "fonte de verdade remota".

import * as SQLite from 'expo-sqlite';

let _dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!_dbPromise) {
        _dbPromise = SQLite.openDatabaseAsync('devtrack.db');
    }
    return _dbPromise;
}

// ─── Inicialização ────────────────────────────────────────────────────────────
export async function initDb(): Promise<void> {
    try {
        const db = await getDb();
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS kv_store (
                key   TEXT PRIMARY KEY NOT NULL,
                value TEXT NOT NULL,
                updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
            );

            CREATE TABLE IF NOT EXISTS pending_ops (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                type       TEXT NOT NULL,
                payload    TEXT NOT NULL,
                created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
            );
        `);
    } catch (e) {
        console.warn('Erro ao inicializar DB:', e);
    }
}

// ─── Key-Value Store ──────────────────────────────────────────────────────────

export async function kvGet(key: string): Promise<string | null> {
    try {
        const db = await getDb();
        const row = await db.getFirstAsync<{ value: string }>(
            'SELECT value FROM kv_store WHERE key = ?',
            [key]
        );
        return row?.value ?? null;
    } catch { return null; }
}

export async function kvSet(key: string, value: string): Promise<void> {
    try {
        const db = await getDb();
        await db.runAsync(
            `INSERT INTO kv_store (key, value, updated_at)
             VALUES (?, ?, strftime('%s', 'now'))
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
            [key, value]
        );
    } catch (e) { console.warn('kvSet err:', e); }
}

export async function kvDelete(key: string): Promise<void> {
    try {
        const db = await getDb();
        await db.runAsync('DELETE FROM kv_store WHERE key = ?', [key]);
    } catch {}
}

export async function kvGetJson<T>(key: string): Promise<T | null> {
    const raw = await kvGet(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
}

export async function kvSetJson(key: string, value: unknown): Promise<void> {
    await kvSet(key, JSON.stringify(value));
}

// ─── Fila de operações pendentes ─────────────────────────────────────────────

export interface PendingOp {
    id: number;
    type: string;
    payload: Record<string, unknown>;
    created_at: number;
}

export async function enqueuePendingOp(type: string, payload: Record<string, unknown>): Promise<void> {
    try {
        const db = await getDb();
        await db.runAsync(
            'INSERT INTO pending_ops (type, payload) VALUES (?, ?)',
            [type, JSON.stringify(payload)]
        );
    } catch (e) { console.warn('enqueue err:', e); }
}

export async function getPendingOps(): Promise<PendingOp[]> {
    try {
        const db = await getDb();
        const rows = await db.getAllAsync<{ id: number; type: string; payload: string; created_at: number }>(
            'SELECT * FROM pending_ops ORDER BY created_at ASC'
        );
        return rows.map(r => ({ ...r, payload: JSON.parse(r.payload) }));
    } catch { return []; }
}

export async function deletePendingOp(id: number): Promise<void> {
    try {
        const db = await getDb();
        await db.runAsync('DELETE FROM pending_ops WHERE id = ?', [id]);
    } catch {}
}

export async function clearAllPendingOps(): Promise<void> {
    try {
        const db = await getDb();
        await db.runAsync('DELETE FROM pending_ops');
    } catch {}
}
