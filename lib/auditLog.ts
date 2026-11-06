import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { after } from 'next/server';
import { IS_SERVERLESS } from './db/databaseFile';
import { sql, USE_POSTGRES } from './db/postgres/client';
import { iso } from './db/postgres/rows.mjs';
import type { AdminActor } from './adminApiAuth';

/**
 * Who did what in the admin console. In app.audit_log when the database is on: every server writes to it, the website
 * can only add to it, never change it. Without a database (local prototype mode) data/audit_log.json, capped at MAX_ENTRIES.
 */
export interface AuditEntry {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  /** Dotted action name, e.g. "event.approve", "spot.publish", "staff.create", "auth.login" */
  action: string;
  targetType?: string;
  targetId?: string;
  summary: string;
}

const MAX_ENTRIES = 2000;
const AUDIT_FILE = IS_SERVERLESS
  ? path.join(os.tmpdir(), 'audit_log.json')
  : path.join(process.cwd(), 'data', 'audit_log.json');

const globalForAudit = globalThis as unknown as { _cchAuditLog?: AuditEntry[] };

function load(): AuditEntry[] {
  if (globalForAudit._cchAuditLog) return globalForAudit._cchAuditLog;
  let entries: AuditEntry[] = [];
  try {
    const parsed = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf-8'));
    if (Array.isArray(parsed)) entries = parsed;
  } catch {
    // No file yet
  }
  globalForAudit._cchAuditLog = entries;
  return entries;
}

export function recordAudit(
  actor: AdminActor | null,
  action: string,
  summary: string,
  target?: { type: string; id?: string }
) {
  const entry: AuditEntry = {
    id: randomUUID(),
    at: new Date().toISOString(),
    actorId: actor?.id ?? 'unknown',
    actorName: actor?.name ?? 'ไม่ทราบ',
    actorRole: actor?.role ?? 'unknown',
    action,
    targetType: target?.type,
    targetId: target?.id,
    summary,
  };
  if (USE_POSTGRES) {
    // After the answer is sent, so it never slows or breaks the action; `after` keeps a serverless function alive for it
    const write = () =>
      sql()`
        insert into app.audit_log (actor_kind, actor_id, actor_name, actor_role, action, target_type, target_id, summary)
        values (${actor ? 'staff' : 'system'}, ${entry.actorId}, ${entry.actorName}, ${entry.actorRole}, ${action}, ${target?.type ?? ''}, ${target?.id ?? null}, ${summary})`.then(
        () => undefined,
        (error) => console.error('AUDIT LOG WRITE FAILED:', error)
      );
    try {
      after(write);
    } catch {
      void write();
    }
    return;
  }
  const entries = [entry, ...load()].slice(0, MAX_ENTRIES);
  globalForAudit._cchAuditLog = entries;
  try {
    fs.mkdirSync(path.dirname(AUDIT_FILE), { recursive: true });
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (error) {
    // Auditing must never break the action itself
    console.error('AUDIT LOG WRITE FAILED:', error);
  }
}

async function queryAuditTable(filter: { actorId?: string | null; action?: string | null; q?: string | null; page: number; limit: number }) {
  const db = sql();
  const q = filter.q?.trim();
  const words = q ? `%${q.replace(/[\\%_]/g, '\\$&')}%` : null;
  const where = db`true
    ${filter.actorId ? db`and actor_id = ${filter.actorId}` : db``}
    ${filter.action ? db`and (action = ${filter.action} or action like ${`${filter.action.replace(/[\\%_]/g, '\\$&')}.%`})` : db``}
    ${words ? db`and (summary ilike ${words} or target_id ilike ${words})` : db``}`;
  const [{ total }] = await db`select count(*) as total from app.audit_log where ${where}`;
  const totalCount = Number(total);
  const totalPages = Math.max(1, Math.ceil(totalCount / filter.limit));
  const page = Math.min(filter.page, totalPages);
  const rows = await db`select * from app.audit_log where ${where} order by at desc, id desc limit ${filter.limit} offset ${(page - 1) * filter.limit}`;
  const items: AuditEntry[] = rows.map((r) => ({
    id: String(r.id),
    at: iso(r.at) as string,
    actorId: r.actor_id ?? 'unknown',
    actorName: r.actor_name ?? 'ไม่ทราบ',
    actorRole: r.actor_role ?? 'unknown',
    action: r.action,
    targetType: r.target_type || undefined,
    targetId: r.target_id ?? undefined,
    summary: r.summary,
  }));
  return { items, totalCount, page, limit: filter.limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 };
}

export async function queryAudit(filter: { actorId?: string | null; action?: string | null; q?: string | null; page: number; limit: number }) {
  if (USE_POSTGRES) return queryAuditTable(filter);
  const q = filter.q?.trim().toLowerCase();
  const matched = load().filter((entry) =>
    (!filter.actorId || entry.actorId === filter.actorId) &&
    (!filter.action || entry.action === filter.action || entry.action.startsWith(`${filter.action}.`)) &&
    (!q || entry.summary.toLowerCase().includes(q) || entry.targetId?.toLowerCase().includes(q))
  );
  const totalPages = Math.max(1, Math.ceil(matched.length / filter.limit));
  const page = Math.min(filter.page, totalPages);
  return {
    items: matched.slice((page - 1) * filter.limit, page * filter.limit),
    totalCount: matched.length,
    page,
    limit: filter.limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
