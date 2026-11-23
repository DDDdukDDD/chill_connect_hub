// Puts a set of real challenges in place from a db/content/challenges-*.json file (2026-11-24, the launch set).
//
//   node db/apply-challenges.mjs db/content/challenges-2027.json            list what would change, touch nothing
//   node db/apply-challenges.mjs db/content/challenges-2027.json --apply    write it, in one transaction
//
// Database: POSTGRES_URL_NON_POOLING (.env.local = live). For the development database pass its value in the environment.
// Run after db/remove-sample-data.mjs on a database that still has the sample challenges.
//
// - An item with `match` (or, failing that, a challenge titled `title` or `was`) takes over that challenge: same id, joins, stamps and moments; it gets the new title, rule,
//   dates and XP, and loses what described the old rule (steps, totals, an old partner reward). Its cover, icon and
//   badge stay, unless the item gives an `image`.
// - An item without `match` is added under `slug`, official and public.
// - Slugs under `end` are closed (status ended), so members who joined keep their history.
// The row mapping is the app's own (lib/db/postgres/rows.mjs).
import { readFileSync } from 'node:fs';
import { adminConnection } from './env.mjs';
import { questToRow, rowToQuest } from '../lib/db/postgres/rows.mjs';

const file = process.argv[2];
const apply = process.argv.includes('--apply');
if (!file) throw new Error('Usage: node db/apply-challenges.mjs <challenges.json> [--apply]');
const { challenges = [], end = [] } = JSON.parse(readFileSync(file, 'utf8'));

/** What described the old rule or was made up for the sample, dropped when a challenge is taken over */
const STALE = ['rule', 'plan', 'steps', 'total', 'current', 'targetGoal', 'brandReward', 'rewardsText', 'verificationMethod', 'startDate', 'endDate',
  'completedCountInfo', 'progressPercent', 'participantsCount', 'daysRemaining', 'startsInDays', 'status', 'isSample', 'category', 'rewardPoints'];
const badgeOf = (title) => title.split(/[:：]/)[0].replace(/^#/, '').trim().slice(0, 40);

const sql = adminConnection();
try {
  const slugs = [...challenges.map((c) => c.match ?? c.slug), ...end];
  const rows = await sql`select * from app.quests where slug in ${sql(slugs)}`;
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  // The starter challenges were seeded separately on each database, so their slugs differ: fall back to the title it has now
  const all = await sql`select * from app.quests`;
  const byTitle = (titles) => all.find((r) => titles.includes(r.title));
  const problems = [];
  const updates = [];
  const inserts = [];
  for (const item of challenges) {
    if (!item.title || item.title.length < 5) problems.push(`${item.cover}: title too short`);
    if (!item.rule === !item.plan) problems.push(`${item.cover}: needs a rule or a plan, not both`);
    const base = {
      title: item.title,
      category: item.category,
      objective: item.objective ?? '',
      startDate: item.start,
      endDate: item.end,
      status: 'active',
      visibility: 'public',
      isOfficial: true,
      rewardPoints: item.xp,
      ...(item.rule && { rule: item.rule }),
      ...(item.plan && { plan: item.plan }),
      coverSlug: item.cover,
    };
    if (item.match) {
      const row = bySlug.get(item.match) ?? byTitle([item.title, item.was].filter(Boolean));
      if (!row) {
        problems.push(`${item.cover}: no challenge ${item.match}`);
        continue;
      }
      const kept = Object.fromEntries(Object.entries(rowToQuest(row)).filter(([k]) => !STALE.includes(k)));
      const image = item.image ?? row.cover_image_url ?? kept.image ?? kept.badgeCoverImg;
      const quest = { ...kept, ...base, id: row.slug, iconName: row.icon_name, badgeLabel: row.badge_label || badgeOf(item.title), image, badgeCoverImg: image };
      const next = questToRow(quest, { id: row.id, isSample: false, sortKey: Number(row.sort_key) });
      delete next.id;
      delete next.slug;
      delete next.sort_key;
      next.brand_reward = null;
      updates.push({ id: row.id, slug: row.slug, title: item.title, set: next });
    } else {
      if (bySlug.has(item.slug)) {
        problems.push(`${item.slug} already exists: give it as match`);
        continue;
      }
      const quest = { ...base, id: item.slug, iconName: '', badgeLabel: badgeOf(item.title), image: item.image, badgeCoverImg: item.image };
      inserts.push(questToRow(quest, { isSample: false }));
    }
  }
  const toEnd = end.filter((slug) => bySlug.get(slug) && bySlug.get(slug).status !== 'ended');
  for (const slug of end) if (!bySlug.has(slug)) problems.push(`end: no challenge ${slug} (already removed?)`);

  console.log(`challenges in file: ${challenges.length} · take over: ${updates.length} · add: ${inserts.length} · close: ${toEnd.length}`);
  for (const u of updates) console.log(`  ~ ${u.slug} → ${u.title}`);
  for (const r of inserts) console.log(`  + ${r.slug} ${r.title}`);
  if (problems.length) console.log(`problems:\n  ${problems.join('\n  ')}`);

  if (!apply) {
    console.log('Nothing changed (add --apply).');
  } else if (problems.some((p) => !p.startsWith('end:'))) {
    console.log('Not applied: fix the problems first.');
    process.exitCode = 1;
  } else {
    await sql.begin(async (tx) => {
      for (const u of updates) await tx`update app.quests set ${tx(u.set)} where id = ${u.id}`;
      if (inserts.length) await tx`insert into app.quests ${tx(inserts)}`;
      if (toEnd.length) await tx`update app.quests set status = 'ended' where slug in ${tx(toEnd)}`;
    });
    console.log('Done.');
  }
} finally {
  await sql.end();
}
