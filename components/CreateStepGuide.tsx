'use client';

import { ChevronRight, Lightbulb } from 'lucide-react';

/* A worked example for each step of the create dialog: what a good answer looks like,
   and where each answer shows up once the page is live. Closed until the member asks. */

type GuideType = 'community' | 'fair' | 'spot' | 'challenge';
type GuideField = { label: string; example: string | string[]; shows: string };
type Guide = { why: string; fields: GuideField[]; ideas?: { title: string; items: string[] } };

const PHOTO: GuideField = { label: 'รูปปก', example: 'รูปบรรยากาศจริง หรือโปสเตอร์ที่ทำไว้สวยๆ', shows: 'เป็นรูปบนการ์ด สิ่งแรกที่คนเห็นก่อนกดเข้ามา' };

const GUIDES: Record<GuideType, Guide[]> = {
  community: [
    {
      why: 'ชื่อ หมวด และรูป คือสิ่งที่คนเห็นบนการ์ดตี้ ช่วยให้คนที่ชอบแบบเดียวกันเจอตี้ของคุณ',
      fields: [
        { label: 'ชื่อตี้', example: 'วิ่งเช้าสวนเบญจกิติ 5 กม.', shows: 'ขึ้นบนการ์ดและหัวหน้าตี้ บอกให้รู้ว่าทำอะไร ที่ไหน' },
        { label: 'หมวด', example: 'เลือกหมวดที่ใกล้ที่สุดหนึ่งหมวด', shows: 'คนกรองหาตี้ด้วยหมวดนี้' },
        PHOTO,
      ],
    },
    {
      why: 'วัน เวลา และที่นัด ช่วยให้คนตัดสินใจได้ทันทีว่าไปได้ไหม และหากันเจอในวันจริง',
      fields: [
        { label: 'วันและเวลา', example: 'เสาร์ 15 พ.ย. · 06:30 - 08:00', shows: 'ขึ้นบนการ์ดตี้ และในตารางมายฮับของคนที่เข้าร่วม' },
        { label: 'ย่านหรือเขต', example: 'คลองเตย', shows: 'ขึ้นบนการ์ดคู่กับวันที่ ใช้ชื่อสั้นๆ ที่คนรู้จัก' },
        { label: 'สถานที่', example: 'สวนเบญจกิติ', shows: 'เลือกจากรายการได้ คนจะกดไปดูหน้าสถานที่ต่อได้' },
        { label: 'จุดนัดพบ', example: 'หน้าทางเข้าฝั่ง MRT ศูนย์สิริกิติ์ ทางออก 3', shows: 'ให้คนที่ยังไม่รู้จักกันหากันเจอ' },
      ],
    },
    {
      why: 'รายละเอียดช่วยให้คนรู้ว่าตี้นี้เหมาะกับตัวเองไหม ก่อนกดเข้าร่วม',
      fields: [
        { label: 'รายละเอียดกิจกรรม', example: 'วิ่งชิลๆ เพซ 7-8 ไม่ต้องรีบ วิ่งเสร็จไปกินโจ๊กด้วยกัน มือใหม่มาได้ มาคนเดียวก็สบายใจ', shows: 'ขึ้นในหน้าตี้ เล่าบรรยากาศ สิ่งที่จะทำ และเหมาะกับใคร' },
        { label: 'รับกี่คน', example: '6 คน', shows: 'คนจะเห็นว่าเหลือที่ว่างอีกกี่ที่' },
        { label: 'ค่าใช้จ่าย', example: 'ฟรี (ค่าอาหารจ่ายเอง)', shows: 'ขึ้นบนการ์ดและหน้าตี้' },
      ],
    },
  ],
  fair: [
    {
      why: 'ชื่อ ประเภท ผู้จัด และโปสเตอร์ คือสิ่งที่คนเห็นบนการ์ดอีเวนต์',
      fields: [
        { label: 'ชื่องาน', example: 'สัปดาห์หนังสือแห่งชาติ ครั้งที่ 54', shows: 'ขึ้นบนการ์ดและหัวหน้าอีเวนต์ ใช้ชื่อทางการของงาน' },
        { label: 'ผู้จัดงาน', example: 'ชื่อองค์กรหรือทีมที่จัดงานจริง', shows: 'ขึ้นในหน้าอีเวนต์ ให้คนรู้ว่าใครจัด' },
        { label: 'รูปปก', example: 'โปสเตอร์ทางการของงาน', shows: 'แสดงเต็มภาพบนการ์ดอีเวนต์' },
      ],
    },
    {
      why: 'วัน เวลา และสถานที่ ช่วยให้คนวางแผนไปงานได้',
      fields: [
        { label: 'วันงาน', example: '26 มี.ค. - 6 เม.ย.', shows: 'ขึ้นบนการ์ด และใช้เรียงอีเวนต์ตามวันที่' },
        { label: 'เวลาเปิดปิด', example: '10:00 - 21:00', shows: 'ขึ้นในหน้าอีเวนต์ ไม่รู้ก็เว้นไว้ได้' },
        { label: 'สถานที่', example: 'ศูนย์ฯ สิริกิติ์ · ฮอลล์ 5-7 ชั้น LG', shows: 'ขึ้นในหน้าอีเวนต์ ให้คนหาทางไปถูก' },
      ],
    },
    {
      why: 'รายละเอียดบอกว่างานนี้มีอะไรให้ดู และน่าไปตรงไหน',
      fields: [
        { label: 'รายละเอียดงาน', example: 'สำนักพิมพ์กว่า 400 บูธ มีเสวนากับนักเขียนทุกวัน และโซนหนังสือเด็ก', shows: 'ขึ้นในหน้าอีเวนต์ เล่าไฮไลต์และเหมาะกับใคร' },
        { label: 'ค่าบัตร', example: 'เข้าฟรี', shows: 'ขึ้นบนการ์ดอีเวนต์' },
        { label: 'ลิงก์', example: 'เว็บไซต์ทางการหรือหน้าจองบัตร', shows: 'เป็นปุ่มในหน้าอีเวนต์' },
      ],
    },
  ],
  spot: [
    {
      why: 'ชื่อ ประเภท และรูป คือสิ่งที่คนเห็นบนการ์ดสถานที่',
      fields: [
        { label: 'ชื่อสถานที่', example: 'ไร่ชาลุงเดช', shows: 'ขึ้นบนการ์ดและหัวหน้าสถานที่ ใช้ชื่อที่ร้านใช้จริง' },
        { label: 'ประเภท', example: 'เลือกประเภทที่ใกล้ที่สุด', shows: 'คนกรองหาสถานที่ด้วยประเภทนี้' },
        { label: 'รูปปก', example: 'รูปที่คุณถ่ายเอง เห็นบรรยากาศชัด', shows: 'เป็นรูปบนการ์ดและหัวหน้าสถานที่' },
      ],
    },
    {
      why: 'ที่ตั้งและเวลาเปิด ช่วยให้คนไปถึงจริง และไม่เจอร้านปิด',
      fields: [
        { label: 'ที่ตั้ง', example: 'แม่แตง · เชียงใหม่', shows: 'ขึ้นบนการ์ด คนกรองตามจังหวัดได้' },
        { label: 'หมุดบนแผนที่', example: 'ปักให้ตรงทางเข้า', shows: 'ใช้เปิดแผนที่นำทางจากหน้าสถานที่' },
        { label: 'เวลาเปิด', example: 'ทุกวัน 08:00 - 18:00 น.', shows: 'ขึ้นในหน้าสถานที่' },
        { label: 'ช่วงแนะนำ', example: 'ช่วงเช้าที่มีหมอก', shows: 'ขึ้นในหน้าสถานที่ ไม่บังคับ' },
      ],
    },
    {
      why: 'คำเล่าและจุดเด่นทำให้คนอยากไป และรู้ว่าไปแล้วจะได้อะไร',
      fields: [
        { label: 'เล่าเกี่ยวกับสถานที่', example: 'ไร่ชาบนเขา อากาศเย็นทั้งปี นั่งจิบชาอู่หลงมองวิวทะเลหมอกได้ เหมาะกับคนอยากพักใจ', shows: 'ขึ้นในหน้าสถานที่' },
        { label: 'จุดเด่น', example: ['มุมถ่ายรูปแสงเช้า', 'ชาอู่หลงจากไร่'], shows: 'ขึ้นเป็นป้ายสั้นๆ ในหน้าสถานที่' },
      ],
    },
  ],
  challenge: [
    {
      why: 'ชื่อ หมวด และรูป คือสิ่งที่คนเห็นบนการ์ดในหน้าชาเลนจ์ ช่วยให้คนอยากกดเข้ามาดู',
      fields: [
        { label: 'ชื่อชาเลนจ์', example: 'ตะลุย 3 คาเฟ่ย่านอารีย์', shows: 'ขึ้นบนการ์ดและหัวหน้าชาเลนจ์ บอกว่าทำอะไร ที่ไหน กี่ครั้ง' },
        { label: 'หมวด', example: 'เลือกหมวดที่ใกล้ที่สุดหนึ่งหมวด', shows: 'คนกรองหาชาเลนจ์ด้วยหมวดนี้' },
        PHOTO,
      ],
    },
    {
      why: 'ส่วนนี้บอกคนที่เข้าร่วมว่าต้องทำอะไร ทำกี่รอบ และนับอย่างไร',
      fields: [
        { label: 'เป้าหมาย', example: 'ชวนกันไปลองคาเฟ่เล็กๆ ในอารีย์ให้ครบ 3 ร้าน ได้ทั้งกาแฟอร่อยและเดินเล่นย่านน่ารัก', shows: 'ขึ้นเป็นย่อหน้าแรกใน "รายละเอียดชาเลนจ์"' },
        { label: 'ขั้นตอน', example: ['เลือกคาเฟ่ในอารีย์ที่ยังไม่เคยไป', 'สั่งเมนูซิกเนเจอร์ของร้าน', 'ถ่ายรูปแก้วกับร้านแล้วโพสต์โมเมนต์'], shows: 'สิ่งที่ทำใน 1 ครั้ง ขึ้นเป็นข้อๆ ใน "ขั้นตอนการเข้าร่วม"' },
        { label: 'ต้องทำกี่ครั้งจึงสำเร็จ', example: '3', shows: 'ทำตามขั้นตอนข้างบนกี่รอบ คนจะเห็นความคืบหน้า 0/3' },
        { label: 'วิธียืนยันว่าทำแล้ว', example: 'ถ่ายรูปแล้วโพสต์ลงโมเมนต์', shows: 'แต่ละครั้งจะนับเมื่อทำตามวิธีนี้' },
      ],
      ideas: {
        title: 'ไอเดียชาเลนจ์',
        items: [
          'ซ้อมวิ่งก่อนงานวิ่ง: วิ่งอย่างน้อย 3 กม. แล้วโพสต์รูป ทำ 10 ครั้ง',
          'ลองร้านข้าวมันไก่ 5 ร้านในเมือง',
          'เดินพิพิธภัณฑ์ 3 แห่งในเดือนนี้',
          'ตื่นไปดูพระอาทิตย์ขึ้น 4 เสาร์ติดกัน',
        ],
      },
    },
    {
      why: 'ช่วงเวลาบอกว่าเข้าร่วมได้ถึงเมื่อไร ส่วนเหรียญคือของที่ระลึกของคนที่ทำสำเร็จ',
      fields: [
        { label: 'วันเริ่มและวันสิ้นสุด', example: '1 - 30 พ.ย.', shows: 'นับครั้งเฉพาะที่ทำในช่วงนี้' },
        { label: 'ชื่อเหรียญ', example: 'นักสำรวจกาแฟ', shows: 'ขึ้นในมายฮับของคนที่ทำสำเร็จ' },
      ],
    },
  ],
};

// The form asks for the cover right after the name, so the example lists it there too
const fieldsInFormOrder = (fields: GuideField[]) => {
  const cover = fields.find((field) => field.label === 'รูปปก');
  if (!cover) return fields;
  const rest = fields.filter((field) => field !== cover);
  return [rest[0], cover, ...rest.slice(1)];
};

export function CreateStepGuide({ type, step, open, onToggle }: { type: GuideType; step: number; open: boolean; onToggle: (open: boolean) => void }) {
  const guide = GUIDES[type][step];
  if (!guide) return null;
  return (
    <details open={open} onToggle={(e) => onToggle(e.currentTarget.open)} className="group rounded-2xl border border-slate-200 bg-slate-50">
      <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <Lightbulb className="w-5 h-5 shrink-0 text-amber-500" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-slate-900">ดูตัวอย่าง</span>
          <span className="block text-xs font-medium text-slate-500">กรอกแบบไหนดี และจะไปขึ้นตรงไหน</span>
        </span>
        <ChevronRight className="w-5 h-5 shrink-0 text-slate-500 transition-transform group-open:rotate-90" aria-hidden="true" />
      </summary>
      <div className="px-4 pb-4 space-y-4">
        <p className="text-sm font-medium text-slate-700 leading-relaxed">{guide.why}</p>
        <dl className="space-y-3">
          {fieldsInFormOrder(guide.fields).map((field) => (
            <div key={field.label}>
              <dt className="text-xs font-bold text-slate-500">{field.label}</dt>
              <dd className="mt-1">
                <div className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-900 leading-relaxed">
                  {Array.isArray(field.example) ? (
                    <ol className="space-y-1">
                      {field.example.map((item, index) => (
                        <li key={item} className="flex gap-2"><span className="w-4 shrink-0 text-slate-500 tabular-nums">{index + 1}</span>{item}</li>
                      ))}
                    </ol>
                  ) : field.example}
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500 leading-relaxed">{field.shows}</p>
              </dd>
            </div>
          ))}
        </dl>
        {guide.ideas && (
          <div>
            <p className="text-xs font-bold text-slate-500">{guide.ideas.title}</p>
            <ul className="mt-1.5 space-y-1 text-sm font-medium text-slate-700 leading-relaxed list-disc pl-5">
              {guide.ideas.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}
