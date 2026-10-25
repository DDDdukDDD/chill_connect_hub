import { NextResponse } from 'next/server';
import { getSessionMember } from '@/lib/members/session';
import { inviteCodeOf, inviteesOf, wentTogether } from '@/lib/social/friends';
import { tidyDisplayName } from '@/lib/displayName';

// My invite link (ตั๋วเพื่อนซี้) and the friends who signed up with it, with whether we went to a ตี้ together
export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
  const code = await inviteCodeOf(member);
  const origin = process.env.APP_URL?.replace(/\/+$/, '') || new URL(request.url).origin;
  const invitees = await Promise.all(
    (await inviteesOf(member.id)).slice(0, 50).map(async (friend) => ({
      id: friend.id,
      displayName: tidyDisplayName(friend.displayName),
      avatarUrl: friend.avatarUrl,
      joinedAt: friend.createdAt,
      wentTogether: await wentTogether(member.id, friend.id),
    }))
  );
  return NextResponse.json({ success: true, code, url: `${origin}/?ref=${code}`, invitees }, { headers: { 'Cache-Control': 'no-store' } });
}
