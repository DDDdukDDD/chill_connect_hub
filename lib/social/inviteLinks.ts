import { createHmac, timingSafeEqual } from 'node:crypto';
import { getSessionSecret } from '../members/session';

/**
 * The signed part of every "ชวนไป" link (owner 2026-11-10, groups 2026-11-11), from the bell and from LINE alike:
 * - `p.<planId>.<sig>`: an invitation into a group plan (a place, an อีเวนต์, a challenge, a post);
 * - `t.<eventId>~<inviterId>.<sig>`: a ตี้ invitation, which only says who asked (the friend signs up as usual).
 * Only a link the server made carries a right signature; someone who edits an id gets nothing.
 */

export type InviteToken = { kind: 'plan'; planId: string } | { kind: 'tee'; eventId: string; inviterId: string };

const sign = (secret: string, body: string) => createHmac('sha256', secret).update(`invite:${body}`).digest('base64url').slice(0, 22);

function seal(body: string): string {
  const secret = getSessionSecret();
  if (!secret) throw new Error('AUTH_SECRET is not set');
  return `${body}.${sign(secret, body)}`;
}

export const planToken = (planId: string) => seal(`p.${planId}`);
export const teeToken = (eventId: string, inviterId: string) => seal(`t.${eventId}~${inviterId}`);

/** What a link names, when its signature is right; null otherwise */
export function readInviteToken(token: unknown): InviteToken | null {
  const secret = getSessionSecret();
  if (!secret || typeof token !== 'string' || token.length > 300) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 2) return null;
  const body = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(secret, body));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  if (body.startsWith('p.')) return { kind: 'plan', planId: body.slice(2) };
  if (body.startsWith('t.')) {
    const [eventId, inviterId] = body.slice(2).split('~');
    return eventId && inviterId ? { kind: 'tee', eventId, inviterId } : null;
  }
  return null;
}
