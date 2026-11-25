import { revalidatePath } from 'next/cache';

/**
 * Public detail pages (/spots, /events, /community, /challenges [id]) are cached on the CDN and rebuilt after their
 * `revalidate` time (BE-472), so a guest or a bot reading them does not reach the database each time.
 * Call this after a write the people on a ตี้/อีเวนต์ page should see at once (join, host edit); the page is rebuilt
 * on its next visit. Never throws: outside a request (scripts) it does nothing.
 */
export function refreshEventPage(eventId: string): void {
  if (!eventId) return;
  const id = encodeURIComponent(eventId);
  try {
    revalidatePath(`/community/${id}`);
    revalidatePath(`/events/${id}`);
  } catch {
    // Not inside a Next request (a script or a test): the time-based revalidate still applies
  }
}
