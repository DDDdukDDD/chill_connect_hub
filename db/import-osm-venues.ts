/**
 * Cafés, bakeries, bars and galleries from OpenStreetMap into the DEV database (owner 2026-11-19, option 1).
 *
 *   npx tsx --env-file=.env.development.local db/import-osm-venues.ts [--province=กรุงเทพมหานคร] [--dry] [--limit=N]
 *
 * - Refuses any database but dev. Live gets places by a separate, owner-approved step.
 * - Every place comes in as a draft without a photo (id "osmb-…"); it can be published only once a real photo is
 *   added (lib/spotPhotoRule.ts). Chain branches are left out (lib/scrapers/osmVenues.ts).
 * - A place we already have (same OSM record, or within 250 m with an overlapping name) is not added again. Nothing
 *   already there is changed.
 * - Overpass answers are cached for the day under data/.osm-cache/ (git-ignored), so a rerun asks OSM nothing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { db } from '@/lib/db';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { placeMatcher } from '@/lib/scrapers/placeMatch';
import { provinceIsoCode } from '@/lib/scrapers/thaiProvinces';
import { districtLocator, districtQuery, mallLocator, mallQuery, overpass, osmToVenue, venueQuery, type OsmElement } from '@/lib/scrapers/osmVenues';

const DEV_REF = 'womkobbjdlzefyrxspxh';
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const dryRun = process.argv.includes('--dry');
const limit = Number(arg('limit') ?? Infinity);
const province = arg('province') || 'กรุงเทพมหานคร';
const CACHE = path.join(process.cwd(), 'data', '.osm-cache');

async function cached(name: string, query: string): Promise<OsmElement[]> {
  const file = path.join(CACHE, `${name}-${new Date().toISOString().slice(0, 10)}.json`);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as OsmElement[];
  } catch {
    const elements = await overpass(query);
    fs.writeFileSync(file, JSON.stringify(elements));
    return elements;
  }
}

async function allSpots(): Promise<LifestyleSpotItem[]> {
  const first = await db.findSpots({ page: 1, limit: 100, includeDrafts: true });
  const spots = [...first.items];
  for (let page = 2; page <= first.totalPages; page += 1) spots.push(...(await db.findSpots({ page, limit: 100, includeDrafts: true })).items);
  return spots;
}

async function main() {
  if (!(process.env.DATABASE_URL || '').includes(DEV_REF)) throw new Error('refusing: DATABASE_URL is not the dev database');
  const iso = provinceIsoCode(province === 'กรุงเทพมหานคร' ? 'กรุงเทพฯ' : province);
  if (!iso) throw new Error(`Unknown province "${province}"`);
  fs.mkdirSync(CACHE, { recursive: true });

  const elements = await cached(`venues-${iso}`, venueQuery(iso));
  const districtAt = districtLocator(await cached(`districts-${iso}`, districtQuery(iso)));
  const mallAt = mallLocator(await cached(`malls-${iso}`, mallQuery(iso)));
  const existing = await allSpots();
  const matcher = placeMatcher(existing, { nearbyMetres: 0, sameNameInProvince: false });

  const counts: Record<string, number> = { fromOsm: elements.length, skipped: 0, alreadyHave: 0, imported: 0, noDistrict: 0, withHours: 0, withLink: 0 };
  const byCategory: Record<string, number> = {};
  const ready: LifestyleSpotItem[] = [];
  const samples: string[] = [];
  for (const element of elements) {
    if (ready.length >= limit) break;
    const spot = osmToVenue(element, province, districtAt, mallAt);
    if (!spot) {
      counts.skipped += 1;
      continue;
    }
    if (matcher.match(spot)) {
      counts.alreadyHave += 1;
      continue;
    }
    matcher.add(spot);
    ready.push(spot);
    byCategory[spot.category] = (byCategory[spot.category] || 0) + 1;
    if (spot.chainBrand) counts.chainBranches = (counts.chainBranches || 0) + 1;
    if (!spot.district) counts.noDistrict += 1;
    if (!spot.openHours.startsWith('ไม่ระบุ')) counts.withHours += 1;
    if (spot.contact) counts.withLink += 1;
    if (samples.length < 15 && samples.length < ready.length * 0.02 + 1) samples.push(`  ${spot.category} · ${spot.title} · ${spot.district || '-'} · ${spot.openHours} · ${spot.description}`);
  }

  if (!dryRun) {
    for (let index = 0; index < ready.length; index += 100) {
      await db.createSpots(ready.slice(index, index + 100));
      counts.imported += Math.min(100, ready.length - index);
    }
  }
  console.log(samples.join('\n'));
  console.log(JSON.stringify({ province, ...counts, ...(dryRun && { wouldImport: ready.length }), byCategory }));
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
