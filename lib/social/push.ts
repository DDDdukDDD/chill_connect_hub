import { after } from 'next/server';
import type { PushDevice } from './pushStore';
import { pushStore } from './pushStore';

export interface PushMessage {
  title: string;
  body: string;
  /** A path on this site, opened when the notification is tapped */
  url: string;
  /** A newer notification with the same tag replaces the older one on the device */
  tag: string;
}

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

/** Without the keys the site simply sends nothing; the notice still shows on the bell */
export const pushConfigured = Boolean(PUBLIC_KEY && PRIVATE_KEY);

// Who push services contact about our sends. Always the public address: they refuse http and localhost
const PUSH_CONTACT = 'https://www.chillwaa.com';
// A device that is off for longer gets the notice from the bell instead
const KEEP_FOR_SECONDS = 24 * 60 * 60;
const SEND_TIMEOUT_MS = 5000;
const SEND_AT_ONCE = 20;

// Only real push services: the server posts to this address, so it can never be one a member made up
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^web\.push\.apple\.com$/, /\.push\.apple\.com$/, /\.push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/];

export function isPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return url.protocol === 'https:' && !url.port && PUSH_HOSTS.some((host) => host.test(url.hostname));
  } catch {
    return false;
  }
}

/** Runs once the response has gone out, so a like never waits on a push service; push failures only cost the push */
export function afterResponse(work: () => Promise<void>): void {
  const quiet = () => work().catch((error) => console.error('PUSH FAILED:', error));
  try {
    after(quiet);
  } catch {
    // Not inside a request (a script): nothing to wait for
    void quiet();
  }
}

/** Sends to each device; a device its push service says is gone is forgotten */
export async function sendPush(devices: PushDevice[], messageFor: (device: PushDevice) => PushMessage): Promise<void> {
  if (!pushConfigured || devices.length === 0) return;
  const { default: webpush } = await import('web-push');
  const vapidDetails = { subject: PUSH_CONTACT, publicKey: PUBLIC_KEY!, privateKey: PRIVATE_KEY! };
  const gone: string[] = [];
  for (let i = 0; i < devices.length; i += SEND_AT_ONCE) {
    await Promise.all(
      devices.slice(i, i + SEND_AT_ONCE).map(async (device) => {
        try {
          await webpush.sendNotification(
            { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
            JSON.stringify(messageFor(device)),
            { TTL: KEEP_FOR_SECONDS, timeout: SEND_TIMEOUT_MS, vapidDetails }
          );
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) gone.push(device.endpoint);
          else console.error('PUSH NOT SENT:', status ?? error);
        }
      })
    );
  }
  await pushStore.removeEndpoints(gone);
}
