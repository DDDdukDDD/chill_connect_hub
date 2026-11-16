import { NextResponse } from 'next/server';
import { listRewards } from '@/lib/rewards/catalog';

// The rewards catalog for the browser (staff edit it in the admin console). The same for everyone, so the CDN keeps
// it a minute; a member's own entries come from GET /api/rewards
export async function GET() {
  try {
    return NextResponse.json(
      // Hidden ones too, marked: a member who redeemed one still sees it; shop lists leave them out
      { success: true, rewards: await listRewards() },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (error) {
    console.error('Error in /api/rewards/catalog GET:', error);
    return NextResponse.json({ success: false, rewards: [] }, { status: 500 });
  }
}
