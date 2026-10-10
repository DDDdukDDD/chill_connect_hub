import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/** scrypt password hashes stored as "scrypt$<salt hex>$<hash hex>" (staff and member accounts). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString('hex')}$${scryptSync(password, salt, 64).toString('hex')}`;
}

export function verifyPasswordHash(password: string, stored: string | undefined): boolean {
  const [scheme, saltHex, hashHex] = (stored ?? '').split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(expected, actual);
}

/** Spend the same time as a real check when the account does not exist (no user enumeration by timing) */
export function burnPasswordCheck(password: string) {
  verifyPasswordHash(password, `scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`);
}
