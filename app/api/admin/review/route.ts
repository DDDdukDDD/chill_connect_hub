import { NextResponse } from 'next/server';
import { actorCan, getAdminActor, requireAdminApiAccess } from '@/lib/adminApiAuth';
import { recordAudit } from '@/lib/auditLog';
import { checkEventQuality, checkSpotQuality, QualityReport } from '@/lib/contentQuality';
import { db, paginateArray } from '@/lib/db';
import { isEventEnded, parseEventEndDateToTimestamp } from '@/lib/dateUtils';
import { AdminEventItem, listAdminEvents } from '@/lib/eventsStore';
import { getAllDataSources } from '@/lib/sourcesStore';
import { isThaiCoordinate } from '@/lib/scrapers/tourismDirectory';
import { LifestyleSpotItem, MOCK_SPOTS } from '@/data/spotsData';

/**
 * Unified review queue: everything waiting for a decision, across pillars.
 * - community / fairs: events with approvalStatus "pending"
 * - spots: draft spots that came from a scraper or a member, excluding the retired curated set
 *   (bundled MOCK_SPOTS, unpublished on purpose) and spots already rejected in review
 */
type Pillar = 'community' | 'fairs' | 'spots';
type ReviewKind = 'event' | 'spot';

interface ReviewItem {
  kind: ReviewKind;
  id: string;
  pillar: Pillar;
  title: string;
  province: string;
  source: string;
  submittedAt: number | null;
  quality: QualityReport;
  data: AdminEventItem | LifestyleSpotItem;
}

const PILLARS = new Set<Pillar>(['community', 'fairs', 'spots']);
const RETIRED_CURATED_IDS = new Set(MOCK_SPOTS.map((spot) => spot.id));
const DAY_MS = 24 * 60 * 60 * 1000;

async function getAllSpots(): Promise<LifestyleSpotItem[]> {
  const first = await db.findSpots({ page: 1, limit: 100, includeDrafts: true });
  const spots = [...first.items];
  for (let page = 2; page <= first.totalPages; page += 1) {
    spots.push(...(await db.findSpots({ page, limit: 100, includeDrafts: true })).items);
  }
  return spots;
}

function isQueuedSpot(spot: LifestyleSpotItem): boolean {
  return spot.publicationStatus === 'draft' && !RETIRED_CURATED_IDS.has(spot.id) && !spot.reviewRejectedAt;
}

function toEventItem(event: AdminEventItem): ReviewItem {
  return {
    kind: 'event',
    id: event.id,
    pillar: event.eventType === 'community' ? 'community' : 'fairs',
    title: event.title,
    province: event.province || '',
    source: event.source || (event.eventType === 'community' ? 'สมาชิก' : 'ไม่ระบุ'),
    submittedAt: event.createdAtTimestamp || null,
    quality: checkEventQuality(event),
    data: event,
  };
}

function toSpotItem(spot: LifestyleSpotItem): ReviewItem {
  return {
    kind: 'spot',
    id: spot.id,
    pillar: 'spots',
    title: spot.title,
    province: spot.province,
    source: spot.sourceName || (spot.id.startsWith('spot-custom-') ? 'แอดมิน / สมาชิก' : 'ไม่ระบุ'),
    submittedAt: null,
    quality: checkSpotQuality(spot),
    data: spot,
  };
}

// Data health signals for the overview page
async function buildHealth(events: AdminEventItem[], spots: LifestyleSpotItem[]) {
  const published = spots.filter((spot) => spot.publicationStatus !== 'draft');
  const perProvince = new Map<string, number>();
  for (const spot of published) perProvince.set(spot.province, (perProvince.get(spot.province) ?? 0) + 1);
  const now = Date.now();
  const fairsEndingSoon = events.filter((event) => {
    if (event.eventType !== 'public_venue' || event.approvalStatus !== 'approved' || isEventEnded(event)) return false;
    const end = parseEventEndDateToTimestamp(event.endDate || event.date);
    return end - now <= 7 * DAY_MS;
  });
  const sources = await getAllDataSources();
  return {
    publishedSpots: published.length,
    spotsMissingImage: published.filter((spot) => !spot.image).length,
    spotsBadCoordinates: published.filter((spot) => !isThaiCoordinate(spot.latitude, spot.longitude)).length,
    thinProvinces: [...perProvince.entries()].filter(([, count]) => count < 10).map(([province, count]) => ({ province, count })),
    fairsEndingSoon: fairsEndingSoon.map((event) => ({ id: event.id, title: event.title, date: event.date })),
    approvedEventsPastEnd: events.filter((event) => event.approvalStatus === 'approved' && event.status !== 'ended' && isEventEnded(event)).length,
    failedSources: sources
      .filter((source) => source.lastRunStatus === 'failed')
      .map((source) => ({ id: source.id, name: source.name, lastRunAt: source.lastRunAt ?? null })),
  };
}

export async function GET(request: Request) {
  const denied = requireAdminApiAccess(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const pillarParam = searchParams.get('pillar');
  const pillar = pillarParam && PILLARS.has(pillarParam as Pillar) ? (pillarParam as Pillar) : null;
  const q = searchParams.get('q')?.trim().toLowerCase();
  const province = searchParams.get('province');
  const page = Number.parseInt(searchParams.get('page') || '1', 10) || 1;
  const limit = Math.min(Number.parseInt(searchParams.get('limit') || '20', 10) || 20, 100);

  const [events, spots] = await Promise.all([listAdminEvents(), getAllSpots()]);
  const all: ReviewItem[] = [
    ...events.filter((event) => event.approvalStatus === 'pending').map(toEventItem),
    ...spots.filter(isQueuedSpot).map(toSpotItem),
  ];
  const counts = {
    all: all.length,
    community: all.filter((item) => item.pillar === 'community').length,
    fairs: all.filter((item) => item.pillar === 'fairs').length,
    spots: all.filter((item) => item.pillar === 'spots').length,
  };

  // Most complete first, so quick approvals surface; then newest
  const filtered = all
    .filter((item) =>
      (!pillar || item.pillar === pillar) &&
      (!province || province === 'all' || item.province === province) &&
      (!q || item.title.toLowerCase().includes(q) || item.source.toLowerCase().includes(q))
    )
    .sort((a, b) => b.quality.score - a.quality.score || (b.submittedAt ?? 0) - (a.submittedAt ?? 0));
  const result = paginateArray(filtered, page, limit);

  return NextResponse.json(
    {
      success: true,
      items: result.items,
      counts,
      ...(searchParams.get('health') === '1' && { health: await buildHealth(events, spots) }),
      pagination: {
        totalCount: result.totalCount,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

// { action: 'approve' | 'reject', items: [{ kind, id }], reason? }
export async function POST(request: Request) {
  const denied = requireAdminApiAccess(request, 'community.review');
  if (denied) return denied;
  const actor = getAdminActor(request);

  let body: { action?: unknown; items?: unknown; reason?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { action } = body;
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ success: false, error: 'action must be approve or reject' }, { status: 400 });
  }
  const requested = Array.isArray(body.items)
    ? body.items.filter((item): item is { kind: ReviewKind; id: string } =>
      Boolean(item) && (item.kind === 'event' || item.kind === 'spot') && typeof item.id === 'string')
    : [];
  if (requested.length === 0 || requested.length > 200) {
    return NextResponse.json({ success: false, error: 'ระบุรายการ 1-200 รายการ' }, { status: 400 });
  }
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : '';

  const eventIds = new Set(requested.filter((item) => item.kind === 'event').map((item) => item.id));
  const spotIds = new Set(requested.filter((item) => item.kind === 'spot').map((item) => item.id));
  const events = (await listAdminEvents()).filter((event) => eventIds.has(event.id) && event.approvalStatus === 'pending');
  const spots = spotIds.size ? (await getAllSpots()).filter((spot) => spotIds.has(spot.id) && isQueuedSpot(spot)) : [];

  // Moderators may decide community meetups only; fairs and spots need content.edit
  const needsEdit = spots.length > 0 || events.some((event) => event.eventType !== 'community');
  if (needsEdit && !actorCan(actor, 'content.edit')) {
    return NextResponse.json(
      { success: false, error: 'บัญชีนี้ตรวจได้เฉพาะกิจกรรมคอมมูนิตี้', permission: 'content.edit' },
      { status: 403 }
    );
  }

  const moderatedAt = Date.now();
  if (events.length) {
    await db.bulkUpdateEvents(events.map((event) => ({
      id: event.id,
      data: action === 'approve'
        ? { approvalStatus: 'approved', moderatedAt, rejectionReason: undefined }
        : { approvalStatus: 'rejected', moderatedAt, rejectionReason: reason || undefined },
    })));
  }
  if (spots.length) {
    await db.bulkUpdateSpots(spots.map((spot) => (
      action === 'approve'
        ? { id: spot.id, publicationStatus: 'published' as const }
        : { id: spot.id, reviewRejectedAt: new Date(moderatedAt).toISOString(), rejectionReason: reason || undefined }
    )));
  }

  const verb = action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ';
  for (const event of events) {
    recordAudit(actor, `event.${action}`, `${verb}${event.eventType === 'community' ? 'กิจกรรม' : 'งานแฟร์'} "${event.title}"${reason && action === 'reject' ? ` · เหตุผล: ${reason}` : ''}`, { type: 'event', id: event.id });
  }
  for (const spot of spots) {
    recordAudit(actor, `spot.${action}`, `${verb}สถานที่ "${spot.title}"${reason && action === 'reject' ? ` · เหตุผล: ${reason}` : ''}`, { type: 'spot', id: spot.id });
  }

  return NextResponse.json({
    success: true,
    updated: events.length + spots.length,
    skipped: requested.length - events.length - spots.length,
  });
}
