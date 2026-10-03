import { NextResponse } from 'next/server';
import { hasAdminCredentials, isAdminAccessGranted, isAdminAuthConfigured } from '@/lib/adminApiAuth';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionToken,
  isAdminLoginConfigured,
  verifyAdminPassword,
} from '@/lib/adminSession';

// Process-local failed-login throttle (per client IP)
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const globalForLogin = globalThis as unknown as { _cchAdminLoginFailures?: Map<string, { count: number; firstAt: number }> };
const failedAttempts = (globalForLogin._cchAdminLoginFailures ??= new Map());

function getClientKey(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

function isLockedOut(key: string, now: number): boolean {
  const entry = failedAttempts.get(key);
  if (!entry) return false;
  if (now - entry.firstAt > LOCKOUT_WINDOW_MS) {
    failedAttempts.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailure(key: string, now: number) {
  const entry = failedAttempts.get(key);
  if (!entry || now - entry.firstAt > LOCKOUT_WINDOW_MS) {
    failedAttempts.set(key, { count: 1, firstAt: now });
  } else {
    entry.count += 1;
  }
}

// Current admin session state for the admin console
export async function GET(request: Request) {
  return NextResponse.json(
    {
      success: true,
      authenticated: isAdminAccessGranted(request),
      hasSession: hasAdminCredentials(request),
      authRequired: process.env.NODE_ENV === 'production' || isAdminAuthConfigured(),
      loginAvailable: isAdminLoginConfigured(),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

// Log in with ADMIN_PASSWORD and receive a signed httpOnly session cookie
export async function POST(request: Request) {
  if (!isAdminLoginConfigured()) {
    return NextResponse.json(
      { success: false, message: 'ยังไม่ได้ตั้งค่าการเข้าสู่ระบบผู้ดูแล (ADMIN_PASSWORD / AUTH_SECRET)' },
      { status: 503 }
    );
  }

  const now = Date.now();
  const clientKey = getClientKey(request);
  if (isLockedOut(clientKey, now)) {
    return NextResponse.json(
      { success: false, message: 'พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง' },
      { status: 429 }
    );
  }

  let password: unknown;
  try {
    password = (await request.json())?.password;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  if (typeof password !== 'string' || !verifyAdminPassword(password)) {
    recordFailure(clientKey, now);
    return NextResponse.json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
  }

  failedAttempts.delete(clientKey);
  const response = NextResponse.json({ success: true, authenticated: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(now), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
  return response;
}

// Log out
export async function DELETE() {
  const response = NextResponse.json({ success: true, authenticated: false });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}
