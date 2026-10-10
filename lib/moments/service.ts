import { randomUUID } from 'node:crypto';
import { memberRepository } from '../members';
import type { Member } from '../members/types';
import {
  AUTO_HIDE_REPORTS, MAX_CAPTION_LENGTH, MAX_COMMENT_LENGTH, MAX_MOMENT_IMAGES, Moment, MomentCategory, MomentComment,
  momentRepository, MomentTargetType,
} from './index';

export class MomentError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

const TARGET_TYPES = new Set<MomentTargetType>(['spot', 'community', 'fair', 'challenge', 'general']);
const CATEGORIES = new Set<MomentCategory>(['heal', 'move', 'chill', 'learn']);
const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/** Only images uploaded through /api/upload (local disk or Vercel Blob) may be attached */
export function isAllowedMomentImage(url: string): boolean {
  return url.startsWith('/uploads/') || /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(url);
}

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
  }
  const people = new Map<string, Member>();
  for (const id of ids) {
    const member = await memberRepository.findById(id);
    if (member) people.set(id, member);
  }
  return people;
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
export function toFeedItem(moment: Moment, viewer: Member | null, people: Map<string, Member>) {
  const author = moment.authorId ? people.get(moment.authorId) : undefined;
  const comments = moment.comments
    .filter((comment) => !comment.hidden && (!comment.authorId || people.get(comment.authorId)?.status !== 'banned'))
    .map((comment) => {
      const commenter = comment.authorId ? people.get(comment.authorId) : undefined;
      return {
        id: comment.id,
        userName: commenter?.displayName ?? comment.authorName,
        userAvatar: commenter?.avatarUrl ?? comment.authorAvatar ?? '',
        text: comment.text,
        timeAgo: thaiTimeAgo(comment.createdAt),
        createdAt: comment.createdAt,
        isMine: Boolean(viewer && comment.authorId === viewer.id),
      };
    });
  return {
    id: moment.id,
    authorId: moment.authorId,
    userName: author?.displayName ?? moment.authorName,
    userAvatar: author?.avatarUrl ?? moment.authorAvatar ?? '',
    userBadge: moment.authorBadge ?? '',
    images: moment.images,
    caption: moment.caption,
    location: moment.location,
    category: moment.category,
    likesCount: moment.likedBy.length + moment.sampleLikes,
    commentsCount: comments.length,
    timeAgo: thaiTimeAgo(moment.createdAt),
    createdAt: moment.createdAt,
    isLiked: Boolean(viewer && moment.likedBy.includes(viewer.id)),
    isSaved: Boolean(viewer && moment.savedBy.includes(viewer.id)),
    isMine: Boolean(viewer && moment.authorId === viewer.id),
    hasReported: Boolean(viewer && moment.reports.some((r) => r.memberId === viewer.id)),
    comments,
    targetType: moment.targetType,
    targetId: moment.targetId,
    targetTitle: moment.targetTitle,
    isSample: moment.isSample,
  };
}

export type FeedItem = ReturnType<typeof toFeedItem>;

export async function createMoment(member: Member, input: Record<string, unknown>): Promise<Moment> {
  const caption = text(input.caption, MAX_CAPTION_LENGTH + 1);
  if (!caption) throw new MomentError('กรุณาเขียนคำบรรยาย');
  if (caption.length > MAX_CAPTION_LENGTH) throw new MomentError(`คำบรรยายยาวได้ไม่เกิน ${MAX_CAPTION_LENGTH} ตัวอักษร`);
  const images = Array.isArray(input.images) ? input.images.filter((url): url is string => typeof url === 'string') : [];
  if (images.length === 0) throw new MomentError('กรุณาแนบรูปอย่างน้อย 1 รูป');
  if (images.length > MAX_MOMENT_IMAGES) throw new MomentError(`แนบรูปได้ไม่เกิน ${MAX_MOMENT_IMAGES} รูป`);
  if (!images.every(isAllowedMomentImage)) throw new MomentError('รูปต้องอัปโหลดผ่านระบบ (/api/upload) ก่อน');
  const targetType = (TARGET_TYPES.has(input.targetType as MomentTargetType) ? input.targetType : 'general') as MomentTargetType;
  const category = CATEGORIES.has(input.category as MomentCategory) ? (input.category as MomentCategory) : undefined;
  const location = text(input.location, 120) || text(input.targetTitle, 120) || 'ไลฟ์สไตล์ทั่วไป';

  return momentRepository.create({
    id: `mom_${randomUUID()}`,
    authorId: member.id,
    authorName: member.displayName,
    authorAvatar: member.avatarUrl,
    caption,
    images,
    location,
    category,
    targetType,
    targetId: text(input.targetId, 120) || undefined,
    targetTitle: text(input.targetTitle, 200) || undefined,
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
  if (!caption || caption.length > MAX_CAPTION_LENGTH) throw new MomentError(`คำบรรยายต้องมี 1-${MAX_CAPTION_LENGTH} ตัวอักษร`);
  const location = input.location !== undefined ? text(input.location, 120) || moment.location : moment.location;
  return momentRepository.mutate(id, (m) => ({ ...m, caption, location, updatedAt: new Date().toISOString() }));
}

export async function deleteOwnMoment(member: Member, id: string): Promise<void> {
  const moment = await momentRepository.findById(id);
  if (!moment || moment.status === 'removed') throw new MomentError('ไม่พบโมเมนต์', 404);
  if (moment.authorId !== member.id) throw new MomentError('ลบได้เฉพาะโมเมนต์ของตัวเอง', 403);
  await momentRepository.remove(id);
}

const toggle = (list: string[], id: string, on: boolean) => (on ? [...new Set([...list, id])] : list.filter((x) => x !== id));

export async function setLike(member: Member, id: string, liked: boolean): Promise<Moment> {
  await requireVisible(id);
  return momentRepository.mutate(id, (m) => ({ ...m, likedBy: toggle(m.likedBy, member.id, liked) }));
}

export async function setSaved(member: Member, id: string, saved: boolean): Promise<Moment> {
  await requireVisible(id);
  return momentRepository.mutate(id, (m) => ({ ...m, savedBy: toggle(m.savedBy, member.id, saved) }));
}

export async function addComment(member: Member, id: string, input: unknown): Promise<Moment> {
  await requireVisible(id);
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
  };
  return momentRepository.mutate(id, (m) => ({ ...m, comments: [...m.comments, comment] }));
}

/** The commenter or the moment's author may remove a comment */
export async function deleteComment(member: Member, id: string, commentId: string): Promise<Moment> {
  const moment = await requireVisible(id);
  const comment = moment.comments.find((c) => c.id === commentId);
  if (!comment) throw new MomentError('ไม่พบความคิดเห็น', 404);
  if (comment.authorId !== member.id && moment.authorId !== member.id) throw new MomentError('ลบได้เฉพาะความคิดเห็นของตัวเองหรือในโมเมนต์ของตัวเอง', 403);
  return momentRepository.mutate(id, (m) => ({ ...m, comments: m.comments.filter((c) => c.id !== commentId) }));
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
