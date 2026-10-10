import { VerifyEmailScreen } from './VerifyEmailScreen';

export const metadata = { title: 'ยืนยันอีเมล · Chill & Connect Hub', robots: { index: false } };

// Opened from the "confirm your email" message: /verify-email?token=...
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { token } = await searchParams;
  return <VerifyEmailScreen token={(Array.isArray(token) ? token[0] : token) ?? ''} />;
}
