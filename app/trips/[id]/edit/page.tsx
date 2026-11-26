import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getPageMember } from '@/lib/members/session';
import { getTrip } from '@/lib/trips/service';
import { TripEditor } from '@/components/trips/TripEditor';

export const metadata: Metadata = { title: 'แก้ไขทริป', robots: { index: false, follow: false } };

/** The author's editor: add photos, name the days, pick the cover, publish */
/** `?play=1`: opens the story preview at once (a trip just made from a day's moments, lib/trips/suggest.ts) */
export default async function EditTripPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ play?: string }> }) {
  const { id } = await params;
  const play = (await searchParams).play === '1';
  const member = await getPageMember();
  if (!member) redirect(`/login?returnTo=${encodeURIComponent(`/trips/${id}/edit`)}`);
  const trip = await getTrip(id, member);
  if (!trip?.isOwner) notFound();
  return <TripEditor initialTrip={trip} autoPreview={play && trip.items.length > 0} />;
}
