import { USE_POSTGRES, sql } from './db/postgres/client';

/**
 * Rate limits. With Postgres the count lives in `app.rate_limits`, so every server shares it (fixed window per key).
 * Without a database (local JSON mode) each server counts in memory, as before.
 * If the database cannot be reached the request is let through rather than blocked: a limiter must never take the
 * site down with it.
 */
const globalForLimits = globalThis as unknown as { _cchRateLimits?: Map<string, number[]> };
const hits = (globalForLimits._cchRateLimits ??= new Map());

function memoryHit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time: number) => now - time < windowMs);
  const limited = recent.length >= limit;
  hits.set(key, limited ? recent : [...recent, now]);
  return limited;
}

let lastSweep = 0;

/** Counts one hit for `key`; true when it is over `limit` within `windowMs` */
export async function isRateLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (!USE_POSTGRES) return memoryHit(key, limit, windowMs);
  const seconds = Math.max(1, Math.round(windowMs / 1000));
  try {
    const [row] = await sql()<{ hits: number }[]>`
      insert into app.rate_limits as r (key) values (${key})
      on conflict (key) do update set
        window_start = case when r.window_start < now() - make_interval(secs => ${seconds}) then now() else r.window_start end,
        hits = case when r.window_start < now() - make_interval(secs => ${seconds}) then 1 else r.hits + 1 end
      returning hits`;
    // Old rows are cleared now and then (at most once an hour per server); no window in the code is longer than a day
    if (Date.now() - lastSweep > 60 * 60 * 1000) {
      lastSweep = Date.now();
      sql()`delete from app.rate_limits where window_start < now() - interval '2 days'`.catch(() => {});
    }
    return row.hits > limit;
  } catch (error) {
    console.error('[rateLimit] database count failed, counting on this server', error);
    return memoryHit(key, limit, windowMs);
  }
}

/** True when `key` is already over `limit` within `windowMs`, without counting a hit (e.g. failed logins only) */
export async function isOverRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const memoryCount = () => (hits.get(key) ?? []).filter((time: number) => now - time < windowMs).length;
  if (!USE_POSTGRES) return memoryCount() >= limit;
  const seconds = Math.max(1, Math.round(windowMs / 1000));
  try {
    const [row] = await sql()<{ hits: number }[]>`
      select hits from app.rate_limits where key = ${key} and window_start >= now() - make_interval(secs => ${seconds})`;
    return (row?.hits ?? 0) >= limit;
  } catch (error) {
    console.error('[rateLimit] database read failed, checking this server', error);
    return memoryCount() >= limit;
  }
}

/** Forgets every hit for `key`, e.g. after a successful admin login */
export async function clearRateLimit(key: string): Promise<void> {
  hits.delete(key);
  if (!USE_POSTGRES) return;
  await sql()`delete from app.rate_limits where key = ${key}`.catch(() => {});
}

export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}
