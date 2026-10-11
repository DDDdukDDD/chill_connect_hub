import { NextResponse } from 'next/server';
import { getAdminActor } from '@/lib/adminApiAuth';
import { isGoogleMapsUrl, resolveMapCoordinates } from '@/lib/mapLinks';
import { getSessionMember } from '@/lib/members/session';
import { clientIp, isRateLimited } from '@/lib/rateLimit';

// { url } → { success, coordinates: { latitude, longitude } | null }
// Reads the pin from a Google Maps link so the create dialog and the admin spot editor can show it before saving.
export async function POST(request: Request) {
  const member = await getSessionMember(request);
  if (!member && !getAdminActor(request)) {
    return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  }
  if (isRateLimited(`map-resolve:${member?.id ?? clientIp(request)}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ success: false, message: 'ลองหลายครั้งเกินไป รอสักครู่แล้วลองใหม่' }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  const url = typeof body?.url === 'string' ? body.url.trim().slice(0, 500) : '';
  if (!isGoogleMapsUrl(url)) {
    return NextResponse.json({ success: false, message: 'ลิงก์ต้องเป็นลิงก์ Google Maps ที่ขึ้นต้นด้วย https://' }, { status: 400 });
  }
  const coordinates = await resolveMapCoordinates(url);
  return NextResponse.json({ success: true, coordinates }, { headers: { 'Cache-Control': 'no-store' } });
}
