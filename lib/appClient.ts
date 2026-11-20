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

/**
 * How this device can add Chillwaa to its home screen: the browser's own prompt, the iPhone share steps, another app's
 * browser (open in Safari or Chrome first), the browser menu, or nothing to do (already installed, or not a phone and
 * no prompt). Used by the settings card and the install sheet.
 */
export type InstallWay = 'prompt' | 'ios' | 'in-app' | 'menu' | null;

export function installWay(): InstallWay {
  if (isStandalone() || isStoreApp()) return null;
  if (isInAppBrowser()) return 'in-app';
  if (isIos()) return 'ios';
  if (canPromptInstall()) return 'prompt';
  return isPhone() ? 'menu' : null;
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

// ---- Push notifications in the iPhone store app (BE-428) ----
// The app's web view has no web push; Capacitor's PushNotifications plugin gives an APNs device token instead, which
// the server keeps as the endpoint `apns:<token>` (lib/social/apns.ts). The token is remembered on the device so the
// switch can tell "on" from "allowed but switched off", and so it can be removed on sign-out.

type PushPermission = 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied';
type NativePushPlugin = {
  checkPermissions(): Promise<{ receive: PushPermission }>;
  requestPermissions(): Promise<{ receive: PushPermission }>;
  register(): Promise<void>;
  unregister(): Promise<void>;
  addListener(event: 'registration', listener: (token: { value: string }) => void): Promise<{ remove(): Promise<void> }>;
  addListener(event: 'registrationError', listener: (error: unknown) => void): Promise<{ remove(): Promise<void> }>;
  addListener(event: 'pushNotificationActionPerformed', listener: (action: { notification: { data?: Record<string, unknown> } }) => void): Promise<{ remove(): Promise<void> }>;
};
type CapacitorGlobal = { isNativePlatform?: () => boolean; isPluginAvailable?: (name: string) => boolean; Plugins?: Record<string, unknown>; registerPlugin?: (name: string) => unknown };

/**
 * A native plugin of the store app, as lib/nativeAuth.ts finds WebAuth. The site does not bundle @capacitor/core, so
 * `Capacitor.Plugins` is empty in its pages: `registerPlugin` (from the app's injected bridge) makes the proxy.
 * Reading `Plugins` alone found nothing, so push fell back to web push and failed (owner, build 16, 2026-11-19).
 */
function capPlugin<T>(name: string): T | null {
  if (typeof window === 'undefined') return null;
  const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  if (!cap?.isNativePlatform?.() || !cap.isPluginAvailable?.(name)) return null;
  return ((cap.Plugins?.[name] as T | undefined) ?? (cap.registerPlugin?.(name) as T | undefined)) || null;
}

const nativePush = () => capPlugin<NativePushPlugin>('PushNotifications');

/** Inside the store app: no install sheet or "add to home screen", it already is an app */
export const isStoreApp = () => {
  if (typeof window === 'undefined') return false;
  return Boolean((window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor?.isNativePlatform?.());
};

const APNS_TOKEN_KEY = 'chillwaa-apns-token';
const storedApnsToken = (): string | null => {
  try {
    return localStorage.getItem(APNS_TOKEN_KEY);
  } catch {
    return null;
  }
};
const storeApnsToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(APNS_TOKEN_KEY, token);
    else localStorage.removeItem(APNS_TOKEN_KEY);
  } catch {
    // Private storage off: the switch shows "off" next time, and turning it on registers again
  }
};

/** Capacitor reports errors as `{ error: "…" }` or `{ message }`, not always as Error */
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : typeof error === 'object' && error ? String((error as { error?: unknown; message?: unknown }).error ?? (error as { message?: unknown }).message ?? JSON.stringify(error)) : String(error);

/**
 * Asks iOS for this install's device token; resolves with it, or throws when iOS refuses. The listeners are in place
 * before `register()` (Capacitor's order): adding one is async, and a token iOS hands over before that is lost.
 * Errors start with the step, shown under the switch so a failure can be told apart (BE-432).
 */
async function nativeToken(plugin: NativePushPlugin): Promise<string> {
  let settle: { resolve: (token: string) => void; reject: (error: Error) => void } | null = null;
  const result = new Promise<string>((resolve, reject) => (settle = { resolve, reject }));
  const handles = await Promise.all([
    plugin.addListener('registration', (token) => settle?.resolve(token.value.toLowerCase())),
    plugin.addListener('registrationError', (error) => settle?.reject(new Error(`ios: ${errorText(error)}`))),
  ]);
  const timer = setTimeout(() => settle?.reject(new Error('timeout: iOS gave no device token in 15 s')), 15000);
  try {
    await plugin.register().catch((error: unknown) => {
      throw new Error(`register: ${errorText(error)}`);
    });
    return await result;
  } finally {
    clearTimeout(timer);
    handles.forEach((handle) => void handle.remove());
  }
}

const saveApnsToken = (token: string) => fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apns: token }) });

type NativeSharePlugin = { share(options: { title?: string; text?: string; url?: string }): Promise<unknown> };

/**
 * Inside the store app, `navigator.share` opens the native share sheet (Capacitor Share, BE-428), so the nine places
 * that share keep their code. A closed sheet becomes an AbortError, which every caller already treats as "no".
 */
export function installNativeShareSheet(): void {
  const plugin = capPlugin<NativeSharePlugin>('Share');
  if (!plugin) return;
  const share = async (data: ShareData = {}) => {
    try {
      await plugin.share({ title: data.title, text: data.text, url: data.url });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DOMException(message, /cancel/i.test(message) ? 'AbortError' : 'NotAllowedError');
    }
  };
  try {
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: (data?: ShareData) => Boolean(data && (data.url || data.text || data.title)), configurable: true });
  } catch {
    // A web view that will not let it be replaced keeps its own share
  }
}

/** A tap on a notification opens its page; one sent while the app was closed is handed over once the page listens */
export function listenForNativePushTaps(): void {
  const plugin = nativePush();
  if (!plugin) return;
  void plugin.addListener('pushNotificationActionPerformed', ({ notification }) => {
    const url = notification.data?.url;
    // Only a path on this site: the payload comes from our server, but a link elsewhere has no place here
    if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) window.location.assign(url);
  });
}

// ---- Push notifications on this device ----

const pushSupported = () => Boolean(PUBLIC_KEY) && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

export async function readPushStatus(): Promise<PushStatus> {
  const native = nativePush();
  if (native) {
    const { receive } = await native.checkPermissions();
    if (receive === 'denied') return 'denied';
    return receive === 'granted' && storedApnsToken() ? 'on' : 'off';
  }
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
  const native = nativePush();
  if (native) {
    const { receive } = await native.requestPermissions().catch((error: unknown) => {
      throw new Error(`permission: ${errorText(error)}`);
    });
    if (receive === 'denied') return 'denied';
    if (receive !== 'granted') return 'off';
    const token = await nativeToken(native);
    const res = await saveApnsToken(token);
    if (!res.ok) throw new Error(`save: HTTP ${res.status}`);
    storeApnsToken(token);
    return 'on';
  }
  // No web push here (an app web view without the plugin, an old browser): say so instead of failing
  if (!pushSupported()) return isIos() && !isStandalone() ? 'needs-install' : 'unsupported';
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
  const native = nativePush();
  if (native) {
    const token = storedApnsToken();
    if (!token) return;
    await fetch('/api/push', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: `apns:${token}` }) });
    storeApnsToken(null);
    // The token stays valid with iOS; the server no longer sends to it, and turning on again registers afresh
    return;
  }
  if (!('serviceWorker' in navigator)) return;
  const subscription = await currentSubscription();
  if (!subscription) return;
  await fetch('/api/push', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
  await subscription.unsubscribe();
}

/** Tells the server this device belongs to the member now signed in; also picks up an address the browser has changed */
export async function syncPushDevice(): Promise<void> {
  const native = nativePush();
  if (native) {
    // Switched on before: register again (iOS may hand out a new token) and tell the server whose device it is now
    if (!storedApnsToken() || (await native.checkPermissions()).receive !== 'granted') return;
    const token = await nativeToken(native);
    if ((await saveApnsToken(token)).ok) storeApnsToken(token);
    return;
  }
  if (!pushSupported()) return;
  const subscription = await currentSubscription();
  if (subscription) await saveOnServer(subscription);
}
