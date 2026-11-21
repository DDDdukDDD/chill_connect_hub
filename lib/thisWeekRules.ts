/** Sizes of the สัปดาห์นี้ page (lib/thisWeek.ts on the server, app/this-week/ThisWeekView.tsx in the browser) */
export const WEEK_DAYS = 7;
export const WEEK_QUESTS = 6;
export const WEEK_PLACES = 6;
/**
 * A thin week (BE-450, owner 2026-11-21): fewer than this many things in the 7 days, or this many empty days or more.
 * The page then shows one row for the week, "เร็วๆ นี้" up to LATER_DAYS ahead, places and challenges first, and
 * nearby provinces, instead of a schedule of mostly empty days.
 */
export const THIN_WEEK_ITEMS = 6;
export const THIN_WEEK_EMPTY_DAYS = 4;
/** How far "เร็วๆ นี้" looks, counted from today */
export const LATER_DAYS = 30;
/** How many things "เร็วๆ นี้" and "ใกล้ๆ" show */
export const LATER_SHOWN = 12;
