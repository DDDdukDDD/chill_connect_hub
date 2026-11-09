/**
 * The "สำหรับคุณ" feed (docs/FEED_PLAN.md step 1): scores the newest posts and orders them. Pure, so the same input
 * always gives the same order: page 2 recomputes from the same moment in time and lands where page 1 stopped.
 *
 * Our edge is "ทำให้ทุกการใช้ชีวิตมีความหมาย": a post that can still take the reader somewhere (a ตี้ that still
 * takes people, an open challenge, a place in their province) weighs more. A feed that only keeps people scrolling
 * is not the goal.
 */

/** One recent post, with only what the score needs */
export interface ForYouCandidate {
  id: string;
  /** The author's member id (legacy id), or null for posts without one */
  authorId: string | null;
  createdAt: string;
  likes: number;
  saves: number;
  comments: number;
  isClip: boolean;
  /** The moment's own mood category (heal | move | chill | learn) */
  category?: string;
  /** Category codes of what it is tied to: the ตี้ or อีเวนต์ category, or the place's category and vibe tags */
  targetCategories: string[];
  /** Province of the ตี้, อีเวนต์ or place it is tied to */
  targetProvince?: string;
  /** Tied to a ตี้ that still takes people, or a challenge still open */
  joinable: boolean;
  /** Tied to a place (the reader can go there any day) */
  isPlace: boolean;
  /** The reader had it on screen before (app.moment_seen) */
  seen: boolean;
}

/** What we know about the reader; empty for a signed-out visitor */
export interface ForYouReader {
  id?: string;
  following: Set<string>;
  /** Follow each other */
  mutual: Set<string>;
  /** Authors the reader liked or commented on lately: author id → how often */
  affinity: Map<string, number>;
  /** Category codes picked in onboarding (ตี้ groups, place vibes, อีเวนต์ groups) */
  interests: Set<string>;
  province?: string;
}

export const GUEST_READER: ForYouReader = { following: new Set(), mutual: new Set(), affinity: new Map(), interests: new Set() };

const HOUR = 3_600_000;

/**
 * Every number of the ranking, in one place. The admin page "วิธีคิดของระบบ" (components/admin/SystemLogicView.tsx)
 * shows these same values, so changing one here changes what staff read there too.
 */
export const FOR_YOU_WEIGHTS = {
  /** How many of the newest posts are ranked; after them the feed goes on newest first */
  poolSize: 300,
  /** Newness: this many points for a post just made, halving every `freshHalfLifeH` hours */
  freshMax: 3,
  freshHalfLifeH: 48,
  /** Engagement: saves, comments and likes count this much each, then log(1 + sum) ÷ √(1 + age in days) */
  save: 4,
  comment: 2,
  like: 1,
  /** Closeness to the author */
  following: 2,
  mutual: 1,
  /** Per like or comment the reader gave the author in the last 90 days, counted up to `affinityCap` times */
  affinityEach: 0.3,
  affinityCap: 5,
  /** The post's mood or what it is tied to matches an onboarding interest */
  interest: 1,
  /** Can still take the reader somewhere */
  joinable: 1.5,
  placeInProvince: 1.5,
  placeElsewhere: 0.5,
  /** Already seen (within 30 days) */
  seen: -4,
  /** How far ahead the mixer looks for a different author, or a clip after a photo and back */
  lookAhead: 6,
} as const;

const W = FOR_YOU_WEIGHTS;

/** The score parts, kept apart so a test or an admin check can see why a post ranks where it does */
export function scoreParts(post: ForYouCandidate, reader: ForYouReader, now: number) {
  const ageH = Math.max(0, (now - Date.parse(post.createdAt)) / HOUR);
  // New posts first, halving about every two days
  const fresh = W.freshMax * Math.pow(0.5, ageH / W.freshHalfLifeH);
  // Saves say most, then comments, then likes; the age divides it, so an old hit does not hold the top
  const weighted = post.saves * W.save + post.comments * W.comment + post.likes * W.like;
  const engagement = Math.log1p(weighted) / Math.sqrt(1 + ageH / 24);
  const author = post.authorId ?? '';
  const isMine = Boolean(reader.id && author === reader.id);
  const close = isMine
    ? 0
    : (reader.following.has(author) ? W.following : 0) + (reader.mutual.has(author) ? W.mutual : 0) + Math.min(W.affinityCap, reader.affinity.get(author) ?? 0) * W.affinityEach;
  const interest = (post.category && reader.interests.has(post.category)) || post.targetCategories.some((c) => reader.interests.has(c)) ? W.interest : 0;
  const nearby = reader.province && post.targetProvince === reader.province;
  // Can still take the reader somewhere
  const goable = post.joinable ? W.joinable : post.isPlace ? (nearby ? W.placeInProvince : W.placeElsewhere) : 0;
  const seen = post.seen ? W.seen : 0;
  return { fresh, engagement, close, interest, goable, seen, total: fresh + engagement + close + interest + goable + seen };
}

const LOOK_AHEAD = W.lookAhead;

/**
 * The posts in feed order: by score, then mixed so one author never shows twice in a row and clips and photos take
 * turns, when another post close enough in the list allows it.
 */
export function rankForYou(posts: ForYouCandidate[], reader: ForYouReader, now: number): ForYouCandidate[] {
  const scored = posts
    .map((post) => ({ post, score: scoreParts(post, reader, now).total }))
    .sort((a, b) => b.score - a.score || b.post.createdAt.localeCompare(a.post.createdAt) || b.post.id.localeCompare(a.post.id))
    .map((s) => s.post);
  const out: ForYouCandidate[] = [];
  while (scored.length) {
    const last = out[out.length - 1];
    let pick = 0;
    if (last) {
      const window = scored.slice(0, LOOK_AHEAD);
      const otherAuthor = (p: ForYouCandidate) => !p.authorId || p.authorId !== last.authorId;
      const best = window.findIndex((p) => otherAuthor(p) && p.isClip !== last.isClip);
      pick = best !== -1 ? best : Math.max(0, window.findIndex(otherAuthor));
    }
    out.push(scored.splice(pick, 1)[0]);
  }
  return out;
}
