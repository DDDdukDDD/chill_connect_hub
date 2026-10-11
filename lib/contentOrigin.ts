/**
 * Where a record came from, which decides how much a page may add around it.
 * - `member`: a member created it. Pages show only what that member entered.
 * - `source`: staff imported it from an official venue or organizer website. Pages show what the source gave
 *   and credit it; nobody from the organizer posted it here.
 * - `sample`: seed data for development. Pages may fill gaps with placeholder photos and text so layouts can be
 *   judged. Remove the seed data before launch (docs/LAUNCH_CHECKLIST.md) and this filler goes with it.
 */
export type ContentOrigin = 'member' | 'source' | 'sample';

const SAMPLE_MEMBER_PREFIX = 'mem_sample_';
/** `source` value of the seed events that were written for the prototype */
const SEED_SOURCE = 'Chill & Connect Official';

export function eventOrigin(event: { createdByMemberId?: string; source?: string; sourceUrl?: string }): ContentOrigin {
  if (event.createdByMemberId) return event.createdByMemberId.startsWith(SAMPLE_MEMBER_PREFIX) ? 'sample' : 'member';
  if (event.sourceUrl && event.source && event.source !== SEED_SOURCE) return 'source';
  return 'sample';
}

export function spotOrigin(spot: { suggestedByMemberId?: string; sourceUrl?: string }): ContentOrigin {
  if (spot.suggestedByMemberId) return 'member';
  if (spot.sourceUrl) return 'source';
  return 'sample';
}
