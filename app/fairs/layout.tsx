import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'งานแฟร์ งานวิ่ง งานคอนเสิร์ต ช่วงนี้',
  description: 'ปฏิทินงานแฟร์ งานวิ่ง คอนเสิร์ต และนิทรรศการที่กำลังจัดและเร็วๆ นี้ พร้อมวันที่ สถานที่ และลิงก์ผู้จัดงาน',
  path: '/fairs',
});

export default function FairsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
