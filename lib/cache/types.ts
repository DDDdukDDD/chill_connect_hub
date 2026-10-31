/**
 * ⚡ Chillwaa - Caching Layer Types
 * Enterprise in-memory cache definitions with TTL and tag-based invalidation.
 */

export interface CacheOptions {
  /** Time-To-Live in milliseconds (default: 60,000 ms / 1 min) */
  ttlMs?: number;
  /** Categorical tags for group invalidation (e.g. ['events', 'event:123', 'spots']) */
  tags?: string[];
  /**
   * getOrSet only: for this long after the TTL runs out, the old value is still returned at once while a fresh one
   * loads in the background (stale-while-revalidate). Invalidated tags drop the entry, so writes are never served stale.
   */
  staleMs?: number;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  /** Past expiresAt but before this, getOrSet may still serve the value while refreshing */
  staleUntil: number;
  createdAt: number;
  tags: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRatio: number;
}
