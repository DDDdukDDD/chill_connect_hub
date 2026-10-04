/**
 * Content-sourcing policy for the scraper.
 *
 * Community meetups (`eventType: 'community'`) are created by our own members. Importing events
 * from peer-to-peer meetup platforms, or from aggregators that re-list them, would copy another
 * platform's community content, so these hosts can never be added as sources or imported from.
 * Official venues, organizers and ticketing pages for public events are fine.
 */
const BLOCKED_SOURCE_HOSTS: Array<{ host: string; platform: string }> = [
  { host: 'meetup.com', platform: 'Meetup' },
  { host: 'meetu.ps', platform: 'Meetup' },
  { host: 'facebook.com', platform: 'Facebook' },
  { host: 'fb.com', platform: 'Facebook' },
  { host: 'fb.me', platform: 'Facebook' },
  { host: 'allevents.in', platform: 'AllEvents (re-lists Meetup and Facebook events)' },
  { host: 'dev.events', platform: 'dev.events (re-lists Meetup groups)' },
];

/** Returns a Thai explanation when the URL belongs to a blocked platform, otherwise null. */
export function getBlockedSourceReason(value: string | URL | undefined): string | null {
  if (!value) return null;
  let hostname: string;
  try {
    hostname = (typeof value === 'string' ? new URL(value) : value).hostname.toLowerCase();
  } catch {
    return null;
  }
  const blocked = BLOCKED_SOURCE_HOSTS.find(({ host }) => hostname === host || hostname.endsWith(`.${host}`));
  return blocked
    ? `ไม่รองรับการดึงข้อมูลจาก ${blocked.platform}: กิจกรรมคอมมูนิตี้ต้องสร้างโดยสมาชิกของเราเอง ไม่คัดลอกจากแพลตฟอร์มอื่น`
    : null;
}
