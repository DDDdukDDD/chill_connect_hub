/**
 * The numbers behind the social features, in one file the browser can read too: the code uses them, and the admin page
 * "วิธีคิดของระบบ" (components/admin/SystemLogicView.tsx) shows them, so the two can never say different things.
 */

/** Circles: how far back the row looks, and how many circles it shows */
export const ACHIEVEMENTS_WINDOW_DAYS = 14;
export const ACHIEVEMENTS_ROW_MAX = 15;
/** The reader's own Circles (doing, step and finish together): friends must still show on a phone (2026-11-18) */
export const CIRCLES_OWN_MAX = 3;
/**
 * Circles at scale (owner 2026-11-18): the order of friends' Circles. Closeness points per thing done together, each
 * with a cap, read over the last CLOSENESS_WINDOW_DAYS (chats count while both are in the room). lib/social/closeness.ts
 */
export const CLOSENESS_WINDOW_DAYS = 180;
export const CLOSENESS_POINTS = {
  tee: 3, teeMax: 9,
  plan: 3, planMax: 9,
  chat: 2, chatMax: 4,
  comment: 1, commentMax: 4,
  like: 0.5, likeMax: 3,
  mutual: 3,
} as const;
/** Freshness points added to closeness: a Circle from today beats a closer friend's from last week */
export const CIRCLES_FRESH_POINTS = [{ hours: 24, points: 4 }, { hours: 72, points: 2 }, { hours: 168, points: 1 }] as const;
/** 2+ friends on the same challenge become one Circle "เพื่อน N คน" */
export const CIRCLES_GROUP_MIN = 2;
/** A reader following fewer people than this gets suggestion Circles: hot challenges and "หาเพื่อน" (owner 2026-11-18) */
export const CIRCLES_SUGGEST_BELOW = 5;
/** Hot-challenge Circles at most */
export const CIRCLES_HOT_MAX = 2;
/** The friends asked for at most (the first of the follow list when a reader follows more) */
export const CIRCLES_FOLLOWING_MAX = 1000;
/** Circles sent to the browser: the row shows ACHIEVEMENTS_ROW_MAX, "ดูทั้งหมด" opens the rest */
export const CIRCLES_LIST_MAX = 60;
/** "ไปมาแล้ว?": a ตี้ that ended this many days ago or less still asks for its moment */
export const SHARE_ASK_DAYS = 2;

/** Group Circles (round B, owner 2026-11-16): a ตี้ that ended this many days ago or less, with proof of at least this many people, at most this many in the row */
export const GROUP_CIRCLE_WINDOW_DAYS = 3;
export const GROUP_CIRCLE_MIN_PEOPLE = 2;
export const GROUP_CIRCLES_MAX = 2;

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
 * Why someone calls a plan off or leaves it (2026-11-15): optional, one tap, from this fixed list only, so the chat
 * hears a kind reason and nobody types something hurtful. The words follow "ยกเลิกแผน…แล้ว" / "รอบนี้ขอไม่ไปก่อนนะ".
 */
export const PLAN_LEAVE_REASONS = ['ติดธุระกะทันหัน', 'วันนั้นไม่ว่างแล้ว', 'ไม่ค่อยสบาย', 'อากาศไม่เป็นใจ', 'ขอเปลี่ยนไปที่อื่น'] as const;
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

/** Circles numbers (BE-420): days app.circle_events keeps (lib/social/circleStats.ts) */
export const CIRCLE_EVENTS_KEEP_DAYS = 180;

/**
 * "ที่นี่ปิดแล้ว?" on a place page (owner 2026-11-26): when this many different members, each at least
 * NEW_ACCOUNT_DAYS old, say a place has closed, it is hidden at once and waits for staff (lib/social/placeClosedReports.ts).
 * Newer accounts' reports still reach staff, they just do not count toward hiding.
 */
export const PLACE_CLOSED_HIDE_AT = 2;
