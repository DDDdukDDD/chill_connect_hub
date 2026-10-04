import { bitecAdapter } from './bitec';
import { impactAdapter } from './impact';
import { qsnccAdapter } from './qsncc';
import { thaiRunAdapter } from './thairun';
import type { SiteEventAdapter } from './types';
import { visitBangkokAdapter } from './visitBangkok';

/** Site-specific readers, tried before the generic JSON-LD reader. Matched on the configured source URL. */
const SITE_EVENT_ADAPTERS: SiteEventAdapter[] = [qsnccAdapter, impactAdapter, bitecAdapter, thaiRunAdapter, visitBangkokAdapter];

export function findSiteEventAdapter(sourceUrl: string): SiteEventAdapter | undefined {
  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    return undefined;
  }
  return SITE_EVENT_ADAPTERS.find((adapter) => adapter.matches(url));
}
