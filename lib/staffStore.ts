import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { burnPasswordCheck, hashPassword, verifyPasswordHash } from './passwordHash';
import { IS_SERVERLESS } from './db/databaseFile';
import { isStaffRole, StaffRole } from './permissions';

/**
 * Staff accounts for the admin console (server-side only).
 * Stored in data/staff_accounts.json, which is gitignored because it holds password hashes.
 * On serverless hosts the file lives in /tmp and does not persist; the env-based owner login
 * (ADMIN_PASSWORD) always works, so nobody is locked out.
 * Reads are synchronous and cached so permission checks can stay synchronous.
 */
export interface StaffAccount {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  status: 'active' | 'disabled';
  passwordHash: string; // scrypt$<salt hex>$<hash hex>
  /** Bumped on role change, disable, password reset and forced logout; older sessions stop working */
  sessionVersion: number;
  createdAt: string;
  createdBy: string;
  lastLoginAt?: string;
}

/** What the API returns: never the password hash */
export type PublicStaffAccount = Omit<StaffAccount, 'passwordHash' | 'sessionVersion'>;

export const MIN_PASSWORD_LENGTH = 10;
const STAFF_FILE = IS_SERVERLESS
  ? path.join(os.tmpdir(), 'staff_accounts.json')
  : path.join(process.cwd(), 'data', 'staff_accounts.json');

const globalForStaff = globalThis as unknown as { _cchStaffAccounts?: StaffAccount[] };

function load(): StaffAccount[] {
  if (globalForStaff._cchStaffAccounts) return globalForStaff._cchStaffAccounts;
  let accounts: StaffAccount[] = [];
  try {
    const parsed = JSON.parse(fs.readFileSync(STAFF_FILE, 'utf-8'));
    if (Array.isArray(parsed)) accounts = parsed.filter((a) => a && typeof a.id === 'string' && isStaffRole(a.role));
  } catch {
    // No file yet: start empty
  }
  globalForStaff._cchStaffAccounts = accounts;
  return accounts;
}

function save(accounts: StaffAccount[]) {
  globalForStaff._cchStaffAccounts = accounts;
  fs.mkdirSync(path.dirname(STAFF_FILE), { recursive: true });
  fs.writeFileSync(STAFF_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
}

export function toPublicStaff(account: StaffAccount): PublicStaffAccount {
  const { passwordHash: _hash, sessionVersion: _version, ...publicFields } = account;
  void _hash;
  void _version;
  return publicFields;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function listStaff(): StaffAccount[] {
  return [...load()];
}

export function countStaff(): number {
  return load().length;
}

export function findStaffById(id: string): StaffAccount | null {
  return load().find((account) => account.id === id) ?? null;
}

/** Returns the account only when the email exists, the account is active and the password matches. */
export function authenticateStaff(email: string, password: string): StaffAccount | null {
  const account = load().find((a) => a.email === normalizeEmail(email));
  // Hash anyway when the account is unknown so response time does not reveal which emails exist
  if (!account) {
    burnPasswordCheck(password);
    return null;
  }
  if (account.status !== 'active' || !verifyPasswordHash(password, account.passwordHash)) return null;
  return account;
}

export function recordStaffLogin(id: string) {
  save(load().map((a) => (a.id === id ? { ...a, lastLoginAt: new Date().toISOString() } : a)));
}

export function getPasswordError(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `รหัสผ่านต้องมีอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`;
  }
  return null;
}

export function createStaff(input: { email: string; name: string; role: StaffRole; password: string; createdBy: string }): StaffAccount {
  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('อีเมลไม่ถูกต้อง');
  if (input.name.trim().length < 2) throw new Error('กรุณาระบุชื่อที่แสดง');
  const passwordError = getPasswordError(input.password);
  if (passwordError) throw new Error(passwordError);
  const accounts = load();
  if (accounts.some((a) => a.email === email)) throw new Error('อีเมลนี้มีบัญชีอยู่แล้ว');

  const account: StaffAccount = {
    id: `staff-${randomUUID()}`,
    email,
    name: input.name.trim(),
    role: input.role,
    status: 'active',
    passwordHash: hashPassword(input.password),
    sessionVersion: 1,
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
  };
  save([...accounts, account]);
  return account;
}

type StaffChange =
  | { type: 'role'; role: StaffRole }
  | { type: 'status'; status: 'active' | 'disabled' }
  | { type: 'password'; password: string }
  | { type: 'force_logout' };

/** Applies one change and invalidates the account's existing sessions. */
export function updateStaff(id: string, change: StaffChange): StaffAccount {
  const accounts = load();
  const current = accounts.find((a) => a.id === id);
  if (!current) throw new Error('ไม่พบบัญชีทีมงาน');

  const next: StaffAccount = { ...current, sessionVersion: current.sessionVersion + 1 };
  if (change.type === 'role') next.role = change.role;
  if (change.type === 'status') next.status = change.status;
  if (change.type === 'password') {
    const passwordError = getPasswordError(change.password);
    if (passwordError) throw new Error(passwordError);
    next.passwordHash = hashPassword(change.password);
  }
  save(accounts.map((a) => (a.id === id ? next : a)));
  return next;
}
