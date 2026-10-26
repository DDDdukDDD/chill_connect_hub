import { EventItem, ChallengeQuest, MOCK_CHALLENGES } from '@/data/mockData';
import { LifestyleSpotItem } from '@/data/spotsData';
import { IDataRepository } from '../repository';
import {
  EventQueryParams,
  SpotQueryParams,
  QuestQueryParams,
  PaginatedResult,
  ParticipantInfo,
  AtomicJoinResult,
  CreateEventDTO,
  UpdateEventDTO,
  CreateSpotDTO,
  UpdateSpotDTO,
  CreateQuestDTO,
  UpdateQuestDTO,
} from '../types';
import { filterEvents, filterSpots, filterQuests, paginateArray, isEventEnded } from '../queryEngine';
import { normalizeStoredEvents } from '../../eventNormalization';
import { rollSampleEventDate } from '../../sampleEventDates';
import { SEED_QUEST_TEXT_VERSION, addNewSeedQuests, applyQuestLifecycle, copySeedQuestRules, refreshSeedQuestTexts, upgradeLegacySeedQuests } from '../../questLifecycle';
import type { AdminEventItem } from '../../eventsStore';
import { cacheManager } from '../../cache';
import { sql, type Sql } from '../postgres/client';
import { eventToRow, placeToRow, placeImages, questToRow, rowToEvent, rowToPlace, rowToQuest } from '../postgres/rows.mjs';
import { shownEvent, shownEvents, shownQuest } from './jsonAdapter';

/**
 * ตี้ / อีเวนต์, participants, places and challenges in Postgres (docs/DATABASE_DESIGN.md).
 * Lists load the rows and reuse today's filters (lib/db/queryEngine.ts) behind the same short caches as the JSON adapter;
 * joining, leaving and check-in are single SQL transactions, so seats stay right across every server.
 * Rows are mapped by lib/db/postgres/rows.mjs, the same code the import script uses. Ids seen by the app are today's ids (slugs).
 */

type Loose = Record<string, unknown>;
const loose = (item: unknown) => item as Loose;
const str = (value: unknown) => (typeof value === 'string' && value ? value : undefined);

// Columns an upsert never changes on an existing row
const KEEP_ON_UPDATE = new Set(['id', 'slug', 'sort_key', 'created_at']);
const JSON_COLUMNS = new Set(['details', 'contact', 'steps', 'rule', 'brand_reward', 'recurrence']);
/** After a cached list runs out, keep serving it for this long while a fresh copy loads (writes clear it at once) */
const STALE_MS = 10 * 60 * 1000;

const TICKET_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newTicketCode(taken: Set<string>): string {
  for (;;) {
    let code = '';
    for (let i = 0; i < 6; i++) code += TICKET_ALPHABET[Math.floor(Math.random() * TICKET_ALPHABET.length)];
    if (!taken.has(code)) return code;
  }
}

/** Inserts rows, or updates the row with the same slug */
async function upsert(tx: Sql, table: string, rows: Loose[]): Promise<void> {
  if (rows.length === 0) return;
  const columns = Object.keys(rows[0]);
  const updates = columns.filter((c) => !KEEP_ON_UPDATE.has(c)).map((c) => `${c} = excluded.${c}`).join(', ');
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200).map((row) =>
      Object.fromEntries(columns.map((c) => [c, JSON_COLUMNS.has(c) && row[c] != null ? tx.json(row[c] as never) : (row[c] ?? null)])),
    );
    await tx`insert into ${tx(`app.${table}`)} ${tx(chunk as never, columns)} on conflict (slug) do update set ${tx.unsafe(updates)}`;
  }
}

const toParticipant = (r: Loose): ParticipantInfo => ({
  userId: r.legacy_id as string,
  userName: r.display_name as string,
  ...(r.avatar_url ? { userAvatar: r.avatar_url as string } : {}),
  ...(r.joined_at ? { joinedAt: (r.joined_at as Date).toISOString() } : {}),
  ...(r.note ? { note: r.note as string } : {}),
  ticketCode: r.ticket_code as string,
  ...(r.checked_in_at ? { checkedInAt: (r.checked_in_at as Date).toISOString() } : {}),
});

export class PostgresAdapter implements IDataRepository {
  private initialized: Promise<void> | null = null;
  private refs: { provinceCodes: Set<string>; venueCodes: Set<string>; at: number } | null = null;

  /** Once per server: the same start-up clean-ups the JSON adapter runs (core ตี้, seed challenges) */
  private ensureInitialized(): Promise<void> {
    this.initialized ??= this.initialize().catch((error) => {
      this.initialized = null;
      throw error;
    });
    return this.initialized;
  }

  private async initialize(): Promise<void> {
    const stored = await this.loadEvents();
    const { events, changed } = normalizeStoredEvents(stored as AdminEventItem[]);
    if (changed) {
      const before = new Map(stored.map((e) => [e.id, JSON.stringify(e)]));
      const touched = events.filter((e) => before.get(e.id) !== JSON.stringify(e));
      await sql().begin((tx) => this.writeEvents(tx, touched));
      cacheManager.invalidateTag('events');
    }

    const quests = await this.loadQuests();
    const [seedRow] = await sql()`select value from app.app_settings where key = 'quest_seeds'`;
    const seeds = (seedRow?.value ?? {}) as { ids?: string[]; textVersion?: number };
    const upgraded = upgradeLegacySeedQuests(quests, MOCK_CHALLENGES);
    const ruled = copySeedQuestRules(upgraded.quests, MOCK_CHALLENGES);
    const seeded = addNewSeedQuests(ruled.quests, MOCK_CHALLENGES, seeds.ids);
    const refreshed = refreshSeedQuestTexts(seeded.quests, MOCK_CHALLENGES, seeds.textVersion ?? SEED_QUEST_TEXT_VERSION);
    if (upgraded.changed || ruled.changed || seeded.changed || refreshed.changed) {
      const before = new Map(quests.map((q) => [q.id, JSON.stringify(q)]));
      const touched = refreshed.quests.filter((q) => before.get(q.id) !== JSON.stringify(q));
      const seedIds = new Set(seeded.seededIds);
      await sql().begin(async (tx) => {
        await upsert(tx, 'quests', touched.map((q) => questToRow(q, { isSample: seedIds.has(q.id) })));
        await tx`insert into app.app_settings (key, value) values ('quest_seeds', ${tx.json({ ids: seeded.seededIds, textVersion: SEED_QUEST_TEXT_VERSION })})
                 on conflict (key) do update set value = excluded.value, updated_at = now()`;
      });
      cacheManager.invalidateTag('quests');
    }
  }

  private async referenceCodes() {
    if (!this.refs || Date.now() - this.refs.at > 5 * 60 * 1000) {
      const [provinces, venues] = await Promise.all([sql()`select code from app.provinces`, sql()`select code from app.venues`]);
      this.refs = { provinceCodes: new Set(provinces.map((p) => p.code)), venueCodes: new Set(venues.map((v) => v.code)), at: Date.now() };
    }
    return this.refs;
  }

  /* ---------- loading ---------- */

  private loadEvents(): Promise<EventItem[]> {
    return cacheManager.getOrSet(
      'pg:events',
      async () => (await sql()`select * from app.events order by sort_key desc, created_at desc`).map((row) => rowToEvent(row) as EventItem),
      { staleMs: STALE_MS, ttlMs: 15 * 1000, tags: ['events'] },
    );
  }

  private loadSpots(): Promise<LifestyleSpotItem[]> {
    return cacheManager.getOrSet(
      'pg:spots',
      async () => (await sql()`select * from app.places order by sort_key desc`).map((row) => rowToPlace(row) as LifestyleSpotItem),
      { staleMs: STALE_MS, ttlMs: 60 * 1000, tags: ['spots'] },
    );
  }

  private loadQuests(): Promise<ChallengeQuest[]> {
    return cacheManager.getOrSet(
      'pg:quests',
      async () => (await sql()`select * from app.quests order by sort_key desc`).map((row) => rowToQuest(row) as ChallengeQuest),
      { staleMs: STALE_MS, ttlMs: 60 * 1000, tags: ['quests'] },
    );
  }

  private async rawEvent(tx: Sql, id: string): Promise<EventItem | null> {
    const [row] = await tx`select * from app.events where slug = ${id}`;
    return row ? (rowToEvent(row) as EventItem) : null;
  }

  /* ---------- writing ---------- */

  /** Upserts events, looking up the member host, place and series rows they point at */
  private async writeEvents(tx: Sql, events: EventItem[], sortKeys?: Map<string, number>): Promise<void> {
    if (events.length === 0) return;
    const { provinceCodes, venueCodes } = await this.referenceCodes();
    const hostIds = [...new Set(events.flatMap((e) => [str(loose(e).createdByMemberId), str(loose(e).hostId)]).filter((v): v is string => !!v))];
    const placeOf = (e: EventItem) => str(loose(e).spotId) ?? str(loose(e).placeId);
    const spotIds = [...new Set(events.map(placeOf).filter((v): v is string => !!v))];
    const seriesIds = [...new Set(events.map((e) => str(loose(e).seriesId)).filter((v): v is string => !!v))];
    const members = hostIds.length ? await tx`select id, legacy_id, is_sample from app.members where legacy_id in ${tx(hostIds)}` : [];
    const places = spotIds.length ? await tx`select id, slug from app.places where slug in ${tx(spotIds)}` : [];
    const existing = await tx`select id, slug from app.events where slug in ${tx(events.map((e) => e.id))}`;
    const memberBy = new Map(members.map((m) => [m.legacy_id as string, m]));
    const placeBy = new Map(places.map((p) => [p.slug as string, p.id as string]));
    const idBy = new Map(existing.map((e) => [e.slug as string, e.id as string]));

    const seriesBy = new Map<string, string>();
    if (seriesIds.length) {
      for (const s of await tx`select id, legacy_id from app.event_series where legacy_id in ${tx(seriesIds)}`) seriesBy.set(s.legacy_id, s.id);
    }
    const rows = [];
    for (const e of events) {
      const hostLegacy = [str(loose(e).createdByMemberId), str(loose(e).hostId)].find((h) => h && memberBy.has(h));
      const host = hostLegacy ? memberBy.get(hostLegacy) : undefined;
      const seriesId = str(loose(e).seriesId);
      if (seriesId && !seriesBy.has(seriesId)) {
        const [created] = await tx`insert into app.event_series (legacy_id, host_member_id, recurrence)
                                   values (${seriesId}, ${host?.id ?? null}, ${tx.json((loose(e).recurrence ?? {}) as never)}) returning id`;
        seriesBy.set(seriesId, created.id);
      }
      rows.push(eventToRow(e, {
        id: idBy.get(e.id),
        provinceCodes,
        venueCodes,
        hostId: host?.id ?? null,
        placeId: placeBy.get(placeOf(e) ?? '') ?? null,
        seriesId: seriesId ? seriesBy.get(seriesId) : null,
        isSample: e.eventType === 'community' && (!host || host.is_sample),
        sortKey: sortKeys?.get(e.id),
      }));
    }
    await upsert(tx, 'events', rows);
  }

  private async writeSpots(tx: Sql, spots: LifestyleSpotItem[], sortKeys?: Map<string, number>): Promise<void> {
    if (spots.length === 0) return;
    const { provinceCodes } = await this.referenceCodes();
    const existing = await tx`select id, slug from app.places where slug in ${tx(spots.map((s) => s.id))}`;
    const idBy = new Map(existing.map((p) => [p.slug as string, p.id as string]));
    const rows = spots.map((s) => {
      const row = placeToRow(s, { provinceCodes, id: idBy.get(s.id), sortKey: sortKeys?.get(s.id) });
      if (!row) throw new Error(`สถานที่ "${s.title}" ไม่มีจังหวัดที่ระบบรู้จัก (${s.province})`);
      return row;
    });
    await upsert(tx, 'places', rows);
    const ids = rows.map((r) => r.id);
    await tx`delete from app.place_images where place_id in ${tx(ids)}`;
    const images = spots.flatMap((s, i) => placeImages(s, rows[i].id));
    for (let i = 0; i < images.length; i += 1000) await tx`insert into app.place_images ${tx(images.slice(i, i + 1000))}`;
  }

  /** New items come first: the first of a batch gets the highest key */
  private static leadingKeys(ids: string[]): Map<string, number> {
    const now = Date.now();
    return new Map(ids.map((id, i) => [id, now + ids.length - i]));
  }

  private buildEvent(data: CreateEventDTO, takenIds: Set<string>): EventItem {
    const requestedId = data.id && !takenIds.has(data.id) ? data.id : undefined;
    const newId = requestedId || `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    takenIds.add(newId);
    return {
      ...data,
      id: newId,
      participantsCount: data.participantsCount ?? 1,
      maxParticipants: data.maxParticipants ?? (data.eventType === 'community' ? 10 : 500),
      status: data.status || 'recruiting',
      createdAtTimestamp: data.createdAtTimestamp || Date.now(),
    };
  }

  /* ---------- events ---------- */

  public async findEvents(params?: EventQueryParams): Promise<PaginatedResult<EventItem>> {
    return cacheManager.getOrSet(
      `events:${JSON.stringify(params || {})}`,
      async () => {
        await this.ensureInitialized();
        const filtered = filterEvents(shownEvents(await this.loadEvents()), params);
        return paginateArray(filtered, params?.page || 1, params?.limit || 12);
      },
      { staleMs: STALE_MS, ttlMs: 30 * 1000, tags: ['events'] },
    );
  }

  public async findEventById(id: string): Promise<EventItem | null> {
    return cacheManager.getOrSet(
      `event:${id}`,
      async () => {
        await this.ensureInitialized();
        // The whole list is usually cached already; read the row only when it is not
        const event = cacheManager.get<EventItem[]>('pg:events')?.find((e) => e.id === id) ?? await this.rawEvent(sql(), id);
        return event ? shownEvent(event) : null;
      },
      { staleMs: STALE_MS, ttlMs: 60 * 1000, tags: ['events', `event:${id}`] },
    );
  }

  public async listAllEvents(): Promise<EventItem[]> {
    await this.ensureInitialized();
    return shownEvents(await this.loadEvents());
  }

  public async createEvent(data: CreateEventDTO): Promise<EventItem> {
    const [created] = await this.createEvents([data]);
    return created;
  }

  public async createEvents(data: CreateEventDTO[]): Promise<EventItem[]> {
    await this.ensureInitialized();
    if (data.length === 0) return [];
    const created = await sql().begin(async (tx) => {
      const wanted = data.map((d) => d.id).filter((id): id is string => !!id);
      const taken = new Set<string>(wanted.length ? (await tx`select slug from app.events where slug in ${tx(wanted)}`).map((r) => r.slug) : []);
      const events = data.map((item) => this.buildEvent(item, taken));
      await this.writeEvents(tx, events, PostgresAdapter.leadingKeys(events.map((e) => e.id)));
      return events;
    });
    cacheManager.invalidateTag('events');
    return created;
  }

  public async updateEvent(id: string, data: UpdateEventDTO): Promise<EventItem | null> {
    await this.ensureInitialized();
    const updated = await sql().begin(async (tx) => {
      const current = await this.rawEvent(tx, id);
      if (!current) return null;
      const next: EventItem = { ...current, ...data };
      await this.writeEvents(tx, [next]);
      return next;
    });
    if (updated) cacheManager.invalidateTags(['events', `event:${id}`]);
    return updated;
  }

  public async bulkUpdateEvents(updates: Array<{ id: string; data: UpdateEventDTO }>): Promise<number> {
    await this.ensureInitialized();
    if (updates.length === 0) return 0;
    const count = await sql().begin(async (tx) => {
      const rows = await tx`select * from app.events where slug in ${tx(updates.map((u) => u.id))}`;
      const current = new Map(rows.map((row) => [row.slug as string, rowToEvent(row) as EventItem]));
      const next = updates.filter((u) => current.has(u.id)).map((u) => ({ ...current.get(u.id)!, ...u.data }));
      await this.writeEvents(tx, next);
      return next.length;
    });
    if (count) cacheManager.invalidateTag('events');
    return count;
  }

  public async deleteEvent(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const deleted = await sql()`delete from app.events where slug = ${id}`;
    if (deleted.count) cacheManager.invalidateTags(['events', `event:${id}`]);
    return deleted.count > 0;
  }

  public async replaceAllEvents(events: EventItem[]): Promise<number> {
    await this.ensureInitialized();
    await sql().begin(async (tx) => {
      const keep = events.map((e) => e.id);
      if (keep.length) await tx`delete from app.events where slug not in ${tx(keep)}`;
      else await tx`delete from app.events`;
      await this.writeEvents(tx, events, PostgresAdapter.leadingKeys(keep));
    });
    cacheManager.invalidateTag('events');
    return events.length;
  }

  /* ---------- participants ---------- */

  public async atomicJoinEvent(eventId: string, participant: ParticipantInfo): Promise<AtomicJoinResult> {
    await this.ensureInitialized();
    const result = await sql().begin(async (tx): Promise<AtomicJoinResult> => {
      // Lock the event row: two joins for the last seat queue here instead of both winning
      const [row] = await tx`select * from app.events where slug = ${eventId} for update`;
      if (!row) return { success: false, message: 'ไม่พบตี้ที่ระบุ', status: 'not_found' };
      const event = rowToEvent(row) as EventItem;
      // Sample meetups are shown with a rolled-forward date; judge "ended" by the date people see
      if (isEventEnded(rollSampleEventDate(event))) return { success: false, message: 'ตี้นี้สิ้นสุดแล้ว', status: 'event_ended' };

      const [member] = await tx`select id from app.members where legacy_id = ${participant.userId}`;
      if (!member) throw new Error(`member ${participant.userId} is not in the database`);
      const [mine] = await tx`select status from app.event_participants where event_id = ${row.id} and member_id = ${member.id}`;
      if (mine?.status === 'joined') return { success: false, message: 'คุณได้เข้าร่วมตี้นี้แล้ว', status: 'already_joined', updatedEvent: event };

      const currentCount = event.participantsCount || 0;
      const maxAllowed = event.maxParticipants || 10;
      // A fair is a public venue: joining only puts it in the member's My Hub, so it has no seats to run out of
      const seated = event.eventType !== 'public_venue';
      if (seated && currentCount >= maxAllowed) {
        return { success: false, message: 'ตี้นี้มีผู้เข้าร่วมเต็มจำนวนแล้ว', status: 'event_full', participantsCount: currentCount, maxParticipants: maxAllowed };
      }

      const newCount = currentCount + 1;
      const status = seated && newCount >= maxAllowed ? 'full' : event.status;
      await tx`update app.events set participants_count = ${newCount}, details = details || ${tx.json({ status } as never)} where id = ${row.id}`;
      const taken = new Set<string>((await tx`select ticket_code from app.event_participants where event_id = ${row.id}`).map((r) => r.ticket_code));
      await tx`
        insert into app.event_participants (event_id, member_id, status, ticket_code, joined_at, note)
        values (${row.id}, ${member.id}, 'joined', ${newTicketCode(taken)}, ${participant.joinedAt ?? new Date().toISOString()}, ${participant.note ?? null})
        on conflict (event_id, member_id) do update
          set status = 'joined', joined_at = excluded.joined_at, cancelled_at = null, checked_in_at = null, note = excluded.note, ticket_code = excluded.ticket_code`;
      return {
        success: true,
        message: 'เข้าร่วมตี้สำเร็จ!',
        status: 'joined',
        updatedEvent: { ...event, participantsCount: newCount, status },
        participantsCount: newCount,
        maxParticipants: maxAllowed,
      };
    });
    if (result.success) cacheManager.invalidateTags(['events', `event:${eventId}`, `member:${participant.userId}`]);
    return result;
  }

  /** Takes one seat back from each event (row already locked or deleted in this transaction) */
  private async releaseSeat(tx: Sql, eventDbId: string): Promise<void> {
    await tx`
      update app.events set
        participants_count = greatest(0, participants_count - 1),
        details = case when details->>'status' = 'full' and participants_count - 1 < coalesce((details->>'maxParticipants')::int, 10)
                       then details || '{"status":"recruiting"}'::jsonb else details end
      where id = ${eventDbId}`;
  }

  public async atomicLeaveEvent(eventId: string, userId: string): Promise<{ success: boolean; message: string }> {
    await this.ensureInitialized();
    const result = await sql().begin(async (tx) => {
      const [event] = await tx`select id from app.events where slug = ${eventId} for update`;
      if (!event) return { success: false, message: 'ไม่พบตี้' };
      const removed = await tx`
        delete from app.event_participants p using app.members m
        where p.event_id = ${event.id} and p.member_id = m.id and m.legacy_id = ${userId} and p.status = 'joined'`;
      if (!removed.count) return { success: false, message: 'คุณยังไม่ได้เข้าร่วมตี้นี้' };
      await this.releaseSeat(tx, event.id);
      return { success: true, message: 'ยกเลิกการเข้าร่วมเรียบร้อย' };
    });
    if (result.success) cacheManager.invalidateTags(['events', `event:${eventId}`, `member:${userId}`]);
    return result;
  }

  public async getParticipant(eventId: string, userId: string): Promise<ParticipantInfo | null> {
    const [row] = await sql()`
      select m.legacy_id, m.display_name, m.avatar_url, p.joined_at, p.note, p.ticket_code, p.checked_in_at
      from app.event_participants p join app.events e on e.id = p.event_id join app.members m on m.id = p.member_id
      where e.slug = ${eventId} and m.legacy_id = ${userId} and p.status = 'joined'`;
    return row ? toParticipant(row) : null;
  }

  public async setCheckIn(eventId: string, target: { code?: string; userId?: string }, checkedIn: boolean): Promise<ParticipantInfo | null> {
    const code = target.code?.trim().toUpperCase();
    if (!target.userId && !code) return null;
    const [row] = await sql()`
      update app.event_participants p
      set checked_in_at = ${checkedIn ? sql()`coalesce(p.checked_in_at, now())` : null}
      from app.events e, app.members m
      where e.id = p.event_id and m.id = p.member_id and e.slug = ${eventId} and p.status = 'joined'
        and ${target.userId ? sql()`m.legacy_id = ${target.userId}` : sql()`p.ticket_code = ${code!}`}
      returning m.legacy_id, m.display_name, m.avatar_url, p.joined_at, p.note, p.ticket_code, p.checked_in_at`;
    return row ? toParticipant(row) : null;
  }

  public async listParticipations(userId: string): Promise<{ eventId: string; joinedAt?: string; note?: string; checkedInAt?: string }[]> {
    const rows = await sql()`
      select e.slug, p.joined_at, p.note, p.checked_in_at
      from app.event_participants p join app.events e on e.id = p.event_id join app.members m on m.id = p.member_id
      where m.legacy_id = ${userId} and p.status = 'joined'
      order by p.joined_at desc`;
    return rows.map((r) => ({
      eventId: r.slug,
      joinedAt: (r.joined_at as Date).toISOString(),
      ...(r.note ? { note: r.note } : {}),
      ...(r.checked_in_at ? { checkedInAt: (r.checked_in_at as Date).toISOString() } : {}),
    }));
  }

  public async listParticipants(eventId: string): Promise<ParticipantInfo[]> {
    const rows = await sql()`
      select m.legacy_id, m.display_name, m.avatar_url, p.joined_at, p.note, p.ticket_code, p.checked_in_at
      from app.event_participants p join app.events e on e.id = p.event_id join app.members m on m.id = p.member_id
      where e.slug = ${eventId} and p.status = 'joined'
      order by p.joined_at`;
    return rows.map(toParticipant);
  }

  public async listParticipantsByEvent(eventIds: string[]): Promise<Map<string, ParticipantInfo[]>> {
    const result = new Map<string, ParticipantInfo[]>(eventIds.map((id) => [id, []]));
    if (eventIds.length === 0) return result;
    const rows = await sql()`
      select e.slug, m.legacy_id, m.display_name, m.avatar_url, p.joined_at, p.note, p.ticket_code, p.checked_in_at
      from app.event_participants p join app.events e on e.id = p.event_id join app.members m on m.id = p.member_id
      where e.slug = any(${eventIds}) and p.status = 'joined'
      order by p.joined_at`;
    for (const row of rows) result.get(row.slug)?.push(toParticipant(row));
    return result;
  }

  public async removeParticipantEverywhere(userId: string): Promise<number> {
    const removed = await sql().begin(async (tx) => {
      const rows = await tx`
        delete from app.event_participants p using app.members m
        where p.member_id = m.id and m.legacy_id = ${userId} and p.status = 'joined'
        returning p.event_id`;
      for (const row of rows) await this.releaseSeat(tx, row.event_id);
      return rows.length;
    });
    if (removed) cacheManager.invalidateTags(['events', `member:${userId}`]);
    return removed;
  }

  /* ---------- places ---------- */

  public async findSpots(params?: SpotQueryParams): Promise<PaginatedResult<LifestyleSpotItem>> {
    return cacheManager.getOrSet(
      `spots:${JSON.stringify(params || {})}`,
      async () => paginateArray(filterSpots(await this.loadSpots(), params), params?.page || 1, params?.limit || 12),
      { staleMs: STALE_MS, ttlMs: 60 * 1000, tags: ['spots'] },
    );
  }

  public async findSpotById(id: string): Promise<LifestyleSpotItem | null> {
    return cacheManager.getOrSet(
      `spot:${id}`,
      async () => {
        const listed = cacheManager.get<LifestyleSpotItem[]>('pg:spots')?.find((s) => s.id === id);
        if (listed) return listed;
        const [row] = await sql()`select * from app.places where slug = ${id}`;
        return row ? (rowToPlace(row) as LifestyleSpotItem) : null;
      },
      { staleMs: STALE_MS, ttlMs: 120 * 1000, tags: ['spots', `spot:${id}`] },
    );
  }

  public async createSpot(data: CreateSpotDTO): Promise<LifestyleSpotItem> {
    const [created] = await this.createSpots([data]);
    return created;
  }

  public async createSpots(data: CreateSpotDTO[]): Promise<LifestyleSpotItem[]> {
    if (data.length === 0) return [];
    const created: LifestyleSpotItem[] = data.map((spot, index) => ({
      ...spot,
      id: spot.id || `spot-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
    }));
    await sql().begin((tx) => this.writeSpots(tx, created, PostgresAdapter.leadingKeys(created.map((s) => s.id))));
    cacheManager.invalidateTag('spots');
    return created;
  }

  public async updateSpot(id: string, data: UpdateSpotDTO): Promise<LifestyleSpotItem | null> {
    const updated = await sql().begin(async (tx) => {
      const [row] = await tx`select * from app.places where slug = ${id}`;
      if (!row) return null;
      const next = { ...(rowToPlace(row) as LifestyleSpotItem), ...data };
      await this.writeSpots(tx, [next]);
      return next;
    });
    if (updated) cacheManager.invalidateTags(['spots', `spot:${id}`]);
    return updated;
  }

  public async bulkUpdateSpots(spots: Array<Partial<LifestyleSpotItem> & { id: string }>): Promise<number> {
    if (spots.length === 0) return 0;
    const count = await sql().begin(async (tx) => {
      const rows = await tx`select * from app.places where slug in ${tx(spots.map((s) => s.id))}`;
      const current = new Map(rows.map((row) => [row.slug as string, rowToPlace(row) as LifestyleSpotItem]));
      const next = spots.filter((s) => current.has(s.id)).map((s) => ({ ...current.get(s.id)!, ...s }));
      await this.writeSpots(tx, next);
      return next.length;
    });
    if (count) cacheManager.invalidateTag('spots');
    return count;
  }

  public async deleteSpot(id: string): Promise<boolean> {
    const deleted = await sql()`delete from app.places where slug = ${id}`;
    if (deleted.count) cacheManager.invalidateTags(['spots', `spot:${id}`]);
    return deleted.count > 0;
  }

  /* ---------- challenges ---------- */

  private async writeQuests(tx: Sql, quests: ChallengeQuest[], sortKeys?: Map<string, number>): Promise<void> {
    const existing = quests.length ? await tx`select id, slug, is_sample from app.quests where slug in ${tx(quests.map((q) => q.id))}` : [];
    const known = new Map(existing.map((q) => [q.slug as string, q]));
    await upsert(tx, 'quests', quests.map((q) => questToRow(q, { id: known.get(q.id)?.id, isSample: Boolean(known.get(q.id)?.is_sample), sortKey: sortKeys?.get(q.id) })));
  }

  public async findQuests(params?: QuestQueryParams): Promise<PaginatedResult<ChallengeQuest>> {
    return cacheManager.getOrSet(
      `quests:${JSON.stringify(params || {})}`,
      async () => {
        await this.ensureInitialized();
        // Lifecycle (daysRemaining / ended) is derived from endDate before filtering by status
        const filtered = filterQuests((await this.loadQuests()).map(shownQuest), params);
        return paginateArray(filtered, params?.page || 1, params?.limit || 12);
      },
      { staleMs: STALE_MS, ttlMs: 60 * 1000, tags: ['quests'] },
    );
  }

  public async findQuestById(id: string): Promise<ChallengeQuest | null> {
    return cacheManager.getOrSet(
      `quest:${id}`,
      async () => {
        await this.ensureInitialized();
        const listed = cacheManager.get<ChallengeQuest[]>('pg:quests')?.find((q) => q.id === id);
        if (listed) return shownQuest(listed);
        const [row] = await sql()`select * from app.quests where slug = ${id}`;
        return row ? shownQuest(rowToQuest(row) as ChallengeQuest) : null;
      },
      { staleMs: STALE_MS, ttlMs: 120 * 1000, tags: ['quests', `quest:${id}`] },
    );
  }

  public async createQuest(data: CreateQuestDTO): Promise<ChallengeQuest> {
    await this.ensureInitialized();
    const quest: ChallengeQuest = { ...data, id: data.id || `quest-${Date.now()}` };
    await sql().begin((tx) => this.writeQuests(tx, [quest], PostgresAdapter.leadingKeys([quest.id])));
    cacheManager.invalidateTag('quests');
    return applyQuestLifecycle(quest);
  }

  public async updateQuest(id: string, data: UpdateQuestDTO): Promise<ChallengeQuest | null> {
    await this.ensureInitialized();
    const updated = await sql().begin(async (tx) => {
      const [row] = await tx`select * from app.quests where slug = ${id}`;
      if (!row) return null;
      // daysRemaining is always computed, never stored
      const { daysRemaining: _computed, ...next } = { ...(rowToQuest(row) as ChallengeQuest), ...data };
      void _computed;
      await this.writeQuests(tx, [next]);
      return next;
    });
    if (!updated) return null;
    cacheManager.invalidateTags(['quests', `quest:${id}`]);
    return applyQuestLifecycle(updated);
  }

  public async deleteQuest(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const deleted = await sql()`delete from app.quests where slug = ${id}`;
    if (deleted.count) cacheManager.invalidateTags(['quests', `quest:${id}`]);
    return deleted.count > 0;
  }
}
