/**
 * Notes which feed posts a signed-in member really looked at (on screen for over a second) and sends them in batches
 * to POST /api/moments/seen: every 20 posts, when the tab is hidden or closed, and when the feed leaves the page.
 * Never one request per post (docs/FEED_PLAN.md: the database must not be written on every view). Browser only.
 */

export const SEEN_BATCH = 20;
export const SEEN_LOOK_MS = 1000;

const queue = new Set<string>();
/** Sent already on this page load: scrolling back up does not send them again */
const sent = new Set<string>();
const timers = new Map<Element, ReturnType<typeof setTimeout>>();
let observer: IntersectionObserver | null = null;
let listening = false;

export function flushSeen() {
  if (queue.size === 0) return;
  const ids = [...queue];
  queue.clear();
  ids.forEach((id) => sent.add(id));
  // keepalive lets the request finish while the page closes
  fetch('/api/moments/seen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }), keepalive: true }).catch(() => {});
}

function note(id: string) {
  if (sent.has(id)) return;
  queue.add(id);
  if (queue.size >= SEEN_BATCH) flushSeen();
}

// Half the post on screen, or half the screen filled by a post taller than it
const isLooking = (entry: IntersectionObserverEntry) => entry.isIntersecting && (entry.intersectionRatio >= 0.5 || entry.intersectionRect.height >= window.innerHeight * 0.5);

function watcher() {
  if (!listening) {
    listening = true;
    document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flushSeen());
    window.addEventListener('pagehide', flushSeen);
  }
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.seenId;
        if (!id) continue;
        if (isLooking(entry)) {
          if (!timers.has(entry.target)) timers.set(entry.target, setTimeout(() => (timers.delete(entry.target), note(id)), SEEN_LOOK_MS));
        } else {
          clearTimeout(timers.get(entry.target));
          timers.delete(entry.target);
        }
      }
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] }
  );
  return observer;
}

/** Starts watching one post element (it needs data-seen-id); the returned function stops */
export function watchSeen(element: HTMLElement): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => {};
  const watching = watcher();
  watching.observe(element);
  return () => {
    watching.unobserve(element);
    clearTimeout(timers.get(element));
    timers.delete(element);
  };
}
