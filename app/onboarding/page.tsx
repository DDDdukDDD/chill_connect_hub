import { OnboardingFlow, type CameFor } from './OnboardingFlow';
import { safeReturnPath } from '@/components/auth/returnTo';
import { getPublicEvent } from '@/lib/publicContent';
import { readInviteToken } from '@/lib/social/inviteLinks';

export const metadata = { title: 'เริ่มต้นใช้งาน', robots: { index: false, follow: false } };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// /onboarding?returnTo=/moments · /onboarding?preview=1 (test the flow without an account; saves nothing)
// /onboarding?step=pledge&returnTo=/profile (an existing member reads and accepts the pledge only)
// A friend signing up to answer a "ไปกัน" plan (returnTo "…?invite=<plan token>&answer=1") also gets the pledge only,
// then lands in the plan's chat; the questions wait for later (owner 2026-11-11: do not lose them on the way)
export default async function OnboardingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const preview = first(params.preview) === '1';
  const returnTo = safeReturnPath(first(params.returnTo), '');
  return <OnboardingFlow preview={preview} pledgeOnly={!preview && (first(params.step) === 'pledge' || answersPlanInvite(returnTo))} returnTo={returnTo} cameFor={await cameForOf(returnTo)} />;
}

/** The ตี้ a visitor was joining when they signed up (returnTo "/community/<id>?join=1"), read on the server */
async function cameForOf(returnTo: string): Promise<CameFor | undefined> {
  const match = /^\/community\/([^/?#]+)/.exec(returnTo);
  if (!match) return undefined;
  let id: string;
  try {
    id = decodeURIComponent(match[1]);
  } catch {
    return undefined;
  }
  const event = await getPublicEvent(id, 'community');
  if (!event) return undefined;
  return { id: event.id, title: event.title, meta: [event.date, event.location].filter(Boolean).join(' · '), image: event.image, href: returnTo, lifestyleCategory: event.lifestyleCategory };
}

/** Sign-up started from a friend's plan invitation, to answer it ("ไปกัน") once back */
function answersPlanInvite(returnTo: string): boolean {
  const query = new URLSearchParams(returnTo.split('?')[1]?.split('#')[0] ?? '');
  return query.get('answer') === '1' && readInviteToken(query.get('invite'))?.kind === 'plan';
}
