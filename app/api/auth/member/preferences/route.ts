import { NextResponse } from 'next/server';
import { toPublicMember } from '@/lib/members';
import { savePreferences } from '@/lib/members/accounts';
import { PreferencesError } from '@/lib/members/preferences';
import { getSessionMember, isSameOrigin } from '@/lib/members/session';

// My onboarding answers (null until onboarding is finished once)
export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  return NextResponse.json({ success: true, preferences: member.preferences ?? null, onboarded: Boolean(member.onboardedAt) }, { headers: { 'Cache-Control': 'no-store' } });
}

// { intent, goals[], birthYear?, gender?, interests: { communityCategories[], spotVibes[], fairCategories[] }, province? }
// Replaces the stored answers. Ids that are not in master data are dropped. The first save marks onboarding as done.
export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  try {
    const updated = await savePreferences(member, await request.json().catch(() => null));
    return NextResponse.json({ success: true, preferences: updated.preferences, member: toPublicMember(updated) });
  } catch (error) {
    if (error instanceof PreferencesError) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    return NextResponse.json({ success: false, message: 'บันทึกไม่สำเร็จ' }, { status: 400 });
  }
}
