import type { Metadata } from 'next';
import { connection } from 'next/server';
import { PRIVATE_PAGE } from '@/lib/site';
import { getPageMember } from '@/lib/members/session';
import { SEARCH_KINDS, cleanWord, siteSearch, type SearchKind } from '@/lib/search/siteSearch';
import SearchView from './SearchView';

/**
 * All results for a word (BE-441), with a tab per kind like TikTok's: /search?q=คาเฟ่&tab=spots. Enter in any search
 * box comes here. Kept out of search engines: a results page for every word would be thin, endless pages, and the
 * people on it depend on who is signed in (AGENTS.md 4).
 */
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const wordOf = (value: string | string[] | undefined) => cleanWord(typeof value === 'string' ? value : '');

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = wordOf((await searchParams).q);
  return { ...PRIVATE_PAGE, title: q ? `ค้นหา “${q}”` : 'ค้นหา' };
}

export default async function SearchPage({ searchParams }: Props) {
  await connection();
  const params = await searchParams;
  const q = wordOf(params.q);
  const tab: SearchKind | 'all' = typeof params.tab === 'string' && (SEARCH_KINDS as readonly string[]).includes(params.tab) ? (params.tab as SearchKind) : 'all';
  const viewer = await getPageMember();
  // Every kind is read so each tab shows its count; a tab shows up to 30, "ทั้งหมด" six of each
  const result = q.replace(/^#+/, '') ? await siteSearch(viewer, q, { limit: tab === 'all' ? 6 : 30, withMoments: true, province: viewer?.preferences?.province }) : null;
  return <SearchView key={`${q}|${tab}`} q={q} tab={tab} result={result} />;
}
