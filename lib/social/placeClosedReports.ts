import { db } from '../db';
import { memberRepository } from '../members';
import { NEW_ACCOUNT_DAYS, accountAgeDays } from '../members/trust';
import type { Member } from '../members/types';
import { PLACE_CLOSED_HIDE_AT } from './socialRules';

/**
 * "ที่นี่ปิดแล้ว?" (owner 2026-11-26): members tell us a place has closed, instead of staff checking every imported
 * place by hand. Each tap is an ordinary content report (reason `place_closed`, so staff see it in the reports queue);
 * when PLACE_CLOSED_HIDE_AT different members, each at least NEW_ACCOUNT_DAYS old, have said so, the place goes back
 * to draft at once and stays hidden until staff publish it again. Newer accounts still reach staff but do not count,
 * so a few fresh accounts cannot hide a rival's shop.
 */
export const PLACE_CLOSED_REASON = 'place_closed';

/** Counts toward hiding: an account old enough */
const counts = (member: Member | undefined) => Boolean(member && member.status === 'active' && accountAgeDays(member) >= NEW_ACCOUNT_DAYS);

/**
 * Called just before the report is stored. `earlierReporterIds`: members with an open `place_closed` report on this
 * place already. Hides the place when this report makes enough, and says so, so the stored report tells staff.
 */
export async function hideIfClosedEnough(placeId: string, reporter: Member, earlierReporterIds: string[]): Promise<boolean> {
  const others = [...new Set(earlierReporterIds.filter((id) => id !== reporter.id))];
  const people = await memberRepository.findByIds(others);
  const qualified = others.filter((id) => counts(people.get(id))).length + (counts(reporter) ? 1 : 0);
  if (qualified < PLACE_CLOSED_HIDE_AT) return false;
  const spot = await db.findSpotById(placeId);
  if (!spot || spot.publicationStatus === 'draft') return false;
  await db.updateSpot(placeId, { publicationStatus: 'draft', closedReportedAt: new Date().toISOString() });
  return true;
}
