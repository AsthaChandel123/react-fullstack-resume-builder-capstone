const DB_NAME = 'resumeai';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('store')) {
        db.createObjectStore('store');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getItem<T>(key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('store', 'readonly');
    const req = tx.objectStore('store').get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Deeply sanitize a value so IndexedDB's structured clone will accept it:
 * - Firestore Timestamps (anything with a toDate() method) become JS Date
 * - Functions, DOM nodes, and other non-cloneables are dropped
 * - Dates, typed arrays, plain objects, and arrays are preserved
 *
 * Runs in O(size of tree). Callers should still normalize at the boundary
 * for clarity, but this is a last-line defense against any stray Timestamp.
 */
function sanitizeForClone<T>(value: T, depth = 0): T {
  if (depth > 64) return undefined as unknown as T;
  if (value == null) return value;
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean' || t === 'bigint') return value;
  if (t === 'function' || t === 'symbol') return undefined as unknown as T;
  if (value instanceof Date) return value;
  // Firestore Timestamp duck-type
  const maybeTs = value as unknown as { toDate?: () => Date };
  if (typeof maybeTs.toDate === 'function') {
    try { return maybeTs.toDate() as unknown as T; } catch { return undefined as unknown as T; }
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeForClone(v, depth + 1)) as unknown as T;
  }
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer || value instanceof Map || value instanceof Set) {
    return value;
  }
  if (t === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const clean = sanitizeForClone(v, depth + 1);
      if (clean !== undefined) out[k] = clean;
    }
    return out as unknown as T;
  }
  return value;
}

async function setItem<T>(key: string, value: T): Promise<void> {
  const db = await openDB();
  const safe = sanitizeForClone(value);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('store', 'readwrite');
    tx.objectStore('store').put(safe, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function createIndexedDBStorage<T>(key: string) {
  let debounceTimer: ReturnType<typeof setTimeout>;

  return {
    load: () => getItem<T>(key),
    save: (state: T) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setItem(key, state);
      }, 300);
    },
  };
}
