// One-time, safe to rerun: fills the columns added by migration 0013 on moments already imported from data/moments.json.
// Touches those fields only; it never deletes and never adds rows.
// Usage: node db/backfill-moments.mjs
import { readFileSync } from 'node:fs';
import { adminConnection } from './env.mjs';

const moments = JSON.parse(readFileSync(new URL('../data/moments.json', import.meta.url), 'utf8'));
const sql = adminConnection();
let updatedMoments = 0;
let updatedComments = 0;
try {
  await sql.begin(async (tx) => {
    for (const m of moments) {
      const [row] = await tx`
        update app.moments set author_badge = ${m.authorBadge ?? null}, target_type = ${m.targetType ?? 'general'}, target_ref = ${m.targetId ?? null}
        where slug = ${m.id} returning id`;
      if (!row) continue;
      updatedMoments += 1;
      for (const c of m.comments ?? []) {
        const result = await tx`
          update app.moment_comments set slug = ${c.id}, author_avatar = case when author_id is null then ${c.authorAvatar ?? null} else null end
          where moment_id = ${row.id} and created_at = ${new Date(c.createdAt)} and body = ${c.text.trim().slice(0, 300)} and slug is null`;
        updatedComments += result.count;
      }
    }
  });
  console.log(`moments ${updatedMoments}/${moments.length}, comments ${updatedComments}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
