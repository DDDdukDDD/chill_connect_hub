import { NextResponse } from 'next/server';
import { AdminActor, getAdminActor, hasAdminCredentials, isAdminAuthConfigured } from '@/lib/adminApiAuth';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionToken,
  ENV_OWNER_SUBJECT,
  isAdminLoginConfigured,
  verifyAdminPassword,
} from '@/lib/adminSession';
import { recordAudit } from '@/lib/auditLog';
import { ROLE_LABELS, ROLE_PERMISSIONS } from '@/lib/permissions';
import { authenticateStaff, recordStaffLogin } from '@/lib/staffStore';

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

// Current admin session state for the admin console, including the verified actor and its permissions
export async function GET(request: Request) {
  const actor = getAdminActor(request);
  return NextResponse.json(
    {
      success: true,
      authenticated: actor !== null,
      actor: actor && { ...actor, roleLabel: ROLE_LABELS[actor.role], permissions: ROLE_PERMISSIONS[actor.role] },
      hasSession: hasAdminCredentials(request),
      authRequired: process.env.NODE_ENV === 'production' || isAdminAuthConfigured(),
      loginAvailable: isAdminLoginConfigured(),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

// Log in and receive a signed httpOnly session cookie:
// { email, password } for a staff account, or { password } alone for the env owner (ADMIN_PASSWORD)
export async function POST(request: Request) {
  if (!isAdminLoginConfigured()) {
    return NextResponse.json(
      { success: false, message: 'ยังไม่ได้ตั้งค่าการเข้าสู่ระบบผู้ดูแล (AUTH_SECRET และ ADMIN_PASSWORD หรือบัญชีทีมงาน)' },
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
  let email: unknown;
  try {
    const body = await request.json();
    password = body?.password;
    email = body?.email;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  const hasEmail = typeof email === 'string' && email.trim() !== '';
  let session: { subject: string; version: number; actor: AdminActor } | null = null;
  if (typeof password === 'string') {
    if (hasEmail) {
      const account = authenticateStaff(email as string, password);
      if (account) session = { subject: account.id, version: account.sessionVersion, actor: { id: account.id, name: account.name, role: account.role } };
    } else if (verifyAdminPassword(password)) {
      session = { subject: ENV_OWNER_SUBJECT, version: 0, actor: { id: ENV_OWNER_SUBJECT, name: 'เจ้าของระบบ', role: 'owner' } };
    }
  }

  if (!session) {
    recordFailure(clientKey, now);
    recordAudit(null, 'auth.login_failed', hasEmail ? 'เข้าสู่ระบบไม่สำเร็จ (บัญชีทีมงาน)' : 'เข้าสู่ระบบไม่สำเร็จ (รหัสเจ้าของระบบ)');
    return NextResponse.json({ success: false, message: hasEmail ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
  }

  failedAttempts.delete(clientKey);
  if (session.subject !== ENV_OWNER_SUBJECT) recordStaffLogin(session.subject);
  recordAudit(session.actor, 'auth.login', 'เข้าสู่ระบบ');
  const response = NextResponse.json({ success: true, authenticated: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(session.subject, session.version, now), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
  return response;
}

// Log out
export async function DELETE(request: Request) {
  const actor = getAdminActor(request);
  if (actor && hasAdminCredentials(request)) recordAudit(actor, 'auth.logout', 'ออกจากระบบ');
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
