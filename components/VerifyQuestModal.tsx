'use client';

import React, { useState } from 'react';
import {
  X,
  Camera,
  MapPin,
  QrCode,
  CheckCircle2,
  UploadCloud,
  Sparkles,
  Zap,
  Award,
  LocateFixed,
  Loader2,
  ShieldCheck,
  Image as ImageIcon,
  Lightbulb,
  Ticket,
  Gift
} from 'lucide-react';
import { ChallengeQuest } from '@/data/mockData';
import { compressImageToDataUrl } from '@/lib/media/compressor';
import { getQuestBrandReward } from '@/components/JoinChallengeModal';

interface VerifyQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  quest: ChallengeQuest | null;
  onVerificationSuccess: (questId: string, proofData: {
    type: 'photo' | 'gps' | 'ticket';
    caption?: string;
    imageUrl?: string;
    location?: string;
  }) => void;
}

const PRESET_SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
];

export const VerifyQuestModal: React.FC<VerifyQuestModalProps> = ({
  isOpen,
  onClose,
  quest,
  onVerificationSuccess,
}) => {
  const [activeMethod, setActiveMethod] = useState<'photo' | 'gps' | 'ticket'>('photo');
  const [caption, setCaption] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(PRESET_SAMPLE_PHOTOS[0]);
  const [userUploadedPhoto, setUserUploadedPhoto] = useState<string | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{ ratio: number; sizeKb: number } | null>(null);
  const [locationName, setLocationName] = useState('สวนลุมพินี / อารีย์');
  const [ticketCode, setTicketCode] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [gpsVerified, setGpsVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !quest) return null;

  const handleProofPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingPhoto(true);
      const result = await compressImageToDataUrl(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.82,
        targetMimeType: 'image/webp',
      });
      setUserUploadedPhoto(result.dataUrl);
      setSelectedPhoto(result.dataUrl);
      setCompressionStats({
        ratio: result.compressionRatio,
        sizeKb: Math.round(result.compressedSize / 1024),
      });
    } catch (err) {
      console.error('Error compressing proof photo:', err);
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const handleGpsCheck = () => {
    setIsLocating(true);
    setTimeout(() => {
      setIsLocating(false);
      setGpsVerified(true);
      setLocationName('สวนเบญจกิติ / สวนลุมพินี (ยืนยันพิกัดเรียบร้อย)');
    }, 1200);
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      onVerificationSuccess(quest.id, {
        type: activeMethod,
        caption: caption || `ทำภารกิจ "${quest.title}" สำเร็จอีก 1 ครั้ง!`,
        imageUrl: activeMethod === 'photo' ? selectedPhoto : undefined,
        location: locationName,
      });
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-scale-up p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#4A7C59] shrink-0 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                ระบบตรวจสอบความจริง
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                ความคืบหน้าปัจจุบัน: {quest.completedCountInfo}
              </span>
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-[#1E293B] mt-1 leading-snug">
              ส่งหลักฐานยืนยัน: {quest.title}
            </h3>
            {(() => {
              const brandReward = getQuestBrandReward(quest);
              return brandReward.type === 'brand_partner' ? (
                <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium shadow-2xs">
                  <Ticket className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="leading-snug"><strong>สิทธิ์ที่จะปลดล็อก:</strong> {brandReward.title} ({brandReward.partnerName})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-[11px] font-medium shadow-2xs">
                  <Gift className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="leading-snug"><strong>รางวัลที่จะได้รับ:</strong> แต้มพิเศษ + สิทธิ์สะสมแลกของรางวัลอิสระใน Hub Rewards</span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveMethod('photo')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMethod === 'photo'
                ? 'bg-white text-[#1E293B] shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-[#4A7C59]" />
            <span>1. ภาพถ่าย</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMethod('gps')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMethod === 'gps'
                ? 'bg-white text-[#1E293B] shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-[#F26430]" />
            <span>2. พิกัด GPS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMethod('ticket')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMethod === 'ticket'
                ? 'bg-white text-[#1E293B] shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-500" />
            <span>3. รหัสตั๋ว</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitProof} className="space-y-4">
          
          {/* TAB 1: Photo Proof */}
          {activeMethod === 'photo' && (
            <div className="space-y-3 animate-fade-in">
              {/* Real Photo Upload with Auto-WebP Compression */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>อัปโหลดหรือถ่ายภาพจริงของคุณ:</span>
                  </label>
                  <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Auto-WebP ⚡
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold shadow-2xs transition-all cursor-pointer">
                    <UploadCloud className="w-4 h-4 text-[#2563EB]" />
                    <span>{isCompressingPhoto ? 'กำลังแปลงเป็น WebP...' : 'ถ่ายภาพ / เลือกไฟล์รูป'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      disabled={isCompressingPhoto}
                      onChange={handleProofPhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {userUploadedPhoto && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>ภาพถ่ายของคุณ ({compressionStats?.sizeKb || 120} KB, ประหยัด {compressionStats?.ratio || 80}%)</span>
                    </div>
                  )}
                </div>

                {userUploadedPhoto && (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-[#2563EB] shadow-xs mt-1">
                    <img src={userUploadedPhoto} alt="Uploaded Proof" className="w-full h-full object-cover" />
                    <div className="absolute top-1 right-1 bg-[#2563EB] text-white p-0.5 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1.5">
                  หรือเลือกจากภาพตัวอย่างกิจกรรมทดสอบ:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_SAMPLE_PHOTOS.map((imgUrl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedPhoto(imgUrl)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedPhoto === imgUrl && !userUploadedPhoto
                          ? 'border-[#2563EB] ring-2 ring-[#2563EB]/30 scale-95'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt="proof" className="w-full h-full object-cover" />
                      {selectedPhoto === imgUrl && !userUploadedPhoto && (
                        <div className="absolute inset-0 bg-[#2563EB]/40 flex items-center justify-center text-white">
                          <CheckCircle2 className="w-5 h-5 drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  คำบรรยายความรู้สึก / เช็คอิน <span className="text-slate-400 font-normal">(จะโพสต์ลงหน้าโมเมนต์อัตโนมัติ)</span>
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="เช่น มาวิ่งเช้าสวนลุมพินีครบ 5K แล้ว อากาศสดชื่นมากครับ"
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2563EB] outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: GPS Check-in */}
          {activeMethod === 'gps' && (
            <div className="space-y-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D8] animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-[#1E293B]">เช็คอินพิกัดสถานที่จริง (Geo-Location)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">ระบบจะตรวจสอบว่าคุณอยู่ในสถานที่ทำกิจกรรมจริง</p>
                </div>
                <button
                  type="button"
                  onClick={handleGpsCheck}
                  disabled={isLocating}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  {isLocating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LocateFixed className="w-3.5 h-3.5" />
                  )}
                  <span>{isLocating ? 'กำลังค้นหา...' : 'สแกนพิกัด GPS'}</span>
                </button>
              </div>

              {gpsVerified && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{locationName}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Ticket Check-in */}
          {activeMethod === 'ticket' && (
            <div className="space-y-3 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  รหัสตั๋ว E-Ticket หรือหมายเลขการเข้าร่วม:
                </label>
                <input
                  type="text"
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                  placeholder="เช่น TKT-2026-CHILL-8921"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#4A7C59] outline-none font-mono"
                />
              </div>
              <div className="text-[11px] text-slate-600 leading-relaxed bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span><strong>เคล็ดลับ:</strong> เมื่อคุณให้โฮสต์สแกนตั๋วหน้างาน ระบบจะอัปเดตความคืบหน้านี้ให้อัตโนมัติอยู่แล้ว หรือจะกรอกเลขตั๋วเองที่นี่ก็ได้ครับ</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressingPhoto}
              className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-extrabold text-xs py-3 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isSubmitting || isCompressingPhoto ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-300" />
              )}
              <span>{isCompressingPhoto ? 'กำลังแปลงเป็น WebP...' : isSubmitting ? 'กำลังส่งหลักฐาน...' : 'ยืนยันความคืบหน้า (+XP)'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
