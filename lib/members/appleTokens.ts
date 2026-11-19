import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';
import { USE_POSTGRES, sql } from '../db/postgres/client';
import { isProviderConfigured, revokeAppleRefreshToken } from './oauth';

/**
 * Apple refresh tokens (BE-427). App Review 5.1.1(v): an app with Sign in with Apple must revoke the member's Apple
 * token when they delete their account. Apple only revokes with a token it issued, so the refresh token from each
 * Apple sign-in is kept, encrypted with a key derived from AUTH_SECRET (a new AUTH_SECRET makes old rows unreadable:
 * revoking then fails quietly, which only matters for accounts deleted before their next Apple sign-in).
 * Without a database (DATA_STORE=json) nothing is kept.
 */

const ALGORITHM = 'aes-256-gcm';

function key(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set');
  return Buffer.from(hkdfSync('sha256', secret, 'chillwaa', 'apple-refresh-token', 32));
}

/** "v1.<iv>.<tag>.<ciphertext>", all base64url */
function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key(), iv);
  const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv, cipher.getAuthTag(), body].map((part) => (typeof part === 'string' ? part : part.toString('base64url'))).join('.');
}

function decrypt(stored: string): string {
  const [version, iv, tag, body] = stored.split('.');
  if (version !== 'v1' || !iv || !tag || !body) throw new Error('unknown token format');
  const decipher = createDecipheriv(ALGORITHM, key(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(body, 'base64url')), decipher.final()]).toString('utf8');
}

/** After an Apple sign-in: keep the newest token. Never blocks the sign-in */
export async function saveAppleToken(memberId: string, refreshToken: string): Promise<void> {
  if (!USE_POSTGRES || !refreshToken) return;
  try {
    const value = encrypt(refreshToken);
    await sql()`
      insert into app.apple_tokens (member_id, refresh_token)
      select id, ${value} from app.members where legacy_id = ${memberId}
      on conflict (member_id) do update set refresh_token = excluded.refresh_token, updated_at = now()`;
  } catch (error) {
    console.error('[apple token] save failed', error);
  }
}

/**
 * Before deleting an account: revoke the member's Apple token, then drop it. Returns what happened, for the log;
 * the deletion goes ahead whatever Apple answers (the member asked to leave, and the row goes with the member anyway).
 * 'revoked' means Apple took the request: its revoke endpoint answers 200 to anything, even a made-up client (checked
 * 2026-11-19), so it cannot confirm. The proof is on the iPhone: Settings › Apple ID › Sign in with Apple no longer
 * lists Chillwaa. 'failed' = no request went out (Apple not configured, unreadable row, network).
 */
export async function revokeAppleToken(memberId: string): Promise<'revoked' | 'none' | 'failed'> {
  if (!USE_POSTGRES) return 'none';
  try {
    const rows = await sql()<{ refresh_token: string }[]>`
      select t.refresh_token from app.apple_tokens t join app.members m on m.id = t.member_id where m.legacy_id = ${memberId}`;
    if (!rows[0]) return 'none';
    if (!isProviderConfigured('apple')) throw new Error('Apple sign-in is not configured here');
    await revokeAppleRefreshToken(decrypt(rows[0].refresh_token));
    await sql()`delete from app.apple_tokens t using app.members m where m.id = t.member_id and m.legacy_id = ${memberId}`;
    return 'revoked';
  } catch (error) {
    console.error('[apple token] revoke failed', error);
    return 'failed';
  }
}
