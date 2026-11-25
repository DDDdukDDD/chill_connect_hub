import { bitecAdapter } from './bitec';
import { impactAdapter } from './impact';
import { qsnccAdapter } from './qsncc';
import { thaiRunAdapter } from './thairun';
import { thaiTicketMajorAdapter } from './thaiTicketMajor';
import { ticketmelonAdapter } from './ticketmelon';
import type { SiteEventAdapter } from './types';
import { visitBangkokAdapter } from './visitBangkok';
import { baccAdapter } from './bacc';
import { riverCityAdapter } from './riverCity';

/** Site-specific readers, tried before the generic JSON-LD reader. Matched on the configured source URL. */
const SITE_EVENT_ADAPTERS: SiteEventAdapter[] = [
  qsnccAdapter, impactAdapter, bitecAdapter, thaiRunAdapter, visitBangkokAdapter, thaiTicketMajorAdapter, ticketmelonAdapter,
  // Art for Gen Z and Y (owner 2026-11-26)
  baccAdapter, riverCityAdapter,
];

export function findSiteEventAdapter(sourceUrl: string): SiteEventAdapter | undefined {
  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    return undefined;
  }
  return SITE_EVENT_ADAPTERS.find((adapter) => adapter.matches(url));
}
