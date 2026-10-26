// Loads today's JSON files (data/*.json, data/rewardsData.ts) into the app schema, in one transaction.
// Usage: npm run db:import -- --dry-run   check everything, then roll back
//        npm run db:import                import into an empty database
//        npm run db:import -- --replace   empty the imported tables first, then import
// Once the website runs with DATA_STORE=postgres the database is the live data: --replace then refuses while members
// signed up after the last import, unless --force is added too.
// Order follows docs/DATABASE_DESIGN.md §8. The JSON files are only read, never changed.
// Rows are built by lib/db/postgres/rows.mjs, the same code the website writes with.
// Not imported here: xp_ledger and member_stats (rebuilt with lib/social/questProgress.ts when rewards move),
// legacy mock tickets/hostWallet/reviews (owner decision 2), chat rooms whose ตี้ no longer exists.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { adminConnection } from './env.mjs';
import {
  dateOnly, eventToRow, memberToRows, placeImages, placeToRow, provinceCode, questToRow, strings, text, toDate, uuidV7, omit, eventTimes,
} from '../lib/db/postgres/rows.mjs';

const DRY_RUN = process.argv.includes('--dry-run');
const REPLACE = process.argv.includes('--replace');
const FORCE = process.argv.includes('--force');
const dataFile = (name) => new URL(`../data/${name}`, import.meta.url);
const readJson = (name, fallback = []) => (existsSync(dataFile(name)) ? JSON.parse(readFileSync(dataFile(name), 'utf8')) : fallback);

const warnings = [];
const warn = (note) => warnings.push(note);
const counts = {};

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // lib/social/friends.ts
const usedInviteCodes = new Set();
function inviteCode(existing) {
  const wanted = text(existing)?.toUpperCase();
  if (wanted && /^[A-Z0-9]{4,12}$/.test(wanted) && !usedInviteCodes.has(wanted)) {
    usedInviteCodes.add(wanted);
    return wanted;
  }
  let code;
  do code = Array.from(randomBytes(6), (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
  while (usedInviteCodes.has(code));
  usedInviteCodes.add(code);
  return code;
}

// ---------- read everything ----------

const master = readJson('master_data.json', {});
const hub = readJson('chill_database.json', {});
const discovery = readJson('discovery_content.json', {});
const members = readJson('members.json');
const staff = readJson('staff_accounts.json');
const moments = readJson('moments.json');
const visits = readJson('visits.json');
const questJoins = readJson('quest_joins.json');
const notifications = readJson('notifications.json');
const campaigns = readJson('campaigns.json');
const chat = readJson('chat_messages.json');
const auditLog = readJson('audit_log.json');
const placesUsage = readJson('google_places_usage.json', null);

// Stores that are empty today. Stop rather than drop data if one fills up before this script learns its shape.
for (const name of ['waitlist', 'quest_finishes', 'quest_vouchers', 'redemptions', 'reviews', 'stories', 'event_questions', 'fair_groups', 'meet_again', 'content_reports']) {
  if (readJson(`${name}.json`).length > 0) throw new Error(`data/${name}.json has rows, but this importer does not handle it yet.`);
}
if (moments.some((moment) => moment.reports?.length)) throw new Error('moment reports are not handled yet.');

// Rewards live in code; load the TypeScript file without a build step (it has no imports)
function loadRewards() {
  const ts = createRequire(import.meta.url)('typescript');
  const source = readFileSync(new URL('../data/rewardsData.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const loaded = { exports: {} };
  new Function('module', 'exports', outputText)(loaded, loaded.exports);
  return loaded.exports.REWARD_SHOP_ITEMS;
}
const rewards = loadRewards();

// ---------- reference data ----------

const provinceCodes = new Set((master.provinces ?? []).map((p) => p.id));
function provinceOf(value, where) {
  const code = provinceCode(value, provinceCodes);
  if (!code && value && value !== 'ออนไลน์') warn(`${where}: unknown province "${value}", left empty`);
  return code;
}
const ref = (item) => ({ active: item.active !== false, sort_order: item.sortOrder ?? 0, built_in: !!item.builtIn });

const provinceRows = (master.provinces ?? []).map((p) => ({
  code: p.id, display_name: p.displayName ?? p.id, name_en: p.nameEn ?? '', region: p.region ?? '', tagline: p.tagline ?? '',
  description: p.description ?? '', image_url: text(p.image), featured: !!p.featured, ...ref(p),
}));
const zoneRows = (master.zones ?? []).map((z) => ({ code: z.id, name: z.name, province_code: provinceOf(z.province, `zone ${z.id}`), ...ref(z) }));

const CATEGORY_LISTS = { spotVibes: 'place', communityMoods: 'mood', communityCategories: 'community', fairCategories: 'fair', questCategories: 'quest' };
const categoryRows = Object.entries(CATEGORY_LISTS).flatMap(([list, pillar]) =>
  (master[list] ?? []).map((c) => ({
    pillar, code: c.id, name: c.name, name_en: c.nameEn ?? '', description: c.description ?? '', keywords: strings(c.keywords),
    icon_key: text(c.iconKey), color_key: text(c.colorKey), image_url: text(c.image), ...ref(c), parent: c.parentId ?? null,
  })),
);

const venueCodes = new Set((master.venues ?? []).map((v) => v.id));
const venueRows = (master.venues ?? []).map((v) => ({
  code: v.id, name: v.name, venue_tag: text(v.venueTag), province_code: provinceOf(v.province, `venue ${v.id}`),
  location: v.location ?? '', transit_hint: v.transitHint ?? '', extra: omit(v, ['id', 'name', 'venueTag', 'province', 'location', 'transitHint', 'active', 'sortOrder', 'builtIn']), ...ref(v),
}));
const venueGroupRows = (master.venueGroups ?? []).map((g) => ({
  code: g.id, name: g.name, name_en: g.nameEn ?? '', subtitle: g.subtitle ?? '', image_url: text(g.image), keywords: strings(g.keywords), ...ref(g),
}));
const clubRows = (master.communityClubs ?? []).map((c) => ({
  code: c.id, name: c.name, name_en: c.nameEn ?? '', subtitle: c.subtitle ?? '', image_url: text(c.image),
  extra: omit(c, ['id', 'name', 'nameEn', 'subtitle', 'image', 'active', 'sortOrder', 'builtIn']), ...ref(c),
}));

const settingRows = [
  { key: 'auto_publish', value: !!hub.autoPublish },
  { key: 'master_data_version', value: master.version ?? null },
  { key: 'imported_at', value: new Date().toISOString() },
  // Which seed challenges the store already has (lib/questLifecycle.ts)
  { key: 'quest_seeds', value: { ids: discovery.questSeedIds ?? [], textVersion: discovery.questSeedTextVersion ?? null } },
];

const sourceRows = (hub.sources ?? []).map((s) => ({
  id: uuidV7(s.lastRunAt ?? s.lastScraped), code: s.id, name: s.name, url: s.url ?? '', target_type: s.targetType === 'spots' ? 'place' : 'event',
  category: text(s.category), status: ['active', 'paused', 'error'].includes(s.status) ? s.status : 'paused', description: s.description ?? '',
  extra: omit(s, ['id', 'name', 'url', 'targetType', 'category', 'status', 'description']),
}));

// ---------- places, ตี้ + อีเวนต์, challenges (ids first: members point at them) ----------

const placeIds = new Map();
const placeRows = [];
const placeImageRows = [];
const spots = discovery.spots ?? [];
for (const [index, s] of spots.entries()) {
  const row = placeToRow(s, { provinceCodes, sortKey: spots.length - index });
  if (!row) { warn(`place ${s.id}: skipped, unknown province "${s.province}"`); continue; }
  placeIds.set(s.id, row.id);
  placeRows.push(row);
  placeImageRows.push(...placeImages(s, row.id));
}

const eventIds = new Map();
for (const e of hub.events ?? []) eventIds.set(e.id, uuidV7(toDate(e.createdAt) ?? toDate(e.createdAtTimestamp)));

const questIds = new Map();
const seedQuestIds = new Set(discovery.questSeedIds ?? []);
const questRows = (discovery.quests ?? []).map((q, index, all) => {
  const row = questToRow(q, { isSample: seedQuestIds.has(q.id), sortKey: all.length - index });
  questIds.set(q.id, row.id);
  return row;
});

// ---------- members (and the sample guests who only exist inside ตี้ lists) ----------

const memberIds = new Map();
for (const m of members) memberIds.set(m.id, uuidV7(m.createdAt));
const participantLists = hub.participants ?? {};
const sampleGuests = new Map();
for (const list of Object.values(participantLists)) {
  for (const p of list) {
    if (memberIds.has(p.userId)) continue;
    if (!String(p.userId).startsWith('sample')) throw new Error(`participant ${p.userId} is not a member and not a sample guest`);
    memberIds.set(p.userId, uuidV7(p.joinedAt));
    // ตี้ lists hold seed guests ("sample-guest-1-0") who never had an account: they become sample members
    sampleGuests.set(p.userId, { id: p.userId, displayName: text(p.userName) ?? 'สมาชิกตัวอย่าง', avatarUrl: p.userAvatar, providers: [], status: 'active', sessionVersion: 1, isSample: true, createdAt: p.joinedAt });
  }
}
const memberOf = (legacyId) => memberIds.get(legacyId) ?? null;

const memberParts = [...members, ...sampleGuests.values()].map((m) =>
  memberToRows(m, { id: memberOf(m.id), inviteCode: inviteCode(m.inviteCode), invitedBy: memberOf(m.invitedBy), provinceCode: provinceOf(m.preferences?.province, `member ${m.id}`) }),
);
const memberRows = memberParts.map((p) => p.member);
const isSampleMember = new Set(memberRows.filter((m) => m.is_sample).map((m) => m.legacy_id));
const pick = (key) => memberParts.flatMap((p) => p[key]);

const followRows = [];
const blockRows = [];
const savedRows = [];
const memberReportRows = [];
const cancelledRows = [];
for (const part of memberParts) {
  const id = part.member.id;
  for (const other of part.followingIds) if (memberIds.has(other)) followRows.push({ follower_id: id, followee_id: memberOf(other) });
  for (const other of part.blockedIds) if (memberIds.has(other)) blockRows.push({ blocker_id: id, blocked_id: memberOf(other) });
  part.savedSpotIds.forEach((spot, i) => placeIds.has(spot) && savedRows.push({ member_id: id, place_id: placeIds.get(spot), event_id: null, created_at: new Date(Date.now() - i) }));
  part.savedEventIds.forEach((event, i) => eventIds.has(event) && savedRows.push({ member_id: id, place_id: null, event_id: eventIds.get(event), created_at: new Date(Date.now() - i) }));
  for (const r of part.reportsReceived) {
    memberReportRows.push({ id: uuidV7(r.at), target_type: 'member', target_id: part.member.legacy_id, reporter_id: memberOf(r.byId), reason: r.reason ?? '', created_at: toDate(r.at) ?? new Date() });
  }
  for (const c of part.cancelledEvents) if (eventIds.has(c.eventId)) cancelledRows.push({ legacyEvent: c.eventId, member_id: id, at: toDate(c.at) ?? new Date() });
}

const staffIds = new Map(staff.map((s) => [s.id, uuidV7(s.createdAt)]));
const staffRows = staff.map((s) => ({
  id: staffIds.get(s.id), legacy_id: s.id, email: s.email.toLowerCase(), name: s.name, role: s.role, status: s.status,
  password_hash: s.passwordHash, session_version: s.sessionVersion ?? 1, created_by: staffIds.get(s.createdBy) ?? null,
  last_login_at: toDate(s.lastLoginAt), created_at: toDate(s.createdAt) ?? new Date(),
}));

// ---------- ตี้ + อีเวนต์ rows ----------

const seriesIds = new Map();
const seriesRows = [];
const eventRows = (hub.events ?? []).map((e, index, all) => {
  const hostLegacy = [e.createdByMemberId, e.hostId].find((h) => memberIds.has(h));
  const hostId = memberOf(hostLegacy);
  if (e.seriesId && !seriesIds.has(e.seriesId)) {
    seriesIds.set(e.seriesId, uuidV7(e.createdAt));
    seriesRows.push({ id: seriesIds.get(e.seriesId), legacy_id: e.seriesId, host_member_id: hostId, recurrence: e.recurrence ?? {} });
  }
  if (eventTimes(e).guessed) warn(`event ${e.id}: no date in "${e.date}", used its creation day`);
  const isSample = e.eventType === 'community' && (!hostId || isSampleMember.has(hostLegacy));
  // participantsCount is the site's own counter (seed head counts included); joins and leaves move it
  return eventToRow(e, { id: eventIds.get(e.id), provinceCodes, venueCodes, hostId, placeId: placeIds.get(e.spotId ?? e.placeId), seriesId: seriesIds.get(e.seriesId), isSample, sortKey: all.length - index });
});
for (const e of hub.events ?? []) if (!provinceCode(e.province, provinceCodes)) provinceOf(e.province, `event ${e.id}`);

const participantRows = [];
for (const [legacyEvent, list] of Object.entries(participantLists)) {
  const eventId = eventIds.get(legacyEvent);
  if (!eventId) { warn(`participants of missing event ${legacyEvent} skipped`); continue; }
  const seen = new Set();
  const codes = new Set();
  const newCode = () => Array.from(randomBytes(6), (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
  for (const p of list) {
    const memberId = memberOf(p.userId);
    if (seen.has(memberId)) continue;
    seen.add(memberId);
    let ticket = text(p.ticketCode) ?? newCode();
    while (codes.has(ticket)) ticket = newCode();
    codes.add(ticket);
    participantRows.push({ event_id: eventId, member_id: memberId, status: 'joined', ticket_code: ticket, joined_at: toDate(p.joinedAt) ?? new Date(), cancelled_at: null, checked_in_at: toDate(p.checkedInAt), note: text(p.note) });
  }
  for (const c of cancelledRows.filter((row) => row.legacyEvent === legacyEvent && !seen.has(row.member_id))) {
    participantRows.push({ event_id: eventId, member_id: c.member_id, status: 'cancelled', ticket_code: newCode(), joined_at: c.at, cancelled_at: c.at, checked_in_at: null, note: null });
  }
}

// ---------- challenge joins, rewards, campaigns ----------

const questParticipantRows = [];
for (const join of questJoins) {
  const questId = questIds.get(join.questId);
  const memberId = memberOf(join.memberId);
  if (!questId || !memberId) { warn(`quest join ${join.id} skipped: quest or member missing`); continue; }
  questParticipantRows.push({ quest_id: questId, member_id: memberId, joined_at: toDate(join.joinedAt) ?? new Date() });
}

const rewardIds = new Map();
const rewardRows = rewards.map((r, index) => {
  rewardIds.set(r.id, uuidV7());
  return {
    id: rewardIds.get(r.id), slug: r.id, title: r.title, category: r.category, category_label: r.categoryLabel ?? '', description: r.description ?? '',
    partner: r.partner ?? '', partner_location: r.partnerLocation ?? '', icon_name: r.iconName ?? '', cost_xp: r.costXp, stock_count: Math.max(0, r.stockCount ?? 0),
    discount_value: r.discountValue ?? '', valid_until: dateOnly(r.validUntil), terms: strings(r.terms), featured: !!r.featured, draw_entry: r.drawEntry ?? null,
    partner_code: r.drawEntry ? null : text(r.voucherCode), active: true, sort_order: index,
  };
});

const campaignRows = [];
const campaignQuestRows = [];
for (const c of campaigns) {
  const id = uuidV7(c.createdAt);
  campaignRows.push({
    id, slug: c.id, name: c.name, eyebrow: c.eyebrow ?? '', headline: c.headline ?? '', body: c.text ?? '', strip_text: c.stripText ?? '', cta: c.cta ?? '',
    starts_on: dateOnly(c.startDate), ends_on: dateOnly(c.endDate), prize_image: text(c.prizeImage), reward_id: rewardIds.get(c.rewardId) ?? null,
    show_on_home: !!c.showOnHome, published: !!c.published, created_at: toDate(c.createdAt) ?? new Date(), updated_at: toDate(c.updatedAt) ?? new Date(),
  });
  const added = new Set();
  for (const [role, list] of [['step', c.questIds], ['extra', c.extraQuestIds]]) {
    (list ?? []).forEach((legacy, sort) => {
      const questId = questIds.get(legacy);
      if (!questId) return warn(`campaign ${c.id}: quest ${legacy} missing`);
      if (added.has(questId)) return;
      added.add(questId);
      campaignQuestRows.push({ campaign_id: id, quest_id: questId, role, sort_order: sort });
    });
  }
}

// ---------- moments and visits ----------

const momentIds = new Map();
const momentRows = [];
const momentImageRows = [];
const likeRows = [];
const saveRows = [];
const commentRows = [];
function targetOf(type, legacyId, where) {
  const target = { place_id: null, event_id: null, quest_id: null };
  if (type === 'spot') target.place_id = placeIds.get(legacyId) ?? null;
  else if (type === 'community' || type === 'fair') target.event_id = eventIds.get(legacyId) ?? null;
  else if (type === 'challenge') target.quest_id = questIds.get(legacyId) ?? null;
  if (type && type !== 'general' && !Object.values(target).some(Boolean)) warn(`${where}: ${type} ${legacyId} missing, link dropped`);
  return target;
}
for (const mo of moments) {
  const id = uuidV7(mo.createdAt);
  momentIds.set(mo.id, id);
  const authorId = memberOf(mo.authorId);
  const likes = [...new Set(mo.likedBy ?? [])].filter((m) => memberIds.has(m));
  const saves = [...new Set(mo.savedBy ?? [])].filter((m) => memberIds.has(m));
  const comments = (mo.comments ?? []).filter((c) => text(c.text));
  momentRows.push({
    id, slug: mo.id, author_id: authorId, author_name: authorId ? null : text(mo.authorName), author_avatar: authorId ? null : text(mo.authorAvatar),
    caption: (mo.caption ?? '').slice(0, 500), location_text: mo.location ?? '', category: ['heal', 'move', 'chill', 'learn'].includes(mo.category) ? mo.category : null,
    ...targetOf(mo.targetType, mo.targetId, `moment ${mo.id}`), target_title: text(mo.targetTitle),
    status: ['published', 'hidden', 'removed'].includes(mo.status) ? mo.status : 'published', image_ratio: mo.imageRatio ?? null,
    like_count: likes.length, comment_count: comments.length, save_count: saves.length, sample_likes: mo.sampleLikes ?? 0,
    is_sample: !!mo.isSample || !authorId, created_at: toDate(mo.createdAt) ?? new Date(),
  });
  strings(mo.images).slice(0, 10).forEach((url, position) => momentImageRows.push({ moment_id: id, position, url }));
  for (const m of likes) likeRows.push({ moment_id: id, member_id: memberOf(m) });
  for (const m of saves) saveRows.push({ moment_id: id, member_id: memberOf(m) });
  for (const c of comments) {
    const author = memberOf(c.authorId);
    commentRows.push({ id: uuidV7(c.createdAt), moment_id: id, author_id: author, author_name: author ? null : text(c.authorName), body: c.text.trim().slice(0, 300), created_at: toDate(c.createdAt) ?? new Date() });
  }
}

const visitRows = [];
for (const v of visits) {
  const memberId = memberOf(v.memberId);
  const target = targetOf(v.targetType, v.targetId, `visit ${v.id}`);
  if (!memberId || (!target.place_id && !target.event_id)) { warn(`visit ${v.id} skipped`); continue; }
  const reviewed = Number.isInteger(v.rating) || text(v.review);
  visitRows.push({
    id: uuidV7(v.createdAt), member_id: memberId, place_id: target.place_id, event_id: target.event_id, evidence: 'marked', moment_id: null, pending: false,
    rating: Number.isInteger(v.rating) ? v.rating : null, review: text(v.review), reviewed_at: reviewed ? toDate(v.reviewedAt ?? v.createdAt) : null,
    created_at: toDate(v.createdAt) ?? new Date(),
  });
}

const notificationRows = [];
for (const n of notifications) {
  const recipient = memberOf(n.memberId);
  if (!recipient) { warn(`notification ${n.id} skipped: member missing`); continue; }
  notificationRows.push({
    id: uuidV7(n.createdAt), recipient_id: recipient, type: n.type, actor_id: memberOf(n.actorId), moment_id: momentIds.get(n.momentId) ?? null,
    event_id: eventIds.get(n.eventId) ?? null, quest_id: questIds.get(n.questId) ?? null, preview: text(n.preview)?.slice(0, 200) ?? null,
    read_at: n.read ? toDate(n.readAt ?? n.createdAt) : null, created_at: toDate(n.createdAt) ?? new Date(),
  });
}

// ---------- chat ----------

const roomIds = new Map();
const roomRows = [];
const roomMemberRows = [];
const messageRows = [];
let orphanMessages = 0;
function roomOf(legacy) {
  if (roomIds.has(legacy)) return roomIds.get(legacy);
  let room = null;
  if (eventIds.has(legacy)) {
    room = { id: uuidV7(), legacy_id: legacy, kind: 'event', event_id: eventIds.get(legacy), fair_group_id: null, last_message_at: null };
    const event = eventRows.find((e) => e.id === room.event_id);
    const people = new Set(participantRows.filter((p) => p.event_id === room.event_id && p.status === 'joined').map((p) => p.member_id));
    if (event.host_member_id) people.add(event.host_member_id);
    for (const member_id of people) roomMemberRows.push({ room_id: room.id, member_id });
  } else if (legacy.startsWith('pair~')) {
    const pair = legacy.split('~').slice(1).map(memberOf);
    if (pair.length === 2 && pair.every(Boolean)) {
      room = { id: uuidV7(), legacy_id: legacy, kind: 'direct', event_id: null, fair_group_id: null, last_message_at: null };
      for (const member_id of pair) roomMemberRows.push({ room_id: room.id, member_id });
    }
  }
  if (room) roomRows.push(room);
  roomIds.set(legacy, room?.id ?? null);
  return room?.id ?? null;
}
for (const message of [...chat].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))) {
  const roomId = roomOf(message.roomId);
  const body = text(message.text);
  if (!roomId || !body) { orphanMessages++; continue; }
  messageRows.push({ id: uuidV7(message.createdAt), room_id: roomId, author_id: memberOf(message.authorId), body: body.slice(0, 1000), created_at: toDate(message.createdAt) ?? new Date() });
  roomRows.find((r) => r.id === roomId).last_message_at = toDate(message.createdAt);
}
if (orphanMessages) warn(`${orphanMessages} chat messages skipped: their ตี้ no longer exists`);

// ---------- audit log ----------

const auditRows = [...auditLog]
  .sort((a, b) => (a.at < b.at ? -1 : 1))
  .map((a) => ({
    at: toDate(a.at) ?? new Date(),
    actor_kind: String(a.actorId ?? '').startsWith('mem_') ? 'member' : a.actorRole && a.actorRole !== 'unknown' ? 'staff' : 'system',
    actor_id: text(a.actorId), actor_name: text(a.actorName), actor_role: text(a.actorRole), action: a.action ?? 'unknown',
    target_type: a.targetType ?? 'unknown', target_id: text(a.targetId), summary: a.summary ?? '', meta: { legacyId: a.id },
  }));

const usageRows = placesUsage?.month ? [{ service: 'google_places', month: `${placesUsage.month}-01`, calls: placesUsage.calls ?? 0 }] : [];

// ---------- write ----------

const IMPORTED_TABLES = [
  'audit_log', 'chat_messages', 'chat_room_members', 'chat_rooms', 'notifications', 'visits', 'moment_comments', 'moment_saves', 'moment_likes',
  'moment_images', 'moments', 'campaign_quests', 'campaigns', 'rewards', 'quest_participants', 'quests', 'saved_items', 'blocks', 'follows',
  'content_reports', 'event_participants', 'events', 'event_series', 'place_images', 'places', 'host_applications', 'member_risk_flags',
  'member_consents', 'member_interests', 'member_profiles', 'member_tokens', 'member_auth_providers', 'member_credentials', 'members',
  'staff_accounts', 'sources', 'api_usage', 'app_settings', 'community_clubs', 'venue_groups', 'venues', 'categories', 'zones', 'provinces',
];

const JSON_COLUMNS = new Set(['extra', 'value', 'recurrence', 'contact', 'details', 'steps', 'rule', 'brand_reward', 'draw_entry', 'meta']);

const sql = adminConnection();
async function insert(tx, table, rows, batch = 300) {
  counts[table] = rows.length;
  if (rows.length === 0) return;
  const columns = Object.keys(rows[0]);
  for (let i = 0; i < rows.length; i += batch) {
    const chunk = rows.slice(i, i + batch).map((row) =>
      Object.fromEntries(columns.map((c) => [c, JSON_COLUMNS.has(c) && row[c] !== null && row[c] !== undefined ? tx.json(row[c]) : row[c] ?? null])),
    );
    await tx`insert into ${tx(`app.${table}`)} ${tx(chunk, columns)}`;
  }
}

class Rollback extends Error {}
try {
  await sql.begin(async (tx) => {
    const [{ n }] = await tx`select count(*)::int as n from app.members`;
    if (n > 0 && !REPLACE) throw new Error(`app.members already has ${n} rows. Run with --replace to empty the imported tables first.`);
    if (REPLACE && !FORCE) {
      const [newer] = await tx`select count(*)::int as n from app.members m, app.app_settings s
                               where s.key = 'imported_at' and m.created_at > (s.value #>> '{}')::timestamptz`;
      if (newer?.n > 0) throw new Error(`${newer.n} members signed up after the last import; the database is live. Add --force to wipe them anyway.`);
    }
    if (REPLACE) await tx.unsafe(`truncate ${IMPORTED_TABLES.map((t) => `app.${t}`).join(', ')} restart identity cascade`);

    await insert(tx, 'provinces', provinceRows);
    await insert(tx, 'zones', zoneRows);
    await insert(tx, 'categories', categoryRows.map((row) => omit(row, ['parent'])));
    for (const c of categoryRows.filter((row) => row.parent)) {
      await tx`update app.categories child set parent_id = parent.id from app.categories parent
               where child.pillar = ${c.pillar} and child.code = ${c.code} and parent.pillar = ${c.pillar} and parent.code = ${c.parent}`;
    }
    await insert(tx, 'venue_groups', venueGroupRows);
    await insert(tx, 'venues', venueRows);
    await insert(tx, 'community_clubs', clubRows);
    await insert(tx, 'app_settings', settingRows);
    await insert(tx, 'sources', sourceRows);
    await insert(tx, 'api_usage', usageRows);

    await insert(tx, 'staff_accounts', staffRows);
    // invited_by points at other members: insert without it, then link
    await insert(tx, 'members', memberRows.map((row) => ({ ...row, invited_by: null })));
    for (const row of memberRows.filter((m) => m.invited_by)) await tx`update app.members set invited_by = ${row.invited_by} where id = ${row.id}`;
    await insert(tx, 'member_credentials', pick('credentials'));
    await insert(tx, 'member_auth_providers', pick('providers'));
    await insert(tx, 'member_tokens', pick('tokens'));
    await insert(tx, 'member_profiles', pick('profile'));
    await insert(tx, 'member_interests', pick('interests'));
    await insert(tx, 'member_consents', pick('consents'));
    await insert(tx, 'member_risk_flags', pick('riskFlags'));
    await insert(tx, 'host_applications', pick('hostApplications'));
    await insert(tx, 'follows', followRows);
    await insert(tx, 'blocks', blockRows);

    await insert(tx, 'places', placeRows, 200);
    await insert(tx, 'place_images', placeImageRows, 1000);
    await insert(tx, 'event_series', seriesRows);
    await insert(tx, 'events', eventRows);
    await insert(tx, 'quests', questRows);
    await insert(tx, 'rewards', rewardRows);
    await insert(tx, 'campaigns', campaignRows);
    await insert(tx, 'campaign_quests', campaignQuestRows);

    await insert(tx, 'event_participants', participantRows, 1000);
    await insert(tx, 'quest_participants', questParticipantRows);
    await insert(tx, 'saved_items', savedRows);
    await insert(tx, 'content_reports', memberReportRows);

    await insert(tx, 'moments', momentRows);
    await insert(tx, 'moment_images', momentImageRows);
    await insert(tx, 'moment_likes', likeRows);
    await insert(tx, 'moment_saves', saveRows);
    await insert(tx, 'moment_comments', commentRows);
    await insert(tx, 'visits', visitRows);
    await insert(tx, 'notifications', notificationRows);

    await insert(tx, 'chat_rooms', roomRows);
    await insert(tx, 'chat_room_members', roomMemberRows, 1000);
    await insert(tx, 'chat_messages', messageRows);
    await insert(tx, 'audit_log', auditRows, 500);

    if (DRY_RUN) throw new Rollback();
  });
  console.log('Imported (one transaction):');
} catch (error) {
  if (!(error instanceof Rollback)) {
    console.error(`Import failed, nothing was written: ${error.message}`);
    if (error.detail) console.error(error.detail);
    process.exitCode = 1;
  } else {
    console.log('Dry run: every row was inserted and checked, then rolled back. Would import:');
  }
} finally {
  await sql.end();
}

if (!process.exitCode) {
  for (const [table, n] of Object.entries(counts)) if (n) console.log(`  ${table.padEnd(22)} ${n}`);
  if (warnings.length) {
    console.log(`\n${warnings.length} notes:`);
    for (const note of warnings.slice(0, 30)) console.log(`  - ${note}`);
    if (warnings.length > 30) console.log(`  … and ${warnings.length - 30} more`);
  }
}
