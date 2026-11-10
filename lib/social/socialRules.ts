/**
 * The numbers behind the social features, in one file the browser can read too: the code uses them, and the admin page
 * "วิธีคิดของระบบ" (components/admin/SystemLogicView.tsx) shows them, so the two can never say different things.
 */

/** "เพื่อนๆ กำลังออกไปใช้ชีวิต": how far back the row looks, and how many circles it shows */
export const ACHIEVEMENTS_WINDOW_DAYS = 14;
export const ACHIEVEMENTS_ROW_MAX = 15;

/** "ไปกันไหม": friends one send can invite, and sends per member per hour */
export const INVITE_MAX_FRIENDS = 10;
export const INVITE_SENDS_PER_HOUR = 30;

/** "เพื่อนจะไปตี้นี้": at most this many friends hear that someone joined a ตี้ */
export const FRIENDS_GOING_MAX = 30;

/** Home feed: posts per page, and how far before the end the next page starts loading (about three posts) */
export const HOME_FEED_LOAD_AHEAD_PX = 1800;
