import { createHash, randomBytes, sign as cryptoSign } from 'node:crypto';
import type { OAuthProfile } from './accounts';
import type { OAuthProvider } from './types';

/**
 * OAuth 2.0 / OpenID Connect sign-in for Google, Facebook and Apple (authorization code flow).
 * A provider is enabled only when its credentials are in the environment:
 *   Google:   GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
 *   Facebook: FACEBOOK_APP_ID, FACEBOOK_APP_SECRET
 *   Apple:    APPLE_CLIENT_ID (Services ID), APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY (.p8 contents)
 * Redirect URI to register with each provider: <site>/api/auth/member/oauth/<provider>/callback
 */
export const OAUTH_PROVIDERS: OAuthProvider[] = ['google', 'facebook', 'apple'];
const FB_VERSION = 'v19.0';

export function isProviderConfigured(provider: OAuthProvider): boolean {
  const env = process.env;
  if (provider === 'google') return Boolean(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET);
  if (provider === 'facebook') return Boolean(env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET);
  return Boolean(env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY);
}

export function providerStatus(): Record<OAuthProvider | 'email', boolean> {
  return { email: true, google: isProviderConfigured('google'), facebook: isProviderConfigured('facebook'), apple: isProviderConfigured('apple') };
}

export function isOAuthProvider(value: unknown): value is OAuthProvider {
  return typeof value === 'string' && (OAUTH_PROVIDERS as string[]).includes(value);
}

// ── PKCE / nonce helpers ──
export const randomToken = () => randomBytes(32).toString('base64url');
const challengeOf = (verifier: string) => createHash('sha256').update(verifier).digest('base64url');

export function buildAuthorizeUrl(provider: OAuthProvider, redirectUri: string, state: string, verifier: string, nonce: string): string {
  if (provider === 'google') {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      nonce,
      code_challenge: challengeOf(verifier),
      code_challenge_method: 'S256',
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }
  if (provider === 'facebook') {
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'public_profile,email',
      state,
      code_challenge: challengeOf(verifier),
      code_challenge_method: 'S256',
    });
    return `https://www.facebook.com/${FB_VERSION}/dialog/oauth?${params}`;
  }
  // Apple returns name/email only with response_mode=form_post (a POST to the callback)
  const params = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    response_mode: 'form_post',
    scope: 'name email',
    state,
    nonce,
  });
  return `https://appleid.apple.com/auth/authorize?${params}`;
}

async function postForm(url: string, body: Record<string, string>) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams(body),
    signal: AbortSignal.timeout(10000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`token exchange failed (${res.status}): ${JSON.stringify(json).slice(0, 200)}`);
  return json as Record<string, unknown>;
}

function decodeJwtPayload(token: unknown): Record<string, unknown> {
  if (typeof token !== 'string') throw new Error('missing id_token');
  const part = token.split('.')[1];
  if (!part) throw new Error('malformed id_token');
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf-8'));
}

/** Apple's client secret is a short-lived ES256 JWT signed with the team's private key */
function appleClientSecret(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: process.env.APPLE_KEY_ID })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: process.env.APPLE_TEAM_ID,
    iat: now,
    exp: now + 5 * 60,
    aud: 'https://appleid.apple.com',
    sub: process.env.APPLE_CLIENT_ID,
  })).toString('base64url');
  const key = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n');
  const signature = cryptoSign('sha256', Buffer.from(`${header}.${payload}`), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${header}.${payload}.${signature}`;
}

/**
 * Exchanges the authorization code for the member's provider profile.
 * ID tokens are read without signature verification because they come straight from the provider's
 * token endpoint over TLS (OpenID Connect Core 3.1.3.7); issuer, audience and nonce are still checked.
 */
export async function fetchOAuthProfile(
  provider: OAuthProvider,
  input: { code: string; redirectUri: string; verifier: string; nonce: string; appleUser?: string | null }
): Promise<OAuthProfile> {
  if (provider === 'google') {
    const tokens = await postForm('https://oauth2.googleapis.com/token', {
      code: input.code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      redirect_uri: input.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: input.verifier,
    });
    const claims = decodeJwtPayload(tokens.id_token);
    if (claims.aud !== process.env.GOOGLE_OAUTH_CLIENT_ID || !['https://accounts.google.com', 'accounts.google.com'].includes(String(claims.iss))) throw new Error('unexpected Google id_token');
    if (claims.nonce !== input.nonce) throw new Error('nonce mismatch');
    return {
      provider,
      subject: String(claims.sub),
      email: typeof claims.email === 'string' ? claims.email : undefined,
      emailVerified: claims.email_verified === true,
      displayName: typeof claims.name === 'string' ? claims.name : undefined,
      avatarUrl: typeof claims.picture === 'string' ? claims.picture : undefined,
    };
  }

  if (provider === 'facebook') {
    const tokens = await postForm(`https://graph.facebook.com/${FB_VERSION}/oauth/access_token`, {
      code: input.code,
      client_id: process.env.FACEBOOK_APP_ID!,
      client_secret: process.env.FACEBOOK_APP_SECRET!,
      redirect_uri: input.redirectUri,
      code_verifier: input.verifier,
    });
    const res = await fetch(`https://graph.facebook.com/${FB_VERSION}/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(String(tokens.access_token))}`, { signal: AbortSignal.timeout(10000) });
    const me = await res.json() as { id?: string; name?: string; email?: string; picture?: { data?: { url?: string } } };
    if (!res.ok || !me.id) throw new Error('Facebook profile request failed');
    return {
      provider,
      subject: me.id,
      email: me.email,
      emailVerified: Boolean(me.email), // Facebook only returns confirmed emails
      displayName: me.name,
      avatarUrl: me.picture?.data?.url,
    };
  }

  const tokens = await postForm('https://appleid.apple.com/auth/token', {
    code: input.code,
    client_id: process.env.APPLE_CLIENT_ID!,
    client_secret: appleClientSecret(),
    redirect_uri: input.redirectUri,
    grant_type: 'authorization_code',
  });
  const claims = decodeJwtPayload(tokens.id_token);
  if (claims.aud !== process.env.APPLE_CLIENT_ID || claims.iss !== 'https://appleid.apple.com') throw new Error('unexpected Apple id_token');
  if (claims.nonce !== input.nonce) throw new Error('nonce mismatch');
  // Apple sends the name once, on the first authorization, as a "user" form field
  let displayName: string | undefined;
  try {
    const user = input.appleUser ? JSON.parse(input.appleUser) as { name?: { firstName?: string; lastName?: string } } : null;
    displayName = [user?.name?.firstName, user?.name?.lastName].filter(Boolean).join(' ') || undefined;
  } catch {
    displayName = undefined;
  }
  return {
    provider,
    subject: String(claims.sub),
    email: typeof claims.email === 'string' ? claims.email : undefined,
    emailVerified: claims.email_verified === true || claims.email_verified === 'true',
    displayName,
  };
}
