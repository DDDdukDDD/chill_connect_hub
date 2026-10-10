import { NextRequest, NextResponse } from 'next/server';
import { buildAuthorizeUrl, isOAuthProvider, isProviderConfigured, randomToken } from '@/lib/members/oauth';
import { getSessionSecret, signPayload } from '@/lib/members/session';
import { oauthCallbackUrl, OAUTH_STATE_COOKIE, safeReturnTo } from '../shared';

// Starts social sign-in: /api/auth/member/oauth/google?returnTo=/moments
export async function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const fail = (message: string) => NextResponse.redirect(new URL(`${returnTo}${returnTo.includes('?') ? '&' : '?'}auth_error=${encodeURIComponent(message)}`, request.url));

  if (!isOAuthProvider(provider)) return fail('ไม่รู้จักช่องทางเข้าสู่ระบบนี้');
  if (!isProviderConfigured(provider)) return fail('ช่องทางนี้ยังไม่เปิดใช้งาน');
  if (!getSessionSecret()) return fail('ระบบสมาชิกยังไม่ได้ตั้งค่า');

  const state = randomToken();
  const verifier = randomToken();
  const nonce = randomToken();
  const response = NextResponse.redirect(buildAuthorizeUrl(provider, oauthCallbackUrl(request, provider), state, verifier, nonce));
  response.cookies.set(
    OAUTH_STATE_COOKIE,
    signPayload({ provider, state, verifier, nonce, returnTo, exp: Math.floor(Date.now() / 1000) + 600 }),
    // SameSite=None: Apple returns with a cross-site POST, which would drop a Lax cookie
    { httpOnly: true, secure: true, sameSite: 'none', path: '/api/auth/member/oauth', maxAge: 600 }
  );
  return response;
}
