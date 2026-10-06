import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { IS_SERVERLESS } from './db/databaseFile';
import type { AdminActor } from './adminApiAuth';

/**
 * Who did what in the admin console. Stored in data/audit_log.json (gitignored), newest first,
 * capped at MAX_ENTRIES. On serverless hosts it lives in /tmp and does not persist.
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

export function queryAudit(filter: { actorId?: string | null; action?: string | null; q?: string | null; page: number; limit: number }) {
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
