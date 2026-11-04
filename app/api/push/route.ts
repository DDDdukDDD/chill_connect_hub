import { NextResponse } from 'next/server';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';
import { isPushEndpoint } from '@/lib/social/push';
import { pushStore } from '@/lib/social/pushStore';

const MAX_KEY_LENGTH = 256;
const MAX_ENDPOINT_LENGTH = 1024;

const text = (value: unknown, max: number) => (typeof value === 'string' && value.length > 0 && value.length <= max ? value : null);

// This device starts receiving the signed-in member's notifications
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const endpoint = text(body?.endpoint, MAX_ENDPOINT_LENGTH);
  const p256dh = text(body?.keys?.p256dh, MAX_KEY_LENGTH);
  const auth = text(body?.keys?.auth, MAX_KEY_LENGTH);
  if (!endpoint || !p256dh || !auth || !isPushEndpoint(endpoint)) return NextResponse.json({ success: false, message: 'เปิดการแจ้งเตือนบนเครื่องนี้ไม่ได้' }, { status: 400 });
  await pushStore.save({ memberId: member.id, endpoint, p256dh, auth });
  return NextResponse.json({ success: true });
}

// This device stops receiving notifications. No session needed: the endpoint is known only to the device itself,
// and a device whose session has ended must still be able to leave.
export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const endpoint = text(body?.endpoint, MAX_ENDPOINT_LENGTH);
  if (!endpoint) return NextResponse.json({ success: false, message: 'ไม่พบเครื่องนี้' }, { status: 400 });
  await pushStore.removeEndpoints([endpoint]);
  return NextResponse.json({ success: true });
}
