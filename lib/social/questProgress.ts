import type { ChallengeQuest, EventItem, QuestRule } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { db } from '../db';
import { parseQuestDate } from '../questLifecycle';
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
            minEvidence: q.rule.minEvidence ?? 'marked',
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
  rewardPoints: number;
}

/** A member's visits, their progress in every challenge that counts visits, and their points */
export async function progressOf(memberId: string) {
  const visits = await visitsOf(memberId);
  const targets = new Map<string, RuleTarget | null>();
  for (const visit of visits) {
    targets.set(targetKey(visit.targetType, visit.targetId), await loadRuleTarget(visit.targetType, visit.targetId));
  }

  const counts = (quest: ChallengeQuest & { rule: QuestRule }, visit: Visit) => {
    const target = targets.get(targetKey(visit.targetType, visit.targetId));
    if (!target || !ruleMatchesTarget(quest.rule, target)) return false;
    if (EVIDENCE_RANK[visit.evidence] < EVIDENCE_RANK[quest.rule.minEvidence ?? 'marked']) return false;
    // Only visits made while the challenge runs
    const at = Date.parse(visit.at);
    const start = parseQuestDate(quest.startDate, false);
    const end = parseQuestDate(quest.endDate, true);
    return (start === null || at >= start) && (end === null || at <= end);
  };

  const quests: QuestProgress[] = (await questsWithRules()).map((quest) => {
    const current = Math.min(quest.rule.count, visits.filter((visit) => counts(quest, visit)).length);
    return { questId: quest.id, title: quest.title, current, total: quest.rule.count, completed: current >= quest.rule.count, rewardPoints: quest.rewardPoints ?? 0 };
  });

  // A visit to something that no longer exists earns nothing
  const visitPoints = visits.reduce((sum, visit) => sum + (targets.get(targetKey(visit.targetType, visit.targetId)) ? VISIT_POINTS[visit.evidence] : 0), 0);
  const questPoints = quests.reduce((sum, quest) => sum + (quest.completed ? quest.rewardPoints : 0), 0);

  return { visits, quests, points: { total: visitPoints + questPoints, fromVisits: visitPoints, fromQuests: questPoints } };
}
