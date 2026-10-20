import type { Metadata } from 'next';
import { MASTER_77_PROVINCES } from '@/data/masterHub';
import { ONLINE, type DiscoverKind } from '@/lib/discoverMatch';
import { pageMetadata } from '@/lib/site';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGES: Record<DiscoverKind, {
  path: string;
  title: string;
  description: string;
  inProvince: (province: string) => { title: string; description: string };
}> = {
  meetups: {
    path: '/community',
    title: 'ตี้หาเพื่อนไปทำกิจกรรมด้วยกัน',
    description: 'รวมตี้ที่เปิดรับอยู่ วิ่ง คาเฟ่ บอร์ดเกม เวิร์กช็อป ฮีลใจ และอีกมาก เลือกตามสายที่ชอบ แล้วไปเจอเพื่อนใหม่ที่งานจริง',
    inProvince: (p) => p === ONLINE
      ? { title: 'ตี้ออนไลน์ หาเพื่อนทำกิจกรรมด้วยกัน', description: 'รวมตี้ออนไลน์ที่เปิดรับอยู่ เลือกตามสายที่ชอบ แล้วเจอเพื่อนใหม่ได้จากที่บ้าน' }
      : { title: `ตี้ใน${p} หาเพื่อนไปทำกิจกรรมด้วยกัน`, description: `รวมตี้ที่เปิดรับอยู่ใน${p} วิ่ง คาเฟ่ บอร์ดเกม เวิร์กช็อป และอีกมาก เลือกตามสายที่ชอบ แล้วไปเจอเพื่อนใหม่ที่งานจริง` },
  },
  fairs: {
    path: '/fairs',
    title: 'งานแฟร์ งานวิ่ง งานคอนเสิร์ต ช่วงนี้',
    description: 'ปฏิทินงานแฟร์ งานวิ่ง คอนเสิร์ต และนิทรรศการที่กำลังจัดและเร็วๆ นี้ พร้อมวันที่ สถานที่ และลิงก์ผู้จัดงาน',
    inProvince: (p) => ({ title: `งานแฟร์ งานวิ่ง งานคอนเสิร์ตใน${p} ช่วงนี้`, description: `ปฏิทินงานแฟร์ งานวิ่ง คอนเสิร์ต และนิทรรศการใน${p} ที่กำลังจัดและเร็วๆ นี้ พร้อมวันที่ สถานที่ และลิงก์ผู้จัดงาน` }),
  },
  spots: {
    path: '/spots',
    title: 'ที่เที่ยว คาเฟ่ และที่ชิลทั่วไทย',
    description: 'ค้นหาที่เที่ยว คาเฟ่ สวน พิพิธภัณฑ์ และจุดชมวิวทั่วไทย ตามจังหวัดและสายที่ชอบ พร้อมเวลาเปิด ราคา และการเดินทาง',
    inProvince: (p) => ({ title: `ที่เที่ยว คาเฟ่ และที่ชิลใน${p}`, description: `ที่เที่ยว คาเฟ่ สวน พิพิธภัณฑ์ และจุดชมวิวใน${p} ตามสายที่ชอบ พร้อมเวลาเปิด ราคา และการเดินทาง` }),
  },
};

/**
 * Title, description and canonical URL for a ค้นพบ page. A picked province ("?province=เชียงใหม่") gets its own
 * title and canonical URL so "ตี้ในเชียงใหม่" can rank; only known province names count, so a made-up value
 * cannot put its own text into the title. The search word (?q=) never goes into the title.
 */
export async function discoverMetadata(kind: DiscoverKind, searchParams: SearchParams): Promise<Metadata> {
  const page = PAGES[kind];
  const raw = (await searchParams).province;
  const province = typeof raw === 'string' ? raw.trim() : '';
  const known = MASTER_77_PROVINCES.includes(province) || (kind === 'meetups' && province === ONLINE);
  if (!known) return pageMetadata({ title: page.title, description: page.description, path: page.path });
  return pageMetadata({ ...page.inProvince(province), path: `${page.path}?province=${encodeURIComponent(province)}` });
}
