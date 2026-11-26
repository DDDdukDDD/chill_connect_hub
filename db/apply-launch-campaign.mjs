// Rewrites the launch campaign (slug launch-2569) without a prize draw (owner 2026-11-23: guaranteed rewards only;
// 2026-11-26: launch-tee and launch-fair had ended, so the campaign could not be finished). Its steps are open
// challenges, found by the `coverSlug` they got from db/apply-challenges.mjs, since some slugs differ per database.
// No reward is linked: each challenge gives its own XP and badge. Staff link a guaranteed reward in admin when a
// partner gives one. Whether it shows (published, show on home) stays as staff set it; a new row starts hidden.
//
//   node db/apply-launch-campaign.mjs            list what would change, touch nothing
//   node db/apply-launch-campaign.mjs --apply    write it, in one transaction
//
// Database: POSTGRES_URL_NON_POOLING (.env.local = live). For the development database pass its value in the environment.
// The same words are in data/launchCampaign.ts (the seed for a clone without a database); keep the two alike.
import { adminConnection } from './env.mjs';

const apply = process.argv.includes('--apply');
const SLUG = 'launch-2569';
const CAMPAIGN = {
  name: 'กิจกรรมเปิดตัว Chillwaa',
  eyebrow: 'กิจกรรมเปิดตัว Chillwaa',
  headline: 'ออกไปใช้ชีวิตจริง ครบ 3 อย่าง',
  body: 'เข้าตี้แรก แชร์โมเมนต์จาก 3 ที่เที่ยว และไปอีเวนต์กับเพื่อนๆ ทุกชาเลนจ์ได้ XP และเหรียญของตัวเองทันทีที่ทำครบ',
  strip_text: 'เข้าตี้ แชร์โมเมนต์ ไปอีเวนต์ เก็บ XP และเหรียญ',
  cta: 'เริ่มเลย',
  prize_image: '/images/challenges/join-first-tee.webp',
  starts_on: '2026-11-26',
  ends_on: '2026-12-31',
};
const STEPS = ['join-first-tee', 'life-map-3-spots', 'dec-events-2'];
const EXTRAS = ['hidden-cafe', 'city-park-chill', 'art-weekend', 'weekend-market', 'sunset-viewpoint', 'first-time-host', 'invite-bestie-tee', 'squad-tee', 'dec-weekend-passport'];

const sql = adminConnection();
try {
  const quests = await sql`select id, slug, title, status, details->>'coverSlug' as cover from app.quests where details->>'coverSlug' in ${sql([...STEPS, ...EXTRAS])}`;
  const byCover = new Map(quests.map((q) => [q.cover, q]));
  const missing = [...STEPS, ...EXTRAS].filter((c) => !byCover.has(c));
  const closed = quests.filter((q) => q.status === 'ended');
  const [existing] = await sql`select id, published, show_on_home, starts_on::text from app.campaigns where slug = ${SLUG}`;

  console.log(existing ? `campaign ${SLUG}: rewrite (published ${existing.published}, kept)` : `campaign ${SLUG}: add, hidden`);
  console.log(`  ${CAMPAIGN.headline} · ${CAMPAIGN.starts_on} – ${CAMPAIGN.ends_on} · no reward linked`);
  for (const cover of STEPS) console.log(`  step  ${cover} → ${byCover.get(cover)?.slug ?? 'MISSING'} ${byCover.get(cover)?.title ?? ''}`);
  for (const cover of EXTRAS) console.log(`  extra ${cover} → ${byCover.get(cover)?.slug ?? 'MISSING'}`);
  if (closed.length) console.log(`ended challenges: ${closed.map((q) => q.slug).join(', ')}`);

  if (!apply) {
    console.log('Nothing changed (add --apply).');
  } else if (missing.length || closed.length) {
    console.log(`Not applied: ${missing.length ? `no challenge for ${missing.join(', ')}` : 'some challenges have ended'}. Run db/apply-challenges.mjs first.`);
    process.exitCode = 1;
  } else {
    await sql.begin(async (tx) => {
      // An earlier start stays: members who joined then keep counting
      const startsOn = existing && existing.starts_on < CAMPAIGN.starts_on ? existing.starts_on : CAMPAIGN.starts_on;
      const fields = { ...CAMPAIGN, starts_on: startsOn, reward_id: null };
      const [row] = existing
        ? await tx`update app.campaigns set ${tx(fields)} where id = ${existing.id} returning id`
        : await tx`insert into app.campaigns ${tx({ ...fields, slug: SLUG, published: false, show_on_home: false })} returning id`;
      await tx`delete from app.campaign_quests where campaign_id = ${row.id}`;
      const links = [
        ...STEPS.map((cover, i) => ({ campaign_id: row.id, quest_id: byCover.get(cover).id, role: 'step', sort_order: i })),
        ...EXTRAS.map((cover, i) => ({ campaign_id: row.id, quest_id: byCover.get(cover).id, role: 'extra', sort_order: i })),
      ];
      await tx`insert into app.campaign_quests ${tx(links)}`;
    });
    console.log('Done.');
  }
} finally {
  await sql.end();
}
