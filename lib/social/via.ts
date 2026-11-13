/**
 * "Came here from" (docs/TRACEABILITY.md): tapping a link from a post to its ตี้, อีเวนต์, place or challenge leaves a
 * note in the cookie `cw_via` for VIA_DAYS. When the member later joins, saves or goes, the server reads it and credits
 * the post (lib/social/actionLog.ts). Shared by the browser (markVia) and the server (parseVia).
 */

export const VIA_COOKIE = 'cw_via';
export const VIA_DAYS = 7;
const VIA_MAX = 8;

/** ตี้ and อีเวนต์ are both events: a post's target type and the action's target type may name either */
export type ViaFamily = 'spot' | 'event' | 'challenge';
export type ViaSourceType = 'moment' | 'profile';
export interface ViaTouch {
  family: ViaFamily;
  ref: string;
  sourceType: ViaSourceType;
  sourceRef: string;
  /** Seconds since 1970 */
  at: number;
}

export const viaFamily = (type: string): ViaFamily | null =>
  type === 'spot' ? 'spot' : type === 'community' || type === 'fair' || type === 'event' ? 'event' : type === 'challenge' || type === 'quest' ? 'challenge' : null;

const REF = /^[\w.:-]{1,120}$/;
const FAMILIES: ViaFamily[] = ['spot', 'event', 'challenge'];
const SOURCES: ViaSourceType[] = ['moment', 'profile'];

/** Reads the cookie strictly: anything that does not look right is dropped */
export function parseVia(raw: string | undefined): ViaTouch[] {
  if (!raw) return [];
  try {
    const list = JSON.parse(decodeURIComponent(raw));
    if (!Array.isArray(list)) return [];
    return list.slice(0, VIA_MAX).flatMap((item): ViaTouch[] => {
      if (!Array.isArray(item) || item.length !== 5) return [];
      const [family, ref, sourceType, sourceRef, at] = item;
      if (!FAMILIES.includes(family) || !SOURCES.includes(sourceType) || typeof ref !== 'string' || typeof sourceRef !== 'string') return [];
      if (!REF.test(ref) || !REF.test(sourceRef) || typeof at !== 'number' || !Number.isFinite(at)) return [];
      return [{ family, ref, sourceType, sourceRef, at }];
    });
  } catch {
    return [];
  }
}

/** Browser only: remembers that this target was opened from this post or profile (the newest note per target wins) */
export function markVia(targetType: string, targetRef: string | undefined, sourceType: ViaSourceType, sourceRef: string | undefined): void {
  const family = viaFamily(targetType);
  if (typeof document === 'undefined' || !family || !targetRef || !sourceRef || !REF.test(targetRef) || !REF.test(sourceRef)) return;
  try {
    const current = parseVia(document.cookie.split('; ').find((c) => c.startsWith(`${VIA_COOKIE}=`))?.slice(VIA_COOKIE.length + 1));
    const kept = current.filter((t) => !(t.family === family && t.ref === targetRef));
    const next = [{ family, ref: targetRef, sourceType, sourceRef, at: Math.floor(Date.now() / 1000) }, ...kept].slice(0, VIA_MAX);
    const value = encodeURIComponent(JSON.stringify(next.map((t) => [t.family, t.ref, t.sourceType, t.sourceRef, t.at])));
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${VIA_COOKIE}=${value}; Path=/; Max-Age=${VIA_DAYS * 86400}; SameSite=Lax${secure}`;
  } catch {
    // Cookies blocked: nothing is credited, nothing breaks
  }
}
