import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { datesWithSeats, isSeries } from '@/lib/social/recurring';

type Context = { params: Promise<{ id: string }> };

// Public: the next dates of a recurring ตี้ with the seats taken on each ({ date, label, eventId, taken, max, full })
export async function GET(_request: Request, context: Context) {
  const event = await db.findEventById((await context.params).id);
  if (!event || event.approvalStatus !== 'approved' || !isSeries(event)) return NextResponse.json({ success: false, message: 'ไม่พบตี้ประจำนี้' }, { status: 404 });
  return NextResponse.json({ success: true, dates: await datesWithSeats(event) }, { headers: { 'Cache-Control': 'no-store' } });
}
