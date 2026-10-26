import type { ChallengeQuest, EventItem, QuestRule } from '@/data/mockData';
import { getSpotVibeCategory, type LifestyleSpotItem } from '@/data/spotsData';
import { db } from '../db';
import { parseQuestDate } from '../questLifecycle';
import { isEventEnded, parseEventDateToTimestamp, parseEventEndDateToTimestamp } from '../dateUtils';
import { momentRepository } from '../moments';
import { memberRepository } from '../members';
import { joinedQuestIdsOf } from './questJoins';
import { checkedInTogether, friendIdsOf } from './friends';
import { type Visit, type VisitEvidence, type VisitTargetType, isVisitTargetType, targetKey, visitsOf } from './visits';

/**
 * What a member gets for going out: points for each visit, and challenges that count visits.
 * Everything is worked out from visits (lib/social/visits.ts) on each read; no balance is stored.
 */

/** Points for one visit, by how strong the evidence is */
export const VISIT_POINTS: Record<VisitEvidence, number> = { checkin: 50, moment: 30, marked: 10 };

const EVIDENCE_RANK: Record<VisitEvidence, number> = { checkin: 3, moment: 2, marked: 1 };
const EVIDENCES = Object.keys(EVIDENCE_RANK) as VisitEvidence[];
const MAX_RULE_LIST = 50;
const DAY = 24 * 60 * 60 * 1000;

/** A place or event in the few fields a rule can test */
interface RuleTarget {
  targetType: VisitTargetType;
  id: string;
  title: string;
  category?: string;
  province?: string;
  /** A place's vibe as grouped on /spots */
  vibe?: string;
  /** An event's date text, to tell whether it falls inside a challenge's period */
  date?: string;
}

export const eventTargetType = (event: EventItem): VisitTargetType => (event.eventType === 'public_venue' ? 'fair' : 'community');

const spotTarget = (spot: LifestyleSpotItem): RuleTarget => ({ targetType: 'spot', id: spot.id, title: spot.title, category: spot.category, province: spot.province, vibe: getSpotVibeCategory(spot) });
const eventTarget = (event: EventItem): RuleTarget => ({ targetType: eventTargetType(event), id: event.id, title: event.title, category: event.category, province: event.province, date: event.date });

export async function loadRuleTarget(targetType: VisitTargetType, targetId: string): Promise<RuleTarget | null> {
  if (targetType === 'spot') {
    const spot = await db.findSpotById(targetId);
    return spot && spot.publicationStatus !== 'draft' ? spotTarget(spot) : null;
  }
  const event = await db.findEventById(targetId);
  return event && eventTargetType(event) === targetType ? eventTarget(event) : null;
}

const stringList = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const list = value.filter((v): v is string => typeof v === 'string' && v.trim() !== '').map((v) => v.trim().slice(0, 120)).slice(0, MAX_RULE_LIST);
  return list.length ? list : undefined;
};

/** Validates a rule coming from the admin console; null when it is not a usable rule */
export function parseQuestRule(input: unknown): QuestRule | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const targetTypes = (Array.isArray(raw.targetTypes) ? raw.targetTypes : []).filter(isVisitTargetType);
  const count = Math.round(Number(raw.count));
  if (targetTypes.length === 0 || !(count >= 1 && count <= 100)) return null;
  return {
    targetTypes: [...new Set(targetTypes)],
    count,
    categories: stringList(raw.categories),
    provinces: stringList(raw.provinces),
    keywords: stringList(raw.keywords),
    vibes: stringList(raw.vibes),
    targetIds: stringList(raw.targetIds),
    minEvidence: EVIDENCES.includes(raw.minEvidence as VisitEvidence) ? (raw.minEvidence as VisitEvidence) : undefined,
    newMemberDays: wholeNumberIn(raw.newMemberDays, 1, 90),
    asHost: targetTypes.includes('community') ? wholeNumberIn(raw.asHost, 1, 15) : undefined,
    withFriends: targetTypes.includes('community') ? wholeNumberIn(raw.withFriends, 1, 15) : undefined,
    friendsVia: raw.friendsVia === 'invite' ? 'invite' : raw.friendsVia === 'any' ? 'any' : undefined,
    perWeekend: raw.perWeekend === true || undefined,
  };
}

/** The Saturday (YYYY-MM-DD, Bangkok) of the weekend a moment falls in; null on a weekday */
export function weekendOf(at: string): string | null {
  const local = new Date(Date.parse(at) + 7 * 3600 * 1000);
  const day = local.getUTCDay();
  if (day !== 6 && day !== 0) return null;
  if (day === 0) local.setUTCDate(local.getUTCDate() - 1);
  return local.toISOString().slice(0, 10);
}

/** How far a member got: different targets, or different weekends for a weekend challenge */
function progressCount(rule: QuestRule, counted: Visit[]): number {
  if (!rule.perWeekend) return counted.length;
  return new Set(counted.map((visit) => weekendOf(visit.at)).filter(Boolean)).size;
}

/** ตี้ the member was checked in at together with at least `minFriends` friends, as check-in visits */
async function friendVisitsOf(memberId: string, minFriends: number, via: 'invite' | 'any'): Promise<Visit[]> {
  const member = await memberRepository.findById(memberId);
  if (!member) return [];
  const friends = await friendIdsOf(member, via);
  if (friends.size < minFriends) return [];
  return (await checkedInTogether(memberId))
    .filter((entry) => entry.others.filter((id) => friends.has(id)).length >= minFriends)
    .map((entry) => ({ targetType: 'community' as const, targetId: entry.eventId, evidence: 'checkin' as const, at: entry.at }));
}

function wholeNumberIn(value: unknown, min: number, max: number): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Math.round(Number(value));
  return n >= min && n <= max ? n : undefined;
}

/**
 * A member's own ตี้ that count for a host challenge: ones they hosted where at least `minGuests` guests were
 * checked in. Each counts as a check-in visit at the time the last needed guest arrived.
 */
async function hostedVisitsOf(memberId: string, minGuests: number): Promise<Visit[]> {
  const events = await allPages((page) => db.findEvents({ eventType: 'community', page, limit: 100 }));
  const visits: Visit[] = [];
  const hosted = events.filter((event) => (event as { createdByMemberId?: string }).createdByMemberId === memberId);
  const byEvent = await db.listParticipantsByEvent(hosted.map((event) => event.id));
  for (const event of hosted) {
    const arrivals = (byEvent.get(event.id) ?? [])
      .filter((guest) => guest.userId !== memberId && guest.checkedInAt)
      .map((guest) => guest.checkedInAt as string)
      .sort();
    if (arrivals.length >= minGuests) visits.push({ targetType: 'community', targetId: event.id, evidence: 'checkin', at: arrivals[minGuests - 1] });
  }
  return visits;
}

/** What a challenge counts for one member: their own visits, or for a host challenge the ตี้ they hosted */
const visitsForQuest = (quest: ChallengeQuest & { rule: QuestRule }, memberId: string) =>
  quest.rule.asHost
    ? hostedVisitsOf(memberId, quest.rule.asHost)
    : quest.rule.withFriends
      ? friendVisitsOf(memberId, quest.rule.withFriends, quest.rule.friendsVia ?? 'any')
      : visitsOf(memberId);

/** When the member signed up (ms), for welcome challenges; undefined when the rule does not need it */
async function memberSince(quest: ChallengeQuest & { rule: QuestRule }, memberId: string): Promise<number | undefined> {
  if (!quest.rule.newMemberDays) return undefined;
  const member = await memberRepository.findById(memberId);
  return member ? Date.parse(member.createdAt) : undefined;
}

/**
 * The weakest evidence that counts for a challenge. Pressing "I have been here" (which nothing checks) never
 * counts, whatever the rule says (owner 2026-10-23: challenges need proof that can be checked): a photo moment
 * that passed (lib/moments/evidence.ts) or a host's check-in.
 */
export function minEvidenceOf(quest: Pick<ChallengeQuest, 'rule' | 'brandReward'>): VisitEvidence {
  const asked = quest.rule?.minEvidence ?? 'moment';
  return EVIDENCE_RANK[asked] < EVIDENCE_RANK.moment ? 'moment' : asked;
}

/** Every filter the rule gives must match; a rule with only targetTypes counts any target of those types */
export function ruleMatchesTarget(rule: QuestRule, target: RuleTarget): boolean {
  if (!rule.targetTypes.includes(target.targetType)) return false;
  if (rule.targetIds && !rule.targetIds.includes(target.id)) return false;
  if (rule.categories && !rule.categories.includes(target.category ?? '')) return false;
  if (rule.provinces && !rule.provinces.includes(target.province ?? '')) return false;
  if (rule.vibes && !rule.vibes.includes(target.vibe ?? '')) return false;
  if (rule.keywords && !rule.keywords.some((word) => target.title.toLowerCase().includes(word.toLowerCase()))) return false;
  return true;
}

async function questsWithRules(): Promise<(ChallengeQuest & { rule: QuestRule })[]> {
  const { items } = await db.findQuests({ page: 1, limit: 200, status: 'all' });
  return items.filter((q): q is ChallengeQuest & { rule: QuestRule } => Boolean(q.rule) && q.status !== 'draft');
}

export interface TargetReward {
  questId: string;
  title: string;
  badgeLabel: string;
  rewardPoints: number;
  /** What the partner or the platform gives on completion */
  rewardTitle?: string;
  /** How many visits the challenge needs in total */
  count: number;
  minEvidence: VisitEvidence;
}

/** Whether an event's dates overlap the challenge's period; places have no date and always can */
function inQuestPeriod(quest: ChallengeQuest, target: RuleTarget): boolean {
  if (!target.date) return true;
  const start = parseQuestDate(quest.startDate, false);
  const end = parseQuestDate(quest.endDate, true);
  return (start === null || parseEventEndDateToTimestamp(target.date) >= start) && (end === null || parseEventDateToTimestamp(target.date) <= end);
}

/** The running challenges a visit to each target counts toward */
export async function rewardsForTargets(targets: { targetType: VisitTargetType; targetId: string }[]): Promise<Record<string, TargetReward[]>> {
  // Going somewhere never counts toward a host challenge, nor toward one that has not started (a visit today would
  // not count, so a place page must not say it does; E2E walk 2026-10-25)
  const now = Date.now();
  const quests = (await questsWithRules()).filter((q) => {
    const start = parseQuestDate(q.startDate, false);
    return q.status === 'active' && !q.rule.asHost && (start === null || start <= now);
  });
  const result: Record<string, TargetReward[]> = {};
  for (const { targetType, targetId } of targets) {
    const target = quests.length ? await loadRuleTarget(targetType, targetId) : null;
    result[targetKey(targetType, targetId)] = target
      ? quests
          .filter((q) => ruleMatchesTarget(q.rule, target) && inQuestPeriod(q, target))
          .map((q) => ({
            questId: q.id,
            title: q.title,
            badgeLabel: q.badgeLabel,
            rewardPoints: q.rewardPoints ?? 0,
            rewardTitle: q.brandReward?.title,
            count: q.rule.count,
            minEvidence: minEvidenceOf(q),
          }))
      : [];
  }
  return result;
}

export interface QuestProgress {
  questId: string;
  title: string;
  current: number;
  total: number;
  completed: boolean;
  /** The member joined it; only then is the reward theirs */
  joined: boolean;
  rewardPoints: number;
}

/**
 * Whether one visit counts toward a challenge: the target matches the rule, the evidence is strong enough, and it
 * happened while the challenge runs (and, for a welcome challenge, within its days of `since`, the member's sign-up)
 */
function visitCounts(quest: ChallengeQuest & { rule: QuestRule }, visit: Visit, target: RuleTarget | null | undefined, since?: number): boolean {
  if (!target || !ruleMatchesTarget(quest.rule, target)) return false;
  if (EVIDENCE_RANK[visit.evidence] < EVIDENCE_RANK[minEvidenceOf(quest)]) return false;
  // A photo still waiting for staff review counts once it passes
  if (visit.pending) return false;
  const at = Date.parse(visit.at);
  if (quest.rule.newMemberDays && (since === undefined || at > since + quest.rule.newMemberDays * DAY)) return false;
  if (quest.rule.perWeekend && !weekendOf(visit.at)) return false;
  const start = parseQuestDate(quest.startDate, false);
  const end = parseQuestDate(quest.endDate, true);
  return (start === null || at >= start) && (end === null || at <= end);
}

/** A place or event a challenge counts, in the fields a list row needs */
export interface QuestTarget {
  targetType: VisitTargetType;
  id: string;
  title: string;
  image?: string;
  /** Province for a place; date for an event */
  detail?: string;
  href: string;
  /** The signed-in member already has a visit here that counts */
  visited: boolean;
}

const TARGET_PATHS: Record<VisitTargetType, string> = { spot: '/spots', community: '/community', fair: '/events' };

async function allPages<T>(load: (page: number) => Promise<{ items: T[]; totalPages: number }>): Promise<T[]> {
  const first = await load(1);
  const items = [...first.items];
  for (let page = 2; page <= first.totalPages; page += 1) items.push(...(await load(page)).items);
  return items;
}

/**
 * Where a member can go for a challenge: published places and events still to come that match its rule.
 * Places the member already counted come first, then those in the member's own province (`near` holds its names);
 * `total` is how many match in all.
 */
export async function targetsOfQuest(quest: ChallengeQuest, memberId: string | null, limit = 6, near: string[] = []): Promise<{ targets: QuestTarget[]; total: number; browseHref: string } | null> {
  const rule = quest.rule;
  // A host challenge is done by hosting, so there is no list of places to go
  if (!rule || rule.asHost) return null;
  const ruled = quest as ChallengeQuest & { rule: QuestRule };
  const found: (Omit<QuestTarget, 'visited'> & { province?: string })[] = [];

  if (rule.targetTypes.includes('spot')) {
    const spots = await allPages((page) => db.findSpots({ page, limit: 100 }));
    for (const spot of spots) {
      if (spot.publicationStatus === 'draft' || !ruleMatchesTarget(rule, spotTarget(spot))) continue;
      found.push({ targetType: 'spot', id: spot.id, title: spot.title, image: spot.image, detail: spot.province, province: spot.province, href: `/spots/${encodeURIComponent(spot.id)}` });
    }
  }
  for (const eventType of ['community', 'public_venue'] as const) {
    const targetType: VisitTargetType = eventType === 'community' ? 'community' : 'fair';
    if (!rule.targetTypes.includes(targetType)) continue;
    const events = await allPages((page) => db.findEvents({ eventType, page, limit: 100 }));
    // Only events still to come that fall inside the challenge's period can count
    const questStart = parseQuestDate(quest.startDate, false);
    const questEnd = parseQuestDate(quest.endDate, true);
    for (const event of events) {
      if (isEventEnded(event) || !ruleMatchesTarget(rule, eventTarget(event))) continue;
      if (questStart !== null && parseEventEndDateToTimestamp(event.date) < questStart) continue;
      if (questEnd !== null && parseEventDateToTimestamp(event.date) > questEnd) continue;
      found.push({ targetType, id: event.id, title: event.title, image: event.image, detail: event.date, province: event.province, href: `${TARGET_PATHS[targetType]}/${encodeURIComponent(event.id)}` });
    }
  }

  const visited = new Set<string>();
  if (memberId) {
    const since = await memberSince(ruled, memberId);
    for (const visit of await visitsOf(memberId)) {
      const target = await loadRuleTarget(visit.targetType, visit.targetId);
      if (visitCounts(ruled, visit, target, since)) visited.add(targetKey(visit.targetType, visit.targetId));
    }
  }
  // A place named by the rule keeps the rule's order; places already counted come first
  const order = new Map((rule.targetIds ?? []).map((id, index) => [id, index]));
  const targets = found
    .map(({ province, ...target }) => ({ target: { ...target, visited: visited.has(targetKey(target.targetType, target.id)) }, near: Number(Boolean(province) && near.includes(province as string)) }))
    .sort(
      (a, b) =>
        Number(b.target.visited) - Number(a.target.visited) ||
        (order.get(a.target.id) ?? 0) - (order.get(b.target.id) ?? 0) ||
        b.near - a.near ||
        Number(Boolean(b.target.image)) - Number(Boolean(a.target.image))
    )
    .map((entry) => entry.target);

  return { targets: targets.slice(0, limit), total: targets.length, browseHref: TARGET_PATHS[rule.targetTypes[0]] };
}

/** One place or event the member went to for a challenge, with their own photo from there when they shared one */
export interface QuestMemory {
  targetType: VisitTargetType;
  id: string;
  title: string;
  /** The member's own photo; the place's photo when they shared none */
  image?: string;
  ownPhoto: boolean;
  href: string;
  at: string;
}

/** The visits a challenge counted for one member, oldest first: what they did to finish it */
export async function memoriesOfQuest(quest: ChallengeQuest, memberId: string): Promise<QuestMemory[]> {
  if (!quest.rule) return [];
  const ruled = quest as ChallengeQuest & { rule: QuestRule };
  const { items: moments } = await momentRepository.query({ statuses: ['published'], authorId: memberId, sort: 'newest', page: 1, limit: 500 });
  const photos = new Map<string, string>();
  for (const moment of moments) {
    if (isVisitTargetType(moment.targetType) && moment.targetId && moment.images?.[0]) photos.set(targetKey(moment.targetType, moment.targetId), moment.images[0]);
  }

  const memories: QuestMemory[] = [];
  const since = await memberSince(ruled, memberId);
  for (const visit of await visitsForQuest(ruled, memberId)) {
    if (!visitCounts(ruled, visit, await loadRuleTarget(visit.targetType, visit.targetId), since)) continue;
    const place = visit.targetType === 'spot' ? await db.findSpotById(visit.targetId) : await db.findEventById(visit.targetId);
    if (!place) continue;
    const ownPhoto = photos.get(targetKey(visit.targetType, visit.targetId));
    memories.push({
      targetType: visit.targetType,
      id: visit.targetId,
      title: place.title,
      image: ownPhoto ?? place.image,
      ownPhoto: Boolean(ownPhoto),
      href: `${TARGET_PATHS[visit.targetType]}/${encodeURIComponent(visit.targetId)}`,
      at: visit.at,
    });
  }
  return memories.sort((a, b) => a.at.localeCompare(b.at)).slice(0, ruled.rule.count);
}

/** A member's visits, their progress in every challenge that counts visits, and their points */
export async function progressOf(memberId: string) {
  const visits = await visitsOf(memberId);
  const targets = new Map<string, RuleTarget | null>();
  for (const visit of visits) {
    targets.set(targetKey(visit.targetType, visit.targetId), await loadRuleTarget(visit.targetType, visit.targetId));
  }

  const member = await memberRepository.findById(memberId);
  const since = member ? Date.parse(member.createdAt) : undefined;
  // Hosted ตี้ and ตี้ with friends are looked up only when a challenge needs them, once per kind
  const special = new Map<string, Visit[]>();
  const visitsFor = async (rule: QuestRule): Promise<Visit[]> => {
    if (!rule.asHost && !rule.withFriends) return visits;
    const key = rule.asHost ? `host:${rule.asHost}` : `friends:${rule.withFriends}:${rule.friendsVia ?? 'any'}`;
    if (!special.has(key)) {
      special.set(key, rule.asHost ? await hostedVisitsOf(memberId, rule.asHost) : await friendVisitsOf(memberId, rule.withFriends as number, rule.friendsVia ?? 'any'));
    }
    return special.get(key) as Visit[];
  };

  const joined = new Set(joinedQuestIdsOf(memberId));
  const quests: QuestProgress[] = [];
  for (const quest of await questsWithRules()) {
    const counted: Visit[] = [];
    for (const visit of await visitsFor(quest.rule)) {
      const key = targetKey(visit.targetType, visit.targetId);
      if (!targets.has(key)) targets.set(key, await loadRuleTarget(visit.targetType, visit.targetId));
      if (visitCounts(quest, visit, targets.get(key), since)) counted.push(visit);
    }
    const current = Math.min(quest.rule.count, progressCount(quest.rule, counted));
    quests.push({ questId: quest.id, title: quest.title, current, total: quest.rule.count, completed: current >= quest.rule.count, joined: joined.has(quest.id), rewardPoints: quest.rewardPoints ?? 0 });
  }

  // A visit to something that no longer exists earns nothing; hosting earns through its challenge only
  const visitPoints = visits.reduce((sum, visit) => sum + (targets.get(targetKey(visit.targetType, visit.targetId)) ? VISIT_POINTS[visit.evidence] : 0), 0);
  const questPoints = quests.reduce((sum, quest) => sum + (quest.completed && quest.joined ? quest.rewardPoints : 0), 0);

  return { visits, quests, points: { total: visitPoints + questPoints, fromVisits: visitPoints, fromQuests: questPoints } };
}

/** One line of a challenge's checklist for the member */
export interface QuestCheckItem {
  targetType: VisitTargetType;
  id: string;
  title: string;
  image?: string;
  href: string;
  at: string;
  /** counted = proven; pending = photo waiting for staff; rejected = staff did not count the photo */
  status: 'counted' | 'pending' | 'rejected';
  /** How it was proven or why not ("คนจัดยืนยัน", the staff note) */
  note?: string;
  momentId?: string;
}

/**
 * The checklist on a challenge page (owner 2026-10-23): every place the member went that fits the challenge, with
 * whether it counts, waits for review, or was not counted (so they can send another photo).
 */
export async function checklistOf(quest: ChallengeQuest, memberId: string): Promise<{ items: QuestCheckItem[]; current: number; total: number } | null> {
  if (!quest.rule) return null;
  const ruled = quest as ChallengeQuest & { rule: QuestRule };
  const items: QuestCheckItem[] = [];
  const seen = new Set<string>();
  const describe = async (targetType: VisitTargetType, targetId: string) => {
    const place = targetType === 'spot' ? await db.findSpotById(targetId) : await db.findEventById(targetId);
    return place ? { title: place.title, image: place.image, href: `${TARGET_PATHS[targetType]}/${encodeURIComponent(targetId)}` } : null;
  };

  const since = await memberSince(ruled, memberId);
  for (const visit of await visitsForQuest(ruled, memberId)) {
    const target = await loadRuleTarget(visit.targetType, visit.targetId);
    if (!target || !ruleMatchesTarget(ruled.rule, target)) continue;
    const inPeriod = visitCounts(ruled, { ...visit, pending: false }, target, since);
    if (!inPeriod) continue;
    const place = await describe(visit.targetType, visit.targetId);
    if (!place) continue;
    seen.add(targetKey(visit.targetType, visit.targetId));
    items.push({
      targetType: visit.targetType,
      id: visit.targetId,
      ...place,
      at: visit.at,
      status: visit.pending ? 'pending' : 'counted',
      note: ruled.rule.asHost
        ? `มีเพื่อนมาเช็กอินครบ ${ruled.rule.asHost} คนแล้ว`
        : ruled.rule.withFriends
          ? 'ไปพร้อมเพื่อน โฮสต์เช็กอินให้ทั้งคู่แล้ว'
          : visit.evidence === 'checkin' ? 'คนจัดยืนยันว่ามาแล้ว' : visit.pending ? 'รอทีมงานตรวจรูป' : 'ยืนยันจากรูปที่ถ่ายที่นั่น',
    });
  }

  // Photos staff did not count, so the member knows why and can send another
  const { items: moments } = await momentRepository.query({ statuses: ['published'], authorId: memberId, sort: 'newest', page: 1, limit: 500 });
  for (const moment of moments) {
    if (!moment.evidenceRejected || !isVisitTargetType(moment.targetType) || !moment.targetId) continue;
    const key = targetKey(moment.targetType, moment.targetId);
    if (seen.has(key)) continue;
    const target = await loadRuleTarget(moment.targetType, moment.targetId);
    if (!target || !ruleMatchesTarget(ruled.rule, target)) continue;
    const place = await describe(moment.targetType, moment.targetId);
    if (!place) continue;
    seen.add(key);
    items.push({ targetType: moment.targetType, id: moment.targetId, ...place, at: moment.createdAt, status: 'rejected', note: moment.evidenceRejected.note, momentId: moment.id });
  }

  items.sort((a, b) => a.at.localeCompare(b.at));
  const counted = items.filter((i) => i.status === 'counted').map((i) => ({ targetType: i.targetType, targetId: i.id, evidence: 'checkin' as const, at: i.at }));
  return { items, current: Math.min(ruled.rule.count, progressCount(ruled.rule, counted)), total: ruled.rule.count };
}
