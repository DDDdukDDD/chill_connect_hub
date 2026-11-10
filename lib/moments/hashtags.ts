import type { HashtagUse } from './types';

/** Hashtags in a caption. \p{M} keeps Thai vowels and tone marks inside the tag. */
export const HASHTAG = /#[\p{L}\p{M}\p{N}_]+/gu;

/** A tag as it is stored and linked: no #, lower case */
export const normalTag = (tag: string) => tag.trim().replace(/^#/, '').toLowerCase();

/** A caption's tags, each once */
export const hashtagsOf = (caption: string): string[] => [...new Set((caption.match(HASHTAG) ?? []).map(normalTag))];

export const hasHashtag = (caption: string, tag: string): boolean => hashtagsOf(caption).includes(normalTag(tag));

/** One hashtag's own page (FEED_PLAN step 2); /moments?tag= links from before forward there */
export const hashtagHref = (tag: string): string => `/moments/tag/${encodeURIComponent(normalTag(tag))}`;

const DAY_MS = 86_400_000;

/** The no-database mode's version of the hashtag counts the database works out (MomentRepository.hashtagUses) */
export function tallyHashtags(posts: { caption: string; createdAt: string; author: string }[], now = Date.now()): HashtagUse[] {
  const uses = new Map<string, HashtagUse & { people: Set<string>; weekPeople: Set<string> }>();
  for (const post of posts) {
    const age = now - Date.parse(post.createdAt);
    for (const tag of hashtagsOf(post.caption)) {
      const use = uses.get(tag) ?? { tag, week: 0, weekBefore: 0, total: 0, authors: 0, weekAuthors: 0, people: new Set<string>(), weekPeople: new Set<string>() };
      use.total++;
      use.people.add(post.author);
      if (age < 7 * DAY_MS) {
        use.week++;
        use.weekPeople.add(post.author);
      } else if (age < 14 * DAY_MS) use.weekBefore++;
      uses.set(tag, use);
    }
  }
  return [...uses.values()]
    .map(({ people, weekPeople, ...use }) => ({ ...use, authors: people.size, weekAuthors: weekPeople.size }))
    .sort((a, b) => b.total - a.total || a.tag.localeCompare(b.tag))
    .slice(0, 500);
}

/** Tags that share posts with `tag`, the most shared first */
export function relatedOf(captions: string[], tag: string, limit: number): { tag: string; posts: number }[] {
  const own = normalTag(tag);
  const counts = new Map<string, number>();
  for (const caption of captions) {
    const tags = hashtagsOf(caption);
    if (!tags.includes(own)) continue;
    for (const other of tags) if (other !== own) counts.set(other, (counts.get(other) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, posts]) => ({ tag: name, posts }))
    .sort((a, b) => b.posts - a.posts || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}
