import type { LifestyleSpotItem } from '@/data/spotsData';
import { db } from './db';
import { curateCatalog, type CurationTier } from './spotCuration';

async function allSpots(): Promise<LifestyleSpotItem[]> {
  const first = await db.findSpots({ page: 1, limit: 100, includeDrafts: true });
  const spots = [...first.items];
  for (let page = 2; page <= first.totalPages; page += 1) spots.push(...(await db.findSpots({ page, limit: 100, includeDrafts: true })).items);
  return spots;
}

/** Scores and tiers every published place again; run after imports and from the admin console. Overrides are kept. */
export async function recomputeCuration(): Promise<{ total: number; featured: number; hidden: number }> {
  const published = (await allSpots()).filter((spot) => spot.publicationStatus !== 'draft');
  const rows = curateCatalog(published);
  await db.bulkUpdateSpots(rows.map((row) => ({ id: row.id, curation: row.curation })));
  const tierOf = (row: (typeof rows)[number]) => row.curation.override ?? row.curation.tier;
  return { total: rows.length, featured: rows.filter((r) => tierOf(r) === 'featured').length, hidden: rows.filter((r) => tierOf(r) === 'hidden').length };
}

/** Staff's own tier for a place (null clears it, so the computed tier applies again) */
export async function setCurationOverride(spot: LifestyleSpotItem, tier: CurationTier | null, note: string, by: string | undefined) {
  const base = spot.curation ?? { score: 0, tier: 'standard' as const, reasons: [], computedAt: new Date().toISOString() };
  const curation = tier
    ? { ...base, override: tier, overrideNote: note || undefined, overrideBy: by, overrideAt: new Date().toISOString() }
    : { score: base.score, tier: base.tier, reasons: base.reasons, computedAt: base.computedAt };
  return db.updateSpot(spot.id, { curation });
}
