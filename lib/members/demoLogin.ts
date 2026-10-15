import { memberRepository } from './index';
import { TERMS_VERSION } from './preferences';
import { PLEDGE_VERSION } from './trust';
import type { Member } from './types';

/**
 * PROTOTYPE ONLY (remove before launch, docs/LAUNCH_CHECKLIST.md).
 * "ลองใช้เลย ไม่ต้องสมัคร" on the login screen signs the visitor in as one shared test account, so the
 * site can be tried on Vercel, where member accounts live in a per-instance /tmp file and can vanish
 * between requests. The account is rebuilt from this file whenever an instance does not have it,
 * so a session for it never drops. Opt-in: on in local development, and on a deployment only with
 * DEMO_LOGIN=on. Sessions are still signed with AUTH_SECRET, which a deployment must set.
 */
export const DEMO_MEMBER_ID = 'mem_demo_tester';

export const isDemoLoginEnabled = () => process.env.DEMO_LOGIN === 'on' || process.env.NODE_ENV !== 'production';

const demoMember = (now: string): Member => ({
  id: DEMO_MEMBER_ID,
  displayName: 'ผู้ทดลองใช้',
  email: 'demo@sample.invalid',
  emailVerified: true,
  providers: [],
  status: 'active',
  sessionVersion: 0,
  consentAt: now,
  consent: { termsVersion: TERMS_VERSION, acceptedAt: now, ageConfirmedAt: now, source: 'signup_form' } as Member['consent'],
  preferences: {
    intent: 'member',
    goals: [],
    interests: { communityCategories: ['cafe_social', 'running_fitness'], spotVibes: [], fairCategories: [] },
    province: 'กรุงเทพฯ',
    updatedAt: now,
  },
  onboardedAt: now,
  pledgeAcceptedAt: now,
  pledgeVersion: PLEDGE_VERSION,
  createdAt: now,
});

/** The shared test account, created on this instance when it is missing */
export async function ensureDemoMember(): Promise<Member> {
  const existing = await memberRepository.findById(DEMO_MEMBER_ID);
  if (existing) return existing;
  return memberRepository.create(demoMember(new Date().toISOString()));
}
