/**
 * Lightweight Stale-While-Revalidate In-Memory Cache for Admin List Queries
 *
 * Keeps recently fetched module lists in memory so switching back to a tab
 * renders immediately without 0-count jumps or loading spinner flashes while
 * fresh data revalidates silently in the background.
 */

const cacheStore = new Map();
const MAX_ENTRIES = 60;
const DEFAULT_TTL_MS = 60_000;

export function getCachedData(key, ttlMs = DEFAULT_TTL_MS) {
  if (!key) return null;
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    cacheStore.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedData(key, data) {
  if (!key) return;
  if (cacheStore.size >= MAX_ENTRIES && !cacheStore.has(key)) {
    const oldestKey = cacheStore.keys().next().value;
    if (oldestKey !== undefined) cacheStore.delete(oldestKey);
  }
  cacheStore.set(key, { data, timestamp: Date.now() });
}

export function clearRequestCache(keyPrefix = '') {
  if (!keyPrefix) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (String(key).startsWith(keyPrefix)) {
      cacheStore.delete(key);
    }
  }
}

export function isAbortError(err) {
  return (
    err?.name === 'CanceledError' ||
    err?.name === 'AbortError' ||
    err?.code === 'ERR_CANCELED'
  );
}
