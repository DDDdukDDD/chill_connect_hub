/**
 * Where a record came from, which decides how much a page may add around it.
 * - `member`: a member created it. Pages show only what that member entered.
 * - `source`: staff imported it from an official venue or organizer website. Pages show what the source gave
 *   and credit it; nobody from the organizer posted it here.
 * - `sample`: seed data for development. Pages may fill gaps with placeholder photos and text so layouts can be
 *   judged. Since 2026-11-24 (sample data removed before launch) only a ตี้ hosted by a sample account is `sample`;
 *   anything else without a member behind it was made by staff or imported, so it counts as `source` and pages show
 *   only what was entered, never made-up transit, parking or photos.
 */
export type ContentOrigin = 'member' | 'source' | 'sample';

const SAMPLE_MEMBER_PREFIX = 'mem_sample_';

export function eventOrigin(event: { createdByMemberId?: string; source?: string; sourceUrl?: string }): ContentOrigin {
  if (event.createdByMemberId) return event.createdByMemberId.startsWith(SAMPLE_MEMBER_PREFIX) ? 'sample' : 'member';
  return 'source';
}

export function spotOrigin(spot: { suggestedByMemberId?: string; sourceUrl?: string }): ContentOrigin {
  return spot.suggestedByMemberId ? 'member' : 'source';
}
