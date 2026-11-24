// Copies published places from the development database to live (owner 2026-11-23): new places are added, places
// live already has get what dev learned since (TAT details, "ทำไมต้องไป" texts, curation), and drafts stay on dev.
//
//   node db/copy-places-to-live.mjs            list what would change, touch nothing
//   node db/copy-places-to-live.mjs --apply    write it, in one transaction
//
// Source: POSTGRES_URL_NON_POOLING in .env.development.local. Target: POSTGRES_URL_NON_POOLING (.env.local = live).
//
// - Live keeps what staff decide there: published or draft, meetup allowed, review rejections, staff tiers
//   (curation_override …), and its own row ids, which moments, visits and saves point to.
// - Photos already on our own storage on live are kept; the rest follow dev and the hourly job copies Wikimedia and
//   TAT photos to R2 afterwards (lib/media/placePhotoBackfill.ts). Rows pointing at the dev bucket are refused.
// - Run `recomputeCuration` on dev first (admin console or after an import): dev's catalog is live's plus the new
//   places, so dev's scores are what live would compute.
// - One transaction, so the catalog's version moves once and servers read it again once (Supabase egress).
import { readFileSync } from 'node:fs';
import { adminConnection, postgres } from './env.mjs';

const DEV_REF = 'womkobbjdlzefyrxspxh';
const apply = process.argv.includes('--apply');

const devEnv = Object.fromEntries(readFileSync(new URL('../.env.development.local', import.meta.url), 'utf8').split(/\r?\n/)
  .filter((line) => /^[A-Z0-9_]+=/.test(line))
  .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]));
if (!devEnv.POSTGRES_URL_NON_POOLING?.includes(DEV_REF)) throw new Error('.env.development.local does not point at the development database');
const dev = postgres(devEnv.POSTGRES_URL_NON_POOLING, { max: 1, ssl: 'require', onnotice: () => {} });
const live = adminConnection();

/** Filled in by the database or owned by live */
const NEVER_COPY = new Set(['id', 'search_text', 'created_at', 'updated_at', 'source_id', 'curation_by']);
/** What dev may update on a place live already has */
const CONTENT = ['description', 'open_hours', 'price', 'entry_fee', 'best_time', 'transit_info', 'contact', 'facilities', 'highlights', 'source_name', 'source_url', 'google_maps_url', 'popularity'];
const CURATION = ['curation_score', 'curation_tier', 'curation_reasons', 'curation_at'];
const STAFF_DETAIL_KEYS = ['publicationStatus', 'meetupAllowed', 'reviewRejectedAt', 'reviewNote'];
const OWN_MEDIA = /^https:\/\/media\.chillwaa\.com\//;
const DEV_MEDIA = /^https:\/\/media-dev\.chillwaa\.com\//;

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const isPublished = (row) => row.publication_status === 'published' && row.details?.publicationStatus !== 'draft';
const photos = (details) => [details?.image, ...(Array.isArray(details?.galleryImages) ? details.galleryImages : [])].filter((u) => typeof u === 'string');

try {
  if (String(live.options.host).includes(DEV_REF) || live.options.user?.includes?.(DEV_REF)) throw new Error('Target is the development database');
  const [devRows, liveRows, liveCols, devSources, liveSources] = await Promise.all([
    dev`select * from app.places`,
    live`select * from app.places`,
    live`select column_name from information_schema.columns where table_schema = 'app' and table_name = 'places'`,
    dev`select id, name from app.sources`,
    live`select id, name from app.sources`,
  ]);
  const columns = liveCols.map((c) => c.column_name).filter((c) => !NEVER_COPY.has(c));
  const liveBySlug = new Map(liveRows.map((r) => [r.slug, r]));
  const sourceName = new Map(devSources.map((s) => [s.id, s.name]));
  const liveSourceId = new Map(liveSources.map((s) => [s.name, s.id]));

  const refused = [];
  const inserts = [];
  const updates = [];
  for (const row of devRows.filter(isPublished)) {
    if (photos(row.details).some((u) => DEV_MEDIA.test(u))) {
      refused.push(row.slug);
      continue;
    }
    const current = liveBySlug.get(row.slug);
    if (!current) {
      const values = Object.fromEntries(columns.map((c) => [c, row[c]]));
      values.source_id = row.source_id ? liveSourceId.get(sourceName.get(row.source_id)) ?? null : null;
      inserts.push(values);
      continue;
    }
    const set = {};
    for (const c of CONTENT) if (!same(row[c], current[c])) set[c] = row[c];
    // Staff tier on live: its curation stays as it is
    if (!current.curation_override) for (const c of CURATION) if (!same(row[c], current[c])) set[c] = row[c];
    const details = { ...current.details, ...row.details };
    for (const key of STAFF_DETAIL_KEYS) {
      if (key in current.details) details[key] = current.details[key];
      else delete details[key];
    }
    if (current.curation_override) details.curation = current.details.curation;
    if (photos(current.details).some((u) => OWN_MEDIA.test(u))) {
      details.image = current.details.image;
      details.galleryImages = current.details.galleryImages;
    }
    if (!same(details, current.details)) set.details = details;
    if (Object.keys(set).length) updates.push({ id: current.id, slug: row.slug, set });
  }

  const prefix = (rows) => rows.reduce((m, r) => ((m[r.slug.split('-')[0]] = (m[r.slug.split('-')[0]] || 0) + 1), m), {});
  const fieldCounts = {};
  for (const u of updates) for (const k of Object.keys(u.set)) fieldCounts[k] = (fieldCounts[k] || 0) + 1;
  console.log(`dev published ${devRows.filter(isPublished).length} · live places ${liveRows.length}`);
  console.log(`to add: ${inserts.length}`, prefix(inserts), `· with "ทำไมต้องไป": ${inserts.filter((r) => r.details?.vibeIntro).length}`);
  console.log(`to update: ${updates.length}`, fieldCounts);
  if (refused.length) console.log(`refused (photo on the dev bucket): ${refused.length}: ${refused.slice(0, 10).join(', ')}`);

  if (!apply) {
    console.log('Nothing written (add --apply).');
  } else {
    await live.begin(async (tx) => {
      for (let i = 0; i < inserts.length; i += 200) await tx`insert into app.places ${tx(inserts.slice(i, i + 200), [...columns])}`;
      for (const u of updates) await tx`update app.places set ${tx(u.set)} where id = ${u.id}`;
    });
    console.log(`Done: added ${inserts.length}, updated ${updates.length}.`);
  }
} finally {
  await Promise.all([dev.end(), live.end()]);
}
