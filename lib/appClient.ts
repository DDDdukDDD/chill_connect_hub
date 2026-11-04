'use client';

/**
 * The site as an installed app, in the browser: the service worker, the install prompt and this device's push
 * notifications. The server side of push is lib/social/push.ts.
 */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export type PushStatus =
  | 'unsupported' // this browser cannot, or the site has no keys
  | 'needs-install' // iPhone and iPad: only an app on the home screen can receive notifications
  | 'denied' // the member said no; only the phone's settings can change that
  | 'off'
  | 'on';

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** iPadOS calls itself a Mac, so a Mac with a touch screen counts */
export function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

export function isPhone(): boolean {
  return isIos() || /Android/.test(navigator.userAgent);
}

/** Browsers inside other apps (a link opened from LINE, Facebook, Instagram or TikTok) cannot install anything */
export function isInAppBrowser(): boolean {
  return /\bLine\/|FBAN|FBAV|Instagram|musical_ly|TikTok/i.test(navigator.userAgent);
}

export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => undefined);
}

// ---- Install prompt: Chrome and Edge offer it once, early, so it is kept until the member asks ----

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let installPrompt: InstallPromptEvent | null = null;
const installListeners = new Set<() => void>();
const tellInstallListeners = () => installListeners.forEach((listener) => listener());

export function listenForInstallPrompt(): () => void {
  const offered = (event: Event) => {
    event.preventDefault();
    installPrompt = event as InstallPromptEvent;
    tellInstallListeners();
  };
  const installed = () => {
    installPrompt = null;
    tellInstallListeners();
  };
  window.addEventListener('beforeinstallprompt', offered);
  window.addEventListener('appinstalled', installed);
  return () => {
    window.removeEventListener('beforeinstallprompt', offered);
    window.removeEventListener('appinstalled', installed);
  };
}

export const canPromptInstall = () => Boolean(installPrompt);

export function onInstallPromptChange(listener: () => void): () => void {
  installListeners.add(listener);
  return () => {
    installListeners.delete(listener);
  };
}

export async function promptInstall(): Promise<void> {
  if (!installPrompt) return;
  await installPrompt.prompt();
  await installPrompt.userChoice;
  // A prompt works only once
  installPrompt = null;
  tellInstallListeners();
}

// ---- Push notifications on this device ----

const pushSupported = () => Boolean(PUBLIC_KEY) && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

export async function readPushStatus(): Promise<PushStatus> {
  if (!PUBLIC_KEY) return 'unsupported';
  if (!pushSupported()) return isIos() && !isStandalone() ? 'needs-install' : 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  return (await currentSubscription()) ? 'on' : 'off';
}

function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const raw = atob(base64.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(base64.length / 4) * 4, '='));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

const saveOnServer = (subscription: PushSubscription) =>
  fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription) });

/** Asks the phone's permission, so call it only from the member's own tap. Resolves with what happened. */
export async function turnPushOn(): Promise<PushStatus> {
  // First, while the tap still counts: Safari refuses to ask later
  const permission = await Notification.requestPermission();
  if (permission === 'denied') return 'denied';
  if (permission !== 'granted') return 'off';
  await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY!) });
  const res = await saveOnServer(subscription);
  if (!res.ok) {
    await subscription.unsubscribe();
    throw new Error('push not saved');
  }
  return 'on';
}

/** This device stops receiving notifications: used by the switch and on signing out, so the next person on it gets none */
export async function turnPushOff(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const subscription = await currentSubscription();
  if (!subscription) return;
  await fetch('/api/push', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
  await subscription.unsubscribe();
}

/** Tells the server this device belongs to the member now signed in; also picks up an address the browser has changed */
export async function syncPushDevice(): Promise<void> {
  if (!pushSupported()) return;
  const subscription = await currentSubscription();
  if (subscription) await saveOnServer(subscription);
}
