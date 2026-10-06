import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { countStaff } from './staffStore';

/**
 * Stateless admin session: an HMAC-SHA256 signed token stored in an httpOnly cookie.
 * Server-side only. Configure with:
 *   ADMIN_PASSWORD — owner password for the /admin login form (works without an email)
 *   AUTH_SECRET    — signing key, at least 32 characters
 * Staff accounts (lib/staffStore.ts) sign in with email + password and get the same cookie.
 */
export const ADMIN_SESSION_COOKIE = 'cch_admin_session';
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours

const MIN_SECRET_LENGTH = 32;

/** Subject of the env-based owner login (ADMIN_PASSWORD) */
export const ENV_OWNER_SUBJECT = 'owner';

export interface AdminSessionPayload {
  /** ENV_OWNER_SUBJECT or a staff account id */
  sub: string;
  /** Staff sessionVersion at login; a mismatch means the session was revoked */
  ver: number;
  iat: number;
  exp: number;
}

function getSecret(): string | null {
  const secret = process.env.AUTH_SECRET;
  return secret && secret.length >= MIN_SECRET_LENGTH ? secret : null;
}

export function isAdminLoginConfigured(): boolean {
  return Boolean(getSecret() && (process.env.ADMIN_PASSWORD || countStaff() > 0));
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

export function createAdminSessionToken(subject: string, version: number, now: number = Date.now()): string {
  const secret = getSecret();
  if (!secret) throw new Error('AUTH_SECRET is not configured');
  const issuedAt = Math.floor(now / 1000);
  const payload: AdminSessionPayload = { sub: subject, ver: version, iat: issuedAt, exp: issuedAt + ADMIN_SESSION_TTL_SECONDS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${sign(encoded, secret)}`;
}

/** Returns the signed payload when the token is authentic and unexpired; revocation is checked by the caller. */
export function readAdminSessionToken(token: string | undefined | null, now: number = Date.now()): AdminSessionPayload | null {
  const secret = getSecret();
  if (!secret || !token) return null;

  const [encoded, signature, ...rest] = token.split('.');
  if (!encoded || !signature || rest.length > 0) return null;
  if (!safeEqual(signature, sign(encoded, secret))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as Partial<AdminSessionPayload>;
    if (typeof payload.sub !== 'string' || typeof payload.ver !== 'number') return null;
    if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(now / 1000)) return null;
    return payload as AdminSessionPayload;
  } catch {
    return null;
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
