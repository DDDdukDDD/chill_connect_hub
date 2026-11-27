// Puts the ATMBKK 2026 ตี้ of ทีม Chillwaa back (owner 2026-11-27). They were real staff ตี้, but the old save rule
// marked every ตี้ without a host member as sample, so the launch clean-up of 2026-11-24 removed them.
// - the three practice runs come back from the live backup, as ended ตี้ (with the one member who had joined, when
//   that account still exists);
// - one new ตี้ for each race day (Sat 28: after the half marathon, Sun 29: 10K and Family Run).
// Content: db/content/atmbkk-tee-2026.json. All rows are real (is_sample false), so the database needs a member as host:
// the Admin_Official account (owner 2026-11-27); the page still names ทีม Chillwaa. Safe to run more than once: a slug
// that is already there is skipped.
//
//   node db/restore-atmbkk-tee.mjs            development database (.env.development.local)
//   node db/restore-atmbkk-tee.mjs --live     live database (.env.local)
//   --host=<member legacy id>                 another host (the development copy has no Admin_Official)
import { readFileSync } from 'node:fs';
import { adminConnection, postgres } from './env.mjs';

const live = process.argv.includes('--live');
const hostLegacy = process.argv.find((a) => a.startsWith('--host='))?.slice(7) ?? 'mem_e0482ec8-abbe-4b57-a957-bace586c3b69'; // Admin_Official
const content = JSON.parse(readFileSync(new URL('./content/atmbkk-tee-2026.json', import.meta.url), 'utf8'));

const devUrl = () => {
  const line = readFileSync(new URL('../.env.development.local', import.meta.url), 'utf8').match(/^DATABASE_URL=(.*)$/m);
  if (!line) throw new Error('DATABASE_URL is not set in .env.development.local');
  return line[1].trim().replace(/^["']|["']$/g, '');
};
const sql = live ? adminConnection() : postgres(devUrl(), { max: 1, onnotice: () => {} });

const JSON_COLUMNS = new Set(['details', 'location']);
const toRow = (e) =>
  Object.fromEntries(Object.entries(e).map(([key, value]) => [key, JSON_COLUMNS.has(key) && value != null ? sql.json(value) : value]));

try {
  await sql.begin(async (tx) => {
    const wanted = [...content.restore, ...content.fresh].map((e) => e.slug);
    const there = new Set((await tx`select slug from app.events where slug in ${tx(wanted)}`).map((r) => r.slug));
    const [host] = await tx`select id from app.members where legacy_id = ${hostLegacy} and not is_sample`;
    if (!host) throw new Error(`host ${hostLegacy} is not a member here; pass --host=<legacy id>`);
    const hosted = (e, details) => ({ host_member_id: host.id, details: { ...details, createdByMemberId: hostLegacy } });
    const now = Date.now();
    let added = 0;

    for (const e of content.restore) {
      if (there.has(e.slug)) continue;
      const joined = content.participants.filter((p) => p.event_id === e.id);
      const members = joined.length ? new Set((await tx`select id from app.members where id in ${tx(joined.map((p) => p.member_id))}`).map((m) => m.id)) : new Set();
      const kept = joined.filter((p) => members.has(p.member_id));
      const row = { ...e, ...hosted(e, e.details), participants_count: 1 + kept.length, is_sample: false, sort_key: e.details.createdAtTimestamp ?? now };
      await tx`insert into app.events ${tx(toRow(row))}`;
      for (const p of kept) await tx`insert into app.event_participants ${tx(p)} on conflict do nothing`;
      added += 1;
      console.log(`back (ended): ${e.title}${kept.length ? ` + ${kept.length} member` : ''}`);
    }

    for (const [i, e] of content.fresh.entries()) {
      if (there.has(e.slug)) continue;
      const created = now + i;
      const row = { ...e, ...hosted(e, { ...e.details, createdAtTimestamp: created, isNew: true }), max_participants: e.details.maxParticipants, is_sample: false, sort_key: created };
      await tx`insert into app.events ${tx(toRow(row))}`;
      added += 1;
      console.log(`new: ${e.title}`);
    }
    console.log(`${live ? 'live' : 'development'}: ${added} ตี้ added, ${there.size} already there`);
  });
} finally {
  await sql.end();
}
