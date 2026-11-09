/**
 * Moments: member photo posts (the /moments feed). Stored through MomentRepository so the JSON prototype
 * store can later be replaced by a database without changing the API.
 */
export type MomentTargetType = 'spot' | 'community' | 'fair' | 'challenge' | 'general';
export type MomentStatus = 'published' | 'hidden' | 'removed';
export type MomentCategory = 'heal' | 'move' | 'chill' | 'learn';

export const MAX_MOMENT_IMAGES = 10;
export const MAX_CAPTION_LENGTH = 500;
export const MAX_COMMENT_LENGTH = 300;
/**
 * Clip limits. The composer reads the length; the small grace is for how phones round it. 15 s from 2026-11-02, 30 s from
 * 2026-11-09 (owner: long enough to tell a moment while people stay focused; short clips of 15–30 s are watched to the
 * end most). A longer file starts with DEFAULT_CLIP_SECONDS chosen, and both ends can be moved.
 */
export const MAX_VIDEO_SECONDS = 30;
export const DEFAULT_CLIP_SECONDS = 15;
export const MIN_CLIP_SECONDS = 1;
export const VIDEO_SECONDS_GRACE = 0.5;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const;
/** Distinct member reports that hide a moment until a moderator reviews it */
export const AUTO_HIDE_REPORTS = 3;

export interface MomentComment {
  id: string;
  /** null for the bundled sample comments */
  authorId: string | null;
  /** Snapshot at posting time; live profiles are used for members who still exist */
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
  hidden?: boolean;
  /** The comment this replies to; replies go one level deep */
  parentId?: string;
  /** Members who liked this comment */
  likedBy?: string[];
  /** People named with "@" in the text (lib/moments/mentions.ts), as their names were when posted */
  mentions?: { id: string; name: string }[];
}

export interface MomentReport {
  memberId: string;
  reason: string;
  createdAt: string;
}

/** What a feed needs to know about the lists it does not read: only the viewer's own part of each */
export interface MomentFeedFacts {
  likes: number;
  /** Comments this viewer may see */
  comments: number;
  liked: boolean;
  saved: boolean;
  reported: boolean;
}

export interface Moment {
  /** Set on a moment read for a feed, whose likedBy, savedBy and reports are empty and comments hold only the newest */
  feedFacts?: MomentFeedFacts;
  id: string;
  authorId: string | null;
  authorName: string;
  authorAvatar?: string;
  authorBadge?: string;
  caption: string;
  images: string[];
  /** Width / height of the first photo, so the feed can reserve the right frame before the photo loads */
  imageRatio?: number;
  /** One short clip; `images` then holds only its first frame, which every grid and card shows as the cover */
  video?: MomentVideo;
  /** The author closed comments, likes or sharing on this post */
  commentsOff?: boolean;
  likesOff?: boolean;
  sharesOff?: boolean;
  location: string;
  /** Friends who were there too; each can take themselves off */
  taggedIds?: string[];
  category?: MomentCategory;
  targetType: MomentTargetType;
  targetId?: string;
  targetTitle?: string;
  likedBy: string[];
  savedBy: string[];
  /** Like count carried over from the bundled samples (illustrative); 0 for real posts */
  sampleLikes: number;
  comments: MomentComment[];
  reports: MomentReport[];
  status: MomentStatus;
  /** Why it is hidden: member reports or a moderator */
  hiddenBy?: 'reports' | 'admin';
  moderationNote?: string;
  /** A moderator decided the photo does not show the place or event it is tied to: the post stays, but it is not a visit and counts toward no challenge */
  evidenceRejected?: { at: string; note: string };
  /**
   * Proof of going for challenges (lib/moments/evidence.ts): 'auto' = the phone was at the place when posting,
   * 'pending' = waiting for staff, 'approved' = staff passed it. Missing on older posts (they count as before).
   */
  evidence?: MomentEvidence;
  /** Seeded from MOCK_POSTS, not written by a member */
  isSample: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface MomentVideo {
  url: string;
  /** How long it plays, at most MAX_VIDEO_SECONDS, even when the file is longer */
  durationS: number;
  /** Where in the file it starts; the member picks this part of a longer clip */
  startS?: number;
  /**
   * A 3-second, 360 px silent loop made on the phone with the clip (2026-11-07). Feeds and grids autoplay this one and
   * load `url` only when someone opens the clip or turns the sound on; older clips have none and wait for a tap.
   */
  previewUrl?: string;
}

export interface MomentEvidence {
  status: 'auto' | 'pending' | 'approved';
  at: string;
  /** Distance from the place when posting, in metres (when the member shared a location) */
  distanceM?: number;
  /** Why it waits: no_location, no_place_coordinates, stale_location, imprecise_location, too_far */
  reason?: string;
}

export interface MomentQuery {
  statuses: MomentStatus[];
  authorId?: string;
  savedBy?: string;
  targetType?: MomentTargetType;
  targetId?: string;
  location?: string;
  q?: string;
  reportedOnly?: boolean;
  sort: 'newest' | 'popular';
  page: number;
  limit: number;
}

/** One page of the public feed: every rule about who may see what is applied by the store, before the page is cut */
export interface MomentFeedQuery {
  viewerId?: string;
  blockedIds?: string[];
  /** Only these authors (the "following" tab) */
  authorIds?: string[];
  authorId?: string;
  savedBy?: string;
  targetType?: MomentTargetType;
  targetId?: string;
  location?: string;
  q?: string;
  tag?: string;
  category?: MomentCategory;
  placesOnly?: boolean;
  sort: 'newest' | 'popular';
  page: number;
  limit: number;
  /** Where the last page ended (newest only): a new or deleted post between pages then neither repeats nor skips one */
  cursor?: string;
}

export interface MomentFeedPage {
  items: Moment[];
  /** How many match in all; left out when continuing from a cursor */
  totalCount?: number;
  hasNext: boolean;
  nextCursor?: string;
}

export type MomentTypeCounts = { all: number; spot: number; community: number; fair: number; challenge: number };

export interface MomentRepository {
  feed(query: MomentFeedQuery): Promise<MomentFeedPage>;
  typeCounts(): Promise<MomentTypeCounts>;
  findById(id: string): Promise<Moment | null>;
  create(moment: Moment): Promise<Moment>;
  /** Applies `change` to the stored moment atomically and returns the result */
  mutate(id: string, change: (moment: Moment) => Moment): Promise<Moment>;
  remove(id: string): Promise<boolean>;
  removeByAuthor(authorId: string): Promise<number>;
  /** Removes an author's comments from every moment (account deletion) */
  removeCommentsByAuthor(authorId: string): Promise<number>;
  query(query: MomentQuery): Promise<{ items: Moment[]; totalCount: number }>;
  counts(): Promise<Record<MomentStatus | 'reported' | 'samples', number>>;
}
