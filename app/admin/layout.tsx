import type { Metadata } from 'next';

// The admin console is for staff: never in search results (robots.txt also keeps crawlers out of /admin)
export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
