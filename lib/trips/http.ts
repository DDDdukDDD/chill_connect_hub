import { NextResponse } from 'next/server';
import { MemberAuthError } from '../members/accounts';
import { TripError } from './service';

/** The answer for a failed trip request: our own messages pass through, anything else is logged */
export function tripFailure(error: unknown, what: string) {
  if (error instanceof TripError || error instanceof MemberAuthError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
  console.error(`[trips] ${what} failed`, error);
  return NextResponse.json({ success: false, message: 'ทำรายการไม่สำเร็จ ลองอีกครั้งนะ' }, { status: 500 });
}

export const NO_STORE = { 'Cache-Control': 'private, no-store' };

/** A member request needs the same site and a session */
export const FORBIDDEN = () => NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
export const SIGN_IN = () => NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
