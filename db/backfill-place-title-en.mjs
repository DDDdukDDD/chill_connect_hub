// Adds details.titleEn (English name, global plan 2026-11-09) to places imported from OpenStreetMap, from the OSM element name:en or the Wikidata label.
// Dev: POSTGRES_URL_NON_POOLING=<dev url> node db/backfill-place-title-en.mjs   Live: also CONFIRM_LIVE=mvbjawwhpsrqrqffexyf (owner runs it). Safe to rerun: skips places that have one.
import postgres from 'postgres';
const url = process.env.POSTGRES_URL_NON_POOLING || '';
const live = process.env.CONFIRM_LIVE === 'mvbjawwhpsrqrqffexyf' && url.includes('mvbjawwhpsrqrqffexyf');
if (!url.includes('womkobbjdlzefyrxspxh') && !live) throw new Error('refusing: not the dev database');
const sql = postgres(url, { max: 1 });
const rows = await sql`select slug, title, details->>'titleEn' as en from app.places where slug like 'osm-%' order by slug`;
const types = { n: 'node', w: 'way', r: 'relation' };
let added = 0, none = 0;
for (const row of rows) {
  if (row.en) continue;
  const m = /^osm-([nwr])(\d+)$/.exec(row.slug); if (!m) continue;
  const res = await fetch(`https://api.openstreetmap.org/api/0.6/${types[m[1]]}/${m[2]}.json`, { headers: { 'User-Agent': 'Chillwaa-import/1.0' } });
  if (!res.ok) { console.log('skip', row.slug, res.status); continue; }
  const tags = (await res.json()).elements?.[0]?.tags || {};
  let en = (tags['name:en'] || '').trim();
  if (!en && tags.wikidata) {
    const w = await (await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${tags.wikidata}&props=labels&languages=en&format=json`, { headers: { 'User-Agent': 'Chillwaa-import/1.0' } })).json();
    en = (w.entities?.[tags.wikidata]?.labels?.en?.value || '').trim();
  }
  if (!en || en === row.title) { none++; continue; }
  await sql`update app.places set details = details || ${sql.json({ titleEn: en })}, updated_at = now() where slug = ${row.slug}`;
  added++; console.log(row.title, '→', en);
  await new Promise((r) => setTimeout(r, 300));
}
console.log({ total: rows.length, added, none });
await sql.end();
