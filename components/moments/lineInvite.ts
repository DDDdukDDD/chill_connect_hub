'use client';

/**
 * "ส่งทาง LINE" (owner 2026-11-10): Thai friends talk in LINE, so a post goes there as "ไปกันไหม" with a signed link
 * (lib/social/inviteLinks.ts). Whoever opens it, member or not yet, lands on the post asked "ไปกันไหม", and "ไปกัน"
 * makes a plan with the sender. Also used for a plan's "คุยต่อใน LINE".
 */

/** Opens LINE's share screen with this text; a new tab on a computer, the LINE app on a phone */
export function openLineShare(text: string): void {
  const url = `https://line.me/R/share?text=${encodeURIComponent(text)}`;
  const opened = window.open(url, '_blank', 'noopener');
  if (!opened) window.location.href = url;
}

/** Asks the server for this member's invite link to the post, then opens LINE with it. False when it could not. */
export async function inviteViaLine(momentId: string, place: string): Promise<boolean> {
  const json = await fetch(`/api/moments/${encodeURIComponent(momentId)}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'invite_link' }),
  })
    .then((r) => r.json())
    .catch(() => null);
  if (!json?.inviteLink) return false;
  openLineShare(`${place ? `ไป${place}กันไหม?` : 'ไปที่นี่กันไหม?'} ${window.location.origin}${json.inviteLink}`);
  return true;
}
