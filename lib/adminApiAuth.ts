import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  ENV_OWNER_SUBJECT,
  isAdminLoginConfigured,
  readAdminSessionToken,
  readCookie,
} from './adminSession';
import { AdminPermission, roleHasPermission, StaffRole } from './permissions';
import { findStaffById } from './staffStore';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** The server-verified person (or token) behind an admin request. Never built from client input. */
export interface AdminActor {
  id: string;
  name: string;
  role: StaffRole;
}

/** True when at least one admin credential mechanism (API token or login) is configured. */
export function isAdminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_API_TOKEN) || isAdminLoginConfigured();
}

function hasValidBearerToken(request: Request): boolean {
  const configuredToken = process.env.ADMIN_API_TOKEN;
  if (!configuredToken) return false;

  const authorization = request.headers.get('authorization') || '';
  const providedToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!providedToken) return false;

  const expected = Buffer.from(configuredToken);
  const provided = Buffer.from(providedToken);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

// Cookie-authenticated writes must come from this site (defense in depth on top of SameSite=Strict)
function isSameOriginRequest(request: Request): boolean {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return true;
  const origin = request.headers.get('origin');
  if (!origin) return request.headers.get('sec-fetch-site') !== 'cross-site';
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || new URL(request.url).host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Resolves the session cookie to an actor. Staff sessions are re-checked against the store on every
// request, so disabling an account, changing its role or forcing logout takes effect immediately.
function getSessionActor(request: Request): AdminActor | null {
  if (!isSameOriginRequest(request)) return null;
  const payload = readAdminSessionToken(readCookie(request, ADMIN_SESSION_COOKIE));
  if (!payload) return null;
  if (payload.sub === ENV_OWNER_SUBJECT) {
    return process.env.ADMIN_PASSWORD ? { id: ENV_OWNER_SUBJECT, name: 'เจ้าของระบบ', role: 'owner' } : null;
  }
  const account = findStaffById(payload.sub);
  if (!account || account.status !== 'active' || account.sessionVersion !== payload.ver) return null;
  return { id: account.id, name: account.name, role: account.role };
}

/** The verified actor from a Bearer ADMIN_API_TOKEN or a signed session cookie, or null. */
export function getCredentialActor(request: Request): AdminActor | null {
  if (hasValidBearerToken(request)) return { id: 'api-token', name: 'Admin API token', role: 'owner' };
  return getSessionActor(request);
}

/** Whether the request carries real, server-verified admin credentials. Never trusts client-sent roles. */
export function hasAdminCredentials(request: Request): boolean {
  return getCredentialActor(request) !== null;
}

/**
 * The actor for this request, including the local-development bypass
 * (no credentials configured and not production → full access as a local owner).
 */
export function getAdminActor(request: Request): AdminActor | null {
  const actor = getCredentialActor(request);
  if (actor) return actor;
  if (process.env.NODE_ENV !== 'production' && !isAdminAuthConfigured()) {
    return { id: 'local-dev', name: 'Local developer', role: 'owner' };
  }
  return null;
}

/** Whether admin access is granted, including the local-development bypass. */
export function isAdminAccessGranted(request: Request): boolean {
  return getAdminActor(request) !== null;
}

export function actorCan(actor: AdminActor | null, permission: AdminPermission): boolean {
  return Boolean(actor && roleHasPermission(actor.role, permission));
}

/**
 * Guard for admin route handlers. Returns a response to send when access is denied, or null.
 * 401 = not signed in, 403 = signed in but the role lacks `permission`.
 */
export function requireAdminApiAccess(request: Request, permission: AdminPermission = 'content.view'): NextResponse | null {
  const actor = getAdminActor(request);
  if (actor) {
    if (roleHasPermission(actor.role, permission)) return null;
    return NextResponse.json(
      { success: false, error: 'บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้', message: 'บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้', permission },
      { status: 403 }
    );
  }

  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      { success: false, message: 'Admin API access is not configured' },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { success: false, message: 'Unauthorized' },
    { status: 401 }
  );
}
