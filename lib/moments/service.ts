import { randomUUID } from 'node:crypto';
import { tidyDisplayName, withoutSampleHandle } from '../displayName';
import { ownUploadFolder } from '../media/ownMedia';
import { memberRepository } from '../members';
import type { Member } from '../members/types';
import { evidenceForNewMoment } from './evidence';
import { realPlace } from './feedRules';
import {
  AUTO_HIDE_REPORTS, MAX_CAPTION_LENGTH, MAX_COMMENT_LENGTH, MAX_MOMENT_IMAGES, MAX_VIDEO_SECONDS, VIDEO_SECONDS_GRACE, Moment, MomentCategory, MomentComment,
  momentRepository, MomentTargetType,
} from './index';

export class MomentError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

const TARGET_TYPES = new Set<MomentTargetType>(['spot', 'community', 'fair', 'challenge', 'general']);
const CATEGORIES = new Set<MomentCategory>(['heal', 'move', 'chill', 'learn']);
const text =(value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/** Only images uploaded through /api/upload (local disk, Cloudflare R2 or Vercel Blob) may be attached */
export function isAllowedMomentImage(url: string): boolean {
  return ownUploadFolder(url) !== null;
}

/** A clip comes from the video upload route, into the moments folder */
export function isAllowedMomentVideo(url: string): boolean {
  return ownUploadFolder(url) === 'moments';
}

/** Every stored file a moment shows, for deleting them with it */
export const momentFiles = (moment: Moment): string[] => [...moment.images, ...(moment.video ? [moment.video.url, ...(moment.video.previewUrl ? [moment.video.previewUrl] : [])] : [])];

export function thaiTimeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'เมื่อสักครู่นี้';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} วันที่แล้ว`;
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Members referenced by these moments (authors and commenters), loaded once */
export async function loadPeople(moments: Moment[]): Promise<Map<string, Member>> {
  const ids = new Set<string>();
  for (const moment of moments) {
    if (moment.authorId) ids.add(moment.authorId);
    for (const comment of moment.comments) if (comment.authorId) ids.add(comment.authorId);
    for (const id of moment.taggedIds ?? []) ids.add(id);
  }
  return memberRepository.findByIds([...ids]);
}

/** Hidden from the public: moderated content, banned authors */
export function isPubliclyVisible(moment: Moment, people: Map<string, Member>): boolean {
  if (moment.status !== 'published') return false;
  if (!moment.authorId) return true;
  const author = people.get(moment.authorId);
  return Boolean(author && author.status !== 'banned');
}

/**
 * Feed item in the shape of CommunityPost (data/mockData.ts) plus viewer flags,
 * so the existing /moments UI can switch from MOCK_POSTS with few changes.
 */
/** Sample posts were written with decorative emoji; the feed shows them without */
const plain = (value: string, isSample: boolean) => (isSample ? value.replace(/\s*[\p{Extended_Pictographic}\uFE0F\u200D]+/gu, '').trim() : value);

export function toFeedItem(moment: Moment, viewer: Member | null, people: Map<string, Member>) {
  const author = moment.authorId ? people.get(moment.authorId) : undefined;
  // The viewer does not see comments from people they blocked
  const blocked = new Set(viewer?.blockedIds ?? []);
  const mayRead = (comment: Moment['comments'][number]) => !comment.hidden && (!comment.authorId || (people.get(comment.authorId)?.status !== 'banned' && !blocked.has(comment.authorId)));
  const allComments = moment.commentsOff ? [] : moment.comments;
  const readable = new Set(allComments.filter(mayRead).map((comment) => comment.id));
  // A reply goes with its comment
  const comments = allComments
    .filter((comment) => readable.has(comment.id) && (!comment.parentId || readable.has(comment.parentId)))
    .map((comment) => {
      const commenter = comment.authorId ? people.get(comment.authorId) : undefined;
      return {
        id: comment.id,
        userName: moment.isSample ? withoutSampleHandle(commenter?.displayName ?? comment.authorName) : commenter?.displayName ?? comment.authorName,
        userAvatar: commenter?.avatarUrl ?? comment.authorAvatar ?? '',
        text: plain(comment.text, moment.isSample),
        timeAgo: thaiTimeAgo(comment.createdAt),
        createdAt: comment.createdAt,
        isMine: Boolean(viewer && comment.authorId === viewer.id),
        parentId: comment.parentId,
        likesCount: comment.likedBy?.length ?? 0,
        isLiked: Boolean(viewer && comment.likedBy?.includes(viewer.id)),
        // The commenter and the author of the post may remove it
        canDelete: Boolean(viewer && (comment.authorId === viewer.id || moment.authorId === viewer.id)),
      };
    });
  return {
    id: moment.id,
    authorId: moment.authorId,
    userName: moment.isSample ? withoutSampleHandle(author?.displayName ?? moment.authorName) : author?.displayName ?? moment.authorName,
    userAvatar: author?.avatarUrl ?? moment.authorAvatar ?? '',
    userBadge: moment.authorBadge ?? '',
    images: moment.images,
    imageRatio: moment.imageRatio,
    video: moment.video,
    caption: plain(moment.caption, moment.isSample),
    location: realPlace(moment.location),
    // Someone blocked by the viewer, or gone, is left out; nothing is shown about who took a tag off
    tagged: (moment.taggedIds ?? []).flatMap((id) => {
      const person = people.get(id);
      if (person?.status !== 'active' || viewer?.blockedIds?.includes(id) || person.blockedIds?.includes(viewer?.id ?? '')) return [];
      return [{ id, name: tidyDisplayName(person.displayName).trim() || person.displayName }];
    }),
    isTaggedMe: Boolean(viewer && moment.taggedIds?.includes(viewer.id)),
    category: moment.category,
    likesCount: moment.likesOff ? 0 : (moment.feedFacts?.likes ?? moment.likedBy.length) + moment.sampleLikes,
    commentsCount: moment.commentsOff ? 0 : (moment.feedFacts?.comments ?? comments.length),
    commentsOff: Boolean(moment.commentsOff),
    likesOff: Boolean(moment.likesOff),
    sharesOff: Boolean(moment.sharesOff),
    timeAgo: thaiTimeAgo(moment.createdAt),
    createdAt: moment.createdAt,
    isLiked: moment.feedFacts?.liked ?? Boolean(viewer && moment.likedBy.includes(viewer.id)),
    isSaved: moment.feedFacts?.saved ?? Boolean(viewer && moment.savedBy.includes(viewer.id)),
    isMine: Boolean(viewer && moment.authorId === viewer.id),
    isFollowingAuthor: Boolean(viewer && moment.authorId && viewer.followingIds?.includes(moment.authorId)),
    hasReported: moment.feedFacts?.reported ?? Boolean(viewer && moment.reports.some((r) => r.memberId === viewer.id)),
    comments,
    targetType: moment.targetType,
    targetId: moment.targetId,
    targetTitle: realPlace(moment.targetTitle) || undefined,
    isSample: moment.isSample,
    // Only the author learns that staff did not count the photo as a visit
    evidenceRejected: viewer && moment.authorId === viewer.id && moment.evidenceRejected ? { note: moment.evidenceRejected.note } : undefined,
  };
}

export type FeedItem = ReturnType<typeof toFeedItem>;

export interface MomentListOptions {
  /** all | popular | following | saved | mine */
  tab?: string;
  author?: string;
  category?: string;
  targetType?: string;
  targetId?: string;
  location?: string;
  q?: string;
  /** One hashtag, with or without the # */
  tag?: string;
  page?: number;
  limit?: number;
  /** `pagination.nextCursor` of the page before; the next page then starts right after it */
  cursor?: string;
}

const pagination = (page: number, limit: number, found: { totalCount?: number; hasNext: boolean; nextCursor?: string }) => ({
  // Left out when continuing from a cursor: only the first page counts them all
  ...(found.totalCount === undefined ? {} : { totalCount: found.totalCount, totalPages: Math.max(1, Math.ceil(found.totalCount / limit)) }),
  page,
  limit,
  hasNextPage: found.hasNext,
  hasPrevPage: page > 1,
  ...(found.nextCursor ? { nextCursor: found.nextCursor } : {}),
});

/**
 * One page of published moments the viewer may see (GET /api/moments and the server-rendered /moments). The database
 * picks the page, so a feed reads only the posts it shows, however many there are. A post it shows carries the newest
 * comment and the counts; the moment's own page and GET /api/moments/[id] have the rest.
 * Posts by members the viewer has blocked are left out; "saved", "mine" and "following" need a viewer.
 */
export async function listMoments(viewer: Member | null, options: MomentListOptions) {
  const tab = options.tab ?? 'all';
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(30, Math.max(1, options.limit ?? 12));
  if ((tab === 'saved' || tab === 'mine' || tab === 'following') && !viewer) {
    return { moments: [] as FeedItem[], requiresLogin: true, pagination: pagination(1, limit, { totalCount: 0, hasNext: false }) };
  }
  const followed = viewer?.followingIds ?? [];
  if (tab === 'following' && followed.length === 0) return { moments: [] as FeedItem[], requiresLogin: false, pagination: pagination(1, limit, { totalCount: 0, hasNext: false }) };
  const asked = options.targetType && TARGET_TYPES.has(options.targetType as MomentTargetType) ? (options.targetType as MomentTargetType) : undefined;
  // The "สถานที่" tab, not one place's own page: that one asks by targetId
  const placeTab = asked === 'spot' && !options.targetId;
  const targetType = placeTab ? undefined : asked;
  const category = options.category && CATEGORIES.has(options.category as MomentCategory) ? (options.category as MomentCategory) : undefined;
  const found = await momentRepository.feed({
    viewerId: viewer?.id,
    blockedIds: viewer?.blockedIds,
    authorIds: tab === 'following' ? followed : undefined,
    authorId: tab === 'mine' ? viewer!.id : options.author || undefined,
    savedBy: tab === 'saved' ? viewer!.id : undefined,
    targetType,
    targetId: options.targetId || undefined,
    location: options.location || undefined,
    q: options.q || undefined,
    tag: options.tag || undefined,
    category,
    placesOnly: placeTab,
    sort: tab === 'popular' ? 'popular' : 'newest',
    page,
    limit,
    cursor: options.cursor || undefined,
  });
  const people = await loadPeople(found.items);
  return {
    moments: found.items.map((moment) => toFeedItem(moment, viewer, people)),
    requiresLogin: false,
    pagination: pagination(page, limit, found),
  };
}

/** How many public moments each /moments tab holds, counted by the database */
export const countMomentsByType = () => momentRepository.typeCounts();

/** A published moment for its public page, or null (hidden, removed, banned author, unknown id) */
export async function findPublicMoment(id: string): Promise<FeedItem | null> {
  const moment = await momentRepository.findById(id);
  if (!moment) return null;
  const people = await loadPeople([moment]);
  return isPubliclyVisible(moment, people) ? toFeedItem(moment, null, people) : null;
}

function cleanVideo(input: unknown, imageCount: number): Moment['video'] {
  if (input === undefined || input === null) return undefined;
  const { url, durationS, startS, previewUrl } = input as { url?: unknown; durationS?: unknown; startS?: unknown; previewUrl?: unknown };
  if (typeof url !== 'string' || !isAllowedMomentVideo(url)) throw new MomentError('คลิปต้องอัปโหลดผ่านระบบก่อน');
  if (typeof durationS !== 'number' || !Number.isFinite(durationS) || durationS <= 0 || durationS > MAX_VIDEO_SECONDS + VIDEO_SECONDS_GRACE) throw new MomentError(`คลิปยาวได้ไม่เกิน ${MAX_VIDEO_SECONDS} วินาที`);
  if (imageCount !== 1) throw new MomentError('โมเมนต์ที่มีคลิปใช้รูปปกได้รูปเดียว');
  const start = typeof startS === 'number' && Number.isFinite(startS) && startS > 0 ? Math.round(startS * 10) / 10 : 0;
  if (previewUrl !== undefined && (typeof previewUrl !== 'string' || !isAllowedMomentVideo(previewUrl))) throw new MomentError('คลิปต้องอัปโหลดผ่านระบบก่อน');
  return { url, durationS: Math.round(durationS * 10) / 10, ...(start > 0 ? { startS: start } : {}), ...(previewUrl ? { previewUrl } : {}) };
}

/** People the member follows who follow back, neither blocking the other: the only ones they can tag */
export async function taggableFriends(member: Member): Promise<Member[]> {
  const followed = await memberRepository.findByIds(member.followingIds ?? []);
  return [...followed.values()].filter((other) => other.status === 'active' && other.followingIds?.includes(member.id) && !other.blockedIds?.includes(member.id) && !member.blockedIds?.includes(other.id));
}

const MAX_MOMENT_TAGS = 10;

/** The request's list cut down to real friends; anyone else is dropped, so a tag cannot reach a stranger */
async function cleanTags(member: Member, input: unknown): Promise<string[]> {
  if (!Array.isArray(input) || input.length === 0) return [];
  const friends = new Set((await taggableFriends(member)).map((friend) => friend.id));
  return [...new Set(input)].filter((id): id is string => typeof id === 'string' && friends.has(id)).slice(0, MAX_MOMENT_TAGS);
}

/** A tagged person takes themselves off a post */
export async function removeMyTag(member: Member, id: string): Promise<Moment> {
  await requireVisible(id);
  return momentRepository.mutate(id, (m) => ({ ...m, taggedIds: m.taggedIds?.filter((tagged) => tagged !== member.id) }));
}

export async function createMoment(member: Member, input: Record<string, unknown>): Promise<Moment> {
  const caption = text(input.caption, MAX_CAPTION_LENGTH + 1);
  if (caption.length > MAX_CAPTION_LENGTH) throw new MomentError(`คำบรรยายยาวได้ไม่เกิน ${MAX_CAPTION_LENGTH} ตัวอักษร`);
  const images = Array.isArray(input.images) ? input.images.filter((url): url is string => typeof url === 'string') : [];
  if (images.length === 0) throw new MomentError('กรุณาแนบรูปอย่างน้อย 1 รูป');
  if (images.length > MAX_MOMENT_IMAGES) throw new MomentError(`แนบรูปได้ไม่เกิน ${MAX_MOMENT_IMAGES} รูป`);
  if (!images.every(isAllowedMomentImage)) throw new MomentError('รูปต้องอัปโหลดผ่านระบบ (/api/upload) ก่อน');
  const video = cleanVideo(input.video, images.length);
  const targetType = (TARGET_TYPES.has(input.targetType as MomentTargetType) ? input.targetType : 'general') as MomentTargetType;
  const category = CATEGORIES.has(input.category as MomentCategory) ? (input.category as MomentCategory) : undefined;
  const location = text(input.location, 120) || text(input.targetTitle, 120);
  const targetId = text(input.targetId, 120) || undefined;
  const taggedIds = await cleanTags(member, input.taggedIds);
  // A photo at a place or fair is proof for challenges when the phone was there; otherwise staff check it
  const evidence = await evidenceForNewMoment(targetType, targetId, input.capture);

  return momentRepository.create({
    id: `mom_${randomUUID()}`,
    authorId: member.id,
    authorName: member.displayName,
    authorAvatar: member.avatarUrl,
    caption,
    images,
    video,
    commentsOff: input.commentsOff === true || undefined,
    likesOff: input.likesOff === true || undefined,
    sharesOff: input.sharesOff === true || undefined,
    imageRatio: typeof input.imageRatio === 'number' && Number.isFinite(input.imageRatio) ? Math.min(3, Math.max(0.3, Math.round(input.imageRatio * 1000) / 1000)) : undefined,
    location,
    taggedIds: taggedIds.length ? taggedIds : undefined,
    category,
    targetType,
    targetId,
    targetTitle: text(input.targetTitle, 200) || undefined,
    evidence,
    likedBy: [],
    savedBy: [],
    sampleLikes: 0,
    comments: [],
    reports: [],
    status: 'published',
    isSample: false,
    createdAt: new Date().toISOString(),
  });
}

async function requireVisible(id: string): Promise<Moment> {
  const moment = await momentRepository.findById(id);
  if (!moment) throw new MomentError('ไม่พบโมเมนต์', 404);
  const people = await loadPeople([moment]);
  if (!isPubliclyVisible(moment, people)) throw new MomentError('ไม่พบโมเมนต์', 404);
  return moment;
}

export async function editMoment(member: Member, id: string, input: Record<string, unknown>): Promise<Moment> {
  const moment = await requireVisible(id);
  if (moment.authorId !== member.id) throw new MomentError('แก้ไขได้เฉพาะโมเมนต์ของตัวเอง', 403);
  const caption = input.caption !== undefined ? text(input.caption, MAX_CAPTION_LENGTH + 1) : moment.caption;
  if (caption.length > MAX_CAPTION_LENGTH) throw new MomentError(`คำบรรยายยาวได้ไม่เกิน ${MAX_CAPTION_LENGTH} ตัวอักษร`);
  const location = input.location !== undefined ? text(input.location, 120) || moment.location : moment.location;
  // Only what the request names changes; the author can open or close these after posting
  const options = (['commentsOff', 'likesOff', 'sharesOff'] as const).reduce<Partial<Moment>>((set, key) => (typeof input[key] === 'boolean' ? { ...set, [key]: input[key] } : set), {});
  return momentRepository.mutate(id, (m) => ({ ...m, caption, location, ...options, updatedAt: new Date().toISOString() }));
}

/** Removes the member's own moment and answers its photo links, so the caller can delete the files too */
export async function deleteOwnMoment(member: Member, id: string): Promise<string[]> {
  const moment = await momentRepository.findById(id);
  if (!moment || moment.status === 'removed') throw new MomentError('ไม่พบโมเมนต์', 404);
  if (moment.authorId !== member.id) throw new MomentError('ลบได้เฉพาะโมเมนต์ของตัวเอง', 403);
  await momentRepository.remove(id);
  return momentFiles(moment);
}

const toggle = (list: string[], id: string, on: boolean) => (on ? [...new Set([...list, id])] : list.filter((x) => x !== id));

export async function setLike(member: Member, id: string, liked: boolean): Promise<Moment> {
  const moment = await requireVisible(id);
  if (liked && moment.likesOff) throw new MomentError('เจ้าของโพสต์ปิดการกดถูกใจไว้');
  return momentRepository.mutate(id, (m) => ({ ...m, likedBy: toggle(m.likedBy, member.id, liked) }));
}

export async function setSaved(member: Member, id: string, saved: boolean): Promise<Moment> {
  await requireVisible(id);
  return momentRepository.mutate(id, (m) => ({ ...m, savedBy: toggle(m.savedBy, member.id, saved) }));
}

export async function addComment(member: Member, id: string, input: unknown, replyTo?: unknown): Promise<Moment> {
  const moment = await requireVisible(id);
  const answered = typeof replyTo === 'string' && replyTo ? moment.comments.find((c) => c.id === replyTo && !c.hidden) : undefined;
  if (replyTo && !answered) throw new MomentError('ไม่พบความคิดเห็นนี้ อาจถูกลบไปแล้ว', 404);
  if (moment.commentsOff) throw new MomentError('เจ้าของโพสต์ปิดความคิดเห็นไว้');
  const body = text(input, MAX_COMMENT_LENGTH + 1);
  if (!body) throw new MomentError('กรุณาพิมพ์ความคิดเห็น');
  if (body.length > MAX_COMMENT_LENGTH) throw new MomentError(`ความคิดเห็นยาวได้ไม่เกิน ${MAX_COMMENT_LENGTH} ตัวอักษร`);
  const comment: MomentComment = {
    id: `cmt_${randomUUID()}`,
    authorId: member.id,
    authorName: member.displayName,
    authorAvatar: member.avatarUrl,
    text: body,
    createdAt: new Date().toISOString(),
    // One level: a reply to a reply sits under the same comment
    ...(answered ? { parentId: answered.parentId ?? answered.id } : {}),
  };
  return momentRepository.mutate(id, (m) => ({ ...m, comments: [...m.comments, comment] }));
}

export async function setCommentLike(member: Member, id: string, commentId: string, liked: boolean): Promise<Moment> {
  const moment = await requireVisible(id);
  if (!moment.comments.some((c) => c.id === commentId && !c.hidden)) throw new MomentError('ไม่พบความคิดเห็น', 404);
  return momentRepository.mutate(id, (m) => ({
    ...m,
    comments: m.comments.map((c) => {
      if (c.id !== commentId) return c;
      const others = (c.likedBy ?? []).filter((who) => who !== member.id);
      return { ...c, likedBy: liked ? [...others, member.id] : others };
    }),
  }));
}

/** A comment leaves with its replies */
const withoutComment = (moment: Moment, commentId: string): Moment => ({ ...moment, comments: moment.comments.filter((c) => c.id !== commentId && c.parentId !== commentId) });

/** For a report: the comment and the post it is on. `target` is "momentId/commentId" */
export async function commentOfReport(target: string): Promise<{ moment: Moment; comment: Moment['comments'][number] } | null> {
  const [momentId, commentId] = target.split('/');
  const moment = momentId ? await momentRepository.findById(momentId) : null;
  const comment = moment?.comments.find((c) => c.id === commentId);
  return moment && comment ? { moment, comment } : null;
}

/** Staff take down a reported comment; answers the ids that went, so their notices can go too */
export async function removeReportedComment(target: string): Promise<string[]> {
  const found = await commentOfReport(target);
  if (!found) return [];
  const removedIds = found.moment.comments.filter((c) => c.id === found.comment.id || c.parentId === found.comment.id).map((c) => c.id);
  await momentRepository.mutate(found.moment.id, (m) => withoutComment(m, found.comment.id));
  return removedIds;
}

/** The commenter or the moment's author may remove a comment */
export async function deleteComment(member: Member, id: string, commentId: string): Promise<{ moment: Moment; removedIds: string[] }> {
  const moment = await requireVisible(id);
  const comment = moment.comments.find((c) => c.id === commentId);
  if (!comment) throw new MomentError('ไม่พบความคิดเห็น', 404);
  if (comment.authorId !== member.id && moment.authorId !== member.id) throw new MomentError('ลบได้เฉพาะความคิดเห็นของตัวเองหรือในโมเมนต์ของตัวเอง', 403);
  const removedIds = moment.comments.filter((c) => c.id === commentId || c.parentId === commentId).map((c) => c.id);
  return { moment: await momentRepository.mutate(id, (m) => withoutComment(m, commentId)), removedIds };
}

/** One report per member; AUTO_HIDE_REPORTS distinct reports hide the moment for moderator review */
export async function reportMoment(member: Member, id: string, reason: unknown): Promise<{ moment: Moment; autoHidden: boolean }> {
  const moment = await requireVisible(id);
  if (moment.authorId === member.id) throw new MomentError('รายงานโมเมนต์ของตัวเองไม่ได้');
  if (moment.reports.some((r) => r.memberId === member.id)) throw new MomentError('คุณรายงานโมเมนต์นี้ไปแล้ว', 409);
  const cleanReason = text(reason, 200) || 'ไม่ระบุเหตุผล';
  let autoHidden = false;
  const updated = await momentRepository.mutate(id, (m) => {
    const reports = [...m.reports, { memberId: member.id, reason: cleanReason, createdAt: new Date().toISOString() }];
    autoHidden = reports.length >= AUTO_HIDE_REPORTS && m.status === 'published';
    return autoHidden ? { ...m, reports, status: 'hidden', hiddenBy: 'reports' } : { ...m, reports };
  });
  return { moment: updated, autoHidden };
}
