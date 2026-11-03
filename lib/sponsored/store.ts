import { randomUUID } from 'node:crypto';
import { bangkokToday } from '../campaigns/types';
import { cacheManager } from '../cache';
import { USE_POSTGRES, sql } from '../db/postgres/client';
import { createJsonStore } from '../social/jsonStore';
import { SPONSOR_PILLARS, type SponsorPillar, type SponsoredSlot, isSlotLive } from './types';

/** Sponsored cards (app.sponsored_slots, or data/sponsored.json without a database), set by staff in the admin console */
const CACHE_KEY = 'sponsored:all';
// Read on every list page; another server sees a staff change within this time
const CACHE_MS = 60 * 1000;

interface SponsoredStore {
  all(): Promise<SponsoredSlot[]>;
  save(slot: SponsoredSlot): Promise<void>;
  remove(id: string): Promise<void>;
}

function jsonSponsored(): SponsoredStore {
  const store = createJsonStore<SponsoredSlot>('sponsored');
  return {
    async all() {
      return store.read();
    },
    async save(slot) {
      await store.update((items) => [...items.filter((item) => item.id !== slot.id), slot]);
    },
    async remove(id) {
      await store.update((items) => items.filter((item) => item.id !== id));
    },
  };
}

function pgSponsored(): SponsoredStore {
  return {
    async all() {
      const rows = await sql()`select id, pillar, item_id, sponsor, note, starts_on::text, ends_on::text, published, created_at, updated_at from app.sponsored_slots`;
      return rows.map((r) => ({
        id: r.id,
        pillar: r.pillar,
        itemId: r.item_id,
        sponsor: r.sponsor,
        note: r.note ?? undefined,
        startDate: r.starts_on,
        endDate: r.ends_on,
        published: r.published,
        createdAt: new Date(r.created_at).toISOString(),
        updatedAt: new Date(r.updated_at).toISOString(),
      }));
    },
    async save(s) {
      const db = sql();
      const fields = { pillar: s.pillar, item_id: s.itemId, sponsor: s.sponsor, note: s.note ?? null, starts_on: s.startDate, ends_on: s.endDate, published: s.published, updated_at: s.updatedAt };
      await db`insert into app.sponsored_slots ${db({ id: s.id, created_at: s.createdAt, ...fields })} on conflict (id) do update set ${db(fields)}`;
    },
    async remove(id) {
      await sql()`delete from app.sponsored_slots where id = ${id}`;
    },
  };
}

const store: SponsoredStore = USE_POSTGRES ? pgSponsored() : jsonSponsored();

export const listSponsoredSlots = async (): Promise<SponsoredSlot[]> =>
  [...(await cacheManager.getOrSet(CACHE_KEY, () => store.all(), { ttlMs: CACHE_MS, tags: [CACHE_KEY] }))].sort((a, b) => b.startDate.localeCompare(a.startDate));

/** The item a list page shows in its sponsored slot today: published, inside its dates, the latest start wins */
export async function liveSponsoredId(pillar: SponsorPillar): Promise<string | null> {
  const today = bangkokToday();
  return (await listSponsoredSlots()).find((slot) => slot.pillar === pillar && isSlotLive(slot, today))?.itemId ?? null;
}

export class SponsoredError extends Error {}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const text = (value: unknown, max: number) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** Checks a slot from the admin form and saves it; `knownIds` are the items the pillar can show */
export async function saveSponsoredSlot(input: Record<string, unknown>, knownIds: (pillar: SponsorPillar) => Promise<Set<string>>): Promise<SponsoredSlot> {
  const pillar = text(input.pillar, 20) as SponsorPillar;
  if (!SPONSOR_PILLARS.includes(pillar)) throw new SponsoredError('เลือกหน้าที่จะแสดง');
  const itemId = text(input.itemId, 200);
  if (!itemId || !(await knownIds(pillar)).has(itemId)) throw new SponsoredError('ไม่พบรายการนี้บนหน้านั้น เลือกจากรายการที่ค้นเจอ');
  const sponsor = text(input.sponsor, 80);
  if (sponsor.length < 2) throw new SponsoredError('ระบุชื่อผู้สนับสนุน');
  const startDate = text(input.startDate, 10);
  const endDate = text(input.endDate, 10);
  if (!ISO_DATE.test(startDate) || !ISO_DATE.test(endDate)) throw new SponsoredError('ระบุวันเริ่มและวันจบ');
  if (endDate < startDate) throw new SponsoredError('วันจบต้องไม่ก่อนวันเริ่ม');

  const now = new Date().toISOString();
  const id = text(input.id, 60);
  const existing = id ? (await listSponsoredSlots()).find((slot) => slot.id === id) : undefined;
  const slot: SponsoredSlot = {
    id: existing?.id ?? `sponsored-${randomUUID().slice(0, 8)}`,
    pillar,
    itemId,
    sponsor,
    note: text(input.note, 200) || undefined,
    startDate,
    endDate,
    published: input.published === true,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await store.save(slot);
  cacheManager.invalidateTags([CACHE_KEY]);
  return slot;
}

export async function deleteSponsoredSlot(id: string): Promise<SponsoredSlot | null> {
  const slot = (await listSponsoredSlots()).find((item) => item.id === id) ?? null;
  await store.remove(id);
  cacheManager.invalidateTags([CACHE_KEY]);
  return slot;
}
