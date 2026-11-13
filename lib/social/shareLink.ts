/**
 * Shared post links that carry who shared them (docs/TRACEABILITY.md step 5): /moments/<id>?s=<member id>. Opening one
 * sets the cookie `cw_share` for SHARE_DAYS (POST /api/moments/[id]/opened); what the opener does next is credited to the
 * sharer and to the post's author, each in its own row (lib/social/actionLog.ts). Client-safe.
 */

export const SHARE_PARAM = 's';
export const SHARE_COOKIE = 'cw_share';
export const SHARE_DAYS = 30;
export const SHARE_REF = /^[\w.:-]{1,120}$/;

/** The link to send: with the sharer when they are signed in */
export function shareUrl(origin: string, momentId: string, sharerId?: string | null): string {
  const base = `${origin}/moments/${encodeURIComponent(momentId)}`;
  return sharerId && SHARE_REF.test(sharerId) ? `${base}?${SHARE_PARAM}=${encodeURIComponent(sharerId)}` : base;
}

export interface ShareNote {
  sharer: string;
  moment: string;
  /** Seconds since 1970 */
  at: number;
}

/** Reads the cookie strictly: anything that does not look right is dropped */
export function parseShare(raw: string | undefined): ShareNote | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(decodeURIComponent(raw));
    if (!Array.isArray(value) || value.length !== 3) return null;
    const [sharer, moment, at] = value;
    if (typeof sharer !== 'string' || typeof moment !== 'string' || !SHARE_REF.test(sharer) || !SHARE_REF.test(moment)) return null;
    if (typeof at !== 'number' || !Number.isFinite(at) || at < Date.now() / 1000 - SHARE_DAYS * 86400) return null;
    return { sharer, moment, at };
  } catch {
    return null;
  }
}

export const encodeShare = (note: ShareNote) => encodeURIComponent(JSON.stringify([note.sharer, note.moment, note.at]));
