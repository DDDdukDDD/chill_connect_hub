import { ResetPasswordScreen } from './ResetPasswordScreen';

export const metadata = { title: 'ตั้งรหัสผ่านใหม่ · Chill & Connect Hub', robots: { index: false } };

// Opened from the "forgot password" email: /reset-password?token=...
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { token } = await searchParams;
  return <ResetPasswordScreen token={(Array.isArray(token) ? token[0] : token) ?? ''} />;
}
