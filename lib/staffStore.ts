import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { burnPasswordCheck, hashPassword, verifyPasswordHash } from './passwordHash';
import { IS_SERVERLESS } from './db/databaseFile';
import { sql, USE_POSTGRES } from './db/postgres/client';
import { iso } from './db/postgres/rows.mjs';
import { isStaffRole, StaffRole } from './permissions';

/**
 * Staff accounts for the admin console (server-side only).
 * In app.staff_accounts when the database is on, read on every admin request, so disabling an account or changing
 * its role takes effect at once on every server. Without a database (local prototype mode) it is
 * data/staff_accounts.json, gitignored because it holds password hashes. The env-based owner login
 * (ADMIN_PASSWORD) always works, so nobody is locked out.
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

/** A staff login may exist: the database cannot be asked from a sync check, so having one counts */
export function mayHaveStaff(): boolean {
  return USE_POSTGRES || load().length > 0;
}

// createdBy is who made the account; the env owner has no row, so it stays as a note in the id
type Row = Record<string, unknown>;
const fromRow = (r: Row): StaffAccount => ({
  id: r.legacy_id as string,
  email: String(r.email),
  name: r.name as string,
  role: r.role as StaffRole,
  status: r.status as StaffAccount['status'],
  passwordHash: r.password_hash as string,
  sessionVersion: r.session_version as number,
  createdAt: iso(r.created_at as Date) as string,
  createdBy: (r.creator as string | null) ?? '',
  lastLoginAt: (iso(r.last_login_at as Date | null) as string | null) ?? undefined,
});
const selectStaff = (db: ReturnType<typeof sql>) => db`
  select s.*, coalesce(c.legacy_id, s.created_by_note) as creator from app.staff_accounts s left join app.staff_accounts c on c.id = s.created_by`;

export async function listStaff(): Promise<StaffAccount[]> {
  if (!USE_POSTGRES) return [...load()];
  const db = sql();
  return (await db`${selectStaff(db)} order by s.created_at`).map(fromRow);
}

export async function findStaffById(id: string): Promise<StaffAccount | null> {
  if (!USE_POSTGRES) return load().find((account) => account.id === id) ?? null;
  const db = sql();
  const [row] = await db`${selectStaff(db)} where s.legacy_id = ${id}`;
  return row ? fromRow(row) : null;
}

/** Returns the account only when the email exists, the account is active and the password matches. */
export async function authenticateStaff(email: string, password: string): Promise<StaffAccount | null> {
  const wanted = normalizeEmail(email);
  let account: StaffAccount | undefined;
  if (USE_POSTGRES) {
    const db = sql();
    const [row] = await db`${selectStaff(db)} where s.email = ${wanted}`;
    account = row ? fromRow(row) : undefined;
  } else {
    account = load().find((a) => a.email === wanted);
  }
  // Hash anyway when the account is unknown so response time does not reveal which emails exist
  if (!account) {
    burnPasswordCheck(password);
    return null;
  }
  if (account.status !== 'active' || !verifyPasswordHash(password, account.passwordHash)) return null;
  return account;
}

export async function recordStaffLogin(id: string): Promise<void> {
  if (USE_POSTGRES) {
    await sql()`update app.staff_accounts set last_login_at = now() where legacy_id = ${id}`;
    return;
  }
  save(load().map((a) => (a.id === id ? { ...a, lastLoginAt: new Date().toISOString() } : a)));
}

export function getPasswordError(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `รหัสผ่านต้องมีอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`;
  }
  return null;
}

export async function createStaff(input: { email: string; name: string; role: StaffRole; password: string; createdBy: string }): Promise<StaffAccount> {
  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('อีเมลไม่ถูกต้อง');
  if (input.name.trim().length < 2) throw new Error('กรุณาระบุชื่อที่แสดง');
  const passwordError = getPasswordError(input.password);
  if (passwordError) throw new Error(passwordError);
  if (USE_POSTGRES) {
    const db = sql();
    const [taken] = await db`select 1 from app.staff_accounts where email = ${email}`;
    if (taken) throw new Error('อีเมลนี้มีบัญชีอยู่แล้ว');
    const id = `staff-${randomUUID()}`;
    const [row] = await db`
      insert into app.staff_accounts (legacy_id, email, name, role, status, password_hash, session_version, created_by, created_by_note)
      values (${id}, ${email}, ${input.name.trim()}, ${input.role}, 'active', ${hashPassword(input.password)}, 1,
        (select c.id from app.staff_accounts c where c.legacy_id = ${input.createdBy}), ${input.createdBy})
      returning *, created_by_note as creator`;
    return fromRow(row);
  }
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
export async function updateStaff(id: string, change: StaffChange): Promise<StaffAccount> {
  if (change.type === 'password') {
    const passwordError = getPasswordError(change.password);
    if (passwordError) throw new Error(passwordError);
  }
  if (USE_POSTGRES) {
    const db = sql();
    const set = change.type === 'role' ? db`role = ${change.role},`
      : change.type === 'status' ? db`status = ${change.status},`
      : change.type === 'password' ? db`password_hash = ${hashPassword(change.password)},`
      : db``;
    const [row] = await db`update app.staff_accounts set ${set} session_version = session_version + 1 where legacy_id = ${id} returning *, created_by_note as creator`;
    if (!row) throw new Error('ไม่พบบัญชีทีมงาน');
    return fromRow(row);
  }
  const accounts = load();
  const current = accounts.find((a) => a.id === id);
  if (!current) throw new Error('ไม่พบบัญชีทีมงาน');

  const next: StaffAccount = { ...current, sessionVersion: current.sessionVersion + 1 };
  if (change.type === 'role') next.role = change.role;
  if (change.type === 'status') next.status = change.status;
  if (change.type === 'password') next.passwordHash = hashPassword(change.password);
  save(accounts.map((a) => (a.id === id ? next : a)));
  return next;
}
