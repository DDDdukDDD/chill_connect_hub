// Row mapping between the website's objects and the app schema, shared by the website (lib/db/postgres)
// and the import script (db/import-from-json.mjs) so both write exactly the same rows.
// Rule: `details` keeps the whole original object, minus fields that a typed column gives back exactly.
// Typed columns are copies used for filtering, joining and constraints. Reading = { ...exact columns, ...details }.
// Plain JavaScript (no imports) so Node can run it without a build step.

/* ---------- small helpers ---------- */

export function toDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
export const iso = (value) => toDate(value)?.toISOString();
export const text = (value) => (typeof value === 'string' && value.trim() !== '' ? value.trim() : null);
export const strings = (value) => (Array.isArray(value) ? value.filter((v) => typeof v === 'string' && v.trim() !== '') : []);
export const omit = (object, keys) => Object.fromEntries(Object.entries(object).filter(([key, value]) => !keys.includes(key) && value !== undefined));
/** Like omit, but a field stays in details when its column would not give it back unchanged ("", spaces, empty items) */
const columnTrip = (value) => (typeof value === 'string' ? text(value) : Array.isArray(value) && value.every((v) => typeof v === 'string') ? strings(value) : value);
export const detailsOf = (object, exactKeys) =>
  omit(object, exactKeys.filter((key) => JSON.stringify(columnTrip(object[key])) === JSON.stringify(object[key])));
/** Drops null/undefined so a read gives the same shape the JSON store had */
export const compact = (object) => Object.fromEntries(Object.entries(object).filter(([, value]) => value !== null && value !== undefined));
export const point = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? `SRID=4326;POINT(${lng} ${lat})` : null;

/** UUIDv7 from a row's own time, so rows keep their order in the index */
export function uuidV7(at) {
  const ms = BigInt(Math.max(0, Math.floor(toDate(at)?.getTime() ?? Date.now())));
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  for (let i = 0; i < 6; i++) bytes[i] = Number((ms >> BigInt(8 * (5 - i))) & 0xffn);
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/* ---------- Thai dates ("23 ต.ค. 2569", "5 - 9 พ.ย. 2026", "20:00 - 23:00 น.") in Bangkok time ---------- */

const MONTHS = {
  'ม.ค.': 0, 'มกราคม': 0, 'jan': 0, 'ก.พ.': 1, 'กุมภาพันธ์': 1, 'feb': 1, 'มี.ค.': 2, 'มีนาคม': 2, 'mar': 2,
  'เม.ย.': 3, 'เมษายน': 3, 'apr': 3, 'พ.ค.': 4, 'พฤษภาคม': 4, 'may': 4, 'มิ.ย.': 5, 'มิถุนายน': 5, 'jun': 5,
  'ก.ค.': 6, 'กรกฎาคม': 6, 'jul': 6, 'ส.ค.': 7, 'สิงหาคม': 7, 'aug': 7, 'ก.ย.': 8, 'กันยายน': 8, 'sep': 8,
  'ต.ค.': 9, 'ตุลาคม': 9, 'oct': 9, 'พ.ย.': 10, 'พฤศจิกายน': 10, 'nov': 10, 'ธ.ค.': 11, 'ธันวาคม': 11, 'dec': 11,
};
const monthPattern = Object.keys(MONTHS).sort((a, b) => b.length - a.length).map((m) => m.replace(/\./g, '\\.')).join('|');
const dayPattern = new RegExp(`(?<!\\d|:)(\\d{1,2})(?![\\d:])\\s*(${monthPattern})?\\s*(\\d{4})?`, 'giu');
const ceYear = (year) => (year > 2400 ? year - 543 : year);

/** Every calendar day written in a text, filling a missing month/year from the next day ("5 - 9 พ.ย. 2026") */
export function thaiDays(value) {
  const str = (value ?? '').toString().trim().toLowerCase();
  if (!str) return [];
  const isoDay = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoDay) return [{ y: ceYear(+isoDay[1]), m: +isoDay[2] - 1, d: +isoDay[3] }];
  const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) return [{ y: ceYear(+dmy[3]), m: +dmy[2] - 1, d: +dmy[1] }];
  const found = [...str.matchAll(dayPattern)].map((match) => ({
    d: +match[1],
    m: match[2] ? MONTHS[match[2]] : undefined,
    y: match[3] ? ceYear(+match[3]) : undefined,
  }));
  for (let i = found.length - 2; i >= 0; i--) {
    found[i].m ??= found[i + 1].m;
    found[i].y ??= found[i + 1].y;
  }
  return found.filter((day) => day.m !== undefined && day.d >= 1 && day.d <= 31).map((day) => ({ ...day, y: day.y ?? 2026 }));
}

export const bangkok = ({ y, m, d }, hh = 0, mm = 0, ss = 0) => new Date(Date.UTC(y, m, d, hh - 7, mm, ss));

/** starts_at / ends_at from an event's date, endDate and time texts; no time = the whole day */
export function eventTimes(event, fallback = new Date()) {
  const startDays = thaiDays(event.date);
  const endDays = thaiDays(event.endDate);
  const start = startDays[0];
  const end = endDays.at(-1) ?? startDays.at(-1);
  const times = [...(event.time ?? '').matchAll(/(\d{1,2})[:.](\d{2})/g)].map((t) => [+t[1], +t[2]]);
  if (!start) {
    const at = toDate(fallback) ?? new Date();
    const day = { y: at.getUTCFullYear(), m: at.getUTCMonth(), d: at.getUTCDate() };
    return { startsAt: bangkok(day), endsAt: bangkok(day, 23, 59, 59), guessed: true };
  }
  const startsAt = bangkok(start, ...(times[0] ?? [0, 0]));
  let endsAt = times[1] ? bangkok(end, ...times[1]) : bangkok(end, 23, 59, 59);
  if (endsAt < startsAt) endsAt = new Date(endsAt.getTime() + 24 * 3600 * 1000); // past midnight
  return { startsAt, endsAt, guessed: false };
}

/** A date-only value ("2027-01-05", "31 ธ.ค. 2569") as YYYY-MM-DD */
export function dateOnly(value) {
  const day = thaiDays(value)[0];
  return day ? `${day.y}-${String(day.m + 1).padStart(2, '0')}-${String(day.d).padStart(2, '0')}` : null;
}

export const PROVINCE_ALIASES = { 'กรุงเทพมหานคร': 'กรุงเทพฯ', 'ออนไลน์': null };
/** A province code the provinces table knows, or null */
export function provinceCode(value, provinceCodes) {
  if (provinceCodes.has(value)) return value;
  if (value in PROVINCE_ALIASES) return PROVINCE_ALIASES[value];
  return null;
}

/* ---------- ตี้ + อีเวนต์ ---------- */

// Fields a column gives back exactly; everything else stays in details
const EVENT_EXACT = ['id', 'title', 'description', 'eventType', 'tag', 'zone', 'onlinePlatform', 'meetingPoint', 'price', 'targetGender', 'targetAge', 'energyLevel', 'cancellationPolicy', 'approvalStatus', 'source', 'sourceUrl', 'externalUrl', 'image', 'hostAvatar', 'participantsCount'];
const MOODS = ['heal', 'move', 'chill', 'learn'];

/**
 * refs: { provinceCodes, venueCodes, hostId, placeId, seriesId, isSample, id?, participantsCount?, sortKey? }
 * sortKey: list position, higher = earlier (default: now, so a new item comes first).
 * hostId/placeId/seriesId are database ids the caller looked up from the item's legacy ids.
 */
export function eventToRow(e, refs) {
  const community = e.eventType === 'community';
  const createdAt = toDate(e.createdAt) ?? toDate(e.createdAtTimestamp) ?? new Date();
  const { startsAt, endsAt } = eventTimes(e, createdAt);
  const online = e.locationType === 'online' || e.province === 'ออนไลน์';
  const max = community && Number.isFinite(e.maxParticipants) ? e.maxParticipants : null;
  const count = Math.max(0, refs.participantsCount ?? e.participantsCount ?? 0);
  return {
    id: refs.id ?? uuidV7(createdAt),
    slug: e.id,
    event_type: community ? 'community' : 'public_venue',
    title: e.title,
    description: e.description,
    mood: MOODS.includes(e.category) ? e.category : null,
    category: text(community ? e.lifestyleCategory : e.fairCategory),
    tag: text(e.tag),
    province_code: provinceCode(e.province, refs.provinceCodes),
    zone: text(e.zone),
    location_name: text(e.location) ?? (online ? 'ออนไลน์' : '-'),
    meeting_point: text(e.meetingPoint),
    location: point(e.latitude, e.longitude),
    place_id: refs.placeId ?? null,
    venue_code: refs.venueCodes.has(e.venueTag) ? e.venueTag : null,
    series_id: refs.seriesId ?? null,
    starts_at: startsAt,
    ends_at: endsAt,
    location_type: online ? 'online' : 'physical',
    online_platform: text(e.onlinePlatform),
    online_join_url: null,
    host_member_id: refs.hostId ?? null,
    organizer_name: text(e.hostName) ?? (community ? null : text(e.source) ?? 'ผู้จัดงาน'),
    organizer_avatar: text(e.hostAvatar),
    min_participants: community && Number.isFinite(e.minParticipants) && e.minParticipants >= 1 ? e.minParticipants : null,
    max_participants: max,
    participants_count: max ? Math.min(count, max) : count,
    price_text: text(e.price),
    audience_tags: [e.isSoloFriendly && 'solo', e.isBeginnerFriendly && 'beginner', e.isPetFriendly && 'pet'].filter(Boolean),
    target_gender: text(e.targetGender),
    target_age: text(e.targetAge),
    energy_level: text(e.energyLevel),
    cancellation_policy: text(e.cancellationPolicy),
    registration_open: e.registrationOpen !== false,
    approval_status: ['pending', 'approved', 'rejected'].includes(e.approvalStatus) ? e.approvalStatus : 'pending',
    moderated_at: toDate(e.moderatedAt),
    cover_image_url: e.image ?? '',
    source_name: text(e.source),
    source_url: text(e.sourceUrl),
    external_url: text(e.externalUrl),
    details: detailsOf(e, EVENT_EXACT),
    is_sample: !!refs.isSample,
    sort_key: refs.sortKey ?? Date.now(),
    created_at: createdAt,
  };
}

/** row needs the event columns plus details */
export function rowToEvent(row) {
  return {
    ...compact({
      id: row.slug,
      title: row.title,
      description: row.description,
      eventType: row.event_type,
      tag: row.tag,
      zone: row.zone,
      onlinePlatform: row.online_platform,
      meetingPoint: row.meeting_point,
      price: row.price_text,
      targetGender: row.target_gender,
      targetAge: row.target_age,
      energyLevel: row.energy_level,
      cancellationPolicy: row.cancellation_policy,
      approvalStatus: row.approval_status,
      source: row.source_name,
      sourceUrl: row.source_url,
      externalUrl: row.external_url,
      image: row.cover_image_url || null,
      hostAvatar: row.organizer_avatar,
    }),
    ...row.details,
    participantsCount: row.participants_count,
  };
}

/* ---------- places ---------- */

const PLACE_EXACT = ['id', 'title', 'category', 'vibeTags', 'district', 'description', 'openHours', 'price', 'entryFee', 'bestTime', 'transitInfo', 'googleMapsUrl', 'sourceName', 'sourceUrl'];

/** refs: { provinceCodes, id?, sortKey? }. Returns null when the place has no known province. */
export function placeToRow(s, refs) {
  const province = provinceCode(s.province, refs.provinceCodes);
  if (!province) return null;
  const rating = typeof s.rating === 'number' ? Math.min(5, Math.max(0, Math.round(s.rating * 10) / 10)) : null;
  const tier = ['featured', 'standard', 'hidden'].includes(s.curation?.tier) ? s.curation.tier : 'standard';
  return {
    id: refs.id ?? uuidV7(s.curation?.computedAt),
    slug: s.id,
    title: s.title,
    category: s.category ?? 'other',
    vibe_tags: strings(s.vibeTags),
    province_code: province,
    district: text(s.district),
    description: s.description ?? '',
    location: point(s.latitude, s.longitude),
    open_hours: text(s.openHours),
    price: text(s.price),
    entry_fee: text(s.entryFee),
    best_time: text(s.bestTime),
    transit_info: text(s.transitInfo),
    contact: s.contact ?? {},
    facilities: strings(s.facilities),
    highlights: strings(s.highlights),
    google_maps_url: text(s.googleMapsUrl),
    rating,
    reviews_count: Math.max(0, Math.round(s.reviewsCount ?? 0)),
    popularity: Math.round(s.popularity ?? 0),
    meetup_allowed: !!s.meetupAllowed,
    publication_status: s.publicationStatus === 'published' ? 'published' : 'draft',
    source_name: text(s.sourceName),
    source_url: text(s.sourceUrl),
    curation_score: Math.round(s.curation?.score ?? 0),
    curation_tier: tier,
    curation_reasons: strings(s.curation?.reasons),
    curation_at: toDate(s.curation?.computedAt),
    details: detailsOf(s, PLACE_EXACT),
    sort_key: refs.sortKey ?? Date.now(),
  };
}

export const placeImages = (s, placeId) =>
  [...new Set([s.image, ...strings(s.galleryImages)].filter((url) => text(url)))].slice(0, 30).map((url, position) => ({ place_id: placeId, position, url }));

export function rowToPlace(row) {
  return {
    ...compact({
      id: row.slug,
      title: row.title,
      category: row.category,
      district: row.district,
      description: row.description,
      openHours: row.open_hours,
      price: row.price,
      entryFee: row.entry_fee,
      bestTime: row.best_time,
      transitInfo: row.transit_info,
      googleMapsUrl: row.google_maps_url,
      sourceName: row.source_name,
      sourceUrl: row.source_url,
    }),
    vibeTags: row.vibe_tags,
    ...row.details,
  };
}

/* ---------- challenges ---------- */

const QUEST_EXACT = ['id', 'title', 'iconName', 'objective', 'badgeLabel', 'creatorName'];

/** refs: { id?, isSample, sortKey? } */
export function questToRow(q, refs) {
  const start = dateOnly(q.startDate);
  const end = dateOnly(q.endDate);
  return {
    id: refs.id ?? uuidV7(),
    slug: q.id,
    title: q.title,
    category: text(q.category),
    icon_name: q.iconName ?? '',
    objective: q.objective ?? '',
    steps: Array.isArray(q.steps) ? q.steps : [],
    starts_at: start ? bangkok(thaiDays(start)[0]) : null,
    ends_at: end ? bangkok(thaiDays(end)[0], 23, 59, 59) : null,
    status: ['draft', 'active', 'ended'].includes(q.status) ? q.status : 'active',
    visibility: q.visibility === 'private' ? 'private' : 'public',
    is_official: !!q.isOfficial,
    creator_name: text(q.creatorName),
    reward_points: Math.max(0, Math.round(q.rewardPoints ?? 0)),
    rule: q.rule ?? null,
    brand_reward: q.brandReward ?? null,
    badge_label: q.badgeLabel ?? '',
    badge_icon: text(q.badgeIcon),
    cover_image_url: text(q.image),
    details: detailsOf(q, QUEST_EXACT),
    is_sample: !!refs.isSample,
    sort_key: refs.sortKey ?? Date.now(),
  };
}

export function rowToQuest(row) {
  return {
    ...compact({ id: row.slug, title: row.title, objective: row.objective, creatorName: row.creator_name }),
    iconName: row.icon_name,
    badgeLabel: row.badge_label,
    ...row.details,
  };
}

/* ---------- members ---------- */

const GENDERS = ['female', 'male', 'lgbtq'];
const INTENTS = ['member', 'host', 'venue', 'organizer'];
const INTEREST_LISTS = { communityCategories: 'community', fairCategories: 'fair', spotVibes: 'place' };
const DEFAULT_HIDDEN = ['workplace', 'relationshipStatus', 'age'];
const RISK_CODES = ['disposable_email', 'shared_ip', 'risky_name', 'risky_text', 'contact_info', 'reported'];

/**
 * Splits a Member into its rows. ids: { id, inviteCode, invitedBy, memberIdOf(legacy) → uuid|null }.
 * Saved items, cancelled ตี้, follows, blocks and reports point at other rows, so they come back as legacy ids
 * for the caller to resolve.
 */
export function memberToRows(m, ids) {
  const id = ids.id;
  const createdAt = toDate(m.createdAt) ?? new Date();
  const profile = m.profile ?? {};
  const prefs = m.preferences;
  const consentSource = ['social_login', 'profile'].includes(m.consent?.source) ? m.consent.source : 'signup_form';
  const consents = [];
  const termsAt = toDate(m.consent?.acceptedAt ?? m.consentAt);
  const version = m.consent?.termsVersion ?? 'unknown';
  if (termsAt) consents.push({ kind: 'terms', version, source: consentSource, accepted_at: termsAt });
  if (toDate(m.consent?.ageConfirmedAt)) consents.push({ kind: 'age', version, source: consentSource, accepted_at: toDate(m.consent.ageConfirmedAt) });
  if (toDate(m.pledgeAcceptedAt)) consents.push({ kind: 'pledge', version: m.pledgeVersion ?? 'unknown', source: consentSource, accepted_at: toDate(m.pledgeAcceptedAt) });
  const tokens = [];
  if (m.emailVerification?.tokenHash) tokens.push({ purpose: 'verify_email', token_hash: m.emailVerification.tokenHash, expires_at: toDate(m.emailVerification.expiresAt) ?? createdAt });
  if (m.passwordReset?.tokenHash) tokens.push({ purpose: 'reset_password', token_hash: m.passwordReset.tokenHash, expires_at: toDate(m.passwordReset.expiresAt) ?? createdAt });
  const app = m.hostApplication;
  return {
    member: {
      id,
      legacy_id: m.id,
      display_name: (text(m.displayName) ?? 'สมาชิก').slice(0, 60),
      email: text(m.email)?.toLowerCase() ?? null,
      email_verified_at: m.emailVerified ? toDate(m.emailVerifiedAt) ?? createdAt : null,
      avatar_url: text(m.avatarUrl),
      status: ['active', 'suspended', 'banned'].includes(m.status) ? m.status : 'active',
      suspended_until: toDate(m.suspendedUntil),
      status_reason: text(m.statusReason),
      session_version: m.sessionVersion ?? 1,
      invite_code: ids.inviteCode,
      invited_by: ids.invitedBy ?? null,
      signup_ip_hash: text(m.signupIpHash),
      onboarded_at: toDate(m.onboardedAt),
      last_login_at: toDate(m.lastLoginAt),
      last_login_method: ['email', 'google', 'facebook', 'apple'].includes(m.lastLoginMethod) ? m.lastLoginMethod : null,
      risk_reviewed_at: toDate(m.riskReviewedAt),
      is_sample: !!m.isSample,
      created_at: createdAt,
    },
    credentials: m.passwordHash ? [{ member_id: id, password_hash: m.passwordHash, password_changed_at: createdAt }] : [],
    providers: (m.providers ?? []).map((p) => ({ provider: p.provider, subject: p.subject, member_id: id, linked_at: toDate(p.linkedAt) ?? createdAt })),
    tokens: tokens.map((t) => ({ id: uuidV7(), member_id: id, ...t, created_at: new Date() })),
    profile: {
      member_id: id,
      bio: text(profile.bio)?.slice(0, 500) ?? null,
      occupation: text(profile.occupation),
      workplace: text(profile.workplace),
      education: text(profile.education),
      hometown: text(profile.hometown),
      living_area: text(profile.livingArea),
      relationship_status: text(profile.relationshipStatus),
      connect_goal: text(profile.connectGoal),
      birth_year: Number.isInteger(prefs?.birthYear) ? prefs.birthYear : null,
      gender: GENDERS.includes(prefs?.gender) ? prefs.gender : null,
      province_code: ids.provinceCode ?? null,
      intent: INTENTS.includes(prefs?.intent) ? prefs.intent : 'member',
      goals: strings(prefs?.goals),
      hidden_fields: Array.isArray(profile.hidden) ? strings(profile.hidden) : DEFAULT_HIDDEN,
      preferences_at: prefs ? toDate(prefs.updatedAt) ?? createdAt : null,
      updated_at: new Date(),
    },
    interests: Object.entries(INTEREST_LISTS).flatMap(([list, pillar]) => [...new Set(strings(prefs?.interests?.[list]))].map((code) => ({ member_id: id, pillar, code }))),
    consents: consents.map((c) => ({ id: uuidV7(c.accepted_at), member_id: id, ...c })),
    riskFlags: (m.riskFlags ?? []).filter((f) => RISK_CODES.includes(f.code)).map((f) => ({ id: uuidV7(f.at), member_id: id, code: f.code, detail: f.detail ?? '', created_at: toDate(f.at) ?? createdAt })),
    hostApplications: app
      ? [{
          id: uuidV7(app.submittedAt), member_id: id, kind: app.kind, about: app.about ?? '', link: text(app.link), status: app.status,
          submitted_at: toDate(app.submittedAt) ?? createdAt, reviewed_at: toDate(app.reviewedAt), reviewed_by_label: text(app.reviewedBy), note: text(app.note),
        }]
      : [],
    // Legacy ids for the caller to resolve
    followingIds: [...new Set(m.followingIds ?? [])].filter((other) => other !== m.id),
    blockedIds: [...new Set(m.blockedIds ?? [])].filter((other) => other !== m.id),
    savedSpotIds: [...new Set(m.savedSpotIds ?? [])],
    savedEventIds: [...new Set(m.savedEventIds ?? [])],
    cancelledEvents: (m.cancelledEvents ?? []).filter((c) => c?.eventId),
    reportsReceived: (m.reportsReceived ?? []).filter((r) => r?.byId),
  };
}

/**
 * Rebuilds a Member from one hydrated row (see MEMBER_SELECT in lib/members/pgMemberRepository.ts):
 * member columns + profile columns + json arrays of the child rows (already as legacy ids).
 */
export function rowToMember(r) {
  const consents = r.consents ?? [];
  const latest = (kind) => consents.filter((c) => c.kind === kind).sort((a, b) => (a.accepted_at < b.accepted_at ? 1 : -1))[0];
  const terms = latest('terms');
  const age = latest('age');
  const pledge = latest('pledge');
  const token = (purpose) => (r.tokens ?? []).find((t) => t.purpose === purpose);
  const verify = token('verify_email');
  const reset = token('reset_password');
  const profileText = compact({
    bio: r.bio, occupation: r.occupation, workplace: r.workplace, education: r.education, hometown: r.hometown,
    livingArea: r.living_area, relationshipStatus: r.relationship_status, connectGoal: r.connect_goal,
  });
  const hidden = r.hidden_fields ?? DEFAULT_HIDDEN;
  const interests = (pillar) => (r.interests ?? []).filter((i) => i.pillar === pillar).map((i) => i.code);
  const app = r.host_application;
  return compact({
    id: r.legacy_id,
    displayName: r.display_name,
    email: r.email ?? undefined,
    emailVerified: Boolean(r.email_verified_at),
    avatarUrl: r.avatar_url,
    passwordHash: r.password_hash,
    providers: (r.providers ?? []).map((p) => ({ provider: p.provider, subject: p.subject, linkedAt: iso(p.linked_at) })),
    status: r.status,
    suspendedUntil: iso(r.suspended_until),
    statusReason: r.status_reason,
    sessionVersion: r.session_version,
    passwordReset: reset ? { tokenHash: reset.token_hash, expiresAt: iso(reset.expires_at) } : undefined,
    consentAt: iso(terms?.accepted_at) ?? iso(r.created_at),
    consent: terms && terms.version !== 'unknown'
      ? compact({ termsVersion: terms.version, acceptedAt: iso(terms.accepted_at), ageConfirmedAt: iso(age?.accepted_at), source: terms.source })
      : undefined,
    preferences: r.preferences_at
      ? compact({
          intent: r.intent, goals: r.goals ?? [], birthYear: r.birth_year, gender: r.gender, province: r.province_code,
          interests: { communityCategories: interests('community'), spotVibes: interests('place'), fairCategories: interests('fair') },
          updatedAt: iso(r.preferences_at),
        })
      : undefined,
    onboardedAt: iso(r.onboarded_at),
    profile: Object.keys(profileText).length || hidden.join() !== DEFAULT_HIDDEN.join() ? { ...profileText, hidden } : undefined,
    pledgeAcceptedAt: iso(pledge?.accepted_at),
    pledgeVersion: pledge && pledge.version !== 'unknown' ? pledge.version : undefined,
    emailVerification: verify ? { tokenHash: verify.token_hash, expiresAt: iso(verify.expires_at) } : undefined,
    hostApplication: app
      ? compact({ kind: app.kind, about: app.about, link: app.link, status: app.status, submittedAt: iso(app.submitted_at), reviewedAt: iso(app.reviewed_at), reviewedBy: app.reviewed_by_label, note: app.note })
      : undefined,
    riskFlags: r.risk_flags?.length ? r.risk_flags.map((f) => ({ code: f.code, detail: f.detail, at: iso(f.created_at) })) : undefined,
    riskReviewedAt: iso(r.risk_reviewed_at),
    signupIpHash: r.signup_ip_hash,
    reportsReceived: r.reports_received?.length ? r.reports_received.map((x) => ({ byId: x.by_id, reason: x.reason, at: iso(x.created_at) })) : undefined,
    blockedIds: r.blocked_ids?.length ? r.blocked_ids : undefined,
    followingIds: r.following_ids?.length ? r.following_ids : undefined,
    inviteCode: r.invite_code,
    invitedBy: r.invited_by_legacy,
    savedSpotIds: r.saved_spot_ids?.length ? r.saved_spot_ids : undefined,
    savedEventIds: r.saved_event_ids?.length ? r.saved_event_ids : undefined,
    cancelledEvents: r.cancelled_events?.length ? r.cancelled_events.map((c) => ({ eventId: c.event_id, at: iso(c.at) })) : undefined,
    isSample: r.is_sample || undefined,
    createdAt: iso(r.created_at),
    lastLoginAt: iso(r.last_login_at),
    lastLoginMethod: r.last_login_method,
  });
}
