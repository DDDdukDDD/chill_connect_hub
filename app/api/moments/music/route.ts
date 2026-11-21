import { NextResponse } from 'next/server';
import { musicUses } from '@/lib/moments/service';

/**
 * How many public clips use each library song (BE-446): `{ success, uses: { [songId]: clips } }`, songs no clip uses
 * left out. The clip editor's song sheet sorts its มาแรง list by it. Counted again every 10 minutes.
 */
export async function GET() {
  return NextResponse.json({ success: true, uses: await musicUses() }, { headers: { 'Cache-Control': 'public, max-age=60' } });
}
