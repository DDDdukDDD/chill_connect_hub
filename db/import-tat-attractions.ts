/**
 * TAT attractions into the DEV database (docs/TAT_IMPORT.md, owner 2026-11-18).
 *
 *   npx tsx --env-file=.env.development.local db/import-tat-attractions.ts [--dry] [--limit=N] [--budget=N] [--skip-province=<TAT name>,…]
 *
 * - Refuses any database but dev. Live gets places by a separate, owner-approved step (pictures copied to R2 first).
 * - New places come in as drafts for staff approval, credited to TAT.
 * - A place we already have (the same TAT record, the same name in the same province, within 60 m, or within 250 m
 *   with an overlapping name) is not added again. When TAT knows more about it (owner 2026-11-18: "ถ้าที่ซ้ำกันแต่
 *   ข้อมูลใหม่รู้เยอะกว่าและข้อมูลดีกว่าก็ให้ใช้ข้อมูลใหม่แทน"), what TAT adds is filled in without losing what is
 *   there: see `enrich`. Its status (published or draft) stays.
 * - Every province by default; --skip-province leaves some out.
 * - The list and each detail are cached under data/.tat-cache/ (git-ignored), so a rerun spends no calls on what was
 *   already fetched.
 * - --recategorize: puts the TAT places already imported into the category the current rules give (no calls). The key allows 3,000 calls a day for every clone together; --budget caps this run (default 1,800).
 */
import fs from 'node:fs';
import path from 'node:path';
import { db } from '@/lib/db';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { BEST_TIME, DEFAULT_LABELS } from '@/lib/scrapers/tourismDirectory';
import { placeMatcher } from '@/lib/scrapers/placeMatch';
import { TAT_SOURCE_NAME, TatBudget, tatCategory, listHasTextAndPicture, listTatAttractions, tatDetail, tatSourceUrl, tatToSpot, type TatDetail, type TatListPlace } from '@/lib/scrapers/tatDataApi';

const DEV_REF = 'womkobbjdlzefyrxspxh';
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const dryRun = process.argv.includes('--dry');
const limit = Number(arg('limit') ?? Infinity);
const budget = new TatBudget(Number(arg('budget') || 1800));
const skipProvinces = new Set((arg('skip-province') || '').split(',').map((p) => p.trim()).filter(Boolean));
const CACHE = path.join(process.cwd(), 'data', '.tat-cache');
const TAT_IMAGE = /^https:\/\/dmc\.tatdataapi\.io\//;
const STOCK_IMAGE = /unsplash|placeholder|picsum|\/images\/onboarding\//i;
const UNKNOWN = /ไม่ระบุ/;

const plainLength = (text?: string) => (text || '').replace(/<[^>]+>/g, '').trim().length;
const isTatRecord = (spot: LifestyleSpotItem) => spot.id.startsWith('tat-') || Boolean(spot.sourceUrl?.startsWith('https://tatdataapi.io/'));

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return null;
  }
}

async function allSpots(): Promise<LifestyleSpotItem[]> {
  const first = await db.findSpots({ page: 1, limit: 100, includeDrafts: true });
  const spots = [...first.items];
  for (let page = 2; page <= first.totalPages; page += 1) spots.push(...(await db.findSpots({ page, limit: 100, includeDrafts: true })).items);
  return spots;
}

/**
 * What TAT adds to a place we already have, or null when it adds nothing. Nothing good is thrown away:
 * - pictures: a real cover stays the cover and TAT's pictures follow it (up to 8); a stock or missing cover is replaced
 * - description: only a short one (under 120 characters) is replaced, by a TAT text at least twice as long
 * - opening hours, price and entry fee: only when ours says "ไม่ระบุ" or is empty
 * - facilities and contact: only when ours has none
 * Anything taken from TAT adds TAT to the credit.
 */
function enrich(current: LifestyleSpotItem, tat: LifestyleSpotItem): Partial<LifestyleSpotItem> | null {
  const patch: Partial<LifestyleSpotItem> = {};
  const gallery = current.galleryImages?.length ? current.galleryImages : current.image ? [current.image] : [];
  const coverIsReal = Boolean(current.image) && !STOCK_IMAGE.test(current.image);
  const tatImages = (tat.galleryImages ?? [tat.image]).filter((url) => !gallery.includes(url));
  if (!coverIsReal) {
    patch.image = tat.image;
    patch.galleryImages = [...new Set([...(tat.galleryImages ?? [tat.image]), ...gallery.filter((url) => !STOCK_IMAGE.test(url))])].slice(0, 8);
  } else if (gallery.length < 4 && tatImages.length > 0) {
    patch.galleryImages = [...gallery, ...tatImages].slice(0, 8);
  }
  if (plainLength(current.description) < 120 && plainLength(tat.description) >= Math.max(2 * plainLength(current.description), 80)) patch.description = tat.description;
  if ((!current.openHours || UNKNOWN.test(current.openHours)) && !UNKNOWN.test(tat.openHours)) patch.openHours = tat.openHours;
  if ((!current.price || UNKNOWN.test(current.price)) && !UNKNOWN.test(tat.price)) {
    patch.price = tat.price;
    if (tat.entryFee && !current.entryFee) patch.entryFee = tat.entryFee;
  }
  if (!current.facilities?.length && tat.facilities.length) patch.facilities = tat.facilities;
  if (!current.contact?.phone && !current.contact?.website && !current.contact?.facebook && tat.contact) patch.contact = tat.contact;

  // Pictures or text from TAT already there (another importer put them in) also need the credit
  const usesTat = Object.keys(patch).length > 0 || gallery.some((url) => TAT_IMAGE.test(url));
  if (!usesTat) return null;
  if (!current.sourceName) {
    patch.sourceName = TAT_SOURCE_NAME;
    if (!current.sourceUrl) patch.sourceUrl = tat.sourceUrl;
  } else if (!/การท่องเที่ยวแห่งประเทศไทย/.test(current.sourceName)) {
    // The place page shows the name before any bracket, so the credit goes in front of it
    patch.sourceName = `${current.sourceName.replace(/\s*\(.*\)\s*$/, '')} · การท่องเที่ยวแห่งประเทศไทย`;
  }
  return Object.keys(patch).length ? patch : null;
}

async function main() {
  const url = process.env.DATABASE_URL || '';
  if (!url.includes(DEV_REF)) throw new Error('refusing: DATABASE_URL is not the dev database');
  fs.mkdirSync(path.join(CACHE, 'detail'), { recursive: true });

  const existing = await allSpots();
  // Every place as it was, before anything is written: an enrichment that turns out wrong can be put back from here
  if (!dryRun) fs.writeFileSync(path.join(CACHE, `places-before-${new Date().toISOString().replace(/[:.]/g, '-')}.json`), JSON.stringify(existing));
  const matcher = placeMatcher(existing);
  const matchOf = matcher.match;

  if (process.argv.includes('--recategorize')) {
    let changed = 0;
    for (const spot of existing.filter((s) => s.id.startsWith('tat-'))) {
      const detail = readJson<TatDetail>(path.join(CACHE, 'detail', `${spot.id.slice(4)}.json`));
      if (!detail) continue;
      const category = tatCategory(spot.title, detail, spot.vibeTags);
      if (category === spot.category) continue;
      const label = DEFAULT_LABELS[category];
      const rest = spot.vibeTags.filter((tag) => tag !== spot.categoryLabel && tag !== label);
      if (!dryRun) await db.updateSpot(spot.id, { category, categoryLabel: label, vibeTags: [label, ...rest], bestTime: BEST_TIME[category] || 'ในเวลาทำการ' });
      changed += 1;
      if (changed <= 10) console.log(`  ${spot.title}: ${spot.category} → ${category}`);
    }
    console.log(JSON.stringify({ recategorized: changed, dryRun }));
    process.exit(0);
  }

  // The list, cached for the day
  const listFile = path.join(CACHE, `attractions-${new Date().toISOString().slice(0, 10)}.json`);
  let list = readJson<TatListPlace[]>(listFile);
  if (!list) {
    list = await listTatAttractions(budget);
    fs.writeFileSync(listFile, JSON.stringify(list));
  }

  const counts: Record<string, number> = { listed: list.length, skippedProvince: 0, thin: 0, alreadyFromTat: 0, noDetail: 0, rejected: 0, imported: 0, enriched: 0, nothingToAdd: 0 };
  const work = list.filter((place) => {
    if (skipProvinces.has((place.location?.province?.name || '').trim())) return (counts.skippedProvince += 1, false);
    if (!listHasTextAndPicture(place)) return (counts.thin += 1, false);
    const match = matchOf({ id: `tat-${place.placeId}`, title: place.name || '', province: place.location?.province?.name || '', latitude: Number(place.latitude), longitude: Number(place.longitude), sourceUrl: tatSourceUrl(place.placeId) });
    if (match && isTatRecord(match)) return (counts.alreadyFromTat += 1, false);
    return true;
  });
  // The most viewed first, so a run cut short by the budget keeps the places people look at most
  work.sort((a, b) => (b.viewer ?? 0) - (a.viewer ?? 0));
  console.log(`listed ${list.length}, to look at ${work.length} (calls so far ${budget.used})`);

  const ready: LifestyleSpotItem[] = [];
  const write = async (force = false) => {
    if (dryRun || ready.length === 0 || (!force && ready.length < 100)) return;
    const batch = ready.splice(0, ready.length);
    await db.createSpots(batch);
    counts.imported += batch.length;
    console.log(`  wrote ${batch.length} new (imported ${counts.imported}, enriched ${counts.enriched}, calls ${budget.used})`);
  };
  const samples: string[] = [];

  for (const place of work) {
    if (counts.imported + ready.length + counts.enriched >= limit) break;
    const file = path.join(CACHE, 'detail', `${place.placeId}.json`);
    let detail = readJson<TatDetail>(file);
    if (!detail) {
      try {
        detail = await tatDetail(budget, place.placeId);
        fs.writeFileSync(file, JSON.stringify(detail));
      } catch (error) {
        if (String(error).includes('budget')) {
          console.log('call budget used up: stopping, rerun tomorrow to go on');
          break;
        }
        counts.noDetail += 1;
        continue;
      }
    }
    const spot = tatToSpot(place, detail);
    if (!spot) {
      counts.rejected += 1;
      continue;
    }
    const match = matchOf(spot);
    if (match) {
      if (isTatRecord(match)) {
        counts.alreadyFromTat += 1;
        continue;
      }
      const patch = enrich(match, spot);
      if (!patch) {
        counts.nothingToAdd += 1;
        continue;
      }
      if (samples.length < 12) samples.push(`  enrich ${match.id} ${match.title} ← ${Object.keys(patch).join(', ')}`);
      if (!dryRun) await db.updateSpot(match.id, patch);
      counts.enriched += 1;
      Object.assign(match, patch);
      continue;
    }
    ready.push(spot);
    if (samples.length < 12) samples.push(`  new ${spot.province} · ${spot.category} · ${spot.title} · ${spot.openHours} · ${spot.price} · ${spot.galleryImages?.length} pics`);
    matcher.add(spot);
    await write();
  }
  await write(true);
  if (dryRun) counts.wouldImport = ready.length;
  console.log(samples.join('\n'));
  console.log(JSON.stringify({ ...counts, calls: budget.used }));
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
