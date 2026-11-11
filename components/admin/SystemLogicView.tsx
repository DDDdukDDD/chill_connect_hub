'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { AdminPageHeader, AdminBadge } from './AdminUI';
import { FOR_YOU_WEIGHTS as W, POPULAR_WEIGHTS as P } from '@/lib/moments/forYou';
import { SEEN_BATCH, SEEN_LOOK_MS } from '@/lib/moments/seenTracker';
import { HOME_FEED_PAGE_SIZE } from '@/lib/moments/types';
import { ACHIEVEMENTS_ROW_MAX, ACHIEVEMENTS_WINDOW_DAYS, FRIENDS_GOING_MAX, HOME_FEED_LOAD_AHEAD_PX, INVITE_MAX_FRIENDS, INVITE_SENDS_PER_HOUR, PLAN_TOGETHER_POINTS } from '@/lib/social/socialRules';
import { MAX_OPEN_SPOT_TRIPS, SPOT_TRIP_EARLIEST, SPOT_TRIP_LATEST, SPOT_TRIP_MAX_PEOPLE, SPOT_TRIP_MIN_PEOPLE, SPOT_TRIP_TRANSPORT, TRIP_CANCEL_BEFORE_MS } from '@/lib/spotTripRules';

/**
 * "วิธีคิดของระบบ": the rules behind the site that staff should be able to look up (owner 2026-11-09). Read only.
 * Numbers come from the code itself (e.g. FOR_YOU_WEIGHTS), so this page cannot drift from what the site does.
 * To add a topic: add one entry to TOPICS, and keep its numbers imported, not typed in.
 */

interface Topic {
  id: string;
  title: string;
  summary: string;
  /** When and in which change it was last made to work this way */
  updated: string;
  body: React.ReactNode;
  files: string[];
}

const fmt = (n: number) => (n > 0 ? `+${n}` : String(n));

function WeightTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr>
            <th className="px-3 py-2 font-semibold">ส่วนของคะแนน</th>
            <th className="px-3 py-2 font-semibold whitespace-nowrap">คะแนน</th>
            <th className="px-3 py-2 font-semibold">คิดอย่างไร</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(([part, points, how]) => (
            <tr key={part} className="align-top">
              <td className="px-3 py-2 font-semibold text-slate-800 whitespace-nowrap">{part}</td>
              <td className="px-3 py-2 tabular-nums text-slate-800 whitespace-nowrap">{points}</td>
              <td className="px-3 py-2 text-slate-600">{how}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const H = ({ children }: { children: React.ReactNode }) => <h3 className="text-sm font-bold text-slate-900 mt-5 mb-2">{children}</h3>;
const List = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

/** A link to a topic further down this page */
const See = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <a href={`#logic-${id}`} className="font-semibold text-[#2563EB] hover:underline underline-offset-4">
    {children}
  </a>
);

function FeatureTable({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-slate-100">
          {rows.map(([name, how]) => (
            <tr key={name} className="align-top">
              <td className="px-3 py-2 font-semibold text-slate-800 whitespace-nowrap">{name}</td>
              <td className="px-3 py-2 text-slate-600">{how}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TOPICS: Topic[] = [
  {
    id: 'features',
    title: 'ฟีเจอร์สำคัญของ Chillwaa',
    summary: 'ภาพรวมทุกส่วนหลักของเว็บ ทำงานอย่างไรในบรรทัดเดียว หัวข้อที่มีรายละเอียดกดไปดูต่อได้',
    updated: '10 พ.ย. 2569 · BE-333',
    files: ['docs/PRODUCT_DIRECTION.md', 'docs/FEED_PLAN.md', 'docs/API.md', 'ARCHITECTURE.md'],
    body: (
      <>
        <p className="text-sm text-slate-700">
          หลักคิดของทั้งเว็บ: <strong>ทำให้ทุกการใช้ชีวิตมีความหมาย</strong> ทุกส่วนจึงพาคนออกไปเจอกันจริง แล้วกลับมาเล่าเป็นโมเมนต์ นับเป็นชาเลนจ์ ได้ XP และของรางวัล
        </p>
        <H>เสาหลัก: ตี้ + ชาเลนจ์ + โมเมนต์</H>
        <FeatureTable
          rows={[
            ['ตี้ (/community)', 'สมาชิกเปิดนัดทำกิจกรรมด้วยกัน มีวัน เวลา จุดนัด และจำนวนคน ปิดรับเมื่อถึงเวลาเริ่ม เต็มแล้วต่อคิวได้ มีที่ว่างจะกันที่ให้คนในคิว โฮสต์เปลี่ยนวันเวลาหรือที่นัด คนที่สมัครไว้ได้แจ้งเตือน'],
            ['ชาเลนจ์ (/challenges)', 'ภารกิจหลายขั้น ไปตี้ ไปอีเวนต์ หรือไปที่เที่ยวแล้วโพสต์โมเมนต์ที่นั่น นับเป็นการไปจริง ครบแล้วได้ XP และเหรียญ รูปที่ต้องตรวจ ทีมงานอนุมัติก่อนจึงนับ'],
            ['โมเมนต์ (/moments)', <>รูปหรือคลิปสั้นจากที่ที่ไปมา ผูกกับตี้ อีเวนต์ ที่เที่ยว หรือชาเลนจ์ได้ ฟีดเรียงตาม <See id="for-you">สำหรับคุณ</See> และ <See id="popular">ยอดฮิต</See></>],
          ]}
        />
        <H>ส่วนที่ช่วยพาไป</H>
        <FeatureTable
          rows={[
            ['อีเวนต์ (/events)', 'งานจากผู้จัดหรือสถานที่ทางการ เช่น งานแฟร์ งานวิ่ง คอนเสิร์ต ไม่แสดงจำนวนคนไปและไม่มีการรับสมัคร งานที่จบแล้วซ่อนจากหน้าแรก'],
            ['ที่เที่ยว (/spots)', <>สถานที่แบ่งตามสาย ชวนเพื่อนไปด้วยกันได้ผ่าน <See id="spot-trips">ทริป Spot Buddy</See> เฉพาะที่ที่ทีมงานเปิดให้</>],
            ['แคมเปญและของรางวัล', 'ทำภารกิจในแคมเปญเพื่อลุ้นรางวัล จับรางวัลแล้วประกาศผล ผู้โชคดีต้องยืนยันรับรางวัลในเวลาที่กำหนด XP ใช้แลกของรางวัลได้'],
          ]}
        />
        <H>ส่วนสังคม (เหตุผลให้กลับมาทุกวัน)</H>
        <FeatureTable
          rows={[
            ['เพื่อนๆ กำลังออกไปใช้ชีวิต', <>แถววงกลมเหนือฟีดหน้าแรก แทนสตอรี่ บอกว่าใครทำชาเลนจ์ครบหรือกำลังทำ ดู <See id="achievements">รายละเอียด</See></>],
            ['บรรทัดชาเลนจ์ใต้โพสต์', <>&quot;พิชิตชาเลนจ์ … 2/3&quot; คิดครั้งเดียวตอนโพสต์ ดู <See id="achievement-line">รายละเอียด</See></>],
            ['ไปกันไหม', <>ส่งโพสต์ชวนเพื่อนไปด้วยกัน เพื่อนตอบ &quot;ไปด้วย&quot; ได้ และเพื่อนได้ข่าวเมื่อเราเข้าตี้ ดู <See id="invites">รายละเอียด</See></>],
            ['ติดตามและการแจ้งเตือน', <>ติดตามกันได้ ติดตามกันสองฝ่ายนับเป็นเพื่อน การแจ้งเตือนเก็บในฐานข้อมูล ส่งเข้ามือถือได้ (PWA) บรรทัด <See id="liked-by">ถูกใจโดย…</See> โชว์เฉพาะคนที่เราติดตาม</>],
          ]}
        />
        <H>ความปลอดภัยและระบบ</H>
        <FeatureTable
          rows={[
            ['เข้าสู่ระบบ', 'LINE, Google, Facebook หรืออีเมล สิทธิ์แอดมินเซิร์ฟเวอร์ตัดสินเอง ไม่เชื่อค่าที่ส่งมาจากเครื่องผู้ใช้'],
            ['กันมิจฉาชีพ', 'โพสต์ได้เฉพาะสมาชิกที่ยืนยันตัวตนแล้ว บัญชีใหม่มีโควตาต่อวันและห้ามใส่ช่องทางติดต่อ รายงานโพสต์ได้ บล็อกกันได้'],
            ['หน้าแรกของสมาชิก', <>ฟีดหน้าแรกมาพร้อมหน้าเว็บ ไม่ต้องรอโหลด ดู <See id="home-feed">รายละเอียด</See></>],
          ]}
        />
      </>
    ),
  },
  {
    id: 'for-you',
    title: 'ฟีดโมเมนต์ "สำหรับคุณ"',
    summary: 'ลำดับโพสต์ในแท็บแรกของฟีดหน้าแรก (สมาชิก) และแท็บ "ทั้งหมด" ของ /moments (ทุกคนเห็นเหมือนกัน)',
    updated: '9 พ.ย. 2569 · BE-327',
    files: ['lib/moments/forYou.ts', 'lib/moments/service.ts', 'lib/moments/seenTracker.ts', 'app/api/moments/seen/route.ts', 'docs/FEED_PLAN.md'],
    body: (
      <>
        <p className="text-sm text-slate-700">
          หลักคิด: ฟีดที่ดีของเราคือฟีดที่<strong>พาคนออกไปจริง</strong> ไม่ใช่ฟีดที่ดึงเวลาไปเฉยๆ โพสต์ที่ยังพาไปตี้ ชาเลนจ์ อีเวนต์ หรือสถานที่ได้ จึงได้คะแนนเพิ่ม
        </p>

        <H>1. เลือกโพสต์มาจัดลำดับ</H>
        <List
          items={[
            `เอาโพสต์ที่เผยแพร่อยู่ ${W.poolSize} โพสต์ล่าสุด ไม่รวมโพสต์ที่ถูกซ่อน ของคนที่ถูกแบน และของคนที่เราบล็อก`,
            `เลื่อนจนครบ ${W.poolSize} โพสต์แล้ว ฟีดจะเรียงจากใหม่ไปเก่าต่อเอง`,
            'ทุกหน้าของฟีดคิดจากช่วงเวลาเดียวกับหน้าแรก โพสต์จึงไม่ซ้ำหรือหายระหว่างหน้า กลับมาเปิดใหม่ถึงจะคิดใหม่',
          ]}
        />

        <H>2. ให้คะแนนแต่ละโพสต์ (บวกกันทุกส่วน)</H>
        <WeightTable
          rows={[
            ['ความใหม่', `สูงสุด ${W.freshMax}`, `โพสต์เพิ่งลงได้ ${W.freshMax} คะแนน แล้วลดลงครึ่งหนึ่งทุก ${W.freshHalfLifeH} ชั่วโมง`],
            [
              'การมีส่วนร่วม',
              'ไม่มีเพดาน (โตช้า)',
              `บันทึก ×${W.save}, คอมเมนต์ ×${W.comment}, ไลก์ ×${W.like} รวมกันแล้วใส่ log จากนั้นหารด้วยรากที่สองของ (1 + อายุโพสต์เป็นวัน) โพสต์ดังแต่เก่าจึงไม่ครองฟีด`,
            ],
            ['ติดตามคนโพสต์', fmt(W.following), 'เราติดตามคนโพสต์อยู่'],
            ['ติดตามกันทั้งสองฝ่าย', fmt(W.mutual), 'บวกเพิ่มจากข้อบน เมื่อเขาติดตามเรากลับ'],
            ['เคยโต้ตอบกัน', `${fmt(W.affinityEach)} ต่อครั้ง`, `ทุกไลก์หรือคอมเมนต์ที่เราให้โพสต์ของเขาใน 90 วัน นับสูงสุด ${W.affinityCap} ครั้ง`],
            ['ตรงความสนใจ', fmt(W.interest), 'หมวดของโมเมนต์ หรือหมวดของตี้ อีเวนต์ หรือสถานที่ที่ผูกอยู่ ตรงกับสายที่เลือกตอน onboarding'],
            ['ยังไปได้จริง', fmt(W.joinable), 'ผูกกับตี้ที่ยังรับคน (ยังไม่เริ่ม ไม่เต็ม เปิดรับอยู่), ชาเลนจ์ที่ยังเปิด หรืออีเวนต์ที่ยังไม่จบ'],
            ['สถานที่', `${fmt(W.placeInProvince)} / ${fmt(W.placeElsewhere)}`, `ผูกกับสถานที่ในจังหวัดของเรา ${fmt(W.placeInProvince)} ถ้าอยู่จังหวัดอื่น ${fmt(W.placeElsewhere)}`],
            ['เห็นแล้ว', fmt(W.seen), 'เราเคยเห็นโพสต์นี้ใน 30 วันที่ผ่านมา จึงตกลงไปท้ายๆ'],
          ]}
        />
        <p className="text-xs text-slate-500 mt-2">โพสต์ของเราเองไม่ได้คะแนนความใกล้ชิด คนที่ยังไม่ล็อกอิน (และแท็บ ทั้งหมด ใน /moments) ได้แค่ความใหม่ การมีส่วนร่วม และ ยังไปได้จริง</p>

        <H>3. จัดให้หลากหลาย</H>
        <List
          items={[
            `เรียงตามคะแนน แล้วไล่เลือกทีละโพสต์ โดยมองล่วงหน้า ${W.lookAhead} โพสต์`,
            'คนเดียวกันไม่ขึ้นติดกัน ถ้าในช่วงนั้นมีโพสต์ของคนอื่นให้เลือก',
            'คลิปกับรูปสลับกัน ถ้าในช่วงนั้นมีอีกแบบให้เลือก',
          ]}
        />

        <H>4. การจำว่าเห็นแล้ว</H>
        <List
          items={[
            `นับว่าเห็นเมื่อโพสต์อยู่บนจออย่างน้อยครึ่งหนึ่งนานเกิน ${SEEN_LOOK_MS / 1000} วินาที (เฉพาะสมาชิก ไม่นับโพสต์ของตัวเอง)`,
            `เครื่องส่งเป็นชุดทุก ${SEEN_BATCH} โพสต์ ตอนสลับแท็บหรือปิดหน้า และตอนออกจากฟีด ไม่เขียนลงฐานข้อมูลทุกครั้งที่เห็น`,
            'เก็บในตาราง app.moment_seen นาน 30 วันแล้วลบ',
          ]}
        />

        <H>อยากปรับลำดับ</H>
        <p className="text-sm text-slate-700">
          ตัวเลขทั้งหมดในหน้านี้มาจาก <code className="text-xs bg-slate-100 rounded px-1 py-0.5">FOR_YOU_WEIGHTS</code> ใน lib/moments/forYou.ts แก้ที่นั่นที่เดียว หน้านี้จะเปลี่ยนตาม
        </p>
      </>
    ),
  },
  {
    id: 'popular',
    title: 'แท็บ "ยอดฮิต"',
    summary: 'โพสต์ที่คนกำลังสนใจตอนนี้ ไม่ใช่โพสต์ที่ไลก์เยอะที่สุดตลอดกาล',
    updated: '9 พ.ย. 2569 · BE-328',
    files: ['lib/moments/forYou.ts', 'lib/moments/pgMomentRepository.ts'],
    body: (
      <>
        <List
          items={[
            `คะแนนดิบ = บันทึก ×${P.save} + คอมเมนต์ ×${P.comment} + ไลก์ ×${P.like}`,
            `หารด้วย (อายุโพสต์เป็นชั่วโมง + ${P.offsetH}) ยกกำลัง ${P.gravity} โพสต์ใหม่ที่คนชอบจึงแซงโพสต์ดังที่เก่าได้ภายในไม่กี่ชั่วโมง`,
            'คะแนนเท่ากัน (เช่น ยังไม่มีใครกดเลย) เรียงจากใหม่ไปเก่า',
          ]}
        />
        <p className="text-sm text-slate-700 mt-3">
          ตัวเลขมาจาก <code className="text-xs bg-slate-100 rounded px-1 py-0.5">POPULAR_WEIGHTS</code> ใน lib/moments/forYou.ts
        </p>
      </>
    ),
  },
  {
    id: 'liked-by',
    title: 'ใครเห็นว่าใครกดถูกใจ',
    summary: 'บรรทัด "ถูกใจโดย … และอีก N คน" ใต้โพสต์ในฟีด และรายชื่อคนกดถูกใจ',
    updated: '10 พ.ย. 2569 · BE-328',
    files: ['lib/moments/pgMomentRepository.ts', 'lib/moments/service.ts', 'app/api/moments/[id]/likes/route.ts'],
    body: (
      <List
        items={[
          'ใต้โพสต์ขึ้นชื่อได้คนเดียว คือคนล่าสุดที่กดถูกใจ และต้องเป็นคนที่ผู้อ่านติดตามอยู่แล้ว คนแปลกหน้าไม่ขึ้นชื่อ',
          'ไม่ขึ้นชื่อคนที่ถูกแบน หรือคนที่ผู้อ่านบล็อก',
          'ถ้าเจ้าของโพสต์ปิดยอดถูกใจ จะไม่มีบรรทัดนี้เลย',
          'รายชื่อคนกดถูกใจทั้งหมด เปิดดูได้เฉพาะเจ้าของโพสต์ (7 พ.ย. 2569)',
        ]}
      />
    ),
  },
  {
    id: 'achievements',
    title: 'แถว "เพื่อนๆ กำลังออกไปใช้ชีวิต"',
    summary: 'วงกลมเหนือฟีดหน้าแรก ตรงที่แอปอื่นมีสตอรี่ (เจ้าของ 10 พ.ย. 2569: ไม่ทำสตอรี่ ให้โชว์ว่าใครออกไปทำอะไรสำเร็จ)',
    updated: '10 พ.ย. 2569 · BE-332, BE-333',
    files: ['lib/social/achievementsRow.ts', 'lib/social/socialRules.ts', 'components/home/AchievementsRow.tsx', 'app/api/achievements/route.ts'],
    body: (
      <>
        <H>มาจากไหน</H>
        <List
          items={[
            'ชาเลนจ์ที่ทำครบ (ข้อมูลสาธารณะอยู่แล้วในหน้าชาเลนจ์ "ใครทำอยู่บ้าง")',
            <>โพสต์ที่มี <See id="achievement-line">บรรทัดชาเลนจ์</See> เช่น 2/3</>,
            `นับเฉพาะ ${ACHIEVEMENTS_WINDOW_DAYS} วันล่าสุด`,
          ]}
        />
        <H>เลือกและเรียงอย่างไร</H>
        <List
          items={[
            'หนึ่งวงต่อหนึ่งคน ถ้ามีหลายอย่าง ทำครบชนะกำลังทำ แล้วเอาอันล่าสุด',
            'เรียง: ตัวเราก่อน ตามด้วยเพื่อนที่ติดตามกันสองฝ่าย คนที่เราติดตาม แล้วคนอื่นๆ',
            `โชว์สูงสุด ${ACHIEVEMENTS_ROW_MAX} วง ไม่มีใครเลยก็ไม่ขึ้นแถว`,
            'ไม่โชว์คนที่ถูกแบน คนที่เราบล็อก หรือคนที่บล็อกเรา',
          ]}
        />
        <H>หน้าตาและการกด</H>
        <List
          items={[
            'วงทองมีถ้วย = ทำชาเลนจ์ครบ (กดแล้วไปหน้าชาเลนจ์) · วงม่วงมีตัวเลข = กำลังทำ (กดแล้วไปโพสต์นั้น กดย้อนกลับมาที่ฟีดตำแหน่งเดิม)',
            'อยู่ใต้หัวฟีดและแท็บ เหนือช่องโพสต์ เพราะคนดูว่าเพื่อนทำอะไรบ่อยกว่าโพสต์เอง และโชว์เฉพาะแท็บหลัก',
            'มาพร้อมหน้าเว็บจากเซิร์ฟเวอร์ ไม่โผล่ทีหลังแล้วดันโพสต์ลง รายการรวมของทุกคนคิดใหม่อย่างมากนาทีละครั้ง',
          ]}
        />
      </>
    ),
  },
  {
    id: 'achievement-line',
    title: 'บรรทัดชาเลนจ์ใต้โพสต์',
    summary: '"พิชิตชาเลนจ์ … 2/3" หรือ "… · ครบแล้ว" ใต้โพสต์ที่นับเป็นการไปจริงของชาเลนจ์',
    updated: '10 พ.ย. 2569 · BE-331',
    files: ['lib/social/achievement.ts', 'app/api/moments/route.ts', 'components/moments/AchievementLine.tsx', 'db/migrations/0040_moment_achievement.sql'],
    body: (
      <List
        items={[
          'คิดครั้งเดียวตอนกดโพสต์ แล้วเก็บไว้กับโพสต์ (คอลัมน์ moments.achievement) ฟีดไม่ต้องไปอ่านความคืบหน้าของใครเลย จึงประหยัดฐานข้อมูล',
          'ขึ้นเมื่อ: โพสต์ผูกกับตี้ อีเวนต์ หรือที่เที่ยว คนโพสต์เข้าร่วมชาเลนจ์ที่นับที่นั้นอยู่ และมีความคืบหน้าแล้วอย่างน้อย 1 ขั้น',
          'ตัวเลขคือความคืบหน้า ณ ตอนโพสต์ ไม่เปลี่ยนตามทีหลัง',
          'รูปที่ยังรอทีมงานตรวจ ยังไม่นับ จึงไม่มีบรรทัด ถ้าทีมงานไม่ผ่านรูปทีหลัง บรรทัดจะหายไป',
          'โพสต์ที่มีบรรทัดนี้ป้อนเข้าแถว "เพื่อนๆ กำลังออกไปใช้ชีวิต" ด้วย',
        ]}
      />
    ),
  },
  {
    id: 'invites',
    title: '"ชวนไป" แผนไปกันเป็นกลุ่ม และ "เพื่อนจะไปตี้นี้"',
    summary: 'ชวนเพื่อนที่รู้จักไปทำกิจกรรมจริง จากทุกหมวด (เจ้าของ 10-11 พ.ย. 2569)',
    updated: '11 พ.ย. 2569 · BE-346',
    files: ['lib/social/friendPlans.ts', 'lib/social/friendPlanStore.ts', 'lib/social/inviteLinks.ts', 'app/api/invites/route.ts', 'app/api/invites/answer/route.ts', 'components/invites/InviteSheet.tsx', 'components/invites/InviteBanner.tsx', 'components/myhub/FriendPlans.tsx'],
    body: (
      <>
        <H>ชวนไป (ทุกหมวด)</H>
        <List
          items={[
            'ปุ่ม "ชวนไป" อยู่ในโพสต์ ที่เที่ยว อีเวนต์ ตี้ และชาเลนจ์ ใช้หน้าต่างเดียวกัน เลือกเพื่อนได้หลายคนพร้อมกัน หรือส่งลิงก์ทาง LINE',
            `ชวนได้เฉพาะเพื่อน (ติดตามกันสองฝ่าย ไม่ได้บล็อกกัน) แผนหนึ่งมีเพื่อนได้ไม่เกิน ${INVITE_MAX_FRIENDS} คน (ไม่นับคนชวน) ส่งได้ไม่เกิน ${INVITE_SENDS_PER_HOUR} ครั้งต่อชั่วโมง`,
            'ชวนครั้งแรกเกิดแผนของคนชวน ชวนที่เดิมอีกก็เพิ่มคนเข้าแผนเดิม (ถ้าวันนัดยังไม่ผ่าน) ทุกคนที่ตอบ "ไปกัน" อยู่ในแผนเดียวและแชตกลุ่มเดียว',
            'แจ้งเตือนและลิงก์ LINE เปิดหน้ารายการนั้นพร้อมคำชวนที่มีลายเซ็นของระบบ หน้าแสดงว่าใครชวนและไปกันแล้วกี่คน ตอบ "ไปกัน" ได้ในแตะเดียว แก้ลิงก์เองหรือตอบลิงก์ของตัวเองไม่ได้',
            'คนที่ตอบผ่านลิงก์ LINE (ไม่ได้ถูกชวนในแอป) ติดตามคนชวนให้อัตโนมัติ',
            'ลิงก์ใน LINE เป็นลิงก์สั้น chillwaa.com/i/รหัส การ์ดตัวอย่างบอกว่าใครชวนไปไหน พร้อมรูปของที่นั้น',
            'ยังไม่มีบัญชีแล้วกด "ไปกัน": ขึ้นหน้าสมัครที่บอกว่าใครรอคำตอบ สมัครด้วย LINE ได้ในครั้งเดียว คำชวนติดไปกับการสมัคร สมาชิกใหม่รับแค่คำมั่นความปลอดภัย แล้วระบบตอบ "ไปกัน" ให้และเปิดแชตของแผน คำถามแนะนำตัวที่เหลือถามตอนเข้าสู่ระบบครั้งถัดไป',
            'ตี้ไม่มีแผนแยก เพราะมีวัน ที่นั่ง และแชตของตี้อยู่แล้ว คำชวนบอกแค่ว่าใครชวน แล้วพาไปลงทะเบียนตี้ตามปกติ',
            'อีเวนต์เลือกวันนัดได้เฉพาะวันที่อยู่ในช่วงงาน ชาเลนจ์ ("ทำด้วยกัน") ตอบแล้วเข้าร่วมชาเลนจ์ให้ด้วย',
            'แผนขึ้นในมายฮับ (แผนไปกันกับเพื่อน): คนที่ยังไม่ตอบกด "ตอบคำชวน" ได้ คนในแผนคุยต่อใน LINE หรือแชตกลุ่ม เลือกวัน และชวนเพิ่มได้ เจ้าของแผนยกเลิกได้ทั้งแผน คนอื่นออกจากแผนได้',
            'วันก่อนนัด ทุกคนในแผนได้แจ้งเตือน วันหลังนัด (ภายใน 7 วัน) คนที่ยังไม่ได้โพสต์ได้แจ้งเตือนชวนโพสต์ที่นั่น โดยแท็กเพื่อนไว้ให้แล้ว',
            `โพสต์ที่สถานที่ของแผนหลังสร้างแผน และมีอีกอย่างน้อยหนึ่งคนในแผนโพสต์ด้วย = ไปด้วยกัน ได้โบนัสไปกับเพื่อน ${PLAN_TOGETHER_POINTS} XP ครั้งเดียวต่อแผน เมื่อโพสต์ของตัวเองผ่านการยืนยัน`,
          ]}
        />
        <H>เพื่อนจะไปตี้นี้</H>
        <List
          items={[
            `เมื่อสมาชิกเข้าตี้ เพื่อน (ติดตามกันสองฝ่าย) ได้แจ้งเตือน "จะไปตี้นี้ ไปด้วยกันไหม?" สูงสุด ${FRIENDS_GOING_MAX} คน`,
            'ไม่แจ้งโฮสต์ (โฮสต์ได้แจ้งเตือน "เข้าร่วมตี้ของคุณแล้ว" อยู่แล้ว) หนึ่งแจ้งเตือนต่อเพื่อนต่อตี้',
            'ส่งหลังตอบผู้ใช้แล้ว การกดเข้าตี้จึงไม่ช้าลง ใครเข้าตี้ไหนเป็นข้อมูลสาธารณะในหน้าตี้อยู่แล้ว',
          ]}
        />
      </>
    ),
  },
  {
    id: 'home-feed',
    title: 'ฟีดหน้าแรกโหลดอย่างไร',
    summary: 'ทำให้ฟีดลื่นระดับแอปดัง โดยไม่เปลืองฐานข้อมูล',
    updated: '10 พ.ย. 2569 · BE-333',
    files: ['app/page.tsx', 'components/home/HomeMomentFeed.tsx', 'components/moments/momentsReturn.ts', 'components/moments/useClamped.ts', 'lib/social/socialRules.ts'],
    body: (
      <List
        items={[
          `โพสต์ชุดแรก (${HOME_FEED_PAGE_SIZE} โพสต์ของ "สำหรับคุณ") กับแถวเพื่อน มาพร้อมหน้าเว็บจากเซิร์ฟเวอร์ ไม่มีกรอบเทารอ และเบราว์เซอร์ไม่ต้องขอซ้ำ`,
          `ชุดถัดไปเริ่มโหลดก่อนถึงท้ายฟีด ${HOME_FEED_LOAD_AHEAD_PX} px (ราว 3 โพสต์) เลื่อนเร็วแค่ไหนก็ไม่เจอท้ายเว็บดีดหนี`,
          'กดออกจากฟีด (โพสต์ คลิป โปรไฟล์ ที่เที่ยว วงในแถวเพื่อน) แล้วย้อนกลับ ฟีดอยู่ตำแหน่งเดิมพร้อมโพสต์ที่โหลดไว้ (เก็บในแท็บนั้นของเบราว์เซอร์)',
          'แคปชันโชว์ 2 บรรทัด "ดูเพิ่มเติม" ขึ้นเฉพาะเมื่อข้อความถูกตัดจริงบนจอนั้น',
          'สิ่งที่เก็บไว้ในเบราว์เซอร์มาจากข้อมูลของระบบเท่านั้น ไม่อ่านค่าจากหน้าเว็บ (กันช่องโหว่ XSS ที่ CodeQL เตือน)',
        ]}
      />
    ),
  },
  {
    id: 'spot-trips',
    title: 'ทริป Spot Buddy (ชวนไปที่เที่ยว)',
    summary: 'การนัดคนแปลกหน้านอกงานทางการ เสี่ยงที่สุดที่เว็บอนุญาต กฎจึงอยู่ที่เซิร์ฟเวอร์ ฟอร์มแค่ทำตาม',
    updated: 'กฎจาก lib/spotTripRules.ts',
    files: ['lib/spotTripRules.ts', 'lib/social/spotTrips.ts', 'lib/social/tripAutoCancel.ts', 'components/SpotBuddyGatheringModal.tsx'],
    body: (
      <List
        items={[
          'เปิดได้เฉพาะที่เที่ยวที่ทีมงานเปิดให้นัด (meetupAllowed)',
          `คน ${SPOT_TRIP_MIN_PEOPLE}–${SPOT_TRIP_MAX_PEOPLE} คน นัดช่วงกลางวัน ${SPOT_TRIP_EARLIEST}–${SPOT_TRIP_LATEST} น.`,
          `เจอกันที่สถานที่เท่านั้น: ${SPOT_TRIP_TRANSPORT} ไม่มีการติดรถกัน ไม่มีช่องทางติดต่อส่วนตัว`,
          `เปิดทริปที่ยังไม่จบได้พร้อมกันไม่เกิน ${MAX_OPEN_SPOT_TRIPS} ทริปต่อคน`,
          `ถ้าคนยังไม่ครบ ${SPOT_TRIP_MIN_PEOPLE} คนก่อนเวลานัด ${TRIP_CANCEL_BEFORE_MS / 3_600_000} ชั่วโมง ทริปยกเลิกเอง และทุกคนได้แจ้งเตือน`,
        ]}
      />
    ),
  },
];

export function SystemLogicView() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={BookOpen}
        title="วิธีคิดของระบบ"
        description="กฎสำคัญที่อยู่เบื้องหลังเว็บ เขียนไว้ให้ทีมเปิดดูได้ ตัวเลขดึงจากโค้ดจริง"
        badge={<AdminBadge>ดูอย่างเดียว</AdminBadge>}
      />

      {TOPICS.length > 1 && (
        <nav aria-label="หัวข้อ" className="flex flex-wrap gap-2">
          {TOPICS.map((topic) => (
            <a key={topic.id} href={`#logic-${topic.id}`} className="h-8 px-3 rounded-full border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center">
              {topic.title}
            </a>
          ))}
        </nav>
      )}

      {TOPICS.map((topic) => (
        <section key={topic.id} id={`logic-${topic.id}`} className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs scroll-mt-24">
          <h2 className="text-lg font-bold text-slate-900">{topic.title}</h2>
          <p className="text-sm text-slate-600 mt-1">{topic.summary}</p>
          <p className="text-xs text-slate-500 mt-1">ปรับล่าสุด {topic.updated}</p>
          <div className="mt-4">{topic.body}</div>
          <H>ไฟล์ที่เกี่ยวข้อง</H>
          <ul className="flex flex-wrap gap-1.5">
            {topic.files.map((file) => (
              <li key={file}>
                <code className="text-xs bg-slate-100 text-slate-700 rounded px-1.5 py-0.5">{file}</code>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
