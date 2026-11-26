import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getPageMember } from '@/lib/members/session';
import { TripCreate } from '@/components/trips/TripCreate';

export const metadata: Metadata = { title: 'เล่าทริปใหม่', robots: { index: false, follow: false } };

/** Starts a trip: name and days, then the editor (docs/TRIPS_PLAN.md) */
export default async function NewTripPage() {
  if (!(await getPageMember())) redirect('/login?returnTo=/trips/new');
  return <TripCreate />;
}
