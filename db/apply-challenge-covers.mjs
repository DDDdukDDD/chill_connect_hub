// Points each launch challenge at its own cover in public/images/challenges/<coverSlug>.webp (2026-11-26, 35 covers
// drawn by the tester). A challenge is found by the `coverSlug` it got from db/apply-challenges.mjs.
//
//   node db/apply-challenge-covers.mjs            list what would change, touch nothing
//   node db/apply-challenge-covers.mjs --apply    write it, in one transaction
//
// Database: POSTGRES_URL_NON_POOLING (.env.local = live). For the development database pass its value in the environment.
import { existsSync } from 'node:fs';
import { adminConnection } from './env.mjs';

const apply = process.argv.includes('--apply');
const sql = adminConnection();
try {
  const rows = await sql`select id, slug, cover_image_url, details->>'coverSlug' as cover from app.quests where details ? 'coverSlug'`;
  const changes = [];
  const missing = [];
  for (const row of rows) {
    const image = `/images/challenges/${row.cover}.webp`;
    if (!existsSync(new URL(`../public${image}`, import.meta.url))) missing.push(row.cover);
    else if (row.cover_image_url !== image) changes.push({ id: row.id, slug: row.slug, image });
  }
  console.log(`challenges with a cover slug: ${rows.length} · to change: ${changes.length}`);
  for (const c of changes) console.log(`  ~ ${c.slug} → ${c.image}`);
  if (missing.length) console.log(`no file for: ${missing.join(', ')}`);
  if (!apply) console.log('Nothing changed (add --apply).');
  else if (changes.length) {
    await sql.begin(async (tx) => {
      for (const c of changes) {
        await tx`update app.quests set cover_image_url = ${c.image},
                 details = coalesce(details, '{}'::jsonb) || ${tx.json({ image: c.image, badgeCoverImg: c.image })}
                 where id = ${c.id}`;
      }
    });
    console.log('Done.');
  }
} finally {
  await sql.end();
}
