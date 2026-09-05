/**
 * ⚡ Chill & Connect Hub - Caching Layer Types
 * Enterprise in-memory cache definitions with TTL and tag-based invalidation.
 */

export interface CacheOptions {
  /** Time-To-Live in milliseconds (default: 60,000 ms / 1 min) */
  ttlMs?: number;
  /** Categorical tags for group invalidation (e.g. ['events', 'event:123', 'spots']) */
  tags?: string[];
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  tags: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRatio: number;
}
