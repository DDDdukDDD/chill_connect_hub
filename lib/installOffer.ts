'use client';

/**
 * When to suggest adding Chillwaa to the home screen (owner 2026-11-17): right after sign-up, after joining a ตี้, and
 * after saying "ไปกัน" to a friend's invite, because then a notice has a reason to arrive. The sheet itself is
 * components/InstallSheet.tsx (mounted once in AppSetup).
 *
 * Rules: phones only, never when already opened from the home screen, and after the sheet is closed it stays quiet for
 * OFFER_QUIET_DAYS. The wish is kept in sessionStorage so it survives the page change that follows sign-up.
 */

export type InstallMoment = 'signup' | 'join' | 'invite';

export const OFFER_QUIET_DAYS = 14;
const PENDING_KEY = 'cch_install_offer';
const SHOWN_KEY = 'cch_install_offer_at';
export const INSTALL_OFFER_EVENT = 'chillwaa:install-offer';

export function offerInstall(moment: InstallMoment): void {
  try {
    sessionStorage.setItem(PENDING_KEY, moment);
  } catch {
    /* storage unavailable: the event below still works on this page */
  }
  window.dispatchEvent(new CustomEvent(INSTALL_OFFER_EVENT, { detail: moment }));
}

export function pendingInstallMoment(): InstallMoment | null {
  try {
    const value = sessionStorage.getItem(PENDING_KEY);
    return value === 'signup' || value === 'join' || value === 'invite' ? value : null;
  } catch {
    return null;
  }
}

export function clearPendingInstall(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* nothing to clear */
  }
}

export function isOfferQuiet(): boolean {
  try {
    const at = Number(localStorage.getItem(SHOWN_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < OFFER_QUIET_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

export function markOfferShown(): void {
  try {
    localStorage.setItem(SHOWN_KEY, String(Date.now()));
  } catch {
    /* without storage it may ask again next visit */
  }
}
