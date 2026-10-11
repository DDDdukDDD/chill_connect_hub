import type { ChallengeQuest } from '@/data/mockData';
import type { LifestyleSpotItem } from '@/data/spotsData';
import { isThaiCoordinate } from '../contentQuality';
import { formatThaiDateBE } from '../dateUtils';
import { db } from '../db';
import { getQuestDateError } from '../questLifecycle';
import { defaultSpotCategoryLabel, SPOT_CATEGORY_OPTIONS } from '../spotCategories';
import { guardMemberText } from '../social/textRules';
import { MemberAuthError } from './accounts';
import { trustLevel } from './trust';
import type { Member } from './types';

/**
 * What members send in for staff to review: a place for the Spots pillar and an idea for a challenge.
 * Both are saved as drafts (hidden from the site) and published by staff from the admin console.
 * Points, badges' artwork and partner rewards are never set by a member.
 */
const MAX_WAITING = 5;
const QUEST_CATEGORIES = new Set(['heal', 'move', 'chill', 'learn']);
const SPOT_CATEGORIES = new Set<string>(SPOT_CATEGORY_OPTIONS.map((option) => option.id));
const ISO_DAY = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

const text = (value: unknown, max: number): string => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const plain = (html: string): string => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const list = (value: unknown, maxItems: number, maxLength: number): string[] =>
  (Array.isArray(value) ? value : []).map((item) => text(item, maxLength)).filter(Boolean).slice(0, maxItems);

function image(value: unknown): string {
  const url = text(value, 500);
  if (!url) return '';
  if (url.startsWith('/uploads/') || url.startsWith('https://')) return url;
  throw new MemberAuthError('รูปต้องเป็นรูปที่อัปโหลดหรือลิงก์ https', 400);
}

/** Only verified accounts create content; the same rule as chat and meet-up groups */
export function guardCreator(member: Member): void {
  if (member.status !== 'active') throw new MemberAuthError('บัญชีนี้ยังใช้งานส่วนนี้ไม่ได้', 403);
  if (trustLevel(member) === 'new') throw new MemberAuthError('ยืนยันอีเมลและรับคำมั่นของคอมมูนิตี้ก่อนนะ (ดูที่หน้าโปรไฟล์)', 403);
}

/** Latitude and longitude from a Google Maps link, when the link carries them */
export function coordinatesFromMapUrl(url: string): { latitude: number; longitude: number } | null {
  const match = url.match(/@(-?[0-9]+\.[0-9]+),(-?[0-9]+\.[0-9]+)/) || url.match(/!3d(-?[0-9]+\.[0-9]+)!4d(-?[0-9]+\.[0-9]+)/) || url.match(/[?&](?:q|query|ll)=(-?[0-9]+\.[0-9]+),(-?[0-9]+\.[0-9]+)/);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  return isThaiCoordinate(latitude, longitude) ? { latitude, longitude } : null;
}

async function allSpots(): Promise<LifestyleSpotItem[]> {
  const first = await db.findSpots({ page: 1, limit: 100, includeDrafts: true });
  const spots = [...first.items];
  for (let page = 2; page <= first.totalPages; page += 1) spots.push(...(await db.findSpots({ page, limit: 100, includeDrafts: true })).items);
  return spots;
}

export async function spotsSuggestedBy(memberId: string): Promise<LifestyleSpotItem[]> {
  return (await allSpots()).filter((spot) => spot.suggestedByMemberId === memberId);
}

export async function questsProposedBy(memberId: string): Promise<ChallengeQuest[]> {
  const result = await db.findQuests({ page: 1, limit: 100, includeDrafts: true, status: 'all' });
  return result.items.filter((quest) => quest.createdByMemberId === memberId);
}

export async function suggestSpot(member: Member, input: Record<string, unknown>): Promise<LifestyleSpotItem> {
  guardCreator(member);
  const title = text(input.title, 120);
  const province = text(input.province, 60);
  const description = text(input.description, 4000);
  const openHours = text(input.openHours, 120);
  const category = text(input.category, 30);
  if (title.length < 5) throw new MemberAuthError('ชื่อสถานที่ต้องมีอย่างน้อย 5 ตัวอักษร', 400);
  if (!province) throw new MemberAuthError('กรุณาเลือกจังหวัด', 400);
  if (!SPOT_CATEGORIES.has(category)) throw new MemberAuthError('กรุณาเลือกประเภทสถานที่', 400);
  if (plain(description).length < 15) throw new MemberAuthError('เล่าเกี่ยวกับสถานที่อย่างน้อย 15 ตัวอักษร', 400);
  if (!openHours) throw new MemberAuthError('กรุณาระบุเวลาเปิด', 400);
  const googleMapsUrl = text(input.googleMapsUrl, 500);
  if (googleMapsUrl && !/^https:\/\/([a-z0-9-]+\.)*(google\.[a-z.]+|goo\.gl)\//i.test(googleMapsUrl)) {
    throw new MemberAuthError('ลิงก์แผนที่ต้องเป็นลิงก์ Google Maps', 400);
  }
  await guardMemberText(member, `${title} ${plain(description)}`, 'แนะนำสถานที่');

  const mine = await spotsSuggestedBy(member.id);
  if (mine.filter((spot) => spot.publicationStatus === 'draft' && !spot.reviewRejectedAt).length >= MAX_WAITING) {
    throw new MemberAuthError(`มีสถานที่รอทีมงานตรวจอยู่ ${MAX_WAITING} แห่งแล้ว รอผลก่อนแล้วค่อยส่งเพิ่มนะ`, 429);
  }
  const key = title.replace(/\s+/g, '').toLowerCase();
  if ((await allSpots()).some((spot) => spot.province === province && spot.title.replace(/\s+/g, '').toLowerCase() === key)) {
    throw new MemberAuthError('มีสถานที่ชื่อนี้ในจังหวัดนี้อยู่แล้ว', 409);
  }

  const coordinates = googleMapsUrl ? coordinatesFromMapUrl(googleMapsUrl) : null;
  return db.createSpot({
    title,
    category: category as LifestyleSpotItem['category'],
    categoryLabel: defaultSpotCategoryLabel(category),
    province,
    district: text(input.district, 80),
    image: image(input.image),
    openHours,
    price: text(input.price, 60) || 'ไม่ระบุ',
    bestTime: text(input.bestTime, 80),
    vibeTags: [],
    description,
    highlights: list(input.highlights, 6, 80),
    facilities: [],
    googleMapsUrl,
    rating: 0,
    reviewsCount: 0,
    // Staff set the pin before publishing when the link carries no coordinates
    latitude: coordinates?.latitude ?? 0,
    longitude: coordinates?.longitude ?? 0,
    publicationStatus: 'draft',
    sourceName: `สมาชิกแนะนำ: ${member.displayName}`,
    suggestedByMemberId: member.id,
    suggestedAt: new Date().toISOString(),
  });
}

export async function proposeQuest(member: Member, input: Record<string, unknown>): Promise<ChallengeQuest> {
  guardCreator(member);
  const title = text(input.title, 100);
  const objective = text(input.objective, 600);
  const badgeLabel = text(input.badgeLabel, 40);
  const steps = list(input.steps, 8, 160);
  const total = Math.floor(Number(input.total));
  const category = text(input.category, 10);
  if (title.length < 5) throw new MemberAuthError('ชื่อชาเลนจ์ต้องมีอย่างน้อย 5 ตัวอักษร', 400);
  if (!QUEST_CATEGORIES.has(category)) throw new MemberAuthError('กรุณาเลือกหมวดของชาเลนจ์', 400);
  if (objective.length < 15) throw new MemberAuthError('อธิบายเป้าหมายอย่างน้อย 15 ตัวอักษร', 400);
  if (steps.length === 0) throw new MemberAuthError('ใส่ขั้นตอนอย่างน้อย 1 ข้อ', 400);
  if (!Number.isFinite(total) || total < 1 || total > 100) throw new MemberAuthError('จำนวนครั้งที่ต้องทำต้องอยู่ระหว่าง 1 ถึง 100', 400);
  if (!badgeLabel) throw new MemberAuthError('ตั้งชื่อเหรียญที่จะได้รับ', 400);
  const startIso = text(input.startDate, 10);
  const endIso = text(input.endDate, 10);
  if (!ISO_DAY.test(startIso) || !ISO_DAY.test(endIso)) throw new MemberAuthError('กรุณาเลือกวันเริ่มและวันสิ้นสุด', 400);
  const dateError = getQuestDateError(startIso, endIso);
  if (dateError) throw new MemberAuthError(dateError, 400);
  await guardMemberText(member, `${title} ${objective} ${steps.join(' ')}`, 'เสนอชาเลนจ์');

  const mine = await questsProposedBy(member.id);
  if (mine.filter((quest) => quest.status === 'draft').length >= MAX_WAITING) {
    throw new MemberAuthError(`มีชาเลนจ์รอทีมงานตรวจอยู่ ${MAX_WAITING} รายการแล้ว รอผลก่อนแล้วค่อยส่งเพิ่มนะ`, 429);
  }

  return db.createQuest({
    title,
    category: category as ChallengeQuest['category'],
    iconName: 'Zap',
    badgeLabel,
    targetGoal: objective,
    objective,
    steps,
    verificationMethod: text(input.verificationMethod, 200) || undefined,
    total: String(total),
    current: '0',
    progressPercent: 0,
    completedCountInfo: `0/${total}`,
    visibility: 'public',
    status: 'draft',
    creatorName: member.displayName,
    creatorAvatar: member.avatarUrl,
    participantsCount: 0,
    rewardPoints: 0,
    isOfficial: false,
    startDate: formatThaiDateBE(startIso),
    endDate: formatThaiDateBE(endIso),
    image: image(input.image) || undefined,
    createdByMemberId: member.id,
  });
}
