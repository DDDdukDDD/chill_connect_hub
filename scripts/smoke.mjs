// Smoke test of the flows members rely on (owner 2026-11-11), against the LOCAL dev server and the DEV database only.
//   npm run dev        (in another terminal)
//   npm run smoke
// Walks through the API: sign-up, posting, starter challenges and XP, "ไปกัน" from the bell and from a LINE link,
// plans, chat, the onboarding life map, admin retention. Every account it makes is deleted at the end, pass or fail.
import fs from 'node:fs';
import postgres from 'postgres';

const BASE = 'http://localhost:3000';
const read = (file, key) => {
  try {
    return fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8').match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1].trim().replace(/^"|"$/g, '');
  } catch {
    return undefined;
  }
};
const DEV_DB = read('.env.development.local', 'DATABASE_URL');
const LIVE_DB = read('.env.local', 'POSTGRES_URL') ?? read('.env.local', 'DATABASE_URL');
if (!DEV_DB) throw new Error('No DATABASE_URL in .env.development.local');
// Never the live database: the dev and live projects differ by their user name in the address
const dbUser = (url) => url?.match(/^[a-z]+:\/\/([^:]+):/)?.[1];
if (LIVE_DB && dbUser(DEV_DB) === dbUser(LIVE_DB)) throw new Error('The dev DATABASE_URL points at the live project. Stopped.');
const sql = postgres(DEV_DB, { max: 1, prepare: false, ssl: 'require' });

let passed = 0;
const failed = [];
const check = (label, ok, detail = '') => {
  if (ok) passed += 1;
  else failed.push(`${label}${detail ? ` (${detail})` : ''}`);
  console.log(`${ok ? '  ok ' : 'FAIL '} ${label}${!ok && detail ? ` — ${detail}` : ''}`);
};

function client() {
  const jar = {};
  return async (path, method = 'GET', body) => {
    const isForm = body instanceof FormData;
    const cookie = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
    const res = await fetch(BASE + path, { method, headers: { Origin: BASE, ...(cookie ? { Cookie: cookie } : {}), ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}) }, body: body ? (isForm ? body : JSON.stringify(body)) : undefined });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [kv] = c.split(';');
      const i = kv.indexOf('=');
      jar[kv.slice(0, i)] = kv.slice(i + 1);
    }
    const text = await res.text();
    try {
      return { status: res.status, ...JSON.parse(text) };
    } catch {
      return { status: res.status, text: text.slice(0, 120) };
    }
  };
}

const stamp = Date.now();
const EMAIL = (name) => `smoke${stamp}${name}@example.com`;
async function member(name) {
  const call = client();
  const reg = await call('/api/auth/member/register', 'POST', { email: EMAIL(name), password: 'Smoke!23456', displayName: `Smoke ${name}`, ageConfirmed: true, consent: true });
  if (!reg.member?.id) throw new Error(`register ${name}: ${reg.message ?? reg.status}`);
  // Email verification needs a mailer; on dev the address is marked verified directly
  await sql`update app.members set email_verified_at = now(), onboarded_at = now() where lower(email) = lower(${EMAIL(name)})`;
  await call('/api/auth/member/pledge', 'POST', { accept: true });
  return { call, id: reg.member.id };
}

async function upload(call) {
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(new URL('../public/images/onboarding/chill-cafe.jpg', import.meta.url))], { type: 'image/jpeg' }), 'moment.jpg');
  form.append('folder', 'moments');
  return (await call('/api/upload', 'POST', form)).url;
}

async function run() {
  const up = await fetch(`${BASE}/api/plans`).catch(() => null);
  if (!up) throw new Error(`The dev server is not running on ${BASE} (npm run dev)`);

  console.log('\nAccounts');
  const A = await member('a');
  const B = await member('b');
  const C = await member('c');
  check('three members signed up', Boolean(A.id && B.id && C.id));
  await A.call(`/api/members/${B.id}/actions`, 'POST', { action: 'follow' });
  await B.call(`/api/members/${A.id}/actions`, 'POST', { action: 'follow' });

  console.log('\nStarter challenges and the life map');
  const quests = (await A.call('/api/quests?limit=100')).quests ?? [];
  const starters = quests.filter((q) => q.rule?.posts);
  check('two starter challenges exist', starters.length === 2, `${starters.length} found; run node db/seed-starter-quests.mjs`);
  for (const q of starters) await A.call('/api/quests/join', 'POST', { questId: q.id, action: 'join' });
  const spots = (await A.call('/api/spots?province=%E0%B8%81%E0%B8%A3%E0%B8%B8%E0%B8%87%E0%B9%80%E0%B8%97%E0%B8%9E%E0%B8%AF&limit=5&hasImageOnly=true')).spots ?? [];
  const marked = await A.call('/api/visits', 'POST', { action: 'mark_many', targetIds: spots.slice(0, 3).map((s) => s.id) });
  check('life map marks places at once', marked.marked === Math.min(3, spots.length), JSON.stringify(marked).slice(0, 80));

  console.log('\nPosting');
  const cover = await upload(A.call);
  check('a photo uploads', Boolean(cover));
  const spot = spots[0];
  const post = await A.call('/api/moments', 'POST', { caption: 'smoke test', images: [cover], targetType: 'spot', targetId: spot.id, targetTitle: spot.title, location: spot.title, category: 'chill' });
  check('a moment at a place posts', post.status === 201, post.message);
  const rewards = await A.call('/api/rewards');
  const finished = (rewards.quests ?? []).filter((q) => starters.some((s) => s.id === q.questId) && q.completed);
  check('one post finishes both starter challenges', finished.length === 2, `${finished.length}/2`);
  check('starter XP counts', (rewards.points?.fromQuests ?? 0) >= 180, `fromQuests ${rewards.points?.fromQuests}`);

  console.log('\n"ไปกัน" from the bell');
  const momentId = post.moment.id;
  const invite = await A.call(`/api/moments/${momentId}/actions`, 'POST', { action: 'invite', to: [B.id] });
  check('A invites a friend', invite.status === 200, invite.message);
  const yes = await B.call(`/api/moments/${momentId}/actions`, 'POST', { action: 'invite_yes', inviter: A.id });
  check('B answers ไปกัน and gets a plan', Boolean(yes.planId), yes.message);
  const tomorrow = new Date(Date.now() + 7 * 3600e3 + 864e5).toISOString().slice(0, 10);
  const dated = await B.call(`/api/plans/${yes.planId}`, 'PATCH', { date: tomorrow });
  check('the day is set', dated.plan?.date === tomorrow, dated.message);
  const plans = (await A.call('/api/plans')).plans ?? [];
  const chat = plans[0] ? await A.call(`/api/chat/${encodeURIComponent(plans[0].roomId)}`) : { status: 0 };
  check('their chat opens with the day in it', chat.status === 200 && (chat.messages ?? []).some((m) => m.text.includes('นัดไป')), String(chat.status));
  const outsider = await C.call(`/api/plans/${yes.planId}`, 'PATCH', { date: tomorrow });
  check('someone else cannot change the plan', outsider.status === 404, String(outsider.status));

  console.log('\n"ไปกัน" from a LINE link');
  const link = await A.call(`/api/moments/${momentId}/actions`, 'POST', { action: 'invite_link' });
  check('A gets a signed link', Boolean(link.inviteLink), link.message);
  const token = decodeURIComponent(String(link.inviteLink).split('invite=')[1] ?? '');
  const forged = await C.call(`/api/moments/${momentId}/actions`, 'POST', { action: 'invite_yes', inviter: `${A.id}.AAAAAAAAAAAAAAAAAAAAAA` });
  check('a forged link is refused', forged.status === 404, String(forged.status));
  const viaLink = await C.call(`/api/moments/${momentId}/actions`, 'POST', { action: 'invite_yes', inviter: token });
  check('C answers through the link and gets a plan', Boolean(viaLink.planId), viaLink.message);
  const own = await A.call(`/api/moments/${momentId}/actions`, 'POST', { action: 'invite_yes', inviter: token });
  check('A cannot answer their own link', own.status === 404, String(own.status));

  console.log('\nAdmin');
  const password = read('.env.development.local', 'ADMIN_PASSWORD');
  if (password) {
    const admin = client();
    await admin('/api/auth/admin', 'POST', { password });
    const retention = await admin('/api/admin/retention');
    check('retention numbers load', retention.success === true && Array.isArray(retention.weeks), retention.error);
  } else {
    console.log('  (skipped: no ADMIN_PASSWORD in .env.development.local)');
  }
}

async function cleanUp() {
  const ids = (await sql`select id from app.members where email like ${`smoke${stamp}%@example.com`}`).map((r) => r.id);
  if (ids.length === 0) return;
  await sql`delete from app.friend_plans where inviter_id in ${sql(ids)} or friend_id in ${sql(ids)}`;
  await sql`delete from app.moments where author_id in ${sql(ids)}`;
  await sql`delete from app.members where id in ${sql(ids)}`;
  console.log(`\nCleaned up ${ids.length} test accounts`);
}

try {
  await run();
} catch (error) {
  failed.push(error.message);
  console.error(`\nStopped: ${error.message}`);
} finally {
  await cleanUp().catch((error) => console.error('Clean-up failed:', error.message));
  await sql.end();
}
console.log(`\n${passed} passed, ${failed.length} failed`);
if (failed.length) {
  for (const f of failed) console.log(`  - ${f}`);
  process.exit(1);
}
