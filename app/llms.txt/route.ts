import { SITE_URL } from '@/lib/site';

// /llms.txt: a short guide for AI search (ChatGPT, Claude, Perplexity) to what Chillwaa is and where things are,
// in the format of llmstxt.org. Facts only, the same as /about says; pages keep their own content and JSON-LD.
export const dynamic = 'force-static';

const body = `# Chillwaa

> Chillwaa (www.chillwaa.com) คือคอมมูนิตี้คนชอบออกไปใช้ชีวิตทั่วไทย: เข้าตี้หรือเปิดตี้ชวนเพื่อนไปด้วยกัน หาที่เที่ยวและอีเวนต์ ทำชาเลนจ์ได้ XP เหรียญ และของรางวัล แล้วแชร์โมเมนต์ให้เพื่อนๆ ดู
> Chillwaa is a Thai community for people who like to go out: join or host small group meetups ("ตี้"), find places and events, complete challenges for XP, badges and partner rewards, and share moments with friends.

- ตี้ (meetup): กลุ่มเล็กๆ ที่นัดไปทำกิจกรรมด้วยกัน เช่น วิ่ง นั่งคาเฟ่ บอร์ดเกม ดูคอนเสิร์ต มาคนเดียวได้ คนเปิดตี้ต้องผ่านการตรวจจากทีมงาน นัดเจอในที่สาธารณะ และเช็กอินที่จุดนัด
- อีเวนต์ (event): งานวิ่ง คอนเสิร์ต เอ็กซ์โป และงานอื่นๆ จากผู้จัดตัวจริง
- ที่เที่ยว (places): ที่เที่ยวและที่ชิลกว่า 2,000 แห่งทั่วไทย แยกตามจังหวัดและหมวด
- ชาเลนจ์ (challenge): ภารกิจอย่างตามรอยคาเฟ่ 5 ร้าน หรือวิ่งให้ครบ 3 สวน ไปครบแล้วได้ XP เหรียญ และของรางวัลจากพาร์ตเนอร์
- โมเมนต์ (moment): รูปและเรื่องราวจากการออกไป ที่สมาชิกแชร์ให้เพื่อนๆ ดู

## Main pages

- [ตี้ที่เปิดรับ](${SITE_URL}/community): meetups open to join, by province and category
- [อีเวนต์](${SITE_URL}/events): runs, concerts, expos and other events, soonest first
- [ที่เที่ยว](${SITE_URL}/spots): places across Thailand by province and vibe
- [ชาเลนจ์](${SITE_URL}/challenges): challenges with XP, badges and rewards
- [โมเมนต์](${SITE_URL}/moments): photos and stories members shared

## About

- [เกี่ยวกับ Chillwaa](${SITE_URL}/about): what Chillwaa is, the name, and how one outing works
- [คู่มือความปลอดภัย](${SITE_URL}/safety): safety rules for meetups
- [ข้อตกลงและนโยบาย](${SITE_URL}/legal): terms of use and privacy policy

## Optional

- [Sitemap](${SITE_URL}/sitemap.xml): every public meetup, event, place, challenge and moment page
`;

export function GET() {
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
