import { NextResponse } from 'next/server';
import { getPublicMasterData } from '@/lib/masterDataStore';

// Active master data for the public site (vibes, categories, venues, provinces, zones), ordered for display.
// Icons and colors come as keys; resolve them with the helpers in lib/masterData.ts.
export async function GET() {
  return NextResponse.json(
    { success: true, ...getPublicMasterData() },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
  );
}
