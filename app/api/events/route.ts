import { NextResponse } from 'next/server';
import { loadCache } from '@/lib/eventsStore';

export async function GET() {
  const events = await loadCache();
  const approved = events.filter((ev) => ev.approvalStatus === 'approved');
  return NextResponse.json({
    success: true,
    total: approved.length,
    events: approved,
  });
}
