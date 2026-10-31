import { randomUUID } from 'node:crypto';
import { bangkokToday } from '../campaigns/types';
import { createJsonStore } from '../social/jsonStore';
import { SPONSOR_PILLARS, type SponsorPillar, type SponsoredSlot, isSlotLive } from './types';

/** Sponsored cards (data/sponsored.json), set by staff in the admin console */
const store = createJsonStore<SponsoredSlot>('sponsored');

export const listSponsoredSlots = (): SponsoredSlot[] => [...store.read()].sort((a, b) => b.startDate.localeCompare(a.startDate));

/** The item a list page shows in its sponsored slot today: published, inside its dates, the latest start wins */
export function liveSponsoredId(pillar: SponsorPillar): string | null {
  const today = bangkokToday();
  return listSponsoredSlots().find((slot) => slot.pillar === pillar && isSlotLive(slot, today))?.itemId ?? null;
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
  const existing = id ? store.read().find((slot) => slot.id === id) : undefined;
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
  await store.update((items) => [...items.filter((item) => item.id !== slot.id), slot]);
  return slot;
}

export async function deleteSponsoredSlot(id: string): Promise<SponsoredSlot | null> {
  const slot = store.read().find((item) => item.id === id) ?? null;
  await store.update((items) => items.filter((item) => item.id !== id));
  return slot;
}
