import { db } from '@/lib/db';
import { memberRepository, type Member } from '@/lib/members';
import { tidyDisplayName } from '@/lib/displayName';
import { weekContent } from '@/lib/thisWeek';

/**
 * "เพื่อนๆ จะไปกัน" on สัปดาห์นี้ (owner 2026-11-19), for a signed-in member only, over the same 7 days: ตี้ that people
 * the member follows joined or host. Who is going is open on every ตี้ page (owner 2026-10-16), so this shows nothing
 * new; people the member blocked are left out. The member's own "ไปกัน" plans were listed here too until BE-449 (owner
 * 2026-11-21): สัปดาห์นี้ is what is on, My Hub is what the member is doing, and the plans live there.
 */

export interface WeekFriendItem {
  kind: 'tee';
  id: string;
  title: string;
  href: string;
  /** "วันนี้ 19:00", "เสาร์ 21" */
  when: string;
  people: { id: string; name: string; avatar?: string }[];
  /** How many more friends than `people` shows */
  more: number;
}

const FACES = 2;
const MAX_ITEMS = 6;
const shortName = (name: string) => (tidyDisplayName(name).trim() || name).replace(/\s*\(.*$/, '');
/** "14:00 - 16:30 น." reads as "14:00" */
const startOf = (time?: string) => (time ? time.split(/\s*[-–]\s*/)[0].replace(/\s*น\.?$/, '') : '');

export async function weekFriends(member: Member, now = new Date()): Promise<WeekFriendItem[]> {
  const { days, byDay } = await weekContent(now);
  const following = new Set(member.followingIds ?? []);
  const blocked = new Set(member.blockedIds ?? []);
  const items: WeekFriendItem[] = [];

  const tees = days.flatMap((day) => byDay[day.iso].filter((item) => item.kind === 'tee').map((item) => ({ day, event: item.event })));
  if (following.size > 0 && tees.length > 0) {
    const byEvent = await db.listParticipantsByEvent(tees.map((tee) => tee.event.id));
    const friendIdsOf = new Map<string, string[]>();
    for (const { event } of tees) {
      const host = (event as { createdByMemberId?: string }).createdByMemberId;
      const ids = [...new Set([...(host ? [host] : []), ...(byEvent.get(event.id) ?? []).map((r) => r.userId)])].filter(
        (id) => id !== member.id && following.has(id) && !blocked.has(id)
      );
      if (ids.length) friendIdsOf.set(event.id, ids);
    }
    const people = await memberRepository.findByIds([...new Set([...friendIdsOf.values()].flat())]);
    for (const { day, event } of tees) {
      const ids = (friendIdsOf.get(event.id) ?? []).filter((id) => people.get(id)?.status === 'active');
      if (!ids.length) continue;
      const time = startOf(event.time);
      items.push({
        kind: 'tee',
        id: event.id,
        title: event.title,
        href: `/community/${encodeURIComponent(event.id)}`,
        when: time ? `${day.name} ${time}` : day.name,
        people: ids.slice(0, FACES).map((id) => ({ id, name: shortName(people.get(id)!.displayName), avatar: people.get(id)!.avatarUrl })),
        more: Math.max(0, ids.length - FACES),
      });
    }
  }

  return items.slice(0, MAX_ITEMS);
}
