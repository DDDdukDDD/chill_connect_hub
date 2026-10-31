import { NextResponse } from 'next/server';
import { toPublicMember } from '@/lib/members';
import { providerStatus } from '@/lib/members/oauth';
import { clearMemberSessionCookie, getSessionMember, getSessionSecret } from '@/lib/members/session';

// Current member session and which login methods are available
export async function GET(request: Request) {
  const member = await getSessionMember(request);
  return NextResponse.json(
    {
      success: true,
      authenticated: Boolean(member),
      member: member ? toPublicMember(member) : null,
      providers: providerStatus(),
      available: Boolean(getSessionSecret()),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

// Log out (this browser)
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearMemberSessionCookie(response);
  return response;
}
