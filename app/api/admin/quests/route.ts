import { NextResponse } from 'next/server';
import { ChallengeQuest, QuestReward } from '@/data/mockData';
import { getQuestDateError, parseQuestDate } from '@/lib/questLifecycle';
import { db, CreateQuestDTO, UpdateQuestDTO } from '@/lib/db';
import { getAdminActor, requireAdminApiAccess } from '@/lib/adminApiAuth';
import { recordAudit } from '@/lib/auditLog';
import { parseQuestRule, targetsOfQuest } from '@/lib/social/questProgress';
import { findVoucherByCode, markVoucherUsed } from '@/lib/social/questVouchers';
import { memberRepository } from '@/lib/members';
import { getMasterData } from '@/lib/masterDataStore';

const QUEST_STATUSES = new Set(['draft', 'active', 'ended']);
// A challenge's category must be one of the active ones in the master data (admin console → categories)
// Challenges use the community categories (owner 2026-10-16)
const isQuestCategory = (id: string) => getMasterData().communityCategories.some((category) => category.active && category.id === id);
const MUTABLE_QUEST_FIELDS = new Set<keyof ChallengeQuest>([
  'title', 'iconName', 'progressPercent', 'current', 'total', 'badgeLabel',
  'badgeIcon', 'badgeCoverImg', 'completedCountInfo', 'category', 'visibility',
  'creatorName', 'creatorAvatar', 'participantsCount', 'rewardPoints', 'targetGoal',
  'isOfficial', 'objective', 'steps', 'verificationMethod', 'rewardsText',
  'startDate', 'endDate', 'status', 'image', 'brandReward', 'rule',
]);
const REWARD_TYPES = new Set(['brand_partner', 'hub_central']);
const PLATFORM_PARTNER_NAME = 'Chill & Connect Hub';

function optionalText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim().slice(0, maxLength);
  return trimmed || undefined;
}

const REWARD_REQUIRED_ERROR = 'ทุกชาเลนจ์ต้องมีรางวัล กรุณาระบุประเภทและชื่อรางวัล';
const RULE_REQUIRED_ERROR = 'ทุกชาเลนจ์ต้องมีวิธีที่ระบบตรวจได้ กรุณาเลือกสิ่งที่ระบบจะนับ';

/**
 * Normalizes a brandReward payload. Returns null when none was sent, a string error, or the clean object.
 * brand_partner requires partnerName + title; hub_central always uses the platform as partner.
 */
function parseBrandReward(value: unknown): QuestReward | null | string {
  if (value === null) return null;
  if (!isRecord(value)) return 'ข้อมูลรางวัลพาร์ทเนอร์ไม่ถูกต้อง';
  if (typeof value.type !== 'string' || !REWARD_TYPES.has(value.type)) return 'ประเภทภารกิจต้องเป็น brand_partner หรือ hub_central';
  const type = value.type as QuestReward['type'];
  const title = optionalText(value.title, 160);
  if (!title || title.length < 3) return 'กรุณาระบุชื่อสิทธิพิเศษ/รางวัล (อย่างน้อย 3 ตัวอักษร)';
  const partnerName = type === 'hub_central' ? PLATFORM_PARTNER_NAME : optionalText(value.partnerName, 120);
  if (!partnerName) return 'ภารกิจพาร์ทเนอร์ต้องระบุชื่อแบรนด์พาร์ทเนอร์';
  return {
    type,
    title,
    partnerName,
    voucherCodePrefix: type === 'brand_partner' ? optionalText(value.voucherCodePrefix, 32) : undefined,
    exclusiveNotice: type === 'brand_partner' ? optionalText(value.exclusiveNotice, 300) : undefined,
    terms: optionalText(value.terms, 500),
    hubRewardNote: type === 'hub_central' ? optionalText(value.hubRewardNote, 300) : undefined,
  };
}

function parseImageUrl(value: unknown): string | undefined | false {
  const url = optionalText(value, 500);
  if (!url) return undefined;
  return url.startsWith('https://') || url.startsWith('/') ? url : false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : fallback;
}

function validateQuest(quest: Partial<ChallengeQuest>): string | null {
  if (typeof quest.title !== 'string' || quest.title.trim().length < 5) return 'ชื่อภารกิจต้องมีอย่างน้อย 5 ตัวอักษร';
  if (typeof quest.badgeLabel !== 'string' || !quest.badgeLabel.trim()) return 'กรุณาระบุชื่อเหรียญตรา';
  if (typeof quest.targetGoal !== 'string' || quest.targetGoal.trim().length < 15) return 'เป้าหมายภารกิจต้องมีอย่างน้อย 15 ตัวอักษร';
  if (quest.category && !isQuestCategory(quest.category)) return 'หมวดหมู่ภารกิจไม่ถูกต้อง';
  if (quest.status && !QUEST_STATUSES.has(quest.status)) return 'สถานะภารกิจไม่ถูกต้อง';
  const total = Number(quest.total);
  if (!Number.isFinite(total) || total < 1) return 'เป้าหมายภารกิจต้องมากกว่า 0';
  return getQuestDateError(quest.startDate, quest.endDate);
}

function createQuestRecord(input: Record<string, unknown>): CreateQuestDTO | string {
  const quest = {
    title: typeof input.title === 'string' ? input.title.trim() : '',
    badgeLabel: typeof input.badgeLabel === 'string' ? input.badgeLabel.trim() : '',
    targetGoal: typeof input.targetGoal === 'string' ? input.targetGoal.trim() : '',
    category: typeof input.category === 'string' && isQuestCategory(input.category) ? input.category : 'social',
    iconName: typeof input.iconName === 'string' && input.iconName.trim() ? input.iconName.trim() : 'Zap',
    total: String(Math.floor(Number(input.total) || 1)),
  };
  // Every challenge is created with a reward: the card and the challenge page always show one
  const brandReward = parseBrandReward(input.brandReward ?? null);
  if (brandReward === null) return REWARD_REQUIRED_ERROR;
  if (typeof brandReward === 'string') return brandReward;
  const image = parseImageUrl(input.image);
  if (image === false) return 'URL รูปภาพต้องขึ้นต้นด้วย https:// หรือ /';
  // And with a rule the system can check, or the reward could never be given
  if (!input.rule) return RULE_REQUIRED_ERROR;
  const rule = parseQuestRule(input.rule);
  if (!rule) return 'Invalid quest rule';
  const startDate = optionalText(input.startDate, 40);
  const endDate = optionalText(input.endDate, 40);
  const validationError = validateQuest({ ...quest, startDate, endDate, status: 'draft' });
  if (validationError) return validationError;

  const rewardPoints = Number(input.rewardPoints);
  const steps = Array.isArray(input.steps)
    ? input.steps.filter((step): step is string => typeof step === 'string' && step.trim().length > 0)
    : [];

  return {
    ...quest,
    progressPercent: 0,
    current: '0',
    completedCountInfo: `0/${quest.total}`,
    visibility: 'public',
    status: 'draft',
    creatorName: typeof input.creatorName === 'string' && input.creatorName.trim()
      ? input.creatorName.trim()
      : 'Chill & Connect Team',
    participantsCount: 0,
    rewardPoints: Number.isFinite(rewardPoints) ? Math.max(0, Math.floor(rewardPoints)) : 0,
    isOfficial: true,
    objective: typeof input.objective === 'string' ? input.objective.trim() : quest.targetGoal,
    steps,
    verificationMethod: typeof input.verificationMethod === 'string' ? input.verificationMethod.trim() : undefined,
    rewardsText: typeof input.rewardsText === 'string' ? input.rewardsText.trim() : undefined,
    badgeIcon: typeof input.badgeIcon === 'string' ? input.badgeIcon.trim() : undefined,
    badgeCoverImg: typeof input.badgeCoverImg === 'string' ? input.badgeCoverImg.trim() : undefined,
    startDate,
    endDate,
    image,
    brandReward,
    rule,
  };
}

export async function GET(request: Request) {
  const denied = requireAdminApiAccess(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const status = statusParam && QUEST_STATUSES.has(statusParam)
      ? statusParam as 'draft' | 'active' | 'ended'
      : 'all';
    const result = await db.findQuests({
      page: parsePositiveInteger(searchParams.get('page'), 1),
      limit: parsePositiveInteger(searchParams.get('limit'), 50),
      category: searchParams.get('category'),
      searchQuery: searchParams.get('q'),
      status,
      includeDrafts: true,
    });

    return NextResponse.json({
      success: true,
      total: result.totalCount,
      quests: result.items,
      pagination: {
        totalCount: result.totalCount,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
        nextCursor: result.nextCursor,
      },
    });
  } catch (error) {
    console.error('Error fetching admin quests:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch quests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = requireAdminApiAccess(request, 'content.edit');
  if (denied) return denied;
  const actor = getAdminActor(request);

  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });

    // While a challenge is written: how many places or events its rule would count, and a few of them, so staff
    // see a rule nobody can finish (too few matches) before saving it
    if (body.action === 'preview_rule') {
      const rule = parseQuestRule(body.rule);
      if (!rule) return NextResponse.json({ success: true, total: 0, targets: [] });
      const result = await targetsOfQuest({ rule } as ChallengeQuest, null, 5);
      return NextResponse.json({ success: true, total: result?.total ?? 0, targets: (result?.targets ?? []).map((t) => ({ title: t.title, detail: t.detail })) });
    }

    if (body.action === 'create') {
      if (!isRecord(body.quest)) return NextResponse.json({ success: false, error: 'Quest data is required' }, { status: 400 });
      const questData = createQuestRecord(body.quest);
      if (typeof questData === 'string') return NextResponse.json({ success: false, error: questData }, { status: 400 });
      const quest = await db.createQuest(questData);
      recordAudit(actor, 'quest.create', `สร้างชาเลนจ์ "${quest.title}"`, { type: 'quest', id: quest.id });
      return NextResponse.json({ success: true, quest }, { status: 201 });
    }

    if (body.action === 'update') {
      if (typeof body.id !== 'string' || !isRecord(body.updatedFields)) {
        return NextResponse.json({ success: false, error: 'Quest id and update fields are required' }, { status: 400 });
      }
      const existing = await db.findQuestById(body.id);
      if (!existing) return NextResponse.json({ success: false, error: 'Quest not found' }, { status: 404 });
      const safeFields = Object.fromEntries(
        Object.entries(body.updatedFields).filter(([key]) => MUTABLE_QUEST_FIELDS.has(key as keyof ChallengeQuest))
      ) as UpdateQuestDTO;
      if ('rule' in safeFields) {
        // The rule can be changed but not removed
        if (!safeFields.rule) return NextResponse.json({ success: false, error: RULE_REQUIRED_ERROR }, { status: 400 });
        const rule = parseQuestRule(safeFields.rule);
        if (!rule) return NextResponse.json({ success: false, error: 'Invalid quest rule' }, { status: 400 });
        safeFields.rule = rule;
      }
      if ('brandReward' in safeFields) {
        // The reward can be changed but not removed
        const brandReward = parseBrandReward(safeFields.brandReward ?? null);
        if (brandReward === null) return NextResponse.json({ success: false, error: REWARD_REQUIRED_ERROR }, { status: 400 });
        if (typeof brandReward === 'string') return NextResponse.json({ success: false, error: brandReward }, { status: 400 });
        safeFields.brandReward = brandReward;
      }
      if ('image' in safeFields) {
        const image = parseImageUrl(safeFields.image);
        if (image === false) return NextResponse.json({ success: false, error: 'URL รูปภาพต้องขึ้นต้นด้วย https:// หรือ /' }, { status: 400 });
        safeFields.image = image;
      }
      const validationError = validateQuest({ ...existing, ...safeFields });
      if (validationError) return NextResponse.json({ success: false, error: validationError }, { status: 400 });
      const quest = await db.updateQuest(body.id, safeFields);
      recordAudit(actor, 'quest.update', `แก้ไขชาเลนจ์ "${existing.title}" (${Object.keys(safeFields).join(', ')})`, { type: 'quest', id: body.id });
      return NextResponse.json({ success: true, quest });
    }

    // A reward code a member shows at a partner: look it up, or mark it used
    if (body.action === 'check_voucher' || body.action === 'use_voucher') {
      const code = typeof body.code === 'string' ? body.code.slice(0, 60) : '';
      const voucher = body.action === 'use_voucher' ? await markVoucherUsed(code) : findVoucherByCode(code);
      if (!voucher) return NextResponse.json({ success: false, error: 'ไม่พบรหัสนี้ ตรวจตัวสะกดอีกครั้ง' }, { status: 404 });
      const [quest, member] = await Promise.all([db.findQuestById(voucher.questId), memberRepository.findById(voucher.memberId)]);
      if (body.action === 'use_voucher') recordAudit(actor, 'quest.voucher_used', `ทำเครื่องหมายรหัสรางวัล ${voucher.code} ว่าใช้แล้ว`, { type: 'quest', id: voucher.questId });
      return NextResponse.json({
        success: true,
        voucher: {
          code: voucher.code,
          issuedAt: voucher.issuedAt,
          usedAt: voucher.usedAt ?? null,
          questTitle: quest?.title ?? '(ชาเลนจ์ถูกลบแล้ว)',
          rewardTitle: quest?.brandReward?.title ?? '',
          partnerName: quest?.brandReward?.partnerName ?? '',
          memberName: member?.displayName ?? '(บัญชีถูกลบแล้ว)',
        },
      });
    }

    if (body.action === 'set_status') {
      if (typeof body.id !== 'string' || typeof body.status !== 'string' || !QUEST_STATUSES.has(body.status)) {
        return NextResponse.json({ success: false, error: 'Quest id or status is invalid' }, { status: 400 });
      }
      const existing = await db.findQuestById(body.id);
      if (!existing) return NextResponse.json({ success: false, error: 'Quest not found' }, { status: 404 });
      const endAt = parseQuestDate(existing.endDate, true);
      if (body.status === 'active' && endAt !== null && endAt < Date.now()) {
        return NextResponse.json(
          { success: false, error: `ภารกิจนี้หมดเวลาแล้ว (${existing.endDate}) กรุณาแก้วันสิ้นสุดก่อนเผยแพร่` },
          { status: 400 }
        );
      }
      // An older challenge without a rule cannot be published until it has one
      if (body.status === 'active' && !existing.rule) {
        return NextResponse.json({ success: false, error: RULE_REQUIRED_ERROR }, { status: 400 });
      }
      const quest = await db.updateQuest(body.id, { status: body.status as ChallengeQuest['status'] });
      if (!quest) return NextResponse.json({ success: false, error: 'Quest not found' }, { status: 404 });
      recordAudit(actor, 'quest.set_status', `เปลี่ยนสถานะชาเลนจ์ "${existing.title}" เป็น ${body.status}`, { type: 'quest', id: body.id });
      return NextResponse.json({ success: true, quest });
    }

    if (body.action === 'delete') {
      if (typeof body.id !== 'string') return NextResponse.json({ success: false, error: 'Quest id is required' }, { status: 400 });
      const existing = await db.findQuestById(body.id);
      const deleted = await db.deleteQuest(body.id);
      if (!deleted) return NextResponse.json({ success: false, error: 'Quest not found' }, { status: 404 });
      recordAudit(actor, 'quest.delete', `ลบชาเลนจ์ "${existing?.title ?? body.id}"`, { type: 'quest', id: body.id });
      return NextResponse.json({ success: true, id: body.id });
    }

    return NextResponse.json({ success: false, error: 'Invalid quest action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling admin quest action:', error);
    return NextResponse.json({ success: false, error: 'Failed to process quest action' }, { status: 500 });
  }
}