import { timingSafeEqual } from 'node:crypto';

/** Cron routes accept only `Authorization: Bearer <CRON_SECRET>` (GitHub Actions schedules and Vercel Cron send it) */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const provided = Buffer.from(request.headers.get('authorization') ?? '');
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}
