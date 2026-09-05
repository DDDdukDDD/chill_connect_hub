'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/BrandLogo';
import {
  Sprout,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  User,
  Users,
  Compass,
  Heart,
  Building2,
  Palette,
  Briefcase,
  Trophy,
  CheckCircle2,
  Activity,
  Award,
  ShieldCheck,
  Flame,
  Coffee,
  Ticket,
  Store,
  Lightbulb,
  Smile,
  Shield,
  MapPin,
  Zap,
  Camera,
  GraduationCap,
  Upload,
  Plus,
  X,
  Image as ImageIcon,
  Calendar,
  AlertCircle,
  XCircle,
  Globe,
  Trees,
  Utensils,
  Music,
  BookOpen,
  Wine,
  Dices,
  Sun,
  Home,
  Eye,
  EyeOff,
  Loader2,
  Info,
} from 'lucide-react';

// Expanded 6 Choices for Members (Participants) - 100% Unique Icons
const MEMBER_GOALS = [
  {
    id: 'find_friends',
    role: 'member',
    icon: Users,
    title: 'หาเพื่อนใหม่คอเดียวกัน',
    desc: 'นัดกินกาแฟ Specialty เล่นบอร์ดเกม แฮงเอาต์กับเพื่อนที่มีไลฟ์สไตล์ตรงกัน',
  },
  {
    id: 'sports_party',
    role: 'member',
    icon: Flame,
    title: 'หาตี้ออกกำลังกาย / วิ่ง / สปอร์ต',
    desc: 'ชวนกันวิ่งรอบสวนเบญจกิติ ปั่นจักรยาน ตีแบด มีเพื่อนกระตุ้นไม่เหงา',
  },
  {
    id: 'healing_weekend',
    role: 'member',
    icon: Heart,
    title: 'หาที่พักผ่อนฮีลใจวันหยุด',
    desc: 'ชมนิทรรศการศิลปะ, Sound bath, คาเฟ่ธรรมชาติ เติมพลังบวกและความผ่อนคลาย',
  },
  {
    id: 'explore_events',
    role: 'member',
    icon: Compass,
    title: 'ตามหาอีเวนต์ & งานแฟร์ใหญ่ในกรุง',
    desc: 'มหกรรมหนังสือ งานกาแฟ งานคราฟต์ คอนเสิร์ตใหญ่ไม่ตกเทรนด์ในกรุงเทพฯ',
  },
  {
    id: 'try_new_things',
    role: 'member',
    icon: Lightbulb,
    title: 'ลองทำกิจกรรม & เวิร์กช็อปใหม่ๆ',
    desc: 'เวิร์กช็อปปั้นเซรามิก ร้อยลูกปัด ทำอาหาร ดริปกาแฟ เปิดประสบการณ์ใหม่',
  },
  {
    id: 'foodie_cafe',
    role: 'member',
    icon: Coffee,
    title: 'Cafe Hopping & หาเพื่อนกินของอร่อย',
    desc: 'ตามรอยร้านกาแฟเปิดใหม่ ร้านลับย่านอารีย์/สุขุมวิท และสายบาร์นั่งชิลล์',
  },
];

// Expanded 6 Choices for Hosts & Business (Organizers) - 100% Unique Icons
const HOST_GOALS = [
  {
    id: 'community_host',
    role: 'host',
    icon: Sparkles,
    title: 'ฉันเป็นโฮสต์ชุมชน / อยากเปิดตี้กิจกรรม',
    desc: 'เปิดตี้บอร์ดเกม นำทีมวิ่ง นัดดริปกาแฟ จัดมีทติ้งกลุ่มย่อยสร้างคอมมูนิตี้ของตัวเอง',
  },
  {
    id: 'venue_space',
    role: 'venue',
    icon: Store,
    title: 'สถานที่ / คาเฟ่ / แกลเลอรี / สตูดิโอ',
    desc: 'มีพื้นที่หน้าร้าน อยากดึงกลุ่มคนรุ่นใหม่เข้ามาจัดกิจกรรมและสร้างคอมมูนิตี้ร่วมกัน',
  },
  {
    id: 'workshop_creator',
    role: 'host',
    icon: Palette,
    title: 'ผู้จัดเวิร์กช็อป & สตูดิโอสร้างสรรค์',
    desc: 'เปิดคลาสศิลปะ งานฝีมือ ปั้นเซรามิก ทำอาหาร สัมมนาพัฒนาตนเอง สร้างฐานผู้ติดตาม',
  },
  {
    id: 'corporate_teambuilding',
    role: 'organizer',
    icon: Briefcase,
    title: '🏢 บริษัท / องค์กร & Team Building',
    desc: 'จัดกิจกรรมสานสัมพันธ์พนักงาน กิจกรรม CSR หรือสร้าง Challenge ไลฟ์สไตล์ในองค์กร',
  },
  {
    id: 'event_organizer',
    role: 'organizer',
    icon: Ticket,
    title: 'ผู้จัดงานอีเวนต์ & มหกรรมแฟร์ใหญ่',
    desc: 'โปรโมตงานแฟร์ งานวิ่ง นิทรรศการ และเปิดรับผู้ร่วมกิจกรรมและสปอนเซอร์',
  },
  {
    id: 'brand_sponsor',
    role: 'organizer',
    icon: Award,
    title: 'แบรนด์สินค้า & สปอนเซอร์ไลฟ์สไตล์',
    desc: 'สนับสนุนของรางวัล แคมเปญสะสมแต้ม หรือเปิดตัวสินค้าสู่กลุ่มคนรุ่นใหม่ในกรุงเทพฯ',
  },
];

// Step 3: 12 Rich & Distinct Hangout Styles
const HANGOUT_STYLES = [
  {
    id: 'cozy_chill',
    icon: Coffee,
    title: 'สายชิลล์ & Deep Talk',
    desc: 'ชอบกลุ่มเล็ก 2-4 คน นั่งคุยสบายๆ ในคาเฟ่ หรือแกลเลอรี บรรยากาศอบอุ่น ไม่ชอบที่เสียงดัง',
  },
  {
    id: 'active_outdoor',
    icon: Flame,
    title: 'สายแอคทีฟ & สปอร์ต',
    desc: 'ชอบขยับร่างกาย วิ่งสวนสาธารณะ ปั่นจักรยาน ตีแบด มีกิจกรรมให้ทำร่วมกัน ได้เหงื่อและสุขภาพดี',
  },
  {
    id: 'creative_workshop',
    icon: Palette,
    title: 'สายครีเอทีฟ & เสพศิลป์',
    desc: 'ชอบลองทำสิ่งใหม่ๆ ปั้นเซรามิก วาดรูป ชมนิทรรศการ เสพงานคราฟต์ และเวิร์กช็อปสร้างสรรค์',
  },
  {
    id: 'party_social',
    icon: Sparkles,
    title: 'สายปาร์ตี้ & เฮฮาเปิดตี้',
    desc: 'ชอบพลังงานสูง พบปะเพื่อนกลุ่มใหญ่ แลกเปลี่ยนประสบการณ์ คอนเสิร์ตสด และบอร์ดเกมสนุกๆ',
  },
  {
    id: 'foodie_cafe',
    icon: Utensils,
    title: 'สายกิน & Cafe Hopping',
    desc: 'ตามรอยร้านลับ ร้านอร่อย แฮงเอาต์บาร์ชิลล์ฟังดนตรีสด ถ่ายรูปสวย แลกเปลี่ยนพิกัดเด็ด',
  },
  {
    id: 'nature_camp',
    icon: Trees,
    title: 'สายธรรมชาติ & แคมปิ้ง',
    desc: 'สูดอากาศบริสุทธิ์ เดินป่า นั่งชิลล์ริมทะเล กางเต็นท์ริมน้ำ พักผ่อนฮีลใจท่ามกลางธรรมชาติ',
  },
  {
    id: 'wellness_healing',
    icon: Sun,
    title: 'สาย Wellness & ฮีลใจ',
    desc: 'โยคะ, Sound Bath, นวดผ่อนคลาย นั่งสมาธิ พักผ่อนฟื้นฟูพลังงานชีวิตและจิตใจ',
  },
  {
    id: 'boardgames_hub',
    icon: Dices,
    title: 'สายบอร์ดเกม & กิจกรรมในร่ม',
    desc: 'นัดวางแผน ชวนเล่นบอร์ดเกม ปาร์ตี้เกม การ์ดเกม ลับสมองประลองไหวพริบกับเพื่อนร่วมตี้',
  },
  {
    id: 'indie_concert',
    icon: Music,
    title: 'สายดนตรีสด & คอนเสิร์ต',
    desc: 'ฟังเพลงอินดี้ งานมิวสิกเฟสติวัล แจมดนตรีสด และดื่มด่ำบรรยากาศเสียงเพลง',
  },
  {
    id: 'photowalk_film',
    icon: Camera,
    title: 'สายโฟโต้วอล์ก & ถ่ายฟิล์ม',
    desc: 'เดินถ่ายรูปแนวสตรีท สแนปภาพคาเฟ่ พกกล้องฟิล์ม/ดิจิทัลเก็บโมเมนต์ความทรงจำ',
  },
  {
    id: 'bookclub_learn',
    icon: BookOpen,
    title: 'สายบุ๊กคลับ & พัฒนาตนเอง',
    desc: 'แลกเปลี่ยนมุมมองหนังสือ นั่งทำงาน Co-working space คุยเรื่องไอเดียและความคิดสร้างสรรค์',
  },
  {
    id: 'nightlife_bar',
    icon: Wine,
    title: 'สายบาร์ชิลล์ & Nightlife',
    desc: 'บาร์แจ๊ส, ค็อกเทลบาร์, รูฟท็อปชมวิวเมืองยามค่ำคืน นั่งคุยจิบค็อกเทลฟีลสบายๆ',
  },
];

import { ALL_THAI_PROVINCES } from '@/data/spotsData';
import { TermsPrivacyModal } from '@/components/TermsPrivacyModal';
import { Mail, Lock } from 'lucide-react';

// Step 3: Popular Living Provinces in Thailand
const POPULAR_PROVINCES = [
  { id: 'กรุงเทพฯ', label: '🏙️ กรุงเทพฯ', desc: 'เมืองหลวง & ศูนย์รวมอีเวนต์' },
  { id: 'นนทบุรี', label: '🏡 นนทบุรี', desc: 'อิมแพ็ค เมืองทองธานี & ชานเมือง' },
  { id: 'ปทุมธานี', label: '🌳 ปทุมธานี', desc: 'รังสิต, คลองหลวง & คอมมูนิตี้' },
  { id: 'สมุทรปราการ', label: '✈️ สมุทรปราการ', desc: 'บางพลี, บางปู & นิทรรศการ' },
  { id: 'เชียงใหม่', label: '🌄 เชียงใหม่', desc: 'นิมมาน, คาเฟ่ดอย & ศิลปวัฒนธรรม' },
  { id: 'ชลบุรี', label: '🌊 ชลบุรี / พัทยา', desc: 'บางแสน, หาดพัทยา & เซิร์ฟบอร์ด' },
  { id: 'ภูเก็ต', label: '🏝️ ภูเก็ต', desc: 'ทะเลอันดามัน, เมืองเก่า & กิจกรรมทางน้ำ' },
  { id: 'ขอนแก่น', label: '🌾 ขอนแก่น', desc: 'เมืองมหาวิทยาลัย & ดนตรีอินดี้' },
  { id: 'นครราชสีมา', label: '🌲 นครราชสีมา', desc: 'เขาใหญ่, แคมปิ้ง & คาเฟ่ธรรมชาติ' },
];

// Step 4: 20 Comprehensive Lifestyle Activities (100% Full Text Visibility)
const INTEREST_OPTIONS = [
  { id: 'coffee', label: 'Specialty Coffee & Drip', icon: '☕' },
  { id: 'matcha', label: 'มัทฉะ & ชาเขียวญี่ปุ่น', icon: '🍵' },
  { id: 'foodie', label: 'Cafe Hopping & ร้านลับ', icon: '🍜' },
  { id: 'cocktail_bar', label: 'Cocktail & บาร์คราฟต์', icon: '🍸' },
  { id: 'running', label: 'City Run & วิ่งสวน', icon: '🏃' },
  { id: 'badminton', label: 'แบดมินตัน & กีฬากลุ่ม', icon: '🏸' },
  { id: 'climbing', label: 'ปีนผาจำลอง & Bouldering', icon: '🧗' },
  { id: 'surf_skate', label: 'เซิร์ฟสเก็ต & ปั่นจักรยาน', icon: '🛹' },
  { id: 'art_pottery', label: 'เวิร์กช็อปศิลปะ & เซรามิก', icon: '🎨' },
  { id: 'exhibitions', label: 'นิทรรศการ & แกลเลอรี', icon: '🏛️' },
  { id: 'photo', label: 'ถ่ายภาพสตรีท & กล้องฟิล์ม', icon: '📸' },
  { id: 'indie_music', label: 'คอนเสิร์ตอินดี้ & ดนตรีสด', icon: '🎵' },
  { id: 'boardgames', label: 'บอร์ดเกม & การ์ดเกม', icon: '🎲' },
  { id: 'gaming', label: 'Gaming & E-Sports', icon: '🎮' },
  { id: 'indie_film', label: 'ดูหนังอินดี้ & อนิเมะ', icon: '🍿' },
  { id: 'yoga_soundbath', label: 'โยคะ & Sound Bath', icon: '🧘' },
  { id: 'bookclub', label: 'บุ๊กคลับ & พัฒนาตนเอง', icon: '📚' },
  { id: 'camping_nature', label: 'แคมปิ้ง & เดินป่าธรรมชาติ', icon: '🌲' },
  { id: 'pets', label: 'สัตว์เลี้ยง & Pet Friendly', icon: '🐾' },
  { id: 'volunteer_csr', label: 'อาสาสมัคร & จิตอาสา CSR', icon: '🤝' },
];

const MONTH_NAMES = [
  'มกราคม (ม.ค.)',
  'กุมภาพันธ์ (ก.พ.)',
  'มีนาคม (มี.ค.)',
  'เมษายน (เม.ย.)',
  'พฤษภาคม (พ.ค.)',
  'มิถุนายน (มิ.ย.)',
  'กรกฎาคม (ก.ค.)',
  'สิงหาคม (ส.ค.)',
  'กันยายน (ก.ย.)',
  'ตุลาคม (ต.ค.)',
  'พฤศจิกายน (พ.ย.)',
  'ธันวาคม (ธ.ค.)',
];

// Reserved / Taken Names in System for Duplicate Name Checking
const TAKEN_USERNAMES = [
  'admin',
  'som_chill',
  'som',
  'som_drip',
  'nat_runner',
  'art_pat',
  'fern_cafe',
  'bank_boardgame',
  'may_yoga',
  'pond_photo',
  'ice_indie',
  'ping_sports',
  'chill_host',
];

export default function OnboardingPage() {
  const router = useRouter();

  // Current Step: 0 to 5
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Role Tab in Step 1: 'member' vs 'host_business'
  const [step1RoleTab, setStep1RoleTab] = useState<'member' | 'host_business'>('member');

  // Sign-Up Connect Modal Popup State (Meetup-Inspired Clean & Airy Design)
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState<boolean>(true);
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);
  const [termsTab, setTermsTab] = useState<'terms' | 'privacy'>('terms');
  const [signUpName, setSignUpName] = useState<string>('');
  const [signUpEmail, setSignUpEmail] = useState<string>('');
  const [signUpPassword, setSignUpPassword] = useState<string>('');
  const [signUpLocation, setSignUpLocation] = useState<string>('Bangkok, TH');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isAgeConfirmed, setIsAgeConfirmed] = useState<boolean>(true);
  const [isHumanVerified, setIsHumanVerified] = useState<boolean>(false);
  const [isVerifyingHuman, setIsVerifyingHuman] = useState<boolean>(false);
  const [signUpError, setSignUpError] = useState<string>('');
  const [isEmailSignUpMode, setIsEmailSignUpMode] = useState<boolean>(false);
  const [acceptTerms, setAcceptTerms] = useState<boolean>(true);

  // Form State
  const [authMethod, setAuthMethod] = useState<'google' | 'apple' | 'facebook' | 'email'>('google');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['find_friends']);
  const [userRole, setUserRole] = useState<'member' | 'host' | 'venue' | 'organizer'>('member');

  // Live Password Strength Calculation
  const passwordStrength = useMemo(() => {
    if (!signUpPassword) return 0;
    if (signUpPassword.length >= 10 && /[A-Z]/.test(signUpPassword) && /\d/.test(signUpPassword)) return 3;
    if (signUpPassword.length >= 8) return 2;
    return 1;
  }, [signUpPassword]);

  // Interactive Human Check Handler (hCaptcha simulation)
  const handleToggleHumanCheck = () => {
    if (isHumanVerified) {
      setIsHumanVerified(false);
      return;
    }
    setIsVerifyingHuman(true);
    setTimeout(() => {
      setIsVerifyingHuman(false);
      setIsHumanVerified(true);
    }, 600);
  };

  const handleSocialConnect = (method: 'google' | 'apple' | 'facebook') => {
    setAuthMethod(method);
    let sampleName = 'คุณส้ม (Google)';
    let sampleEmail = 'som.chill@gmail.com';
    if (method === 'apple') {
      sampleName = 'คุณส้ม (Apple ID)';
      sampleEmail = 'som.apple@privaterelay.appleid.com';
    } else if (method === 'facebook') {
      sampleName = 'คุณส้ม (Facebook)';
      sampleEmail = 'som.fb@facebook.com';
    }
    setDisplayName(sampleName);
    setEmail(sampleEmail);
    setIsSignUpModalOpen(false);
  };

  const handleEmailSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim()) {
      setSignUpError('กรุณากรอกชื่อของคุณ (Your name is required)');
      return;
    }
    if (!signUpEmail.trim() || !signUpEmail.includes('@')) {
      setSignUpError('กรุณากรอกอีเมลที่ถูกต้อง (Valid email is required)');
      return;
    }
    if (!signUpPassword || signUpPassword.length < 8) {
      setSignUpError('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร (At least 8 characters required)');
      return;
    }
    if (!isAgeConfirmed) {
      setSignUpError('กรุณายืนยันว่าคุณมีอายุ 18 ปีขึ้นไป (Must be 18 years or older)');
      return;
    }
    if (!isHumanVerified) {
      setSignUpError('กรุณากดยืนยันว่าคุณเป็นมนุษย์ (Please complete the Human Check)');
      return;
    }
    if (!acceptTerms) {
      setSignUpError('กรุณากดยอมรับข้อตกลงและนโยบายความเป็นส่วนตัว');
      return;
    }

    setAuthMethod('email');
    setDisplayName(signUpName.trim());
    setEmail(signUpEmail.trim());
    if (signUpLocation) {
      setSelectedProvince(signUpLocation.includes('กรุงเทพ') || signUpLocation.toLowerCase().includes('bangkok') ? 'กรุงเทพฯ' : signUpLocation);
    }
    setIsSignUpModalOpen(false);
  };
  
  // Step 2 Demographics & Extended Profile
  const [displayName, setDisplayName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [email, setEmail] = useState('');
  const [birthDay, setBirthDay] = useState('15');
  const [birthMonth, setBirthMonth] = useState('6');
  const [birthYear, setBirthYear] = useState('2000');
  const [gender, setGender] = useState<'male' | 'female' | 'lgbtq' | 'unspecified'>('unspecified');
  const [occupation, setOccupation] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [educationLevel, setEducationLevel] = useState('bachelor');
  const [institution, setInstitution] = useState('');
  
  // Step 2 Uploaded Photos (Defaults to 3 lifestyle photos, user can upload from device/camera)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
  ]);
  const [formError, setFormError] = useState<string>('');

  // Step 3 Hangout Styles (12 Styles) & Living Province
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['cozy_chill', 'foodie_cafe']);
  const [selectedProvince, setSelectedProvince] = useState<string>('กรุงเทพฯ');

  // Step 4 Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['coffee', 'boardgames', 'exhibitions', 'running']);

  // Calculate live age
  const calculatedAge = Math.max(15, new Date().getFullYear() - parseInt(birthYear, 10));

  // Live Name Duplicate Checking
  const nameStatus = useMemo(() => {
    const trimmed = displayName.trim().toLowerCase();
    if (!trimmed) return 'empty';
    if (TAKEN_USERNAMES.includes(trimmed)) return 'duplicate';
    if (trimmed.length < 2) return 'too_short';
    return 'available';
  }, [displayName]);

  // Toggle Goal helper
  const handleGoalToggle = (goalId: string, role: string) => {
    let next: string[];
    if (selectedGoals.includes(goalId)) {
      if (selectedGoals.length === 1) return; // Keep at least one
      next = selectedGoals.filter((g) => g !== goalId);
    } else {
      next = [...selectedGoals, goalId];
    }
    setSelectedGoals(next);

    if (step1RoleTab === 'host_business') {
      const matched = HOST_GOALS.find((h) => next.includes(h.id));
      setUserRole((matched?.role as any) || 'host');
    } else {
      setUserRole('member');
    }
  };

  // Upload Photo handler (Supports Camera / Gallery / PC File Picker)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedPhotos((prev) => {
            const updated = [...prev, event.target!.result as string].slice(0, 6);
            if (updated.length >= 3) setFormError('');
            return updated;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove Photo handler
  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      if (filtered.length < 3) {
        setFormError('⚠️ ต้องการรูปภาพอย่างน้อย 3 รูปเพื่อความน่าเชื่อถือในคอมมูนิตี้');
      }
      return filtered;
    });
  };

  // Toggle Hangout Style helper
  const handleStyleToggle = (styleId: string) => {
    if (selectedStyles.includes(styleId)) {
      if (selectedStyles.length === 1) return; // Keep at least one
      setSelectedStyles(selectedStyles.filter((s) => s !== styleId));
    } else {
      setSelectedStyles([...selectedStyles, styleId]);
    }
  };



  const handleInterestToggle = (id: string) => {
    if (selectedInterests.includes(id)) {
      if (selectedInterests.length === 1) return;
      setSelectedInterests(selectedInterests.filter((i) => i !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  // Validate Step 2 before moving to Step 3 (Required: Photos >= 3, Name valid & non-duplicate)
  const handleProceedStep2 = () => {
    setNameTouched(true);

    if (uploadedPhotos.length < 3) {
      setFormError('กรุณาอัปโหลดรูปภาพอย่างน้อย 3 รูปเพื่อดำเนินการต่อ');
      return;
    }
    if (!displayName.trim()) {
      setFormError('กรุณาระบุชื่อเล่นหรือชื่อที่ใช้แสดง');
      return;
    }
    if (nameStatus === 'duplicate') {
      setFormError('ชื่อนี้มีผู้ใช้งานแล้วในระบบ กรุณาลองใช้ชื่ออื่นหรือเพิ่มตัวเลข');
      return;
    }
    if (nameStatus === 'too_short') {
      setFormError('ชื่อที่ใช้แสดงต้องมีความยาวอย่างน้อย 2 ตัวอักษร');
      return;
    }

    setFormError('');
    setCurrentStep(3);
  };

  // Complete Onboarding & Save Profile
  const handleCompleteOnboarding = () => {
    const finalName = displayName.trim() || (authMethod === 'google' ? 'คุณส้ม (Google)' : authMethod === 'apple' ? 'คุณส้ม (Apple ID)' : 'คุณสมาชิกใหม่');
    
    const profile = {
      name: finalName,
      email: email || `${finalName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      role: userRole,
      avatar: uploadedPhotos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
      photos: uploadedPhotos,
      birthDay,
      birthMonth,
      birthYear,
      birthDate: `${birthDay}/${birthMonth}/${birthYear}`,
      age: calculatedAge,
      gender,
      occupation: occupation.trim() || 'สายไลฟ์สไตล์ & ครีเอทีฟ',
      workplace: workplace.trim() || '',
      educationLevel,
      institution: institution.trim() || '',
      styles: selectedStyles,
      province: selectedProvince,
      livingAreas: [selectedProvince],
      zones: [selectedProvince], // Backward compatibility
      interests: selectedInterests,
      goals: selectedGoals,
      badges: userRole !== 'member' 
        ? ['🌟 Verified Community Host Starter', '🌱 First Step Connect']
        : ['🌱 First Step Connect', '📸 Verified Photos (3+)'],
      connectPoints: 50,
      joinedDate: new Date().toISOString(),
    };

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', finalName);
    localStorage.setItem('userRole', userRole);
    localStorage.setItem('userProfile', JSON.stringify(profile));

    if (userRole !== 'member') {
      router.push('/myhub?welcome=true');
    } else {
      router.push('/?welcome=true');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col justify-between selection:bg-[#4A7C59] selection:text-white">
      
      {/* Top Header with Exact Main Page Branding (Clean & Focused) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-17 flex items-center justify-between">
          
          {/* Left: Exact Brand Logo & Slogan matching Main Page */}
          <Link 
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
          >
            <BrandLogo size="md" className="group-hover:scale-105 transition-transform" />
            <div className="flex flex-col justify-center">
              <span className="font-black text-lg sm:text-[20px] tracking-tight text-[#1E293B] font-sans leading-none">
                Chill & Connect Hub
              </span>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium tracking-normal leading-none mt-2 sm:mt-2.5 flex items-center gap-1.5">
                <span>ค้นหาที่เที่ยว</span>
                <span className="text-slate-300">•</span>
                <span>ออกไปใช้ชีวิต</span>
                <span className="text-slate-300">•</span>
                <span>พบเพื่อนใหม่</span>
              </p>
            </div>
          </Link>

          {/* Right: Security & Safe Space Trust Badge (Golden Warm Gold) */}
          <div className="flex items-center gap-2 text-xs font-black text-amber-950 bg-gradient-to-r from-amber-100 via-amber-50 to-yellow-100 px-3.5 py-1.5 rounded-full border border-amber-300 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Safe Space Community</span>
          </div>

        </div>
      </header>

      {/* Main Canvas with Broad, Generous Container matching Main Page */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col justify-center">
        
        {/* Full-width Spacious Card Container */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 lg:p-12 flex flex-col justify-between min-h-[660px] transition-all">
          
          {/* Top 4-Segmented Step Bar Indicator (Step 1 green, others gray) */}
          {currentStep > 0 && currentStep < 5 && (
            <div className="mb-5 pb-4 border-b border-slate-100">
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {[1, 2, 3, 4].map((stepNum) => (
                  <div key={stepNum} className="space-y-1.5">
                    <div
                      className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                        stepNum === currentStep
                          ? 'bg-[#4A7C59] shadow-xs'
                          : stepNum < currentStep
                          ? 'bg-emerald-600'
                          : 'bg-slate-200'
                      }`}
                    />
                    <div className="flex items-center justify-between text-[11px] font-bold px-0.5">
                      <span className={stepNum === currentStep ? 'text-[#4A7C59] font-black' : 'text-slate-400'}>
                        {stepNum === 1 && '1. วัตถุประสงค์'}
                        {stepNum === 2 && '2. ข้อมูลส่วนตัว'}
                        {stepNum === 3 && '3. สไตล์ & พื้นที่'}
                        {stepNum === 4 && '4. ความสนใจ'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* ======================================================== */}
          {/* STEP 1: WHAT BRINGS YOU HERE (ROLE SWITCHER TABS - OPTION 1) */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div className="flex flex-col justify-between flex-1 space-y-5 animate-fade-in">
              
              {/* Header Title Section */}
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                  อะไรพาคุณมาที่ Chill & Connect Hub? 🎯
                </h2>
                
                {/* Subtitle with Clean Multi-select Badge */}
                <div className="flex items-center gap-2 flex-wrap text-sm text-slate-500 font-medium pt-0.5">
                  <span>เลือกเป้าหมายของคุณ เพื่อให้ระบบคัดสรรกิจกรรมและจับคู่ฟีเจอร์ที่ตรงใจที่สุด</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#4A7C59] font-bold text-xs border border-emerald-200">
                    เลือกได้มากกว่า 1 ข้อ
                  </span>
                </div>
              </div>

              {/* Step 1 Feature Spotlight: ค้นหากิจกรรม (Explore Events & Discovery) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-slate-50 border border-emerald-200/80 flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#4A7C59] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Compass className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <span className="font-extrabold text-[#4A7C59] mr-1.5">ค้นหากิจกรรม (Explore & Discovery):</span>
                  <span>ศูนย์รวมอีเวนต์ & กิจกรรมกรุงเทพฯ ค้นหาทั้งงานแฟร์ใหญ่ (BITEC, QSNCC) และตี้กลุ่มย่อยคอมมูนิตี้ (ดริปกาแฟ, บอร์ดเกม, วิ่ง) พร้อมระบบ Buddy Matcher หาเพื่อนคอเดียวกันได้ทันที</span>
                </div>
              </div>

              {/* Role Switcher Tab Bar (White Background with High-Contrast Active State) */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-white rounded-2xl border-2 border-[#E8E2D8] shadow-xs max-w-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setStep1RoleTab('member');
                    setUserRole('member');
                    setSelectedGoals(['find_friends']);
                  }}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    step1RoleTab === 'member'
                      ? 'bg-[#4A7C59] text-white font-black shadow-md'
                      : 'text-slate-500 hover:text-slate-800 bg-transparent'
                  }`}
                >
                  <Smile className="w-4 h-4" />
                  <span>ฉันเป็นผู้เข้าร่วมกิจกรรม (Member)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep1RoleTab('host_business');
                    setUserRole('host');
                    setSelectedGoals(['community_host']);
                  }}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    step1RoleTab === 'host_business'
                      ? 'bg-[#2B527A] text-white font-black shadow-md'
                      : 'text-slate-500 hover:text-slate-800 bg-transparent'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>ฉันเป็นโฮสต์ / สถานที่ / องค์กร</span>
                </button>
              </div>

              {/* Expanded 6 Choices Grid (Spacious 2 Columns with 100% Full Text Visibility) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 my-auto">
                {(step1RoleTab === 'member' ? MEMBER_GOALS : HOST_GOALS).map((opt) => {
                  const isSelected = selectedGoals.includes(opt.id);
                  const Icon = opt.icon;
                  const isHostMode = step1RoleTab === 'host_business';

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleGoalToggle(opt.id, opt.role)}
                      className={`min-h-[104px] p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 select-none ${
                        isSelected
                          ? isHostMode
                            ? 'bg-sky-50/80 border-[#2B527A] ring-4 ring-[#2B527A]/15 shadow-sm'
                            : 'bg-emerald-50/80 border-[#4A7C59] ring-4 ring-[#4A7C59]/15 shadow-sm'
                          : 'bg-white hover:bg-slate-50 border-[#E8E2D8]'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? isHostMode
                            ? 'bg-[#2B527A] text-white shadow-xs'
                            : 'bg-[#4A7C59] text-white shadow-xs'
                          : isHostMode
                          ? 'bg-sky-100 text-[#2B527A]'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0 pr-1">
                        <h3 className="font-black text-sm sm:text-base text-slate-900 leading-snug">{opt.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? isHostMode
                            ? 'bg-[#2B527A] border-[#2B527A] text-white'
                            : 'bg-[#4A7C59] border-[#4A7C59] text-white'
                          : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions Bar (Brand Green Gradient Button) */}
              <div className="pt-6 sm:pt-7 border-t border-[#E8E2D8] flex items-center justify-between gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="px-5 py-3 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ย้อนกลับ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="bg-gradient-to-r from-[#4A7C59] via-emerald-600 to-teal-600 hover:from-[#3B6347] hover:to-emerald-700 text-white px-8 py-3.5 rounded-2xl font-black text-sm sm:text-base shadow-lg shadow-emerald-900/25 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
                >
                  <span>ถัดไป: ข้อมูลของคุณ</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: LET'S GET TO KNOW YOU (CLEAN WHITE THEME & LIVE CHECK) */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div className="flex flex-col justify-between flex-1 space-y-5 animate-fade-in">
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                  โปรไฟล์ & ข้อมูลส่วนตัว ✨
                </h2>
                <p className="text-sm sm:text-base text-slate-500 font-medium">
                  ใส่รูปโปรไฟล์และข้อมูลของคุณ เพื่อสร้างความน่าเชื่อถือ ปลอดภัย และช่วยให้เพื่อนๆ ในคอมมูนิตี้จดจำคุณได้
                </p>
              </div>

              {/* Step 2 Feature Spotlight: โมเมนต์โซเชียล (Moments & Safe Community) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-slate-50 to-teal-50/60 border border-emerald-200/80 flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#4A7C59] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <span className="font-extrabold text-[#4A7C59] mr-1.5">โมเมนต์โซเชียล (Moments & Safe Space):</span>
                  <span>แชร์โมเมนต์ & สังคมปลอดภัย แบ่งปันภาพความประทับใจหลังจบกิจกรรม มีระบบยืนยันตัวตน และรีวิวเพื่อนร่วมตี้ เพื่อให้ทุกการแฮงเอาต์ปลอดภัย มั่นใจ ปลอดขายตรง</span>
                </div>
              </div>

              {/* Main 2-Column Form Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 my-auto">
                
                {/* Left Column (5 Cols): Redesigned Elegant Photo Box (Clean White) */}
                <div className="lg:col-span-5 space-y-3 p-5 sm:p-6 bg-white rounded-3xl border-2 border-[#E8E2D8] shadow-xs flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-sm font-black text-slate-800 whitespace-nowrap">
                        รูปถ่ายของคุณ <span className="text-rose-500">*</span>
                      </label>
                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                        uploadedPhotos.length >= 3
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                      }`}>
                        {uploadedPhotos.length >= 3 ? `${uploadedPhotos.length}/3 รูป (ครบ)` : `${uploadedPhotos.length}/3 (ขาดอีก ${3 - uploadedPhotos.length})`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      อัปโหลดอย่างน้อย 3 รูป (รูปแรกจะเป็นรูปโปรไฟล์หลัก)
                    </p>
                  </div>

                  {/* 6-Slot Photo Grid */}
                  <div className="grid grid-cols-3 gap-2.5 my-2">
                    {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
                      const photoUrl = uploadedPhotos[slotIdx];
                      const isMain = slotIdx === 0;

                      return (
                        <div
                          key={slotIdx}
                          className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group ${
                            photoUrl
                              ? isMain
                                ? 'border-[#4A7C59] ring-2 ring-[#4A7C59]/30 shadow-xs'
                                : 'border-slate-300 shadow-2xs'
                              : slotIdx < 3
                              ? 'border-dashed border-amber-400 bg-amber-50/50 hover:bg-amber-50'
                              : 'border-dashed border-slate-300 bg-slate-50/60 hover:bg-slate-100/80'
                          }`}
                        >
                          {photoUrl ? (
                            <>
                              <img src={photoUrl} alt={`Uploaded ${slotIdx + 1}`} className="w-full h-full object-cover" />
                              {isMain && (
                                <span className="absolute bottom-1 left-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-black text-center py-0.5 rounded-md">
                                  รูปหลัก
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(slotIdx)}
                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
                                title="ลบรูปภาพนี้"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <label
                              htmlFor={`photo-upload-${slotIdx}`}
                              className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-[#4A7C59] cursor-pointer"
                            >
                              <Plus className="w-5 h-5 stroke-[2.5]" />
                              <span className="text-[10px] font-extrabold">
                                {slotIdx < 3 ? `รูปที่ ${slotIdx + 1} *` : 'เพิ่มรูป'}
                              </span>
                              <input
                                id={`photo-upload-${slotIdx}`}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Device Upload Button */}
                  <div>
                    <label
                      htmlFor="photo-upload-batch"
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-black shadow-2xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
                    >
                      <Upload className="w-4 h-4 text-[#4A7C59]" />
                      <span>อัปโหลดรูปจากเครื่อง / คลังภาพมือถือ</span>
                      <input
                        id="photo-upload-batch"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>

                    {formError && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 animate-shake">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column (7 Cols): Personal Information Form (Clean White Inputs) */}
                <div className="lg:col-span-7 space-y-3.5">
                  
                  {/* Display Name Input with Live Duplicate Checking */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-extrabold text-slate-800">
                        {userRole !== 'member' ? 'ชื่อที่ใช้แสดง / ชื่อเพจ / ชื่อสถานที่:' : 'ชื่อเล่นหรือชื่อที่ใช้แสดง (Display Name):'} <span className="text-rose-500">*</span>
                      </label>
                      {nameTouched && (
                        <span className="text-xs font-extrabold">
                          {nameStatus === 'available' && (
                            <span className="text-[#4A7C59] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>ชื่อนี้สามารถใช้ได้</span>
                            </span>
                          )}
                          {nameStatus === 'duplicate' && (
                            <span className="text-rose-600 flex items-center gap-1 animate-pulse">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>ชื่อนี้มีผู้ใช้งานแล้ว</span>
                            </span>
                          )}
                          {nameStatus === 'too_short' && (
                            <span className="text-amber-600">สั้นเกินไป (อย่างน้อย 2 ตัวอักษร)</span>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <User className={`w-5 h-5 absolute left-4 top-3.5 ${
                        nameTouched && nameStatus === 'duplicate' ? 'text-rose-500' : nameTouched && nameStatus === 'available' ? 'text-[#4A7C59]' : 'text-slate-400'
                      }`} />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => {
                          setDisplayName(e.target.value);
                          setNameTouched(true);
                          if (formError) setFormError('');
                        }}
                        onBlur={() => setNameTouched(true)}
                        placeholder={userRole !== 'member' ? 'เช่น Craft & Chill Studio หรือ Som Drip' : 'เช่น คุณส้ม (Som_Chill)'}
                        className={`w-full pl-12 pr-10 py-3 bg-white border-2 rounded-2xl text-sm font-bold text-slate-900 focus:outline-hidden transition-colors shadow-2xs ${
                          nameTouched && nameStatus === 'duplicate'
                            ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600'
                            : nameTouched && nameStatus === 'available'
                            ? 'border-[#4A7C59] bg-emerald-50/20 focus:border-[#4A7C59]'
                            : 'border-[#E8E2D8] focus:border-[#4A7C59]'
                        }`}
                      />
                      {nameTouched && nameStatus === 'available' && (
                        <CheckCircle2 className="w-5 h-5 text-[#4A7C59] absolute right-3.5 top-3.5" />
                      )}
                      {nameTouched && nameStatus === 'duplicate' && (
                        <XCircle className="w-5 h-5 text-rose-500 absolute right-3.5 top-3.5" />
                      )}
                    </div>
                  </div>

                  {/* Date of Birth: Day / Month / Year with Live Age Calculation */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-extrabold text-slate-800">
                        วัน / เดือน / ปีเกิด (Date of Birth): <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-xs font-black text-[#4A7C59] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        คำนวณอายุ: {calculatedAge} ปี 🎉
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {/* Day */}
                      <select
                        value={birthDay}
                        onChange={(e) => setBirthDay(e.target.value)}
                        className="px-3 py-2.5 bg-white border-2 border-[#E8E2D8] rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden focus:border-[#4A7C59] shadow-2xs cursor-pointer"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            วันที่ {d}
                          </option>
                        ))}
                      </select>

                      {/* Month */}
                      <select
                        value={birthMonth}
                        onChange={(e) => setBirthMonth(e.target.value)}
                        className="px-3 py-2.5 bg-white border-2 border-[#E8E2D8] rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden focus:border-[#4A7C59] shadow-2xs cursor-pointer"
                      >
                        {MONTH_NAMES.map((m, idx) => (
                          <option key={idx + 1} value={idx + 1}>
                            {m}
                          </option>
                        ))}
                      </select>

                      {/* Year */}
                      <select
                        value={birthYear}
                        onChange={(e) => setBirthYear(e.target.value)}
                        className="px-3 py-2.5 bg-white border-2 border-[#E8E2D8] rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden focus:border-[#4A7C59] shadow-2xs cursor-pointer"
                      >
                        {Array.from({ length: 60 }, (_, i) => 2010 - i).map((y) => (
                          <option key={y} value={y}>
                            ค.ศ. {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Gender Buttons (Required) */}
                  <div className="space-y-1">
                    <label className="block text-sm font-extrabold text-slate-800">
                      เพศ (Gender): <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'female', label: '👩 หญิง' },
                        { id: 'male', label: '👨 ชาย' },
                        { id: 'lgbtq', label: '🏳️‍🌈 LGBTQ+' },
                        { id: 'unspecified', label: '✨ ไม่ระบุ' },
                      ].map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setGender(g.id as any)}
                          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all cursor-pointer shadow-2xs ${
                            gender === g.id
                              ? 'bg-[#4A7C59] text-white border-[#4A7C59] shadow-sm'
                              : 'bg-white text-slate-700 border-[#E8E2D8] hover:bg-slate-50'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Workplace & Occupation (Optional) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                    <div className="space-y-1">
                      <label className="block text-xs font-extrabold text-slate-700">
                        อาชีพ / สายงาน (Occupation) <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>:
                      </label>
                      <div className="relative">
                        <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          value={occupation}
                          onChange={(e) => setOccupation(e.target.value)}
                          placeholder="เช่น UX/UI Designer"
                          className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-[#E8E2D8] rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden focus:border-[#4A7C59] shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-extrabold text-slate-700">
                        ที่ทำงาน / บริษัท (Workplace) <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>:
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          value={workplace}
                          onChange={(e) => setWorkplace(e.target.value)}
                          placeholder="เช่น Tech Studio หรือ Freelance"
                          className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-[#E8E2D8] rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden focus:border-[#4A7C59] shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Split Education: Level vs Institution (Optional) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-extrabold text-slate-700">
                        ระดับการศึกษา (Education Level) <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>:
                      </label>
                      <div className="relative">
                        <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <select
                          value={educationLevel}
                          onChange={(e) => setEducationLevel(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-[#E8E2D8] rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden focus:border-[#4A7C59] shadow-2xs cursor-pointer"
                        >
                          <option value="unspecified">ไม่ระบุ</option>
                          <option value="highschool">มัธยมศึกษา / ปวช. / ปวส.</option>
                          <option value="bachelor">ปริญญาตรี (Bachelor&apos;s)</option>
                          <option value="master">ปริญญาโท (Master&apos;s)</option>
                          <option value="doctorate">ปริญญาเอก (Doctorate)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-extrabold text-slate-700">
                        สถาบัน / มหาวิทยาลัย (School) <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>:
                      </label>
                      <input
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="เช่น จุฬาฯ, มศว, มธ., เกษตรศาสตร์"
                        className="w-full px-3.5 py-2.5 bg-white border-2 border-[#E8E2D8] rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden focus:border-[#4A7C59] shadow-2xs"
                      />
                    </div>
                  </div>

                </div>

              </div>

              {/* Bottom Actions Bar (with Ample Spacing) */}
              <div className="pt-6 sm:pt-7 border-t border-[#E8E2D8] flex items-center justify-between gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-3 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ย้อนกลับ</span>
                </button>
                <button
                  type="button"
                  onClick={handleProceedStep2}
                  className="bg-gradient-to-r from-[#4A7C59] via-emerald-600 to-teal-600 hover:from-[#3B6347] hover:to-emerald-700 text-white px-8 py-3.5 rounded-2xl font-black text-sm sm:text-base shadow-lg shadow-emerald-900/25 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
                >
                  <span>ถัดไป: สไตล์ & พื้นที่พักอาศัย</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: 12 HANGOUT STYLES & LIVING AREAS (RESIDENTIAL) */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div className="flex flex-col justify-between flex-1 space-y-5 animate-fade-in">
              
              {/* Clean Title Section without Emoji Clutter */}
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                  สไตล์ & พื้นที่พักอาศัย
                </h2>
                <div className="flex items-center gap-2 flex-wrap text-sm text-slate-500 font-medium pt-0.5">
                  <span>เลือกสไตล์การแฮงเอาต์ที่คุณชอบ และย่านที่คุณใช้ชีวิตประจำวัน</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#4A7C59] font-bold text-xs border border-emerald-200">
                    เลือกได้มากกว่า 1 ข้อ
                  </span>
                </div>
              </div>

              {/* Step 3 Feature Spotlight: มายฮับ (MyHub & Digital Tickets) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-slate-50 border border-emerald-200/80 flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#4A7C59] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Ticket className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <span className="font-extrabold text-[#4A7C59] mr-1.5">มายฮับ (MyHub & Digital Tickets):</span>
                  <span>กระเป๋าจัดเก็บกิจกรรม & ห้องแชตตี้ รวมตั๋ว E-Ticket ดิจิทัลสำหรับสแกนเข้างาน พร้อมห้องแชตกลุ่มย่อยสำหรับนัดแนะจุดรวมตัวตามละแวกที่พักอาศัยและจังหวัดต่างๆ สะดวกครบในที่เดียว</span>
                </div>
              </div>

              <div className="space-y-6 my-auto">
                
                {/* Section 1: 12 Hangout Styles (Clean Crisp White Cards in 3/4 Columns) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-black text-slate-800">
                      สไตล์การแฮงเอาต์ที่คุณชอบ (Hangout Styles):
                    </label>
                    <span className="text-xs font-bold text-[#4A7C59]">
                      เลือกแล้ว {selectedStyles.length} สไตล์
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {HANGOUT_STYLES.map((style) => {
                      const isSelected = selectedStyles.includes(style.id);
                      const Icon = style.icon;

                      return (
                        <div
                          key={style.id}
                          onClick={() => handleStyleToggle(style.id)}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none shadow-2xs ${
                            isSelected
                              ? 'bg-emerald-50/80 border-[#4A7C59] ring-4 ring-[#4A7C59]/15 shadow-sm'
                              : 'bg-white hover:bg-slate-50 border-[#E8E2D8]'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                isSelected ? 'bg-[#4A7C59] text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'bg-[#4A7C59] border-[#4A7C59] text-white' : 'border-slate-300'
                              }`}>
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-black text-xs sm:text-sm text-slate-900 leading-tight">{style.title}</h4>
                              <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">{style.desc}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Residential Living Province (Popular Quick Cards + Full 77 Province Dropdown) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#F26430]" />
                      <label className="block text-sm font-black text-slate-800">
                        จังหวัดที่คุณอาศัย หรือใช้ชีวิตหลัก (Primary Living Province): <span className="text-rose-500">*</span>
                      </label>
                    </div>
                    <span className="text-xs font-bold text-[#4A7C59] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                      📍 เลือก: {selectedProvince}
                    </span>
                  </div>

                  {/* Quick Popular Provinces */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {POPULAR_PROVINCES.map((prov) => {
                      const isSelected = selectedProvince === prov.id;
                      return (
                        <div
                          key={prov.id}
                          onClick={() => setSelectedProvince(prov.id)}
                          className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none shadow-2xs ${
                            isSelected
                              ? 'bg-emerald-50/80 border-[#4A7C59] ring-2 ring-[#4A7C59]/20 shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                              {prov.label}
                            </h5>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug truncate">
                              {prov.desc}
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[#4A7C59] border-[#4A7C59] text-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dropdown for All 77 Provinces */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#4A7C59]" />
                      <span className="text-xs font-extrabold text-slate-700 whitespace-nowrap">
                        หรือเลือกจังหวัดอื่นๆ ทั่วไทย (77 จังหวัด):
                      </span>
                    </div>
                    <select
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      className="w-full sm:w-64 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-[#4A7C59] shadow-2xs cursor-pointer"
                    >
                      {ALL_THAI_PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          📍 {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>

              {/* Bottom Actions Bar (with Ample Spacing) */}
              <div className="pt-6 sm:pt-7 border-t border-[#E8E2D8] flex items-center justify-between gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-3 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ย้อนกลับ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="bg-gradient-to-r from-[#4A7C59] via-emerald-600 to-teal-600 hover:from-[#3B6347] hover:to-emerald-700 text-white px-8 py-3.5 rounded-2xl font-black text-sm sm:text-base shadow-lg shadow-emerald-900/25 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
                >
                  <span>ถัดไป: หมวดหมู่ความสนใจ</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: PICK YOUR INTERESTS (SPACIOUS 4-COLUMN GRID) */}
          {/* ======================================================== */}
          {currentStep === 4 && (
            <div className="flex flex-col justify-between flex-1 space-y-5 animate-fade-in">
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                  เลือกกิจกรรมที่คุณชอบ 🎨
                </h2>
                <p className="text-sm sm:text-base text-slate-500 font-medium">
                  เลือกหมวดหมู่ที่คุณสนใจ เพื่อให้ AI คัดสรรกิจกรรมและเพื่อนที่มีความชอบตรงกัน
                </p>
              </div>

              {/* Step 4 Feature Spotlight: ชาเลนจ์ & ภารกิจ (Lifestyle Quests & Rewards) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-amber-50/40 to-slate-50 border border-emerald-200/80 flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <span className="font-extrabold text-amber-700 mr-1.5">ชาเลนจ์ & ภารกิจ (Lifestyle Quests & Rewards):</span>
                  <span>สะสมเหรียญตรา & แต้มแลกรางวัล เพิ่มความสนุกทุกสัปดาห์ด้วยภารกิจไลฟ์สไตล์ เช็กอินกิจกรรมเพื่อปลดล็อกเหรียญฉายา และสะสม Connect Points แลกสิทธิพิเศษกับร้านค้าพาร์ตเนอร์</span>
                </div>
              </div>

              <div className="space-y-4 my-auto">
                {/* 20 Visual Cards in Balanced 4-Column Grid with Centered Icon & Text Alignment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {INTEREST_OPTIONS.map((item) => {
                    const isSelected = selectedInterests.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleInterestToggle(item.id)}
                        className={`p-3 sm:p-3.5 rounded-2xl border-2 text-left transition-all flex items-center gap-3 cursor-pointer select-none shadow-2xs min-h-[66px] ${
                          isSelected
                            ? 'bg-emerald-50/80 border-[#4A7C59] ring-4 ring-[#4A7C59]/15 shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-[#E8E2D8]'
                        }`}
                      >
                        {/* Icon Badge */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xl transition-colors ${
                          isSelected ? 'bg-white shadow-xs' : 'bg-slate-100'
                        }`}>
                          {item.icon}
                        </div>

                        {/* Title Text (Vertically Centered) */}
                        <div className="min-w-0 flex-1">
                          <span className={`text-xs sm:text-[13px] font-black block leading-snug break-words ${
                            isSelected ? 'text-[#4A7C59]' : 'text-slate-800'
                          }`}>
                            {item.label}
                          </span>
                        </div>

                        {/* Checkmark Indicator */}
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#4A7C59] border-[#4A7C59] text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs sm:text-sm text-emerald-800 font-bold flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>เลือกแล้ว {selectedInterests.length} หมวดหมู่</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium hidden sm:inline">
                    (ระบบจัดเตรียมฟีดกิจกรรมเฉพาะสำหรับคุณพร้อมแล้ว)
                  </span>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-6 sm:pt-7 border-t border-[#E8E2D8] flex items-center justify-between gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-3 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ย้อนกลับ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="bg-gradient-to-r from-[#4A7C59] via-emerald-600 to-teal-600 hover:from-[#3B6347] hover:to-emerald-700 text-white px-8 py-3.5 rounded-2xl font-black text-sm sm:text-base shadow-lg shadow-emerald-900/25 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>เสร็จสิ้น: รับเหรียญต้อนรับ!</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 5: INFOGRAPHIC EXPLAINER & WELCOME JOURNEY */}
          {/* ======================================================== */}
          {currentStep === 5 && (
            <div className="flex flex-col justify-between flex-1 space-y-6 text-center animate-scale-up py-4">
              
              {/* Header Title Section */}
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  พร้อมหากิจกรรมและเพื่อนไปกับ Chill & Connect Hub กันแล้ว
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-4xl mx-auto leading-relaxed whitespace-nowrap sm:whitespace-normal md:whitespace-nowrap">
                  สรุป 4 ขั้นตอนง่ายๆ ที่จะเปลี่ยนวันว่างและไลฟ์สไตล์ของคุณให้สนุก ปลอดภัย และได้เจอเพื่อนใหม่คอเดียวกัน
                </p>
              </div>

              {/* 4-Step Infographic Journey Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 my-auto max-w-5xl w-full mx-auto text-left">
                
                {/* Step 1 */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-emerald-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
                  <div className="space-y-3 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-[#4A7C59] text-white flex items-center justify-center shadow-xs">
                      <Compass className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black text-[#4A7C59] uppercase tracking-wider block">STEP 1 • DISCOVERY</span>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">1. ค้นหา & แมตช์ตี้</h3>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        รวมสถานที่น่าสนใจ งานแฟร์ใหญ่และตี้กลุ่มย่อย (กาแฟ, วิ่ง, บอร์ดเกม) พร้อมระบบ <strong className="text-slate-700">Buddy Matcher</strong> หาเพื่อนคอเดียวกันทันที
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-teal-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-teal-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
                  <div className="space-y-3 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                      <Ticket className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black text-teal-600 uppercase tracking-wider block">STEP 2 • MYHUB</span>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">2. รับตั๋ว & แชตนัดพบ</h3>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        จัดเก็บตั๋วดิจิทัลไว้ใน <strong className="text-slate-700">MyHub</strong> พร้อมเข้าห้องแชตกลุ่มย่อยเพื่อนัดแนะจุดรวมตัวตามแนวรถไฟฟ้า BTS/MRT
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-indigo-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
                  <div className="space-y-3 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider block">STEP 3 • COMMUNITY</span>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">3. แชร์ภาพ & รีวิวปลอดภัย</h3>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        แชร์ภาพโมเมนต์หลังจบกิจกรรม มีระบบรีวิวเพื่อนร่วมตี้ เพื่อให้ทุกการแฮงเอาต์ปลอดภัย มั่นใจ <strong className="text-slate-700">ปลอดขายตรง</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-amber-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
                  <div className="space-y-3 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black text-amber-700 uppercase tracking-wider block">STEP 4 • REWARDS</span>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">4. ชาเลนจ์ & แลกรางวัล</h3>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        พิชิตภารกิจไลฟ์สไตล์ สะสมเหรียญฉายา และนำ <strong className="text-slate-700">Connect Points</strong> ไปแลกสิทธิพิเศษกับร้านค้าพาร์ตเนอร์
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Welcome Bonus Callout Banner (with Ample Spacing) */}
              <div className="max-w-2xl w-full mx-auto p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-amber-50 via-emerald-50 to-teal-50 border border-amber-300/80 flex items-center justify-between gap-3 text-left mt-6 mb-2 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs sm:text-sm text-slate-900">
                      ยินดีด้วย! คุณได้รับของขวัญต้อนรับสมาชิกใหม่
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      ได้รับเหรียญตรา <strong>&quot;First Step Connect&quot;</strong> และโบนัสแต้มสะสมเริ่มต้น
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl shadow-2xs">
                  +50 Points
                </span>
              </div>

              {/* Launch CTA Button (Adjusted downward with generous breathing room) */}
              <div className="max-w-md w-full mx-auto pt-6 sm:pt-8 mt-2">
                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  className="w-full bg-gradient-to-r from-[#4A7C59] via-emerald-600 to-teal-600 hover:from-[#3B6347] hover:to-emerald-700 text-white py-4 px-6 rounded-2xl font-black text-sm sm:text-base transition-all shadow-xl shadow-emerald-900/25 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <span>{userRole !== 'member' ? 'เข้าสู่แดชบอร์ด & สร้างกิจกรรมแรก' : 'เริ่มต้นออกสำรวจกิจกรรม ชาเลนต์ และเพื่อนใหม่'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-[#E8E2D8] bg-white/50">
        Chill & Connect Hub © 2026 • Bangkok Social & Community Platform
      </footer>

      {/* ======================================================== */}
      {/* SIGN-UP CONNECT POPUP MODAL (CHILL & CONNECT HUB BRANDED) */}
      {/* ======================================================== */}
      {isSignUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-xs animate-fade-in">
          
          {!isEmailSignUpMode ? (
            /* VIEW 1: SIGN UP (MAIN SOCIAL VIEW - SPACIOUS & BRANDED) */
            <div className="bg-white rounded-[32px] max-w-[540px] w-full border border-slate-200 shadow-2xl overflow-hidden p-7 sm:p-10 animate-scale-up relative">
              {/* Close Button X */}
              <button
                type="button"
                onClick={() => setIsSignUpModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Brand Header */}
              <div className="text-center pt-2 pb-7">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  สมัครสมาชิกใหม่ (Sign up)
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 max-w-sm mx-auto leading-relaxed">
                  ร่วมเป็นส่วนหนึ่งของแพลตฟอร์มค้นพบไลฟ์สไตล์ สำหรับคนชอบออกไปใช้ชีวิต พร้อมรับ Welcome Bonus +50 XP
                </p>
              </div>

              {/* 3 Pill Social Buttons */}
              <div className="space-y-3.5">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => handleSocialConnect('google')}
                  className="w-full bg-white hover:bg-slate-50 text-slate-800 py-3.5 sm:py-4 px-6 rounded-full border border-slate-300 shadow-2xs font-extrabold text-sm sm:text-base flex items-center justify-center gap-3.5 active:scale-98 transition-all cursor-pointer group"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>ดำเนินการต่อด้วย Google (Gmail)</span>
                </button>

                {/* Apple */}
                <button
                  type="button"
                  onClick={() => handleSocialConnect('apple')}
                  className="w-full bg-white hover:bg-slate-50 text-slate-800 py-3.5 sm:py-4 px-6 rounded-full border border-slate-300 shadow-2xs font-extrabold text-sm sm:text-base flex items-center justify-center gap-3.5 active:scale-98 transition-all cursor-pointer group"
                >
                  <svg className="w-5 h-5 fill-black shrink-0" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.85-11.97-14.43-6.22-9.59-11.05-20.2-14.49-31.84-3.44-11.64-5.16-22.39-5.16-32.25 0-14.16 3.69-25.79 11.08-34.89 7.39-9.1 16.59-13.78 27.59-14.05 4.9 0 10.3 1.25 16.2 3.75 5.9 2.5 9.78 3.86 11.64 4.07 1.86-.21 5.86-1.63 12-4.26 6.14-2.63 11.53-3.79 16.19-3.48 11.24.78 20.35 5.25 27.32 13.41-9.8 5.88-14.61 14.28-14.43 25.19.18 8.82 3.52 16.16 10.01 22.02 6.49 5.86 14.16 9.17 23.01 9.94-2.18 6.64-4.8 13.06-7.86 19.26zM119.22 33.64c0-6.93 2.56-13.53 7.69-19.81 5.13-6.28 11.45-10.29 18.96-12.03.43 1.95.65 3.86.65 5.73 0 7.04-2.71 13.73-8.13 20.08-5.42 6.35-11.95 10.19-19.59 11.52-.43-1.84-.65-3.67-.65-5.49z"/>
                  </svg>
                  <span>ดำเนินการต่อด้วย Apple ID</span>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={() => handleSocialConnect('facebook')}
                  className="w-full bg-white hover:bg-slate-50 text-slate-800 py-3.5 sm:py-4 px-6 rounded-full border border-slate-300 shadow-2xs font-extrabold text-sm sm:text-base flex items-center justify-center gap-3.5 active:scale-98 transition-all cursor-pointer group"
                >
                  <svg className="w-5 h-5 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>ดำเนินการต่อด้วย Facebook</span>
                </button>
              </div>

              {/* Divider 'or' */}
              <div className="relative flex items-center justify-center my-6 sm:my-7">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-4 text-xs text-slate-400 font-bold uppercase tracking-wider shrink-0">
                  หรือ
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              {/* Sign up with email text button */}
              <div className="text-center pb-6 sm:pb-7">
                <button
                  type="button"
                  onClick={() => {
                    setIsEmailSignUpMode(true);
                    setSignUpError('');
                  }}
                  className="inline-flex items-center gap-2 text-sm sm:text-base font-extrabold text-slate-900 hover:text-[#4A7C59] transition-colors cursor-pointer hover:underline"
                >
                  <Mail className="w-4 h-4 text-[#4A7C59]" />
                  <span>สมัครสมาชิกด้วยอีเมล (Sign up with email)</span>
                </button>
              </div>

              {/* Footer Login Link */}
              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  มีบัญชีสมาชิกอยู่แล้ว?{' '}
                  <Link
                    href="/login"
                    className="font-extrabold text-[#4A7C59] hover:text-[#3B6347] hover:underline transition-colors cursor-pointer"
                  >
                    เข้าสู่ระบบที่นี่ (Log In)
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            /* VIEW 2: FINISH SIGNING UP WITH EMAIL & HUMAN CHECK (SPACIOUS & BRANDED - HIDDEN SCROLLBAR) */
            <div className="bg-white rounded-[32px] max-w-[540px] w-full border border-slate-200 shadow-2xl overflow-hidden p-7 sm:p-10 animate-scale-up relative max-h-[88vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {/* Top Header with Back and Close */}
              <div className="flex items-center justify-between pb-3">
                <button
                  type="button"
                  onClick={() => setIsEmailSignUpMode(false)}
                  className="text-slate-500 hover:text-slate-900 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title */}
              <div className="text-center pb-6">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  กรอกข้อมูลเพื่อสมัครสมาชิก
                </h2>
              </div>

              <form onSubmit={handleEmailSignUpSubmit} className="space-y-4">
                {/* Your name */}
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800">
                    ชื่อ-นามสกุล หรือชื่อเล่น (Your Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น น้องส้ม สายชิลล์ หรือ Som S."
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="w-full px-4.5 py-3 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/20 transition-all"
                  />
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                    ชื่อนี้จะแสดงบนโปรไฟล์ Chill & Connect ของคุณ เพื่อให้เพื่อนๆ ในมีตติ้งเรียกถูก
                  </p>
                </div>

                {/* Email address */}
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800">
                    อีเมล (Email Address) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="som.chill@email.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full px-4.5 py-3 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/20 transition-all"
                  />
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                    เราจะใช้อีเมลนี้เพื่อส่งบัตรกิจกรรม (Ticket) และการแจ้งเตือนจากระบบ
                  </p>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <label className="block text-xs sm:text-sm font-bold text-slate-800">
                      รหัสผ่าน (Password) <span className="text-rose-500">*</span>
                    </label>
                    <span title="รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" className="text-slate-400 hover:text-slate-600 cursor-help">
                      <Info className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      className="w-full px-4.5 py-3 pr-11 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                    ความยาวอย่างน้อย 8 ตัวอักษร เพื่อความปลอดภัยของบัญชีคุณ
                  </p>
                  {/* Password Strength Indicator Bars */}
                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    <div className={`h-1.5 rounded-full transition-all ${passwordStrength >= 1 ? (passwordStrength === 1 ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-slate-200'}`} />
                    <div className={`h-1.5 rounded-full transition-all ${passwordStrength >= 2 ? (passwordStrength === 2 ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-slate-200'}`} />
                    <div className={`h-1.5 rounded-full transition-all ${passwordStrength >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  </div>
                </div>

                {/* Age Checkbox */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs sm:text-sm font-bold text-slate-800">ยืนยันอายุ (Age Confirmation)</span>
                    <span title="ผู้ใช้งานต้องมีอายุ 18 ปีขึ้นไป" className="text-slate-400 hover:text-slate-600 cursor-help">
                      <Info className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 pt-0.5">
                    <input
                      type="checkbox"
                      id="confirm-age-onboarding"
                      checked={isAgeConfirmed}
                      onChange={(e) => setIsAgeConfirmed(e.target.checked)}
                      className="w-4.5 h-4.5 rounded text-[#4A7C59] focus:ring-[#4A7C59] cursor-pointer"
                    />
                    <label htmlFor="confirm-age-onboarding" className="text-xs sm:text-sm text-slate-700 font-semibold cursor-pointer">
                      ฉันมีอายุ 18 ปีขึ้นไป (I am 18 years of age or older)
                    </label>
                  </div>
                </div>

                {/* Human Check (hCaptcha Interactive Card) */}
                <div className="pt-2">
                  <div className="bg-[#FAFAFA] border border-slate-300 rounded-2xl p-3.5 max-w-[280px] flex items-center justify-between shadow-2xs">
                    <button
                      type="button"
                      onClick={handleToggleHumanCheck}
                      className="flex items-center gap-3 cursor-pointer group text-left"
                    >
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                        isHumanVerified
                          ? 'bg-emerald-500 border-emerald-600 text-white'
                          : 'border-slate-400 bg-white group-hover:border-slate-600'
                      }`}>
                        {isVerifyingHuman ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                        ) : isHumanVerified ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : null}
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-700 select-none">
                        ฉันเป็นมนุษย์ (I am human)
                      </span>
                    </button>

                    {/* hCaptcha Branding Icon & Text */}
                    <div className="flex flex-col items-center justify-center pl-2.5 border-l border-slate-200">
                      <svg className="w-6 h-6 text-[#00A88F]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z"/>
                      </svg>
                      <span className="text-[9px] font-bold text-slate-500 tracking-tighter">hCaptcha</span>
                    </div>
                  </div>
                </div>

                {signUpError && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-2 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{signUpError}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full bg-[#4A7C59] hover:bg-[#3B6347] text-white py-4 px-6 rounded-full font-black text-sm sm:text-base transition-all shadow-lg shadow-emerald-900/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>ยืนยันการสมัครและเริ่มต้นเลือกสไตล์</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

      {/* Terms & Privacy Policy Modal */}
      <TermsPrivacyModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        initialTab={termsTab}
      />

    </div>
  );
}

