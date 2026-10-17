import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'โมเมนต์ & บรรยากาศจริงจากชุมชน',
  description:
    'ภาพถ่ายจริงและบรรยากาศความประทับใจจากพิกัดเที่ยว กิจกรรมคอมมูนิตี้ งานมหกรรม และภารกิจชาเลนจ์ทั่วประเทศ แบ่งปันโดยชาวฮับ',
  path: '/moments',
});

export default function MomentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
