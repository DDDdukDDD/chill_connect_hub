import type postgres from 'postgres';
import { USE_POSTGRES, sql, type Sql } from '../db/postgres/client';
import { uuidV7 } from '../db/postgres/rows.mjs';
import { memberRepository } from '../members';
import type { Member } from '../members/types';
import { ownUploadFolder } from '../media/ownMedia';
import { deleteMemberUploads } from '../media/cleanup';
import { roundCoord } from './geo';
import {
  cleanDay,
  cleanLegs,
  followedLegs,
  subTrip,
  cleanLocalTime,
  daysBetween,
  MAX_ITEM_CAPTION,
  MAX_TRIP_DAYS,
  MAX_TRIP_INTRO,
  MAX_TRIP_ITEMS,
  MAX_TRIP_TITLE,
  type TripItemView,
  type TripPerson,
  type TripStatus,
  type TripView,
  type TripVisibility,
} from './story';

/**
 * Trip stories (docs/TRIPS_PLAN.md, migration 0069). A trip belongs to one member; its photos come from posts made
 * during the trip or are picked from the phone afterwards. Postgres only: without a database trips are switched off.
 */

export const TRIPS_ENABLED = USE_POSTGRES;

export class TripError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export interface TripSummary {
  id: string;
  title: string;
  startsOn: string;
  endsOn: string;
  status: TripStatus;
  visibility: TripVisibility;
  cover?: string;
  itemCount: number;
  cities: string[];
  author: TripPerson;
  withPeople: TripPerson[];
  publishedAt?: string;
}

export interface NewTripItem {
  kind?: 'photo' | 'video';
  mediaUrl: string;
  posterUrl?: string;
  ratio?: number;
  caption?: string;
  takenLocal: string;
  lat?: number;
  lng?: number;
}

const VISIBILITIES = new Set<TripVisibility>(['public', 'followers', 'private']);
const MAX_ITEMS_PER_CALL = 60;
const MAX_TRIPS_PER_MEMBER = 100;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const memberRow = (db: Sql, id: string) => db`(select id from app.members where legacy_id = ${id})`;
const iso = (value: unknown) => (value ? new Date(value as string).toISOString() : undefined);
const text = (value: unknown, max: number) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const finite = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);

function requireDatabase() {
  if (!TRIPS_ENABLED) throw new TripError('ทริปต้องใช้ฐานข้อมูล', 503);
}

const person = (member: Member | undefined, id: string): TripPerson => ({ id, name: member?.displayName ?? 'สมาชิก', ...(member?.avatarUrl ? { avatar: member.avatarUrl } : {}) });

/** Whether the viewer may see a trip that is not theirs */
function mayView(row: { status: string; visibility: string; author: string }, viewer: Member | null, author: Member | undefined): boolean {
  if (viewer?.id === row.author) return row.status !== 'removed';
  if (row.status !== 'published' || !author || author.status === 'banned') return false;
  if (viewer?.blockedIds?.includes(row.author) || author.blockedIds?.includes(viewer?.id ?? '')) return false;
  if (row.visibility === 'public') return true;
  if (row.visibility === 'followers') return Boolean(viewer?.followingIds?.includes(row.author));
  return false;
}

const selectTrips = (db: Sql) => db`
  select t.*, t.starts_on::text as starts, t.ends_on::text as ends, a.legacy_id as author,
    coalesce((select array_agg(m.legacy_id) from app.members m where m.id = any(t.tagged_ids)), '{}') as tagged
  from app.trips t join app.members a on a.id = t.author_id`;

function toItem(r: Record<string, unknown>, owner: boolean): TripItemView {
  return {
    id: r.id as string,
    kind: r.kind as 'photo' | 'video',
    mediaUrl: r.media_url as string,
    ...(r.poster_url ? { posterUrl: r.poster_url as string } : {}),
    ...(typeof r.ratio === 'number' ? { ratio: r.ratio } : {}),
    caption: r.caption as string,
    takenLocal: r.taken as string,
    ...(r.city ? { city: r.city as string } : {}),
    ...(r.country ? { country: r.country as string } : {}),
    ...(r.country_code ? { countryCode: r.country_code as string } : {}),
    ...(typeof r.lat === 'number' && typeof r.lng === 'number' ? { lat: r.lat, lng: r.lng } : {}),
    ...(r.moment ? { momentId: r.moment as string } : {}),
    ...(owner && r.hidden ? { hidden: true } : {}),
  };
}

async function tripRow(id: string): Promise<Record<string, unknown> | null> {
  if (!UUID.test(id)) return null;
  const db = sql();
  const rows = await db`${selectTrips(db)} where t.id = ${id}`;
  return rows[0] ?? null;
}

/** A trip as the viewer may see it, or null */
export async function getTrip(id: string, viewer: Member | null): Promise<TripView | null> {
  if (!TRIPS_ENABLED) return null;
  const row = await tripRow(id);
  if (!row) return null;
  const tagged = row.tagged as string[];
  const people = await memberRepository.findByIds([row.author as string, ...tagged]);
  const author = people.get(row.author as string);
  if (!mayView(row as { status: string; visibility: string; author: string }, viewer, author)) return null;
  const owner = viewer?.id === row.author;
  const db = sql();
  const items = await db`
    select i.*, to_char(i.taken_local, 'YYYY-MM-DD"T"HH24:MI') as taken, mo.slug as moment
    from app.trip_items i left join app.moments mo on mo.id = i.moment_id
    where i.trip_id = ${id} ${owner ? db`` : db`and not i.hidden`}
    order by i.taken_local, i.created_at`;
  // "ไปตามรอย": who planned a trip after this one (each member once), and the trip this one came from if it can be seen
  const [{ followed }] = await db<{ followed: number }[]>`
    select count(distinct author_id)::int as followed from app.trips where follows_trip_id = ${id} and status <> 'removed'`;
  const source = row.follows_trip_id ? await tripRow(row.follows_trip_id as string) : null;
  const sourceAuthor = source ? (await memberRepository.findByIds([source.author as string])).get(source.author as string) : undefined;
  const follows = source && mayView(source as { status: string; visibility: string; author: string }, viewer, sourceAuthor)
    ? { id: source.id as string, title: source.title as string, authorName: sourceAuthor?.displayName ?? 'สมาชิก' }
    : undefined;
  return {
    id: row.id as string,
    title: row.title as string,
    intro: row.intro as string,
    startsOn: row.starts as string,
    endsOn: row.ends as string,
    visibility: row.visibility as TripVisibility,
    status: row.status as TripStatus,
    author: person(author, row.author as string),
    withPeople: tagged.filter((tid) => people.get(tid)?.status !== 'banned').map((tid) => person(people.get(tid), tid)),
    ...(row.cover_item_id ? { coverItemId: row.cover_item_id as string } : {}),
    legs: (row.legs as TripView['legs']) ?? [],
    ...(follows ? { follows } : {}),
    followedCount: followed,
    items: items.map((r) => toItem(r, owner)),
    ...(row.published_at ? { publishedAt: iso(row.published_at) } : {}),
    createdAt: iso(row.created_at)!,
    isOwner: owner,
  };
}

async function ownTrip(member: Member, id: string): Promise<Record<string, unknown>> {
  requireDatabase();
  const row = await tripRow(id);
  if (!row || row.author !== member.id || row.status === 'removed') throw new TripError('ไม่พบทริปนี้', 404);
  return row;
}

function cleanDates(startsOn: unknown, endsOn: unknown): { startsOn: string; endsOn: string } {
  const start = cleanDay(startsOn);
  const end = cleanDay(endsOn) ?? start;
  if (!start || !end) throw new TripError('กรุณาเลือกวันเริ่มและวันจบของทริป');
  const days = daysBetween(start, end);
  if (days < 0) throw new TripError('วันจบต้องไม่ก่อนวันเริ่ม');
  if (days + 1 > MAX_TRIP_DAYS) throw new TripError(`ทริปหนึ่งยาวได้ไม่เกิน ${MAX_TRIP_DAYS} วัน`);
  return { startsOn: start, endsOn: end };
}

async function cleanTagged(member: Member, value: unknown): Promise<string[]> {
  const ids = [...new Set((Array.isArray(value) ? value : []).filter((id): id is string => typeof id === 'string' && id !== member.id))].slice(0, 20);
  if (!ids.length) return [];
  const people = await memberRepository.findByIds(ids);
  return ids.filter((id) => people.has(id) && people.get(id)!.status !== 'banned' && !member.blockedIds?.includes(id));
}

export async function createTrip(member: Member, input: Record<string, unknown>): Promise<string> {
  requireDatabase();
  const title = text(input.title, MAX_TRIP_TITLE);
  if (title.length < 2) throw new TripError('ตั้งชื่อทริปสักหน่อยนะ');
  const { startsOn, endsOn } = cleanDates(input.startsOn, input.endsOn);
  const visibility = VISIBILITIES.has(input.visibility as TripVisibility) ? (input.visibility as TripVisibility) : 'public';
  const tagged = await cleanTagged(member, input.taggedIds);
  const db = sql();
  const [{ count }] = await db<{ count: number }[]>`select count(*)::int as count from app.trips where author_id = ${memberRow(db, member.id)}`;
  if (count >= MAX_TRIPS_PER_MEMBER) throw new TripError(`สร้างทริปได้ไม่เกิน ${MAX_TRIPS_PER_MEMBER} ทริป`);
  const now = new Date().toISOString();
  const id = uuidV7(now);
  await db`
    insert into app.trips (id, author_id, title, intro, starts_on, ends_on, visibility, tagged_ids, created_at, updated_at)
    values (${id}, ${memberRow(db, member.id)}, ${title}, ${text(input.intro, MAX_TRIP_INTRO)}, ${startsOn}, ${endsOn}, ${visibility},
      (select coalesce(array_agg(id), '{}') from app.members where legacy_id = any(${tagged})), ${now}, ${now})`;
  return id;
}

/** Title, intro, days, who sees it, cover, people, day places, and publishing */
export async function updateTrip(member: Member, id: string, input: Record<string, unknown>): Promise<void> {
  const row = await ownTrip(member, id);
  const db = sql();
  const set: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ('title' in input) {
    const title = text(input.title, MAX_TRIP_TITLE);
    if (title.length < 2) throw new TripError('ตั้งชื่อทริปสักหน่อยนะ');
    set.title = title;
  }
  if ('intro' in input) set.intro = text(input.intro, MAX_TRIP_INTRO);
  if ('startsOn' in input || 'endsOn' in input) Object.assign(set, (({ startsOn, endsOn }) => ({ starts_on: startsOn, ends_on: endsOn }))(cleanDates(input.startsOn ?? row.starts, input.endsOn ?? row.ends)));
  if ('visibility' in input) {
    if (!VISIBILITIES.has(input.visibility as TripVisibility)) throw new TripError('เลือกว่าใครเห็นทริปนี้ได้');
    set.visibility = input.visibility;
  }
  if ('coverItemId' in input) {
    const cover = typeof input.coverItemId === 'string' && UUID.test(input.coverItemId) ? input.coverItemId : null;
    if (cover && !(await db`select 1 from app.trip_items where id = ${cover} and trip_id = ${id}`).length) throw new TripError('ไม่พบรูปนี้ในทริป');
    set.cover_item_id = cover;
  }
  // Sub-trips stay inside the trip's days: new ones are checked, and old ones again when the days change
  if ('legs' in input || 'starts_on' in set) {
    const startsOn = (set.starts_on as string | undefined) ?? (row.starts as string);
    const endsOn = (set.ends_on as string | undefined) ?? (row.ends as string);
    const legs = cleanLegs('legs' in input ? input.legs : row.legs, startsOn, endsOn);
    if (typeof legs === 'string') throw new TripError('legs' in input ? legs : `ปรับวันของทริปย่อยก่อน: ${legs}`);
    set.legs = db.json(legs as unknown as postgres.JSONValue);
  }
  if ('status' in input) {
    if (input.status === 'published') {
      if (row.status === 'hidden') throw new TripError('ทริปนี้ถูกซ่อนโดยทีมงาน', 403);
      const [{ count }] = await db<{ count: number }[]>`select count(*)::int as count from app.trip_items where trip_id = ${id} and not hidden`;
      if (count === 0) throw new TripError('เพิ่มรูปอย่างน้อย 1 รูปก่อนเผยแพร่นะ');
      set.status = 'published';
      if (!row.published_at) set.published_at = set.updated_at;
    } else if (input.status === 'draft') {
      if (row.status === 'hidden') throw new TripError('ทริปนี้ถูกซ่อนโดยทีมงาน', 403);
      set.status = 'draft';
    } else throw new TripError('สถานะไม่ถูกต้อง');
  }
  if ('taggedIds' in input) {
    const tagged = await cleanTagged(member, input.taggedIds);
    await db`update app.trips set tagged_ids = (select coalesce(array_agg(id), '{}') from app.members where legacy_id = any(${tagged})) where id = ${id}`;
  }
  const columns = Object.keys(set);
  await db`update app.trips set ${db(set as Record<string, string>, columns)} where id = ${id}`;
}

/** Deletes a trip and the photos picked for it (photos of posts stay with the posts) */
export async function deleteTrip(member: Member, id: string): Promise<void> {
  await ownTrip(member, id);
  const db = sql();
  const files = await db<{ media_url: string; poster_url: string | null }[]>`select media_url, poster_url from app.trip_items where trip_id = ${id} and moment_id is null`;
  await db`delete from app.trips where id = ${id}`;
  await deleteMemberUploads(files.flatMap((f) => [f.media_url, f.poster_url ?? undefined]), []).catch((error) => console.error('[trips] file cleanup failed', error));
}

function cleanItem(input: NewTripItem): NewTripItem {
  const mediaUrl = typeof input.mediaUrl === 'string' ? input.mediaUrl : '';
  const folder = ownUploadFolder(mediaUrl);
  if (folder !== 'trips' && folder !== 'moments') throw new TripError('รูปต้องอัปโหลดผ่านระบบก่อน');
  const posterUrl = typeof input.posterUrl === 'string' && ownUploadFolder(input.posterUrl) ? input.posterUrl : undefined;
  const takenLocal = cleanLocalTime(input.takenLocal);
  if (!takenLocal) throw new TripError('ไม่รู้เวลาที่ถ่ายรูปนี้');
  const lat = finite(input.lat);
  const lng = finite(input.lng);
  const located = lat !== undefined && lng !== undefined && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
  const ratio = finite(input.ratio);
  return {
    kind: input.kind === 'video' ? 'video' : 'photo',
    mediaUrl,
    posterUrl,
    ratio: ratio ? Math.min(3, Math.max(0.3, Math.round(ratio * 1000) / 1000)) : undefined,
    caption: text(input.caption, MAX_ITEM_CAPTION),
    takenLocal,
    // City level only: about 1 km, never the exact spot
    ...(located ? { lat: roundCoord(lat), lng: roundCoord(lng) } : {}),
  };
}

async function insertItems(db: Sql, tripId: string, items: NewTripItem[], momentRef: ReturnType<Sql> | null = null): Promise<string[]> {
  const now = new Date().toISOString();
  const ids: string[] = [];
  for (const item of items) {
    const id = uuidV7(now);
    ids.push(id);
    await db`
      insert into app.trip_items (id, trip_id, moment_id, kind, media_url, poster_url, ratio, caption, taken_local, lat, lng, created_at)
      values (${id}, ${tripId}, ${momentRef}, ${item.kind ?? 'photo'}, ${item.mediaUrl}, ${item.posterUrl ?? null}, ${item.ratio ?? null},
        ${item.caption ?? ''}, ${item.takenLocal.replace('T', ' ')}::text::timestamp, ${item.lat ?? null}, ${item.lng ?? null}, ${now})`;
  }
  return ids;
}

/** Photos picked from the phone, with the time and place read from each file */
export async function addTripItems(member: Member, id: string, input: unknown): Promise<string[]> {
  await ownTrip(member, id);
  const list = Array.isArray(input) ? input : [];
  if (!list.length) throw new TripError('ยังไม่ได้เลือกรูป');
  if (list.length > MAX_ITEMS_PER_CALL) throw new TripError(`ส่งได้ครั้งละไม่เกิน ${MAX_ITEMS_PER_CALL} รูป`);
  const items = list.map((item) => cleanItem(item as NewTripItem));
  const db = sql();
  const [{ count }] = await db<{ count: number }[]>`select count(*)::int as count from app.trip_items where trip_id = ${id}`;
  if (count + items.length > MAX_TRIP_ITEMS) throw new TripError(`ทริปหนึ่งมีได้ไม่เกิน ${MAX_TRIP_ITEMS} รูป`);
  const ids = await db.begin((tx) => insertItems(tx, id, items));
  await db`update app.trips set updated_at = now() where id = ${id}`;
  return ids;
}

export async function updateTripItem(member: Member, id: string, itemId: string, input: Record<string, unknown>): Promise<void> {
  await ownTrip(member, id);
  if (!UUID.test(itemId)) throw new TripError('ไม่พบรูปนี้', 404);
  const set: Record<string, unknown> = {};
  if ('caption' in input) set.caption = text(input.caption, MAX_ITEM_CAPTION);
  if ('hidden' in input) set.hidden = input.hidden === true;
  const taken = 'takenLocal' in input ? cleanLocalTime(input.takenLocal) : undefined;
  if (taken === null) throw new TripError('เวลาไม่ถูกต้อง');
  if (!Object.keys(set).length && !taken) return;
  const db = sql();
  const changes = Object.keys(set).length ? db`${db(set as Record<string, string>, Object.keys(set))}` : null;
  // Wall-clock time: cast as text so the server's time zone never shifts it
  const time = taken ? db`taken_local = ${taken.replace('T', ' ')}::text::timestamp` : null;
  const done = await db`
    update app.trip_items set ${changes && time ? db`${changes}, ${time}` : (changes ?? time!)}
    where id = ${itemId} and trip_id = ${id} returning id`;
  if (!done.length) throw new TripError('ไม่พบรูปนี้', 404);
}

export async function removeTripItem(member: Member, id: string, itemId: string): Promise<void> {
  await ownTrip(member, id);
  if (!UUID.test(itemId)) throw new TripError('ไม่พบรูปนี้', 404);
  const db = sql();
  const [removed] = await db<{ media_url: string; poster_url: string | null; moment_id: string | null }[]>`
    delete from app.trip_items where id = ${itemId} and trip_id = ${id} returning media_url, poster_url, moment_id`;
  if (!removed) throw new TripError('ไม่พบรูปนี้', 404);
  await db`update app.trips set cover_item_id = null where id = ${id} and cover_item_id = ${itemId}`;
  if (!removed.moment_id) await deleteMemberUploads([removed.media_url, removed.poster_url ?? undefined], []).catch(() => 0);
}

/** The member's trip that is going on today (in their own calendar), for "เพิ่มเข้าทริป" when posting */
export async function activeTrip(member: Member, today: string): Promise<{ id: string; title: string } | null> {
  if (!TRIPS_ENABLED || !cleanDay(today)) return null;
  const db = sql();
  const rows = await db<{ id: string; title: string }[]>`
    select id, title from app.trips
    where author_id = ${memberRow(db, member.id)} and status in ('draft', 'published') and ${today}::date between starts_on and ends_on
    order by starts_on desc, created_at desc limit 1`;
  return rows[0] ?? null;
}

/** A post made during the trip joins it: one item per photo (a clip joins as its clip with the cover) */
export async function addMomentToTrip(
  member: Member,
  tripId: string,
  moment: { id: string; images: string[]; caption: string; imageRatio?: number; video?: { url: string } },
  at: { takenLocal?: unknown; lat?: unknown; lng?: unknown },
): Promise<void> {
  if (!TRIPS_ENABLED) return;
  const row = await tripRow(tripId);
  if (!row || row.author !== member.id || row.status === 'removed') return;
  const takenLocal = cleanLocalTime(at.takenLocal);
  if (!takenLocal) return;
  const base = { takenLocal, lat: finite(at.lat), lng: finite(at.lng), caption: moment.caption, ratio: moment.imageRatio };
  const items = moment.video
    ? [cleanItem({ ...base, kind: 'video', mediaUrl: moment.video.url, posterUrl: moment.images[0] })]
    : moment.images.map((url) => cleanItem({ ...base, mediaUrl: url }));
  const db = sql();
  await db.begin((tx) => insertItems(tx, tripId, items, tx`(select id from app.moments where slug = ${moment.id})`));
  await db`update app.trips set updated_at = now() where id = ${tripId}`;
}

function toSummary(r: Record<string, unknown>, people: Map<string, Member>): TripSummary {
  const tagged = (r.tagged as string[]) ?? [];
  return {
    id: r.id as string,
    title: r.title as string,
    startsOn: r.starts as string,
    endsOn: r.ends as string,
    status: r.status as TripStatus,
    visibility: r.visibility as TripVisibility,
    ...(r.cover ? { cover: r.cover as string } : {}),
    itemCount: Number(r.item_count ?? 0),
    // The author's sub-trips name the cities; without them, the cities of the photos
    cities: Array.isArray(r.legs) && r.legs.length ? (r.legs as { city: string }[]).map((l) => l.city) : ((r.cities as string[]) ?? []).filter(Boolean),
    author: person(people.get(r.author as string), r.author as string),
    withPeople: tagged.filter((id) => people.has(id)).map((id) => person(people.get(id), id)),
    ...(r.published_at ? { publishedAt: iso(r.published_at) } : {}),
  };
}

const summaryColumns = (db: Sql) => db`
  (select coalesce(c.poster_url, c.media_url) from app.trip_items c where c.id = t.cover_item_id) as chosen_cover,
  (select coalesce(f.poster_url, f.media_url) from app.trip_items f where f.trip_id = t.id and not f.hidden order by f.taken_local limit 1) as first_cover,
  (select count(*) from app.trip_items n where n.trip_id = t.id and not n.hidden) as item_count,
  (select array_agg(x.place order by x.first) from (select coalesce(nullif(p.city, ''), nullif(p.country, '')) as place, min(p.taken_local) as first
     from app.trip_items p where p.trip_id = t.id and not p.hidden group by 1) x where x.place is not null) as cities`;

async function summaries(rows: Record<string, unknown>[], viewer: Member | null): Promise<TripSummary[]> {
  const ids = new Set<string>();
  for (const r of rows) [r.author as string, ...((r.tagged as string[]) ?? [])].forEach((id) => ids.add(id));
  const people = await memberRepository.findByIds([...ids]);
  return rows
    .filter((r) => mayView(r as { status: string; visibility: string; author: string }, viewer, people.get(r.author as string)))
    .map((r) => toSummary({ ...r, cover: r.chosen_cover ?? r.first_cover }, people));
}

/** A member's trips for their profile (all of their own when they look, else what the viewer may see) */
export async function tripsOf(authorId: string, viewer: Member | null): Promise<TripSummary[]> {
  if (!TRIPS_ENABLED) return [];
  const db = sql();
  const own = viewer?.id === authorId;
  const rows = await db`
    select t.*, t.starts_on::text as starts, t.ends_on::text as ends, a.legacy_id as author,
      coalesce((select array_agg(m.legacy_id) from app.members m where m.id = any(t.tagged_ids)), '{}') as tagged, ${summaryColumns(db)}
    from app.trips t join app.members a on a.id = t.author_id
    where a.legacy_id = ${authorId} ${own ? db`and t.status <> 'removed'` : db`and t.status = 'published'`}
    order by t.starts_on desc limit 60`;
  return summaries(rows, viewer);
}

/** Newest published trips the viewer may see, for the feed (people they follow first is the feed's job) */
export async function recentTrips(viewer: Member | null, limit = 10): Promise<TripSummary[]> {
  if (!TRIPS_ENABLED) return [];
  const db = sql();
  const rows = await db`
    select t.*, t.starts_on::text as starts, t.ends_on::text as ends, a.legacy_id as author,
      coalesce((select array_agg(m.legacy_id) from app.members m where m.id = any(t.tagged_ids)), '{}') as tagged, ${summaryColumns(db)}
    from app.trips t join app.members a on a.id = t.author_id
    where t.status = 'published' and t.visibility <> 'private' and t.published_at > now() - interval '60 days'
    order by t.published_at desc limit ${Math.min(30, limit * 2)}`;
  return (await summaries(rows, viewer)).slice(0, limit);
}

/** Staff: hide or bring back a trip */
export async function setTripModeration(id: string, status: 'hidden' | 'published'): Promise<void> {
  requireDatabase();
  if (!UUID.test(id)) throw new TripError('ไม่พบทริปนี้', 404);
  const db = sql();
  await db`update app.trips set status = ${status}, updated_at = now() where id = ${id}`;
}

/**
 * "ไปตามรอยทริปนี้" (owner 2026-11-26): a new draft trip for the member, the same length and sub-trips as the source,
 * starting on `startsOn` (their own calendar). Planning the same trip again opens the one already made.
 */
export async function followTrip(member: Member, sourceId: string, startsOn: unknown, legId?: unknown): Promise<{ id: string; existing: boolean }> {
  requireDatabase();
  const source = await getTrip(sourceId, member);
  if (!source || source.status !== 'published') throw new TripError('ไม่พบทริปนี้', 404);
  if (source.isOwner) throw new TripError('นี่คือทริปของคุณเอง');
  // One sub-trip only (its own link, "เล่นเฉพาะ…"): its days and city become the new trip
  const plan = typeof legId === 'string' && legId ? subTrip(source, legId) : source;
  if (!plan) throw new TripError('ไม่พบทริปย่อยนี้', 404);
  const title = `ตามรอย ${plan.title}`.slice(0, MAX_TRIP_TITLE);
  const start = cleanDay(startsOn);
  if (!start) throw new TripError('เลือกวันที่จะเริ่มเดินทาง');
  const db = sql();
  const [mine] = await db<{ id: string }[]>`
    select id from app.trips where follows_trip_id = ${sourceId} and author_id = ${memberRow(db, member.id)} and title = ${title} and status <> 'removed'
    order by created_at desc limit 1`;
  if (mine) return { id: mine.id, existing: true };
  const { endsOn, legs } = followedLegs(plan, start);
  const id = await createTrip(member, { title, startsOn: start, endsOn, visibility: 'public' });
  const cleaned = cleanLegs(legs, start, endsOn);
  await db`
    update app.trips set follows_trip_id = ${sourceId}, legs = ${db.json((typeof cleaned === 'string' ? [] : cleaned) as unknown as postgres.JSONValue)}
    where id = ${id}`;
  return { id, existing: false };
}
