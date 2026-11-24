/** Rules of the weekly อีเวนต์ import, shared by the job (lib/weeklyEventScrape.ts) and the admin logic page */

/** A second weekly run inside this many days (a manual workflow run, a retry) does nothing */
export const WEEKLY_SCRAPE_GAP_DAYS = 6;
