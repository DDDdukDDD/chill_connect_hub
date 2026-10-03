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
  const items: T[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const separator = endpoint.includes('?') ? '&' : '?';
    const response = await fetch(`${endpoint}${separator}page=${page}&limit=100`);
    if (!response.ok) {
      throw new Error(`Content request failed with status ${response.status}`);
    }

    const result = (await response.json()) as ContentPage<T>;
    const pageItems = result[collection];
    if (!result.success || !Array.isArray(pageItems)) {
      throw new Error(`Invalid ${collection} response`);
    }

    items.push(...pageItems);
    totalPages = Math.max(1, result.pagination?.totalPages || 1);
    page += 1;
  } while (page <= totalPages);

  return items;
}