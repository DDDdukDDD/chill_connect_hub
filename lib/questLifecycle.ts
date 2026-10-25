import { ChallengeQuest } from '@/data/mockData';
import { parseEventDateToTimestamp, parseEventEndDateToTimestamp } from './dateUtils';

const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Parses a quest date: ISO ("2026-12-31") or Thai ("31 ธ.ค. 2569").
 * Returns null for empty/unparseable values so callers can treat the quest as open-ended.
 */
export function parseQuestDate(value: string | undefined, endOfDay: boolean): number | null {
  if (!value || !value.trim()) return null;
  const iso = value.trim().match(ISO_DATE);
  if (iso) {
    const [, y, m, d] = iso.map(Number);
    const date = endOfDay ? new Date(y, m - 1, d, 23, 59, 59) : new Date(y, m - 1, d, 0, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }
  // The Thai parser falls back to defaults when no month is present; require a 4-digit year and a month name
  if (!/(20\d{2}|25\d{2})/.test(value) || !/[ก-ฮa-z]/i.test(value)) return null;
  return endOfDay ? parseEventEndDateToTimestamp(value) : parseEventDateToTimestamp(value);
}

/**
 * Derives the effective lifecycle from the dates (never persisted):
 * - daysRemaining: whole days left until the end of endDate (0 once ended); undefined without endDate
 * - status: drafts stay drafts; otherwise 'ended' once endDate has passed, else the stored status
 * - startsInDays: days until startDate while it has not started; absent once it runs
 */
export function applyQuestLifecycle(quest: ChallengeQuest, now: number = Date.now()): ChallengeQuest {
  // startsInDays: whole days until startDate while the challenge has not started (visits before it do not count)
  const { startsInDays: _stored, ...questWithoutStart } = quest;
  void _stored;
  const start = parseQuestDate(quest.startDate, false);
  const startsIn = start !== null && start > now ? { startsInDays: Math.max(1, Math.ceil((start - now) / DAY_MS)) } : {};

  const end = parseQuestDate(quest.endDate, true);
  if (end === null) {
    const { daysRemaining: _ignored, ...rest } = questWithoutStart;
    void _ignored;
    return { ...rest, ...startsIn, status: quest.status ?? 'active' };
  }

  const hasEnded = end < now;
  const daysRemaining = hasEnded ? 0 : Math.max(0, Math.ceil((end - now) / DAY_MS));
  const status = quest.status === 'draft' ? 'draft' : hasEnded ? 'ended' : quest.status ?? 'active';
  return { ...questWithoutStart, ...startsIn, daysRemaining, status };
}

/** Validation helper for admin writes: both dates parse and the end is not before the start. */
export function getQuestDateError(startDate?: string, endDate?: string): string | null {
  const start = parseQuestDate(startDate, false);
  const end = parseQuestDate(endDate, true);
  if (startDate && start === null) return 'รูปแบบวันเริ่มต้นไม่ถูกต้อง (ใช้ YYYY-MM-DD หรือ เช่น 1 ต.ค. 2569)';
  if (endDate && end === null) return 'รูปแบบวันสิ้นสุดไม่ถูกต้อง (ใช้ YYYY-MM-DD หรือ เช่น 31 ธ.ค. 2569)';
  if (start !== null && end !== null && end < start) return 'วันสิ้นสุดต้องไม่อยู่ก่อนวันเริ่มต้น';
  return null;
}

/**
 * One-time upgrade for quests persisted from the old seed (no brandReward, March 2026 dates):
 * copies brandReward and the refreshed dates from the current seed with the same id.
 * Quests created or edited by admins (or already upgraded) are left untouched.
 */
export function upgradeLegacySeedQuests(
  stored: ChallengeQuest[],
  seeds: ChallengeQuest[]
): { quests: ChallengeQuest[]; changed: boolean } {
  const seedById = new Map(seeds.map((seed) => [seed.id, seed]));
  let changed = false;
  const quests = stored.map((quest) => {
    const seed = seedById.get(quest.id);
    if (!seed || quest.brandReward || !seed.brandReward || quest.title !== seed.title) return quest;
    changed = true;
    const { daysRemaining: _stale, ...rest } = quest;
    void _stale;
    return { ...rest, brandReward: seed.brandReward, startDate: seed.startDate, endDate: seed.endDate };
  });
  return { quests, changed };
}

/**
 * Keeps a stored catalog in step with the seed:
 * - a seed quest the store has never held is appended once. The ids already seeded are remembered,
 *   so a seed quest staff deleted does not come back.
 * - a stored seed quest without a cover photo takes the seed's (same id and title).
 * `seededIds` is undefined for a store written before the ids were remembered.
 */
export function addNewSeedQuests(
  stored: ChallengeQuest[],
  seeds: ChallengeQuest[],
  seededIds: string[] | undefined
): { quests: ChallengeQuest[]; seededIds: string[]; changed: boolean } {
  const seedById = new Map(seeds.map((seed) => [seed.id, seed]));
  const known = new Set([...(seededIds ?? []), ...stored.map((quest) => quest.id)]);
  let changed = false;
  const quests = stored.map((quest) => {
    const seed = seedById.get(quest.id);
    if (quest.badgeCoverImg || !seed?.badgeCoverImg || quest.title !== seed.title) return quest;
    changed = true;
    return { ...quest, badgeCoverImg: seed.badgeCoverImg };
  });
  const added = seeds.filter((seed) => !known.has(seed.id));
  const nextSeededIds = [...new Set([...(seededIds ?? []), ...seeds.map((seed) => seed.id)])];
  return {
    quests: [...quests, ...added],
    seededIds: nextSeededIds,
    changed: changed || added.length > 0 || nextSeededIds.length !== (seededIds ?? []).length,
  };
}

/** Raise this when the texts or rule wording of the seed quests change, so stores pick the change up once */
// v7 (2026-10-25): campaign challenges move to community category ids
export const SEED_QUEST_TEXT_VERSION = 7;

/** Seed quests whose title changed: id -> the title stores may still hold */
const RENAMED_SEED_QUESTS: Record<string, string> = { '1': 'Cafe Hunter 5: ตามรอย 5 คาเฟ่ Specialty ย่านอารีย์-ทองหล่อ' };

/**
 * Brings the stored copies of the seed quests in line with the seed's wording: the goal, the description,
 * and the spelling of a rule's title words (a rule that staff changed in any other way is left alone),
 * and (v5) the short prize label when the stored prize is still the seed's.
 * Runs once per SEED_QUEST_TEXT_VERSION; quests staff created are never touched.
 */
export function refreshSeedQuestTexts(
  stored: ChallengeQuest[],
  seeds: ChallengeQuest[],
  storedVersion: number | undefined
): { quests: ChallengeQuest[]; changed: boolean } {
  if ((storedVersion ?? 1) >= SEED_QUEST_TEXT_VERSION) return { quests: stored, changed: false };
  const seedById = new Map(seeds.map((seed) => [seed.id, seed]));
  const sameRule = (a: unknown, b: unknown) => JSON.stringify(a ?? null).toLowerCase() === JSON.stringify(b ?? null).toLowerCase();
  const quests = stored.map((quest) => {
    const seed = seedById.get(quest.id);
    if (!seed || (quest.title !== seed.title && quest.title !== RENAMED_SEED_QUESTS[quest.id])) return quest;
    const brandReward =
      quest.brandReward && !quest.brandReward.shortTitle && seed.brandReward?.shortTitle && quest.brandReward.title === seed.brandReward.title
        ? { ...quest.brandReward, shortTitle: seed.brandReward.shortTitle }
        : quest.brandReward;
    return { ...quest, title: seed.title, category: seed.category, targetGoal: seed.targetGoal, objective: seed.objective, rule: sameRule(quest.rule, seed.rule) ? seed.rule : quest.rule, brandReward };
  });
  return { quests, changed: true };
}

/**
 * One-time upgrade: a stored seed quest without a rule takes the rule of the current seed with the same id and title.
 * Quests that already have a rule, and quests staff created, are left untouched.
 */
export function copySeedQuestRules(stored: ChallengeQuest[], seeds: ChallengeQuest[]): { quests: ChallengeQuest[]; changed: boolean } {
  const seedById = new Map(seeds.map((seed) => [seed.id, seed]));
  let changed = false;
  const quests = stored.map((quest) => {
    const seed = seedById.get(quest.id);
    if (quest.rule || !seed?.rule || quest.title !== seed.title) return quest;
    changed = true;
    return { ...quest, rule: seed.rule };
  });
  return { quests, changed };
}
