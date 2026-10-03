import { NextResponse } from 'next/server';
import { ChallengeQuest } from '@/data/mockData';
import { db, CreateQuestDTO, UpdateQuestDTO } from '@/lib/db';
import { requireAdminApiAccess } from '@/lib/adminApiAuth';

const QUEST_STATUSES = new Set(['draft', 'active', 'ended']);
const QUEST_CATEGORIES = new Set(['heal', 'move', 'chill', 'learn']);
const MUTABLE_QUEST_FIELDS = new Set<keyof ChallengeQuest>([
  'title', 'iconName', 'progressPercent', 'current', 'total', 'badgeLabel',
  'badgeIcon', 'badgeCoverImg', 'completedCountInfo', 'category', 'visibility',
  'creatorName', 'creatorAvatar', 'participantsCount', 'rewardPoints', 'targetGoal',
  'isOfficial', 'objective', 'steps', 'verificationMethod', 'rewardsText',
  'startDate', 'endDate', 'daysRemaining', 'status',
]);

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
  if (quest.category && !QUEST_CATEGORIES.has(quest.category)) return 'หมวดหมู่ภารกิจไม่ถูกต้อง';
  if (quest.status && !QUEST_STATUSES.has(quest.status)) return 'สถานะภารกิจไม่ถูกต้อง';
  const total = Number(quest.total);
  if (!Number.isFinite(total) || total < 1) return 'เป้าหมายภารกิจต้องมากกว่า 0';
  return null;
}

function createQuestRecord(input: Record<string, unknown>): CreateQuestDTO | string {
  const quest = {
    title: typeof input.title === 'string' ? input.title.trim() : '',
    badgeLabel: typeof input.badgeLabel === 'string' ? input.badgeLabel.trim() : '',
    targetGoal: typeof input.targetGoal === 'string' ? input.targetGoal.trim() : '',
    category: typeof input.category === 'string' && QUEST_CATEGORIES.has(input.category)
      ? input.category as ChallengeQuest['category']
      : 'chill' as const,
    iconName: typeof input.iconName === 'string' && input.iconName.trim() ? input.iconName.trim() : 'Zap',
    total: String(Math.floor(Number(input.total) || 1)),
  };
  const validationError = validateQuest({ ...quest, status: 'draft' });
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
    startDate: typeof input.startDate === 'string' ? input.startDate.trim() : undefined,
    endDate: typeof input.endDate === 'string' ? input.endDate.trim() : undefined,
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
  const denied = requireAdminApiAccess(request);
  if (denied) return denied;

  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });

    if (body.action === 'create') {
      if (!isRecord(body.quest)) return NextResponse.json({ success: false, error: 'Quest data is required' }, { status: 400 });
      const questData = createQuestRecord(body.quest);
      if (typeof questData === 'string') return NextResponse.json({ success: false, error: questData }, { status: 400 });
      const quest = await db.createQuest(questData);
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
      const validationError = validateQuest({ ...existing, ...safeFields });
      if (validationError) return NextResponse.json({ success: false, error: validationError }, { status: 400 });
      const quest = await db.updateQuest(body.id, safeFields);
      return NextResponse.json({ success: true, quest });
    }

    if (body.action === 'set_status') {
      if (typeof body.id !== 'string' || typeof body.status !== 'string' || !QUEST_STATUSES.has(body.status)) {
        return NextResponse.json({ success: false, error: 'Quest id or status is invalid' }, { status: 400 });
      }
      const quest = await db.updateQuest(body.id, { status: body.status as ChallengeQuest['status'] });
      if (!quest) return NextResponse.json({ success: false, error: 'Quest not found' }, { status: 404 });
      return NextResponse.json({ success: true, quest });
    }

    if (body.action === 'delete') {
      if (typeof body.id !== 'string') return NextResponse.json({ success: false, error: 'Quest id is required' }, { status: 400 });
      const deleted = await db.deleteQuest(body.id);
      if (!deleted) return NextResponse.json({ success: false, error: 'Quest not found' }, { status: 404 });
      return NextResponse.json({ success: true, id: body.id });
    }

    return NextResponse.json({ success: false, error: 'Invalid quest action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling admin quest action:', error);
    return NextResponse.json({ success: false, error: 'Failed to process quest action' }, { status: 500 });
  }
}