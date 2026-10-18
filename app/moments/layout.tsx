import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'โมเมนต์จากเพื่อนๆ',
  description:
    'ภาพจริงจากคนที่ไปมาแล้ว ทั้งที่เที่ยว ตี้ งานแฟร์ และชาเลนจ์ทั่วประเทศ เห็นที่ไหนน่าไป แตะดูแล้วไปต่อได้เลย',
  path: '/moments',
});

export default function MomentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
