import { connect, constants, type ClientHttp2Session } from 'node:http2';
import { sign as cryptoSign } from 'node:crypto';
import { applePrivateKeyPem } from '../members/oauth';

/**
 * Native push to the iPhone store app through Apple Push Notification service (iPhone step 4, BE-428).
 * Env: APNS_KEY_ID + APNS_PRIVATE_KEY (a key with "Apple Push Notifications service" from the developer account; the
 * Sign in with Apple key can carry it too), APPLE_TEAM_ID (shared with Sign in with Apple). Optional: APNS_TOPIC
 * (default the app's bundle id) and APNS_HOST=sandbox for an Xcode debug build; TestFlight and the App Store use
 * production. Devices are rows of app.push_subscriptions whose endpoint is `apns:<token>` (lib/social/pushStore.ts).
 */

export const APNS_PREFIX = 'apns:';
const TOPIC = process.env.APNS_TOPIC || 'com.chillwaa.app';
const HOST = process.env.APNS_HOST === 'sandbox' ? 'https://api.sandbox.push.apple.com' : 'https://api.push.apple.com';
const SEND_TIMEOUT_MS = 5000;
// Apple refuses a provider token older than an hour, and a new one more often than every 20 minutes
const TOKEN_REFRESH_MS = 40 * 60 * 1000;

export const apnsConfigured = Boolean(process.env.APNS_KEY_ID && process.env.APNS_PRIVATE_KEY && process.env.APPLE_TEAM_ID);

/** A device token as the app hands it over: hex, 32 bytes today, up to 100 allowed by Apple's docs */
export const isApnsToken = (token: unknown): token is string => typeof token === 'string' && /^[0-9a-f]{64,200}$/i.test(token);

let providerToken: { value: string; at: number } | null = null;
function bearer(): string {
  if (providerToken && Date.now() - providerToken.at < TOKEN_REFRESH_MS) return providerToken.value;
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: process.env.APNS_KEY_ID })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ iss: process.env.APPLE_TEAM_ID, iat: Math.floor(Date.now() / 1000) })).toString('base64url');
  const signature = cryptoSign('sha256', Buffer.from(`${header}.${payload}`), { key: applePrivateKeyPem(process.env.APNS_PRIVATE_KEY!), dsaEncoding: 'ieee-p1363' }).toString('base64url');
  providerToken = { value: `${header}.${payload}.${signature}`, at: Date.now() };
  return providerToken.value;
}

export interface ApnsMessage {
  title: string;
  body: string;
  /** A path on this site, opened when the notification is tapped (lib/appClient.ts listenForNativePushTaps) */
  url: string;
  /** A newer notification with the same tag replaces the older one */
  tag: string;
}

/** One request on an open connection; resolves with Apple's status and reason ("BadDeviceToken", "Unregistered"…) */
function post(session: ClientHttp2Session, token: string, message: ApnsMessage): Promise<{ status: number; reason?: string }> {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      aps: { alert: { title: message.title, body: message.body }, sound: 'default', 'thread-id': message.tag.slice(0, 64) },
      url: message.url,
    });
    const request = session.request({
      [constants.HTTP2_HEADER_METHOD]: 'POST',
      [constants.HTTP2_HEADER_PATH]: `/3/device/${token}`,
      authorization: `bearer ${bearer()}`,
      'apns-topic': TOPIC,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      // Kept for a day while the phone is off, like web push (lib/social/push.ts)
      'apns-expiration': String(Math.floor(Date.now() / 1000) + 24 * 60 * 60),
      'apns-collapse-id': message.tag.slice(0, 64),
      'content-type': 'application/json',
    });
    let status = 0;
    let text = '';
    request.setTimeout(SEND_TIMEOUT_MS, () => request.close(constants.NGHTTP2_CANCEL));
    request.on('response', (headers) => (status = Number(headers[constants.HTTP2_HEADER_STATUS]) || 0));
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => (text += chunk));
    request.on('end', () => {
      let reason: string | undefined;
      try {
        reason = text ? (JSON.parse(text) as { reason?: string }).reason : undefined;
      } catch {
        reason = undefined;
      }
      resolve({ status, reason });
    });
    request.on('error', (error) => resolve({ status: 0, reason: error.message }));
    request.end(body);
  });
}

/**
 * Sends to each token over one HTTP/2 connection; returns the tokens Apple says are gone (the app was deleted, or
 * notifications were turned off), so the caller forgets them.
 */
export async function sendApns(items: { token: string; message: ApnsMessage }[]): Promise<string[]> {
  if (!apnsConfigured || items.length === 0) return [];
  const session = connect(HOST);
  session.on('error', (error) => console.error('APNS CONNECTION:', error.message));
  const gone: string[] = [];
  try {
    const results = await Promise.all(items.map(async (item) => ({ item, result: await post(session, item.token, item.message) })));
    for (const { item, result } of results) {
      if (result.status === 200) continue;
      if (result.status === 410 || result.reason === 'BadDeviceToken' || result.reason === 'Unregistered' || result.reason === 'DeviceTokenNotForTopic') gone.push(item.token);
      else console.error('APNS NOT SENT:', result.status, result.reason);
      // A refused provider token is made again on the next send
      if (result.reason === 'ExpiredProviderToken' || result.reason === 'InvalidProviderToken') providerToken = null;
    }
  } finally {
    session.close();
  }
  return gone;
}
