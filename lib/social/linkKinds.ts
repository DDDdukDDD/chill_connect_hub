/**
 * Taps that leave the site and sponsored card views (docs/TRACEABILITY.md step 4). Shared by the browser
 * (lib/social/trackClient.ts) and the server (lib/social/linkClicks.ts, POST /api/track).
 */

export const OUTBOUND_KINDS = ['map', 'website', 'ticket', 'line', 'facebook', 'instagram', 'tiktok', 'phone', 'online', 'other'] as const;
export type OutboundKind = (typeof OUTBOUND_KINDS)[number];
export type LinkKind = OutboundKind | 'sponsored_view' | 'sponsored_click';
export const LINK_KINDS: LinkKind[] = [...OUTBOUND_KINDS, 'sponsored_view', 'sponsored_click'];

export const CLICK_TARGET_TYPES = ['spot', 'community', 'fair', 'challenge'] as const;
export type ClickTargetType = (typeof CLICK_TARGET_TYPES)[number];

export const CLICK_REF = /^[\w.:-]{1,120}$/;

export const LINK_KIND_LABELS: Record<LinkKind, string> = {
  map: 'แผนที่',
  website: 'เว็บไซต์',
  ticket: 'ซื้อตั๋ว/จอง',
  line: 'LINE',
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  phone: 'โทร',
  online: 'ลิงก์ออนไลน์',
  other: 'อื่นๆ',
  sponsored_view: 'เห็นการ์ดสนับสนุน',
  sponsored_click: 'กดการ์ดสนับสนุน',
};

const TICKET_HOSTS = /(ticketmelon|thaiticketmajor|allticket|eventpop|zipeventapp|ticketier|megatix|eventbrite|klook|kkday|agoda|booking\.com|traveloka|trip\.com|hungryhub|eatigo|ticket)/i;

/** What kind of outside link this is, from its address; `data-out-kind` on the link overrides it */
export function classifyHref(href: string): OutboundKind | null {
  if (/^tel:/i.test(href)) return 'phone';
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase();
  const googleMaps = /(^|\.)google\.[a-z.]+$/.test(host) && url.pathname.startsWith('/maps');
  if (googleMaps || /^maps\.(google|apple)\./.test(host) || host === 'maps.app.goo.gl' || host === 'goo.gl') return 'map';
  if (/(^|\.)(line\.me|lin\.ee)$/.test(host)) return 'line';
  if (/(^|\.)(facebook\.com|fb\.com|fb\.me)$/.test(host)) return 'facebook';
  if (/(^|\.)instagram\.com$/.test(host)) return 'instagram';
  if (/(^|\.)tiktok\.com$/.test(host)) return 'tiktok';
  if (/(^|\.)(zoom\.us|meet\.google\.com|teams\.microsoft\.com|discord\.gg|discord\.com)$/.test(host)) return 'online';
  if (TICKET_HOSTS.test(host)) return 'ticket';
  return 'website';
}

/** The target a list tile links to: /spots/x → spot, /events/x → fair, /community/x → ตี้, /challenges/x → challenge */
export function targetOfPath(path: string): { type: ClickTargetType; ref: string } | null {
  const match = /^\/(spots|events|community|challenges)\/([^/?#]+)/.exec(path);
  if (!match) return null;
  let ref: string;
  try {
    ref = decodeURIComponent(match[2]);
  } catch {
    return null;
  }
  if (!CLICK_REF.test(ref)) return null;
  const types = { spots: 'spot', events: 'fair', community: 'community', challenges: 'challenge' } as const;
  return { type: types[match[1] as keyof typeof types], ref };
}
