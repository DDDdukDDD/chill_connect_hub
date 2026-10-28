'use client';

import { useEffect } from 'react';

/**
 * Keeps a list page's filters in its address, so going back, reloading or sharing the link opens the same list.
 * Empty values and 'all' are left out. Replaces the entry rather than adding one, so Back still leaves the page.
 */
export function useFiltersInUrl(filters: Record<string, string | null | undefined>) {
  const key = JSON.stringify(filters);
  useEffect(() => {
    const url = new URL(window.location.href);
    for (const [name, value] of Object.entries(filters)) {
      if (value && value !== 'all') url.searchParams.set(name, value);
      else url.searchParams.delete(name);
    }
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url.href);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
