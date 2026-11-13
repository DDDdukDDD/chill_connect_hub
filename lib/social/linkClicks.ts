import { USE_POSTGRES, sql } from '../db/postgres/client';
import type { ClickTargetType, LinkKind } from './linkKinds';

/**
 * Counts of taps that leave the site and of sponsored card views and taps, per target and Bangkok day
 * (app.link_clicks_daily, migration 0054; docs/TRACEABILITY.md step 4). Nobody is identified here; signed-in taps also
 * go to the action log. Small by design: one row per target, kind and day, so ranges stay quick at any member count.
 */

/** No-database mode: this server's memory */
const memory = new Map<string, number>();
const bkkDay = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

export async function countLinkClick(kind: LinkKind, type: ClickTargetType, ref: string): Promise<void> {
  if (!USE_POSTGRES) {
    const key = `${bkkDay()}|${type}|${ref}|${kind}`;
    memory.set(key, (memory.get(key) ?? 0) + 1);
    return;
  }
  try {
    await sql()`
      insert into app.link_clicks_daily (day, kind, target_type, target_ref, clicks)
      values ((now() at time zone 'Asia/Bangkok')::date, ${kind}, ${type}, ${ref}, 1)
      on conflict (target_type, target_ref, kind, day) do update set clicks = app.link_clicks_daily.clicks + 1`;
  } catch (error) {
    // 42P01: migration 0054 not run yet
    if ((error as { code?: string }).code !== '42P01') console.warn('[link-clicks] not counted', error);
  }
}

export type KindCounts = Partial<Record<LinkKind, number>>;

/** One target's counts by kind between two Bangkok days, inclusive (a sponsored slot's run) */
export async function targetClicks(type: ClickTargetType, ref: string, fromDay: string, toDay: string): Promise<KindCounts> {
  if (!USE_POSTGRES) {
    const out: KindCounts = {};
    for (const [key, n] of memory) {
      const [day, t, r, kind] = key.split('|');
      if (t === type && r === ref && day >= fromDay && day <= toDay) out[kind as LinkKind] = (out[kind as LinkKind] ?? 0) + n;
    }
    return out;
  }
  try {
    const rows = await sql()`
      select kind, sum(clicks)::int as n from app.link_clicks_daily
      where target_type = ${type} and target_ref = ${ref} and day between ${fromDay}::date and ${toDay}::date
      group by kind`;
    return Object.fromEntries(rows.map((r) => [r.kind, r.n]));
  } catch {
    return {};
  }
}

export interface OutboundTarget {
  type: ClickTargetType;
  ref: string;
  title: string;
  total: number;
  kinds: KindCounts;
}

/** The places, อีเวนต์, ตี้ and challenges people left the site from most in the last `days` days (admin) */
export async function topOutbound(days: number, { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {}): Promise<OutboundTarget[]> {
  if (!USE_POSTGRES) return [];
  try {
    const db = sql();
    const rows = await db`
      with top as (
        select target_type, target_ref, sum(clicks)::int as total
        from app.link_clicks_daily
        where day > (now() at time zone 'Asia/Bangkok')::date - ${days}::int and kind not like 'sponsored%'
        group by target_type, target_ref order by total desc, target_ref limit ${limit} offset ${offset}
      )
      select t.target_type, t.target_ref, t.total,
        coalesce(p.title, e.title, q.title, t.target_ref) as title,
        (select jsonb_object_agg(kind, n) from (
          select kind, sum(clicks)::int as n from app.link_clicks_daily c
          where c.target_type = t.target_type and c.target_ref = t.target_ref and kind not like 'sponsored%'
            and c.day > (now() at time zone 'Asia/Bangkok')::date - ${days}::int
          group by kind) k) as kinds
      from top t
      left join app.places p on t.target_type = 'spot' and p.slug = t.target_ref
      left join app.events e on t.target_type in ('community', 'fair') and e.slug = t.target_ref
      left join app.quests q on t.target_type = 'challenge' and q.slug = t.target_ref
      order by t.total desc, t.target_ref`;
    return rows.map((r) => ({ type: r.target_type, ref: r.target_ref, title: r.title, total: r.total, kinds: r.kinds ?? {} }));
  } catch {
    return [];
  }
}
