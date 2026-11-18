/**
 * Social sign-in from inside the store app (iPhone step 2, 2026-11-18): the system sign-in sheet instead of the app's
 * web view, then the code it brings back is traded for this web view's session. lib/members/appAuth.ts has the server
 * side; ios-app WebAuthPlugin.swift opens the sheet. A browser, or an app build without the plugin, gets null and
 * signs in the usual way.
 */

type WebAuthPlugin = { start(options: { url: string; scheme: string }): Promise<{ url?: string; cancelled?: boolean }> };
type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  isPluginAvailable?: (name: string) => boolean;
  Plugins?: Record<string, unknown>;
  registerPlugin?: (name: string) => unknown;
};

function webAuthPlugin(): WebAuthPlugin | null {
  if (typeof window === 'undefined') return null;
  const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  if (!cap?.isNativePlatform?.() || !cap.isPluginAvailable?.('WebAuth')) return null;
  return ((cap.Plugins?.WebAuth as WebAuthPlugin | undefined) ?? (cap.registerPlugin?.('WebAuth') as WebAuthPlugin | undefined)) || null;
}

/** Whether social sign-in goes through the app's system sheet here */
export const canSignInNatively = () => webAuthPlugin() !== null;

const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/**
 * Opens the sheet for `provider`; resolves with where to go next, null when the member closed the sheet. Throws with a
 * message to show when sign-in failed.
 */
export async function signInNatively(provider: string, returnTo: string, consented: boolean): Promise<string | null> {
  const plugin = webAuthPlugin();
  if (!plugin) throw new Error('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่');
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
  const start = `${window.location.origin}/api/auth/member/oauth/${provider}?returnTo=${encodeURIComponent(returnTo)}${consented ? '&consent=1' : ''}&app=${challenge}`;
  const result = await plugin.start({ url: start, scheme: 'chillwaa' });
  if (result.cancelled || !result.url) return null;
  const back = new URL(result.url);
  const error = back.searchParams.get('error');
  if (error) throw new Error(error);
  const res = await fetch('/api/auth/member/app-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ t: back.searchParams.get('t'), verifier }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่');
  return typeof json.next === 'string' ? json.next : '/';
}
