import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  isAdminLoginConfigured,
  readCookie,
  verifyAdminSessionToken,
} from './adminSession';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

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

function hasValidSession(request: Request): boolean {
  return verifyAdminSessionToken(readCookie(request, ADMIN_SESSION_COOKIE)) && isSameOriginRequest(request);
}

/**
 * Whether the request carries real, server-verified admin credentials
 * (Bearer ADMIN_API_TOKEN or a signed admin session cookie). Never trusts client-sent roles.
 */
export function hasAdminCredentials(request: Request): boolean {
  return hasValidBearerToken(request) || hasValidSession(request);
}

/** Whether admin access is granted, including the local-development bypass. */
export function isAdminAccessGranted(request: Request): boolean {
  if (hasAdminCredentials(request)) return true;
  return process.env.NODE_ENV !== 'production' && !isAdminAuthConfigured();
}

/**
 * Guard for admin route handlers. Returns a response to send when access is denied, or null.
 * Local development without any admin credentials configured is allowed through.
 */
export function requireAdminApiAccess(request: Request): NextResponse | null {
  if (isAdminAccessGranted(request)) return null;

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
