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
import { clearRateLimit, clientIp, isOverRateLimit, isRateLimited } from '@/lib/rateLimit';
import { ROLE_LABELS, ROLE_PERMISSIONS } from '@/lib/permissions';
import { authenticateStaff, recordStaffLogin } from '@/lib/staffStore';

// Failed logins per client IP, counted across every server (lib/rateLimit.ts)
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const failureKey = (request: Request) => `admin-login-fail:${clientIp(request)}`;

// Current admin session state for the admin console, including the verified actor and its permissions
export async function GET(request: Request) {
  const actor = await getAdminActor(request);
  return NextResponse.json(
    {
      success: true,
      authenticated: actor !== null,
      actor: actor && { ...actor, roleLabel: ROLE_LABELS[actor.role], permissions: ROLE_PERMISSIONS[actor.role] },
      hasSession: await hasAdminCredentials(request),
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
  const clientKey = failureKey(request);
  if (await isOverRateLimit(clientKey, MAX_FAILED_ATTEMPTS, LOCKOUT_WINDOW_MS)) {
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

  // Both checks always run, and the session comes only from their results: what the request sends never picks
  // which check runs or skips one. It also keeps the response time the same for staff and owner logins
  const emailText = typeof email === 'string' ? email.trim() : '';
  const passwordText = typeof password === 'string' ? password : '';
  const hasEmail = emailText !== '';
  const account = await authenticateStaff(emailText, passwordText);
  const ownerPasswordMatches = verifyAdminPassword(passwordText);
  const session: { subject: string; version: number; actor: AdminActor } | null = account
    ? { subject: account.id, version: account.sessionVersion, actor: { id: account.id, name: account.name, role: account.role } }
    : !hasEmail && passwordText !== '' && ownerPasswordMatches
      ? { subject: ENV_OWNER_SUBJECT, version: 0, actor: { id: ENV_OWNER_SUBJECT, name: 'เจ้าของระบบ', role: 'owner' } }
      : null;

  if (!session) {
    await isRateLimited(clientKey, MAX_FAILED_ATTEMPTS, LOCKOUT_WINDOW_MS);
    recordAudit(null, 'auth.login_failed', hasEmail ? 'เข้าสู่ระบบไม่สำเร็จ (บัญชีทีมงาน)' : 'เข้าสู่ระบบไม่สำเร็จ (รหัสเจ้าของระบบ)');
    return NextResponse.json({ success: false, message: hasEmail ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
  }

  await clearRateLimit(clientKey);
  if (session.subject !== ENV_OWNER_SUBJECT) await recordStaffLogin(session.subject);
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
  const actor = await getAdminActor(request);
  if (actor && await hasAdminCredentials(request)) recordAudit(actor, 'auth.logout', 'ออกจากระบบ');
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
