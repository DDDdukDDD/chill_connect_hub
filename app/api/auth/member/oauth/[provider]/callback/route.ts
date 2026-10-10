import { NextRequest, NextResponse } from 'next/server';
import { MemberAuthError, signInWithOAuth } from '@/lib/members/accounts';
import { fetchOAuthProfile, isOAuthProvider } from '@/lib/members/oauth';
import { applySignupChecks, hashIp } from '@/lib/members/safety';
import { getSessionSecret, readSignedPayload, setMemberSessionCookie } from '@/lib/members/session';
import { clientIp } from '@/lib/rateLimit';
import { readCookie } from '@/lib/adminSession';
import { loginErrorPath, oauthCallbackUrl, OAUTH_STATE_COOKIE, safeReturnTo } from '../../shared';

interface StatePayload {
  provider: string;
  state: string;
  verifier: string;
  nonce: string;
  returnTo: string;
  consented?: boolean;
  exp: number;
}

async function handleCallback(request: NextRequest, provider: string, params: URLSearchParams) {
  const stored = readSignedPayload<StatePayload>(readCookie(request, OAUTH_STATE_COOKIE));
  const returnTo = safeReturnTo(stored?.returnTo);
  const redirect = (path: string) => {
    // 303 so a POST callback (Apple) becomes a GET of the page
    const response = NextResponse.redirect(new URL(path, request.url), 303);
    response.cookies.set(OAUTH_STATE_COOKIE, '', { httpOnly: true, secure: true, sameSite: 'none', path: '/api/auth/member/oauth', maxAge: 0 });
    return response;
  };
  const fail = (message: string) => redirect(loginErrorPath(returnTo, message));

  if (!isOAuthProvider(provider)) return fail('ไม่รู้จักช่องทางเข้าสู่ระบบนี้');
  if (params.get('error')) return fail('ยกเลิกการเข้าสู่ระบบ');
  if (!stored || stored.provider !== provider || stored.exp < Math.floor(Date.now() / 1000) || stored.state !== params.get('state')) {
    return fail('ลิงก์เข้าสู่ระบบหมดอายุ กรุณาลองใหม่');
  }
  const code = params.get('code');
  if (!code) return fail('เข้าสู่ระบบไม่สำเร็จ');

  try {
    const profile = await fetchOAuthProfile(provider, {
      code,
      redirectUri: oauthCallbackUrl(request, provider),
      verifier: stored.verifier,
      nonce: stored.nonce,
      appleUser: params.get('user'),
    });
    const { member, created } = await signInWithOAuth(profile, { consented: Boolean(stored.consented) });
    if (created) await applySignupChecks(member, hashIp(clientIp(request), getSessionSecret() ?? ''));
    // New members pick their interests first, then continue to where they were heading
    const response = redirect(created
      ? `/onboarding?returnTo=${encodeURIComponent(returnTo)}`
      : `${returnTo}${returnTo.includes('?') ? '&' : '?'}auth=success`);
    setMemberSessionCookie(response, member);
    return response;
  } catch (error) {
    console.error(`[member oauth ${provider}]`, error);
    return fail(error instanceof MemberAuthError ? error.message : 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่');
  }
}

// Google and Facebook return with a GET
export async function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  return handleCallback(request, provider, request.nextUrl.searchParams);
}

// Apple returns with a form POST (response_mode=form_post)
export async function POST(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  const form = await request.formData();
  const params = new URLSearchParams();
  for (const [key, value] of form.entries()) if (typeof value === 'string') params.set(key, value);
  return handleCallback(request, provider, params);
}
