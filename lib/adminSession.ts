import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Stateless admin session: an HMAC-SHA256 signed token stored in an httpOnly cookie.
 * Server-side only. Configure with:
 *   ADMIN_PASSWORD — password for the /admin login form
 *   AUTH_SECRET    — signing key, at least 32 characters
 */
export const ADMIN_SESSION_COOKIE = 'cch_admin_session';
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours

const MIN_SECRET_LENGTH = 32;

interface AdminSessionPayload {
  sub: 'admin';
  iat: number;
  exp: number;
}

function getSecret(): string | null {
  const secret = process.env.AUTH_SECRET;
  return secret && secret.length >= MIN_SECRET_LENGTH ? secret : null;
}

export function isAdminLoginConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && getSecret());
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof candidate !== 'string') return false;
  // Compare fixed-length digests so the check does not leak the password length
  const expectedDigest = createHash('sha256').update(expected).digest();
  const candidateDigest = createHash('sha256').update(candidate).digest();
  return timingSafeEqual(expectedDigest, candidateDigest);
}

export function createAdminSessionToken(now: number = Date.now()): string {
  const secret = getSecret();
  if (!secret) throw new Error('AUTH_SECRET is not configured');
  const issuedAt = Math.floor(now / 1000);
  const payload: AdminSessionPayload = { sub: 'admin', iat: issuedAt, exp: issuedAt + ADMIN_SESSION_TTL_SECONDS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${sign(encoded, secret)}`;
}

export function verifyAdminSessionToken(token: string | undefined | null, now: number = Date.now()): boolean {
  const secret = getSecret();
  if (!secret || !token) return false;

  const [encoded, signature, ...rest] = token.split('.');
  if (!encoded || !signature || rest.length > 0) return false;
  if (!safeEqual(signature, sign(encoded, secret))) return false;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as Partial<AdminSessionPayload>;
    return payload.sub === 'admin' && typeof payload.exp === 'number' && payload.exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) {
      try {
        return decodeURIComponent(part.slice(separator + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}
