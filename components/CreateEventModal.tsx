'use client';

import React, { useState } from 'react';
import { X, PlusCircle, Calendar, MapPin, Users, Sparkles, Tag, CheckCircle2, UserCheck, Shield, Flame } from 'lucide-react';
import { EventItem } from '@/data/mockData';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuccess: (newEvent: EventItem) => void;
}

const PRESET_IMAGES = [
  { id: 'preset-1', label: '☕ คาเฟ่ & บอร์ดเกม', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80' },
  { id: 'preset-2', label: '🏃 วิ่ง & สปอร์ต', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80' },
  { id: 'preset-3', label: '🌿 ฮีลใจ & ธรรมชาติ', url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80' },
  { id: 'preset-4', label: '🎨 ศิลปะ & เวิร์กช็อป', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80' },
  { id: 'preset-5', label: '🧘 โยคะ & สมาธิ', url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80' },
];

const AGE_SUGGESTIONS = ['ไม่จำกัดอายุ', '18 - 25 ปี', '20 - 35 ปี', '25 - 40 ปี', '30 ปีขึ้นไป'];

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onCreateSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'move' | 'heal' | 'chill' | 'learn'>('chill');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number>(6);
  const [targetGender, setTargetGender] = useState<'all' | 'female_only' | 'male_only'>('all');
  const [targetAge, setTargetAge] = useState<string>('ไม่จำกัดอายุ');
  const [energyLevel, setEnergyLevel] = useState<'chill' | 'active'>('chill');
  const [price, setPrice] = useState('ฟรี');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(PRESET_IMAGES[0].url);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  if (!isOpen) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date.trim() || !location.trim()) return;

    const finalImage = uploadedImage || image;

    const createdEvent: EventItem = {
      id: `custom-ev-${Date.now()}`,
      title: title.trim(),
      category: category,
      eventType: 'community',
      image: finalImage,
      badgeText: '✨ กิจกรรมใหม่',
      tag: category === 'move' ? '🏃 ออกกำลังกาย' : category === 'heal' ? '🌿 ฮีลใจ' : category === 'chill' ? '☕ นัดชิล' : '🎨 เวิร์กช็อป',
      date: date.trim(),
      time: time.trim() || '14:00 - 17:00 น.',
      location: location.trim(),
      venueTag: 'park',
      price: price.trim() || 'ฟรี',
      hostName: 'คุณส้ม (Som_Chill)',
      hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      participantsCount: 1,
      maxParticipants: Number(maxParticipants) || 6,
      targetGender: targetGender,
      targetAge: targetAge.trim() || 'ไม่จำกัดอายุ',
      energyLevel: energyLevel,
      description: description.trim() || 'นัดเจอชวนคุยผ่อนคลายยามว่าง บรรยากาศเป็นกันเอง Introvert Friendly!',
      isNew: true,
      createdAtTimestamp: Date.now(),
    };

    onCreateSuccess(createdEvent);
    onClose();
    // Reset
    setTitle('');
    setDate('');
    setTime('');
    setLocation('');
    setDescription('');
    setTargetAge('ไม่จำกัดอายุ');
    setTargetGender('all');
    setEnergyLevel('chill');
    setPrice('ฟรี');
    setUploadedImage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 space-y-5 shadow-2xl relative animate-scale-up border border-[#E8E2D8] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#4A7C59] flex items-center justify-center text-white shadow-xs">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#1E293B]">
                เปิดวงฮีลใจ / สร้างกิจกรรมใหม่
              </h3>
              <p className="text-xs text-[#64748B] font-medium">
                ชวนเพื่อนยามว่างมาพักผ่อน ทำกิจกรรมโปรดด้วยกัน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#64748B] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Event Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1E293B] flex items-center gap-1">
              <span>ชื่อกิจกรรม / หัวข้อนัดหมาย</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น นัดเล่นบอร์ดเกมคาเฟ่เสาร์นี้, จิบกาแฟวาดรูปสวนจตุจักร"
              className="w-full bg-slate-50 border border-[#E2DCD2] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
            />
          </div>

          {/* Category & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1E293B]">หมวดหมู่กิจกรรม:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-50 border border-[#E2DCD2] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
              >
                <option value="chill">☕ นัดชิลล์ / กาแฟ</option>
                <option value="move">🏃 ออกกำลังกาย / กีฬา</option>
                <option value="heal">🌿 ฮีลใจ / ธรรมชาติ</option>
                <option value="learn">🎨 เวิร์กช็อป / คราฟต์</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1E293B]">ค่าใช้จ่าย:</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="เช่น ฟรี, 150 บาท (หารเฉลี่ย)"
                className="w-full bg-slate-50 border border-[#E2DCD2] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1E293B]">วันที่นัดหมาย:</label>
              <input
                type="text"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="เช่น เสาร์ที่ 28 ส.ค. 2026"
                className="w-full bg-slate-50 border border-[#E2DCD2] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1E293B]">ช่วงเวลา:</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="เช่น 14:00 - 17:00 น."
                className="w-full bg-slate-50 border border-[#E2DCD2] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1E293B]">สถานที่จัดกิจกรรม:</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="เช่น ร้านคาเฟ่ More Than Games อารีย์ / สวนลุมพินี"
              className="w-full bg-slate-50 border border-[#E2DCD2] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
            />
          </div>

          {/* 🛡️ Community Preferences Section: Participants, Gender, Age, Energy */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
            <h4 className="text-xs font-extrabold text-[#1E293B] flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
              <Shield className="w-3.5 h-3.5 text-[#4A7C59]" />
              <span>การตั้งค่าผู้เข้าร่วม & ความปลอดภัย (Participant Settings)</span>
            </h4>

            {/* Row 1: Max Participants & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1E293B] flex items-center justify-between">
                  <span>จำนวนรับสูงสุด:</span>
                  <span className="text-[11px] text-[#4A7C59] font-extrabold">{maxParticipants} คน</span>
                </label>
                <input
                  type="number"
                  min={2}
                  max={30}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="w-full bg-white border border-[#E2DCD2] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1E293B]">เพศที่เปิดรับ:</label>
                <select
                  value={targetGender}
                  onChange={(e) => setTargetGender(e.target.value as any)}
                  className="w-full bg-white border border-[#E2DCD2] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
                >
                  <option value="all">👥 เปิดรับทุกเพศ (All Genders)</option>
                  <option value="female_only">👩 เฉพาะผู้หญิง (Women Only)</option>
                  <option value="male_only">👨 เฉพาะผู้ชาย (Men Only)</option>
                </select>
              </div>
            </div>

            {/* Row 2: Custom Age Range & Quick Chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1E293B] flex items-center justify-between">
                <span>ช่วงอายุที่แนะนำ (กำหนดเองได้อิสระ):</span>
                <span className="text-[10px] text-slate-500">พิมพ์ระบุเองได้</span>
              </label>
              <input
                type="text"
                value={targetAge}
                onChange={(e) => setTargetAge(e.target.value)}
                placeholder="เช่น 20 - 35 ปี, วัยทำงาน, ไม่จำกัดอายุ"
                className="w-full bg-white border border-[#E2DCD2] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
              />
              {/* Quick Age Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {AGE_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setTargetAge(sug)}
                    className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
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

            {/* Row 3: Energy Level / Vibe */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1E293B]">บรรยากาศ & ระดับพลังงาน (Vibe):</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEnergyLevel('chill')}
                  className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center gap-2 ${
                    energyLevel === 'chill'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold ring-2 ring-emerald-400/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">🌿</span>
                  <div>
                    <p className="font-bold text-[11px]">ชิลล์ / สบายๆ</p>
                    <p className="text-[9px] text-slate-500 font-normal">Introvert Friendly</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setEnergyLevel('active')}
                  className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center gap-2 ${
                    energyLevel === 'active'
                      ? 'bg-orange-50 border-orange-400 text-orange-900 font-bold ring-2 ring-orange-400/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">🔥</span>
                  <div>
                    <p className="font-bold text-[11px]">แอคทีฟ / สายลุย</p>
                    <p className="text-[9px] text-slate-500 font-normal">คุยสนุก พลังงานเต็มที่</p>
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1E293B]">รายละเอียด & กิจกรรมที่จะทำกัน:</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น กิจกรรมนี้เป็นกันเอง ไม่ต้องกลัวเกร็งนะ เหมาะสำหรับสายชิลล์..."
              className="w-full bg-slate-50 border border-[#E2DCD2] rounded-xl p-3 text-xs text-[#1E293B] focus:outline-none focus:border-[#4A7C59]"
            />
          </div>

          {/* Cover Photo */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="text-xs font-bold text-[#1E293B] flex items-center justify-between">
              <span>🖼️ รูปภาพปกกิจกรรม:</span>
              <span className="text-[10px] text-[#4A7C59] font-semibold">อัปโหลดจากเครื่อง หรือเลือกรูปสำเร็จ</span>
            </label>

            {/* Native File Upload Area */}
            <div className="p-3 rounded-2xl bg-[#FAF7F2] border-2 border-dashed border-[#C5DCCB] hover:border-[#4A7C59] transition-colors text-center space-y-2 relative">
              {uploadedImage ? (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-sm group">
                  <img src={uploadedImage} alt="Uploaded cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setUploadedImage(null)}
                      className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      🗑️ เปลี่ยนรูปภาพ
                    </button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center py-2 space-y-1.5">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#4A7C59] shadow-2xs border border-[#E8E2D8]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1E293B]">📁 คลิกเพื่อเลือกอัปโหลดรูปจากเครื่อง</p>
                    <p className="text-[10px] text-[#64748B]">รองรับ JPG, PNG, WEBP</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 pt-1">
              {PRESET_IMAGES.map((preset) => {
                const isSelected = !uploadedImage && image === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setImage(preset.url);
                      setUploadedImage(null);
                    }}
                    className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all flex flex-col items-center justify-end p-1 text-left cursor-pointer ${
                      isSelected
                        ? 'border-[#F26430] ring-2 ring-[#F26430]/20 shadow-md scale-102'
                        : 'border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <span className="relative z-10 text-[9px] font-extrabold text-white truncate w-full text-center drop-shadow-sm">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Introvert Safety Banner */}
          <div className="bg-[#EBF3ED] p-3 rounded-2xl border border-[#4A7C59]/30 text-xs text-[#4A7C59] font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>ทุกกิจกรรมชุมชนได้รับการคุ้มครองภายใต้มาตรการ Safe Space & Introvert Friendly 🌱</span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-bold text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="bg-[#4A7C59] hover:bg-[#3B6347] text-white px-7 py-2.5 rounded-full font-extrabold text-xs transition-all shadow-md shadow-[#4A7C59]/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>สร้างกิจกรรมเลย 🎉</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
