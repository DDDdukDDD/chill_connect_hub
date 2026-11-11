import { randomInt } from 'crypto';
import { USE_POSTGRES, sql } from '../db/postgres/client';
import { createJsonStore } from './jsonStore';

/**
 * Short "ชวนไป" links (db/migrations/0046_invite_links.sql, owner 2026-11-11): www.chillwaa.com/i/<code> instead of a
 * long signed link, which looked like spam in LINE. The code only points at the signed invitation; the signature is
 * still what proves it (lib/social/inviteLinks.ts), so guessing a code gives nothing that sharing did not.
 */

export interface InviteLink {
  code: string;
  token: string;
  /** The page the invitation opens, e.g. "/spots/abc" */
  path: string;
}

const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 7;
const newCode = () => Array.from({ length: CODE_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
export const isInviteCode = (value: string) => new RegExp(`^[${ALPHABET}]{${CODE_LENGTH}}$`).test(value);

interface InviteLinkStore {
  /** The code for this invitation, made on first use */
  codeFor(token: string, path: string): Promise<string>;
  byCode(code: string): Promise<InviteLink | null>;
}

function jsonLinks(): InviteLinkStore {
  const store = createJsonStore<InviteLink>('invite_links');
  return {
    async codeFor(token, path) {
      let code = '';
      await store.update((items) => {
        const found = items.find((l) => l.token === token);
        if (found) {
          code = found.code;
          return items;
        }
        do code = newCode();
        while (items.some((l) => l.code === code));
        return [...items, { code, token, path }];
      });
      return code;
    },
    async byCode(code) {
      return store.read().find((l) => l.code === code) ?? null;
    },
  };
}

function pgLinks(): InviteLinkStore {
  return {
    async codeFor(token, path) {
      const db = sql();
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const rows = await db<{ code: string }[]>`
          insert into app.invite_links (code, token, path) values (${newCode()}, ${token}, ${path})
          on conflict (token) do update set token = excluded.token
          returning code`.catch((error: { code?: string; constraint_name?: string }) => {
          // Another invitation took this code: try a new one
          if (error?.code === '23505' && error.constraint_name === 'invite_links_pkey') return null;
          throw error;
        });
        if (rows?.[0]) return rows[0].code;
      }
      throw new Error('invite link: no free code');
    },
    async byCode(code) {
      const db = sql();
      const rows = await db<InviteLink[]>`select code, token, path from app.invite_links where code = ${code}`;
      return rows[0] ?? null;
    },
  };
}

export const inviteLinkStore: InviteLinkStore = USE_POSTGRES ? pgLinks() : jsonLinks();
