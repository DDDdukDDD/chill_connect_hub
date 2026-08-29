'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Lock } from 'lucide-react';

interface TermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy';
}

export const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100010] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E8E2D8] shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E293B] text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-1 pr-8">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              {activeTab === 'terms' ? '📜 ข้อตกลงและเงื่อนไขการใช้งาน' : '🔒 นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)'}
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              มีผลบังคับใช้เพื่อสร้างคอมมูนิตี้ที่ปลอดภัย โปร่งใส และเคารพสิทธิส่วนบุคคลของสมาชิกทุกคน
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-white/10 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-[#4A7C59]" />
              <span>ข้อตกลงการใช้งาน (Terms)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>นโยบายความเป็นส่วนตัว (Privacy)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed custom-scrollbar flex-1">
          
          {/* ======================================================== */}
          {/* TAB 1: TERMS OF SERVICE */}
          {/* ======================================================== */}
          {activeTab === 'terms' && (
            <div className="space-y-5 animate-fade-in">
              
              {/* Highlight Box: Safe Space Policy (No Icon) */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
                <h4 className="font-black text-xs sm:text-sm text-amber-900">
                  กฎเหล็กพื้นที่ปลอดภัย (Safe Space & Anti-Commercial)
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Chill & Connect Hub ไม่อนุญาตให้ใช้แพลตฟอร์มเพื่อการขายตรง (MLM), ประกันชีวิต, ชักชวนลงทุนแชร์ลูกโซ่, หรือการคุกคามทุกรูปแบบ หากตรวจพบหรือได้รับการรายงาน ระบบจะระงับบัญชีถาวรทันที
                </p>
              </div>

              {/* Section 1 */}
              <div className="space-y-2">
                <h4 className="font-black text-sm text-slate-900">
                  1. บทบาทและการให้บริการของแพลตฟอร์ม
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Chill & Connect Hub ทำหน้าที่เป็นสื่อกลางทางเทคโนโลยี (Platform Intermediary) ในการค้นหาและนัดพบทำกิจกรรมยามว่าง</li>
                  <li>ระบบช่วยคัดกรองและแนะนำกิจกรรมตามความสนใจและย่านที่พักอาศัยของสมาชิก</li>
                  <li>แพลตฟอร์มสนับสนุนการสร้างมิตรภาพและสังคมสร้างสรรค์โดยปราศจากการแสวงหาผลประโยชน์แอบแฝง</li>
                </ul>
              </div>

              {/* Section 2 */}
              <div className="space-y-2">
                <h4 className="font-black text-sm text-slate-900">
                  2. คุณสมบัติของผู้ใช้งานและการยืนยันตัวตน
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>ผู้ใช้งานต้องให้ข้อมูลจริง โดยเฉพาะชื่อ รูปถ่ายโปรไฟล์ และอายุ เพื่อความปลอดภัยของคอมมูนิตี้</li>
                  <li>ห้ามแอบอ้าง นำรูปภาพบุคคลอื่นมาใช้ หรือสร้างบัญชีปลอมโดยเด็ดขาด</li>
                  <li>สมาชิก 1 ท่านสามารถลงทะเบียนใช้งานได้ 1 บัญชีหลัก</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="space-y-2">
                <h4 className="font-black text-sm text-slate-900">
                  3. ความรับผิดชอบและความปลอดภัยในกิจกรรม (Liability Disclaimer)
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>ผู้จัดกิจกรรม (Host) และผู้เข้าร่วมกิจกรรม (Member) มีหน้าที่ดูแลความปลอดภัยและทรัพย์สินของตนเอง</li>
                  <li>แพลตฟอร์มไม่มีส่วนรับผิดชอบต่ออุบัติเหตุ ความสูญเสีย หรือข้อพิพาทส่วนบุคคลที่เกิดขึ้นภายนอกระบบ</li>
                  <li>ขอแนะนำให้สมาชิกนัดรวมตัวในสถานที่สาธารณะที่มีแสงสว่างและการเดินทางสะดวก เช่น แนวรถไฟฟ้า BTS/MRT</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div className="space-y-2">
                <h4 className="font-black text-sm text-slate-900">
                  4. แต้มสะสม Connect Points และสิทธิประโยชน์
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>คะแนน Connect Points และเหรียญฉายาเป็นสิทธิประโยชน์เฉพาะสมาชิก ไม่สามารถแลกเปลี่ยนเป็นเงินสดได้</li>
                  <li>การใช้แต้มแลกสิทธิพิเศษกับร้านค้าพาร์ตเนอร์เป็นไปตามเงื่อนไขที่กำหนดในแต่ละแคมเปญ</li>
                </ul>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: PRIVACY POLICY (PDPA STANDARD) */}
          {/* ======================================================== */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-fade-in">
              
              {/* Highlight Box: PDPA Compliance (No Icon) */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                <h4 className="font-black text-xs sm:text-sm text-emerald-900">
                  การคุ้มครองตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  เราให้ความสำคัญสูงสุดกับความเป็นส่วนตัวของคุณ ข้อมูลของคุณจะถูกเก็บรักษาอย่างปลอดภัย และไม่มีนโยบายการขายหรือส่งต่อข้อมูลส่วนบุคคลให้บุคคลภายนอกเพื่อการค้า 100%
                </p>
              </div>

              {/* Section 1 */}
              <div className="space-y-2">
                <h4 className="font-black text-sm text-slate-900">
                  1. ข้อมูลส่วนบุคคลที่เราจัดเก็บ
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>ข้อมูลโปรไฟล์:</strong> ชื่อแสดง (Display Name), รูปถ่ายโปรไฟล์ (3-6 รูป), วันเกิด (เพื่อคำนวณอายุ) และเพศ</li>
                  <li><strong>ข้อมูลไลฟ์สไตล์:</strong> สไตล์การแฮงเอาต์, กิจกรรมที่ชอบ, และย่านที่พักอาศัย/โซนที่สะดวก</li>
                  <li><strong>ข้อมูลการใช้งาน:</strong> กิจกรรมที่บันทึก, ตั๋ว E-Ticket ใน MyHub, คะแนน Connect Points และข้อความในห้องแชตตี้</li>
                </ul>
              </div>

              {/* Section 2 */}
              <div className="space-y-2">
                <h4 className="font-black text-sm text-slate-900">
                  2. วัตถุประสงค์ในการประมวลผลข้อมูล
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>ประมวลผลและแนะนำกิจกรรมที่ตรงกับไลฟ์สไตล์เฉพาะบุคคล</li>
                  <li>ระบบจับคู่เพื่อนร่วมตี้ (Buddy Matching) เพื่อสังคมที่ปลอดภัยและตรงใจ</li>
                  <li>อำนวยความสะดวกในการจัดเก็บตั๋ว E-Ticket และระบบห้องแชตนัดแนะ</li>
                  <li>ป้องกันการสวมรอย การทุจริต หรือการกระทำผิดกฎชุมชน</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="space-y-2">
                <h4 className="font-black text-sm text-slate-900">
                  3. สิทธิของเจ้าของข้อมูลส่วนบุคคล (Data Subject Rights)
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>สิทธิในการเข้าถึง ขอสำเนา หรือขอแก้ไขข้อมูลส่วนตัวให้ถูกต้องเป็นปัจจุบัน</li>
                  <li>สิทธิในการขอลบข้อมูลและรูปภาพออกจากระบบผ่านหน้า MyHub ได้ตลอดเวลา</li>
                  <li>สิทธิในการเพิกถอนความยินยอมในการประมวลผลข้อมูล</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div className="space-y-2">
                <h4 className="font-black text-sm text-slate-900">
                  4. การติดต่อเจ้าหน้าที่คุ้มครองข้อมูล (DPO)
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>หากมีข้อสงสัยหรือต้องการใช้สิทธิเกี่ยวกับข้อมูลส่วนบุคคล สามารถติดต่อได้ที่: <strong>privacy@chillandconnecthub.com</strong></li>
                </ul>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Action */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-[#E8E2D8] flex items-center justify-between gap-4 shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            เวอร์ชัน 2.4 (อัปเดตล่าสุด สิงหาคม 2026)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#4A7C59] hover:bg-[#3B6347] text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
          >
            รับทราบและปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
