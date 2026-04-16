// /mnt/experiments/astha-resume/src/firebase/normalize.ts
// Recursively convert any Firestore Timestamp-like object to a plain
// JS Date so the resulting tree is structured-cloneable (safe for
// Zustand + IndexedDB persistence).

function isTimestamp(v: unknown): v is { toDate: () => Date } {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as { toDate?: unknown }).toDate === 'function'
  );
}

export function normalizeFirestore<T = unknown>(value: unknown): T {
  if (value == null) return value as T;
  if (isTimestamp(value)) return value.toDate() as unknown as T;
  if (value instanceof Date) return value as unknown as T;
  if (Array.isArray(value)) {
    return value.map((v) => normalizeFirestore(v)) as unknown as T;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = normalizeFirestore(v);
    }
    return out as unknown as T;
  }
  return value as T;
}
