import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'ที่เที่ยว คาเฟ่ และที่ชิลทั่วไทย',
  description: 'ค้นหาที่เที่ยว คาเฟ่ สวน พิพิธภัณฑ์ และจุดชมวิวทั่วไทย ตามจังหวัดและสายที่ชอบ พร้อมเวลาเปิด ราคา และการเดินทาง',
  path: '/spots',
});

export default function SpotsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
