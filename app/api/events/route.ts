import { NextResponse } from 'next/server';
import { getApprovedPublicEvents } from '@/lib/eventsStore';

export async function GET() {
  const events = getApprovedPublicEvents();
  return NextResponse.json({
    success: true,
    total: events.length,
    events,
  });
}
