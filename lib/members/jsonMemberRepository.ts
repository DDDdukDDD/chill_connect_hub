import fs from 'fs';
import os from 'os';
import path from 'path';
import { IS_SERVERLESS } from '../db/databaseFile';
import { AsyncMutex } from '../db/mutex';
import type { Member, MemberQuery, MemberRepository, MemberStatus, OAuthProvider } from './types';

/**
 * Prototype member store: data/members.json (gitignored, it holds emails and password hashes).
 * On serverless hosts it lives in /tmp and does not persist — swap in a database repository for production.
 */
const FILE = IS_SERVERLESS ? path.join(os.tmpdir(), 'members.json') : path.join(process.cwd(), 'data', 'members.json');
const globalForMembers = globalThis as unknown as { _cchMembers?: Member[]; _cchMembersMutex?: AsyncMutex };
const mutex = (globalForMembers._cchMembersMutex ??= new AsyncMutex());

function load(): Member[] {
  if (globalForMembers._cchMembers) return globalForMembers._cchMembers;
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
    globalForMembers._cchMembers = Array.isArray(parsed) ? parsed : [];
  } catch {
    globalForMembers._cchMembers = [];
  }
  return globalForMembers._cchMembers;
}

function persist(members: Member[]) {
  globalForMembers._cchMembers = members;
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(members, null, 2), 'utf-8');
}

export const jsonMemberRepository: MemberRepository = {
  async findById(id) {
    return load().find((m) => m.id === id) ?? null;
  },
  async findByEmail(email) {
    const normalized = email.trim().toLowerCase();
    return load().find((m) => m.email === normalized) ?? null;
  },
  async findByProvider(provider: OAuthProvider, subject: string) {
    return load().find((m) => m.providers.some((p) => p.provider === provider && p.subject === subject)) ?? null;
  },
  async create(member) {
    return mutex.runExclusive(async () => {
      const members = load();
      if (member.email && members.some((m) => m.email === member.email)) throw new Error('อีเมลนี้มีบัญชีอยู่แล้ว');
      persist([...members, member]);
      return member;
    });
  },
  async update(id, changes) {
    return mutex.runExclusive(async () => {
      const members = load();
      const index = members.findIndex((m) => m.id === id);
      if (index === -1) throw new Error('ไม่พบสมาชิก');
      const updated = { ...members[index], ...changes, id };
      persist(members.map((m, i) => (i === index ? updated : m)));
      return updated;
    });
  },
  async remove(id) {
    return mutex.runExclusive(async () => {
      const members = load();
      const next = members.filter((m) => m.id !== id);
      if (next.length === members.length) return false;
      persist(next);
      return true;
    });
  },
  async query({ q, status = 'all', page, limit }: MemberQuery) {
    const members = load();
    const text = q?.trim().toLowerCase();
    const counts = { all: members.length, active: 0, suspended: 0, banned: 0 } as Record<MemberStatus | 'all', number>;
    for (const member of members) counts[member.status] += 1;
    const filtered = members
      .filter((m) => (status === 'all' || m.status === status) && (!text || m.displayName.toLowerCase().includes(text) || m.email?.includes(text) || m.id === text))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { items: filtered.slice((page - 1) * limit, page * limit), totalCount: filtered.length, counts };
  },
};
