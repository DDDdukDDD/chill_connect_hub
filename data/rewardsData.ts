// data/rewardsData.ts
// Single source of truth for Community Rewards & Voucher Catalog

export interface RewardShopItem {
  id: string;
  title: string;
  category: 'cafe' | 'boardgame' | 'sports' | 'merch' | 'workshop';
  categoryLabel: string;
  costXp: number;
  iconName: string;
  emoji: string;
  description: string;
  partner: string;
  partnerLocation: string;
  voucherCode: string;
  stockCount: number;
  discountValue: string;
  validUntil: string;
  terms: string[];
  featured?: boolean;
  /** A prize draw entry instead of a voucher: each member gets their own entry code, and no stock runs out */
  drawEntry?: { drawLabel: string; prizeCount: number };
}

export const REWARD_CATEGORIES = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'cafe', label: 'คาเฟ่ & สโลว์บาร์', icon: '☕' },
  { id: 'boardgame', label: 'บอร์ดเกม & คอมมูนิตี้', icon: '🎲' },
  { id: 'sports', label: 'วิ่ง & ฟิตเนส', icon: '🏃' },
  { id: 'workshop', label: 'เวิร์กช็อป & งานคราฟต์', icon: '🎨' },
  { id: 'merch', label: 'ของที่ระลึกพิเศษ', icon: '🎽' },
] as const;

export const REWARD_SHOP_ITEMS: RewardShopItem[] = [
  {
    // SAMPLE launch prize (data/launchCampaign.ts); remove or replace before launch
    id: 'reward-launch-iphone',
    title: 'สิทธิ์ลุ้น iPhone Duo ฟรี กิจกรรมเปิดตัว',
    category: 'merch',
    categoryLabel: 'ของรางวัลพิเศษ',
    costXp: 500,
    iconName: 'Gift',
    emoji: '🎁',
    description: 'ฉลองเปิดตัว Chillwaa ใช้ 500 XP แลกสิทธิ์ลุ้น iPhone Duo 1 เครื่อง สะสม XP ได้จากชาเลนจ์เปิดตัวทั้งสาม ไปตี้ แชร์โมเมนต์ และไปอีเวนต์',
    partner: 'Chillwaa',
    partnerLocation: 'ประกาศผลบนเว็บไซต์และแจ้งเตือนในแอป',
    voucherCode: 'LAUNCH-DRAW',
    stockCount: 1,
    discountValue: 'iPhone Duo 1 รางวัล',
    validUntil: '31 ธ.ค. 2569',
    terms: [
      'แลกสิทธิ์ได้ 1 ครั้งต่อบัญชี ภายใน 31 ธ.ค. 2569',
      'จับรางวัล 15 ม.ค. 2570 จากรหัสสิทธิ์ของสมาชิกทุกคนที่แลกไว้',
      'ผู้โชคดีต้องยืนยันตัวตนกับทีมงานภายใน 7 วัน ไม่เช่นนั้นจะจับรางวัลใหม่',
      'ของรางวัลเปลี่ยนเป็นเงินสดหรือโอนสิทธิ์ให้ผู้อื่นไม่ได้',
    ],
    featured: true,
    drawEntry: { drawLabel: '15 ม.ค. 2570', prizeCount: 1 },
  },
  {
    id: 'reward-1',
    title: 'คูปองส่วนลด ฿50 Specialty Coffee',
    category: 'cafe',
    categoryLabel: 'คาเฟ่ & สโลว์บาร์',
    costXp: 150,
    iconName: 'Coffee',
    emoji: '☕',
    description: 'ใช้เป็นส่วนลดเครื่องดื่มทุกเมนูที่คาเฟ่พาร์ทเนอร์ย่านอารีย์ ทองหล่อ และเจริญกรุง',
    partner: 'Ari & Thonglor Specialty Cafes',
    partnerLocation: 'อารีย์, ทองหล่อ, เจริญกรุง (12 สาขา)',
    voucherCode: 'CHILL50-ARI-889',
    stockCount: 18,
    discountValue: 'ลด ฿50',
    validUntil: '31 ธ.ค. 2569',
    terms: [
      'ใช้ได้กับเครื่องดื่ม Specialty Coffee ทุกเมนู ทั้งร้อนและเย็น',
      'แสดงรหัสคูปองกับพนักงานก่อนชำระเงิน',
      '1 คูปองต่อ 1 ใบเสร็จ ไม่สามารถแลกเปลี่ยนเป็นเงินสดได้',
    ],
    featured: true,
  },
  {
    id: 'reward-2',
    title: 'ตั๋วทดลองเล่นบอร์ดเกมฟรี 1 วัน (มูลค่า ฿150)',
    category: 'boardgame',
    categoryLabel: 'บอร์ดเกม & คอมมูนิตี้',
    costXp: 250,
    iconName: 'Dices',
    emoji: '🎲',
    description: 'เข้าเล่นบอร์ดเกมไม่อั้นตลอดวัน พร้อม Game Master แนะนำเกมที่ร้านบอร์ดเกมพาร์ทเนอร์สยามสแควร์',
    partner: 'Siam Board Game Lounge',
    partnerLocation: 'สยามสแควร์ ซอย 3',
    voucherCode: 'BG-FREEPASS-2026',
    stockCount: 12,
    discountValue: 'ฟรี 1 วัน (มูลค่า ฿150)',
    validUntil: '30 พ.ย. 2569',
    terms: [
      'เข้าเล่นได้ตั้งแต่ร้านเปิดจนถึงร้านปิดในวันจันทร์ - ศุกร์',
      'ไม่รวมค่าอาหารและเครื่องดื่มเพิ่มเติม',
      'กรุณาสำรองโต๊ะล่วงหน้าในวันหยุดสุดสัปดาห์',
    ],
    featured: true,
  },
  {
    id: 'reward-3',
    title: 'เสื้อยืดลิมิเต็ด Chillwaa Edition',
    category: 'merch',
    categoryLabel: 'ของที่ระลึกพิเศษ',
    costXp: 500,
    iconName: 'Shirt',
    emoji: '🎽',
    description: 'เสื้อยืดผ้าพรีเมียมคอตตอน 100% สกรีนลายกราฟิกมินิมอลเฉพาะสมาชิกผู้พิชิตระดับ Explorer',
    partner: 'Chillwaa Official Store',
    partnerLocation: 'จัดส่งถึงบ้านฟรีทั่วประเทศ',
    voucherCode: 'TSHIRT-VIP-GOLD',
    stockCount: 5,
    discountValue: 'มูลค่า ฿590',
    validUntil: '31 ต.ค. 2569',
    terms: [
      'สามารถเลือกขนาดรอบอก S, M, L, XL, 2XL ได้หลังกดแลกสิทธิ์',
      'จัดส่งฟรีผ่านขนส่งเอกชนภายใน 3-5 วันทำการ',
      'สินค้ามีจำนวนจำกัดเพียง 50 ตัวเท่านั้น',
    ],
    featured: true,
  },
  {
    id: 'reward-4',
    title: 'คูปองส่วนลด ฿100 บัตรวิ่งมาราธอน & City Run',
    category: 'sports',
    categoryLabel: 'วิ่ง & ฟิตเนส',
    costXp: 300,
    iconName: 'Activity',
    emoji: '🏃',
    description: 'ส่วนลดค่าสมัครกิจกรรมวิ่งมินิมาราธอนและ City Run ซิตี้รันเนอร์ที่ร่วมรายการทั่วกรุงเทพฯ',
    partner: 'Bangkok Active Marathon Series',
    partnerLocation: 'สวนลุมพินี & สวนเบญจกิติ',
    voucherCode: 'RUN100-ACTIVE',
    stockCount: 20,
    discountValue: 'ลด ฿100',
    validUntil: '15 ธ.ค. 2569',
    terms: [
      'ใช้เป็นโค้ดส่วนลดบนระบบสมัครงานวิ่งออนไลน์',
      'ใช้ได้กับระยะ 5K, 10K, และ 21K',
      'รหัสสามารถโอนสิทธิ์ให้เพื่อนนักวิ่งได้',
    ],
    featured: false,
  },
  {
    id: 'reward-5',
    title: 'เซ็ตกาแฟดริปพรีเมียม ดอยปางขอน & แม่จันใต้',
    category: 'cafe',
    categoryLabel: 'คาเฟ่ & สโลว์บาร์',
    costXp: 220,
    iconName: 'Package',
    emoji: '☕',
    description: 'กล่อง Drip Bag กาแฟอาราบิกาไทยเกรด Specialty 5 ซอง คั่วสดใหม่ กลิ่นหอมผลไม้และคาราเมล',
    partner: 'Slow Bar Collective Chiang Rai',
    partnerLocation: 'จัดส่งถึงบ้าน หรือรับที่บูธงานนิทรรศการกาแฟ',
    voucherCode: 'DRIP-SPECIAL-220',
    stockCount: 15,
    discountValue: 'มูลค่า ฿220',
    validUntil: '31 ธ.ค. 2569',
    terms: [
      'ประกอบด้วยกาแฟดริปแบบซอง 5 ชิ้น คละรสชาติซิกเนเจอร์',
      'ไม่มีค่าจัดส่งเพิ่มเติมเมื่อจัดส่งในเขตกรุงเทพฯ และปริมณฑล',
    ],
    featured: false,
  },
  {
    id: 'reward-6',
    title: 'ส่วนลด ฿200 เวิร์กช็อปปั้นเซรามิก & เพ้นท์แก้ว',
    category: 'workshop',
    categoryLabel: 'เวิร์กช็อป & งานคราฟต์',
    costXp: 350,
    iconName: 'Palette',
    emoji: '🎨',
    description: 'ส่วนลดคลาสปั้นดินและระบายสีเซรามิก ได้ชิ้นงานจริงกลับบ้าน สตูดิโอติด BTS สะพานควาย',
    partner: 'Clay & Craft Space Studio',
    partnerLocation: 'สะพานควาย - อารีย์',
    voucherCode: 'CLAY-CRAFT-200',
    stockCount: 8,
    discountValue: 'ลด ฿200',
    validUntil: '31 ธ.ค. 2569',
    terms: [
      'ใช้ได้กับคลาสปั้นมือ (Hand-building) และแป้นหมุน (Throwing)',
      'รวมค่าเผาเคลือบและส่งชิ้นงานถึงบ้าน',
      'กรุณาจองรอบเวลาล่วงหน้าอย่างน้อย 2 วัน',
    ],
    featured: true,
  },
  {
    id: 'reward-7',
    title: 'กระเป๋าผ้าแคนวาส Chill Explorer Eco Tote',
    category: 'merch',
    categoryLabel: 'ของที่ระลึกพิเศษ',
    costXp: 200,
    iconName: 'ShoppingBag',
    emoji: '🎽',
    description: 'กระเป๋าผ้าแคนวาสหนาพิเศษ 14oz จุของได้เยอะ เหมาะสำหรับสะพายไปปิกนิก สวน หรือคาเฟ่',
    partner: 'Chillwaa Official Store',
    partnerLocation: 'จัดส่งถึงบ้านฟรีทั่วประเทศ',
    voucherCode: 'TOTE-EXPLORER-200',
    stockCount: 25,
    discountValue: 'มูลค่า ฿290',
    validUntil: '31 ธ.ค. 2569',
    terms: [
      'ผ้าแคนวาสธรรมชาติ 100% ซักทำความสะอาดได้',
      'จัดส่งฟรีทั่วประเทศภายใน 3-5 วันทำการ',
    ],
    featured: false,
  },
  {
    id: 'reward-8',
    title: 'บัตรกำนัล ฿100 คอมบูชะ & เครื่องดื่มโฮมเมด',
    category: 'cafe',
    categoryLabel: 'คาเฟ่ & สโลว์บาร์',
    costXp: 180,
    iconName: 'Sparkles',
    emoji: '🍹',
    description: 'ส่วนลดเครื่องดื่มหมักเพื่อสุขภาพ คอมบูชะผลไม้สด และชาสกัดเย็นที่ Slow Bar พาร์ทเนอร์',
    partner: 'Kombucha Lab & Slow Bar',
    partnerLocation: 'เอกมัย & ปรีดี พนมยงค์',
    voucherCode: 'KOMBUCHA-100-HUB',
    stockCount: 14,
    discountValue: 'ลด ฿100',
    validUntil: '30 พ.ย. 2569',
    terms: [
      'ใช้ได้กับเครื่องดื่มทุกเมนูในร้าน',
      'แสดงรหัสคูปองต่อพนักงานก่อนรับออเดอร์',
    ],
    featured: false,
  },
];

