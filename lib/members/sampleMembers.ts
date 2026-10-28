import { SAMPLE_MEMBER_PROFILES } from '@/data/sampleMembers';
import { momentRepository } from '../moments';
import { memberRepository } from './index';
import { TERMS_VERSION } from './preferences';
import { PLEDGE_VERSION } from './trust';
import type { Member } from './types';

/**
 * SAMPLE DATA (development only, remove before launch).
 * Gives every author of the bundled sample moments a sample account with a full profile, and links
 * their moments to it, so visitors can open the profile and follow them like a real member.
 * Sample accounts are marked `isSample`, have no password or provider, and so cannot sign in.
 */
const DAY = 24 * 60 * 60 * 1000;
const state = globalThis as unknown as { _cchSampleMembersV2?: Promise<void> };

const handleOf = (name: string) => name.match(/\(([^)]+)\)/)?.[1]?.trim() ?? '';
export const sampleMemberId = (handle: string) => `mem_sample_${handle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

async function seed(): Promise<void> {
  const { items } = await momentRepository.query({ statuses: ['published', 'hidden', 'removed'], sort: 'newest', page: 1, limit: 10_000 });
  // One pass per author, not per moment, and the authors side by side: done one moment at a time with a write
  // each, the first page after a server start waited ~11 s for it (2026-10-28)
  const byHandle = new Map<string, typeof items>();
  for (const moment of items) {
    const handle = moment.isSample ? handleOf(moment.authorName) : '';
    if (!handle || !SAMPLE_MEMBER_PROFILES[handle]) continue;
    byHandle.set(handle, [...(byHandle.get(handle) ?? []), moment]);
  }
  const now = Date.now();
  await Promise.all([...byHandle].map(([handle, moments], index) => seedAuthor(handle, moments, now - (30 + (index % 60)) * DAY)));
}

const sameSet = (a: string[] = [], b: string[] = []) => a.length === b.length && a.every((x) => b.includes(x));

async function seedAuthor(handle: string, moments: Awaited<ReturnType<typeof momentRepository.query>>['items'], joinedAt: number): Promise<void> {
  const details = SAMPLE_MEMBER_PROFILES[handle];
  const moment = moments[0];
  const id = sampleMemberId(handle);
  const interests = [...new Set(details.interests)];
  const existing = await memberRepository.findById(id);
  // Keep sample accounts in step with data/sampleMembers.ts (written only when they differ)
  const prefs = existing?.preferences;
  if (existing?.isSample && prefs && (prefs.province !== 'กรุงเทพฯ' || !sameSet(prefs.interests?.communityCategories, interests) || prefs.interests?.spotVibes?.length || prefs.interests?.fairCategories?.length)) {
    await memberRepository.update(id, { preferences: { ...prefs, province: 'กรุงเทพฯ', interests: { communityCategories: interests, spotVibes: [], fairCategories: [] } } });
  }
  if (!existing) {
    // Joined one to three months ago, so the account reads as an established member
    const joined = new Date(joinedAt).toISOString();
    const member: Member = {
      id,
      displayName: moment.authorName,
      email: `${handle.toLowerCase()}@sample.invalid`,
      emailVerified: true,
      avatarUrl: moment.authorAvatar,
      providers: [],
      status: 'active',
      sessionVersion: 0,
      consentAt: joined,
      consent: { termsVersion: TERMS_VERSION, acceptedAt: joined, ageConfirmedAt: joined, source: 'signup_form' } as Member['consent'],
      preferences: {
        intent: 'member',
        goals: [],
        birthYear: details.birthYear,
        gender: details.gender,
        interests: { communityCategories: interests, spotVibes: [], fairCategories: [] },
        province: 'กรุงเทพฯ',
        updatedAt: joined,
      },
      onboardedAt: joined,
      profile: {
        bio: details.bio,
        occupation: details.occupation,
        education: details.education,
        hometown: details.hometown,
        livingArea: details.livingArea,
        connectGoal: details.connectGoal,
        hidden: ['workplace', 'relationshipStatus', 'age'],
      },
      pledgeAcceptedAt: joined,
      pledgeVersion: PLEDGE_VERSION,
      isSample: true,
      createdAt: joined,
    };
    await memberRepository.create(member);
  }
  for (const m of moments) if (m.authorId !== id) await momentRepository.mutate(m.id, (current) => ({ ...current, authorId: id }));
}

/** Runs once per server process; safe to call from any route that shows sample authors */
export function ensureSampleMembers(): Promise<void> {
  return (state._cchSampleMembersV2 ??= seed().catch((error) => {
    console.error('SAMPLE MEMBERS SEED FAILED:', error);
    state._cchSampleMembersV2 = undefined;
  }));
}
