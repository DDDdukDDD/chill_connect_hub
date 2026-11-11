'use client';

import { inviteLineText, sendInvites, type InviteTarget } from '@/components/invites/InviteSheet';

/**
 * "ส่งทาง LINE" (owner 2026-11-10): Thai friends talk in LINE, so an invitation goes there as "ไปกันไหม" with a signed
 * link (lib/social/inviteLinks.ts). Whoever opens it, member or not yet, lands on the page asked "ไปกันไหม", and
 * "ไปกัน" joins the sender's group plan. Also used for a plan's "คุยต่อใน LINE".
 */

/** Opens LINE's share screen with this text; a new tab on a computer, the LINE app on a phone */
export function openLineShare(text: string): void {
  const url = `https://line.me/R/share?text=${encodeURIComponent(text)}`;
  const opened = window.open(url, '_blank', 'noopener');
  if (!opened) window.location.href = url;
}

/** Asks the server for this member's invitation link, then opens LINE with it. False when it could not. */
export async function inviteViaLine(target: InviteTarget, place: string): Promise<boolean> {
  const result = await sendInvites(target);
  if (!result.ok || !result.link) return false;
  openLineShare(inviteLineText(place, result.link, target.type === 'community'));
  return true;
}
