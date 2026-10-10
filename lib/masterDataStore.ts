import fs from 'fs';
import os from 'os';
import path from 'path';
import { IS_SERVERLESS } from './db/databaseFile';
import {
  buildSeedMasterData, CATEGORY_COLLECTIONS, COLOR_KEYS, FEATURED_GROUP_COLLECTIONS, FIXED_COLLECTIONS, ICON_OPTIONS,
  MasterCategory, MasterCollection, MasterData, MasterEntry, MasterFeaturedGroup, MasterProvince, MasterVenue,
  MasterZone, REGIONS, slugifyId, VENUE_TAGS,
} from './masterData';
import { MASTER_77_PROVINCES } from '@/data/masterHub';

/**
 * Server-side store for admin-editable master data.
 * data/master_data.json is committed (like discovery_content.json) so edits reach the deploy through a snapshot.
 * On serverless hosts writes go to /tmp and are lost on the next deploy.
 */
const BUNDLED_FILE = path.join(process.cwd(), 'data', 'master_data.json');
const WRITE_FILE = IS_SERVERLESS ? path.join(os.tmpdir(), 'master_data.json') : BUNDLED_FILE;

const globalForMaster = globalThis as unknown as { _cchMasterData?: MasterData };

// Built-in entries added to code later are merged in; stored edits win for entries that exist
function withSeedDefaults(stored: Partial<MasterData>): MasterData {
  const seed = buildSeedMasterData();
  const merged = { ...seed, ...stored, version: 1 as const, updatedAt: stored.updatedAt ?? seed.updatedAt } as MasterData;
  for (const key of Object.keys(seed) as Array<keyof MasterData>) {
    if (!Array.isArray(seed[key])) continue;
    const storedList = (Array.isArray(stored[key]) ? stored[key] : []) as MasterEntry[];
    const ids = new Set(storedList.map((entry) => entry.id));
    const missing = (seed[key] as MasterEntry[]).filter((entry) => !ids.has(entry.id));
    (merged as unknown as Record<string, MasterEntry[]>)[key] = [...storedList, ...missing];
  }
  return merged;
}

function readFile(file: string): Partial<MasterData> | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

export function getMasterData(): MasterData {
  if (globalForMaster._cchMasterData) return globalForMaster._cchMasterData;
  const stored = (IS_SERVERLESS ? readFile(WRITE_FILE) : null) ?? readFile(BUNDLED_FILE);
  const data = withSeedDefaults(stored ?? {});
  globalForMaster._cchMasterData = data;
  if (!stored) save(data); // first run: write the seed so the file can be committed
  return data;
}

function save(data: MasterData) {
  data.updatedAt = new Date().toISOString();
  globalForMaster._cchMasterData = data;
  try {
    fs.mkdirSync(path.dirname(WRITE_FILE), { recursive: true });
    fs.writeFileSync(WRITE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('MASTER DATA WRITE FAILED:', error);
  }
}

/** Active entries only, for the public API */
export function getPublicMasterData() {
  const data = getMasterData();
  const active = <T extends { active: boolean; sortOrder: number }>(list: T[]) =>
    list.filter((entry) => entry.active).sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    updatedAt: data.updatedAt,
    spotVibes: active(data.spotVibes),
    communityMoods: active(data.communityMoods),
    communityCategories: active(data.communityCategories),
    fairCategories: active(data.fairCategories),
    questCategories: active(data.questCategories),
    venues: active(data.venues),
    provinces: active(data.provinces),
    zones: active(data.zones),
    communityClubs: active(data.communityClubs),
    venueGroups: active(data.venueGroups),
  };
}

// ── Validation ──

const str = (value: unknown, max = 300) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const emoji = /\p{Extended_Pictographic}/u;
const imageUrl = (value: unknown) => {
  const url = str(value, 1000);
  if (!url) return undefined;
  if (!/^https:\/\//.test(url) && !url.startsWith('/')) throw new Error('URL รูปภาพต้องขึ้นต้นด้วย https:// หรือ /');
  return url;
};
const requireName = (name: string, label = 'ชื่อ') => {
  if (name.length < 2) throw new Error(`${label}ต้องมีอย่างน้อย 2 ตัวอักษร`);
  if (emoji.test(name)) throw new Error(`${label}ห้ามมี emoji`);
};

function cleanCategory(input: Record<string, unknown>, collection: MasterCollection): Omit<MasterCategory, 'id' | 'active' | 'sortOrder' | 'builtIn'> {
  const name = str(input.name, 80);
  requireName(name);
  const keywords = (Array.isArray(input.keywords) ? input.keywords : String(input.keywords ?? '').split(/[\n,]/))
    .map((keyword) => str(keyword, 40)).filter(Boolean).slice(0, 60);
  const iconKey = str(input.iconKey, 40);
  const colorKey = str(input.colorKey, 20);
  if (!(iconKey in ICON_OPTIONS)) throw new Error('ไอคอนไม่ถูกต้อง');
  if (!COLOR_KEYS.includes(colorKey as never)) throw new Error('สีไม่ถูกต้อง');
  const parentId = collection === 'communityCategories' ? str(input.parentId, 20) : undefined;
  if (collection === 'communityCategories' && !['chill', 'move', 'heal', 'learn'].includes(parentId ?? '')) throw new Error('กรุณาเลือกอารมณ์หลัก');
  return {
    name,
    nameEn: str(input.nameEn, 80),
    description: str(input.description, 300),
    keywords,
    image: imageUrl(input.image),
    iconKey,
    colorKey: colorKey as MasterCategory['colorKey'],
    ...(parentId && { parentId }),
  };
}

function cleanVenue(input: Record<string, unknown>): Omit<MasterVenue, 'id' | 'active' | 'sortOrder' | 'builtIn'> {
  const name = str(input.name, 120);
  requireName(name, 'ชื่อสถานที่');
  const venueTag = str(input.venueTag, 20);
  if (!VENUE_TAGS.includes(venueTag as never)) throw new Error('ประเภทสถานที่ไม่ถูกต้อง');
  const province = str(input.province, 40);
  if (!MASTER_77_PROVINCES.includes(province)) throw new Error('กรุณาเลือกจังหวัด');
  const latitude = input.latitude === '' || input.latitude === undefined ? undefined : Number(input.latitude);
  const longitude = input.longitude === '' || input.longitude === undefined ? undefined : Number(input.longitude);
  if ((latitude !== undefined || longitude !== undefined) && !(Number.isFinite(latitude) && Number.isFinite(longitude))) throw new Error('พิกัดไม่ถูกต้อง');
  const website = str(input.website, 300);
  if (website && !/^https:\/\//.test(website)) throw new Error('เว็บไซต์ต้องขึ้นต้นด้วย https://');
  return {
    name,
    venueTag: venueTag as MasterVenue['venueTag'],
    province,
    location: str(input.location, 200),
    transitHint: str(input.transitHint, 200),
    latitude,
    longitude,
    website: website || undefined,
    image: imageUrl(input.image),
  };
}

function cleanProvince(input: Record<string, unknown>): Omit<MasterProvince, 'id' | 'active' | 'sortOrder' | 'builtIn'> {
  const displayName = str(input.displayName, 80);
  requireName(displayName, 'ชื่อที่แสดง');
  const region = str(input.region, 40);
  if (!REGIONS.includes(region as never)) throw new Error('ภาคไม่ถูกต้อง');
  return {
    displayName,
    nameEn: str(input.nameEn, 80),
    region: region as MasterProvince['region'],
    tagline: str(input.tagline, 120),
    description: str(input.description, 600),
    image: imageUrl(input.image),
    featured: input.featured === true,
  };
}

function cleanZone(input: Record<string, unknown>): Omit<MasterZone, 'id' | 'active' | 'sortOrder' | 'builtIn'> {
  const name = str(input.name, 80);
  requireName(name, 'ชื่อโซน');
  const province = str(input.province, 40);
  if (!MASTER_77_PROVINCES.includes(province)) throw new Error('กรุณาเลือกจังหวัด');
  return { name, province };
}

function cleanFeaturedGroup(input: Record<string, unknown>): Omit<MasterFeaturedGroup, 'id' | 'active' | 'sortOrder' | 'builtIn'> {
  const name = str(input.name, 80);
  requireName(name);
  const keywords = (Array.isArray(input.keywords) ? input.keywords : String(input.keywords ?? '').split(/[\n,]/))
    .map((keyword) => str(keyword, 40)).filter(Boolean).slice(0, 60);
  if (keywords.length === 0) throw new Error('ต้องมีคำค้นอย่างน้อย 1 คำ (ใช้กรองเนื้อหาเมื่อกดการ์ด)');
  const badgeLabel = str(input.badgeLabel, 40);
  if (emoji.test(badgeLabel)) throw new Error('ป้ายห้ามมี emoji');
  return {
    name,
    nameEn: str(input.nameEn, 80),
    subtitle: str(input.subtitle, 120),
    image: imageUrl(input.image),
    badgeLabel: badgeLabel || undefined,
    keywords,
  };
}

function clean(collection: MasterCollection, input: Record<string, unknown>) {
  if ((CATEGORY_COLLECTIONS as string[]).includes(collection)) return cleanCategory(input, collection);
  if ((FEATURED_GROUP_COLLECTIONS as readonly string[]).includes(collection)) return cleanFeaturedGroup(input);
  if (collection === 'venues') return cleanVenue(input);
  if (collection === 'provinces') return cleanProvince(input);
  return cleanZone(input);
}

// ── Mutations (each returns the saved entry) ──

const listOf = (data: MasterData, collection: MasterCollection) => data[collection] as MasterEntry[];

export function saveMasterEntry(collection: MasterCollection, input: Record<string, unknown>): { entry: MasterEntry; created: boolean } {
  const data = structuredClone(getMasterData());
  const list = listOf(data, collection);
  const id = str(input.id, 80);
  const existing = id ? list.find((entry) => entry.id === id) : undefined;
  const fields = clean(collection, input);
  const now = new Date().toISOString();

  if (existing) {
    const updated = { ...existing, ...fields, updatedAt: now } as MasterEntry;
    list.splice(list.indexOf(existing), 1, updated);
    save(data);
    return { entry: updated, created: false };
  }
  if (FIXED_COLLECTIONS.includes(collection)) throw new Error('รายการชุดนี้เพิ่มไม่ได้ แก้ไขได้อย่างเดียว');
  const baseId = slugifyId(str(input.nameEn, 80) || str(input.name, 80));
  let newId = baseId;
  for (let n = 2; list.some((entry) => entry.id === newId); n += 1) newId = `${baseId}_${n}`;
  const entry = {
    ...fields,
    id: newId,
    active: true,
    builtIn: false,
    sortOrder: Math.max(-1, ...list.map((e) => e.sortOrder)) + 1,
    updatedAt: now,
  } as MasterEntry;
  list.push(entry);
  save(data);
  return { entry, created: true };
}

export function setMasterEntryActive(collection: MasterCollection, id: string, active: boolean): MasterEntry {
  const data = structuredClone(getMasterData());
  const list = listOf(data, collection);
  const entry = list.find((e) => e.id === id);
  if (!entry) throw new Error('ไม่พบรายการ');
  if (!active && collection === 'spotVibes' && list.filter((e) => e.active).length <= 1) throw new Error('ต้องมี vibe ที่ใช้งานอย่างน้อย 1 รายการ');
  entry.active = active;
  entry.updatedAt = new Date().toISOString();
  save(data);
  return entry;
}

export function deleteMasterEntry(collection: MasterCollection, id: string): MasterEntry {
  const data = structuredClone(getMasterData());
  const list = listOf(data, collection);
  const entry = list.find((e) => e.id === id);
  if (!entry) throw new Error('ไม่พบรายการ');
  if (entry.builtIn || FIXED_COLLECTIONS.includes(collection)) throw new Error('รายการที่มากับระบบลบไม่ได้ ใช้ปิดใช้งานแทน');
  list.splice(list.indexOf(entry), 1);
  save(data);
  return entry;
}

export function reorderMasterEntries(collection: MasterCollection, ids: string[]) {
  const data = structuredClone(getMasterData());
  const list = listOf(data, collection);
  const position = new Map(ids.map((id, index) => [id, index]));
  for (const entry of list) {
    if (position.has(entry.id)) entry.sortOrder = position.get(entry.id)!;
  }
  save(data);
}

export function isMasterCollection(value: unknown): value is MasterCollection {
  return typeof value === 'string' && ['spotVibes', 'communityMoods', 'communityCategories', 'fairCategories', 'questCategories', 'venues', 'provinces', 'zones', 'communityClubs', 'venueGroups'].includes(value);
}
