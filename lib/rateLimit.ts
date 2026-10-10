/**
 * In-memory sliding-window limiter (per server instance; good enough for the prototype).
 * Returns true when the key has exceeded `limit` hits within `windowMs`.
 */
const globalForLimits = globalThis as unknown as { _cchRateLimits?: Map<string, number[]> };
const hits = (globalForLimits._cchRateLimits ??= new Map());

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time: number) => now - time < windowMs);
  const limited = recent.length >= limit;
  hits.set(key, limited ? recent : [...recent, now]);
  return limited;
}

export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}
