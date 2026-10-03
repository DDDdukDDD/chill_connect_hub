import { db } from '@/lib/db';
import { EventDataSource, getAllDataSources, recordSourceScrape } from '@/lib/sourcesStore';
import { LifestyleSpotItem } from '@/data/spotsData';
import { scrapeSpotSource, SourceScrapeResult } from '@/lib/structuredDataScraper';

export interface SpotScrapeSummary {
  newCount: number;
  duplicateCount: number;
  totalScanned: number;
  spots: LifestyleSpotItem[];
  sourceResults: Array<{
    sourceId: string;
    sourceName: string;
    scanned: number;
    imported: number;
    duplicates: number;
    error?: string;
  }>;
}

function normalizePlace(value: string): string {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

async function getAllSpots(): Promise<LifestyleSpotItem[]> {
  const firstPage = await db.findSpots({ page: 1, limit: 100, includeDrafts: true });
  const spots = [...firstPage.items];
  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const result = await db.findSpots({ page, limit: 100, includeDrafts: true });
    spots.push(...result.items);
  }
  return spots;
}

function selectSources(sources: EventDataSource[], targetSource?: string): EventDataSource[] {
  const sourceFilter = targetSource?.trim().toLocaleLowerCase();
  return sources.filter((source) =>
    source.targetType === 'spots' &&
    source.status === 'active' &&
    (!sourceFilter || source.id.toLocaleLowerCase() === sourceFilter || source.name.toLocaleLowerCase().includes(sourceFilter))
  );
}

async function scrapeSource(source: EventDataSource): Promise<SourceScrapeResult<LifestyleSpotItem>> {
  return scrapeSpotSource({
    id: source.id,
    name: source.name,
    url: source.url,
    targetType: 'spots',
  });
}

export async function runSpotScraper(targetSource?: string): Promise<SpotScrapeSummary> {
  const sources = selectSources(await getAllDataSources(), targetSource);
  if (targetSource && sources.length === 0) throw new Error(`No active Spot source matches "${targetSource}"`);
  if (sources.length === 0) throw new Error('No active Spot sources are configured');

  const sourceResults: SourceScrapeResult<LifestyleSpotItem>[] = [];
  for (let index = 0; index < sources.length; index += 2) {
    const batch = sources.slice(index, index + 2);
    sourceResults.push(...await Promise.all(batch.map(scrapeSource)));
  }

  const existingSpots = await getAllSpots();
  const knownIds = new Set(existingSpots.map((spot) => spot.id));
  const knownSourceUrls = new Set(existingSpots.map((spot) => spot.sourceUrl).filter(Boolean));
  const knownPlaces = new Set(existingSpots.map((spot) => `${normalizePlace(spot.title)}|${normalizePlace(spot.province)}`));
  const importedBySource = new Map<string, number>();
  const duplicatesBySource = new Map<string, number>();
  const importedSpots: LifestyleSpotItem[] = [];

  for (const sourceResult of sourceResults) {
    for (const spot of sourceResult.items) {
      const normalizedPlace = `${normalizePlace(spot.title)}|${normalizePlace(spot.province)}`;
      if (knownIds.has(spot.id) || (spot.sourceUrl && knownSourceUrls.has(spot.sourceUrl)) || knownPlaces.has(normalizedPlace)) {
        duplicatesBySource.set(sourceResult.sourceId, (duplicatesBySource.get(sourceResult.sourceId) || 0) + 1);
        continue;
      }

      const saved = await db.createSpot({ ...spot, publicationStatus: 'draft' });
      importedSpots.push(saved);
      knownIds.add(saved.id);
      if (saved.sourceUrl) knownSourceUrls.add(saved.sourceUrl);
      knownPlaces.add(normalizedPlace);
      importedBySource.set(sourceResult.sourceId, (importedBySource.get(sourceResult.sourceId) || 0) + 1);
    }
  }

  await Promise.all(sourceResults.map((result) => recordSourceScrape(result.sourceId, {
    targetType: 'spots',
    scannedCount: result.scannedCount,
    importedCount: importedBySource.get(result.sourceId) || 0,
    duplicateCount: duplicatesBySource.get(result.sourceId) || 0,
    errors: result.error ? [result.error] : [],
  })));

  return {
    newCount: importedSpots.length,
    duplicateCount: sourceResults.reduce((total, result) => total + (duplicatesBySource.get(result.sourceId) || 0), 0),
    totalScanned: sourceResults.reduce((total, result) => total + result.scannedCount, 0),
    spots: importedSpots,
    sourceResults: sourceResults.map((result) => ({
      sourceId: result.sourceId,
      sourceName: result.sourceName,
      scanned: result.scannedCount,
      imported: importedBySource.get(result.sourceId) || 0,
      duplicates: duplicatesBySource.get(result.sourceId) || 0,
      error: result.error,
    })),
  };
}
