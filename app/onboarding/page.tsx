import { OnboardingFlow } from './OnboardingFlow';
import { safeReturnPath } from '@/components/auth/returnTo';

export const metadata = { title: 'เริ่มต้นใช้งาน · Chill & Connect Hub' };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// /onboarding?returnTo=/moments · /onboarding?preview=1 (test the flow without an account; saves nothing)
export default async function OnboardingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <OnboardingFlow preview={first(params.preview) === '1'} returnTo={safeReturnPath(first(params.returnTo), '')} />;
}
