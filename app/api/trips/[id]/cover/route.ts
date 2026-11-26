import { NextResponse } from 'next/server';
import { getSessionMember } from '@/lib/members/session';
import { OWN_MEDIA_HOSTS } from '@/lib/media/ownMedia';
import { getTrip } from '@/lib/trips/service';
import { itemPicture, tripCover } from '@/lib/trips/story';
import { tripFailure } from '@/lib/trips/http';

/**
 * GET → the trip's cover picture from our own address, so the browser may draw it into the 9:16 share card
 * (components/trips/storyCard.ts): a canvas cannot read a picture from another address. Our own media only, as the
 * viewer may see the trip.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const trip = await getTrip(id, await getSessionMember(request));
    const cover = trip ? tripCover(trip) : undefined;
    if (!cover) return new NextResponse(null, { status: 404 });
    const src = itemPicture(cover);
    // The full picture (trip photos are made 1600 px on the phone): the small copy is too soft for a 1080 px card
    const url = new URL(src);
    if (url.protocol !== 'https:' || !(OWN_MEDIA_HOSTS as readonly string[]).includes(url.hostname)) return new NextResponse(null, { status: 404 });
    const picture = await fetch(url, { cache: 'no-store' });
    if (!picture.ok || !picture.body) return new NextResponse(null, { status: 404 });
    return new NextResponse(picture.body, { headers: { 'Content-Type': picture.headers.get('content-type') ?? 'image/jpeg', 'Cache-Control': 'private, max-age=300' } });
  } catch (error) {
    return tripFailure(error, 'cover');
  }
}
