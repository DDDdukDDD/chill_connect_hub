import { NextResponse } from 'next/server';
import { tidyDisplayName } from '@/lib/displayName';
import { getSessionMember } from '@/lib/members/session';
import { taggableFriends } from '@/lib/moments/service';

// People the signed-in member follows who follow back: the people they can tag in a moment
export async function GET(request: Request) {
  const member = await getSessionMember(request);
  if (!member) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  const friends = (await taggableFriends(member)).map((friend) => ({
    id: friend.id,
    name: tidyDisplayName(friend.displayName).trim() || friend.displayName,
    avatar: friend.avatarUrl ?? '',
  }));
  return NextResponse.json({ success: true, friends }, { headers: { 'Cache-Control': 'private, no-store' } });
}
