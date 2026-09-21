import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'โมเมนต์ & บรรยากาศจริงจากชุมชน',
  description:
    'ภาพถ่ายจริงและบรรยากาศความประทับใจจากพิกัดเที่ยว กิจกรรมคอมมูนิตี้ งานมหกรรม และภารกิจชาเลนจ์ทั่วประเทศ แบ่งปันโดยชาวฮับ',
  openGraph: {
    title: 'โมเมนต์ & บรรยากาศจริงจากชุมชน | Chill & Connect Hub',
    description:
      'ภาพถ่ายจริงและบรรยากาศความประทับใจจากพิกัดเที่ยว กิจกรรมคอมมูนิตี้ งานมหกรรม และภารกิจชาเลนจ์ทั่วประเทศ แบ่งปันโดยชาวฮับ',
    url: 'https://chillconnecthub.com/moments',
    siteName: 'Chill & Connect Hub',
    locale: 'th_TH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'โมเมนต์ & บรรยากาศจริงจากชุมชน | Chill & Connect Hub',
    description:
      'ภาพถ่ายจริงและบรรยากาศความประทับใจจากพิกัดเที่ยว กิจกรรมคอมมูนิตี้ งานมหกรรม และภารกิจชาเลนจ์ทั่วประเทศ',
  },
};

export default function MomentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
