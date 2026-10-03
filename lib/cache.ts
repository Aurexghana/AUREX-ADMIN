/**
 * A tiny in-memory GET cache, scoped to the browser tab's lifetime. Every
 * admin list view re-fetches its full result set on mount (see e.g.
 * ApplicationsView/ReportsView's own session-gated useEffect) - without
 * this, switching between pages in the sidebar re-triggers that fetch
 * every single time, even seconds after the same data was just loaded.
 *
 * A module-level Map survives client-side navigation (Next.js's App
 * Router keeps the JS bundle loaded between page switches - it only
 * resets on a hard reload), so this needs no provider or storage of its
 * own. Concurrent callers for the same key share one in-flight request
 * instead of firing duplicate ones.
 *
 * Mutations must call `invalidate()` for the resource they changed, or
 * the next visit to that list will keep serving the pre-mutation cache
 * until it naturally expires.
 */

type Entry<T> = { data: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL_MS = 60_000;

export async function cached<T>(key: string, fetcher: () => Promise<T>, ttlMs: number = DEFAULT_TTL_MS): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.data as T;

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = fetcher()
    .then((data) => {
      store.set(key, { data, expiresAt: Date.now() + ttlMs });
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, promise);
  return promise;
}

/** Drops every cached entry whose key starts with `prefix` (or the
 *  entire cache, if omitted). Call this after a mutation so the next
 *  fetch for that resource goes to the network instead of serving
 *  stale data. */
export function invalidate(prefix?: string): void {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
