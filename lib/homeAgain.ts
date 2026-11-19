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
