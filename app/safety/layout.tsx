import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'คู่มือความปลอดภัย',
  description: 'แนวทางความปลอดภัยสำหรับการไปตี้และเจอเพื่อนใหม่ นัดในที่สาธารณะ ไม่แชร์รถ และวิธีรายงานเมื่อพบปัญหา',
  path: '/safety',
});

export default function SafetyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
