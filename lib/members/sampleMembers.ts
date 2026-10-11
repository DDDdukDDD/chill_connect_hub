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
  const samples = items.filter((m) => m.isSample);
  const now = Date.now();
  let index = 0;
  for (const moment of samples) {
    const handle = handleOf(moment.authorName);
    const details = SAMPLE_MEMBER_PROFILES[handle];
    if (!details) continue;
    const id = sampleMemberId(handle);
    const existing = await memberRepository.findById(id);
    // Keep sample accounts in step with data/sampleMembers.ts
    if (existing?.isSample && existing.preferences) {
      await memberRepository.update(id, { preferences: { ...existing.preferences, province: 'กรุงเทพฯ', interests: { communityCategories: [...new Set(details.interests)], spotVibes: [], fairCategories: [] } } });
    }
    if (!existing) {
      // Joined one to three months ago, so the account reads as an established member
      const joined = new Date(now - (30 + (index++ % 60)) * DAY).toISOString();
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
          interests: { communityCategories: [...new Set(details.interests)], spotVibes: [], fairCategories: [] },
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
    if (moment.authorId !== id) await momentRepository.mutate(moment.id, (m) => ({ ...m, authorId: id }));
  }
}

/** Runs once per server process; safe to call from any route that shows sample authors */
export function ensureSampleMembers(): Promise<void> {
  return (state._cchSampleMembersV2 ??= seed().catch((error) => {
    console.error('SAMPLE MEMBERS SEED FAILED:', error);
    state._cchSampleMembersV2 = undefined;
  }));
}
