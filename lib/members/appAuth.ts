import { createHash } from 'node:crypto';
import { readSignedPayload, signPayload } from './session';
import type { Member } from './types';

/**
 * Social sign-in inside the store app (iPhone step 2, 2026-11-18). Google refuses sign-in inside an embedded web view and
 * the app's web view cannot keep a provider's redirect, so the app opens sign-in in the system sheet
 * (ASWebAuthenticationSession, ios-app WebAuthPlugin). The sheet has its own cookies, so the session is not set there:
 * the callback sends the sheet to `chillwaa://auth?t=<code>`, the sheet closes and hands that URL to the app, and the
 * app's web view trades the code for its own session (POST /api/auth/member/app-session).
 *
 * The code is signed, lives 2 minutes, and is bound to the web view that started: the app sends sha256(verifier) as
 * `app=` when it starts and must show the verifier when it trades the code (the same idea as PKCE), so a code read off
 * the URL is useless anywhere else.
 */

export const APP_AUTH_SCHEME = 'chillwaa';
const HANDOFF_SECONDS = 120;

interface Handoff {
  typ: 'app-handoff';
  sub: string;
  ver: number;
  /** A new member: the app's web view attaches the inviter it holds (the sheet has no invite cookie) */
  created: boolean;
  next: string;
  ch: string;
  exp: number;
}

/** sha256 of the verifier, base64url: 43 characters */
export const isAppChallenge = (value: string | null | undefined): value is string => !!value && /^[A-Za-z0-9_-]{43}$/.test(value);

const challengeOf = (verifier: string) => createHash('sha256').update(verifier).digest('base64url');

export function appHandoffUrl(member: Member, created: boolean, next: string, challenge: string): string {
  const payload: Handoff = { typ: 'app-handoff', sub: member.id, ver: member.sessionVersion, created, next, ch: challenge, exp: Math.floor(Date.now() / 1000) + HANDOFF_SECONDS };
  return `${APP_AUTH_SCHEME}://auth?t=${encodeURIComponent(signPayload(payload))}`;
}

export const appErrorUrl = (message: string) => `${APP_AUTH_SCHEME}://auth?error=${encodeURIComponent(message)}`;

/** The handoff when it is ours, fresh and started by this verifier; otherwise null */
export function readHandoff(token: unknown, verifier: unknown): Omit<Handoff, 'typ' | 'ch'> | null {
  if (typeof token !== 'string' || typeof verifier !== 'string' || verifier.length < 32 || verifier.length > 128) return null;
  const handoff = readSignedPayload<Handoff>(token);
  if (!handoff || handoff.typ !== 'app-handoff' || handoff.exp < Math.floor(Date.now() / 1000)) return null;
  if (challengeOf(verifier) !== handoff.ch) return null;
  return { sub: handoff.sub, ver: handoff.ver, created: handoff.created, next: handoff.next, exp: handoff.exp };
}
