import { NextResponse } from 'next/server';
import { runScraperAndAIEngine } from '@/lib/eventsStore';
import { requireAdminApiAccess } from '@/lib/adminApiAuth';
import { runSpotScraper } from '@/lib/spotScraper';
import { MASTER_77_PROVINCES } from '@/data/masterHub';
import type { SpotScrapeOptions } from '@/lib/scrapers/types';

const DEFAULT_SPOT_LIMIT = 30;
const MAX_SPOT_LIMIT = 100;

export async function POST(req: Request) {
  const denied = requireAdminApiAccess(req);
  if (denied) return denied;

  try {
    let targetSource: string | undefined;
    let targetType: 'events' | 'spots' = 'events';
    let spotOptions: SpotScrapeOptions | undefined;
    try {
      const body = await req.json();
      if (body && typeof body === 'object') {
        if (body.targetType && body.targetType !== 'events' && body.targetType !== 'spots') {
          return NextResponse.json({ success: false, error: 'targetType must be events or spots' }, { status: 400 });
        }
        targetSource = typeof body.sourceId === 'string'
          ? body.sourceId
          : typeof body.sourceName === 'string' ? body.sourceName : undefined;
        if (body.targetType === 'spots' || body.targetType === 'events') targetType = body.targetType;
        if (body.province !== undefined) {
          if (typeof body.province !== 'string' || !MASTER_77_PROVINCES.includes(body.province)) {
            return NextResponse.json({ success: false, error: 'province must be one of the 77 provinces (e.g. "น่าน", "กรุงเทพฯ")' }, { status: 400 });
          }
          const limit = Number(body.limit ?? DEFAULT_SPOT_LIMIT);
          spotOptions = {
            province: body.province,
            limit: Number.isFinite(limit) ? Math.min(MAX_SPOT_LIMIT, Math.max(1, Math.round(limit))) : DEFAULT_SPOT_LIMIT,
          };
        }
      }
    } catch {
      // Body is empty (scrape all)
    }

    const toSummary = (result: { totalScanned: number; newCount: number; duplicateCount: number; sourceResults: unknown }) => ({
      success: true,
      targetType,
      message: `สแกน${targetType === 'spots' ? 'สถานที่' : 'อีเวนต์'} ${result.totalScanned} รายการ: นำเข้า ${result.newCount}, ซ้ำ ${result.duplicateCount}`,
      newCount: result.newCount,
      duplicateCount: result.duplicateCount,
      totalScanned: result.totalScanned,
      sourceResults: result.sourceResults,
    });

    if (targetType === 'spots') {
      const result = await runSpotScraper(targetSource, spotOptions);
      return NextResponse.json({ ...toSummary(result), spots: result.spots });
    }

    const result = await runScraperAndAIEngine(targetSource);
    return NextResponse.json({ ...toSummary(result), duplicateDetails: result.duplicateDetails, events: result.events });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scrape failed';
    const status = message.startsWith('No active ') ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
