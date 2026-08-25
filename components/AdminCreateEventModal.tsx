'use client';

import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Calendar,
  MapPin,
  Users,
  Sparkles,
  Tag,
  CheckCircle2,
  Building2,
  Globe,
  DollarSign,
  Image as ImageIcon,
  Eye,
  Type,
  List,
  Heading,
  Clock,
  Check,
  AlignLeft,
} from 'lucide-react';

interface AdminCreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEvent: any) => void;
}

// Preset Images for Quick Selection
const PRESET_PUBLIC_IMAGES = [
  'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
];

const PRESET_COMMUNITY_IMAGES = [
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80',
];

// Venue Presets for Public Events
const VENUE_PRESETS = [
  {
    name: 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)',
    location: 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC), ถ.รัชดาภิเษก คลองเตย กรุงเทพฯ',
    url: 'https://www.qsncc.com/en/whats-on/event-calendar',
    host: 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)',
  },
  {
    name: 'ไบเทค บางนา (BITEC)',
    location: 'ศูนย์นิทรรศการและการประชุมไบเทค บางนา (BITEC), กรุงเทพฯ',
    url: 'https://www.bitec.co.th/gallery',
    host: 'BITEC Bangna Exhibition Center',
  },
  {
    name: 'อิมแพ็ค เมืองทองธานี (IMPACT)',
    location: 'อิมแพ็ค เมืองทองธานี (IMPACT Arena & Challenger Hall), นนทบุรี',
    url: 'https://www.impact.co.th',
    host: 'IMPACT Exhibition Center',
  },
  {
    name: 'สยามพารากอน (Royal Paragon Hall)',
    location: 'รอยัล พารากอน ฮอลล์ ชั้น 5 สยามพารากอน กรุงเทพฯ',
    url: 'https://www.royalparagonhall.com',
    host: 'Royal Paragon Hall',
  },
];

export const AdminCreateEventModal: React.FC<AdminCreateEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Main Event Type Switcher
  const [eventType, setEventType] = useState<'public_venue' | 'community'>('public_venue');

  // Shared Common Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'heal' | 'move' | 'chill' | 'learn'>('learn');
  const [tag, setTag] = useState('Exhibition');
  const [date, setDate] = useState('28 ก.พ. - 3 มี.ค. 2026');
  const [time, setTime] = useState('10:00 - 20:00 น.');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('เข้าชมฟรี');
  const [coverImage, setCoverImage] = useState(PRESET_PUBLIC_IMAGES[0]);

  // Clean Formatted Description (NO raw HTML tags displayed!)
  const [description, setDescription] = useState(`✨ ไฮไลต์ภายในงาน:
พบกับมหกรรมสุดยิ่งใหญ่ที่รวบรวมกิจกรรม เวิร์กช็อป และนิทรรศการระดับพรีเมียมจากผู้จัดชั้นนำ

• โซนพิเศษ: สัมผัสประสบการณ์อินเตอร์แอคทีฟและนวัตกรรมใหม่
• กิจกรรมบนเวที: สัมมนา พูดคุย และมินิคอนเสิร์ตสุดประทับใจ
• ของที่ระลึก: รับสิทธิพิเศษและโปรโมชันเฉพาะผู้ลงทะเบียนล่วงหน้า

📅 สามารถบันทึกเวลานัดหมายหรือชวนเพื่อนไปร่วมเดินงานได้เลย!`);

  const [descriptionViewMode, setDescriptionViewMode] = useState<'edit' | 'preview'>('edit');

  // Public Venue Specific Fields
  const [hostName, setHostName] = useState('ผู้จัดงานทางการ / ศูนย์จัดแสดง');
  const [externalUrl, setExternalUrl] = useState('https://www.bitec.co.th/gallery');
  const [initialBuddySubActivity, setInitialBuddySubActivity] = useState('ตี้เดินดูโซนหลักและถ่ายรูปนิทรรศการ');

  // Community Meetup Specific Fields
  const [maxParticipants, setMaxParticipants] = useState<number>(8);
  const [targetGender, setTargetGender] = useState<'all' | 'female_only' | 'male_only'>('all');
  const [targetAge, setTargetAge] = useState('20 - 35 ปี');
  const [energyLevel, setEnergyLevel] = useState<'chill' | 'active'>('chill');
  const [whatToBring, setWhatToBring] = useState('กระบอกน้ำส่วนตัว, รอยยิ้ม และความพร้อมมาเปิดใจเจอเพื่อนใหม่ 🌱');
  const [rules, setRules] = useState('ตรงต่อเวลา ให้เกียรติความเป็นส่วนตัว และห้ามชวนคุยเรื่องขายตรง/การลงทุน 100% 🛡️');

  // Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Insert Formatting Snippet without raw HTML tags
  const handleInsertSnippet = (snippet: string) => {
    setDescription((prev) => (prev ? `${prev}\n${snippet}` : snippet));
  };

  // Load Clean Preset Templates
  const handleLoadTemplate = (type: 'public' | 'community') => {
    if (type === 'public') {
      setDescription(`✨ ไฮไลต์พิเศษของงาน:
มหกรรมแสดงสินค้าและนิทรรศการครั้งยิ่งใหญ่ใจกลางกรุงเทพฯ รวมผู้ประกอบการและแบรนด์ชั้นนำกว่า 200 บูธ

• ไฮไลต์ที่ 1: เปิดตัวสินค้าและนวัตกรรมใหม่ล่าสุดพร้อมโปรโมชันพิเศษ
• ไฮไลต์ที่ 2: กิจกรรมเวิร์กช็อปและ Talk Session กับกูรูชื่อดังฟรีตลอดวัน
• ไฮไลต์ที่ 3: มุมถ่ายรูป Photobooth และโซนอาหารเครื่องดื่มชั้นนำ

🎟️ ผู้สนใจสามารถลงทะเบียนล่วงหน้าเพื่อรับของที่ระลึกพิเศษหน้างาน`);
    } else {
      setDescription(`🏡 รายละเอียดกิจกรรมคอมมูนิตี้:
ชวนเพื่อนๆ มาร่วมกิจกรรมสบายๆ เป็นกันเอง พูดคุยแลกเปลี่ยนประสบการณ์และเติมพลังใจด้วยกัน

• ช่วงที่ 1: ทำความรู้จัก Ice-breaking สบายๆ ไม่มีเกร็ง
• ช่วงที่ 2: เริ่มต้นทำกิจกรรมร่วมกันพร้อมแชร์เทคนิคและประสบการณ์
• ช่วงที่ 3: ถ่ายรูปรวม และนั่งคุยชิลล์ๆ หลังจบกิจกรรม

🌿 เหมาะสำหรับทั้ง Introvert และ Extrovert ที่อยากหาเพื่อนใหม่คอเดียวกัน!`);
    }
  };

  // Render Clean Formatted Description Helper for Live Preview
  const renderFormattedPreview = (rawText: string) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');
    const elements: React.ReactNode[] = [];
    let currentBulletGroup: string[] = [];

    const flushBulletGroup = (keyPrefix: number) => {
      if (currentBulletGroup.length > 0) {
        elements.push(
          <ul key={`bg-${keyPrefix}`} className="space-y-1.5 my-2 pl-1">
            {currentBulletGroup.map((item, idx) => {
              const boldMatch = item.match(/^([^:]+):(.*)$/);
              return (
                <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700 shrink-0 mt-1.5" />
                  <div>
                    {boldMatch ? (
                      <>
                        <strong className="font-extrabold text-slate-950">{boldMatch[1]}:</strong>
                        <span>{boldMatch[2]}</span>
                      </>
                    ) : (
                      <span>{item}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        );
        currentBulletGroup = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushBulletGroup(idx);
        return;
      }

      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const cleanItem = trimmed.replace(/^[•\-*]\s*/, '');
        currentBulletGroup.push(cleanItem);
      } else {
        flushBulletGroup(idx);
        const isHeading = trimmed.startsWith('✨') || trimmed.startsWith('🏛️') || trimmed.startsWith('🏡') || trimmed.endsWith(':');
        if (isHeading) {
          elements.push(
            <h4 key={`h-${idx}`} className="font-black text-xs sm:text-sm text-slate-900 mt-2.5 mb-1 flex items-center gap-1.5">
              <span>{trimmed}</span>
            </h4>
          );
        } else {
          elements.push(
            <p key={`p-${idx}`} className="text-xs text-slate-700 leading-relaxed mb-1.5">
              {trimmed}
            </p>
          );
        }
      }
    });

    flushBulletGroup(lines.length);
    return elements;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) {
      alert('กรุณากรอกชื่องานและสถานที่จัดงาน');
      return;
    }

    try {
      setIsSubmitting(true);

      const isPublic = eventType === 'public_venue';
      const eventData = {
        title: title.trim(),
        category,
        tag: tag.trim() || (isPublic ? 'Exhibition' : 'Community'),
        date: date.trim(),
        time: time.trim(),
        location: location.trim(),
        price: price.trim() || 'เข้าชมฟรี',
        image: coverImage,
        galleryImages: isPublic ? PRESET_PUBLIC_IMAGES : PRESET_COMMUNITY_IMAGES,
        description: description.trim(),
        eventType,
        approvalStatus: 'approved' as const,
        
        // Public Venue specifics
        hostName: isPublic ? hostName.trim() : (hostName.trim() || 'โฮสต์ Chill & Connect'),
        hostAvatar: isPublic
          ? 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=150&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        externalUrl: isPublic ? externalUrl.trim() : undefined,
        link: isPublic ? externalUrl.trim() : undefined,
        source: isPublic ? (hostName.trim() || 'Admin Official') : 'Chill & Connect Community',
        
        // Community specifics
        maxParticipants: !isPublic ? Number(maxParticipants) : undefined,
        currentParticipants: !isPublic ? 1 : undefined,
        targetGender: !isPublic ? targetGender : undefined,
        targetAge: !isPublic ? targetAge : undefined,
        energyLevel: !isPublic ? energyLevel : undefined,
        whatToBring: !isPublic ? whatToBring : undefined,
        rules: !isPublic ? rules : undefined,
        
        // Sub-activities (Buddy Matcher)
        subActivities: isPublic && initialBuddySubActivity.trim() ? [
          {
            id: `sub-init-${Date.now()}`,
            title: initialBuddySubActivity.trim(),
            time: '13:00 - 15:00 น.',
            meetingPoint: 'จุดนัดพบหน้าทางเข้าฮอลล์หลัก 📍',
            targetGender: 'all' as const,
            maxMembers: 6,
            currentMembers: 1,
            creatorName: 'Admin Host 🌟',
            creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            members: [
              { name: 'Admin Host', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }
            ]
          }
        ] : [],
      };

      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', eventData }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(eventData);
        onClose();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการบันทึกกิจกรรม');
      }
    } catch (err) {
      console.error('Failed to create admin event:', err);
      alert('เกิดข้อผิดพลาดในการสร้างกิจกรรม');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-[#1E293B] text-slate-100 rounded-3xl max-w-3xl w-full border border-slate-700 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Modal Header with Type Switcher */}
        <div className="p-5 bg-[#0F172A] border-b border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#4A7C59] to-emerald-400 flex items-center justify-center text-white shadow-md">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>สร้างกิจกรรมใหม่ (Admin Event Creator)</span>
                </h2>
                <p className="text-xs text-slate-400">สร้างและเผยแพร่กิจกรรมขึ้นสู่หน้าแรกได้ทันที</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Event Type Mode Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setEventType('public_venue');
                setCoverImage(PRESET_PUBLIC_IMAGES[0]);
                handleLoadTemplate('public');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                eventType === 'public_venue'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>🏛️ อีเวนต์ & งานแฟร์ (Public Venue)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEventType('community');
                setCoverImage(PRESET_COMMUNITY_IMAGES[0]);
                handleLoadTemplate('community');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                eventType === 'community'
                  ? 'bg-[#4A7C59] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>🌿 Chill & Connect Community</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Section 1: Basic Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. ข้อมูลพื้นฐานกิจกรรม</span>
            </h3>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                ชื่องาน / กิจกรรม <span className="text-rose-400">*</span>:
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  eventType === 'public_venue'
                    ? 'เช่น มหกรรมหนังสือนานาชาติ 2026 หรือ BITEC Pop Culture Expo'
                    : 'เช่น นัดดริปกาแฟ Specialty คุยไลฟ์สไตล์ อารีย์'
                }
                className="w-full bg-slate-900 text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-hidden focus:border-[#4A7C59]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">หมวดหมู่หลัก:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-900 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="learn">🎨 สร้างสรรค์ (Learn)</option>
                  <option value="chill">☕ ชิลล์ & คาเฟ่ (Chill)</option>
                  <option value="heal">🌱 ฮีลใจ (Heal)</option>
                  <option value="move">🏃 ขยับกาย / กีฬา (Move)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">แท็กสั้น (Tag):</label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="เช่น BookFair, Anime, Coffee"
                  className="w-full bg-slate-900 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">ราคาบัตร / ค่าเข้า:</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="เช่น เข้าชมฟรี หรือ 150 บาท"
                  className="w-full bg-slate-900 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">วันที่จัดงาน:</label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="เช่น 28 ก.พ. - 3 มี.ค. 2026 หรือ 15 มี.ค. 2026"
                  className="w-full bg-slate-900 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">เวลาจัดงาน:</label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="เช่น 10:00 - 20:00 น. หรือ 13:00 - 17:00 น."
                  className="w-full bg-slate-900 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Location & Venue Specifics */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>2. สถานที่และผู้จัดงาน</span>
              </h3>

              {/* Quick Venue Presets (For Public Venue) */}
              {eventType === 'public_venue' && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400">เลือกพิกัดยอดนิยม:</span>
                  {VENUE_PRESETS.map((v, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setLocation(v.location);
                        setExternalUrl(v.url);
                        setHostName(v.host);
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 cursor-pointer"
                    >
                      {v.name.split('(')[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                สถานที่จัดงาน (Location) <span className="text-rose-400">*</span>:
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="เช่น ศูนย์การประชุมแห่งชาติสิริกิติ์ หรือ ร้าน More Than a Game Cafe อารีย์"
                className="w-full bg-slate-900 text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-hidden focus:border-[#4A7C59]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">
                  {eventType === 'public_venue' ? 'ชื่อผู้จัดงานทางการ / ศูนย์จัดแสดง:' : 'ชื่อโฮสต์ชุมชน:'}
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder={eventType === 'public_venue' ? 'เช่น BITEC Bangna หรือ QSNCC' : 'เช่น คุณส้ม บอร์ดเกมคลับ'}
                  className="w-full bg-slate-900 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-hidden"
                />
              </div>

              {eventType === 'public_venue' ? (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">เว็บไซต์ทางการ / ลิงก์ข้อมูลเพิ่มเติม:</label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://www.bitec.co.th/gallery"
                    className="w-full bg-slate-900 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-hidden"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">จำนวนรับสูงสุด (คน):</label>
                  <input
                    type="number"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(Number(e.target.value))}
                    min={2}
                    max={50}
                    className="w-full bg-slate-900 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* Community-Only Demographics Criteria */}
            {eventType === 'community' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-400">เกณฑ์เพศ:</label>
                  <select
                    value={targetGender}
                    onChange={(e) => setTargetGender(e.target.value as any)}
                    className="w-full bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">👥 ทุกเพศ</option>
                    <option value="female_only">👩 เฉพาะผู้หญิง</option>
                    <option value="male_only">👨 เฉพาะผู้ชาย</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-400">ช่วงอายุ:</label>
                  <input
                    type="text"
                    value={targetAge}
                    onChange={(e) => setTargetAge(e.target.value)}
                    placeholder="เช่น 20 - 35 ปี"
                    className="w-full bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-400">สไตล์พลังงาน:</label>
                  <select
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(e.target.value as any)}
                    className="w-full bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-hidden cursor-pointer"
                  >
                    <option value="chill">🌿 ชิลล์ๆ (Introvert Friendly)</option>
                    <option value="active">🔥 สายลุย (High Energy)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Public Venue: Initial Buddy Sub-activity */}
            {eventType === 'public_venue' && (
              <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-1.5">
                <label className="block text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>กล่องชวนเพื่อนในงาน (ตั้งต้น 1 กิจกรรมกลุ่มย่อย):</span>
                </label>
                <input
                  type="text"
                  value={initialBuddySubActivity}
                  onChange={(e) => setInitialBuddySubActivity(e.target.value)}
                  placeholder="เช่น ตี้เดินดูโซนหนังสือการ์ตูนและถ่ายรูป"
                  className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Section 3: Formatted Description Editor (Clean Text Input + Live Preview) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>3. รายละเอียดกิจกรรม (จัดย่อหน้า & Bullet Points)</span>
              </h3>

              {/* View Switcher: Edit vs Preview */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setDescriptionViewMode('edit')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    descriptionViewMode === 'edit' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AlignLeft className="w-3 h-3" />
                  <span>แก้ไขข้อความ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDescriptionViewMode('preview')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    descriptionViewMode === 'preview' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>ดูตัวอย่างการแสดงผล (Preview)</span>
                </button>
              </div>
            </div>

            {/* Quick Formatting Insert Buttons (Clean Text - No HTML tags) */}
            {descriptionViewMode === 'edit' && (
              <div className="flex items-center gap-1.5 flex-wrap bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 mr-1">เพิ่มรูปแบบ:</span>
                
                <button
                  type="button"
                  onClick={() => handleInsertSnippet('✨ ไฮไลต์ภายในงาน:')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Heading className="w-3 h-3 text-amber-400" />
                  <span>+ หัวข้อไฮไลต์</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertSnippet('• หัวข้อสำคัญ: รายละเอียดเพิ่มเติม...')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <List className="w-3 h-3 text-emerald-400" />
                  <span>+ รายการ Bullet Point (•)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertSnippet('📅 วันที่และเวลา:')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Clock className="w-3 h-3 text-sky-400" />
                  <span>+ วันที่/เวลา</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertSnippet('📍 พิกัดจุดนัดพบ:')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-rose-400" />
                  <span>+ จุดนัดพบ</span>
                </button>
              </div>
            )}

            {/* Input Editor vs Live Clean Preview Container */}
            {descriptionViewMode === 'edit' ? (
              <textarea
                rows={7}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="พิมพ์รายละเอียดกิจกรรม เช่น ไฮไลต์, ย่อหน้า, หรือใช้เครื่องหมาย • สำหรับรายการ Bullet..."
                className="w-full bg-slate-950 text-slate-100 text-xs sm:text-sm p-3.5 rounded-2xl border border-slate-700 focus:outline-hidden focus:border-[#4A7C59] leading-relaxed"
              />
            ) : (
              <div className="bg-[#FAF7F2] text-slate-900 p-4 rounded-2xl border border-[#E8E2D8] shadow-inner max-h-60 overflow-y-auto text-xs leading-relaxed space-y-1">
                {renderFormattedPreview(description)}
              </div>
            )}
          </div>

          {/* Section 4: Cover Image Picker */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>4. รูปภาพหน้าปกกิจกรรม</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(eventType === 'public_venue' ? PRESET_PUBLIC_IMAGES : PRESET_COMMUNITY_IMAGES).map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => setCoverImage(url)}
                  className={`relative h-20 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                    coverImage === url ? 'border-[#4A7C59] ring-2 ring-[#4A7C59]/40 scale-102' : 'border-slate-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="Preset Cover" className="w-full h-full object-cover" />
                  {coverImage === url && (
                    <div className="absolute inset-0 bg-[#4A7C59]/40 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400">หรือระบุ URL รูปภาพกำหนดเอง:</label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-700 flex items-center justify-end gap-3 sticky bottom-0 bg-[#1E293B] pb-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[#4A7C59] to-emerald-600 hover:from-[#3B6347] hover:to-emerald-500 text-white px-6 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-950/40 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึกกิจกรรม...' : '🚀 บันทึกและเผยแพร่กิจกรรมทันที'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
