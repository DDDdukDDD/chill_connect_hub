import { randomUUID } from 'node:crypto';
import { tidyDisplayName } from '../displayName';
import { memberRepository } from '../members';
import { MemberAuthError } from '../members/accounts';
import { addRiskFlags } from '../members/safety';
import { makeFlag, trustLevel } from '../members/trust';
import type { Member } from '../members/types';
import { createJsonStore } from './jsonStore';
import { isStoryTextColor, type StoryTextColor } from '../storyTextColors';

/** A story is one photo that disappears 24 hours after it is posted */
export interface Story {
  id: string;
  authorId: string;
  image: string;
  caption: string;
  createdAt: string;
  expiresAt: string;
  viewedBy: string[];
  /** The "อยู่ที่ไหน" sticker: the ตี้, อีเวนต์ or place the photo is from; viewers tap it to open that page */
  target?: StoryTarget;
  /** Where the author dragged and turned the text: centre as a share of the photo's width and height, degrees */
  captionLayout?: CaptionLayout;
  /** The text colour, one of lib/storyTextColors.ts; white when unset */
  captionColor?: StoryTextColor;
  reports?: { memberId: string; reason: string; at: string }[];
  /** Hidden after enough distinct reports, until it expires */
  hidden?: boolean;
}

export type StoryTarget = { type: 'community' | 'fair' | 'spot'; id: string; title: string };
const TARGET_TYPES = new Set(['community', 'fair', 'spot']);
export type CaptionLayout = { x: number; y: number; rotate: number };

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
  stories: { id: string; image: string; caption: string; captionLayout?: CaptionLayout; captionColor?: StoryTextColor; target?: StoryTarget; createdAt: string; hoursLeft: number; seen: boolean; hasReported: boolean; views?: number }[];
}

const isActive = (story: Story, now = Date.now()) => new Date(story.expiresAt).getTime() > now;
/** Only files that went through /api/upload (local uploads folder or the blob store) */
const isUploadedImage = (url: string) => /^\/uploads\/[\w\-./]+$/.test(url) || /^https:\/\/[\w-]+\.public\.blob\.vercel-storage\.com\//.test(url);

const oneLine = (value: unknown, max: number) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** The sticker as sent, or nothing when any part is missing (the id goes into a link, so it stays a plain slug) */
function storyTarget(input: unknown): StoryTarget | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const { type, id, title } = input as Record<string, unknown>;
  const cleanId = oneLine(id, 120);
  const cleanTitle = oneLine(title, 120);
  if (typeof type !== 'string' || !TARGET_TYPES.has(type) || !/^[\w-]+$/.test(cleanId) || !cleanTitle) return undefined;
  return { type: type as StoryTarget['type'], id: cleanId, title: cleanTitle };
}

/** The text's place on the photo, kept inside it; nothing when it is not three numbers */
function captionLayout(input: unknown): CaptionLayout | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const { x, y, rotate } = input as Record<string, unknown>;
  if (![x, y, rotate].every((n) => typeof n === 'number' && Number.isFinite(n))) return undefined;
  const share = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 1000) / 1000;
  // Any angle comes back as -180..180
  const turn = Math.round(((((rotate as number) % 360) + 540) % 360) - 180);
  return { x: share(x as number), y: share(y as number), rotate: turn };
}

export async function createStory(member: Member, input: Record<string, unknown>): Promise<Story> {
  const image = typeof input.image === 'string' ? input.image : '';
  if (!image) throw new MemberAuthError('เลือกรูปก่อนนะ');
  if (!isUploadedImage(image)) throw new MemberAuthError('รูปต้องอัปโหลดผ่านระบบ (/api/upload) ก่อน');
  const caption = oneLine(input.caption, MAX_STORY_CAPTION);
  const target = storyTarget(input.target);
  const layout = caption ? captionLayout(input.captionLayout) : undefined;
  const color = caption && isStoryTextColor(input.captionColor) && input.captionColor !== 'white' ? input.captionColor : undefined;
  if (store.read().filter((s) => s.authorId === member.id && isActive(s)).length >= MAX_ACTIVE_STORIES) {
    throw new MemberAuthError(`มีสตอรี่ได้พร้อมกัน ${MAX_ACTIVE_STORIES} รูป ลบรูปเก่าก่อน หรือรอให้หมดเวลา`, 429);
  }
  const now = Date.now();
  const story: Story = { id: `sty_${randomUUID()}`, authorId: member.id, image, caption, createdAt: new Date(now).toISOString(), expiresAt: new Date(now + STORY_HOURS * HOUR).toISOString(), viewedBy: [], ...(target && { target }), ...(layout && { captionLayout: layout }), ...(color && { captionColor: color }) };
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
  const authors = await memberRepository.findByIds([...groups.keys()]);
  for (const [authorId, stories] of groups) {
    const author = authors.get(authorId);
    if (!author || author.status !== 'active') continue;
    const items = stories
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((s) => ({
        id: s.id,
        image: s.image,
        caption: s.caption,
        captionLayout: s.captionLayout,
        captionColor: s.captionColor,
        target: s.target,
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

/** For staff: every story still inside its 24 hours, hidden ones included, most reported first */
export async function storiesForStaff() {
  const now = Date.now();
  const active = store.read().filter((s) => isActive(s, now));
  const authors = await memberRepository.findByIds(active.map((s) => s.authorId));
  return active
    .map((s) => {
      const author = authors.get(s.authorId);
      return {
        id: s.id,
        authorId: s.authorId,
        authorName: author ? tidyDisplayName(author.displayName).trim() || author.displayName : 'บัญชีที่ลบแล้ว',
        authorStatus: author?.status ?? 'deleted',
        image: s.image,
        caption: s.caption,
        createdAt: s.createdAt,
        hoursLeft: Math.max(1, Math.ceil((new Date(s.expiresAt).getTime() - now) / HOUR)),
        views: s.viewedBy.length,
        hidden: Boolean(s.hidden),
        reports: (s.reports ?? []).map((r) => ({ reason: r.reason, at: r.at })),
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length || b.createdAt.localeCompare(a.createdAt));
}

/** Staff actions on one story: take it down, hide it until it expires, or show it again and drop its reports */
export async function moderateStory(id: string, action: 'remove' | 'hide' | 'restore'): Promise<Story> {
  const story = store.read().find((s) => s.id === id);
  if (!story) throw new MemberAuthError('ไม่พบสตอรี่ (อาจหมดเวลาแล้ว)', 404);
  if (action === 'remove') await store.update((items) => items.filter((s) => s.id !== id));
  else await store.update((items) => items.map((s) => (s.id === id ? (action === 'hide' ? { ...s, hidden: true } : { ...s, hidden: false, reports: [] }) : s)));
  return story;
}

/** Every image a stored story shows, so a file still in use is not deleted */
export function storyImagesInUse(): string[] {
  return store.read().map((s) => s.image);
}

/** Account deletion: the member's stories and their views of other stories. Answers with the images of the removed stories */
export async function removeStoriesOf(memberId: string): Promise<string[]> {
  const images = store.read().filter((s) => s.authorId === memberId).map((s) => s.image);
  await store.update((items) => items.filter((s) => s.authorId !== memberId).map((s) => ({ ...s, viewedBy: s.viewedBy.filter((v) => v !== memberId), reports: s.reports?.filter((r) => r.memberId !== memberId) })));
  return images;
}
