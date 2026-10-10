'use client';

import React, { useId, useState } from 'react';
import { AlertCircle, Download, Loader2, Trash2 } from 'lucide-react';
import { DialogShell, dialogButton } from './auth/DialogShell';
import { PhraseText } from './auth/PhraseText';
import { useMemberSession } from '@/lib/useMemberSession';

interface TermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy';
}

export type Tab = 'terms' | 'privacy';
const TABS: { id: Tab; label: string }[] = [
  { id: 'terms', label: 'ข้อตกลงการใช้งาน' },
  { id: 'privacy', label: 'นโยบายความเป็นส่วนตัว' },
];

/**
 * Terms of use and privacy policy (PDPA). The text describes what the product does today: keep it in
 * step with the member API (docs/API.md → Member accounts, Moments) whenever data handling changes.
 * This is a draft for the test period and needs legal review before launch.
 */
interface Section {
  title: string;
  items: string[];
}

const TERMS: Section[] = [
  {
    title: '1. บริการของเรา',
    items: [
      'Chill & Connect Hub เป็นพื้นที่กลางสำหรับค้นหากิจกรรม ที่เที่ยว งานแฟร์ และนัดพบกัน',
      'กิจกรรมคอมมูนิตี้สร้างโดยสมาชิก เราไม่ใช่ผู้จัดกิจกรรมเหล่านั้น และไม่ใช่ผู้ขายบัตร',
      'ข้อมูลสถานที่และงานบางส่วนมาจากแหล่งข้อมูลทางการ และอาจเปลี่ยนแปลงได้ ควรตรวจสอบกับผู้จัดอีกครั้งก่อนเดินทาง',
    ],
  },
  {
    title: '2. บัญชีสมาชิก',
    items: [
      'สมาชิกต้องมีอายุ 18 ปีขึ้นไป',
      'หนึ่งคนใช้หนึ่งบัญชี ห้ามแอบอ้างเป็นผู้อื่น หรือใช้รูปของผู้อื่นเป็นรูปโปรไฟล์',
      'คุณเป็นผู้ดูแลรหัสผ่านและการใช้งานบัญชีของตัวเอง',
    ],
  },
  {
    title: '3. พื้นที่ปลอดภัยของทุกคน',
    items: [
      'ห้ามใช้แพลตฟอร์มเพื่อขายตรง ขายประกัน ชักชวนลงทุน หรือโฆษณาแอบแฝง',
      'ห้ามคุกคาม ดูหมิ่น หรือโพสต์เนื้อหาที่ผิดกฎหมายหรือไม่เหมาะสม',
      'สมาชิกรายงานโพสต์ที่ไม่เหมาะสมได้ โพสต์ที่ถูกรายงานจากสมาชิกหลายคนจะถูกซ่อนไว้ก่อน เพื่อให้ทีมงานตรวจสอบ',
      'ทีมงานอาจซ่อนเนื้อหา ระงับบัญชีชั่วคราว หรือปิดบัญชีที่ทำผิดข้อตกลง',
      'สมาชิกทุกคนรับคำมั่นของคอมมูนิตี้ และต้องยืนยันอีเมลก่อนโพสต์หรือคอมเมนต์',
      'บัญชีใหม่มีข้อจำกัดในช่วง 7 วันแรก เช่น จำนวนโพสต์ต่อวัน และยังใส่ลิงก์ เบอร์โทร หรือไอดีไลน์ไม่ได้',
      'ผู้ที่ต้องการเปิดกิจกรรมสาธารณะต้องผ่านการตรวจจากทีมงานก่อน',
    ],
  },
  {
    title: '4. สิ่งที่คุณโพสต์',
    items: [
      'รูปและข้อความที่คุณโพสต์ยังเป็นของคุณ คุณอนุญาตให้เราแสดงสิ่งเหล่านั้นบนแพลตฟอร์ม',
      'โพสต์เฉพาะรูปที่คุณมีสิทธิ์ใช้ และเคารพความเป็นส่วนตัวของคนที่อยู่ในรูป',
      'คุณแก้ไขหรือลบโพสต์ของตัวเองได้ทุกเมื่อ',
    ],
  },
  {
    title: '5. ความปลอดภัยเมื่อไปร่วมกิจกรรม',
    items: [
      'ผู้จัดและผู้เข้าร่วมดูแลความปลอดภัยและทรัพย์สินของตัวเอง',
      'เราแนะนำให้นัดพบในที่สาธารณะ มีแสงสว่าง และเดินทางสะดวก',
      'แพลตฟอร์มไม่รับผิดชอบต่ออุบัติเหตุ ความสูญเสีย หรือข้อพิพาทที่เกิดขึ้นนอกระบบ',
    ],
  },
  {
    title: '6. XP และเหรียญ',
    items: [
      'XP และเหรียญเป็นสิทธิประโยชน์ภายในแพลตฟอร์ม แลกเป็นเงินสดไม่ได้',
      'ของรางวัลจากพาร์ตเนอร์เป็นไปตามเงื่อนไขของแต่ละชาเลนจ์',
    ],
  },
];

const PRIVACY: Section[] = [
  {
    title: '1. ข้อมูลที่เราเก็บ',
    items: [
      'บัญชี: ชื่อที่แสดง อีเมล รูปโปรไฟล์ (ถ้าคุณใส่) และรหัสผ่านที่เข้ารหัสแล้ว ซึ่งเราอ่านไม่ได้',
      'ถ้าเข้าสู่ระบบด้วย Google, Apple หรือ Facebook: รหัสประจำตัวจากผู้ให้บริการนั้น พร้อมชื่อ อีเมล และรูปที่คุณอนุญาต',
      'สิ่งที่คุณทำ: โมเมนต์ คอมเมนต์ ไลก์ รายการที่บันทึก กิจกรรมที่เข้าร่วม และการรายงานโพสต์',
      'คำตอบตอนเริ่มใช้งาน ถ้าคุณเลือกตอบ: สิ่งที่อยากทำ ความสนใจ จังหวัด ปีเกิด และเพศ',
      'บันทึกการยินยอม: วันที่คุณยอมรับข้อตกลง ฉบับที่ยอมรับ การยืนยันอายุ 18 ปีขึ้นไป และการรับคำมั่นของคอมมูนิตี้',
      'ข้อมูลโปรไฟล์ที่คุณเลือกกรอก เช่น แนะนำตัว อาชีพ และย่านที่อยู่ พร้อมการตั้งค่าว่าจะแสดงช่องไหน',
      'ถ้าคุณส่งคำขอเป็นโฮสต์: ข้อความและลิงก์ที่คุณส่งให้ทีมงาน',
      'ข้อมูลเพื่อความปลอดภัย: รหัสแทนหมายเลข IP ตอนสมัคร (เราไม่เก็บหมายเลข IP จริง) สัญญาณเสี่ยงที่ระบบตรวจพบอัตโนมัติ และรายงานที่สมาชิกคนอื่นส่งถึงคุณ ข้อมูลส่วนนี้ทีมงานเท่านั้นที่เห็น',
      'ข้อมูลทางเทคนิค: คุกกี้ที่ใช้จำการเข้าสู่ระบบ และหมายเลข IP เพื่อป้องกันการใช้งานผิดปกติ',
    ],
  },
  {
    title: '2. เราใช้ข้อมูลเพื่ออะไร',
    items: [
      'ให้คุณเข้าสู่ระบบและใช้บริการได้',
      'แสดงชื่อและรูปของคุณบนโพสต์และกิจกรรมที่คุณเข้าร่วม',
      'แนะนำกิจกรรมและสถานที่ที่ตรงกับความสนใจ',
      'ดูแลความปลอดภัย ตรวจสอบเนื้อหาที่ถูกรายงาน และตรวจหาบัญชีที่อาจหลอกลวงด้วยระบบอัตโนมัติ โดยให้ทีมงานเป็นผู้ตัดสินทุกครั้ง',
    ],
  },
  {
    title: '3. ใครเห็นข้อมูลของคุณ',
    items: [
      'สมาชิกคนอื่นเห็นชื่อ รูปโปรไฟล์ สิ่งที่คุณโพสต์ และเฉพาะข้อมูลโปรไฟล์ที่คุณเลือกให้แสดง อีเมลของคุณไม่แสดงเสมอ',
      'ที่ทำงาน สถานะความสัมพันธ์ และช่วงอายุ ถูกซ่อนไว้ก่อน จนกว่าคุณจะเลือกแสดงเอง',
      'ทีมงานที่ได้รับอนุญาตเข้าถึงข้อมูลเพื่อดูแลระบบและความปลอดภัย',
      'ผู้ให้บริการที่ช่วยเราทำงาน เช่น ที่เก็บไฟล์รูปและระบบส่งอีเมล ได้รับข้อมูลเท่าที่จำเป็น',
      'เราไม่ขายข้อมูลส่วนบุคคลของคุณ',
    ],
  },
  {
    title: '4. สิทธิของคุณ',
    items: [
      'ขอดู ดาวน์โหลด และแก้ไขข้อมูลของคุณ',
      'ลบบัญชี ซึ่งจะลบโมเมนต์ คอมเมนต์ และไลก์ของคุณทั้งหมด และกู้คืนไม่ได้',
      'ถอนความยินยอม โดยการลบบัญชีหรือติดต่อเรา',
    ],
  },
];

const CONTACT_EMAIL = 'privacy@chillandconnecthub.com';

function SectionList({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.title} className="space-y-2">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">{section.title}</h3>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600 leading-relaxed">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

/** Lets a signed-in member use their PDPA rights right here: download their data or delete the account */
function MyDataActions() {
  const session = useMemberSession();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!session.isLoaded) return null;
  if (!session.member) {
    return (
      <p className="text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <PhraseText text="เข้าสู่ระบบก่อน แล้วกลับมาที่หน้านี้ เพื่อดาวน์โหลดข้อมูล หรือลบบัญชีของคุณ" />
      </p>
    );
  }

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      await session.deleteAccount();
      // Full reload on purpose: every page must forget the deleted account
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ลบบัญชีไม่สำเร็จ ลองอีกครั้ง');
      setBusy(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
      <p className="text-sm font-bold text-slate-800">
        <PhraseText text={`ข้อมูลของคุณ (${session.member.displayName})`} />
      </p>
      {!confirming ? (
        <div className="flex flex-wrap gap-2">
          <a href="/api/auth/member/account" download className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-sm font-bold whitespace-nowrap">
            <Download className="w-4 h-4" aria-hidden="true" />
            ดาวน์โหลดข้อมูลของฉัน
          </a>
          <button type="button" onClick={() => setConfirming(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-300 hover:border-rose-300 text-rose-700 text-sm font-bold cursor-pointer whitespace-nowrap">
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            ลบบัญชีของฉัน
          </button>
        </div>
      ) : (
        <div role="alert" className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
          <p className="flex items-start gap-2 text-sm font-bold text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span><PhraseText text="ลบบัญชีแล้ว กู้คืนไม่ได้ โมเมนต์ คอมเมนต์ และไลก์ของคุณ จะถูกลบทั้งหมด" /></span>
          </p>
          {error && <p className="text-xs font-bold text-rose-700">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setConfirming(false)} disabled={busy} className={dialogButton.quiet}>
              ยกเลิก
            </button>
            <button type="button" onClick={remove} disabled={busy} className={dialogButton.danger}>
              {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {busy ? 'กำลังลบ…' : 'ลบบัญชีถาวร'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function LegalTabs({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <div className="inline-flex p-1 rounded-full bg-slate-100 max-w-full" role="tablist" aria-label="เอกสาร">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={tab === t.id}
          onClick={() => onChange(t.id)}
          className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
            tab === t.id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export const LEGAL_VERSION_NOTE = 'ฉบับร่าง ช่วงทดสอบระบบ ปรับปรุง ต.ค. 2026';

export function LegalBody({ tab }: { tab: Tab }) {
  return tab === 'terms' ? (
    <>
      <p className="text-sm font-medium text-slate-600 leading-relaxed">
        ข้อตกลงนี้มีไว้เพื่อให้ทุกคนใช้ Chill & Connect Hub ได้อย่างสบายใจและปลอดภัย การสมัครสมาชิกถือว่าคุณยอมรับข้อตกลงนี้
      </p>
      <SectionList sections={TERMS} />
    </>
  ) : (
    <>
      <p className="text-sm font-medium text-slate-600 leading-relaxed">
        เราเก็บข้อมูลเท่าที่จำเป็นต่อการให้บริการ ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) และไม่ขายข้อมูลส่วนบุคคลของคุณ
      </p>
      <SectionList sections={PRIVACY} />
      <MyDataActions />
      <section className="space-y-2">
        <h3 className="text-sm sm:text-base font-extrabold text-slate-900">5. ติดต่อเรา</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          มีคำถามหรือต้องการใช้สิทธิเกี่ยวกับข้อมูลส่วนบุคคล ติดต่อได้ที่{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline break-all">{CONTACT_EMAIL}</a>
        </p>
      </section>
    </>
  );
}

function TermsPrivacyDialog({ onClose, initialTab }: { onClose: () => void; initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const titleId = useId();

  return (
    <DialogShell onClose={onClose} size="lg" layer="top" bare labelledBy={titleId}>
      <header className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-slate-100 shrink-0">
        <h2 id={titleId} className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 pr-12">
          ข้อตกลงและนโยบาย
        </h2>
        <div className="mt-4">
          <LegalTabs tab={tab} onChange={setTab} />
        </div>
      </header>

      <div className="px-5 sm:px-8 py-5 overflow-y-auto flex-1 space-y-5" role="tabpanel" tabIndex={0}>
        <LegalBody tab={tab} />
      </div>

      <footer className="px-5 sm:px-8 py-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
        <span className="text-xs font-medium text-slate-500">
          <PhraseText text={LEGAL_VERSION_NOTE} />
        </span>
        <button type="button" data-autofocus onClick={onClose} className={dialogButton.primary}>
          เข้าใจแล้ว
        </button>
      </footer>
    </DialogShell>
  );
}

export const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({ isOpen, onClose, initialTab = 'terms' }) => {
  if (!isOpen) return null;
  return <TermsPrivacyDialog onClose={onClose} initialTab={initialTab} />;
};
