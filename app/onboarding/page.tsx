import { OnboardingFlow, type CameFor } from './OnboardingFlow';
import { safeReturnPath } from '@/components/auth/returnTo';
import { getPublicEvent } from '@/lib/publicContent';

export const metadata = { title: 'เริ่มต้นใช้งาน', robots: { index: false, follow: false } };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// /onboarding?returnTo=/moments · /onboarding?preview=1 (test the flow without an account; saves nothing)
// /onboarding?step=pledge&returnTo=/profile (an existing member reads and accepts the pledge only)
export default async function OnboardingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const preview = first(params.preview) === '1';
  const returnTo = safeReturnPath(first(params.returnTo), '');
  return <OnboardingFlow preview={preview} pledgeOnly={!preview && first(params.step) === 'pledge'} returnTo={returnTo} cameFor={await cameForOf(returnTo)} />;
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
