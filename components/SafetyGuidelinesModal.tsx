'use client';

import React from 'react';
import { X, ShieldCheck, AlertTriangle, CheckCircle2, Lock, PhoneCall, Users, MapPin } from 'lucide-react';

interface SafetyGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyGuidelinesModal: React.FC<SafetyGuidelinesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100010] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-scale-up border border-slate-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#4A7C59] flex items-center justify-center border border-emerald-200/80 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                แนวทางความปลอดภัยและข้อกำหนดชุมชน (Community Safety & Legal Disclaimer)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Chill & Connect Hub ให้ความสำคัญสูงสุดกับความปลอดภัยและความเป็นส่วนตัวของสมาชิกทุกคน
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95"
            title="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Section */}
        <div className="space-y-5 text-left text-xs sm:text-sm text-slate-700 leading-relaxed">
          
          {/* 1. Legal Disclaimer: Platform Intermediary */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Lock className="w-4 h-4 text-[#4A7C59]" />
              <span>1. ข้อจำกัดความรับผิดชอบของแพลตฟอร์ม (Platform Intermediary Notice)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Chill & Connect Hub เป็นเพียง **พื้นที่สื่อกลางออนไลน์ (Bulletin Board / Platform Intermediary)** สำหรับการแลกเปลี่ยนข้อมูลและเปิดโอกาสให้สมาชิกได้พบปะเพื่อนใหม่ที่มีความสนใจตรงกัน แพลตฟอร์มไม่ได้เป็นผู้จัดกิจกรรม, นายหน้า, ตัวแทน, หรือนายจ้างของสมาชิกใดๆ ทั้งสิ้น การนัดหมายและการเข้าร่วมกิจกรรมถือเป็นการตัดสินใจโดยสมัครใจของผู้ใช้งานเอง
            </p>
          </div>

          {/* 2. Public Meeting Only Policy */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <MapPin className="w-4 h-4 text-[#4A7C59]" />
              <span>2. กฎการนัดหมายในพื้นที่สาธารณะเท่านั้น (Public Space Policy)</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside font-normal">
              <li>กิจกรรมชุมชนทุกกิจกรรม **ต้องนัดพบในพื้นที่สาธารณะ** ที่มีผู้คนพลุกพล่าน เช่น สวนสาธารณะ, คาเฟ่, หอศิลป์, หรือห้างสรรพสินค้า</li>
              <li><strong>ห้ามเด็ดขาด:</strong> การนัดหมายในสถานที่ปิดลับตา, ที่พักอาศัยส่วนบุคคล, หรือสถานที่ที่มีความเสี่ยง</li>
            </ul>
          </div>

          {/* 3. Assumption of Risk & Release of Liability */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>3. การยอมรับความเสี่ยงส่วนบุคคล (Assumption of Risk & Waiver)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              ผู้ใช้งานรับทราบและยอมรับว่าการเข้าร่วมกิจกรรมภายนอกอาจมีความเสี่ยง ผู้ใช้งานตกลงรับผิดชอบต่อความปลอดภัย, สุขภาพ, และทรัพย์สินส่วนตัวด้วยตนเอง และสละสิทธิ์เรียกร้องความรับผิดทางกฎหมายหรือค่าเสียหายใดๆ จากทางแพลตฟอร์มและผู้พัฒนา
            </p>
          </div>

          {/* 4. Zero Tolerance Policy */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <CheckCircle2 className="w-4 h-4 text-[#4A7C59]" />
              <span>4. นโยบายห้ามคุกคามและหลอกลวง (Zero Tolerance for Misconduct)</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside font-normal">
              <li>ห้ามการคุกคามทางเพศ, วาจาไม่สุภาพ, การหลอกลวงทางการเงิน, หรือการชักชวนทำธุรกิจลูกโซ่ทุกรูปแบบ</li>
              <li>หากพบพฤติกรรมไม่เหมาะสม สมาชิกสามารถกดปุ่ม **"รายงานผู้ใช้ (Report)"** ได้ทันที แพลตฟอร์มจะดำเนินการระงับบัญชีถาวรและส่งข้อมูลให้เจ้าหน้าที่ตำรวจตามกฎหมาย</li>
            </ul>
          </div>

          {/* 5. Emergency & Advice */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <PhoneCall className="w-4 h-4 text-[#4A7C59]" />
              <span>5. คำแนะนำเพื่อความปลอดภัยเพิ่มเติม (Safety Tips)</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed font-normal">
              • แจ้งเพื่อนหรือคนในครอบครัวให้ทราบเสมอเมื่อออกไปทำกิจกรรม<br />
              • เดินทางด้วยตนเองในพื้นที่สาธารณะ และหลีกเลี่ยงการขึ้นรถส่วนตัวของผู้ที่เพิ่งรู้จักกันครั้งแรก<br />
              • หากรู้สึกไม่สบายใจหรือไม่ปลอดภัย สามารถปฏิเสธหรือออกจากกิจกรรมได้ตลอดเวลา
            </p>
          </div>

        </div>

        {/* Footer Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto bg-[#4A7C59] hover:bg-[#3B6347] text-white px-7 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all shadow-md shadow-[#4A7C59]/20 active:scale-95 cursor-pointer"
          >
            ข้าพเจ้ารับทราบและยอมรับข้อกำหนด
          </button>
        </div>
      </div>
    </div>
  );
};
