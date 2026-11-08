import type { Sql } from './db/postgres/client';
import { tableVersions } from './db/postgres/tableVersions';
import type {
  CategoryCollection, MasterCategory, MasterCollection, MasterData, MasterEntry, MasterFeaturedGroup, MasterProvince, MasterVenue, MasterZone,
} from './masterData';

/**
 * Master data in its own tables (migration 0034): provinces, zones, categories, venues, venue_groups, community_clubs.
 * Each admin save writes only the rows it changed, so two staff editing at once do not overwrite each other.
 */

type Row = Record<string, unknown>;

const PILLARS: Record<CategoryCollection, string> = {
  spotVibes: 'place', communityMoods: 'mood', communityCategories: 'community', fairCategories: 'fair', questCategories: 'quest',
};
const COLLECTION_OF_PILLAR = Object.fromEntries(Object.entries(PILLARS).map(([collection, pillar]) => [pillar, collection])) as Record<string, CategoryCollection>;
const TABLES = ['provinces', 'zones', 'categories', 'venues', 'venue_groups', 'community_clubs'] as const;

/** Changes when any master row is added, edited or removed (migration 0035: a version number per table) */
export function masterTablesVersion(db: Sql): Promise<string> {
  return tableVersions(db, TABLES);
}

const base = (row: Row) => ({
  id: row.code as string,
  active: row.active as boolean,
  sortOrder: row.sort_order as number,
  builtIn: row.built_in as boolean,
  updatedAt: (row.updated_at as Date).toISOString(),
});
const opt = (value: unknown) => (value === null || value === undefined || value === '' ? undefined : (value as string));

export async function readMasterTables(db: Sql): Promise<Partial<MasterData>> {
  const [provinces, zones, categories, venues, venueGroups, clubs] = await Promise.all([
    db`select * from app.provinces`,
    db`select * from app.zones`,
    db`select * from app.categories`,
    db`select * from app.venues`,
    db`select * from app.venue_groups`,
    db`select * from app.community_clubs`,
  ]);
  const data: Partial<MasterData> = {
    provinces: provinces.map((r): MasterProvince => ({
      ...base(r), displayName: r.display_name, nameEn: r.name_en, region: r.region, tagline: r.tagline, description: r.description,
      image: opt(r.image_url), imageCredit: opt(r.image_credit), featured: r.featured,
    })),
    zones: zones.map((r): MasterZone => ({ ...base(r), name: r.name, province: r.province_code })),
    venues: venues.map((r): MasterVenue => ({
      ...base(r), name: r.name, venueTag: r.venue_tag, province: r.province_code ?? '', location: r.location, transitHint: r.transit_hint,
      latitude: r.latitude ?? undefined, longitude: r.longitude ?? undefined, website: opt(r.website), image: opt(r.image_url), imageCredit: opt(r.image_credit),
    })),
    venueGroups: venueGroups.map(groupOf),
    communityClubs: clubs.map(groupOf),
  };
  for (const collection of Object.values(COLLECTION_OF_PILLAR)) data[collection] = [];
  for (const r of categories) {
    const collection = COLLECTION_OF_PILLAR[r.pillar];
    if (!collection) continue;
    data[collection]!.push({
      ...base(r), name: r.name, nameEn: r.name_en, description: r.description, keywords: r.keywords ?? [], image: opt(r.image_url),
      iconKey: r.icon_key ?? 'Sparkles', colorKey: r.color_key ?? 'slate', ...(r.parent_code && { parentId: r.parent_code }),
    } as MasterCategory);
  }
  return data;
}

function groupOf(r: Row): MasterFeaturedGroup {
  return {
    ...base(r), name: r.name as string, nameEn: r.name_en as string, subtitle: r.subtitle as string, image: opt(r.image_url),
    badgeLabel: opt(r.badge_label), keywords: (r.keywords as string[]) ?? [],
  };
}

const ref = (entry: MasterEntry) => ({ code: entry.id, active: entry.active, sort_order: entry.sortOrder, built_in: entry.builtIn });

/** Inserts or updates these entries (a built-in entry never stored before is inserted on its first edit) */
export async function writeMasterEntries(db: Sql, collection: MasterCollection, entries: MasterEntry[]): Promise<void> {
  if (entries.length === 0) return;
  if (collection === 'provinces') {
    const rows = (entries as MasterProvince[]).map((e) => ({
      ...ref(e), display_name: e.displayName, name_en: e.nameEn, region: e.region, tagline: e.tagline, description: e.description,
      image_url: e.image ?? null, image_credit: e.imageCredit ?? null, featured: e.featured,
    }));
    await upsert(db, 'provinces', ['code'], rows);
  } else if (collection === 'zones') {
    await upsert(db, 'zones', ['code'], (entries as MasterZone[]).map((e) => ({ ...ref(e), name: e.name, province_code: e.province })));
  } else if (collection === 'venues') {
    const rows = (entries as MasterVenue[]).map((e) => ({
      ...ref(e), name: e.name, venue_tag: e.venueTag, province_code: e.province || null, location: e.location, transit_hint: e.transitHint,
      latitude: e.latitude ?? null, longitude: e.longitude ?? null, website: e.website ?? null, image_url: e.image ?? null, image_credit: e.imageCredit ?? null,
    }));
    await upsert(db, 'venues', ['code'], rows);
  } else if (collection === 'venueGroups' || collection === 'communityClubs') {
    const rows = (entries as MasterFeaturedGroup[]).map((e) => ({
      ...ref(e), name: e.name, name_en: e.nameEn, subtitle: e.subtitle, image_url: e.image ?? null, badge_label: e.badgeLabel ?? null, keywords: e.keywords,
    }));
    await upsert(db, collection === 'venueGroups' ? 'venue_groups' : 'community_clubs', ['code'], rows);
  } else {
    const rows = (entries as MasterCategory[]).map((e) => ({
      ...ref(e), pillar: PILLARS[collection], name: e.name, name_en: e.nameEn, description: e.description, keywords: e.keywords,
      icon_key: e.iconKey, color_key: e.colorKey, image_url: e.image ?? null, parent_code: e.parentId ?? null,
    }));
    await upsert(db, 'categories', ['pillar', 'code'], rows);
  }
}

/** Adds a new entry only if its id is still free; false means someone else took the id first */
export async function insertMasterEntry(db: Sql, collection: MasterCollection, entry: MasterEntry): Promise<boolean> {
  const table = tableOf(collection);
  const where = table === 'categories' ? db`pillar = ${PILLARS[collection as CategoryCollection]} and code = ${entry.id}` : db`code = ${entry.id}`;
  const [taken] = await db`select 1 from ${db(`app.${table}`)} where ${where}`;
  if (taken) return false;
  await writeMasterEntries(db, collection, [entry]);
  return true;
}

export async function deleteMasterRow(db: Sql, collection: MasterCollection, id: string): Promise<void> {
  const table = tableOf(collection);
  if (table === 'categories') await db`delete from app.categories where pillar = ${PILLARS[collection as CategoryCollection]} and code = ${id}`;
  else await db`delete from ${db(`app.${table}`)} where code = ${id}`;
}

function tableOf(collection: MasterCollection) {
  if (collection === 'venueGroups') return 'venue_groups';
  if (collection === 'communityClubs') return 'community_clubs';
  if (collection === 'provinces' || collection === 'zones' || collection === 'venues') return collection;
  return 'categories';
}

async function upsert(db: Sql, table: string, key: string[], rows: Row[]) {
  const columns = Object.keys(rows[0]);
  const updates = columns.filter((column) => !key.includes(column));
  await db`
    insert into ${db(`app.${table}`)} ${db(rows as never, columns)}
    on conflict (${db.unsafe(key.join(", "))}) do update set ${db.unsafe(updates.map((column) => `${column} = excluded.${column}`).join(', '))}`;
}
