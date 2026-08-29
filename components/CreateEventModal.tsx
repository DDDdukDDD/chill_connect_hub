'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Users,
  Sparkles,
  Tag,
  CheckCircle2,
  Shield,
  Clock,
  Image as ImageIcon,
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  FileText,
  Plus,
  Trash2,
  Check,
  Navigation
} from 'lucide-react';
import { EventItem } from '@/data/mockData';
import { MOCK_SPOTS } from '@/data/spotsData';
import { SafetyGuidelinesModal } from './SafetyGuidelinesModal';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuccess: (newEvent: EventItem) => void;
  initialLocation?: string;
  initialTitle?: string;
  initialCategory?: 'move' | 'heal' | 'chill' | 'learn';
  initialImage?: string;
}

const PRESET_IMAGES = [
  { id: 'preset-1', label: 'คาเฟ่ & บอร์ดเกม', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80' },
  { id: 'preset-2', label: 'วิ่ง & สปอร์ต', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80' },
  { id: 'preset-3', label: 'ฮีลใจ & ธรรมชาติ', url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80' },
  { id: 'preset-4', label: 'ศิลปะ & เวิร์กช็อป', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80' },
  { id: 'preset-5', label: 'โยคะ & สมาธิ', url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80' },
];

const AGE_SUGGESTIONS = ['ไม่จำกัดอายุ', '18 - 25 ปี', '20 - 35 ปี', '25 - 40 ปี', '30 ปีขึ้นไป'];

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

interface ItineraryStep {
  id: string;
  time: string;
  title: string;
}

// Helper to format ISO date to beautiful Thai Date
const formatThaiDate = (isoStr: string): string => {
  if (!isoStr) return '';
  const [year, month, day] = isoStr.split('-').map(Number);
  if (!year || !month || !day) return isoStr;
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return isoStr;
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const dayName = days[d.getDay()];
  const yearBE = year + 543;
  return `วัน${dayName}ที่ ${day} ${months[month - 1]} ${yearBE}`;
};

// Helper for quick date calculation
const getCalculatedDate = (offsetDays: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onCreateSuccess,
  initialLocation = '',
  initialTitle = '',
  initialCategory = 'chill',
  initialImage,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState<'move' | 'heal' | 'chill' | 'learn'>(initialCategory);
  
  // Date & Time Controls
  const [selectedIsoDate, setSelectedIsoDate] = useState<string>(() => getCalculatedDate(1)); // Default tomorrow
  const [startTime, setStartTime] = useState('06:30');
  const [endTime, setEndTime] = useState('08:30');
  const [meetingPoint, setMeetingPoint] = useState('');
  
  const [location, setLocation] = useState(initialLocation);
  const [maxParticipants, setMaxParticipants] = useState<number>(6);
  const [targetGender, setTargetGender] = useState<'all' | 'female_only' | 'male_only'>('all');
  const [targetAge, setTargetAge] = useState<string>('ไม่จำกัดอายุ');
  const [price, setPrice] = useState('ฟรี');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(initialImage || PRESET_IMAGES[0].url);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string>('');

  // Structured Timeline / Itinerary Steps
  const [itinerary, setItinerary] = useState<ItineraryStep[]>([
    { id: 'step-1', time: '06:30 น.', title: 'รวมตัวกันหน้าจุดนัดพบ' },
    { id: 'step-2', time: '07:00 น.', title: 'เริ่มกิจกรรมหลักร่วมกัน' },
    { id: 'step-3', time: '08:15 น.', title: 'แวะจิบกาแฟ & นั่งคุยผ่อนคลาย' },
  ]);

  // Structured What to Bring items
  const [whatToBringList, setWhatToBringList] = useState<string[]>([
    'ขวดน้ำดื่มส่วนตัว',
    'รองเท้าวิ่ง / ผ้าใบ',
  ]);
  const [customBringInput, setCustomBringInput] = useState('');

  const [isSafetyAccepted, setIsSafetyAccepted] = useState(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialLocation && !location) setLocation(initialLocation);
      if (initialTitle && !title) setTitle(initialTitle);
      if (initialCategory) setCategory(initialCategory);
      if (initialImage) setImage(initialImage);
    }
  }, [isOpen, initialLocation, initialTitle, initialCategory, initialImage]);

  if (!isOpen) return null;

  // Insert markdown helper at cursor position
  const insertMarkdown = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;
    const selectedText = currentVal.substring(start, end) || defaultText;

    const newVal = currentVal.substring(0, start) + prefix + selectedText + suffix + currentVal.substring(end);
    setDescription(newVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  const handleInsertTemplate = () => {
    const template = `**ภาพรวมกิจกรรม:**
นัดเจอพูดคุยบรรยากาศสบายๆ สไตล์เป็นกันเอง เหมาะสำหรับคนที่อยากพักผ่อนและทำกิจกรรมที่ชอบร่วมกัน

**แผนกิจกรรมคร่าวๆ:**
• 06:30 น. - รวมตัวกันหน้าจุดนัดพบ
• 07:00 น. - ทำกิจกรรมร่วมกันตามอัธยาศัย
• 08:15 น. - นั่งคุยแลกเปลี่ยนมุมมอง

**ข้อแนะนำเพิ่มเติม:**
เตรียมตัวสบายๆ ไม่ต้องกังวลเรื่องเกร็งนะครับ ยินดีต้อนรับทุกคนครับ ✨`;

    setDescription((prev) => (prev ? `${prev}\n\n${template}` : template));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUploadedImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Itinerary step helpers
  const handleAddItineraryStep = () => {
    setItinerary((prev) => [
      ...prev,
      { id: `step-${Date.now()}`, time: '', title: '' },
    ]);
  };

  const handleUpdateItinerary = (id: string, field: 'time' | 'title', value: string) => {
    setItinerary((prev) =>
      prev.map((step) => (step.id === id ? { ...step, [field]: value } : step))
    );
  };

  const handleRemoveItineraryStep = (id: string) => {
    setItinerary((prev) => prev.filter((step) => step.id !== id));
  };

  // What to bring helpers
  const toggleBringItem = (item: string) => {
    setWhatToBringList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleAddCustomBring = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customBringInput.trim()) return;
    if (!whatToBringList.includes(customBringInput.trim())) {
      setWhatToBringList((prev) => [...prev, customBringInput.trim()]);
    }
    setCustomBringInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedDate = formatThaiDate(selectedIsoDate);
    const formattedTime = `${startTime} - ${endTime} น.`;

    if (!title.trim() || !formattedDate.trim() || !location.trim()) return;

    const finalImage = uploadedImage || image;
    const validItinerary = itinerary
      .filter((s) => s.title.trim())
      .map((s) => ({ time: s.time.trim(), title: s.title.trim() }));

    const finalLocation = meetingPoint.trim() ? `${location.trim()} (จุดนัดพบ: ${meetingPoint.trim()})` : location.trim();

    const createdEvent: EventItem = {
      id: `custom-ev-${Date.now()}`,
      title: title.trim(),
      category: category,
      eventType: 'community',
      image: finalImage,
      badgeText: 'กิจกรรมใหม่',
      tag: category === 'move' ? 'ออกกำลังกาย' : category === 'heal' ? 'ฮีลใจ' : category === 'chill' ? 'นัดชิลล์' : 'เวิร์กช็อป',
      date: formattedDate,
      time: formattedTime,
      location: finalLocation,
      venueTag: 'park',
      price: price.trim() || 'ฟรี',
      hostName: 'คุณส้ม (Som_Chill)',
      hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      participantsCount: 1,
      maxParticipants: Number(maxParticipants) || 6,
      targetGender: targetGender,
      targetAge: targetAge.trim() || 'ไม่จำกัดอายุ',
      energyLevel: 'chill',
      description: description.trim() || 'นัดเจอชวนคุยผ่อนคลายยามว่าง บรรยากาศเป็นกันเอง Introvert Friendly!',
      whatToBring: whatToBringList,
      instructions: meetingPoint.trim() ? [`จุดนัดพบ: ${meetingPoint.trim()}`] : undefined,
      subActivities: validItinerary.length > 0 ? validItinerary : undefined,
      isNew: true,
      createdAtTimestamp: Date.now(),
    };

    onCreateSuccess(createdEvent);
    onClose();
    // Reset
    setTitle('');
    setMeetingPoint('');
    setLocation('');
    setDescription('');
    setTargetAge('ไม่จำกัดอายุ');
    setTargetGender('all');
    setPrice('ฟรี');
    setUploadedImage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-[32px] max-w-5xl w-full p-6 sm:p-8 md:p-10 space-y-7 shadow-2xl relative animate-scale-up border border-slate-200/90 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                เปิดวงชวนเพื่อนเที่ยว / สร้างกิจกรรมใหม่
              </h3>
              <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-50 text-[#4A7C59] border border-emerald-200 shadow-2xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Safe & Chill</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              ชวนเพื่อนสายเดียวกันไปเที่ยว หรือเปิดทริปฮีลใจยามว่างด้วยกันอย่างเป็นกันเอง
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer shrink-0 ml-3 active:scale-95 shadow-2xs"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-7 text-left">
          
          {/* Main 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-8 items-start">
            
            {/* ========================================================================= */}
            {/* Left Column (7 Cols): Core Details, Story & Itinerary Timeline */}
            {/* ========================================================================= */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* 1. Event Title */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-black text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>ชื่อกิจกรรม / หัวข้อทริปชวนเพื่อน</span>
                    <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">หัวข้อกระชับ เข้าใจง่าย</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น วิ่งเช้ารับลมที่สวนเบญจกิติ, จอยบอร์ดเกมคาเฟ่อารีย์"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/20 focus:border-[#4A7C59] focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              {/* 2. Date & Time Picker Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Date Picker Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 flex flex-col justify-between shadow-2xs">
                  <label className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#4A7C59]" />
                    <span>วันที่นัดหมาย</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  
                  <input
                    type="date"
                    required
                    min={getCalculatedDate(0)}
                    value={selectedIsoDate}
                    onChange={(e) => setSelectedIsoDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/20 focus:border-[#4A7C59] cursor-pointer shadow-2xs"
                  />

                  {/* Formatted Thai Date Badge */}
                  <div className="text-xs font-black text-[#4A7C59] bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl truncate text-center shadow-2xs">
                    📅 {formatThaiDate(selectedIsoDate)}
                  </div>
                </div>

                {/* Time Range Picker Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 flex flex-col justify-between shadow-2xs">
                  <label className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#4A7C59]" />
                    <span>ช่วงเวลากิจกรรม</span>
                    <span className="text-rose-500">*</span>
                  </label>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block pb-1">เวลาเริ่ม:</span>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/20 focus:border-[#4A7C59] cursor-pointer text-center shadow-2xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block pb-1">เวลาสิ้นสุด:</span>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/20 focus:border-[#4A7C59] cursor-pointer text-center shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Formatted Time Badge */}
                  <div className="text-xs font-black text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl truncate text-center shadow-2xs">
                    ⏰ {startTime} - {endTime} น.
                  </div>
                </div>

              </div>

              {/* 3. Location & Meeting Point Section */}
              <div className="space-y-3.5 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
                {/* Fixed Spot View if opened from a spot page */}
                {initialLocation ? (
                  <div className="space-y-2">
                    <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#4A7C59]" />
                      <span>สถานที่จัดกิจกรรม (ล็อคตามสถานที่นี้):</span>
                    </span>
                    <div className="p-3.5 bg-white border border-emerald-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                          <Navigation className="w-4 h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {location}
                        </span>
                      </div>
                      <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-50 text-[#4A7C59] border border-emerald-200 shrink-0">
                        Fixed Location ✓
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#4A7C59]" />
                        <span>สถานที่จัดกิจกรรม</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-xs text-[#4A7C59] font-bold">เลือกจากสถานที่แนะนำได้</span>
                    </div>

                    <select
                      value={selectedSpotId}
                      onChange={(e) => {
                        const spotId = e.target.value;
                        setSelectedSpotId(spotId);
                        const found = MOCK_SPOTS.find((s) => s.id === spotId);
                        if (found) {
                          setLocation(`${found.title}, ${found.district}, จังหวัด${found.province}`);
                          setImage(found.image);
                          if (!title.trim()) {
                            setTitle(`ชวนไปเที่ยว ${found.title}`);
                          }
                          if (found.category === 'art') setCategory('learn');
                          else if (found.category === 'nature' || found.category === 'park' || found.category === 'viewpoint') setCategory('heal');
                          else if (found.category === 'cafe' || found.category === 'oldtown' || found.category === 'workspace') setCategory('chill');
                        }
                      }}
                      className="w-full bg-white border border-emerald-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/20 focus:border-[#4A7C59] cursor-pointer shadow-2xs"
                    >
                      <option value="">เลือกจากสถานที่แนะนำ (ช่วยกรอกข้อมูลอัตโนมัติ)...</option>
                      {MOCK_SPOTS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title} ({s.province})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="หรือพิมพ์ระบุสถานที่ เช่น สวนเบญจกิติ / คาเฟ่ More Than Games อารีย์"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/20 focus:border-[#4A7C59] transition-all placeholder:text-slate-400"
                    />
                  </div>
                )}

                {/* Dedicated Meeting Point Field */}
                <div className="space-y-1.5 pt-1 border-t border-slate-200/80">
                  <label className="text-xs sm:text-sm font-black text-slate-900 flex items-center justify-between">
                    <span>จุดนัดพบที่แน่นอน / จุดสังเกต (Meeting Point):</span>
                    <span className="text-[11px] text-slate-400 font-normal">เช่น หน้าร้านกาแฟ, หน้าเสาธง</span>
                  </label>
                  <input
                    type="text"
                    value={meetingPoint}
                    onChange={(e) => setMeetingPoint(e.target.value)}
                    placeholder="เช่น หน้าประตู 1 โซนลานจอดรถ, หน้าบันไดสกายวอล์ค, หน้าร้านกาแฟ"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/20 focus:border-[#4A7C59] transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* 4. Rich Description with Markdown Mini-Toolbar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-black text-slate-900">
                    รายละเอียด & กิจกรรมที่จะทำกัน:
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">รองรับ Markdown Formatter</span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-[#4A7C59] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#4A7C59]/20 transition-all shadow-2xs">
                  
                  {/* Clean Mini-Toolbar */}
                  <div className="flex items-center justify-between px-3.5 py-2 bg-slate-100/90 border-b border-slate-200 text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => insertMarkdown('**', '**', 'ข้อความตัวหนา')}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer active:scale-95"
                        title="ตัวหนา (Bold)"
                      >
                        <Bold className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => insertMarkdown('*', '*', 'ข้อความตัวเอียง')}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer active:scale-95"
                        title="ตัวเอียง (Italic)"
                      >
                        <Italic className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => insertMarkdown('### ', '', 'หัวข้อย่อย')}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer active:scale-95"
                        title="หัวข้อย่อย (Heading)"
                      >
                        <Heading2 className="w-4 h-4" />
                      </button>

                      <span className="text-slate-300 mx-1.5">|</span>

                      <button
                        type="button"
                        onClick={() => insertMarkdown('• ', '', 'รายการ')}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer active:scale-95"
                        title="รายการแบบจุด (Bullet list)"
                      >
                        <List className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => insertMarkdown('1. ', '', 'ขั้นตอน')}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer active:scale-95"
                        title="ลำดับตัวเลข (Numbered list)"
                      >
                        <ListOrdered className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleInsertTemplate}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#4A7C59]" />
                      <span>ใส่แม่แบบกำหนดการ</span>
                    </button>
                  </div>

                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    rows={8}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="เล่ารายละเอียดกิจกรรม เช่น บรรยากาศเป็นอย่างไร นัดรวมตัวที่ไหน เหมาะสำหรับใครบ้าง (สามารถกดปุ่มเครื่องมือด้านบนเพื่อจัดข้อความ หรือกดปุ่ม 'ใส่แม่แบบกำหนดการ' เพื่อช่วยร่างข้อความได้ทันที)..."
                    className="w-full bg-transparent p-4 text-sm text-slate-900 focus:outline-none leading-relaxed resize-y min-h-[200px] sm:min-h-[240px] placeholder:text-slate-400 placeholder:font-normal font-normal"
                  />

                  {/* Editor Info Bar */}
                  <div className="px-4 py-2 bg-slate-100/60 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>💡 กดปุ่มแม่แบบด้านบนเพื่อแทรกโครงสร้างกำหนดการทันที</span>
                    <span className="font-bold text-slate-600">{description.length} ตัวอักษร</span>
                  </div>
                </div>
              </div>

              {/* 5. 🗓️ Structured Timeline / Itinerary Builder (Placed directly under description) */}
              <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#4A7C59]" />
                      <span>กำหนดการกิจกรรม (Itinerary):</span>
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium">ระบุไทม์ไลน์คร่าวๆ ให้เพื่อนๆ ทราบขั้นตอน</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItineraryStep}
                    className="inline-flex items-center gap-1 text-xs font-black text-[#4A7C59] bg-white border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-50 cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มช่วงเวลา</span>
                  </button>
                </div>

                <div className="space-y-2.5 pt-1">
                  {itinerary.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black shrink-0">
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        value={step.time}
                        onChange={(e) => handleUpdateItinerary(step.id, 'time', e.target.value)}
                        placeholder="06:30 น."
                        className="w-24 bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/20 focus:border-[#4A7C59] shrink-0 text-center shadow-2xs"
                      />
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => handleUpdateItinerary(step.id, 'title', e.target.value)}
                        placeholder={`เช่น รวมตัวกันหน้าจุดนัดพบ`}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/20 focus:border-[#4A7C59] shadow-2xs"
                      />
                      {itinerary.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItineraryStep(step.id)}
                          className="text-slate-400 hover:text-rose-500 p-1.5 transition-colors cursor-pointer shrink-0"
                          title="ลบแถวนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ========================================================================= */}
            {/* Right Column (5 Cols): Cover Image, What to Bring & Participant Settings */}
            {/* ========================================================================= */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* 1. Cover Photo Card */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-black text-slate-900 flex items-center justify-between">
                  <span>รูปภาพปกกิจกรรม:</span>
                  <span className="text-[11px] text-slate-400 font-medium">อัปโหลดหรือเลือกรูปสำเร็จ</span>
                </label>

                <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-[#4A7C59] transition-colors text-center relative overflow-hidden">
                  {uploadedImage ? (
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-2xs group">
                      <img src={uploadedImage} alt="Uploaded cover" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setUploadedImage(null)}
                          className="bg-rose-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md transition-colors cursor-pointer active:scale-95"
                        >
                          เปลี่ยนรูปภาพ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center py-3 space-y-1.5">
                      <ImageIcon className="w-7 h-7 text-slate-400" />
                      <p className="text-xs sm:text-sm font-bold text-slate-800">คลิกเพื่ออัปโหลดรูปจากเครื่อง</p>
                      <p className="text-[11px] text-slate-400">รองรับไฟล์ JPG, PNG, WEBP</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-0.5">
                  {PRESET_IMAGES.slice(0, 3).map((preset) => {
                    const isSelected = !uploadedImage && image === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setImage(preset.url);
                          setUploadedImage(null);
                        }}
                        className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#4A7C59] ring-2 ring-[#4A7C59]/20 shadow-xs scale-102'
                            : 'border-slate-200 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-end p-1.5">
                          <span className="text-[10px] font-black text-white truncate w-full text-center">
                            {preset.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. 🎒 What to Bring Section */}
              <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
                <span className="text-xs sm:text-sm font-black text-slate-900 block">
                  สิ่งที่ต้องเตรียมมา (What to Bring):
                </span>

                {/* Selected Chips */}
                {whatToBringList.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {whatToBringList.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5 text-[#4A7C59]" />
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => toggleBringItem(item)}
                          className="hover:text-rose-600 ml-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick Add Suggestion Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 font-medium block">แตะเพื่อเพิ่มด่วน:</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {WHAT_TO_BRING_SUGGESTIONS.filter((sug) => !whatToBringList.includes(sug)).map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => toggleBringItem(sug)}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#4A7C59] text-slate-600 hover:text-[#4A7C59] transition-colors cursor-pointer active:scale-95 shadow-2xs"
                      >
                        + {sug}
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
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/20 focus:border-[#4A7C59] shadow-2xs placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomBring()}
                    className="px-4 py-2 rounded-xl bg-[#4A7C59] text-white text-xs sm:text-sm font-bold hover:bg-[#3B6347] transition-all shrink-0 cursor-pointer active:scale-95 shadow-2xs"
                  >
                    เพิ่ม
                  </button>
                </div>
              </div>

              {/* 3. Participant Settings Card (No Vibe / Energy Level) */}
              <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3.5 shadow-2xs">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 border-b border-slate-200/80 pb-2.5">
                  <Shield className="w-4 h-4 text-[#4A7C59]" />
                  <span>การตั้งค่าผู้เข้าร่วม & ความปลอดภัย</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center justify-between">
                      <span>จำนวนรับ:</span>
                      <span className="text-[#4A7C59] font-black">{maxParticipants} คน</span>
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={30}
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/20 focus:border-[#4A7C59] shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-bold text-slate-900">เพศที่เปิดรับ:</label>
                    <select
                      value={targetGender}
                      onChange={(e) => setTargetGender(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/20 focus:border-[#4A7C59] cursor-pointer shadow-2xs"
                    >
                      <option value="all">ทุกเพศ</option>
                      <option value="female_only">เฉพาะผู้หญิง</option>
                      <option value="male_only">เฉพาะผู้ชาย</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-bold text-slate-900">ค่าใช้จ่าย:</label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="เช่น ฟรี, 150 บาท"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/20 focus:border-[#4A7C59] shadow-2xs"
                  />
                </div>

                {/* Age Input & Suggestion chips */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-slate-900">ช่วงอายุที่แนะนำ:</label>
                    <span className="text-[11px] text-slate-400 font-medium">พิมพ์ระบุเองได้</span>
                  </div>
                  <input
                    type="text"
                    value={targetAge}
                    onChange={(e) => setTargetAge(e.target.value)}
                    placeholder="เช่น 20 - 35 ปี, วัยทำงาน, ไม่จำกัดอายุ"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/20 focus:border-[#4A7C59] shadow-2xs"
                  />
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {AGE_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setTargetAge(sug)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer shadow-2xs ${
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

              </div>

            </div>

          </div>

          {/* Safe Space & Legal Disclaimer Consent Banner */}
          <div className="bg-emerald-50/70 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 space-y-2 shadow-2xs">
            <label className="flex items-start gap-3 cursor-pointer text-xs sm:text-sm text-emerald-950 font-medium select-none">
              <input
                type="checkbox"
                required
                checked={isSafetyAccepted}
                onChange={(e) => setIsSafetyAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#4A7C59] focus:ring-[#4A7C59] border-emerald-300 shrink-0 cursor-pointer"
              />
              <span className="leading-relaxed">
                ข้าพเจ้ายินยอมปฏิบัติตาม{' '}
                <button
                  type="button"
                  onClick={() => setIsSafetyModalOpen(true)}
                  className="font-black text-[#4A7C59] underline hover:text-[#3B6347] cursor-pointer"
                >
                  แนวทางความปลอดภัยและข้อกำหนดชุมชน
                </button>{' '}
                นัดพบในพื้นที่สาธารณะ และรับทราบว่าแพลตฟอร์มเป็นเพียงพื้นที่สื่อกลางออนไลน์
              </span>
            </label>
          </div>

          {/* Action Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!isSafetyAccepted}
              className={`px-8 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                isSafetyAccepted
                  ? 'bg-[#4A7C59] hover:bg-[#3B6347] text-white shadow-[#4A7C59]/25 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>เปิดวงชวนเพื่อนเลย 🎉</span>
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
