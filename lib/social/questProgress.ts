import type { ChallengeQuest, EventItem, QuestRule } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { db } from '../db';
import { parseQuestDate } from '../questLifecycle';
import { momentRepository } from '../moments';
import { joinedQuestIdsOf } from './questJoins';
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

/** A place or event in the few fields a rule can test */
interface RuleTarget {
  targetType: VisitTargetType;
  id: string;
  title: string;
  category?: string;
  province?: string;
}

export const eventTargetType = (event: EventItem): VisitTargetType => (event.eventType === 'public_venue' ? 'fair' : 'community');

const spotTarget = (spot: LifestyleSpotItem): RuleTarget => ({ targetType: 'spot', id: spot.id, title: spot.title, category: spot.category, province: spot.province });
const eventTarget = (event: EventItem): RuleTarget => ({ targetType: eventTargetType(event), id: event.id, title: event.title, category: event.category, province: event.province });

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
    targetIds: stringList(raw.targetIds),
    minEvidence: EVIDENCES.includes(raw.minEvidence as VisitEvidence) ? (raw.minEvidence as VisitEvidence) : undefined,
  };
}

/**
 * The weakest evidence that counts for a challenge. A partner brand gives something real, so pressing
 * "I have been here" (which nothing checks) is not enough for its challenges, whatever their rule says.
 */
export function minEvidenceOf(quest: Pick<ChallengeQuest, 'rule' | 'brandReward'>): VisitEvidence {
  const asked = quest.rule?.minEvidence ?? 'marked';
  return quest.brandReward?.type === 'brand_partner' && EVIDENCE_RANK[asked] < EVIDENCE_RANK.moment ? 'moment' : asked;
}

/** Every filter the rule gives must match; a rule with only targetTypes counts any target of those types */
export function ruleMatchesTarget(rule: QuestRule, target: RuleTarget): boolean {
  if (!rule.targetTypes.includes(target.targetType)) return false;
  if (rule.targetIds && !rule.targetIds.includes(target.id)) return false;
  if (rule.categories && !rule.categories.includes(target.category ?? '')) return false;
  if (rule.provinces && !rule.provinces.includes(target.province ?? '')) return false;
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

/** The running challenges a visit to each target counts toward */
export async function rewardsForTargets(targets: { targetType: VisitTargetType; targetId: string }[]): Promise<Record<string, TargetReward[]>> {
  const quests = (await questsWithRules()).filter((q) => q.status === 'active');
  const result: Record<string, TargetReward[]> = {};
  for (const { targetType, targetId } of targets) {
    const target = quests.length ? await loadRuleTarget(targetType, targetId) : null;
    result[targetKey(targetType, targetId)] = target
      ? quests
          .filter((q) => ruleMatchesTarget(q.rule, target))
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

/** Whether one visit counts toward a challenge: the target matches the rule, the evidence is strong enough, and it happened while the challenge runs */
function visitCounts(quest: ChallengeQuest & { rule: QuestRule }, visit: Visit, target: RuleTarget | null | undefined): boolean {
  if (!target || !ruleMatchesTarget(quest.rule, target)) return false;
  if (EVIDENCE_RANK[visit.evidence] < EVIDENCE_RANK[minEvidenceOf(quest)]) return false;
  const at = Date.parse(visit.at);
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

const TARGET_PATHS: Record<VisitTargetType, string> = { spot: '/spots', community: '/community', fair: '/fairs' };

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
  if (!rule) return null;
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
    for (const event of events) {
      if (!ruleMatchesTarget(rule, eventTarget(event))) continue;
      found.push({ targetType, id: event.id, title: event.title, image: event.image, detail: event.date, province: event.province, href: `${TARGET_PATHS[targetType]}/${encodeURIComponent(event.id)}` });
    }
  }

  const visited = new Set<string>();
  if (memberId) {
    for (const visit of await visitsOf(memberId)) {
      const target = await loadRuleTarget(visit.targetType, visit.targetId);
      if (visitCounts(ruled, visit, target)) visited.add(targetKey(visit.targetType, visit.targetId));
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
  for (const visit of await visitsOf(memberId)) {
    if (!visitCounts(ruled, visit, await loadRuleTarget(visit.targetType, visit.targetId))) continue;
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

  const counts = (quest: ChallengeQuest & { rule: QuestRule }, visit: Visit) =>
    visitCounts(quest, visit, targets.get(targetKey(visit.targetType, visit.targetId)));

  const joined = new Set(joinedQuestIdsOf(memberId));
  const quests: QuestProgress[] = (await questsWithRules()).map((quest) => {
    const current = Math.min(quest.rule.count, visits.filter((visit) => counts(quest, visit)).length);
    return { questId: quest.id, title: quest.title, current, total: quest.rule.count, completed: current >= quest.rule.count, joined: joined.has(quest.id), rewardPoints: quest.rewardPoints ?? 0 };
  });

  // A visit to something that no longer exists earns nothing
  const visitPoints = visits.reduce((sum, visit) => sum + (targets.get(targetKey(visit.targetType, visit.targetId)) ? VISIT_POINTS[visit.evidence] : 0), 0);
  const questPoints = quests.reduce((sum, quest) => sum + (quest.completed && quest.joined ? quest.rewardPoints : 0), 0);

  return { visits, quests, points: { total: visitPoints + questPoints, fromVisits: visitPoints, fromQuests: questPoints } };
}
