// Takes the prize draws out of a database (owner 2026-11-23: no draws or contests, Gambling Act; 2026-11-26: remove
// every "ลุ้น" text). Campaigns give guaranteed rewards only.
//
//   node db/remove-prize-draws.mjs            list what would change, touch nothing
//   node db/remove-prize-draws.mjs --apply    write it, in one transaction, after a backup
//
// Database: POSTGRES_URL_NON_POOLING (.env.local = live). For the development database pass its value in the environment.
// Backup: data/.backups/prize-draws-<time>.json (git-ignored), written before anything changes.
//
// - Campaigns whose reward is a draw, or whose words say ลุ้น/จับรางวัล: removed (their challenge links and sign-ups go
//   with them). A campaign with drawn winners is only listed: staff decide what to tell those winners first.
//   The launch campaign (launch-2569) stays: db/apply-launch-campaign.mjs rewrites it without a draw (run that first).
// - Draw rewards: removed; one members already redeemed stays switched off (their history points at it) and is listed.
// - Challenges: a partner reward that promises a draw is cleared, and the draw words come out of the objective.
import { mkdirSync, writeFileSync } from 'node:fs';
import { adminConnection } from './env.mjs';

const apply = process.argv.includes('--apply');
const DRAW_WORDS = /ลุ้น|จับรางวัล/;
// The launch challenges' objectives (checked on live 2026-11-26); anything else with draw words is listed for staff
const OBJECTIVE_FIXES = [
  [/ไปสะสมลุ้น iPhone Duo/g, 'ไปสะสม'],
  [/ช่วงสุดท้ายก่อนจับรางวัล iPhone Duo/g, 'ช่วงสุดท้ายของปี'],
];

const sql = adminConnection();
try {
  const drawRewards = await sql`
    select w.id, w.slug, w.title, w.active, (select count(*)::int from app.reward_redemptions r where r.reward_id = w.id) as redeemed
    from app.rewards w where w.draw_entry is not null or w.title ~ ${DRAW_WORDS.source}`;
  const drawRewardIds = drawRewards.map((w) => w.id);
  const campaigns = await sql`
    select c.id, c.slug, c.name, c.published, (select count(*)::int from app.campaign_winners x where x.campaign_id = c.id) as winners
    from app.campaigns c
    where ${drawRewardIds.length ? sql`c.reward_id in ${sql(drawRewardIds)} or` : sql``}
      concat_ws(' ', c.name, c.eyebrow, c.headline, c.body, c.strip_text, c.cta) ~ ${DRAW_WORDS.source}`;
  const quests = await sql`
    select id, slug, title, objective, brand_reward, details->'brandReward' as details_reward from app.quests
    where brand_reward::text ~ ${DRAW_WORDS.source} or (details->'brandReward')::text ~ ${DRAW_WORDS.source} or objective ~ ${DRAW_WORDS.source} or title ~ ${DRAW_WORDS.source}`;

  // The launch campaign is rewritten without a draw by db/apply-launch-campaign.mjs, not removed
  const launch = campaigns.find((c) => c.slug === 'launch-2569');
  if (launch) console.log('launch-2569 is kept: run db/apply-launch-campaign.mjs --apply first, so it no longer points at a draw');
  const campaignsOut = campaigns.filter((c) => c.winners === 0 && c.slug !== 'launch-2569');
  const campaignsKept = campaigns.filter((c) => c.winners > 0);
  const rewardsOut = drawRewards.filter((w) => w.redeemed === 0);
  const rewardsOff = drawRewards.filter((w) => w.redeemed > 0);
  const questFixes = quests.map((q) => {
    let objective = q.objective ?? '';
    for (const [from, to] of OBJECTIVE_FIXES) objective = objective.replace(from, to);
    const clearReward = DRAW_WORDS.test(JSON.stringify(q.brand_reward ?? '')) || DRAW_WORDS.test(JSON.stringify(q.details_reward ?? ''));
    const left = [DRAW_WORDS.test(q.title) && 'title', DRAW_WORDS.test(objective) && 'objective'].filter(Boolean);
    return { ...q, objective, clearReward, changed: clearReward || objective !== (q.objective ?? ''), left };
  });

  console.log(`campaigns to remove: ${campaignsOut.length}`);
  for (const c of campaignsOut) console.log(`  - ${c.slug} ${c.name}${c.published ? ' (published)' : ''}`);
  for (const c of campaignsKept) console.log(`  ! ${c.slug} has ${c.winners} drawn winner(s): left for staff`);
  console.log(`draw rewards to remove: ${rewardsOut.length}`);
  for (const w of rewardsOut) console.log(`  - ${w.slug} ${w.title}`);
  for (const w of rewardsOff) console.log(`  ! ${w.slug} redeemed ${w.redeemed} time(s): switched off, not removed`);
  console.log(`challenges to fix: ${questFixes.filter((q) => q.changed).length}`);
  for (const q of questFixes.filter((x) => x.changed)) console.log(`  ~ ${q.slug}${q.clearReward ? ' (partner reward cleared)' : ''}`);
  for (const q of questFixes.filter((x) => x.left.length)) console.log(`  ! ${q.slug}: draw words still in ${q.left.join(', ')}; edit in admin`);

  if (!apply) {
    console.log('Nothing changed (add --apply).');
  } else {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    mkdirSync(new URL('../data/.backups/', import.meta.url), { recursive: true });
    const backup = {
      campaigns: campaigns.length ? await sql`select * from app.campaigns where id in ${sql(campaigns.map((c) => c.id))}` : [],
      campaignQuests: campaigns.length ? await sql`select * from app.campaign_quests where campaign_id in ${sql(campaigns.map((c) => c.id))}` : [],
      rewards: drawRewardIds.length ? await sql`select * from app.rewards where id in ${sql(drawRewardIds)}` : [],
      quests: quests.map((q) => ({ id: q.id, slug: q.slug, objective: q.objective, brand_reward: q.brand_reward, details_reward: q.details_reward })),
    };
    writeFileSync(new URL(`../data/.backups/prize-draws-${stamp}.json`, import.meta.url), JSON.stringify(backup, null, 2));
    await sql.begin(async (tx) => {
      if (campaignsOut.length) await tx`delete from app.campaigns where id in ${tx(campaignsOut.map((c) => c.id))}`;
      if (rewardsOut.length) await tx`delete from app.rewards where id in ${tx(rewardsOut.map((w) => w.id))}`;
      if (rewardsOff.length) await tx`update app.rewards set active = false where id in ${tx(rewardsOff.map((w) => w.id))}`;
      for (const q of questFixes.filter((x) => x.changed)) {
        await tx`update app.quests set objective = ${q.objective}, brand_reward = ${q.clearReward ? null : q.brand_reward},
          details = case when ${q.clearReward} then details - 'brandReward' else details end where id = ${q.id}`;
      }
    });
    console.log(`Done. Backup: data/.backups/prize-draws-${stamp}.json`);
  }
} finally {
  await sql.end();
}
