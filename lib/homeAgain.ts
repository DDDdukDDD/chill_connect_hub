import type { MouseEvent } from 'react';

/** Fired when someone taps หน้าหลัก while already on Home: the feed goes back to the top and refreshes (BE-425) */
export const HOME_AGAIN_EVENT = 'chillwaa:home-again';

/** onClick for every link to "/": on Home it scrolls up and asks the feed to refresh instead of doing nothing */
export function onHomeLinkClick(event: MouseEvent<HTMLAnchorElement>) {
  if (window.location.pathname !== '/' || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  window.dispatchEvent(new Event(HOME_AGAIN_EVENT));
}

/** Fired by the phone bar's ＋ while on Home: the feed opens its posting form in place (owner 2026-11-26) */
export const COMPOSE_EVENT = 'chillwaa:compose';

/** The ＋ link's address from any other page: Home opens the posting form for ?share=new */
export const COMPOSE_HREF = '/?share=new';

/** onClick for the ＋ link: on Home it opens the form without a page change */
export function onComposeLinkClick(event: MouseEvent<HTMLAnchorElement>) {
  if (window.location.pathname !== '/' || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
  event.preventDefault();
  window.dispatchEvent(new Event(COMPOSE_EVENT));
}

/**
 * A post made with ＋ away from Home (owner 2026-11-26, like IG): the form opens over that page, "โพสต์" takes the member
 * to Home, and the post joins the top of the feed when its upload finishes. Kept here too, in case the upload ends
 * before Home is on screen; Home takes it once.
 */
export const MOMENT_POSTED_EVENT = 'chillwaa:moment-posted';
export interface PostedHandoff {
  moment: { id: string } & Record<string, unknown>;
  counted: unknown;
}
let pendingPosted: PostedHandoff | null = null;
export function announcePosted(posted: PostedHandoff) {
  pendingPosted = posted;
  window.dispatchEvent(new Event(MOMENT_POSTED_EVENT));
}
export function takePosted(): PostedHandoff | null {
  const posted = pendingPosted;
  pendingPosted = null;
  return posted;
}

/** Home's last mode on this device (MemberLiveHome); ＋ away from Home sets it to สำหรับคุณ so the new post shows */
export const HOME_MODE_KEY = 'chillwaa:home-mode';
