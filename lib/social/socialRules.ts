/**
 * The numbers behind the social features, in one file the browser can read too: the code uses them, and the admin page
 * "วิธีคิดของระบบ" (components/admin/SystemLogicView.tsx) shows them, so the two can never say different things.
 */

/** "เพื่อนๆ กำลังออกไปใช้ชีวิต": how far back the row looks, and how many circles it shows */
export const ACHIEVEMENTS_WINDOW_DAYS = 14;
export const ACHIEVEMENTS_ROW_MAX = 15;

/** "ชวนไป": friends one plan can hold besides the host (owner 2026-11-11: up to 15), and sends per member per hour */
export const INVITE_MAX_FRIENDS = 15;
export const INVITE_SENDS_PER_HOUR = 30;

/** "เพื่อนจะไปตี้นี้": at most this many friends hear that someone joined a ตี้ */
export const FRIENDS_GOING_MAX = 30;

/** Home feed: posts per page, and how far before the end the next page starts loading (about three posts) */
export const HOME_FEED_LOAD_AHEAD_PX = 1800;

/** "ไปกับเพื่อน" (owner 2026-11-10): XP each person earns when both went to a "ไปกัน" plan's place (lib/social/friendPlans.ts) */
export const PLAN_TOGETHER_POINTS = 40;

/** A plan made from a post that names no place is called this (lib/social/friendPlans.ts) */
export const POST_PLACE_FALLBACK = 'ที่ในโพสต์นี้';
/**
 * A plan's chat title, the same in the chat list, the chat's header and the phone notification: "ไป<place>" or
 * "ทำชาเลนจ์ <name>". A post with no place would read "ไปที่ในโพสต์นี้" in every such room, so that one is named
 * after the other people going, as the reader sees them (owner 2026-11-13): "ไปกับ ต้น, มิว และอีก 2 คน".
 * "แผนไปกัน" only while nobody else is in it. `others`: the names of everyone going but the reader.
 */
export const planChatTitle = (plan: { isQuest: boolean; title: string; others?: string[] }) => {
  if (plan.isQuest) return `ทำชาเลนจ์ ${plan.title}`;
  if (plan.title !== POST_PLACE_FALLBACK) return `ไป${plan.title}`;
  const others = plan.others ?? [];
  if (others.length === 0) return 'แผนไปกัน';
  const named = others.slice(0, 2).join(', ');
  return others.length > 2 ? `ไปกับ ${named} และอีก ${others.length - 2} คน` : `ไปกับ ${named}`;
};

/** Whether a plan's chat title depends on who reads it (planChatTitle's `others`) */
export const planTitleNamesPeople = (plan: { isQuest: boolean; title: string }) => !plan.isQuest && plan.title === POST_PLACE_FALLBACK;
