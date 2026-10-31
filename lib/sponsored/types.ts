/**
 * Sponsored cards (owner 2026-10-31): a venue, studio or organiser pays for one of their own ตี้, อีเวนต์, places or
 * challenges to sit in a set slot of its list page, labelled "สนับสนุน". One card per page; the card is the item's own
 * tile, so a member can still open and join it. Client-safe: the store is lib/sponsored/store.ts.
 */
export const SPONSOR_PILLARS = ['community', 'events', 'spots', 'challenges'] as const;
export type SponsorPillar = (typeof SPONSOR_PILLARS)[number];

export const SPONSOR_PILLAR_LABELS: Record<SponsorPillar, string> = {
  community: 'ตี้',
  events: 'อีเวนต์',
  spots: 'ที่เที่ยว',
  challenges: 'ชาเลนจ์',
};

export type SponsoredSlot = {
  id: string;
  pillar: SponsorPillar;
  /** The ตี้, อีเวนต์, place or challenge shown */
  itemId: string;
  /** Who pays (staff only, never on the page) */
  sponsor: string;
  note?: string;
  /** Bangkok days, inclusive */
  startDate: string;
  endDate: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

/** The third card in the grid: in view on the first screen on every width, without taking the first look */
export const SPONSORED_POSITION = 2;

export const isSlotLive = (slot: SponsoredSlot, today: string) => slot.published && slot.startDate <= today && today <= slot.endDate;

/** Moves the sponsored item to its slot, once; a list without it (filtered out, or none sold) stays as it is */
export function withSponsored<T extends { id: string }>(items: T[], sponsored: T | null | undefined): T[] {
  if (!sponsored) return items;
  const rest = items.filter((item) => item.id !== sponsored.id);
  return [...rest.slice(0, SPONSORED_POSITION), sponsored, ...rest.slice(SPONSORED_POSITION)];
}
