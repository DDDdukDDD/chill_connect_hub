import { getMasterData } from '../masterDataStore';
import type { MemberConsent, MemberPreferences } from './types';

/**
 * Onboarding answers and consent details for a member.
 * Interests and the province are checked against admin-managed master data, so stored ids always
 * match content ids. Unknown ids are dropped, not rejected (master data can change between screens).
 */

/** Bump when the terms or privacy text changes in a way members must accept again */
export const TERMS_VERSION = '2026-10-draft';
export const MIN_MEMBER_AGE = 18;

const INTENTS = ['member', 'host', 'venue', 'organizer'] as const;
const GENDERS = ['female', 'male', 'lgbtq'] as const;
const GOAL_ID = /^[a-z][a-z0-9_]{1,39}$/;

const stringList = (value: unknown, max: number): string[] =>
  Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === 'string'))].slice(0, max) : [];

export class PreferencesError extends Error {}

export function cleanPreferences(input: unknown): MemberPreferences {
  if (!input || typeof input !== 'object') throw new PreferencesError('ข้อมูลไม่ถูกต้อง');
  const raw = input as Record<string, unknown>;
  const master = getMasterData();
  const activeIds = (entries: { id: string; active: boolean }[]) => new Set(entries.filter((e) => e.active).map((e) => e.id));
  const pick = (value: unknown, allowed: Set<string>) => stringList(value, 30).filter((id) => allowed.has(id));
  const interests = (raw.interests && typeof raw.interests === 'object' ? raw.interests : {}) as Record<string, unknown>;

  let birthYear: number | undefined;
  if (raw.birthYear !== undefined && raw.birthYear !== null && raw.birthYear !== '') {
    const year = Number(raw.birthYear);
    const thisYear = new Date().getFullYear();
    if (!Number.isInteger(year) || year < thisYear - 100 || year > thisYear) throw new PreferencesError('ปีเกิดไม่ถูกต้อง');
    if (year > thisYear - MIN_MEMBER_AGE) throw new PreferencesError(`สมาชิกต้องมีอายุ ${MIN_MEMBER_AGE} ปีขึ้นไป`);
    birthYear = year;
  }

  const province = typeof raw.province === 'string' && activeIds(master.provinces).has(raw.province) ? raw.province : undefined;
  return {
    intent: INTENTS.includes(raw.intent as (typeof INTENTS)[number]) ? (raw.intent as MemberPreferences['intent']) : 'member',
    goals: stringList(raw.goals, 12).filter((id) => GOAL_ID.test(id)),
    birthYear,
    gender: GENDERS.includes(raw.gender as (typeof GENDERS)[number]) ? (raw.gender as MemberPreferences['gender']) : undefined,
    interests: {
      communityCategories: pick(interests.communityCategories, activeIds(master.communityCategories)),
      spotVibes: pick(interests.spotVibes, activeIds(master.spotVibes)),
      fairCategories: pick(interests.fairCategories, activeIds(master.fairCategories)),
    },
    province,
    updatedAt: new Date().toISOString(),
  };
}

export function newConsent(source: MemberConsent['source'], ageConfirmed: boolean): MemberConsent {
  const now = new Date().toISOString();
  return { termsVersion: TERMS_VERSION, acceptedAt: now, ageConfirmedAt: ageConfirmed ? now : undefined, source };
}
