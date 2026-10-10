import type { NextRequest } from 'next/server';
import type { OAuthProvider } from '@/lib/members';

export const OAUTH_STATE_COOKIE = 'cch_oauth_state';

/** Only same-site paths, never "//host" or absolute URLs (open redirect) */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/';
  return value.slice(0, 300);
}

/** The redirect URI registered with each provider; APP_URL overrides the request origin behind proxies */
export function oauthCallbackUrl(request: NextRequest, provider: OAuthProvider): string {
  const origin = process.env.APP_URL?.replace(/\/+$/, '') || request.nextUrl.origin;
  return `${origin}/api/auth/member/oauth/${provider}/callback`;
}

/** Errors land on /login (which shows them) and keep where the member was heading */
export function loginErrorPath(returnTo: string, message: string): string {
  return `/login?auth_error=${encodeURIComponent(message)}&returnTo=${encodeURIComponent(returnTo)}`;
}
