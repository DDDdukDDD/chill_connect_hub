// Imports well-known places of one province from OpenStreetMap + Wikipedia (lib/scrapers/osmWikidata.ts).
//   node scripts/import-osm-places.cjs เชียงใหม่ 40          dev database (.env.development.local)
//   node scripts/import-osm-places.cjs เชียงใหม่ 40 --live   live database (.env.local): places go on the site at once
// Every import ships with its "why go" texts in the same batch (owner 2026-11-08): write db/content/<name>-vibes.json
// for the new ids it prints, then run db/apply-spot-vibes.mjs on the same database.
const fs = require('node:fs');
const path = require('node:path');

const repo = path.join(__dirname, '..');
const [province, limitArg] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const live = process.argv.includes('--live');
if (!province) throw new Error('Usage: node scripts/import-osm-places.cjs <province> [limit] [--live]');

const env = (file) => {
  const out = {};
  for (const line of fs.readFileSync(path.join(repo, file), 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (match) out[match[1]] = match[2].trim().replace(/^"|"$/g, '');
  }
  return out;
};
const dev = env('.env.development.local');
const prod = env('.env.local');
const target = live ? { ...prod, DATABASE_URL: prod.POSTGRES_URL || prod.DATABASE_URL, DATA_STORE: 'postgres' } : dev;
if (!target.DATABASE_URL) throw new Error('No database address');
if (!live && target.DATABASE_URL === (prod.POSTGRES_URL || prod.DATABASE_URL)) throw new Error('The dev address is the live one. Stopped.');
Object.assign(process.env, target);
process.chdir(repo);
console.log(`Importing ${province} into the ${live ? 'LIVE' : 'dev'} database…`);

const jiti = require(path.join(repo, 'node_modules/jiti'))(path.join(repo, 'x.js'), { alias: { '@': repo }, interopDefault: true });
(async () => {
  const { runSpotScraper } = jiti('./lib/spotScraper.ts');
  const { recomputeCuration } = jiti('./lib/spotCurationStore.ts');
  const result = await runSpotScraper('osm-wikidata', { province, limit: Number(limitArg || 40) });
  console.log(JSON.stringify({ scanned: result.totalScanned, new: result.newCount, duplicates: result.duplicateCount, sources: result.sourceResults }));
  for (const spot of result.spots) console.log([spot.id, spot.publicationStatus, spot.category, spot.title].join('\t'));
  if (result.newCount > 0) await recomputeCuration();
  process.exit(0);
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
