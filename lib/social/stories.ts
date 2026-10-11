import { randomUUID } from 'node:crypto';
import { tidyDisplayName } from '../displayName';
import { memberRepository } from '../members';
import { MemberAuthError } from '../members/accounts';
import { addRiskFlags } from '../members/safety';
import { makeFlag, trustLevel } from '../members/trust';
import type { Member } from '../members/types';
import { createJsonStore } from './jsonStore';

/** A story is one photo that disappears 24 hours after it is posted */
export interface Story {
  id: string;
  authorId: string;
  image: string;
  caption: string;
  createdAt: string;
  expiresAt: string;
  viewedBy: string[];
  reports?: { memberId: string; reason: string; at: string }[];
  /** Hidden after enough distinct reports, until it expires */
  hidden?: boolean;
}

const store = createJsonStore<Story>('stories');
export const STORY_HOURS = 24;
export const MAX_ACTIVE_STORIES = 5;
export const MAX_STORY_CAPTION = 120;
/** Distinct member reports that hide a story */
export const STORY_AUTO_HIDE_REPORTS = 3;
const HOUR = 60 * 60 * 1000;

export interface StoryGroup {
  author: { id: string; displayName: string; avatarUrl: string };
  isMine: boolean;
  isFollowing: boolean;
  allSeen: boolean;
  latest: string;
  stories: { id: string; image: string; caption: string; createdAt: string; hoursLeft: number; seen: boolean; hasReported: boolean; views?: number }[];
}

const isActive = (story: Story, now = Date.now()) => new Date(story.expiresAt).getTime() > now;
/** Only files that went through /api/upload (local uploads folder or the blob store) */
const isUploadedImage = (url: string) => /^\/uploads\/[\w\-./]+$/.test(url) || /^https:\/\/[\w-]+\.public\.blob\.vercel-storage\.com\//.test(url);

export async function createStory(member: Member, input: Record<string, unknown>): Promise<Story> {
  const image = typeof input.image === 'string' ? input.image : '';
  if (!image) throw new MemberAuthError('เลือกรูปก่อนนะ');
  if (!isUploadedImage(image)) throw new MemberAuthError('รูปต้องอัปโหลดผ่านระบบ (/api/upload) ก่อน');
  const caption = typeof input.caption === 'string' ? input.caption.replace(/\s+/g, ' ').trim().slice(0, MAX_STORY_CAPTION) : '';
  if (store.read().filter((s) => s.authorId === member.id && isActive(s)).length >= MAX_ACTIVE_STORIES) {
    throw new MemberAuthError(`มีสตอรี่ได้พร้อมกัน ${MAX_ACTIVE_STORIES} รูป ลบรูปเก่าก่อน หรือรอให้หมดเวลา`, 429);
  }
  const now = Date.now();
  const story: Story = { id: `sty_${randomUUID()}`, authorId: member.id, image, caption, createdAt: new Date(now).toISOString(), expiresAt: new Date(now + STORY_HOURS * HOUR).toISOString(), viewedBy: [] };
  // Expired stories are dropped whenever a new one is saved, so the file does not grow
  await store.update((items) => [story, ...items.filter((s) => isActive(s, now))]);
  return story;
}

/** Active stories grouped by author: the viewer's own first, then people they follow, then unseen ones */
export async function activeStories(viewer: Member | null): Promise<StoryGroup[]> {
  const now = Date.now();
  const blocked = new Set(viewer?.blockedIds ?? []);
  const following = new Set(viewer?.followingIds ?? []);
  const groups = new Map<string, Story[]>();
  for (const story of store.read()) {
    if (!isActive(story, now) || story.hidden || blocked.has(story.authorId)) continue;
    groups.set(story.authorId, [...(groups.get(story.authorId) ?? []), story]);
  }
  const result: StoryGroup[] = [];
  for (const [authorId, stories] of groups) {
    const author = await memberRepository.findById(authorId);
    if (!author || author.status !== 'active') continue;
    const items = stories
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((s) => ({
        id: s.id,
        image: s.image,
        caption: s.caption,
        createdAt: s.createdAt,
        hoursLeft: Math.max(1, Math.ceil((new Date(s.expiresAt).getTime() - now) / HOUR)),
        seen: Boolean(viewer && (s.viewedBy.includes(viewer.id) || s.authorId === viewer.id)),
        hasReported: Boolean(viewer && s.reports?.some((r) => r.memberId === viewer.id)),
        // Only the author learns how many people looked
        views: viewer?.id === authorId ? s.viewedBy.length : undefined,
      }));
    result.push({
      author: { id: authorId, displayName: tidyDisplayName(author.displayName).trim() || author.displayName, avatarUrl: author.avatarUrl ?? '' },
      isMine: viewer?.id === authorId,
      isFollowing: following.has(authorId),
      allSeen: items.every((s) => s.seen),
      latest: items[items.length - 1].createdAt,
      stories: items,
    });
  }
  const rank = (g: StoryGroup) => (g.isMine ? 0 : g.allSeen ? 3 : g.isFollowing ? 1 : 2);
  return result.sort((a, b) => rank(a) - rank(b) || b.latest.localeCompare(a.latest));
}

export async function markStoryViewed(viewer: Member, id: string): Promise<void> {
  const story = store.read().find((s) => s.id === id);
  if (!story || story.authorId === viewer.id || story.viewedBy.includes(viewer.id)) return;
  await store.update((items) => items.map((s) => (s.id === id ? { ...s, viewedBy: [...s.viewedBy, viewer.id] } : s)));
}

/** One report per member; enough distinct reports hide the story. Every report raises a flag for staff. */
export async function reportStory(reporter: Member, id: string, reasonInput: unknown): Promise<{ hidden: boolean }> {
  const story = store.read().find((s) => s.id === id && isActive(s));
  if (!story) throw new MemberAuthError('ไม่พบสตอรี่', 404);
  if (story.authorId === reporter.id) throw new MemberAuthError('รายงานสตอรี่ของตัวเองไม่ได้');
  if (trustLevel(reporter) === 'new') throw new MemberAuthError('ยืนยันอีเมลและรับคำมั่นก่อน จึงจะรายงานได้', 403);
  if (story.reports?.some((r) => r.memberId === reporter.id)) throw new MemberAuthError('คุณรายงานสตอรี่นี้ไปแล้ว ทีมงานกำลังตรวจสอบ', 409);
  const reason = typeof reasonInput === 'string' ? reasonInput.replace(/\s+/g, ' ').trim().slice(0, 200) : '';
  if (!reason) throw new MemberAuthError('เลือกเหตุผลก่อนนะ');
  const reports = [...(story.reports ?? []), { memberId: reporter.id, reason, at: new Date().toISOString() }];
  const hidden = reports.length >= STORY_AUTO_HIDE_REPORTS;
  await store.update((items) => items.map((s) => (s.id === id ? { ...s, reports, hidden: hidden || s.hidden } : s)));
  await addRiskFlags(story.authorId, [makeFlag('reported', `สตอรี่ถูกรายงาน ${reports.length} ครั้ง · ล่าสุด: ${reason}`)]);
  return { hidden };
}

export async function deleteStory(member: Member, id: string): Promise<void> {
  const story = store.read().find((s) => s.id === id);
  if (!story) throw new MemberAuthError('ไม่พบสตอรี่', 404);
  if (story.authorId !== member.id) throw new MemberAuthError('ลบได้เฉพาะสตอรี่ของตัวเอง', 403);
  await store.update((items) => items.filter((s) => s.id !== id));
}

/** Account deletion: the member's stories and their views of other stories */
export async function removeStoriesOf(memberId: string): Promise<void> {
  await store.update((items) => items.filter((s) => s.authorId !== memberId).map((s) => ({ ...s, viewedBy: s.viewedBy.filter((v) => v !== memberId), reports: s.reports?.filter((r) => r.memberId !== memberId) })));
}
