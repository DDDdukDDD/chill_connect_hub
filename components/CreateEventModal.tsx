'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  Users,
  Building,
  Image as ImageIcon,
  Compass,
  ArrowRight,
  Sparkles,
  Shield,
  ShieldAlert,
  CheckCircle2,
  Check,
  Upload,
  Heart,
  Tag,
  Target,
  Gift,
  Crown,
  Zap,
  ShieldCheck,
  Trophy,
  Medal,
  Award,
  Camera,
  CheckCircle
} from 'lucide-react';
import { EventItem } from '@/data/mockData';
import { ALL_THAI_PROVINCES } from '@/data/spotsData';
import { useAuth } from '@/lib/useAuth';
import { RichTextEditor, stripHtmlToPlainText, renderDescriptionContent } from './RichTextEditor';

export type CreationEntityType = 'community' | 'fair' | 'spot' | 'challenge';

const VENUE_OPTIONS = [
  { id: 'qsncc', label: 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)', tag: 'qsncc' as const },
  { id: 'bitec', label: 'ไบเทค บางนา (BITEC)', tag: 'bitec' as const },
  { id: 'impact', label: 'อิมแพ็ค เมืองทองธานี (IMPACT)', tag: 'impact' as const },
  { id: 'bacc', label: 'หอศิลปวัฒนธรรมแห่งกรุงเทพฯ (BACC)', tag: 'park' as const },
  { id: 'other', label: 'ศูนย์จัดแสดง / พื้นที่สาธารณะอื่นๆ', tag: 'park' as const },
];

const SPOT_VIBE_CATEGORIES = [
  { id: 'slowbar', label: '☕ สโลว์บาร์ & กาแฟดริป', icon: '☕' },
  { id: 'nature', label: '🌿 ธรรมชาติ & สวนเขียว', icon: '🌿' },
  { id: 'viewpoint', label: '🌄 จุดชมวิว & หมอกเช้า', icon: '🌄' },
  { id: 'oldtown', label: '🏮 ย่านเก่า & สถาปัตย์', icon: '🏮' },
  { id: 'art', label: '🎨 ศิลปะ & สเปซสร้างสรรค์', icon: '🎨' },
  { id: 'community_space', label: '🏡 คอมมูนิตี้สเปซ & เวิร์กช็อป', icon: '🏡' },
  { id: 'riverside', label: '🌊 ริมน้ำ & พระอาทิตย์ตก', icon: '🌊' },
];

const PRESET_IMAGES: Record<CreationEntityType, Array<{ id: string; label: string; url: string }>> = {
  community: [
    { id: 'comm-1', label: 'จิบกาแฟ & ชิลล์', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80' },
    { id: 'comm-2', label: 'วิ่ง & สปอร์ต', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80' },
    { id: 'comm-3', label: 'ฮีลใจ & ธรรมชาติ', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80' },
    { id: 'comm-4', label: 'ศิลปะ & เวิร์กช็อป', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80' },
  ],
  fair: [
    { id: 'fair-1', label: 'QSNCC เอ็กซ์โป', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80' },
    { id: 'fair-2', label: 'งานศิลป์ & ดีไซน์', url: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=800&q=80' },
    { id: 'fair-3', label: 'งานหนังสือ & เสวนา', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80' },
    { id: 'fair-4', label: 'กาแฟ & เบเกอรี่', url: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=80' },
  ],
  spot: [
    { id: 'spot-1', label: 'สโลว์บาร์ลับ', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80' },
    { id: 'spot-2', label: 'จุดชมวิวภูเขา', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
    { id: 'spot-3', label: 'สเปซศิลปะ', url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80' },
    { id: 'spot-4', label: 'ริมน้ำสงบ', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
  ],
  challenge: [
    { id: 'ch-1', label: 'เควสต์สำรวจเมือง', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80' },
    { id: 'ch-2', label: 'เควสต์ธรรมชาติ', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80' },
    { id: 'ch-3', label: 'เควสต์คาเฟ่ฮอปปิ้ง', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80' },
    { id: 'ch-4', label: 'เควสต์ออกกำลังกาย', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80' },
  ],
};

const getLeadTimeDate = (daysAhead: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

const formatThaiDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  return `${day} ${thaiMonths[month - 1]} ${year + 543}`;
};

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: CreationEntityType;
  initialCategory?: 'move' | 'heal' | 'chill' | 'learn';
  initialLocation?: string;
  initialTitle?: string;
  initialImage?: string;
  onCreateSuccess: (newEvent: EventItem) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  initialType = 'community',
  initialCategory = 'chill',
  initialLocation = '',
  initialTitle = '',
  initialImage = '',
  onCreateSuccess,
}) => {
  const { userProfile, handleSetRole } = useAuth();
  const isAdmin = userProfile.role === 'admin';
  const isOrganizer = userProfile.role === 'organizer' || isAdmin;
  const isVenueOwner = userProfile.role === 'venue_owner' || isAdmin;
  const isHost = userProfile.role === 'host' || isAdmin;

  // Wizard Steps: 1: Choose Type, 2: Form, 3: Preview & Confirm
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [entityType, setEntityType] = useState<CreationEntityType>(initialType);

  // Common Form Fields
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState('');
  const [province, setProvince] = useState('กรุงเทพมหานคร');
  const [district, setDistrict] = useState('');
  const [locationName, setLocationName] = useState(initialLocation);
  const [price, setPrice] = useState('ฟรี');
  const [image, setImage] = useState(initialImage || PRESET_IMAGES.community[0].url);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Community fields
  const [communityCategory, setCommunityCategory] = useState<'move' | 'heal' | 'chill' | 'learn'>(initialCategory);
  const [communityDate, setCommunityDate] = useState(() => getLeadTimeDate(isAdmin ? 0 : 3));
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('09:30');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number>(8);
  const [targetGender, setTargetGender] = useState<'all' | 'female_only' | 'male_only'>('all');
  const [targetAge, setTargetAge] = useState('ไม่จำกัดอายุ');
  const [whatToBringList, setWhatToBringList] = useState<string[]>(['ขวดน้ำดื่มส่วนตัว', 'รอยยิ้ม & เป็นกันเอง']);
  const [customBringInput, setCustomBringInput] = useState('');
  const [transportation, setTransportation] = useState('พบกัน ณ จุดนัดพบ (เดินทางอิสระ)');
  const [contactChannel, setContactChannel] = useState('');

  // Fair fields
  const [fairOrganizer, setFairOrganizer] = useState('');
  const [fairVenueId, setFairVenueId] = useState('qsncc');
  const [fairStartDate, setFairStartDate] = useState(() => getLeadTimeDate(isAdmin ? 0 : 7));
  const [fairEndDate, setFairEndDate] = useState(() => getLeadTimeDate(isAdmin ? 3 : 10));
  const [fairTicketUrl, setFairTicketUrl] = useState('');

  // Spot fields
  const [spotCategory, setSpotCategory] = useState('slowbar');
  const [spotOpenHours, setSpotOpenHours] = useState('08:00 - 18:00 น.');
  const [spotBestTime, setSpotBestTime] = useState('15:30 - 17:30 น.');
  const [spotGoogleMapUrl, setSpotGoogleMapUrl] = useState('');
  const [spotHighlights, setSpotHighlights] = useState<string[]>(['มุมถ่ายรูปแสงธรรมชาติสวย', 'บรรยากาศสงบ นั่งอ่านหนังสือได้']);

  // Challenge / Quest specialized fields (1:1 with Quest Detail Modal)
  const [questIcon, setQuestIcon] = useState('☕');
  const [questMoodCategory, setQuestMoodCategory] = useState<'chill' | 'move' | 'heal' | 'learn'>('chill');
  const [questIsOfficial, setQuestIsOfficial] = useState(true);
  const [questStartDate, setQuestStartDate] = useState(() => getLeadTimeDate(0));
  const [questEndDate, setQuestEndDate] = useState(() => getLeadTimeDate(30));
  const [questObjective, setQuestObjective] = useState(
    'สนับสนุนร้านกาแฟ Specialty ในย่านอารีย์ และสร้างแรงบันดาลใจให้เพื่อนๆ ออกไปสัมผัสบรรยากาศคาเฟ่คราฟต์'
  );
  const [questSteps, setQuestSteps] = useState<string[]>([
    'เลือกร้านกาแฟพาร์ทเนอร์ย่านอารีย์ในระบบ',
    'สั่งเครื่องดื่มและถ่ายภาพเช็คอินโมเมนต์',
    'สะสมครบ 3 ร้านเพื่อรับเหรียญและคะแนน XP',
  ]);
  const [questVerificationMethod, setQuestVerificationMethod] = useState(
    '📸 ถ่ายรูปภาพแก้วกาแฟหรือหน้าร้านคู่กับการเช็คอิน GPS'
  );
  const [questTargetCount, setQuestTargetCount] = useState<number>(3);
  const [questBadgeName, setQuestBadgeName] = useState('Coffee Explorer');
  const [questBadgeIcon, setQuestBadgeIcon] = useState('☕');
  const [questRewardPoints, setQuestRewardPoints] = useState(300);
  const [questRewardsText, setQuestRewardsText] = useState(
    '✨ 🏅 เหรียญเกียรติยศ "Coffee Explorer" บนหน้าโปรไฟล์ + ⚡ 300 XP'
  );

  const handleAddQuestStep = () => {
    setQuestSteps((prev) => [...prev, 'ทำกิจกรรมตามเป้าหมายและบันทึกความคืบหน้า']);
  };

  const handleUpdateQuestStep = (idx: number, val: string) => {
    setQuestSteps((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleRemoveQuestStep = (idx: number) => {
    setQuestSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  // Itinerary fields
  const [itinerary, setItinerary] = useState<Array<{ time: string; title: string }>>([
    { time: '07:00 น.', title: 'รวมตัวกัน ณ จุดนัดพบ ทำความรู้จักกันสั้นๆ' },
    { time: '07:30 น.', title: 'เริ่มกิจกรรมหลักร่วมกัน' },
    { time: '09:00 น.', title: 'แวะพักผ่อน / จิบกาแฟพูดคุยแลกเปลี่ยนมุมมอง' },
  ]);

  const handleAddItineraryRow = () => {
    setItinerary((prev) => [...prev, { time: '09:30 น.', title: 'กิจกรรมเพิ่มเติม' }]);
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

  // Safety acceptance
  const [isSafetyAccepted, setIsSafetyAccepted] = useState(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);

  const minCommunityDate = isAdmin ? getLeadTimeDate(0) : getLeadTimeDate(3);
  const minFairDate = isAdmin ? getLeadTimeDate(0) : getLeadTimeDate(7);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEntityType(initialType);
      if (initialTitle) setTitle(initialTitle);
      if (initialLocation) setLocationName(initialLocation);
      if (initialCategory) setCommunityCategory(initialCategory);
      if (initialImage) setImage(initialImage);
      setImage(PRESET_IMAGES[initialType]?.[0]?.url || PRESET_IMAGES.community[0].url);
      setErrorMessage(null);
    }
  }, [isOpen, initialType, initialTitle, initialLocation, initialCategory, initialImage]);

  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setUploadError('รองรับเฉพาะไฟล์รูปภาพ .jpg, .png, .webp เท่านั้น');
        return;
      }

      const maxSizeInBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        setUploadError('ขนาดไฟล์เกิน 5MB กรุณาเลือกรูปภาพที่มีขนาดเล็กลง');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUploadedImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const DESCRIPTION_TEMPLATES: Record<CreationEntityType, { label: string; text: string }> = {
    community: {
      label: 'ใช้โครงสร้างรายละเอียดกิจกรรม',
      text: `<p><strong>ภาพรวม & บรรยากาศกิจกรรม:</strong></p>
<p>นัดรวมตัวทำกิจกรรมร่วมกันในบรรยากาศเป็นกันเอง เหมาะสำหรับคนที่อยากมาพักผ่อน พบปะเพื่อนใหม่สายเดียวกัน ใครมาคนเดียวไม่ต้องเกร็ง มีโฮสต์คอยต้อนรับและดูแลตลอดทริปครับ</p>
<p><br></p>
<p><strong>สไตล์กิจกรรม & เหมาะสำหรับใคร:</strong></p>
<ul>
  <li>สายชิลล์ เน้นความสบาย ไม่แข่งขัน ไม่รีบเร่ง</li>
  <li>เปิดรับทั้งมือใหม่และคนที่อยากหาเพื่อนทำกิจกรรมยามว่าง</li>
  <li>พูดคุยแลกเปลี่ยนมุมมองในบรรยากาศผ่อนคลายและปลอดภัย</li>
</ul>
<p><br></p>
<p><strong>หมายเหตุเพิ่มเติมจากโฮสต์:</strong></p>
<p>สามารถดูจุดนัดพบ กำหนดการเวลา และสิ่งที่ต้องเตรียมมาได้ที่แถบข้อมูลเลยครับ มาร่วมสร้างโมเมนต์ดีๆ ด้วยกันนะ!</p>`
    },
    fair: {
      label: 'ใช้โครงสร้างรายละเอียดงานมหกรรม',
      text: `<p><strong>ภาพรวม & ไฮไลต์ของงาน:</strong></p>
<p>งานมหกรรมและนิทรรศการที่รวบรวมบูธชั้นนำ กิจกรรมเสวนา และการแสดงผลงานสร้างสรรค์ไว้ในที่เดียว เหมาะสำหรับผู้ที่สนใจอัปเดตเทรนด์ เสพแรงบันดาลใจ และเดินชมนิทรรศการคุณภาพ</p>
<p><br></p>
<p><strong>โซนกิจกรรมที่น่าสนใจ:</strong></p>
<ul>
  <li>โซนจัดแสดงผลงานและนิทรรศการพิเศษ (Main Exhibition)</li>
  <li>เวทีเสวนาและเวิร์กช็อปจากผู้เชี่ยวชาญ (Stage & Talks)</li>
  <li>โซนจำหน่ายสินค้าและโปรโมชันพิเศษเฉพาะในงาน</li>
</ul>
<p><br></p>
<p><strong>คำแนะนำในการเข้าชม:</strong></p>
<p>งานเปิดให้เข้าชมตามวันและเวลาที่ระบุ เดินทางสะดวกด้วยระบบขนส่งสาธารณะ สามารถเช็คตารางกิจกรรมและลิงก์จองบัตรได้ที่ข้อมูลด้านข้าง</p>`
    },
    spot: {
      label: 'ใช้โครงสร้างรายละเอียดพิกัดเที่ยว',
      text: `<p><strong>บรรยากาศ & จุดเด่นของสถานที่:</strong></p>
<p>สเปซพักผ่อนบรรยากาศสงบ โดดเด่นด้วยการออกแบบและแสงธรรมชาติ เหมาะสำหรับคนที่ต้องการหลีกหนีความวุ่นวาย มานั่งอ่านหนังสือ จิบเครื่องดื่ม หรือเสพงานศิลป์ท่ามกลางบรรยากาศผ่อนคลาย</p>
<p><br></p>
<p><strong>มุมถ่ายรูป & ประสบการณ์แนะนำ:</strong></p>
<ul>
  <li>มุมแสงธรรมชาติช่วงบ่าย สวยและถ่ายรูปขึ้นมาก</li>
  <li>เมนูเครื่องดื่ม / กาแฟ Specialty ซิกเนเจอร์ที่ควรลอง</li>
  <li>พื้นที่นั่งสบาย มีมุมสงบสำหรับนั่งพักผ่อน</li>
</ul>
<p><br></p>
<p><strong>ช่วงเวลาที่แนะนำ:</strong></p>
<p>แนะนำช่วงเช้าแดดอ่อนๆ หรือช่วงเย็นแดดร่มลมตก บรรยากาศจะชิลล์เป็นพิเศษ</p>`
    },
    challenge: {
      label: 'ใช้โครงสร้างรายละเอียดภารกิจ',
      text: `<p><strong>เป้าหมายภารกิจ:</strong></p>
<p>พิชิตเควสต์ไลฟ์สไตล์ เช็คอินสถานที่เป้าหมายเพื่อสะสมคะแนน EXP และรับเหรียญรางวัลพิเศษประจำภารกิจ</p>
<p><br></p>
<p><strong>กติกา & เงื่อนไขการพิชิตเควสต์:</strong></p>
<ol>
  <li>เดินทางไปเช็คอิน ณ พิกัดที่กำหนดในระบบ</li>
  <li>ถ่ายภาพโมเมนต์ความประทับใจและแชร์ลงในหน้า Moments</li>
  <li>รับเหรียญรางวัลและคะแนนสะสมเข้าสู่โปรไฟล์ของคุณทันที</li>
</ol>`
    }
  };

  const applyTemplate = () => {
    const tpl = DESCRIPTION_TEMPLATES[entityType]?.text;
    if (tpl) {
      setDescription(tpl);
    }
  };

  const toggleBringItem = (item: string) => {
    setWhatToBringList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleAddBringItem = () => {
    if (!customBringInput.trim()) return;
    if (!whatToBringList.includes(customBringInput.trim())) {
      setWhatToBringList([...whatToBringList, customBringInput.trim()]);
    }
    setCustomBringInput('');
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateStep2 = (): boolean => {
    setErrorMessage(null);

    // 1. Title validation (Crucial for card titles and page headers)
    if (!title.trim()) {
      setErrorMessage('กรุณาระบุชื่อหัวข้อกิจกรรมหรือสถานที่');
      return false;
    }
    if (title.trim().length < 5) {
      setErrorMessage('ชื่อหัวข้อต้องมีความยาวอย่างน้อย 5 ตัวอักษร');
      return false;
    }

    // 2. Location & Province Validation (Crucial for badges, maps, and province filters)
    if (!locationName.trim()) {
      setErrorMessage('กรุณาระบุชื่อสถานที่ / ย่าน / จุดสังเกตให้ชัดเจน');
      return false;
    }
    if (!province) {
      setErrorMessage('กรุณาเลือกจังหวัดของสถานที่');
      return false;
    }

    // 3. Entity-specific required fields
    if (entityType === 'community') {
      if (!communityDate) {
        setErrorMessage('กรุณาเลือกวันที่จัดกิจกรรม');
        return false;
      }
      if (!startTime || !endTime) {
        setErrorMessage('กรุณาระบุเวลาเริ่มและเวลาสิ้นสุดกิจกรรม');
        return false;
      }
      if (!maxParticipants || maxParticipants < 2) {
        setErrorMessage('จำนวนคนที่เปิดรับต้องมีอย่างน้อย 2 คน');
        return false;
      }
      if (!meetingPoint.trim()) {
        setErrorMessage('กรุณาระบุจุดนัดพบที่แน่นอน / จุดสังเกต (Meeting Point) เพื่อความสะดวกของผู้ร่วมกิจกรรม');
        return false;
      }
    } else if (entityType === 'fair') {
      if (!fairStartDate || !fairEndDate) {
        setErrorMessage('กรุณาระบุวันเริ่มงานและวันสิ้นสุดงานจัดแสดง');
        return false;
      }
      if (fairStartDate > fairEndDate) {
        setErrorMessage('วันสิ้นสุดงานต้องไม่เกิดขึ้นก่อนวันเริ่มงาน');
        return false;
      }
      if (!fairOrganizer.trim()) {
        setErrorMessage('กรุณาระบุชื่อองค์กร / ผู้จัดงาน เพื่อความน่าเชื่อถือของข้อมูล');
        return false;
      }
    } else if (entityType === 'spot') {
      if (!spotOpenHours.trim()) {
        setErrorMessage('กรุณาระบุเวลาเปิด-ปิดของสถานที่');
        return false;
      }
    } else if (entityType === 'challenge') {
      if (!questObjective.trim()) {
        setErrorMessage('กรุณาระบุวัตถุประสงค์และที่มาของภารกิจ (Section 1)');
        return false;
      }
      if (questSteps.length === 0 || questSteps.some((s) => !s.trim())) {
        setErrorMessage('กรุณาระบุขั้นตอนและเงื่อนไขการทำภารกิจอย่างน้อย 1 ขั้นตอน (Section 2)');
        return false;
      }
      if (!questVerificationMethod.trim()) {
        setErrorMessage('กรุณาระบุวิธีการตรวจสอบและส่งหลักฐาน (Section 3)');
        return false;
      }
      if (!questBadgeName.trim()) {
        setErrorMessage('กรุณาระบุชื่อเหรียญรางวัลประจำภารกิจ (Section 4)');
        return false;
      }
    }

    // 4. Description validation (RichTextEditor content for non-challenge)
    if (entityType !== 'challenge') {
      const plainDesc = stripHtmlToPlainText(description);
      if (!plainDesc || plainDesc.length < 15) {
        setErrorMessage('กรุณากรอกรายละเอียด & บรรยากาศอย่างน้อย 15 ตัวอักษร เพื่อให้เพื่อนๆ ทราบข้อมูลครบถ้วน');
        return false;
      }
    }

    return true;
  };

  const handleProceedToStep3 = () => {
    if (validateStep2()) {
      setStep(3);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) {
      setStep(2);
      return;
    }

    if (!isSafetyAccepted && !isAdmin) {
      setErrorMessage('กรุณากดยืนยันและยอมรับข้อกำหนดความปลอดภัยของแพลตฟอร์ม');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalImage = uploadedImage || image;

      if (entityType === 'community') {
        const formattedDate = formatThaiDate(communityDate);
        const formattedTime = `${startTime} - ${endTime} น.`;
        const fullLocation = meetingPoint.trim() 
          ? `${locationName.trim()} (จุดนัดพบ: ${meetingPoint.trim()})` 
          : `${locationName.trim()}, จังหวัด${province}`;

        const communityPayload: EventItem = {
          id: `comm-user-${Date.now()}`,
          title: title.trim(),
          category: communityCategory,
          eventType: 'community',
          image: finalImage,
          badgeText: 'เปิดรับสมัคร',
          tag: communityCategory === 'move' ? 'ออกกำลังกาย' : communityCategory === 'heal' ? 'ฮีลใจ' : communityCategory === 'chill' ? 'นัดชิลล์' : 'เวิร์กช็อป',
          date: formattedDate,
          time: formattedTime,
          location: fullLocation,
          venueTag: 'park',
          price: price.trim() || 'ฟรี',
          hostName: userProfile.name || 'คุณส้ม (Som_Chill)',
          hostAvatar: userProfile.avatar,
          participantsCount: 1,
          maxParticipants: Number(maxParticipants) || 8,
          targetGender: targetGender,
          targetAge: targetAge || 'ไม่จำกัดอายุ',
          energyLevel: 'chill',
          description: description.trim() || 'ชวนเพื่อนสายเดียวกันมาเปิดประสบการณ์และทำกิจกรรมฮีลใจร่วมกัน บรรยากาศเป็นกันเอง!',
          whatToBring: whatToBringList,
          transportation: transportation,
          contactChannel: contactChannel.trim() || undefined,
          isNew: true,
          createdAtTimestamp: Date.now(),
        };

        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventData: communityPayload, userRole: userProfile.role }),
        });
        const data = await res.json();

        if (data.success) {
          onCreateSuccess(communityPayload);
        } else {
          onCreateSuccess(communityPayload);
        }
      } else if (entityType === 'fair') {
        const venueObj = VENUE_OPTIONS.find(v => v.id === fairVenueId);
        const formattedStart = formatThaiDate(fairStartDate);
        const formattedEnd = formatThaiDate(fairEndDate);
        const dateRangeStr = `${formattedStart} - ${formattedEnd}`;

        const fairPayload: EventItem = {
          id: `fair-user-${Date.now()}`,
          title: title.trim(),
          category: 'chill',
          eventType: 'public_venue',
          image: finalImage,
          badgeText: 'ศูนย์จัดแสดง',
          tag: 'งานมหกรรม',
          date: dateRangeStr,
          time: '10:00 - 20:00 น.',
          location: locationName.trim() || venueObj?.label || 'ศูนย์การประชุมแห่งชาติสิริกิติ์',
          venueTag: venueObj?.tag || 'qsncc',
          price: price.trim() || 'ฟรี',
          hostName: fairOrganizer.trim() || 'สมาคมผู้จัดงาน',
          hostAvatar: userProfile.avatar,
          participantsCount: 0,
          maxParticipants: 9999,
          description: description.trim() || 'งานจัดแสดงระดับประเทศ พื้นที่ขนาดใหญ่ เดินทางสะดวก',
          externalUrl: fairTicketUrl.trim() || undefined,
          isNew: true,
          createdAtTimestamp: Date.now(),
        };

        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventData: fairPayload, userRole: userProfile.role }),
        });
        const data = await res.json();

        if (data.success) {
          onCreateSuccess(fairPayload);
        } else {
          onCreateSuccess(fairPayload);
        }
      } else if (entityType === 'spot') {
        const spotPayload: EventItem = {
          id: `spot-user-${Date.now()}`,
          title: title.trim(),
          category: 'chill',
          eventType: 'public_venue',
          image: finalImage,
          badgeText: 'พิกัดแนะนำ',
          tag: spotCategory,
          date: 'เปิดบริการทุกวัน',
          time: spotOpenHours,
          location: `${locationName.trim()}, จังหวัด${province}`,
          venueTag: 'park',
          price: price.trim() || 'ฟรี',
          hostName: userProfile.name || 'ชุมชนผู้แนะนำ',
          participantsCount: 0,
          maxParticipants: 9999,
          description: description.trim() || 'สเปซพักผ่อนหย่อนใจ แสงธรรมชาติสวย บรรยากาศสงบ',
          isNew: true,
          createdAtTimestamp: Date.now(),
        };

        onCreateSuccess(spotPayload);
      } else if (entityType === 'challenge') {
        const formattedStart = formatThaiDate(questStartDate);
        const formattedEnd = formatThaiDate(questEndDate);
        const startD = new Date(questStartDate);
        const endD = new Date(questEndDate);
        const diffDays = Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)));

        const challengePayload: EventItem = {
          id: `quest-user-${Date.now()}`,
          title: title.trim() || 'Bangkok Coffee Trail: ตะลุย 3 คาเฟ่อารีย์',
          category: questMoodCategory,
          eventType: 'community',
          image: finalImage,
          badgeText: `+${questRewardPoints} XP`,
          tag: questMoodCategory === 'chill' ? 'คาเฟ่ & ชิลล์' : questMoodCategory === 'move' ? 'ออกกำลังกาย' : questMoodCategory === 'heal' ? 'ฮีลใจ' : 'เวิร์กช็อป',
          date: `${formattedStart} - ${formattedEnd}`,
          time: `เหลือ ${diffDays} วัน`,
          location: locationName.trim() || `เช็คอินในพื้นที่ ${province}`,
          venueTag: 'park',
          price: 'รับรางวัล',
          hostName: questIsOfficial ? 'Chill & Connect Official' : (userProfile.name || 'คอมมูนิตี้ชาเลนจ์'),
          participantsCount: 1,
          maxParticipants: 9999,
          description: questObjective.trim(),
          rules: questSteps,
          isNew: true,
          createdAtTimestamp: Date.now(),
        };

        onCreateSuccess(challengePayload);
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการสร้างรายการ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div
        className="bg-white rounded-[28px] sm:rounded-[32px] max-w-5xl w-full p-5 sm:p-8 space-y-6 shadow-2xl relative animate-scale-up border border-slate-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon & Close Button */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4A7C59] animate-pulse" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {step === 1 && 'เลือกประเภทเนื้อหาที่ต้องการสร้าง'}
                {step === 2 && `กรอกข้อมูล ${entityType === 'community' ? 'กิจกรรมคอมมูนิตี้' : entityType === 'fair' ? 'งานมหกรรม/เอ็กซ์โป' : entityType === 'spot' ? 'พิกัดเที่ยว 77 จังหวัด' : 'เควสต์ & ชาเลนจ์'}`}
                {step === 3 && 'ตรวจสอบความถูกต้องก่อนเผยแพร่'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {step === 1 && 'ระบบ Chill & Connect จัดแบ่ง 3 เสาหลักชัดเจน กรุณาเลือกหมวดที่ตรงกับกิจกรรมของคุณ'}
              {step === 2 && 'ระบุรายละเอียดให้ครบถ้วนเพื่อสร้างความชัดเจนและประสบการณ์ที่ดีแก่ผู้เข้าร่วม'}
              {step === 3 && 'จำลองหน้าเผยแพร่จริงเพื่อความมั่นใจก่อนเปิดรับเพื่อนเข้าร่วม'}
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

        {/* STEP 1: ENTITY TYPE SELECTOR CARDS */}
        {step === 1 && (
          <div className="space-y-4 py-2 animate-fade-in text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Option 1: Community Meetup */}
              <div
                onClick={() => {
                  setEntityType('community');
                  setStep(2);
                }}
                className="group relative p-5 rounded-2xl border-2 border-orange-200 hover:border-[#F26430] bg-orange-50/40 hover:bg-orange-50/80 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF4EE] text-[#F26430] border border-[#FCD9C6] flex items-center justify-center font-black">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-black text-base text-slate-900 group-hover:text-[#F26430] transition-colors">
                        กิจกรรมคอมมูนิตี้ & ตี้เพื่อนใหม่
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-[#F26430] bg-white px-2 py-0.5 rounded-full border border-orange-200 inline-block mt-1">
                      👥 รับสมัครเพื่อน • มีโควตาคนจำกัด
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    สร้างนัดวิ่งเช้า, ตี้บอร์ดเกม, เวิร์กช็อปวาดรูป, จิบกาแฟพูดคุย เหมาะสำหรับการเปิดห้องชวนเพื่อนทำกิจกรรมกลุ่มเล็ก-กลาง
                  </p>
                </div>
                <div className="pt-4 flex items-center justify-between text-xs font-black text-[#F26430]">
                  <span>สร้างกิจกรรมนี้ ➔</span>
                  <span className="text-[10px] text-slate-400 font-normal">เปิดรับสมัครทุกคน</span>
                </div>
              </div>

              {/* Option 2: Public Venue / Expo */}
              <div
                onClick={() => {
                  if (!isOrganizer) {
                    setErrorMessage('การสร้างงานมหกรรม/เอ็กซ์โป สงวนสิทธิ์สำหรับบทบาท ผู้จัดงาน (Organizer) หรือ แอดมิน');
                  } else {
                    setEntityType('fair');
                    setStep(2);
                  }
                }}
                className={`group relative p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                  isOrganizer
                    ? 'border-blue-200 hover:border-[#2B527A] bg-blue-50/40 hover:bg-blue-50/80 cursor-pointer shadow-xs hover:shadow-md'
                    : 'border-slate-200 bg-slate-50/50 opacity-75 cursor-not-allowed'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-[#2B527A] border border-blue-200 flex items-center justify-center font-black">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base text-slate-900 group-hover:text-[#2B527A] transition-colors">
                        งานมหกรรม นิทรรศการ & เอ็กซ์โป
                      </h3>
                      {!isOrganizer && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                          สิทธิ์ Organizer
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-[#2B527A] bg-white px-2 py-0.5 rounded-full border border-blue-200 inline-block mt-1">
                      🏛️ ศูนย์จัดแสดง • เปิดเข้าชมสาธารณะ
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    สัปดาห์หนังสือ, งานกาแฟ Thailand Coffee Fest, Motor Expo ณ ศูนย์จัดแสดงชั้นนำ เช่น QSNCC, BITEC, IMPACT
                  </p>
                </div>
                <div className="pt-4 flex items-center justify-between text-xs font-black text-[#2B527A]">
                  <span>{isOrganizer ? 'สร้างงานมหกรรม ➔' : 'ต้องใช้สิทธิ์ Organizer'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">ไม่มีการนับคนรับสมัคร</span>
                </div>
              </div>

              {/* Option 3: Lifestyle Spot 77 Provinces */}
              <div
                onClick={() => {
                  setEntityType('spot');
                  setStep(2);
                }}
                className="group relative p-5 rounded-2xl border-2 border-emerald-200 hover:border-[#4A7C59] bg-emerald-50/40 hover:bg-emerald-50/80 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-[#4A7C59] border border-emerald-200 flex items-center justify-center font-black">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 group-hover:text-[#4A7C59] transition-colors">
                      พิกัดเที่ยว & สเปซฮีลใจ 77 จังหวัด
                    </h3>
                    <span className="text-[11px] font-bold text-[#4A7C59] bg-white px-2 py-0.5 rounded-full border border-emerald-200 inline-block mt-1">
                      🌲 สถานที่ถาวร • คาเฟ่ & จุดชมวิว
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    แนะนำสถานที่พักผ่อน สโลว์บาร์ สวนสาธารณะ สเปซศิลปะ หรือจุดฮีลใจประจำจังหวัด เพื่อให้สมาชิกปักหมุดตามรอย
                  </p>
                </div>
                <div className="pt-4 flex items-center justify-between text-xs font-black text-[#4A7C59]">
                  <span>เพิ่มพิกัดใหม่ ➔</span>
                  <span className="text-[10px] text-slate-400 font-normal">ปักหมุดทั่วไทย</span>
                </div>
              </div>

              {/* Option 4: Quest & Challenge */}
              <div
                onClick={() => {
                  setEntityType('challenge');
                  setStep(2);
                }}
                className="group relative p-5 rounded-2xl border-2 border-purple-200 hover:border-purple-600 bg-purple-50/40 hover:bg-purple-50/80 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center font-black">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 group-hover:text-purple-700 transition-colors">
                      เควสต์ & ชาเลนจ์สะสม EXP
                    </h3>
                    <span className="text-[11px] font-bold text-purple-700 bg-white px-2 py-0.5 rounded-full border border-purple-200 inline-block mt-1">
                      ⚡ Gamification • พิชิตภารกิจ
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    สร้างภารกิจท้าทายให้คอมมูนิตี้ทำร่วมกัน เช่น วิ่งสะสม 10km, ตะลุย 3 คาเฟ่อารีย์ เพื่อปลดล็อก Badge และสะสมคะแนน
                  </p>
                </div>
                <div className="pt-4 flex items-center justify-between text-xs font-black text-purple-700">
                  <span>สร้างเควสต์ ➔</span>
                  <span className="text-[10px] text-slate-400 font-normal">แจกแต้ม & เหรียญ</span>
                </div>
              </div>

            </div>

            {/* Role quick toggle helper banner */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-600 font-medium">
                บทบาทปัจจุบันของคุณ: <strong className="text-slate-900">{userProfile.name} ({userProfile.role})</strong>
              </span>
              <div className="flex items-center gap-1.5">
                {(['member', 'host', 'organizer', 'venue_owner', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      handleSetRole(r);
                      setErrorMessage(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      userProfile.role === r
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {r === 'member' ? '👤 Member' :
                     r === 'host' ? '🌟 Host' :
                     r === 'organizer' ? '🏢 Organizer' :
                     r === 'venue_owner' ? '📍 Space Owner' : '🛡️ Super Admin'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: TAILORED 2-COLUMN BALANCED SUITE FORM */}
        {step === 2 && (
          <form id="create-event-form" onSubmit={(e) => { e.preventDefault(); handleProceedToStep3(); }} className="space-y-5 py-1 animate-fade-in text-left">
            
            {/* Error Message banner in Step 2 if any validation fails */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-start gap-2.5 animate-scale-up">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {entityType === 'challenge' ? (
              /* === DEDICATED CHALLENGE & QUEST CREATION STUDIO (1:1 with Quest Detail Modal) === */
              <div className="space-y-5">
                
                {/* 🌟 1. Top Identity & Quest Header Setup */}
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#EBF3ED] via-white to-slate-50 border border-[#4A7C59]/20 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-[#4A7C59]/15 pb-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#4A7C59] text-white flex items-center justify-center text-sm font-bold shadow-xs">
                        ⚡
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">ตั้งค่าข้อมูลหลักของภารกิจ (Quest Header Setup)</h4>
                        <p className="text-[11px] text-slate-500">กำหนดไอคอน, มูดกิจกรรม, สถานะ และระยะเวลา</p>
                      </div>
                    </div>
                    
                    {/* Official / Community Toggle */}
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setQuestIsOfficial(true)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          questIsOfficial ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        👑 Official Quest
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuestIsOfficial(false)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          !questIsOfficial ? 'bg-[#4A7C59] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        👥 ชุมชนสร้างสรรค์
                      </button>
                    </div>
                  </div>

                  {/* Title & Icon Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-800 block">ไอคอนภารกิจ</label>
                      <input
                        type="text"
                        value={questIcon}
                        onChange={(e) => {
                          setQuestIcon(e.target.value);
                          setQuestBadgeIcon(e.target.value);
                        }}
                        className="w-full text-center text-xl py-2 rounded-2xl bg-white border border-slate-200 font-bold focus:border-[#4A7C59] outline-none shadow-xs"
                      />
                    </div>

                    <div className="sm:col-span-7 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800">
                          ชื่อภารกิจท้าทาย (Quest Title) <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400">{title.length}/60</span>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={60}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="เช่น Bangkok Coffee Trail: ตะลุย 3 คาเฟ่อารีย์"
                        className="w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:border-[#4A7C59] outline-none shadow-xs"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-xs font-bold text-slate-800 block">หมวดหมู่มูด</label>
                      <select
                        value={questMoodCategory}
                        onChange={(e) => setQuestMoodCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 outline-none shadow-xs cursor-pointer"
                      >
                        <option value="chill">☕ ชิลล์ / คาเฟ่</option>
                        <option value="move">🏃‍♂️ ขยับกาย / สปอร์ต</option>
                        <option value="heal">🌱 ฮีลใจ / ธรรมชาติ</option>
                        <option value="learn">🎨 เรียนรู้ / เวิร์กช็อป</option>
                      </select>
                    </div>
                  </div>

                  {/* Date Range & Target Count */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200/60">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#4A7C59]" />
                        <span>วันเริ่มภารกิจ <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="date"
                        value={questStartDate}
                        onChange={(e) => setQuestStartDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#4A7C59]" />
                        <span>วันสิ้นสุดภารกิจ <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="date"
                        min={questStartDate}
                        value={questEndDate}
                        onChange={(e) => setQuestEndDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                        <span>เป้าหมายที่ต้องพิชิต:</span>
                        <span className="text-emerald-700 font-extrabold">{questTargetCount} จุด/ครั้ง</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={questTargetCount}
                          onChange={(e) => setQuestTargetCount(Number(e.target.value) || 1)}
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🎯 Section 1: วัตถุประสงค์ & ที่มาของภารกิจ */}
                <div className="p-4 sm:p-5 rounded-3xl bg-[#F4F7F4] border border-[#DDE7DF] shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#4A7C59]" />
                      <span>วัตถุประสงค์ & ที่มาของภารกิจ <span className="text-rose-500">*</span></span>
                    </h4>
                    <span className="text-[10px] text-slate-400">Section 01</span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    บอกเล่าเป้าหมาย เรื่องราว และแรงบันดาลใจที่อยากชวนให้สมาชิกออกไปทำกิจกรรมนี้
                  </p>

                  <textarea
                    rows={3}
                    required
                    value={questObjective}
                    onChange={(e) => setQuestObjective(e.target.value)}
                    placeholder="เช่น สนับสนุนร้านกาแฟ Specialty ในย่านอารีย์ และสร้างแรงบันดาลใจให้เพื่อนๆ ออกไปสัมผัสบรรยากาศคาเฟ่คราฟต์..."
                    className="w-full p-3.5 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 focus:border-[#4A7C59] outline-none shadow-2xs leading-relaxed"
                  />

                  {/* Preset Suggestions */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-slate-400 font-bold">ตัวอย่างด่วน:</span>
                    {[
                      'สนับสนุนร้านกาแฟ Specialty ในย่านอารีย์ และสัมผัสบรรยากาศคาเฟ่คราฟต์',
                      'ส่งเสริมการออกกำลังกายกลางแจ้ง สูดอากาศบริสุทธิ์ในปอดสีเขียวของกรุงเทพฯ',
                      'เปิดประสบการณ์ใหม่ เที่ยวชมงานศิลปะและนิทรรศการสร้างสรรค์ใจกลางเมือง',
                    ].map((sample, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setQuestObjective(sample)}
                        className="text-[10.5px] px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-slate-600 hover:text-[#2D5A3C] border border-slate-200 transition-colors truncate max-w-[280px]"
                      >
                        + {sample.slice(0, 32)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* 📜 Section 2: ขั้นตอนและเงื่อนไขการทำภารกิจ */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">
                        1
                      </span>
                      <span>ขั้นตอนและเงื่อนไขการทำภารกิจ <span className="text-rose-500">*</span></span>
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddQuestStep}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4A7C59] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>เพิ่มขั้นตอน</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    ระบุลำดับขั้นตอนการทำภารกิจแบบเป็นข้อๆ ให้ผู้เข้าร่วมเข้าใจง่ายและทำตามได้จริง
                  </p>

                  <div className="space-y-2">
                    {questSteps.map((stepItem, idx) => (
                      <div key={idx} className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          required
                          value={stepItem}
                          onChange={(e) => handleUpdateQuestStep(idx, e.target.value)}
                          placeholder={`ขั้นตอนที่ ${idx + 1}`}
                          className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#4A7C59] outline-none shadow-2xs"
                        />
                        {questSteps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestStep(idx)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="ลบขั้นตอนนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 🛡️ Section 3: วิธีการตรวจสอบและส่งหลักฐาน (Verification Method) */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#4A7C59]" />
                      <span>วิธีการตรวจสอบและส่งหลักฐาน (Verification Method) <span className="text-rose-500">*</span></span>
                    </h4>
                    <span className="text-[10px] text-slate-400">Section 03</span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    เลือกรูปแบบหลักฐานที่ผู้ทำภารกิจต้องส่งเพื่อยืนยันความสำเร็จ
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { icon: '📸', label: '📸 ถ่ายรูปภาพแก้วกาแฟหรือหน้าร้านคู่กับการเช็คอิน GPS' },
                      { icon: '📍', label: '📍 ระบบตรวจสอบพิกัด GPS อัตโนมัติเมื่ออยู่ในรัศมีที่กำหนด' },
                      { icon: '🎟️', label: '🎟️ สแกน QR Code จากผู้จัดงานหรือร้านค้าพาร์ทเนอร์' },
                      { icon: '✍️', label: '✍️ เขียนรีวิวและแชร์โมเมนต์ความประทับใจลงคอมมูนิตี้' },
                    ].map((method) => (
                      <button
                        key={method.label}
                        type="button"
                        onClick={() => setQuestVerificationMethod(method.label)}
                        className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all flex items-start gap-2 ${
                          questVerificationMethod === method.label
                            ? 'bg-[#EBF5EE] text-[#2D5A3C] border-emerald-300 shadow-2xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="text-base shrink-0">{method.icon}</span>
                        <span className="leading-snug">{method.label}</span>
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    required
                    value={questVerificationMethod}
                    onChange={(e) => setQuestVerificationMethod(e.target.value)}
                    placeholder="หรือพิมพ์ปรับแต่งข้อความเงื่อนไขการส่งหลักฐาน..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:border-[#4A7C59] outline-none"
                  />
                </div>

                {/* 🎁 Section 4: ของรางวัล & สิทธิประโยชน์เมื่อทำสำเร็จ (Rewards & Perks) */}
                <div className="p-4 sm:p-5 rounded-3xl bg-[#F8FAF8] border border-emerald-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[#4A7C59]" />
                      <span>ของรางวัล & สิทธิประโยชน์เมื่อทำสำเร็จ <span className="text-rose-500">*</span></span>
                    </h4>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                      Reward Unlocks
                    </span>
                  </div>

                  {/* 2-Column Reward Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Badge Card */}
                    <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                      <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wide block">
                        เหรียญตราเกียรติยศ (Profile Badge)
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl shrink-0">
                          {questBadgeIcon || questIcon}
                        </div>
                        <div className="flex-1 space-y-1">
                          <input
                            type="text"
                            required
                            value={questBadgeName}
                            onChange={(e) => setQuestBadgeName(e.target.value)}
                            placeholder="ชื่อเหรียญ เช่น Coffee Explorer"
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-[#4A7C59]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* XP Points Card */}
                    <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                      <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wide block">
                        แต้มและคะแนน XP (XP Points)
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl shrink-0 text-amber-500 font-bold">
                          ⚡
                        </div>
                        <div className="flex-1 space-y-1">
                          <select
                            value={questRewardPoints}
                            onChange={(e) => setQuestRewardPoints(Number(e.target.value) || 300)}
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-[#4A7C59]"
                          >
                            <option value={100}>+100 XP Points</option>
                            <option value={200}>+200 XP Points</option>
                            <option value={300}>+300 XP Points</option>
                            <option value={500}>+500 XP Points</option>
                            <option value={1000}>+1000 XP Points</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Text input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      ข้อความสรุปของรางวัล (Highlight Perks Line):
                    </label>
                    <input
                      type="text"
                      value={questRewardsText}
                      onChange={(e) => setQuestRewardsText(e.target.value)}
                      placeholder="เช่น ✨ 🏅 เหรียญเกียรติยศ 'Coffee Explorer' บนหน้าโปรไฟล์ + ⚡ 300 XP"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#4A7C59]"
                    />
                  </div>
                </div>

              </div>
            ) : (
              /* === STANDARD 2-COLUMN FORM FOR COMMUNITY / FAIR / SPOT === */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* === LEFT COLUMN: CONTENT & LOGISTICS (7 Cols) === */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* 1. Title & Primary Category */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        ชื่อหัวข้อ{entityType === 'spot' ? 'สถานที่' : 'กิจกรรม'} <span className="text-rose-500">*</span>
                      </label>
                      <span className={`text-[11px] font-bold ${title.length > 50 ? 'text-orange-600' : 'text-slate-400'}`}>
                        {title.length}/60
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={60}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={
                        entityType === 'community' ? 'เช่น วิ่งเช้าสวนเบญจกิติ + กาแฟดริปสโลว์บาร์' :
                        entityType === 'fair' ? 'เช่น สัปดาห์หนังสือแห่งชาติ ครั้งที่ 54 ณ QSNCC' :
                        entityType === 'spot' ? 'เช่น ไร่ชาลุงเดช บรรยากาศหมอกเช้า' : 'เช่น Cafe Hopping ตะลุย 3 คาเฟ่อารีย์'
                      }
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:border-[#4A7C59] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      หมวดหมู่ <span className="text-rose-500">*</span>
                    </label>
                    {entityType === 'community' && (
                      <select
                        value={communityCategory}
                        onChange={(e) => setCommunityCategory(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="chill">☕ จิบกาแฟ & ชิลล์</option>
                        <option value="move">🏃 ขยับกาย & กีฬา</option>
                        <option value="heal">🌱 ฮีลใจ & สมาธิ</option>
                        <option value="learn">🎨 ศิลปะ & เวิร์กช็อป</option>
                      </select>
                    )}
                    {entityType === 'fair' && (
                      <select
                        value={fairVenueId}
                        onChange={(e) => setFairVenueId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none cursor-pointer"
                      >
                        {VENUE_OPTIONS.map(v => (
                          <option key={v.id} value={v.id}>{v.label}</option>
                        ))}
                      </select>
                    )}
                    {entityType === 'spot' && (
                      <select
                        value={spotCategory}
                        onChange={(e) => setSpotCategory(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none cursor-pointer"
                      >
                        {SPOT_VIBE_CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                        ))}
                      </select>
                    )}
                    {entityType === 'challenge' && (
                      <input
                        type="text"
                        value={questBadgeName}
                        onChange={(e) => setQuestBadgeName(e.target.value)}
                        placeholder="ชื่อเหรียญรางวัล"
                        className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold outline-none"
                      />
                    )}
                  </div>
                </div>

                {/* 2. Date & Time Cards Row */}
                {entityType === 'community' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-2xl bg-orange-50/50 border border-orange-200/80">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#F26430]" />
                        <span>วันที่จัดกิจกรรม <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="date"
                        min={minCommunityDate}
                        value={communityDate}
                        onChange={(e) => setCommunityDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                      />
                      <div className="text-[10.5px] font-bold text-orange-800 bg-orange-100/60 p-1 rounded-md text-center">
                        {formatThaiDate(communityDate)}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#F26430]" />
                        <span>ช่วงเวลากิจกรรม <span className="text-rose-500">*</span></span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                        />
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                        />
                      </div>
                      <div className="text-[10.5px] font-bold text-orange-800 bg-orange-100/60 p-1 rounded-md text-center">
                        {startTime} - {endTime} น.
                      </div>
                    </div>
                  </div>
                )}

                {/* Fair Date Range Form */}
                {entityType === 'fair' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/80">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#2B527A]" />
                        <span>วันเริ่มงาน <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="date"
                        min={minFairDate}
                        value={fairStartDate}
                        onChange={(e) => setFairStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#2B527A]" />
                        <span>วันสิ้นสุดงาน <span className="text-rose-500">*</span></span>
                      </label>
                      <input
                        type="date"
                        min={fairStartDate}
                        value={fairEndDate}
                        onChange={(e) => setFairEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 3. Location & Meeting Point Card */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        จังหวัด <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
                      >
                        {ALL_THAI_PROVINCES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">
                          ชื่อสถานที่ / ย่าน <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400">{locationName.length}/80</span>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={80}
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        placeholder="เช่น สวนวชิรเบญจทัศ (สวนรถไฟ), คาเฟ่ อารีย์"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:border-[#4A7C59] outline-none"
                      />
                    </div>
                  </div>

                  {entityType === 'community' && (
                    <div className="space-y-1 pt-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        จุดนัดพบที่แน่นอน / จุดสังเกต (Meeting Point) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={meetingPoint}
                        onChange={(e) => setMeetingPoint(e.target.value)}
                        placeholder="เช่น หน้าร้านกาแฟ หรือหน้าบันไดทางเข้าหลัก"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:border-[#4A7C59] outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* 4. Description & WYSIWYG Rich Text Editor */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    รายละเอียด & บรรยากาศ <span className="text-rose-500">*</span> (พิมพ์ตัวหนาหรือรายการได้ทันที)
                  </label>
                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    placeholder="เล่าบรรยากาศ แผนกิจกรรมคร่าวๆ หรือกดปุ่ม 'ใช้โครงสร้างตัวอย่าง' ด้านบนเพื่อวางเทมเพลตมาตรฐาน..."
                    templateLabel={DESCRIPTION_TEMPLATES[entityType]?.label}
                    onApplyTemplate={applyTemplate}
                    minHeight="240px"
                  />
                </div>

                {/* 5. Itinerary Timeline for Community & Fairs */}
                {(entityType === 'community' || entityType === 'fair') && (
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>กำหนดการกิจกรรม (Itinerary Timeline)</span>
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
                            placeholder="เช่น 07:00 น."
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
                )}

              </div>

              {/* === RIGHT COLUMN: MEDIA & SETUP (5 Cols) === */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* 1. Cover Image Picker */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#4A7C59]" />
                      <span>รูปภาพหน้าปก:</span>
                    </label>
                    <span className="text-[10px] text-slate-400">แนะนำรูปแนวนอน</span>
                  </div>

                  {/* Upload Box */}
                  <label className="border-2 border-dashed border-slate-200 hover:border-[#4A7C59] bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-emerald-50/30 group">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 group-hover:text-[#4A7C59] group-hover:bg-emerald-100 flex items-center justify-center mb-1.5 transition-colors">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-[#4A7C59]">
                      {uploadedImage ? 'เปลี่ยนรูปภาพจากเครื่อง' : 'คลิกเพื่ออัปโหลดรูปภาพ'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WEBP (ไม่เกิน 5MB)</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {uploadError && (
                    <div className="p-2 rounded-xl bg-rose-50 text-rose-700 text-[11px] font-bold">
                      {uploadError}
                    </div>
                  )}

                  {/* Preset Chips */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10.5px] text-slate-400 font-medium block">หรือเลือกภาพพรีเซ็ตแนะนำ:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_IMAGES[entityType]?.slice(0, 4).map((preset) => (
                        <div
                          key={preset.id}
                          onClick={() => {
                            setImage(preset.url);
                            setUploadedImage(null);
                          }}
                          className={`relative rounded-xl overflow-hidden aspect-video cursor-pointer border-2 transition-all ${
                            image === preset.url && !uploadedImage
                              ? 'border-[#4A7C59] ring-2 ring-[#4A7C59]/20 shadow-xs'
                              : 'border-transparent opacity-75 hover:opacity-100'
                          }`}
                        >
                          <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            {preset.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. What to Bring for Community */}
                {entityType === 'community' && (
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                    <label className="text-xs font-bold text-slate-800 block">
                      สิ่งที่ต้องเตรียมมา (What to Bring):
                    </label>

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

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10.5px] text-slate-400 font-medium block">แตะเพื่อเพิ่มด่วน:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {['เสื่อปิกนิก', 'กล้องถ่ายรูป', 'พาวเวอร์แบงก์', 'หมวก / แว่นกันแดด'].filter((s) => !whatToBringList.includes(s)).map((item) => (
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

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={customBringInput}
                        onChange={(e) => setCustomBringInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddBringItem();
                          }
                        }}
                        placeholder="หรือพิมพ์ระบุเอง..."
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddBringItem}
                        className="px-3 py-1.5 bg-[#4A7C59] hover:bg-[#386144] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        เพิ่ม
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Participation & Price Settings Card */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3.5">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
                    <Shield className="w-3.5 h-3.5 text-[#4A7C59]" />
                    <span>การตั้งค่าผู้เข้าร่วม & ค่าใช้จ่าย</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    {entityType === 'community' && (
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
                          max={isHost || isAdmin ? 100 : 15}
                          value={maxParticipants}
                          onChange={(e) => setMaxParticipants(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                        />
                      </div>
                    )}

                    <div className={entityType === 'community' ? '' : 'col-span-2'}>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">ค่าใช้จ่าย:</label>
                      <input
                        type="text"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="เช่น ฟรี หรือ 150 บาท"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  {entityType === 'community' && (
                    <div className="space-y-2 pt-1 border-t border-slate-200/80">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          🚗 สไตล์การเดินทาง (Transportation):
                        </label>
                        <select
                          value={transportation}
                          onChange={(e) => setTransportation(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                        >
                          <option value="พบกัน ณ จุดนัดพบ (เดินทางอิสระ)">📍 พบกัน ณ จุดนัดพบ (เดินทางอิสระ)</option>
                          <option value="เดินทางด้วย BTS / MRT">🚇 เดินทางด้วย BTS / MRT</option>
                          <option value="มีรถยนต์ส่วนตัว (รับเพื่อนร่วมทางได้)">🚗 มีรถยนต์ส่วนตัว (รับเพื่อนร่วมทางได้ / Carpool)</option>
                          <option value="แชร์ค่ารถ / แท็กซี่ไปด้วยกัน">🚕 แชร์ค่ารถ / แท็กซี่ไปด้วยกัน</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          💬 ช่องทางติดต่อกลุ่มหลังกดเข้าร่วม (Group Contact):
                        </label>
                        <input
                          type="text"
                          value={contactChannel}
                          onChange={(e) => setContactChannel(e.target.value)}
                          placeholder="เช่น Line OpenChat / Line ID โฮสต์"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 outline-none"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          🔒 จะเปิดเผยเฉพาะสมาชิกที่กดยืนยันเข้าร่วมสำเร็จเท่านั้น
                        </span>
                      </div>
                    </div>
                  )}

                  {entityType === 'fair' && (
                    <div className="space-y-2 pt-1">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          ผู้จัดงาน: <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={fairOrganizer}
                          onChange={(e) => setFairOrganizer(e.target.value)}
                          placeholder="เช่น สมาคมผู้จัดพิมพ์ฯ"
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">ลิงก์จองบัตร/ข้อมูล:</label>
                        <input
                          type="url"
                          value={fairTicketUrl}
                          onChange={(e) => setFairTicketUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {entityType === 'spot' && (
                    <div className="space-y-2 pt-1">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          เวลาเปิด-ปิด: <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={spotOpenHours}
                          onChange={(e) => setSpotOpenHours(e.target.value)}
                          placeholder="เช่น 08:00 - 18:00 น."
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Google Maps URL:</label>
                        <input
                          type="url"
                          value={spotGoogleMapUrl}
                          onChange={(e) => setSpotGoogleMapUrl(e.target.value)}
                          placeholder="https://maps.google.com/..."
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none"
                        />
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}
        </form>
      )}

        {/* STEP 3: REALISTIC DETAIL PAGE MINI-PREVIEW & SAFETY CONFIRMATION */}
        {step === 3 && (
          <div className="space-y-5 py-1 animate-fade-in text-left">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800">
                ตัวอย่างหน้าที่จะเผยแพร่จริง (Live Page Preview):
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                จำลองมุมมองเหมือนที่ผู้ใช้งานคนอื่นจะมองเห็น
              </span>
            </div>

            {entityType === 'challenge' ? (
              /* === REALISTIC LIVE PREVIEW FOR CHALLENGE (MATCHING SCREENSHOT 1:1) === */
              <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-2xl space-y-0">
                {/* Header Gradient */}
                <div className="relative p-5 sm:p-6 bg-gradient-to-r from-[#21432E] via-[#2E583C] to-[#4A7C59] text-white overflow-hidden">
                  <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Category Pill & Official Tag */}
                  <div className="flex items-center justify-between gap-2 relative z-10">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-2xs">
                        {questMoodCategory === 'chill' ? '☕ ฮีลลิ่ง / พบปะเพื่อน & คาเฟ่' :
                         questMoodCategory === 'move' ? '🏃‍♂️ ขยับกาย / ออกกำลังกาย' :
                         questMoodCategory === 'heal' ? '🌱 ฮีลใจ / ธรรมชาติ & พักผ่อน' : '🎨 เรียนรู้ / งานคราฟต์ & เวิร์กช็อป'}
                      </span>
                      {questIsOfficial ? (
                        <span className="text-[11px] font-black px-3 py-1 rounded-full bg-amber-400 text-slate-950 shadow-xs flex items-center gap-1">
                          <Crown className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                          <span>Official Quest</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20">
                          👥 ชุมชนสร้างสรรค์
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Icon & Title */}
                  <div className="mt-4 flex items-start gap-3.5 sm:gap-4 relative z-10">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/95 text-slate-900 shadow-md flex items-center justify-center shrink-0 border border-white/80 text-3xl">
                      {questBadgeIcon || questIcon}
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <h2 className="text-lg sm:text-2xl font-black text-white leading-tight tracking-tight drop-shadow-2xs">
                        {title || 'Bangkok Coffee Trail: ตะลุย 3 คาเฟ่อารีย์'}
                      </h2>

                      {/* Metadata Strip */}
                      <div className="flex items-center gap-2 flex-wrap pt-0.5 text-xs text-white/90 font-medium">
                        <span className="flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/20 font-bold text-emerald-200">
                          <Zap className="w-3.5 h-3.5 fill-emerald-200 text-emerald-200" />
                          <span>+{questRewardPoints} XP</span>
                        </span>

                        <span className="flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/20">
                          <Calendar className="w-3.5 h-3.5 text-emerald-200" />
                          <span>{formatThaiDate(questStartDate)} - {formatThaiDate(questEndDate)}</span>
                        </span>

                        <span className="flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/20">
                          <Clock className="w-3.5 h-3.5 text-emerald-200" />
                          <span>เหลือ {Math.max(1, Math.ceil((new Date(questEndDate).getTime() - new Date(questStartDate).getTime()) / (1000 * 60 * 60 * 24)))} วัน</span>
                        </span>

                        <span className="flex items-center gap-1 bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/20">
                          <Users className="w-3.5 h-3.5 text-emerald-200" />
                          <span>1+ คนร่วมทำ</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Sections */}
                <div className="p-4 sm:p-6 space-y-3.5 bg-white text-slate-800">
                  
                  {/* 🎯 Section 1: Objective & Purpose */}
                  <div className="p-4 rounded-2xl bg-[#F4F7F4] border border-[#DDE7DF] space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#4A7C59] shrink-0" />
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                        วัตถุประสงค์ & ที่มาของภารกิจ
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-6 font-medium">
                      {questObjective}
                    </p>
                  </div>

                  {/* 📜 Section 2: Step-by-Step Instructions & Conditions */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">
                        1
                      </span>
                      <span>ขั้นตอนและเงื่อนไขการทำภารกิจ</span>
                    </h4>

                    <div className="space-y-2 pl-2 sm:pl-3">
                      {questSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                          <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed font-medium">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 🔍 Section 3: Verification Method */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#4A7C59] shrink-0" />
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                        วิธีการตรวจสอบและส่งหลักฐาน (Verification Method)
                      </h4>
                    </div>
                    <div className="pl-6 text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed bg-[#EBF5EE] p-3 rounded-xl border border-emerald-200">
                      {questVerificationMethod}
                    </div>
                  </div>

                  {/* 🎁 Section 4: Rewards & Perks */}
                  <div className="p-4 rounded-2xl bg-[#F8FAF8] border border-emerald-200/80 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Gift className="w-4 h-4 text-[#4A7C59]" />
                        <span>ของรางวัล & สิทธิประโยชน์เมื่อทำสำเร็จ</span>
                      </h4>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                        Reward Unlocks
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-0 sm:pl-6">
                      <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-xl shrink-0">
                          {questBadgeIcon || questIcon}
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">เหรียญตราเกียรติยศ</p>
                          <p className="text-xs sm:text-sm font-extrabold text-slate-900">{questBadgeName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl shrink-0 text-amber-500 font-bold">
                          ⚡
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">แต้มและคะแนน XP</p>
                          <p className="text-xs sm:text-sm font-extrabold text-slate-900">+{questRewardPoints} XP Points</p>
                        </div>
                      </div>
                    </div>

                    {questRewardsText && (
                      <div className="pl-0 sm:pl-6 pt-1">
                        <p className="text-xs text-slate-700 font-bold">
                          {questRewardsText}
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ) : (
              /* Realistic Mini-Detail Container for Community/Fair/Spot */
              <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm space-y-4">
              
              {/* Cover Banner */}
              <div className="relative aspect-[21/9] sm:aspect-[24/9] w-full overflow-hidden bg-slate-900">
                <img
                  src={uploadedImage || image}
                  alt="Cover Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-slate-900 shadow-xs uppercase tracking-wider">
                    {entityType === 'community' && 'กิจกรรมคอมมูนิตี้'}
                    {entityType === 'fair' && 'งานมหกรรม & เอ็กซ์โป'}
                    {entityType === 'spot' && 'พิกัดเที่ยว & สเปซฮีลใจ'}
                    {entityType === 'challenge' && 'เควสต์ & ชาเลนจ์'}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white">
                    {price || 'ฟรี'}
                  </span>
                </div>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h4 className="font-black text-base sm:text-xl tracking-tight leading-tight line-clamp-1 drop-shadow-sm">
                    {title || 'หัวข้อของคุณ'}
                  </h4>
                  <p className="text-xs text-slate-200 font-medium flex items-center gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{locationName || province}, จังหวัด{province}</span>
                  </p>
                </div>
              </div>

              {/* Mini Info Ribbon */}
              <div className="px-5">
                <div className="py-2.5 px-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#4A7C59]" />
                    <span className="text-slate-500 font-medium">วัน/เวลา:</span>
                    <strong className="text-slate-900">
                      {entityType === 'community' && `${communityDate} • ${startTime} - ${endTime} น.`}
                      {entityType === 'fair' && `${fairStartDate} ถึง ${fairEndDate}`}
                      {entityType === 'spot' && `${spotOpenHours}`}
                      {entityType === 'challenge' && `สะสม ${questRewardPoints} EXP`}
                    </strong>
                  </div>
                  {entityType === 'community' && (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#F26430]" />
                      <span className="text-slate-500 font-medium">เปิดรับ:</span>
                      <strong className="text-slate-900">1 / {maxParticipants} คน</strong>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">ผู้จัด:</span>
                    <strong className="text-slate-900">{userProfile.name || 'คุณ'}</strong>
                  </div>
                </div>
              </div>

              {/* Realistic Formatted Content */}
              <div className="px-5 pb-5 space-y-3">
                <div className="space-y-1.5">
                  <h5 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2">
                    รายละเอียดกิจกรรม & เนื้อหาที่กรอกไว้
                  </h5>
                  <div className="text-xs leading-relaxed max-h-48 overflow-y-auto pr-1">
                    {renderDescriptionContent(description) || (
                      <span className="text-slate-400 italic">ไม่มีรายละเอียดเนื้อหา</span>
                    )}
                  </div>
                </div>

                {/* Itinerary Timeline Preview */}
                {(entityType === 'community' || entityType === 'fair') && itinerary.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#4A7C59]" />
                      <span>กำหนดการกิจกรรม (Itinerary Timeline)</span>
                    </h5>
                    <div className="space-y-1.5">
                      {itinerary.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#2D5A3C] text-[10px] font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 shrink-0">{item.time}</span>
                          <span className="text-slate-600 truncate">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* What to bring preview */}
                {entityType === 'community' && whatToBringList.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 space-y-2">
                    <h5 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>สิ่งที่ต้องเตรียมมา</span>
                    </h5>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {whatToBringList.map((item) => (
                        <span key={item} className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-white text-emerald-800 border border-emerald-200">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

            {/* Safety Disclaimer Checkbox */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-black text-xs sm:text-sm text-amber-950">ข้อกำหนดความปลอดภัยและแนวทางคอมมูนิตี้</h4>
                  <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                    ผู้จัดกิจกรรมและผู้สร้างพิกัดตกลงที่จะปฏิบัติตามมาตรฐานความปลอดภัย เคารพสถานที่ ไม่จัดกิจกรรมที่ผิดกฎหมายหรือสร้างความเดือดร้อนรำคาญ
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-extrabold text-amber-950 pt-1">
                <input
                  type="checkbox"
                  checked={isSafetyAccepted}
                  onChange={(e) => setIsSafetyAccepted(e.target.checked)}
                  className="w-4 h-4 rounded text-[#4A7C59] focus:ring-[#4A7C59] cursor-pointer"
                />
                <span>ข้าพเจ้ายืนยันความถูกต้องของข้อมูลและยอมรับข้อกำหนดความปลอดภัยของแพลตฟอร์ม</span>
              </label>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => {
                  setStep((prev) => (prev - 1) as any);
                  setErrorMessage(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                ← ย้อนกลับ
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
            >
              ยกเลิก
            </button>

            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-full bg-[#4A7C59] hover:bg-[#386144] text-white text-xs font-black transition-all shadow-md shadow-[#4A7C59]/20 cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <span>ถัดไป: กรอกข้อมูล</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleProceedToStep3}
                className="px-6 py-2.5 rounded-full bg-[#4A7C59] hover:bg-[#386144] text-white text-xs font-black transition-all shadow-md shadow-[#4A7C59]/20 cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <span>ตรวจสอบพรีวิว</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleFormSubmit}
                disabled={isSubmitting || (!isSafetyAccepted && !isAdmin)}
                className={`px-8 py-2.5 rounded-full font-black text-xs transition-all flex items-center gap-2 shadow-md ${
                  isSafetyAccepted || isAdmin
                    ? 'bg-[#4A7C59] hover:bg-[#386144] text-white shadow-[#4A7C59]/25 cursor-pointer active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>กำลังเผยแพร่...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ยืนยัน & เผยแพร่ทันที</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
