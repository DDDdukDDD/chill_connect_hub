'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemberSession } from '@/lib/useMemberSession';

// Pages a member may open before finishing onboarding: the flow itself, sign-in, and the legal text
const OPEN_PATHS = ['/onboarding', '/login', '/legal', '/verify-email', '/reset-password', '/admin'];

/**
 * Members who left onboarding part way (e.g. the browser's back button after social sign-in) are signed in but
 * have no answers yet. Those answers matter (owner 2026-10-31), so any other page sends them back to finish,
 * then onboarding returns them to the page they opened. Renders nothing.
 */
export function OnboardingResume() {
  const session = useMemberSession();
  const pathname = usePathname();
  const router = useRouter();
  const needsOnboarding = session.isLoaded && Boolean(session.member) && !session.member?.onboarded;

  useEffect(() => {
    if (!needsOnboarding || OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;
    router.replace(`/onboarding?returnTo=${encodeURIComponent(pathname + window.location.search)}`);
  }, [needsOnboarding, pathname, router]);

  return null;
}
