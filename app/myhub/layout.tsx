import { PRIVATE_PAGE } from '@/lib/site';

export const metadata = { ...PRIVATE_PAGE, title: 'มายฮับ' };

export default function MyHubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
