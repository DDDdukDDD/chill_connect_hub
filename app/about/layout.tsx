import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'เกี่ยวกับเรา',
  description: 'Chill & Connect Hub คือคอมมูนิตี้ของคนชอบออกไปใช้ชีวิต หากิจกรรมที่ใช่ ไปกับเพื่อนใหม่ และแบ่งปันเรื่องราว',
  path: '/about',
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
