import { sql, type Sql } from '../db/postgres/client';
import type { Member } from '../members/types';
import { addMomentToTrip, createTrip, TRIPS_ENABLED, TripError } from './service';
import { MAX_TRIP_TITLE, SUGGEST_MIN_PLACES, SUGGEST_WINDOW_DAYS } from './story';

/**
 * Trips that come from everyday life (owner 2026-11-27): trips abroad happen a few times a year, a Saturday out every
 * week. When a member posted moments at 3 or more places on one day, or over one weekend (Saturday and Sunday), and
 * none of them is in a trip yet, we offer "วันนี้ไป 3 ที่ เล่าเป็นเรื่องไหม". One tap makes a draft from those moments
 * and opens its story; one more publishes it. Days are Bangkok days, when the moments were posted.
 */

export interface TripSuggestion {
  from: string;
  to: string;
  /** The places in the order they were visited */
  places: string[];
  momentCount: number;
  /** Up to 3 pictures for the card */
  covers: string[];
}

interface MomentRow {
  slug: string;
  caption: string;
  image_ratio: number | null;
  video_url: string | null;
  images: string[];
  place: string | null;
  place_key: string | null;
  day: string;
  local: string;
}

const memberRow = (db: Sql, id: string) => db`(select id from app.members where legacy_id = ${id})`;
const shift = (day: string, by: number) => new Date(Date.parse(`${day}T00:00:00Z`) + by * 86_400_000).toISOString().slice(0, 10);
const weekday = (day: string) => new Date(`${day}T00:00:00Z`).getUTCDay();

/** The member's recent moments not in any trip, with the place each was at */
async function looseMoments(member: Member): Promise<MomentRow[]> {
  const db = sql();
  return db<MomentRow[]>`
    select m.slug, m.caption, m.image_ratio, m.video_url,
      array(select i.url from app.moment_images i where i.moment_id = m.id order by i.position) as images,
      coalesce(p.title, e.title, nullif(m.target_title, ''), nullif(trim(m.location_text), '')) as place,
      coalesce(m.place_id::text, m.event_id::text, nullif(lower(trim(m.location_text)), '')) as place_key,
      to_char(m.created_at at time zone 'Asia/Bangkok', 'YYYY-MM-DD') as day,
      to_char(m.created_at at time zone 'Asia/Bangkok', 'YYYY-MM-DD"T"HH24:MI') as local
    from app.moments m
      left join app.places p on p.id = m.place_id
      left join app.events e on e.id = m.event_id
    where m.author_id = ${memberRow(db, member.id)} and m.status = 'published'
      and m.created_at > now() - ${SUGGEST_WINDOW_DAYS + 1} * interval '1 day'
      and not exists (select 1 from app.trip_items ti where ti.moment_id = m.id)
    order by m.created_at`;
}

/** Days already inside one of the member's trips: the trip tells those days already */
async function tripDays(member: Member): Promise<{ starts: string; ends: string }[]> {
  const db = sql();
  return db<{ starts: string; ends: string }[]>`
    select starts_on::text as starts, ends_on::text as ends from app.trips
    where author_id = ${memberRow(db, member.id)} and status <> 'removed' and ends_on > current_date - ${SUGGEST_WINDOW_DAYS + 2}::int`;
}

/** The most recent day or weekend worth a story, with its moments */
async function findGroup(member: Member): Promise<{ from: string; to: string; moments: MomentRow[] } | null> {
  const moments = (await looseMoments(member)).filter((m) => m.images.length || m.video_url);
  if (!moments.length) return null;
  const covered = await tripDays(member);
  const inTrip = (day: string) => covered.some((t) => day >= t.starts && day <= t.ends);
  const byDay = new Map<string, MomentRow[]>();
  for (const m of moments) byDay.set(m.day, [...(byDay.get(m.day) ?? []), m]);

  const groups: { from: string; to: string; moments: MomentRow[] }[] = [];
  for (const [day, list] of byDay) {
    groups.push({ from: day, to: day, moments: list });
    // Saturday with Sunday: one weekend
    if (weekday(day) === 6 && byDay.has(shift(day, 1))) groups.push({ from: day, to: shift(day, 1), moments: [...list, ...byDay.get(shift(day, 1))!] });
  }
  const worth = groups.filter((g) => !inTrip(g.from) && !inTrip(g.to) && new Set(g.moments.map((m) => m.place_key).filter(Boolean)).size >= SUGGEST_MIN_PLACES);
  // The latest; for the same last day, the whole weekend
  worth.sort((a, b) => b.to.localeCompare(a.to) || a.from.localeCompare(b.from));
  return worth[0] ?? null;
}

const placesOf = (moments: MomentRow[]) => {
  const seen = new Map<string, string>();
  for (const m of moments) if (m.place_key && m.place && !seen.has(m.place_key)) seen.set(m.place_key, m.place);
  return [...seen.values()];
};

export async function tripSuggestion(member: Member): Promise<TripSuggestion | null> {
  if (!TRIPS_ENABLED) return null;
  const group = await findGroup(member);
  if (!group) return null;
  return {
    from: group.from,
    to: group.to,
    places: placesOf(group.moments),
    momentCount: group.moments.length,
    covers: group.moments.map((m) => m.images[0]).filter(Boolean).slice(0, 3),
  };
}

/** Makes the draft from the suggested day's moments; the range must still be the one on offer */
export async function createSuggestedTrip(member: Member, from: unknown, to: unknown): Promise<string> {
  const group = await findGroup(member);
  if (!group || group.from !== from || group.to !== to) throw new TripError('โมเมนต์ชุดนี้เล่าเป็นเรื่องไปแล้ว หรือไม่มีแล้ว', 409);
  const places = placesOf(group.moments);
  // "100 มหาเศรษฐ์ และอีก 2 ที่": the first place without its branch, short enough to read at a glance; the author can rename it
  const first = (places[0] ?? '').split(/ สาขา| - | \(/)[0].trim().slice(0, 40);
  let title = places.length > 1 ? `${first} และอีก ${places.length - 1} ที่` : first;
  if (title.length < 2) title = 'ออกไปใช้ชีวิต';
  title = title.slice(0, MAX_TRIP_TITLE);
  const id = await createTrip(member, { title, startsOn: group.from, endsOn: group.to });
  for (const m of group.moments) {
    await addMomentToTrip(
      member,
      id,
      { id: m.slug, images: m.images, caption: m.caption, ...(m.image_ratio ? { imageRatio: m.image_ratio } : {}), ...(m.video_url ? { video: { url: m.video_url } } : {}) },
      { takenLocal: m.local },
    );
  }
  // Moments carry no coordinates: places in Thailand name their province as the city
  const db = sql();
  await db`
    update app.trip_items ti set city = coalesce(p.province_code, e.province_code), country = 'ไทย', country_code = 'TH'
    from app.moments m left join app.places p on p.id = m.place_id left join app.events e on e.id = m.event_id
    where ti.trip_id = ${id} and ti.moment_id = m.id and ti.city is null and coalesce(p.province_code, e.province_code) is not null`;
  return id;
}
