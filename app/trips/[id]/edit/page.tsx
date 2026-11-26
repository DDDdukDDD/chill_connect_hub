import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getPageMember } from '@/lib/members/session';
import { getTrip } from '@/lib/trips/service';
import { TripEditor } from '@/components/trips/TripEditor';

export const metadata: Metadata = { title: 'แก้ไขทริป', robots: { index: false, follow: false } };

/** The author's editor: add photos, name the days, pick the cover, publish */
export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getPageMember();
  if (!member) redirect(`/login?returnTo=${encodeURIComponent(`/trips/${id}/edit`)}`);
  const trip = await getTrip(id, member);
  if (!trip?.isOwner) notFound();
  return <TripEditor initialTrip={trip} />;
}
