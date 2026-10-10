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
}

export interface MomentReport {
  memberId: string;
  reason: string;
  createdAt: string;
}

export interface Moment {
  id: string;
  authorId: string | null;
  authorName: string;
  authorAvatar?: string;
  authorBadge?: string;
  caption: string;
  images: string[];
  location: string;
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
  /** Seeded from MOCK_POSTS, not written by a member */
  isSample: boolean;
  createdAt: string;
  updatedAt?: string;
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

export interface MomentRepository {
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
