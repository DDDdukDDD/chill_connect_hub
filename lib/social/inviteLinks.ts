import { createHmac, timingSafeEqual } from 'node:crypto';
import { getSessionSecret } from '../members/session';

/**
 * "ส่งทาง LINE" (owner 2026-11-10): a member sends a post to friends outside Chillwaa as a link that asks "ไปกันไหม".
 * The link carries `<inviterId>.<signature>` for this post, so only a link the member really made can start a plan
 * with them; someone who edits the id gets nothing. Anyone holding the link may answer, each making their own plan.
 */

const sign = (secret: string, momentId: string, inviterId: string) => createHmac('sha256', secret).update(`invite-link:${momentId}:${inviterId}`).digest('base64url').slice(0, 22);

export function inviteToken(momentId: string, inviterId: string): string {
  const secret = getSessionSecret();
  if (!secret) throw new Error('AUTH_SECRET is not set');
  return `${inviterId}.${sign(secret, momentId, inviterId)}`;
}

/** The inviter a link names, when its signature is right for this post; null otherwise */
export function inviterFromToken(momentId: string, token: string): string | null {
  const secret = getSessionSecret();
  const dot = token.lastIndexOf('.');
  if (!secret || dot <= 0) return null;
  const inviterId = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(secret, momentId, inviterId));
  return given.length === expected.length && timingSafeEqual(given, expected) ? inviterId : null;
}

/** A link token (has a signature) rather than a plain member id from an in-app invitation */
export const isInviteToken = (value: string) => value.includes('.');
