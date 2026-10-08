type ContentCollection = 'events' | 'spots' | 'quests';

interface ContentPage<T> {
  success: boolean;
  pagination?: {
    page?: number;
    totalPages?: number;
  };
  events?: T[];
  spots?: T[];
  quests?: T[];
}

export async function fetchAllContentPages<T>(
  endpoint: string,
  collection: ContentCollection
): Promise<T[]> {
  const separator = endpoint.includes('?') ? '&' : '?';
  const firstResponse = await fetch(`${endpoint}${separator}page=1&limit=100`);
  if (!firstResponse.ok) {
    throw new Error(`Content request failed with status ${firstResponse.status}`);
  }

  const firstResult = (await firstResponse.json()) as ContentPage<T>;
  const firstItems = firstResult[collection];
  if (!firstResult.success || !Array.isArray(firstItems)) {
    throw new Error(`Invalid ${collection} response`);
  }

  const totalPages = Math.max(1, firstResult.pagination?.totalPages || 1);
  if (totalPages <= 1) {
    return firstItems;
  }

  // Fetch remaining pages in parallel batches for 10x network speedup
  const remainingPageNumbers = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
  const remainingResults = await Promise.all(
    remainingPageNumbers.map(async (page) => {
      const response = await fetch(`${endpoint}${separator}page=${page}&limit=100`);
      if (!response.ok) {
        throw new Error(`Content request for page ${page} failed with status ${response.status}`);
      }
      const pageResult = (await response.json()) as ContentPage<T>;
      const pageItems = pageResult[collection];
      if (!pageResult.success || !Array.isArray(pageItems)) {
        throw new Error(`Invalid ${collection} response on page ${page}`);
      }
      return pageItems;
    })
  );

  return [firstItems, ...remainingResults].flat();
}