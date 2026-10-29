// src/engine/adaptive/storage.ts — Persistent storage for player ability & item memory
// Supports IndexedDB with localStorage fallback per Epic D1 & D2

import { AdaptivePlayer, ItemStats, CEFR, createPlayer, createItemStats } from './dor-adaptive-engine';

const DB_NAME = 'dor_adaptive_db';
const DB_VERSION = 1;
const STORE_PLAYERS = 'players';
const STORE_STATS = 'item_stats';

const LOCAL_PREFIX = 'dor.engine.v1.';

function getStorageKey(playerId: string, targetLang: string): string {
  return `${LOCAL_PREFIX}${playerId}.${targetLang}`;
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_PLAYERS)) {
          db.createObjectStore(STORE_PLAYERS);
        }
        if (!db.objectStoreNames.contains(STORE_STATS)) {
          db.createObjectStore(STORE_STATS);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Load or initialize player state for a specific target language
 */
export async function loadPlayerState(
  playerId: string,
  targetLang: string,
  declaredLevel: CEFR = 'A1'
): Promise<AdaptivePlayer> {
  const key = getStorageKey(playerId, targetLang);

  // 1. Try IndexedDB
  try {
    const idb = await openDatabase();
    if (idb) {
      const val = await new Promise<AdaptivePlayer | null>((resolve) => {
        const tx = idb.transaction(STORE_PLAYERS, 'readonly');
        const store = tx.objectStore(STORE_PLAYERS);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      if (val && typeof val.theta === 'number') {
        return val;
      }
    }
  } catch (err) {
    // Fall back to localStorage
  }

  // 2. Fall back to localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.theta === 'number') {
          return parsed;
        }
      }
    }
  } catch {}

  // 3. Brand new player state
  return createPlayer(playerId, declaredLevel);
}

/**
 * Persist player state for a specific target language
 */
export async function savePlayerState(
  playerId: string,
  targetLang: string,
  player: AdaptivePlayer
): Promise<void> {
  const key = getStorageKey(playerId, targetLang);

  // 1. Save to localStorage immediately (synchronous guard)
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(player));
    }
  } catch {}

  // 2. Save to IndexedDB
  try {
    const idb = await openDatabase();
    if (idb) {
      await new Promise<void>((resolve) => {
        const tx = idb.transaction(STORE_PLAYERS, 'readwrite');
        const store = tx.objectStore(STORE_PLAYERS);
        const req = store.put(player, key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    }
  } catch {}
}

/**
 * Load global item calibration statistics
 */
export async function loadItemStats(): Promise<ItemStats> {
  const key = 'global_item_stats';

  try {
    const idb = await openDatabase();
    if (idb) {
      const val = await new Promise<ItemStats | null>((resolve) => {
        const tx = idb.transaction(STORE_STATS, 'readonly');
        const store = tx.objectStore(STORE_STATS);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      if (val) return val;
    }
  } catch {}

  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_PREFIX + 'item_stats');
      if (raw) return JSON.parse(raw);
    }
  } catch {}

  return createItemStats();
}

/**
 * Save global item calibration statistics
 */
export async function saveItemStats(stats: ItemStats): Promise<void> {
  const key = 'global_item_stats';

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_PREFIX + 'item_stats', JSON.stringify(stats));
    }
  } catch {}

  try {
    const idb = await openDatabase();
    if (idb) {
      await new Promise<void>((resolve) => {
        const tx = idb.transaction(STORE_STATS, 'readwrite');
        const store = tx.objectStore(STORE_STATS);
        const req = store.put(stats, key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    }
  } catch {}
}

/**
 * Reset all progress for a player (Epic D2 - "بازنشانی پیشرفت من")
 */
export async function resetPlayerProgress(playerId: string, targetLang?: string): Promise<void> {
  // 1. Remove from localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      if (targetLang) {
        localStorage.removeItem(getStorageKey(playerId, targetLang));
      } else {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(`${LOCAL_PREFIX}${playerId}.`)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }
    }
  } catch {}

  // 2. Remove from IndexedDB
  try {
    const idb = await openDatabase();
    if (idb) {
      await new Promise<void>((resolve) => {
        const tx = idb.transaction(STORE_PLAYERS, 'readwrite');
        const store = tx.objectStore(STORE_PLAYERS);
        if (targetLang) {
          store.delete(getStorageKey(playerId, targetLang));
        } else {
          // Iterate and delete matching keys
          const req = store.openCursor();
          req.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              const k = String(cursor.key);
              if (k.startsWith(`${LOCAL_PREFIX}${playerId}.`)) {
                cursor.delete();
              }
              cursor.continue();
            }
          };
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    }
  } catch {}
}
