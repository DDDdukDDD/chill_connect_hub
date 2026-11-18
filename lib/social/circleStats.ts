import { USE_POSTGRES, sql } from '../db/postgres/client';
import { CIRCLE_EVENTS_KEEP_DAYS } from './socialRules';

/**
 * Circles numbers (app.circle_events, migration 0063): how many people opened each kind of Circle and what they did
 * there, per Bangkok day. A member counts once a day per kind and event, so the numbers are people, not taps.
 * No-database mode keeps nothing.
 */
export const CIRCLE_KINDS = ['finish', 'step', 'doing', 'challenge', 'group'] as const;
export const CIRCLE_EVENTS = ['open', 'cheer', 'try', 'together', 'invite', 'view_post'] as const;
export type CircleKind = (typeof CIRCLE_KINDS)[number];
export type CircleEvent = (typeof CIRCLE_EVENTS)[number];

/** The kind of Circle an id names: `f:` finish, `d:` doing, `c:` friends on one challenge, `g:` group, `s:` a post (step or finish) */
export function circleKindOf(id: string, kind?: string): CircleKind | null {
  if (kind && (CIRCLE_KINDS as readonly string[]).includes(kind)) return kind as CircleKind;
  const tag = id.split(':')[0];
  return tag === 'f' ? 'finish' : tag === 'd' ? 'doing' : tag === 'c' ? 'challenge' : tag === 'g' ? 'group' : tag === 's' ? 'step' : null;
}

export async function recordCircleEvent(memberId: string, kind: CircleKind, event: CircleEvent): Promise<void> {
  if (!USE_POSTGRES) return;
  try {
    const db = sql();
    await db`
      insert into app.circle_events (day, member_id, circle_kind, event)
      select (now() at time zone 'Asia/Bangkok')::date, id, ${kind}, ${event} from app.members where legacy_id = ${memberId}
      on conflict do nothing`;
    // Now and then, drop what is past keeping (one small delete on the day index)
    if (Math.random() < 0.01) await db`delete from app.circle_events where day < (now() at time zone 'Asia/Bangkok')::date - ${CIRCLE_EVENTS_KEEP_DAYS}::int`;
  } catch (error) {
    // 42P01: migration 0063 not run yet
    if ((error as { code?: string }).code !== '42P01') console.warn('[circle-events] not counted', error);
  }
}

export interface CircleStatRow {
  kind: CircleKind;
  /** People per event over the range (a person on two days counts twice: "person-days") */
  events: Partial<Record<CircleEvent, number>>;
}

/** Person-days per Circle kind and event over the last `days` days (admin) */
export async function circleStats(days: number): Promise<CircleStatRow[]> {
  if (!USE_POSTGRES) return [];
  try {
    const rows = await sql()`
      select circle_kind, event, count(*)::int as n from app.circle_events
      where day > (now() at time zone 'Asia/Bangkok')::date - ${days}::int
      group by circle_kind, event`;
    const byKind = new Map<CircleKind, CircleStatRow>();
    for (const r of rows) {
      const kind = r.circle_kind as CircleKind;
      const row = byKind.get(kind) ?? { kind, events: {} };
      row.events[r.event as CircleEvent] = r.n;
      byKind.set(kind, row);
    }
    return CIRCLE_KINDS.filter((k) => byKind.has(k)).map((k) => byKind.get(k)!);
  } catch {
    return [];
  }
}
