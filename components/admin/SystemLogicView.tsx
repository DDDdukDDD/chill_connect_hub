'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { AdminPageHeader, AdminBadge } from './AdminUI';
import { FOR_YOU_WEIGHTS as W, POPULAR_WEIGHTS as P } from '@/lib/moments/forYou';
import { SEEN_BATCH, SEEN_LOOK_MS } from '@/lib/moments/seenTracker';

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

const TOPICS: Topic[] = [
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
