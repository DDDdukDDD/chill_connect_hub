import { NextResponse } from 'next/server';
import { browseParamsFrom, browseSpots } from '@/lib/spotBrowse';

/**
 * GET /api/spots/browse — the /spots list filtered, ranked and counted on the server (see lib/spotBrowse.ts).
 * ?q, ?province, ?category, ?price=free, ?ids=a,b (saved), ?lat&lng (nearest first), ?t (opened at), ?limit (≤ 200).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    if (ids && ids.split(',').length > 500) return NextResponse.json({ success: false, error: 'Too many ids' }, { status: 400 });
    const result = await browseSpots(browseParamsFrom((key) => searchParams.get(key)));
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('GET /api/spots/browse failed:', error);
    return NextResponse.json({ success: false, error: 'Could not load places' }, { status: 500 });
  }
}
