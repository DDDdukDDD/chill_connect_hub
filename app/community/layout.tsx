import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'ตี้กิจกรรม หาเพื่อนไปด้วยกัน',
  description: 'รวมตี้กิจกรรมที่เปิดรับอยู่ วิ่ง คาเฟ่ บอร์ดเกม เวิร์กช็อป ฮีลใจ และอีกมาก เลือกตามสายที่ชอบ แล้วไปเจอเพื่อนใหม่ที่งานจริง',
  path: '/community',
});

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
