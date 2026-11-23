// Removes the sample (seed) data before launch (owner 2026-11-24, docs/LAUNCH_CHECKLIST.md ขั้น 6).
//
//   node db/remove-sample-data.mjs            list what would go, touch nothing
//   node db/remove-sample-data.mjs --apply    back up every row first, then remove in one transaction
//
// Database: POSTGRES_URL_NON_POOLING (.env.local = live). For the development database pass its value in the environment.
// Backup: data/.backups/sample-removal-<database>-<time>.json (git-ignored), written before anything is removed.
//
// What goes:
// - sample accounts (is_sample, @sample.invalid) and the 205 made-up guests (sample-guest-…), with what hangs off
//   them (their moments, joins, likes, follows: foreign keys cascade);
// - sample ตี้ and อีเวนต์ (is_sample, or seeded with our own site as their "source"), except KEEP_EVENTS and seed
//   อีเวนต์ that link a real organiser page: those stay and stop counting as sample;
// - sample moments and the made-up likes on any moment (sample_likes);
// - sample challenges nobody joined; the ones real members joined end instead, so their history stays;
// - the quest_seeds setting (challenges are no longer seeded from code).
// Real members, their moments, ตี้, saves and XP stay. Moments that tagged a removed ตี้ keep the post, without the tag.
import { mkdirSync, writeFileSync } from 'node:fs';
import { adminConnection } from './env.mjs';

const apply = process.argv.includes('--apply');
/** Seed อีเวนต์ that are real and in use: the owner's run on 29 Nov 2026 (a team ตี้ goes to it) */
const KEEP_EVENTS = ['live-agg-30'];
const OWN_SITES = /chill-connect-hub\.vercel\.app|chillwaa\.com|chillwaa\.vercel\.app/;
const SEED_SOURCE = 'Chill & Connect Official';
/** The reward rows seeded from data/rewardsData.ts: made-up partner shops, the iPhone and the flight prizes */
const SAMPLE_REWARDS = ['reward-1', 'reward-2', 'reward-3', 'reward-4', 'reward-5', 'reward-6', 'reward-7', 'reward-8', 'reward-launch-iphone', 'reward-flight-phuket', 'reward-flight-japan', 'reward-flight-china'];

const sql = adminConnection();
try {
  const [db] = await sql`select current_database() as name, (select split_part(current_user, '.', 2)) as ref`;
  const sampleMembers = await sql`
    select id, legacy_id, email::text as email from app.members
     where is_sample or email::text like '%@sample.invalid' or legacy_id like 'sample-guest-%' or legacy_id like 'mem_sample_%'`;
  const sampleMemberIds = sampleMembers.map((m) => m.id);

  const seedEvents = await sql`
    select id, slug, title, event_type, source_url, is_sample, host_member_id from app.events
     where is_sample
        or (host_member_id is null and (source_url is null or source_name = ${SEED_SOURCE}))
        or host_member_id in ${sql(sampleMemberIds.length ? sampleMemberIds : ['00000000-0000-0000-0000-000000000000'])}`;
  const realLink = (e) => e.source_url && !OWN_SITES.test(e.source_url);
  const keepEvents = seedEvents.filter((e) => KEEP_EVENTS.includes(e.slug) || (e.event_type === 'public_venue' && !e.host_member_id && realLink(e)));
  const dropEvents = seedEvents.filter((e) => !keepEvents.includes(e));

  // Rewards from shops that do not exist and the draw prizes (data/rewardsData.ts seeds): switched off, not deleted,
  // so a member's redeemed reward still reads. Campaigns whose prize is a draw stop showing (owner 2026-11-23: no draws)
  const sampleRewards = await sql`select slug, title from app.rewards where active and (slug in ${sql(SAMPLE_REWARDS)} or draw_entry is not null)`;
  const drawCampaigns = await sql`select c.slug from app.campaigns c left join app.rewards r on r.id = c.reward_id where c.published and (r.draw_entry is not null or c.slug like 'sample-%' or c.slug like 'flight-%' or c.slug = 'launch-2569')`;
  const sampleMoments = await sql`select id from app.moments where is_sample`;
  const [{ padded }] = await sql`select count(*)::int as padded from app.moments where sample_likes > 0 and not is_sample`;

  const sampleQuests = await sql`
    select q.id, q.slug, q.title, q.status,
           (select count(*) from app.quest_participants p join app.members m on m.id = p.member_id
             where p.quest_id = q.id and not (m.is_sample or m.email::text like '%@sample.invalid' or m.legacy_id like 'sample-guest-%'))::int as real_joins,
           (select count(*) from app.campaign_quests c where c.quest_id = q.id)::int as in_campaign
      from app.quests q where q.is_sample`;
  const dropQuests = sampleQuests.filter((q) => q.real_joins === 0 && q.in_campaign === 0);
  const endQuests = sampleQuests.filter((q) => !dropQuests.includes(q) && q.status !== 'ended');

  // What real members lose with the removed rows, so the report says it plainly
  const dropEventIds = dropEvents.map((e) => e.id);
  const none = ['00000000-0000-0000-0000-000000000000'];
  const [touch] = await sql`
    select
      (select count(*) from app.moments m where m.event_id in ${sql(dropEventIds.length ? dropEventIds : none)} and not m.is_sample)::int as real_moments_tagged,
      (select count(*) from app.saved_items s where s.event_id in ${sql(dropEventIds.length ? dropEventIds : none)})::int as saves,
      (select count(*) from app.visits v where v.event_id in ${sql(dropEventIds.length ? dropEventIds : none)})::int as visits,
      (select count(*) from app.follows f where f.followee_id in ${sql(sampleMemberIds.length ? sampleMemberIds : none)})::int as follows_of_samples`;

  const byType = (rows) => rows.reduce((m, e) => ((m[e.event_type] = (m[e.event_type] || 0) + 1), m), {});
  console.log(`database ${db.ref || db.name}`);
  console.log(`sample accounts: ${sampleMembers.length} (${sampleMembers.filter((m) => m.legacy_id?.startsWith('sample-guest-')).length} made-up guests)`);
  console.log(`sample ตี้/อีเวนต์ to remove: ${dropEvents.length}`, byType(dropEvents));
  console.log(`seed อีเวนต์ kept (real organiser page or in use): ${keepEvents.length}: ${keepEvents.map((e) => `${e.slug} ${e.title.slice(0, 40)}`).join(' | ')}`);
  console.log(`sample moments: ${sampleMoments.length} · real moments with made-up likes reset: ${padded}`);
  console.log(`sample challenges: remove ${dropQuests.length}, end ${endQuests.length} (real members joined or a campaign uses them): ${endQuests.map((q) => q.slug).join(', ')}`);
  console.log(`rewards switched off: ${sampleRewards.length} · draw campaigns unpublished: ${drawCampaigns.length} (${drawCampaigns.map((c) => c.slug).join(', ')})`);
  console.log(`real members touched: ${touch.real_moments_tagged} moments lose a tag to a removed ตี้, ${touch.saves} saves and ${touch.visits} visits of removed items go, ${touch.follows_of_samples} follows of sample accounts go`);

  if (!apply) {
    console.log('Nothing changed (add --apply).');
  } else {
    // Every row that will go or change, as it is now
    const backup = {
      at: new Date().toISOString(),
      database: db.ref || db.name,
      members: await sql`select * from app.members where id in ${sql(sampleMemberIds.length ? sampleMemberIds : none)}`,
      events: await sql`select * from app.events where id in ${sql(dropEventIds.length ? dropEventIds : none)}`,
      keptEvents: await sql`select * from app.events where id in ${sql(keepEvents.length ? keepEvents.map((e) => e.id) : none)}`,
      moments: await sql`select * from app.moments where is_sample or sample_likes > 0`,
      quests: await sql`select * from app.quests where is_sample`,
      participants: await sql`select * from app.event_participants where event_id in ${sql(dropEventIds.length ? dropEventIds : none)} or member_id in ${sql(sampleMemberIds.length ? sampleMemberIds : none)}`,
      settings: await sql`select * from app.app_settings where key = 'quest_seeds'`,
      rewards: await sql`select * from app.rewards where slug in ${sql(sampleRewards.length ? sampleRewards.map((r) => r.slug) : ['-'])}`,
      campaigns: await sql`select * from app.campaigns where slug in ${sql(drawCampaigns.length ? drawCampaigns.map((c) => c.slug) : ['-'])}`,
    };
    mkdirSync(new URL('../data/.backups/', import.meta.url), { recursive: true });
    const file = new URL(`../data/.backups/sample-removal-${backup.database}-${backup.at.replace(/[:.]/g, '-')}.json`, import.meta.url);
    writeFileSync(file, JSON.stringify(backup));
    console.log(`Backup written: ${file.pathname}`);

    await sql.begin(async (tx) => {
      if (keepEvents.length) await tx`update app.events set is_sample = false where id in ${tx(keepEvents.map((e) => e.id))}`;
      // Kept seed อีเวนต์ no longer claim our seed name as their source, nor our own site as their page
      if (keepEvents.length) await tx`update app.events set source_name = case when source_name = ${SEED_SOURCE} then null else source_name end, source_url = case when source_url ~ ${OWN_SITES.source} then null else source_url end where id in ${tx(keepEvents.map((e) => e.id))}`;
      if (dropEventIds.length) await tx`delete from app.events where id in ${tx(dropEventIds)}`;
      if (sampleMoments.length) await tx`delete from app.moments where id in ${tx(sampleMoments.map((m) => m.id))}`;
      await tx`update app.moments set sample_likes = 0 where sample_likes > 0`;
      if (dropQuests.length) await tx`delete from app.quests where id in ${tx(dropQuests.map((q) => q.id))}`;
      if (endQuests.length) await tx`update app.quests set status = 'ended' where id in ${tx(endQuests.map((q) => q.id))}`;
      if (sampleMemberIds.length) await tx`delete from app.members where id in ${tx(sampleMemberIds)}`;
      await tx`delete from app.app_settings where key = 'quest_seeds'`;
      if (sampleRewards.length) await tx`update app.rewards set active = false where slug in ${tx(sampleRewards.map((r) => r.slug))}`;
      if (drawCampaigns.length) await tx`update app.campaigns set published = false, show_on_home = false where slug in ${tx(drawCampaigns.map((c) => c.slug))}`;
    });
    console.log('Done.');
  }
} finally {
  await sql.end();
}
