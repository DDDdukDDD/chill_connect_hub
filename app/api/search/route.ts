import { NextResponse } from 'next/server';
import { getSessionMember } from '@/lib/members/session';
import { SEARCH_KINDS, cleanWord, searchStart, siteSearch, type SearchKind } from '@/lib/search/siteSearch';
import { clientIp, isRateLimited } from '@/lib/rateLimit';

/**
 * The site's search (TR-012, BE-440/441), contract in docs/API.md:
 *   ?q=คาเฟ่                 → every kind, 3 each (the search box's dropdown)
 *   ?q=คาเฟ่&type=spots&limit=30 → one kind (a tab of /search)
 *   ?q=คาเฟ่&moments=1       → moments as well (the results page)
 *   ?q=                      → `start`: what the empty search shows
 * People only for a signed-in member, so the member list cannot be read by anyone passing by.
 */
const LIMIT = 60;
const WINDOW_MS = 60 * 1000;

export async function GET(request: Request) {
  if (await isRateLimited(`search:${clientIp(request)}`, LIMIT, WINDOW_MS)) {
    return NextResponse.json({ success: false, message: 'ค้นหาบ่อยเกินไป รอสักครู่แล้วลองใหม่นะ' }, { status: 429 });
  }
  const params = new URL(request.url).searchParams;
  const q = cleanWord(params.get('q') ?? '');
  const province = (params.get('province') ?? '').slice(0, 60) || undefined;
  const viewer = await getSessionMember(request);
  const headers = { 'Cache-Control': 'private, no-store' };

  if (!q.replace(/^#+/, '')) {
    // "#" alone still lists tags; nothing typed gives the start
    if (q.startsWith('#')) return NextResponse.json({ success: true, ...(await siteSearch(viewer, q, { limit: 6 })) }, { headers });
    return NextResponse.json({ success: true, q: '', start: await searchStart(viewer, province) }, { headers });
  }

  const type = params.get('type');
  const kinds = type && (SEARCH_KINDS as readonly string[]).includes(type) ? [type as SearchKind] : undefined;
  const limit = Number(params.get('limit')) || (kinds ? 30 : 3);
  const result = await siteSearch(viewer, q, { limit, kinds, province: province ?? viewer?.preferences?.province, withMoments: params.get('moments') === '1' || type === 'moments' });
  return NextResponse.json({ success: true, ...result }, { headers });
}
