import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'ชาเลนจ์ ออกไปทำแล้วได้ XP',
  description: 'ชาเลนจ์ชวนออกไปใช้ชีวิต ไปตามที่ เข้าร่วมตี้ เก็บ XP รับเหรียญตรา และแลกของรางวัลจากพาร์ทเนอร์',
  path: '/challenges',
});

export default function ChallengesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
