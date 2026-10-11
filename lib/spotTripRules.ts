/**
 * Spot Buddy trip rules shared by the form and the server (no server-only imports here).
 * The server in lib/social/spotTrips.ts is what enforces them.
 */
export const SPOT_TRIP_MIN_PEOPLE = 3;
export const SPOT_TRIP_MAX_PEOPLE = 15;
export const SPOT_TRIP_EARLIEST = '06:00';
export const SPOT_TRIP_LATEST = '19:00';
export const MAX_OPEN_SPOT_TRIPS = 2;
export const SPOT_TRIP_TRANSPORT = 'เจอกันที่สถานที่ (ต่างคนต่างเดินทาง)';
/** Where at the place people meet: a fixed list, so a trip cannot point somewhere else */
export const SPOT_TRIP_MEETING_POINTS = ['ทางเข้าหลัก', 'จุดประชาสัมพันธ์', 'หน้าร้าน'] as const;

/** A trip counts as confirmed once enough people are in (host included) */
export function isTripConfirmed(event: { participantsCount?: number; minParticipants?: number }): boolean {
  return (event.participantsCount ?? 0) >= (event.minParticipants ?? 0);
}
