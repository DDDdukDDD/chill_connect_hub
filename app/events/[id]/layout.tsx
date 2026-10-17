import { PRIVATE_PAGE } from '@/lib/site';

export const metadata = PRIVATE_PAGE;

export default function EventRedirectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
