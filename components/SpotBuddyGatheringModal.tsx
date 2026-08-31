'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Users,
  Shield,
  Clock,
  Calendar as CalendarIcon,
  Image as ImageIcon,
  Upload,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { SafetyGuidelinesModal } from './SafetyGuidelinesModal';
import { useAuth } from '@/lib/useAuth';
import { RichTextEditor, stripHtmlToPlainText } from './RichTextEditor';

export interface SpotBuddyPostItem {
  id: string;
  title: string;
  hostName: string;
  hostAvatar?: string;
  hostBadge?: string;
  date: string;
  time: string;
  participantsCount: number;
  maxParticipants: number;
  description: string;
  tag: string;
  meetingPoint?: string;
  targetGender?: 'all' | 'female_only' | 'male_only';
  targetAge?: string;
  price?: string;
  image?: string;
  whatToBring?: string[];
  transportation?: string;
  contactChannel?: string;
  itinerary?: Array<{ time: string; title: string }>;
}

interface SpotBuddyGatheringModalProps {
  isOpen: boolean;
  onClose: () => void;
  spotTitle: string;
  spotLocation: string;
  spotImage?: string;
  onSuccess: (newTrip: SpotBuddyPostItem) => void;
}

const WHAT_TO_BRING_SUGGESTIONS = [
  'ขวดน้ำดื่มส่วนตัว',
  'รองเท้าวิ่ง / ผ้าใบ',
  'กล้องถ่ายรูป',
  'เสื่อปิกนิก',
  'หมวก / แว่นกันแดด',
  'สมุดสเก็ตช์ภาพ',
  'พาวเวอร์แบงก์',
  'ร่มพับ',
];

const AGE_SUGGESTIONS = ['ไม่จำกัดอายุ', '18 - 25 ปี', '20 - 35 ปี', '25 - 40 ปี', '30 ปีขึ้นไป'];

const PRESET_VIBE_IMAGES = [
  { id: 'cafe', label: 'คาเฟ่ & บอร์ดเกม', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80' },
  { id: 'run', label: 'วิ่ง & สปอร์ต', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80' },
  { id: 'chill', label: 'ฮีลใจ & ธรรมชาติ', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' },
];

export const SpotBuddyGatheringModal: React.FC<SpotBuddyGatheringModalProps> = ({
  isOpen,
  onClose,
  spotTitle,
  spotLocation,
  spotImage,
  onSuccess,
}) => {
  const { userProfile } = useAuth();

  // Form states matching original design exactly
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-09-01');
  const [startTime, setStartTime] = useState('06:30');
  const [endTime, setEndTime] = useState('08:30');
  const [locationName, setLocationName] = useState('');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [description, setDescription] = useState('');
  
  // Itinerary items
  const [itinerary, setItinerary] = useState<Array<{ time: string; title: string }>>([
    { time: '06:30 น.', title: 'รวมตัวกันหน้าจุดนัดพบ' },
    { time: '07:00 น.', title: 'เริ่มกิจกรรมหลักร่วมกัน' },
    { time: '08:15 น.', title: 'แวะจิบกาแฟ & นั่งคุยผ่อนคลาย' },
  ]);

  // Image states
  const [coverImage, setCoverImage] = useState<string>(spotImage || PRESET_VIBE_IMAGES[0].url);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // What to bring
  const [whatToBringList, setWhatToBringList] = useState<string[]>(['ขวดน้ำดื่มส่วนตัว', 'รองเท้าวิ่ง / ผ้าใบ']);
  const [customBringInput, setCustomBringInput] = useState('');

  // Participant settings
  const [maxParticipants, setMaxParticipants] = useState<number>(6);
  const [targetGender, setTargetGender] = useState<'all' | 'female_only' | 'male_only'>('all');
  const [price, setPrice] = useState('ฟรี');
  const [targetAge, setTargetAge] = useState<string>('ไม่จำกัดอายุ');
  const [transportation, setTransportation] = useState('พบกัน ณ จุดนัดพบ (เดินทางอิสระ)');
  const [contactChannel, setContactChannel] = useState('');

  // Safety acceptance
  const [isSafetyAccepted, setIsSafetyAccepted] = useState(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(`ชวนไป ${spotTitle}`);
      setLocationName(spotTitle || '');
      setMeetingPoint(`หน้าจุดนัดหมายหลัก / หน้าร้าน ${spotTitle}`);
      setCoverImage(spotImage || PRESET_VIBE_IMAGES[0].url);
      setDescription(`<p><strong>ภาพรวมกิจกรรม:</strong></p><p>ชวนเพื่อนสายเดียวกันไปเที่ยวหรือเปิดทริปฮีลใจยามว่างด้วยกันอย่างเป็นกันเอง ใครมาคนเดียวไม่ต้องเกร็ง ยินดีต้อนรับทุกคนครับ</p>`);
      setIsSafetyAccepted(false);
      setErrorMessage(null);
    }
  }, [isOpen, spotTitle, spotImage]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('ขนาดรูปภาพต้องไม่เกิน 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleBringItem = (item: string) => {
    setWhatToBringList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleAddCustomBring = () => {
    if (!customBringInput.trim()) return;
    if (!whatToBringList.includes(customBringInput.trim())) {
      setWhatToBringList((prev) => [...prev, customBringInput.trim()]);
    }
    setCustomBringInput('');
  };

  const handleAddItineraryRow = () => {
    setItinerary((prev) => [...prev, { time: '09:00 น.', title: 'กิจกรรมเพิ่มเติม' }]);
  };

  const handleUpdateItinerary = (index: number, field: 'time' | 'title', value: string) => {
    setItinerary((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveItinerary = (index: number) => {
    setItinerary((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!title.trim()) {
      setErrorMessage('กรุณาระบุชื่อกิจกรรม / หัวข้อทริปชวนเพื่อน');
      return;
    }
    if (!date) {
      setErrorMessage('กรุณาระบุวันที่นัดหมาย');
      return;
    }
    if (!locationName.trim()) {
      setErrorMessage('กรุณาระบุสถานที่จัดกิจกรรม');
      return;
    }
    if (!meetingPoint.trim()) {
      setErrorMessage('กรุณาระบุจุดนัดพบที่แน่นอน / จุดสังเกต (Meeting Point)');
      return;
    }
    const plainDesc = stripHtmlToPlainText(description);
    if (!plainDesc || plainDesc.length < 15) {
      setErrorMessage('กรุณาระบุรายละเอียดกิจกรรมอย่างน้อย 15 ตัวอักษร เพื่อให้ข้อมูลครบถ้วน');
      return;
    }
    if (!maxParticipants || maxParticipants < 2) {
      setErrorMessage('จำนวนคนที่เปิดรับต้องมีอย่างน้อย 2 คน');
      return;
    }
    if (!isSafetyAccepted) {
      setErrorMessage('กรุณากดยอมรับข้อกำหนดความปลอดภัยและแนวทางคอมมูนิตี้');
      return;
    }

    const newTrip: SpotBuddyPostItem = {
      id: `spot-buddy-${Date.now()}`,
      title: title.trim(),
      hostName: userProfile.name || 'คุณส้ม (Som_Chill)',
      hostAvatar: userProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      hostBadge: userProfile.badgeLabel || 'สมาชิก',
      date: date,
      time: `${startTime} - ${endTime} น.`,
      participantsCount: 1,
      maxParticipants: maxParticipants || 6,
      description: description.trim(),
      tag: '☕ กิจกรรมชวนเที่ยว',
      meetingPoint: meetingPoint.trim(),
      targetGender: targetGender,
      targetAge: targetAge,
      price: price.trim() || 'ฟรี',
      image: uploadedImage || coverImage,
      whatToBring: whatToBringList,
      transportation: transportation,
      contactChannel: contactChannel.trim() || undefined,
      itinerary: itinerary,
    };

    onSuccess(newTrip);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div
        className="bg-white rounded-[28px] sm:rounded-[32px] max-w-5xl w-full p-5 sm:p-8 space-y-6 shadow-2xl relative animate-scale-up border border-slate-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                เปิดวงชวนเพื่อนเที่ยว / สร้างกิจกรรมใหม่
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Safe & Chill</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              ชวนเพื่อนสายเดียวกันไปเที่ยว หรือเปิดทริปฮีลใจยามว่างด้วยกันอย่างเป็นกันเอง
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Full Suite Form matching user screenshot */}
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* === LEFT COLUMN (7 Cols) === */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* 1. Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    ชื่อกิจกรรม / หัวข้อทริปชวนเพื่อน <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">หัวข้อกระชับ เข้าใจง่าย</span>
                </div>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น วิ่งเช้ารับลมที่สวนเบญจกิติ, จอยบอร์ดเกมคาเฟ่อารีย์"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:border-[#4A7C59] outline-none transition-all"
                />
              </div>

              {/* 2. Date & Time Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Date */}
                <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>วันที่นัดหมาย <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                  />
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold text-center border border-emerald-100">
                    วันนัดหมาย: {date}
                  </div>
                </div>

                {/* Time */}
                <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>ช่วงเวลากิจกรรม <span className="text-rose-500">*</span></span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 block mb-0.5">เวลาเริ่ม:</span>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 block mb-0.5">เวลาสิ้นสุด:</span>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-900 text-[11px] font-bold text-center border border-amber-100">
                    {startTime} - {endTime} น.
                  </div>
                </div>
              </div>

              {/* 3. Location & Meeting Point Card */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#4A7C59]" />
                      <span>สถานที่จัดกิจกรรม <span className="text-rose-500">*</span></span>
                    </label>
                    <span className="text-[10.5px] text-slate-400">ระบุสถานที่นัดพบ</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="หรือพิมพ์ระบุสถานที่ เช่น สวนเบญจกิติ / คาเฟ่ More Than Games อารีย์"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#4A7C59]"
                  />
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      จุดนัดพบที่แน่นอน / จุดสังเกต (Meeting Point) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10.5px] text-slate-400">เช่น หน้าร้านกาแฟ, หน้าเสาธง</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={meetingPoint}
                    onChange={(e) => setMeetingPoint(e.target.value)}
                    placeholder="เช่น หน้าประตู 1 โซนลานจอดรถ, หน้าบันไดสกายวอล์ค, หน้าร้านกาแฟ"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#4A7C59]"
                  />
                </div>
              </div>

              {/* 4. Description & Rich Text Editor */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  รายละเอียด & บรรยากาศทริป <span className="text-rose-500">*</span> (พิมพ์ตัวหนาหรือรายการได้ทันที)
                </label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="เล่าบรรยากาศ แผนการเที่ยว หรือคำแนะนำสำหรับเพื่อนๆ ที่จะร่วมทริป..."
                  templateLabel="ใส่แม่แบบรายละเอียดทริป"
                  onApplyTemplate={() => {
                    setDescription(`<p><strong>ภาพรวม & บรรยากาศทริป:</strong></p>
<p>นัดเจอพูดคุยบรรยากาศสบายๆ ที่ ${spotTitle} ใครมาคนเดียวไม่ต้องเกร็ง ยินดีต้อนรับทุกคนครับ</p>
<p><br></p>
<p><strong>สไตล์ทริป & สิ่งที่จะทำด้วยกัน:</strong></p>
<ul>
  <li>เน้นเดินชิลล์ ถ่ายรูปมุมสวยๆ และเสพความสงบของสถานที่</li>
  <li>แวะจิบกาแฟ/เครื่องดื่ม พูดคุยแลกเปลี่ยนประสบการณ์กันแบบเป็นกันเอง</li>
  <li>ไม่เร่งรีบ สบายๆ ปลอดภัย และเป็นมิตรกับทุกคน</li>
</ul>
<p><br></p>
<p><strong>คำแนะนำสำหรับผู้ร่วมทริป:</strong></p>
<p>สามารถเช็คจุดนัดพบ เวลา และสิ่งที่ควรเตรียมมาได้ที่แถบข้อมูลด้านขวา แล้วเจอกันวันนัดหมายนะครับ!</p>`);
                  }}
                  minHeight="240px"
                />
              </div>

              {/* 5. Itinerary Timeline Card */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>กำหนดการกิจกรรม (Itinerary)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">ระบุไทม์ไลน์คร่าวๆ ให้เพื่อนๆ ทราบขั้นตอน</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItineraryRow}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4A7C59] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>เพิ่มช่วงเวลา</span>
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  {itinerary.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#2D5A3C] text-[11px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={item.time}
                        onChange={(e) => handleUpdateItinerary(idx, 'time', e.target.value)}
                        placeholder="เช่น 06:30 น."
                        className="w-24 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none shrink-0"
                      />
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleUpdateItinerary(idx, 'title', e.target.value)}
                        placeholder="รายละเอียดช่วงเวลานี้"
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItinerary(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="ลบแถวนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* === RIGHT COLUMN (5 Cols) === */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* 1. Cover Image Picker */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#4A7C59]" />
                    <span>รูปภาพปกกิจกรรม:</span>
                  </label>
                  <span className="text-[10.5px] text-slate-400">อัปโหลดหรือเลือกรูปสำเร็จ</span>
                </div>

                {/* Upload Box */}
                <label className="border-2 border-dashed border-slate-200 hover:border-[#4A7C59] bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-emerald-50/30 group">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 group-hover:text-[#4A7C59] group-hover:bg-emerald-100 flex items-center justify-center mb-1.5 transition-colors">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-[#4A7C59]">
                    {uploadedImage ? 'เปลี่ยนรูปภาพจากเครื่อง' : 'คลิกเพื่ออัปโหลดรูปจากเครื่อง'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">รองรับไฟล์ JPG, PNG, WEBP (ไม่เกิน 5MB)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Preset Chips */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {PRESET_VIBE_IMAGES.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setCoverImage(preset.url);
                        setUploadedImage(null);
                      }}
                      className={`relative rounded-xl overflow-hidden aspect-video cursor-pointer border-2 transition-all ${
                        coverImage === preset.url && !uploadedImage
                          ? 'border-[#4A7C59] ring-2 ring-[#4A7C59]/20 shadow-xs'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-[9px] font-bold text-white text-center p-1">
                        {preset.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. What to Bring Card */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-800 block">
                  สิ่งที่ต้องเตรียมมา (What to Bring):
                </label>

                {/* Selected Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {whatToBringList.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-[#2D5A3C] border border-emerald-200"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => toggleBringItem(item)}
                        className="hover:text-rose-500 ml-0.5 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Suggestions */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10.5px] text-slate-400 font-medium block">แตะเพื่อเพิ่มด่วน:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {WHAT_TO_BRING_SUGGESTIONS.filter((s) => !whatToBringList.includes(s)).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleBringItem(item)}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all cursor-pointer"
                      >
                        + {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customBringInput}
                    onChange={(e) => setCustomBringInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomBring();
                      }
                    }}
                    placeholder="หรือพิมพ์ระบุเอง..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomBring}
                    className="px-3 py-1.5 bg-[#4A7C59] hover:bg-[#386144] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    เพิ่ม
                  </button>
                </div>
              </div>

              {/* 3. Settings & Safety Card */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3.5">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
                  <Shield className="w-3.5 h-3.5 text-[#4A7C59]" />
                  <span>การตั้งค่าผู้เข้าร่วม & ความปลอดภัย</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        จำนวนรับ: <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-bold text-emerald-700">{maxParticipants} คน</span>
                    </div>
                    <input
                      type="number"
                      min={2}
                      max={15}
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">เพศที่เปิดรับ:</label>
                    <select
                      value={targetGender}
                      onChange={(e) => setTargetGender(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="all">ทุกเพศ</option>
                      <option value="female_only">เฉพาะผู้หญิง</option>
                      <option value="male_only">เฉพาะผู้ชาย</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">ค่าใช้จ่าย:</label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="เช่น ฟรี หรือ 150 บาท"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                  />
                </div>

                {/* Age Suggestions */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700">ช่วงอายุที่แนะนำ:</label>
                    <span className="text-[10px] text-slate-400">พิมพ์ระบุเองได้</span>
                  </div>
                  <input
                    type="text"
                    value={targetAge}
                    onChange={(e) => setTargetAge(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none mb-1.5"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {AGE_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setTargetAge(sug)}
                        className={`text-[10.5px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          targetAge === sug
                            ? 'bg-[#4A7C59] text-white border-[#4A7C59] font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transportation & Contact */}
                <div className="space-y-2 pt-2 border-t border-slate-200/80">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      🚗 สไตล์การเดินทาง (Transportation):
                    </label>
                    <select
                      value={transportation}
                      onChange={(e) => setTransportation(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="พบกัน ณ จุดนัดพบ (เดินทางอิสระ)">📍 พบกัน ณ จุดนัดพบ (เดินทางอิสระ)</option>
                      <option value="มีรถยนต์ส่วนตัว (รับเพื่อนร่วมทางได้ / Carpool)">🚗 มีรถยนต์ส่วนตัว (รับเพื่อนร่วมทางได้ / Carpool)</option>
                      <option value="เดินทางด้วย BTS / MRT">🚇 เดินทางด้วย BTS / MRT</option>
                      <option value="แชร์ค่ารถ / แท็กซี่ไปด้วยกัน">🚕 แชร์ค่ารถ / แท็กซี่ไปด้วยกัน</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      💬 ช่องทางติดต่อหลังกดเข้าร่วม (Group Contact):
                    </label>
                    <input
                      type="text"
                      value={contactChannel}
                      onChange={(e) => setContactChannel(e.target.value)}
                      placeholder="เช่น Line OpenChat / Line ID โฮสต์"
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      🔒 จะเปิดเผยเฉพาะสมาชิกที่กดยืนยันเข้าร่วมสำเร็จเท่านั้น
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Safety Consent Bar */}
          <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 space-y-1 text-xs text-emerald-950 font-medium">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={isSafetyAccepted}
                onChange={(e) => setIsSafetyAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#4A7C59] focus:ring-[#4A7C59] border-emerald-300 cursor-pointer shrink-0"
              />
              <span className="leading-relaxed">
                ข้าพเจ้ายินยอมปฏิบัติตาม{' '}
                <button
                  type="button"
                  onClick={() => setIsSafetyModalOpen(true)}
                  className="font-black text-[#4A7C59] underline hover:text-[#386144]"
                >
                  แนวทางความปลอดภัยและข้อกำหนดชุมชน
                </button>{' '}
                นัดพบในพื้นที่สาธารณะ และรับทราบว่าแพลตฟอร์มเป็นเพียงพื้นที่สื่อกลางออนไลน์
              </span>
            </label>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!isSafetyAccepted}
              className={`px-7 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                isSafetyAccepted
                  ? 'bg-[#F26430] hover:bg-[#D95322] text-white shadow-orange-500/25 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>เปิดวงชวนเพื่อนเลย</span>
            </button>
          </div>

        </form>

        {/* Safety Guidelines Modal */}
        <SafetyGuidelinesModal
          isOpen={isSafetyModalOpen}
          onClose={() => {
            setIsSafetyModalOpen(false);
            setIsSafetyAccepted(true);
          }}
        />
      </div>
    </div>
  );
};
