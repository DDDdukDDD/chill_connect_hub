import { VerifyEmailScreen } from './VerifyEmailScreen';
import { safeReturnPath } from '@/components/auth/returnTo';

export const metadata = { title: 'ยืนยันอีเมล', robots: { index: false } };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// Opened from the "confirm your email" message: /verify-email?token=...&next=/community/<id>?join=1
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <VerifyEmailScreen token={first(params.token) ?? ''} next={safeReturnPath(first(params.next), '')} />;
}
