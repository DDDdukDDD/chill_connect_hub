import type { EventItem, ChallengeQuest } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { formatEventDateRange, isClosedToJoin, isEventEnded, isEventMatchingTimeFilter } from '@/lib/dateUtils';
import { ALL_PROVINCES, eventInProvince, fairSearchText, isQuestOpen, matchesQuery, meetupSearchText, questSearchText, spotInProvince, spotSearchText } from '@/lib/discoverMatch';
import type { Member } from '@/lib/members';
import { searchMembers, suggestedMembers, SEARCH_WORD_MAX } from '@/lib/members/safety';
import { listMoments, searchHashtags, type FeedItem } from '@/lib/moments/service';
import { listPublicFairs, listPublicMeetups, listPublicQuests } from '@/lib/publicContent';
import { browseSpots } from '@/lib/spotBrowse';

/**
 * The site's search (TR-012, BE-440/441): one word, every kind at once, the way IG and TikTok answer from the first
 * letter. Places, ตี้, อีเวนต์ and challenges use the same matching as ค้นพบ (lib/discoverMatch.ts, with its Thai
 * synonyms) and are ordered by how well the title matches, the reader's province breaking ties. People are for
 * signed-in members only (searchMembers); tags and moments are public.
 */

export const SEARCH_KINDS = ['people', 'spots', 'meetups', 'fairs', 'challenges', 'moments', 'tags'] as const;
export type SearchKind = (typeof SEARCH_KINDS)[number];

/** One place, ตี้, อีเวนต์ or challenge as a result row */
export interface SearchHit {
  id: string;
  title: string;
  /** "คาเฟ่ · อารีย์", "ส. 22 พ.ย. · สวนลุมพินี", "1,204 คนกำลังทำ" */
  subtitle: string;
  image?: string;
  href: string;
}

export interface SearchPerson {
  id: string;
  name: string;
  avatar: string;
  isFollowing: boolean;
  followsMe?: boolean;
}

export interface SearchResult {
  q: string;
  /** null for a guest: names are for members */
  people: SearchPerson[] | null;
  spots: SearchHit[];
  meetups: SearchHit[];
  fairs: SearchHit[];
  challenges: SearchHit[];
  tags: { tag: string; posts: number }[];
  /** Only when asked for (the results page): a feed read is heavier than the rest */
  moments?: FeedItem[];
  /** How many each kind found in all (people and tags up to what was read), for the results page's tabs */
  counts: Partial<Record<SearchKind, number>>;
  /** The kinds that found something, best match first: the order to show them in (moments have their own place) */
  order: Exclude<SearchKind, 'moments'>[];
}

/** Before typing (the empty search): something to tap, as TikTok's search opens on trends */
export interface SearchStart {
  people: SearchPerson[];
  challenges: SearchHit[];
  weekend: SearchHit[];
  tags: { tag: string; posts: number }[];
}

export const cleanWord = (q: string) => q.replace(/\s+/g, ' ').trim().slice(0, SEARCH_WORD_MAX);

/** How well a title answers the word: the whole title, its start, inside it, then only the other text or a synonym */
function relevance(title: string, text: string, word: string): number {
  const t = title.toLowerCase();
  const w = word.toLowerCase();
  if (t === w) return 100;
  if (t.startsWith(w)) return 80;
  if (t.includes(w)) return 60;
  if (text.includes(w)) return 30;
  return 10;
}

/**
 * Best match first; the reader's province, then the list's own order (popularity, date) break ties. `best` is the top
 * match, which orders the kinds: "วิ่ง" puts ตี้ named "วิ่ง…" above places that only mention running.
 */
function ranked<T>(items: T[], score: (item: T) => number, local: (item: T) => boolean = () => false): { list: T[]; best: number } {
  const scored = items.map((item, at) => ({ item, at, s: score(item) + (local(item) ? 5 : 0) })).sort((a, b) => b.s - a.s || a.at - b.at);
  return { list: scored.map(({ item }) => item), best: scored[0]?.s ?? 0 };
}

const NO_HITS = { list: [], best: 0 };

const thaiCount = (n: number) => n.toLocaleString('th-TH');

const spotHit = (spot: LifestyleSpotItem): SearchHit => ({
  id: spot.id,
  title: spot.title,
  subtitle: [spot.categoryLabel, spot.district || spot.province].filter(Boolean).join(' · '),
  image: spot.image || undefined,
  href: `/spots/${encodeURIComponent(spot.id)}`,
});

/** "สวนเบญจกิติ (จุดนัดพบ: ทางเข้าสะพานเขียว ประตู 1)" → "สวนเบญจกิติ": a result row has one short line */
const shortPlace = (text?: string) => (text ?? '').split(/\s*[(（]/)[0].trim();

const eventHit = (event: EventItem, base: '/community' | '/events'): SearchHit => ({
  id: event.id,
  title: event.title,
  subtitle: [formatEventDateRange(event), shortPlace(event.location)].filter(Boolean).join(' · '),
  image: event.image || undefined,
  href: `${base}/${encodeURIComponent(event.id)}`,
});

const questHit = (quest: ChallengeQuest): SearchHit => ({
  id: quest.id,
  title: quest.title,
  subtitle: quest.participantsCount ? `${thaiCount(quest.participantsCount)} คนกำลังทำ` : quest.targetGoal || 'ชาเลนจ์',
  image: quest.image || quest.badgeCoverImg || undefined,
  href: `/challenges/${encodeURIComponent(quest.id)}`,
});

export interface SearchOptions {
  /** Rows per kind (3 in the search box's dropdown, up to 30 on the results page) */
  limit: number;
  /** Only these kinds (a tab of the results page); every kind when left out */
  kinds?: SearchKind[];
  /** The reader's province, which goes first among equal matches */
  province?: string;
  /** Also read moments (the results page) */
  withMoments?: boolean;
}

export async function siteSearch(viewer: Member | null, rawWord: string, options: SearchOptions): Promise<SearchResult> {
  const q = cleanWord(rawWord);
  // "#คาเฟ่" looks for tags only
  const tagOnly = q.startsWith('#');
  const word = q.replace(/^#+/, '').trim();
  const limit = Math.min(Math.max(options.limit, 1), 30);
  const wants = (kind: SearchKind) => (!options.kinds || options.kinds.includes(kind)) && (!tagOnly || kind === 'tags');
  const province = options.province && options.province !== ALL_PROVINCES ? options.province : null;
  const lower = word.toLowerCase();

  const [people, tags, spots, meetups, fairs, challenges, moments] = await Promise.all([
    !viewer ? null : wants('people') && word ? searchMembers(viewer, word, 30) : [],
    wants('tags') ? searchHashtags(word, Math.max(limit, 6)) : [],
    // The 200 best by /spots' own order, re-ordered by the match; the count is /spots' full total
    wants('spots') && word
      ? browseSpots({ q: word, limit: 200 }).then(({ spots: found, total }) => ({
          ...ranked(found, (s) => relevance(s.title, spotSearchText(s), lower), (s) => Boolean(province && spotInProvince(s, province))),
          total,
        }))
      : { ...NO_HITS, total: 0 },
    wants('meetups') && word
      ? listPublicMeetups().then((all) => {
          const found = all.filter((e) => !isClosedToJoin(e) && matchesQuery(meetupSearchText(e), word));
          return ranked(found, (e) => relevance(e.title, meetupSearchText(e), lower), (e) => Boolean(province && eventInProvince(e, province)));
        })
      : NO_HITS,
    wants('fairs') && word
      ? listPublicFairs().then((all) => {
          const found = all.filter((e) => !isEventEnded(e) && matchesQuery(fairSearchText(e), word));
          return ranked(found, (e) => relevance(e.title, fairSearchText(e), lower), (e) => Boolean(province && eventInProvince(e, province)));
        })
      : NO_HITS,
    wants('challenges') && word
      ? listPublicQuests().then((all) => {
          const found = all.filter((quest) => isQuestOpen(quest) && matchesQuery(questSearchText(quest), word)).sort((a, b) => (b.participantsCount ?? 0) - (a.participantsCount ?? 0));
          return ranked(found, (quest) => relevance(quest.title, questSearchText(quest), lower));
        })
      : NO_HITS,
    options.withMoments && wants('moments') && word
      ? listMoments(viewer, { tab: 'all', q: word, limit }).then((page) => ({ items: page.moments, total: page.pagination.totalCount ?? page.moments.length }))
      : null,
  ]);

  // People and tags by the same scale: a name or tag starting with the word is a strong match
  const nameScore = (name: string) => (name.toLowerCase() === lower ? 100 : name.toLowerCase().startsWith(lower) ? 80 : 60);
  const best: Record<Exclude<SearchKind, 'moments'>, number> = {
    people: people?.length ? Math.max(...people.map((p) => nameScore(p.name))) : 0,
    spots: spots.best,
    meetups: meetups.best,
    fairs: fairs.best,
    challenges: challenges.best,
    tags: tags.length ? Math.max(...tags.map((t) => nameScore(t.tag))) - 1 : 0,
  };
  const order = (Object.keys(best) as (keyof typeof best)[]).filter((kind) => best[kind] > 0).sort((a, b) => best[b] - best[a]);

  return {
    q,
    people: people === null ? null : people.slice(0, limit),
    tags: tags.slice(0, limit),
    spots: spots.list.slice(0, limit).map(spotHit),
    meetups: meetups.list.slice(0, limit).map((e) => eventHit(e, '/community')),
    fairs: fairs.list.slice(0, limit).map((e) => eventHit(e, '/events')),
    challenges: challenges.list.slice(0, limit).map(questHit),
    ...(moments ? { moments: moments.items } : {}),
    order,
    counts: {
      people: people?.length ?? 0,
      tags: tags.length,
      spots: spots.total,
      meetups: meetups.list.length,
      fairs: fairs.list.length,
      challenges: challenges.list.length,
      ...(moments ? { moments: moments.total } : {}),
    },
  };
}

const START_ROWS = 4;

/** The empty search: people worth following (members), the most-joined open challenges, this weekend near the reader, popular tags */
export async function searchStart(viewer: Member | null, provinceHint?: string): Promise<SearchStart> {
  const province = provinceHint && provinceHint !== ALL_PROVINCES ? provinceHint : viewer?.preferences?.province;
  const [people, quests, meetups, fairs, tags] = await Promise.all([
    viewer ? suggestedMembers(viewer, START_ROWS) : Promise.resolve([]),
    listPublicQuests(),
    listPublicMeetups(),
    listPublicFairs(),
    searchHashtags('', 6),
  ]);
  const weekend = [
    ...meetups.filter((e) => !isClosedToJoin(e)).map((e) => ({ e, base: '/community' as const })),
    ...fairs.filter((e) => !isEventEnded(e)).map((e) => ({ e, base: '/events' as const })),
  ]
    .filter(({ e }) => isEventMatchingTimeFilter(e.date, 'weekend'))
    // The reader's province first, then the busiest
    .sort((a, b) => Number(Boolean(province && eventInProvince(b.e, province))) - Number(Boolean(province && eventInProvince(a.e, province))) || (b.e.participantsCount ?? 0) - (a.e.participantsCount ?? 0))
    .slice(0, START_ROWS)
    .map(({ e, base }) => eventHit(e, base));
  return {
    people: people.map((p) => ({ id: p.id, name: p.displayName, avatar: p.avatarUrl ?? '', isFollowing: false })),
    challenges: quests
      .filter(isQuestOpen)
      .sort((a, b) => (b.participantsCount ?? 0) - (a.participantsCount ?? 0))
      .slice(0, START_ROWS)
      .map(questHit),
    weekend,
    tags,
  };
}
