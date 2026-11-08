// Writes the short "why go" texts (vibeIntro) from a db/content/*-vibes.json file onto places, and sets the ones listed
// under "draft" back to draft (not places to recommend). Places are matched by their public id (slug).
//
//   node db/apply-spot-vibes.mjs db/content/bangkok-osm-vibes.json           list what would change, touch nothing
//   node db/apply-spot-vibes.mjs db/content/bangkok-osm-vibes.json --apply
//
// Database: POSTGRES_URL_NON_POOLING (.env.local = live). For the development database pass its value in the environment.
import { readFileSync } from 'node:fs';
import { adminConnection } from './env.mjs';

const file = process.argv[2];
const apply = process.argv.includes('--apply');
if (!file) throw new Error('Usage: node db/apply-spot-vibes.mjs <vibes.json> [--apply]');
const { vibes = {}, draft = {} } = JSON.parse(readFileSync(file, 'utf8'));

const sql = adminConnection();
try {
  const slugs = [...Object.keys(vibes), ...Object.keys(draft)];
  // The site reads publicationStatus from details (until review item 3 lands), so both must say draft
  const rows = await sql`select slug, case when publication_status = 'draft' and details->>'publicationStatus' = 'draft' then 'draft' else 'published' end as publication_status, details->>'vibeIntro' as vibe from app.places where slug in ${sql(slugs)}`;
  const found = new Map(rows.map((r) => [r.slug, r]));
  const missing = slugs.filter((slug) => !found.has(slug));
  const toWrite = Object.entries(vibes).filter(([slug, text]) => found.has(slug) && found.get(slug).vibe !== text);
  const toDraft = Object.keys(draft).filter((slug) => found.get(slug)?.publication_status === 'published');
  console.log(`vibe texts to write: ${toWrite.length} · to set as draft: ${toDraft.length} · not in this database: ${missing.length}`);
  if (missing.length) console.log(`  missing: ${missing.join(', ')}`);
  if (!apply) {
    console.log('Nothing changed (add --apply to write).');
  } else {
    await sql.begin(async (tx) => {
      for (const [slug, text] of toWrite) {
        await tx`update app.places set details = details || jsonb_build_object('vibeIntro', ${text}::text) where slug = ${slug}`;
      }
      if (toDraft.length) {
        await tx`update app.places set publication_status = 'draft', details = details || '{"publicationStatus":"draft"}'::jsonb where slug in ${tx(toDraft)}`;
      }
    });
    console.log('Done.');
  }
} finally {
  await sql.end();
}
