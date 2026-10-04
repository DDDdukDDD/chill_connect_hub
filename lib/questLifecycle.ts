import { ChallengeQuest } from '@/data/mockData';
import { parseEventDateToTimestamp, parseEventEndDateToTimestamp } from './dateUtils';

const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Parses a quest date: ISO ("2026-12-31") or Thai ("31 ธ.ค. 2026").
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
 */
export function applyQuestLifecycle(quest: ChallengeQuest, now: number = Date.now()): ChallengeQuest {
  const end = parseQuestDate(quest.endDate, true);
  if (end === null) {
    const { daysRemaining: _ignored, ...rest } = quest;
    void _ignored;
    return { ...rest, status: quest.status ?? 'active' };
  }

  const hasEnded = end < now;
  const daysRemaining = hasEnded ? 0 : Math.max(0, Math.ceil((end - now) / DAY_MS));
  const status = quest.status === 'draft' ? 'draft' : hasEnded ? 'ended' : quest.status ?? 'active';
  return { ...quest, daysRemaining, status };
}

/** Validation helper for admin writes: both dates parse and the end is not before the start. */
export function getQuestDateError(startDate?: string, endDate?: string): string | null {
  const start = parseQuestDate(startDate, false);
  const end = parseQuestDate(endDate, true);
  if (startDate && start === null) return 'รูปแบบวันเริ่มต้นไม่ถูกต้อง (ใช้ YYYY-MM-DD หรือ เช่น 1 ต.ค. 2026)';
  if (endDate && end === null) return 'รูปแบบวันสิ้นสุดไม่ถูกต้อง (ใช้ YYYY-MM-DD หรือ เช่น 31 ธ.ค. 2026)';
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
