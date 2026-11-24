// Ranks TAT draft places by how well known they are, so the famous ones publish themselves (owner 2026-11-23:
// "อยากให้ระบบ auto ไม่ manual คั่น"). TAT gives no rating or review count, so the signal is the same one
// lib/spotCuration.ts already scores: the place's Thai Wikipedia article and its monthly page views.
//
//   POSTGRES_URL_NON_POOLING=<dev> node db/rank-tat-by-wikipedia.mjs              fetch + list, write nothing
//   POSTGRES_URL_NON_POOLING=<dev> node db/rank-tat-by-wikipedia.mjs --apply      write views, publish the famous
//   options: --min=<views a month to publish, default 300>  --refresh (ignore the cache)
//
// - Dev only (refuses any other database). Live gets the result through db/copy-places-to-live.mjs.
// - Article: from one Wikidata query of every Thai Wikipedia article with coordinates in Thailand, the one whose name
//   matches within 1.5 km (or the same name within 30 km). Views: the average of the last 3 full months (as lib/scrapers/osmWikidata.ts).
// - Answers are cached in data/.tat-cache/wikipedia.json (git-ignored), so a rerun asks Wikipedia nothing new.
// - A royal temple (ราชวรวิหาร, วรมหาวิหาร …) needs half the views: these are the temples people travel to.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { adminConnection, readEnv } from './env.mjs';

const DEV_REF = 'womkobbjdlzefyrxspxh';
const apply = process.argv.includes('--apply');
const refresh = process.argv.includes('--refresh');
const MIN = Number(process.argv.find((a) => a.startsWith('--min='))?.slice(6) || 300);
const CACHE = new URL('../data/.tat-cache/wikipedia.json', import.meta.url);
const UA = 'place-ranking-script/1.0 (https://www.mediawiki.org/wiki/API:Etiquette)';
const ROYAL = /ราชวรมหาวิหาร|วรมหาวิหาร|ราชวรวิหาร|วรวิหาร|ราชวิหาร|พระอารามหลวง/;

if (!readEnv().POSTGRES_URL_NON_POOLING?.includes(DEV_REF)) throw new Error('Development database only: pass its POSTGRES_URL_NON_POOLING');

const cache = !refresh && existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const save = () => writeFileSync(CACHE, JSON.stringify(cache, null, 1));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) }).catch(() => null);
    if (res?.ok) return res.json();
    if (res && res.status === 404) return null;
    await wait(res?.status === 429 ? 30000 * (i + 1) : 2000 * (i + 1));
  }
  return null;
}

/** Name without spaces, brackets and royal-rank words, so "วัดพระธาตุดอยสุเทพราชวรวิหาร" meets "วัดพระธาตุดอยสุเทพ" */
const core = (name) => String(name).replace(/\(.*?\)/g, '').replace(ROYAL, '').replace(/[\s\-–.,'"]/g, '').toLowerCase();
function bigrams(s) {
  const out = new Map();
  for (let i = 0; i < s.length - 1; i++) out.set(s.slice(i, i + 2), (out.get(s.slice(i, i + 2)) || 0) + 1);
  return out;
}
function similar(a, b) {
  const x = core(a), y = core(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  // Extra words in front of the article's name make it something at that place: "สนามกอล์ฟเขื่อนอุบลรัตน์" is not the dam
  if (y.length > x.length && y.endsWith(x)) return 0;
  // One name inside the other counts only when it is most of it: "ศูนย์ศิลปาชีพจังหวัดแม่ฮ่องสอน" is not "จังหวัดแม่ฮ่องสอน"
  if (Math.min(x.length, y.length) >= 6 && Math.min(x.length, y.length) / Math.max(x.length, y.length) >= 0.7 && (x.includes(y) || y.includes(x))) return 0.9;
  const A = bigrams(x), B = bigrams(y);
  let both = 0;
  for (const [k, n] of A) both += Math.min(n, B.get(k) || 0);
  return (2 * both) / Math.max(1, x.length - 1 + y.length - 1);
}

/** Every Thai Wikipedia article about a place in Thailand with coordinates, in ONE Wikidata query (asking per place hit 429) */
const ARTICLES = new URL('../data/.tat-cache/thwiki-places.json', import.meta.url);
async function thaiArticles() {
  if (!refresh && existsSync(ARTICLES)) return JSON.parse(readFileSync(ARTICLES, 'utf8'));
  const query = 'SELECT ?title ?coord WHERE { ?item wdt:P17 wd:Q869; wdt:P625 ?coord. ?a schema:about ?item; schema:isPartOf <https://th.wikipedia.org/>; schema:name ?title. }';
  const data = await getJson(`https://query.wikidata.org/sparql?${new URLSearchParams({ query, format: 'json' })}`);
  if (!data) throw new Error('Wikidata query failed');
  const list = data.results.bindings.map((b) => {
    const [lon, lat] = b.coord.value.replace(/^Point\(|\)$/g, '').split(' ').map(Number);
    return { title: b.title.value, lat, lon };
  }).filter((a) => Number.isFinite(a.lat));
  writeFileSync(ARTICLES, JSON.stringify(list));
  return list;
}

const km = (a, b) => Math.hypot((a.lat - b.lat) * 111, (a.lon - b.lon) * 111 * Math.cos((a.lat * Math.PI) / 180));

/** The article about this place: a matching name within 1.5 km, or the same name (bar rank words) within 30 km */
function findArticle(place, articles) {
  if (!place.lat || !place.lon) return null;
  let best = null;
  for (const a of articles) {
    if (Math.abs(a.lat - place.lat) > 0.3 || Math.abs(a.lon - place.lon) > 0.3) continue;
    // Articles about a province, district or university are about the area, not the attraction in it
    if (/^(จังหวัด|อำเภอ|ตำบล|เขต|แขวง|มหาวิทยาลัย)/.test(a.title) && !/^(จังหวัด|อำเภอ|ตำบล|เขต|แขวง|มหาวิทยาลัย)/.test(place.title)) continue;
    const s = similar(a.title, place.title);
    const d = km(a, place);
    if (!((s >= 0.75 && d <= 1.5) || (s >= 0.95 && d <= 30))) continue;
    if (!best || s > best.s || (s === best.s && d < best.d)) best = { title: a.title, s, d };
  }
  return best && { title: best.title, how: `${Math.round(best.d * 1000)} m, name ${best.s.toFixed(2)}` };
}

function month(offset) {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - offset);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}0100`;
}
async function monthlyViews(title) {
  await wait(1200); // Wikimedia rate-limits fast callers (429); getJson backs off further
  const data = await getJson(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/th.wikipedia/all-access/user/${encodeURIComponent(title.replace(/ /g, '_'))}/monthly/${month(3)}/${month(1)}`);
  const views = (data?.items || []).map((i) => i.views || 0);
  return views.length ? Math.round(views.reduce((a, b) => a + b, 0) / views.length) : 0;
}

const sql = adminConnection();
try {
  const rows = await sql`
    select slug, title, category, province_code as province, st_y(location::geometry) as lat, st_x(location::geometry) as lon,
           publication_status as status, details->>'publicationStatus' as dstatus, details->>'image' as image
      from app.places where slug like 'tat-%'`;
  const articles = await thaiArticles();
  let asked = 0;
  for (const [i, place] of rows.entries()) {
    const article = findArticle(place, articles);
    if (cache[place.slug] && cache[place.slug].title === article?.title && (cache[place.slug].views || !article)) continue;
    cache[place.slug] = article ? { ...article, views: await monthlyViews(article.title) } : { none: true };
    if (++asked % 25 === 0) {
      save();
      console.log(`${i + 1}/${rows.length} …`);
    }
  }
  save();

  const famous = (place) => {
    const hit = cache[place.slug];
    if (!hit?.views || !place.image) return false;
    return hit.views >= (ROYAL.test(place.title) || ROYAL.test(hit.title) ? MIN / 2 : MIN);
  };
  const matched = rows.filter((p) => cache[p.slug]?.title);
  const candidates = rows.filter(famous);
  // A place we already show under another record (similar name within 1 km) stays a draft. "ปรางค์ศรีเทพ (อุทยาน
  // ประวัติศาสตร์ศรีเทพ)" is a part of the park, not the park, so a name carrying this one in brackets does not count.
  const dupes = candidates.length ? await sql`
    select t.slug, o.slug as other, o.title as other_title from app.places t
      join app.places o on o.slug <> t.slug and o.slug not like 'tat-%' and o.publication_status = 'published'
       and st_dwithin(t.location, o.location, 1000) and extensions.similarity(o.title, t.title) > 0.45
       and strpos(o.title, '(' || t.title) = 0
     where t.slug in ${sql(candidates.map((p) => p.slug))}` : [];
  const dupeOf = new Map(dupes.map((d) => [d.slug, `${d.other} ${d.other_title}`]));
  for (const [slug, other] of dupeOf) console.log(`  already have: ${slug} = ${other}`);
  const pick = candidates.filter((p) => !dupeOf.has(p.slug)).sort((a, b) => cache[b.slug].views - cache[a.slug].views);
  const byCat = {};
  for (const p of pick) byCat[p.category] = (byCat[p.category] || 0) + 1;
  console.log(`TAT places ${rows.length} · with a Wikipedia article ${matched.length} · famous (≥${MIN}/month, royal temples ≥${MIN / 2}) ${pick.length}`, byCat);
  for (const p of pick) console.log(`  ${String(cache[p.slug].views).padStart(6)}  ${p.title} (${p.province}) ← ${cache[p.slug].title} [${cache[p.slug].how}]`);

  if (!apply) {
    console.log('Nothing written (add --apply).');
  } else {
    await sql.begin(async (tx) => {
      for (const p of matched) {
        const hit = cache[p.slug];
        await tx`update app.places set details = details || jsonb_build_object('wikiMonthlyViews', ${hit.views}::int, 'wikiTitle', ${hit.title}::text) where slug = ${p.slug}`;
      }
      const toPublish = pick.filter((p) => p.status !== 'published' || p.dstatus === 'draft').map((p) => p.slug);
      if (toPublish.length) {
        await tx`update app.places set publication_status = 'published', details = details || '{"publicationStatus":"published"}'::jsonb where slug in ${tx(toPublish)}`;
      }
      console.log(`Wrote views on ${matched.length}, published ${toPublish.length}.`);
    });
  }
} finally {
  await sql.end();
}
