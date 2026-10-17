'use client';

import { useEffect, useState } from 'react';
import type { DiscoverCounts } from '@/lib/discoverMatch';

/**
 * The numbers on the ค้นพบ tabs for the current search word and province. The server page sends them for the
 * address it was opened with; after that they follow what the member types (GET /api/discover/counts, after a short pause).
 */
export function useDiscoverCounts(initial: { query: string; province: string; counts: DiscoverCounts } | undefined, query: string, province: string) {
  const [counts, setCounts] = useState<DiscoverCounts | null>(initial?.counts ?? null);

  useEffect(() => {
    if (initial && initial.query === query.trim() && initial.province === province) {
      setCounts(initial.counts);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ q: query.trim(), province });
      fetch(`/api/discover/counts?${params}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (active && data?.counts) setCounts(data.counts as DiscoverCounts);
        })
        .catch(() => undefined);
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [initial, query, province]);

  return counts;
}
