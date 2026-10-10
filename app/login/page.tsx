import { LoginScreen } from './LoginScreen';
import { safeReturnPath } from '@/components/auth/returnTo';

export const metadata = { title: 'เข้าสู่ระบบ · Chill & Connect Hub' };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// /login?mode=signup&returnTo=/moments&auth_error=... (auth_error comes back from a failed social sign-in)
export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return (
    <LoginScreen
      initialView={first(params.mode) === 'signup' ? 'signup' : 'login'}
      returnTo={safeReturnPath(first(params.returnTo), '/myhub')}
      initialError={first(params.auth_error)?.slice(0, 200) ?? ''}
    />
  );
}
