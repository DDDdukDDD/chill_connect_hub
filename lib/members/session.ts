import fs from 'fs';
import path from 'path';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { readCookie } from '../adminSession';
import { memberRepository } from './index';
import type { Member } from './types';

/**
 * Member sessions: an HMAC-signed httpOnly cookie carrying { sub, ver, exp }.
 * Every request re-reads the member, so suspensions, bans and "log out everywhere" apply at once.
 * Signing key: AUTH_SECRET (required in production). In local development without it, a random key is
 * generated once into data/.dev_session_secret (gitignored).
 */
export const MEMBER_SESSION_COOKIE = 'cch_member_session';
export const MEMBER_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const DEV_SECRET_FILE = path.join(process.cwd(), 'data', '.dev_session_secret');

let devSecret: string | null = null;

export function getSessionSecret(): string | null {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === 'production') return null;
  if (!devSecret) {
    try {
      devSecret = fs.readFileSync(DEV_SECRET_FILE, 'utf-8').trim();
    } catch {
      devSecret = randomBytes(32).toString('hex');
      try {
        fs.mkdirSync(path.dirname(DEV_SECRET_FILE), { recursive: true });
        fs.writeFileSync(DEV_SECRET_FILE, devSecret, 'utf-8');
      } catch {
        // Keep the in-memory key for this process
      }
    }
  }
  return devSecret;
}

const sign = (payload: string, secret: string) => createHmac('sha256', secret).update(payload).digest('base64url');

/** Signed value for any short JSON payload (sessions and OAuth state) */
export function signPayload(payload: object): string {
  const secret = getSessionSecret();
  if (!secret) throw new Error('AUTH_SECRET is not configured');
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${sign(encoded, secret)}`;
}

export function readSignedPayload<T>(token: string | null | undefined): T | null {
  const secret = getSessionSecret();
  if (!secret || !token) return null;
  const [encoded, signature, ...rest] = token.split('.');
  if (!encoded || !signature || rest.length) return null;
  const expected = Buffer.from(sign(encoded, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as T;
  } catch {
    return null;
  }
}

interface SessionPayload {
  sub: string;
  ver: number;
  exp: number;
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const, // lax: the OAuth callback is a top-level navigation from the provider
  path: '/',
  maxAge,
});

export function setMemberSessionCookie(response: NextResponse, member: Member) {
  const exp = Math.floor(Date.now() / 1000) + MEMBER_SESSION_TTL_SECONDS;
  response.cookies.set(MEMBER_SESSION_COOKIE, signPayload({ sub: member.id, ver: member.sessionVersion, exp }), cookieOptions(MEMBER_SESSION_TTL_SECONDS));
}

export function clearMemberSessionCookie(response: NextResponse) {
  response.cookies.set(MEMBER_SESSION_COOKIE, '', cookieOptions(0));
}

/** Lifts an expired suspension; returns the member as it should be treated now */
export async function refreshMemberStatus(member: Member): Promise<Member> {
  if (member.status === 'suspended' && member.suspendedUntil && new Date(member.suspendedUntil).getTime() <= Date.now()) {
    return memberRepository.update(member.id, { status: 'active', suspendedUntil: undefined, statusReason: undefined });
  }
  return member;
}

/** The signed-in, active member for this request, or null */
export async function getSessionMember(request: Request): Promise<Member | null> {
  const payload = readSignedPayload<SessionPayload>(readCookie(request, MEMBER_SESSION_COOKIE));
  if (!payload || typeof payload.sub !== 'string' || payload.exp <= Math.floor(Date.now() / 1000)) return null;
  const stored = await memberRepository.findById(payload.sub);
  if (!stored || stored.sessionVersion !== payload.ver) return null;
  const member = await refreshMemberStatus(stored);
  return member.status === 'active' ? member : null;
}

/** Same-origin check for cookie-authenticated writes (CSRF defense on top of SameSite=Lax) */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return request.headers.get('sec-fetch-site') !== 'cross-site';
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || new URL(request.url).host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
