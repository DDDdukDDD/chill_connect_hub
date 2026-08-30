'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Users,
  Sparkles,
  Tag,
  Shield,
  Clock,
  Image as ImageIcon,
  Building2,
  Compass,
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldAlert,
  AlertCircle,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Bold,
  Italic,
  List,
  Upload,
  FileText
} from 'lucide-react';
import { EventItem } from '@/data/mockData';
import { LifestyleSpotItem } from '@/data/spotsData';
import { useAuth, UserRole } from '@/lib/useAuth';
import { SafetyGuidelinesModal } from './SafetyGuidelinesModal';
import { RichTextEditor, stripHtmlToPlainText, renderDescriptionContent } from './RichTextEditor';

export type CreationEntityType = 'community' | 'fair' | 'spot' | 'challenge';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuccess: (newEvent: EventItem) => void;
  onCreateSpotSuccess?: (newSpot: LifestyleSpotItem) => void;
  initialType?: CreationEntityType;
  initialLocation?: string;
  initialTitle?: string;
  initialCategory?: 'move' | 'heal' | 'chill' | 'learn';
  initialImage?: string;
}

const PRESET_IMAGES: Record<CreationEntityType, { id: string; label: string; url: string }[]> = {
  community: [
    { id: 'comm-p1', label: '☕ จิบกาแฟ & บอร์ดเกมชิลล์', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80' },
    { id: 'comm-p2', label: '🏃 วิ่งเช้า & ออกกำลังกายในสวน', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=80' },
    { id: 'comm-p3', label: '🌿 ปิกนิกฮีลใจ & ธรรมชาติ', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80' },
    { id: 'comm-p4', label: '🎨 เวิร์กช็อปเซรามิก & ศิลปะ', url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80' },
  ],
  fair: [
    { id: 'fair-p1', label: '🏛️ ศูนย์การประชุม QSNCC / BITEC', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80' },
    { id: 'fair-p2', label: '🎨 นิทรรศการ Art & Design Expo', url: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=80' },
    { id: 'fair-p3', label: '📚 เทศกาลหนังสือ & วัฒนธรรม', url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80' },
    { id: 'fair-p4', label: '🏅 ซิตี้มาราธอน & มหกรรมกีฬา', url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1200&q=80' },
  ],
  spot: [
    { id: 'spot-p1', label: '☕ สโลว์บาร์ & กาแฟดริป Specialty', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80' },
    { id: 'spot-p2', label: '🌲 สวนร่มรื่น & จุดชมวิวฮีลใจ', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80' },
    { id: 'spot-p3', label: '🖼️ อาร์ตแกลเลอรี & สเปซลับ', url: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80' },
    { id: 'spot-p4', label: '🏘️ เมืองเก่า & ย่านคลาสสิก', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80' },
  ],
  challenge: [
    { id: 'chal-p1', label: '⚡ เควสต์ไลฟ์สไตล์ & ท้าทาย', url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80' },
    { id: 'chal-p2', label: '🗺️ เควสต์สำรวจเมือง & เก็บแต้ม', url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80' },
  ]
};

const ALL_THAI_PROVINCES = [
  'กรุงเทพมหานคร', 'เชียงใหม่', 'ชลบุรี', 'ภูเก็ต', 'นครราชสีมา', 'น่าน', 'ประจวบคีรีขันธ์', 'ขอนแก่น',
  'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'จันทบุรี', 'ฉะเชิงเทรา', 'ชัยนาท', 'ชัยภูมิ', 'ชุมพร',
  'เชียงราย', 'ตรัง', 'ตราด', 'ตาก', 'นครนายก', 'นครปฐม', 'นครพนม', 'นครศรีธรรมราช', 'นครสวรรค์',
  'นนทบุรี', 'นราธิวาส', 'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา',
  'พะเยา', 'พังงา', 'พัทลุง', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์', 'แพร่', 'มหาสารคาม',
  'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร', 'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง', 'ราชบุรี', 'ลพบุรี',
  'ลำปาง', 'ลำพูน', 'เลย', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ', 'สมุทรสงคราม',
  'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี', 'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี', 'สุรินทร์',
  'หนองคาย', 'หนองบัวลำภู', 'อ่างทอง', 'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชธานี'
];

const VENUE_OPTIONS = [
  { id: 'qsncc', label: 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)' },
  { id: 'bitec', label: 'ศูนย์นิทรรศการและการประชุมไบเทค บางนา (BITEC)' },
  { id: 'impact', label: 'อิมแพ็ค เมืองทองธานี (IMPACT)' },
  { id: 'siam_paragon', label: 'รอยัล พารากอน ฮอลล์ (Siam Paragon)' },
  { id: 'iconsiam', label: 'ทรู ไอคอน ฮอลล์ (ICONSIAM)' },
  { id: 'marathon', label: 'สนามวิ่ง / เส้นทางมาราธอนเมือง' },
  { id: 'park', label: 'สวนสาธารณะ / พื้นที่กิจกรรมกลางแจ้ง' },
  { id: 'other', label: 'สถานที่จัดงานอื่นๆ' },
];

const SPOT_VIBE_CATEGORIES = [
  { id: 'slowbar', label: 'สโลว์บาร์ & กาแฟพิเศษ', icon: '☕' },
  { id: 'nature', label: 'ธรรมชาติ & อุทยาน', icon: '🌲' },
  { id: 'oldtown', label: 'เมืองเก่า & วัฒนธรรม', icon: '🏛️' },
  { id: 'art', label: 'อาร์ตสเปซ & แกลเลอรี', icon: '🎨' },
  { id: 'viewpoint', label: 'จุดชมวิว & ผ่อนคลาย', icon: '🌅' },
  { id: 'workspace', label: 'Co-Working & คาเฟ่ทำงาน', icon: '💻' },
  { id: 'community', label: 'คอมมูนิตี้สเปซ & ตลาดสร้างสรรค์', icon: '👥' },
];

const getLeadTimeDate = (daysAhead: number = 3): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

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

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onCreateSuccess,
  onCreateSpotSuccess,
  initialType = 'community',
  initialLocation = '',
  initialTitle = '',
  initialCategory = 'chill',
  initialImage,
}) => {
  const { userProfile, isAdmin, isHost, isOrganizer, isVenueOwner, handleSetRole } = useAuth();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [entityType, setEntityType] = useState<CreationEntityType>(initialType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
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

  // Challenge fields
  const [questGoal, setQuestGoal] = useState('');
  const [questRewardPoints, setQuestRewardPoints] = useState(250);
  const [questBadgeName, setQuestBadgeName] = useState('Explorer Badge');

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
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setUploadError('รองรับเฉพาะไฟล์รูปภาพ .jpg, .png, .webp เท่านั้น');
        return;
      }

      // Validate file size (5MB max)
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
      label: 'ใช้โครงสร้างกิจกรรมคอมมูนิตี้',
      text: `<p><strong>ภาพรวมกิจกรรม:</strong></p>
<p>นัดรวมตัวทำกิจกรรมร่วมกันในบรรยากาศเป็นกันเอง เหมาะสำหรับคนที่อยากมาพักผ่อน พบปะเพื่อนใหม่สายเดียวกัน ใครมาคนเดียวไม่ต้องเกร็ง มีโฮสต์คอยต้อนรับครับ</p>
<p><strong>แผนกิจกรรมคร่าวๆ:</strong></p>
<ul>
  <li>07:00 น. - รวมตัวกัน ณ จุดนัดพบ ทำความรู้จักกันสั้นๆ</li>
  <li>07:15 น. - เริ่มกิจกรรมหลักร่วมกัน</li>
  <li>08:45 น. - แวะพักผ่อน / จิบกาแฟพูดคุยแลกเปลี่ยนมุมมอง</li>
</ul>
<p><strong>สิ่งที่ควรเตรียมมา:</strong></p>
<ul>
  <li>อุปกรณ์หรือของใช้ส่วนตัวที่จำเป็น</li>
  <li>รอยยิ้ม และการเปิดใจรับฟังเพื่อนร่วมกิจกรรม</li>
</ul>
<p><strong>ข้อแนะนำ & กฎความปลอดภัย:</strong></p>
<ul>
  <li>กิจกรรมจัดในพื้นที่สาธารณะ ปลอดภัย 100%</li>
  <li>กรุณาตรงต่อเวลา และรักษามารยาทต่อเพื่อนทุกคนครับ</li>
</ul>`
    },
    fair: {
      label: 'ใช้โครงสร้างงานมหกรรม / นิทรรศการ',
      text: `<p><strong>ภาพรวมงานจัดแสดง:</strong></p>
<p>งานมหกรรมและนิทรรศการระดับประเทศที่รวบรวมบูธชั้นนำ กิจกรรมเสวนา และการแสดงผลงานสร้างสรรค์ไว้ในที่เดียว</p>
<p><strong>ไฮไลต์สำคัญภายในงาน:</strong></p>
<ul>
  <li>โซนจัดแสดงผลงานและนิทรรศการพิเศษ</li>
  <li>เวทีเสวนาและเวิร์กช็อปจากผู้เชี่ยวชาญ</li>
  <li>โซนจำหน่ายสินค้าและโปรโมชันพิเศษเฉพาะในงาน</li>
</ul>
<p><strong>การเดินทาง & สิ่งอำนวยความสะดวก:</strong></p>
<ul>
  <li>เดินทางสะดวกด้วยรถไฟฟ้า BTS / MRT และมีจุดจอดรถรองรับ</li>
  <li>มีจุดประชาสัมพันธ์ จุดปฐมพยาบาล และสิ่งอำนวยความสะดวกครบครัน</li>
</ul>`
    },
    spot: {
      label: 'ใช้โครงสร้างพิกัดเที่ยว & สเปซฮีลใจ',
      text: `<p><strong>บรรยากาศ & จุดเด่นของสถานที่:</strong></p>
<p>สเปซพักผ่อนบรรยากาศสงบ เหมาะสำหรับคนที่ต้องการหลีกหนีความวุ่นวาย มานั่งอ่านหนังสือ จิบเครื่องดื่ม หรือเสพงานศิลป์ท่ามกลางบรรยากาศผ่อนคลาย</p>
<p><strong>มุมถ่ายรูป & เมนูแนะนำ:</strong></p>
<ul>
  <li>มุมแสงธรรมชาติช่วงบ่าย สวยและถ่ายรูปขึ้นมาก</li>
  <li>เมนูเครื่องดื่ม / กาแฟ Specialty ซิกเนเจอร์ที่ควรลอง</li>
</ul>
<p><strong>คำแนะนำในการมาเยือน:</strong></p>
<ul>
  <li>เวลาที่แนะนำ: ช่วงเช้า หรือช่วงเย็นแดดร่มลมตก</li>
  <li>มีที่จอดรถสะดวก และรองรับการเดินทางสาธารณะ</li>
</ul>`
    },
    challenge: {
      label: 'ใช้โครงสร้างเควสต์ & ชาเลนจ์',
      text: `<p><strong>เป้าหมายภารกิจ:</strong></p>
<p>พิชิตเควสต์ไลฟ์สไตล์ เช็คอินสถานที่เป้าหมายเพื่อสะสมคะแนน EXP และรับเหรียญรางวัลพิเศษประจำภารกิจ</p>
<p><strong>กติกาการร่วมสนุก:</strong></p>
<ol>
  <li>เดินทางไปเช็คอิน ณ พิกัดที่กำหนด</li>
  <li>ถ่ายภาพความประทับใจ หรือบันทึกโมเมนต์ลงในแพลตฟอร์ม</li>
  <li>รับเหรียญรางวัลและคะแนนสะสมทันทีเมื่อทำภารกิจสำเร็จ</li>
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

  const validateStep2 = (): boolean => {
    setErrorMessage(null);

    // 1. Title validation
    if (!title.trim()) {
      setErrorMessage('กรุณาระบุชื่อหัวข้อกิจกรรมหรือสถานที่');
      return false;
    }
    if (title.trim().length < 5) {
      setErrorMessage('ชื่อหัวข้อต้องมีความยาวอย่างน้อย 5 ตัวอักษร');
      return false;
    }

    // 2. Entity-specific required fields
    if (entityType === 'community') {
      if (!communityDate) {
        setErrorMessage('กรุณาเลือกวันที่จัดกิจกรรม');
        return false;
      }
      if (!startTime || !endTime) {
        setErrorMessage('กรุณาระบุเวลาเริ่มและเวลาสิ้นสุดกิจกรรม');
        return false;
      }
      if (!locationName.trim()) {
        setErrorMessage('กรุณาระบุชื่อสถานที่ / ย่าน / จุดสังเกต');
        return false;
      }
      if (!maxParticipants || maxParticipants < 2) {
        setErrorMessage('จำนวนคนที่เปิดรับต้องมีอย่างน้อย 2 คน');
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
      if (!locationName.trim()) {
        setErrorMessage('กรุณาระบุชื่อสถานที่จัดงานหรือศูนย์การประชุม');
        return false;
      }
    } else if (entityType === 'spot') {
      if (!locationName.trim()) {
        setErrorMessage('กรุณาระบุชื่อสถานที่ / ย่าน / จุดสังเกต');
        return false;
      }
      if (!province) {
        setErrorMessage('กรุณาระบุจังหวัดของสถานที่');
        return false;
      }
    } else if (entityType === 'challenge') {
      if (!questBadgeName.trim()) {
        setErrorMessage('กรุณาระบุชื่อเหรียญรางวัลประจำภารกิจ');
        return false;
      }
      if (!locationName.trim()) {
        setErrorMessage('กรุณาระบุพิกัดเป้าหมายของภารกิจ');
        return false;
      }
    }

    // 3. Description validation
    const plainDesc = stripHtmlToPlainText(description);
    if (!plainDesc || plainDesc.length < 15) {
      setErrorMessage('กรุณากรอกรายละเอียด & บรรยากาศอย่างน้อย 15 ตัวอักษร เพื่อให้ข้อมูลครบถ้วน');
      return false;
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
          onClose();
        } else {
          setErrorMessage(data.message || 'ไม่สามารถสร้างกิจกรรมได้');
        }
      } else if (entityType === 'fair') {
        const startFormatted = formatThaiDate(fairStartDate);
        const endFormatted = formatThaiDate(fairEndDate);
        const venueObj = VENUE_OPTIONS.find(v => v.id === fairVenueId);
        const validVenueTag = (fairVenueId === 'qsncc' || fairVenueId === 'bitec' || fairVenueId === 'impact' || fairVenueId === 'marathon' || fairVenueId === 'park')
          ? fairVenueId
          : undefined;

        const fairPayload: EventItem = {
          id: `fair-user-${Date.now()}`,
          title: title.trim(),
          category: 'chill',
          eventType: 'public_venue',
          image: finalImage,
          badgeText: 'งานแฟร์ & นิทรรศการ',
          tag: 'งานมหกรรมระดับประเทศ',
          date: `${startFormatted} - ${endFormatted}`,
          time: '10:00 - 20:00 น.',
          location: `${venueObj?.label || locationName || 'ศูนย์การประชุมแห่งชาติสิริกิติ์'}, ${province}`,
          venueTag: validVenueTag,
          price: price.trim() || 'เข้าชมฟรี',
          hostName: fairOrganizer.trim() || userProfile.name || 'ผู้จัดงานทางการ',
          hostAvatar: userProfile.avatar,
          participantsCount: 0,
          maxParticipants: 0,
          targetGender: 'all',
          targetAge: 'ทุกเพศทุกวัย',
          energyLevel: 'chill',
          description: description.trim() || 'งานจัดแสดงและมหกรรมไลฟ์สไตล์ระดับประเทศ เปิดให้เข้าชมอย่างเป็นทางการ',
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
          onClose();
        } else {
          setErrorMessage(data.message || 'ไม่สามารถสร้างงานแฟร์ได้');
        }
      } else if (entityType === 'spot') {
        const catObj = SPOT_VIBE_CATEGORIES.find(c => c.id === spotCategory);
        const spotPayload: LifestyleSpotItem = {
          id: `spot-user-${Date.now()}`,
          title: title.trim(),
          category: 'cafe',
          categoryLabel: catObj?.label || 'คาเฟ่ & สโลว์บาร์',
          province: province,
          district: district.trim() || 'ใจกลางเมือง',
          image: finalImage,
          galleryImages: [finalImage],
          openHours: spotOpenHours,
          price: price.trim() || 'เข้าฟรี',
          bestTime: spotBestTime,
          vibeTags: ['แนะนำโดยชุมชน', 'บรรยากาศดี', 'ฮีลใจ'],
          description: description.trim() || 'พิกัดและสเปซฮีลใจแนะนำใหม่ประจำจังหวัด เหมาะสำหรับการมาพักผ่อนและพบปะเพื่อนๆ',
          highlights: spotHighlights,
          facilities: ['ที่จอดรถสะดวก', 'Wi-Fi ฟรี', 'เครื่องปรับอากาศ'],
          googleMapsUrl: spotGoogleMapUrl.trim() || `https://maps.google.com/?q=${encodeURIComponent(title + ' ' + province)}`,
          rating: 4.9,
          reviewsCount: 1,
          latitude: 13.7563,
          longitude: 100.5018,
          isNew: true,
        };

        if (onCreateSpotSuccess) {
          onCreateSpotSuccess(spotPayload);
        }
        onClose();
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div
        className="bg-white rounded-[28px] sm:rounded-[32px] max-w-4xl w-full p-5 sm:p-8 md:p-9 space-y-6 shadow-2xl relative animate-scale-up border border-slate-200/90 max-h-[92vh] overflow-y-auto flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Step Progress Bar */}
        <div className="space-y-4 border-b border-slate-100 pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-black text-lg sm:text-2xl text-slate-900 tracking-tight">
                  สร้างและปักหมุดไลฟ์สไตล์
                </h2>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#2D5A3C] border border-emerald-200">
                  {userProfile.badgeLabel || 'สมาชิก'}
                </span>
                {isAdmin && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    ⚡ Admin Bypass
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {step === 1 && 'ขั้นตอนที่ 1: เลือกสิ่งที่คุณต้องการสร้างหรือแนะนำสู่คอมมูนิตี้'}
                {step === 2 && 'ขั้นตอนที่ 2: กรอกข้อมูลและกำหนดวันเวลาตามมาตรฐานความปลอดภัย'}
                {step === 3 && 'ขั้นตอนที่ 3: ตรวจสอบความถูกต้องและข้อกำหนดความปลอดภัยก่อนเผยแพร่'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-2 pt-1">
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-[#4A7C59]' : 'bg-slate-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-[#4A7C59]' : 'bg-slate-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 3 ? 'bg-[#4A7C59]' : 'bg-slate-200'}`} />
          </div>
        </div>

        {/* STEP 1: ENTITY TYPE SELECTOR WITH RBAC LOCKS */}
        {step === 1 && (
          <div className="space-y-4 py-2 animate-fade-in text-left">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-700">เลือกประเภทสิ่งที่คุณต้องการสร้าง:</h3>
              <span className="text-xs text-slate-400 font-medium">สิทธิ์ของคุณ: <strong className="text-slate-800">{userProfile.badgeLabel || 'สมาชิก'}</strong></span>
            </div>

            {/* Permission Warning Banner when clicking locked item */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-start gap-2.5 animate-scale-up">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p>{errorMessage}</p>
                  <p className="text-[11px] text-amber-700 font-normal">
                    คุณสามารถทดลองเปลี่ยนสิทธิ์ในกล่องจำลองสิทธิ์ (Role Tester) ด้านล่างเพื่อทดสอบการสร้างได้
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option 1: Community Meetup (Open to All) */}
              <div
                onClick={() => {
                  setEntityType('community');
                  setErrorMessage(null);
                }}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  entityType === 'community'
                    ? 'border-[#F26430] bg-orange-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F26430] flex items-center justify-center font-black">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isAdmin ? (
                      <span className="text-[11px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>Admin สร้างได้ทันที</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-black text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded-full">
                        ล่วงหน้าอย่างน้อย 3 วัน
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900">1. กิจกรรมคอมมูนิตี้ (Community Meetup)</h4>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    สร้างกิจกรรมเปิดตี้ วิ่งออกกำลังกาย บอร์ดเกม คาเฟ่ฮอปปิ้ง เวิร์กช็อปศิลปะ และกิจกรรมสายชิลล์
                  </p>
                </div>
              </div>

              {/* Option 2: Major Fair / Public Venue (Organizer & Admin Only) */}
              <div
                onClick={() => {
                  if (!isOrganizer && !isAdmin) {
                    setErrorMessage('🔒 เฉพาะผู้จัดงานทางการหรือองค์กร (Organizer) เท่านั้นที่สามารถสร้างงานแฟร์และเอ็กซ์โปได้');
                    return;
                  }
                  setEntityType('fair');
                  setErrorMessage(null);
                }}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 relative ${
                  !isOrganizer && !isAdmin
                    ? 'border-slate-200 bg-slate-50/80 opacity-75 cursor-not-allowed hover:border-slate-300'
                    : entityType === 'fair'
                    ? 'border-[#2B527A] bg-blue-50/40 shadow-sm cursor-pointer'
                    : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                    !isOrganizer && !isAdmin ? 'bg-slate-200 text-slate-500' : 'bg-blue-100 text-[#2B527A]'
                  }`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!isOrganizer && !isAdmin ? (
                      <span className="text-[11px] font-black text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>เฉพาะ Organizer</span>
                      </span>
                    ) : isAdmin ? (
                      <span className="text-[11px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>Admin สร้างได้ทันที</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-black text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                        ล่วงหน้าอย่างน้อย 7 วัน
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900 flex items-center gap-1.5">
                    <span>2. งานมหกรรม นิทรรศการ & เอ็กซ์โป</span>
                    {!isOrganizer && !isAdmin && <Lock className="w-3.5 h-3.5 text-slate-400 inline" />}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    แจ้งงานจัดแสดง ณ ศูนย์การประชุม (QSNCC, BITEC, IMPACT) งานวิ่งเมือง หรือเทศกาลใหญ่
                  </p>
                </div>
              </div>

              {/* Option 3: Lifestyle Spot (Venue Owner & Admin Only) */}
              <div
                onClick={() => {
                  if (!isVenueOwner && !isAdmin) {
                    setErrorMessage('🔒 เฉพาะเจ้าของสถานที่หรือร้านค้าที่ยืนยันตัวตน (Venue Owner) เท่านั้นที่สามารถปักหมุดสเปซใหม่ได้');
                    return;
                  }
                  setEntityType('spot');
                  setErrorMessage(null);
                }}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 relative ${
                  !isVenueOwner && !isAdmin
                    ? 'border-slate-200 bg-slate-50/80 opacity-75 cursor-not-allowed hover:border-slate-300'
                    : entityType === 'spot'
                    ? 'border-[#4A7C59] bg-emerald-50/40 shadow-sm cursor-pointer'
                    : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                    !isVenueOwner && !isAdmin ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-[#4A7C59]'
                  }`}>
                    <Compass className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!isVenueOwner && !isAdmin ? (
                      <span className="text-[11px] font-black text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>เฉพาะ Space Owner</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        77 จังหวัดทั่วไทย
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900 flex items-center gap-1.5">
                    <span>3. ปักหมุดพิกัดเที่ยว & สเปซฮีลใจ</span>
                    {!isVenueOwner && !isAdmin && <Lock className="w-3.5 h-3.5 text-slate-400 inline" />}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    แนะนำคาเฟ่สโลว์บาร์ สวนสาธารณะ จุดชมวิว หรือแกลเลอรีโปรดให้เพื่อนๆ ได้ตามรอย
                  </p>
                </div>
              </div>

              {/* Option 4: Community Quest (Host & Admin Only) */}
              <div
                onClick={() => {
                  if (!isHost && !isAdmin) {
                    setErrorMessage('🔒 เฉพาะโฮสต์ที่ได้รับการรับรอง (Verified Host) เท่านั้นที่สามารถสร้างเควสต์ชุมชนได้');
                    return;
                  }
                  setEntityType('challenge');
                  setErrorMessage(null);
                }}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-3 relative ${
                  !isHost && !isAdmin
                    ? 'border-slate-200 bg-slate-50/80 opacity-75 cursor-not-allowed hover:border-slate-300'
                    : entityType === 'challenge'
                    ? 'border-purple-500 bg-purple-50/40 shadow-sm cursor-pointer'
                    : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                    !isHost && !isAdmin ? 'bg-slate-200 text-slate-500' : 'bg-purple-100 text-purple-700'
                  }`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!isHost && !isAdmin ? (
                      <span className="text-[11px] font-black text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>เฉพาะ Verified Host</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-black text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
                        Gamified Quests
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900 flex items-center gap-1.5">
                    <span>4. ชาเลนจ์ & ภารกิจท้าทาย</span>
                    {!isHost && !isAdmin && <Lock className="w-3.5 h-3.5 text-slate-400 inline" />}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    สร้างเควสต์เช็คอิน สะสมแต้ม EXP และแจกเหรียญรางวัลพิเศษแก่ผู้ร่วมภารกิจ
                  </p>
                </div>
              </div>
            </div>

            {/* Role Switcher Sandbox for Testing */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Shield className="w-4 h-4 text-slate-400" />
                <span>จำลองสิทธิ์ผู้ใช้งาน (Role Sandbox):</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {(['member', 'host', 'organizer', 'venue_owner', 'admin'] as UserRole[]).map((r) => (
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

        {/* STEP 2: TAILORED FORM */}
        {step === 2 && (
          <form id="create-event-form" onSubmit={(e) => { e.preventDefault(); handleProceedToStep3(); }} className="space-y-5 py-1 animate-fade-in text-left">
            
            {/* Error Message banner in Step 2 if any validation fails */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-start gap-2.5 animate-scale-up">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
            
            {/* Title & Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    ชื่อหัวข้อ{entityType === 'spot' ? 'สถานที่' : 'กิจกรรม'} <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[11px] font-bold ${title.length > 50 ? 'text-orange-600' : 'text-slate-400'}`}>
                    {title.length}/60 ตัวอักษร
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10 text-sm font-medium outline-none"
                />
                <p className="text-[10.5px] text-slate-400 font-medium">
                  💡 กำหนดความยาวไม่เกิน 60 ตัวอักษร เพื่อให้แสดงผลครบ 1-2 บรรทัดบนการ์ดอย่างสวยงาม
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  หมวดหมู่หลัก <span className="text-rose-500">*</span>
                </label>
                {entityType === 'community' && (
                  <select
                    value={communityCategory}
                    onChange={(e) => setCommunityCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-white focus:outline-none cursor-pointer"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-white focus:outline-none cursor-pointer"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-white focus:outline-none cursor-pointer"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none"
                  />
                )}
              </div>
            </div>

            {/* Date, Time & Lead-time Safety Warning for Community */}
            {entityType === 'community' && (
              <div className="space-y-3 p-4 rounded-2xl bg-orange-50/50 border border-orange-200/80">
                <div className="flex items-center justify-between text-xs font-bold text-orange-950">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#F26430]" />
                    <span>วันและเวลาจัดกิจกรรม (นโยบาย Lead-time: ล่วงหน้าอย่างน้อย 3 วัน)</span>
                  </span>
                  {isAdmin && <span className="text-purple-700 font-extrabold">ปลดล็อกสิทธิ์ Admin แล้ว</span>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">วันที่จัดกิจกรรม</label>
                    <input
                      type="date"
                      min={minCommunityDate}
                      value={communityDate}
                      onChange={(e) => setCommunityDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">เวลาเริ่ม</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">เวลาสิ้นสุด</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">จำนวนคนเปิดรับสูงสุด</label>
                    <input
                      type="number"
                      min={2}
                      max={isHost || isAdmin ? 100 : 15}
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {isHost || isAdmin ? 'โฮสต์สามารถเปิดรับได้สูงสุด 100 คน' : 'สมาชิกทั่วไปเปิดรับได้สูงสุด 15 คน'}
                    </span>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">ค่าใช้จ่าย</label>
                    <input
                      type="text"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="เช่น ฟรี, หรือ 150 บาท"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Fair Date Range Form */}
            {entityType === 'fair' && (
              <div className="space-y-3 p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80">
                <div className="flex items-center justify-between text-xs font-bold text-blue-950">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#2B527A]" />
                    <span>ช่วงวันที่จัดแสดง (นโยบาย Lead-time: ล่วงหน้าอย่างน้อย 7 วัน)</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">วันเริ่มงาน</label>
                    <input
                      type="date"
                      min={minFairDate}
                      value={fairStartDate}
                      onChange={(e) => setFairStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">วันสิ้นสุดงาน</label>
                    <input
                      type="date"
                      min={fairStartDate}
                      value={fairEndDate}
                      onChange={(e) => setFairEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">ชื่อองค์กร / ผู้จัดงาน</label>
                    <input
                      type="text"
                      value={fairOrganizer}
                      onChange={(e) => setFairOrganizer(e.target.value)}
                      placeholder="เช่น สมาคมผู้จัดพิมพ์ฯ / กระทรวงการท่องเที่ยวฯ"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">ลิงก์ข้อมูลเพิ่มเติม / จองบัตร</label>
                    <input
                      type="url"
                      value={fairTicketUrl}
                      onChange={(e) => setFairTicketUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Location & Province Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">จังหวัด</label>
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
                    ชื่อสถานที่ / ย่าน / จุดสังเกต <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[11px] font-bold ${locationName.length > 70 ? 'text-orange-600' : 'text-slate-400'}`}>
                    {locationName.length}/80 ตัวอักษร
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="เช่น สวนวชิรเบญจทัศ (สวนรถไฟ) โซนลานหญ้าหน้าหอจดหมายเหตุ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-[#4A7C59] outline-none"
                />
              </div>
            </div>

            {/* Description with WYSIWYG Rich Text Editor & One-Click Templates */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                รายละเอียด & บรรยากาศ (พิมพ์ตัวหนาหรือรายการได้ทันที)
              </label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="เล่าบรรยากาศ แผนกิจกรรมคร่าวๆ หรือกดปุ่ม 'ใช้โครงสร้างตัวอย่าง' ด้านบนเพื่อวางเทมเพลตมาตรฐาน..."
                templateLabel={DESCRIPTION_TEMPLATES[entityType]?.label}
                onApplyTemplate={applyTemplate}
                minHeight="150px"
              />
            </div>

            {/* Preset / Upload Photo Picker */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/90">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#4A7C59]" />
                  <span>รูปภาพหน้าปก (แนะนำรูปแนวนอนเพื่อความสวยงาม)</span>
                </label>
                <span className="text-[10.5px] text-slate-400 font-medium">
                  รองรับ JPG, PNG, WEBP (ไม่เกิน 5MB)
                </span>
              </div>

              {/* Upload Action Button & Preview */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-[#4A7C59] rounded-xl text-xs font-bold text-slate-700 cursor-pointer transition-all shadow-2xs hover:bg-emerald-50/50">
                  <Upload className="w-4 h-4 text-[#4A7C59]" />
                  <span>{uploadedImage ? 'เปลี่ยนรูปภาพจากเครื่อง' : 'อัปโหลดรูปภาพจากเครื่องของคุณ'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {uploadedImage && (
                  <button
                    type="button"
                    onClick={() => setUploadedImage(null)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ใช้รูปพรีเซ็ตแทน</span>
                  </button>
                )}
              </div>

              {uploadError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-1.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadedImage ? (
                <div className="relative aspect-video max-w-sm rounded-xl overflow-hidden border-2 border-[#4A7C59] shadow-sm">
                  <img src={uploadedImage} alt="Uploaded preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    รูปที่คุณอัปโหลดเอง
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 block">หรือเลือกภาพพรีเซ็ตแนะนำ:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESET_IMAGES[entityType]?.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => { setImage(preset.url); setUploadedImage(null); }}
                        className={`relative rounded-xl overflow-hidden aspect-video cursor-pointer border-2 transition-all ${
                          image === preset.url && !uploadedImage ? 'border-[#4A7C59] ring-2 ring-[#4A7C59]/20 shadow-xs' : 'border-transparent opacity-75 hover:opacity-100'
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
              )}
            </div>
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

            {/* Realistic Mini-Detail Container (Scaled down representation) */}
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
              <div className="px-5 pb-5 space-y-2">
                <h5 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2">
                  รายละเอียดกิจกรรม & เนื้อหาที่กรอกไว้
                </h5>
                <div className="text-xs leading-relaxed max-h-52 overflow-y-auto pr-1">
                  {renderDescriptionContent(description) || (
                    <span className="text-slate-400 italic">ไม่มีรายละเอียดเนื้อหา</span>
                  )}
                </div>
              </div>

            </div>

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

        {/* Modal Action Buttons Footer */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ย้อนกลับ</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
            >
              ยกเลิก
            </button>

            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl bg-[#4A7C59] hover:bg-[#386144] text-white text-xs font-black transition-all shadow-md shadow-[#4A7C59]/20 cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>ถัดไป</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleProceedToStep3}
                className="px-5 py-2.5 rounded-xl bg-[#4A7C59] hover:bg-[#386144] text-white text-xs font-black transition-all shadow-md shadow-[#4A7C59]/20 cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>ตรวจสอบพรีวิว</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFormSubmit}
                className="px-6 py-2.5 rounded-xl bg-[#F26430] hover:bg-[#D95322] text-white text-xs font-black transition-all shadow-md shadow-[#F26430]/20 cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>กำลังบันทึกข้อมูล...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ยืนยัน & เผยแพร่ทันที</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

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
