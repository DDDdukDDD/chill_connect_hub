import { NextResponse } from 'next/server';
import { ALL_PROVINCES } from '@/lib/discoverMatch';
import { discoverCounts } from '@/lib/publicContent';

/**
 * GET /api/discover/counts?q=&province= → how many meetups, fairs and places the ค้นพบ search finds
 * (the numbers on its tabs), and open challenges when there is a search word.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').slice(0, 100);
    const province = (searchParams.get('province') || ALL_PROVINCES).slice(0, 60);
    const counts = await discoverCounts(query, province);
    return NextResponse.json({ success: true, counts }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
  } catch (error) {
    console.error('Error in /api/discover/counts GET:', error);
    return NextResponse.json({ success: false, message: 'นับผลการค้นหาไม่สำเร็จ' }, { status: 500 });
  }
}
