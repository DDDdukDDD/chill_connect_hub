import type { Metadata } from 'next';
import { NotFoundScreen } from '@/components/NotFoundScreen';

export const metadata: Metadata = { title: 'ไม่พบหน้านี้', robots: { index: false, follow: true } };

export default function NotFound() {
  return <NotFoundScreen />;
}
