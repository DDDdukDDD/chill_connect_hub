/**
 * The destination circles on /spots and the home page. Kept apart from components/TopDestinationsRail.tsx, which
 * loads the whole place catalog: importing this list from there shipped ~400 KB of sample places to /spots (2026-10-28).
 */
export interface TopDestinationItem {
  id: string;
  nameEn: string;
  nameTh: string;
  provinceKey: string;
  /** For a card named after one place in the province ("พัทยา • ชลบุรี"): the word /spots searches for, so the list is that place, not the whole province */
  searchTerm?: string;
  imageUrl: string;
  tagline: string;
  isUserFavorite?: boolean;
}

export const TOP_DESTINATIONS: TopDestinationItem[] = [
  {
    id: 'bkk',
    nameEn: 'Bangkok',
    nameTh: 'กรุงเทพมหานคร',
    provinceKey: 'กรุงเทพฯ',
    imageUrl: '/images/destinations/bkk.jpg',
    tagline: 'คาเฟ่ และพื้นที่สีเขียวกลางเมือง',
  },
  {
    id: 'chonburi',
    nameEn: 'Pattaya / Chonburi',
    nameTh: 'พัทยา • ชลบุรี',
    provinceKey: 'ชลบุรี',
    searchTerm: 'พัทยา',
    imageUrl: '/images/destinations/chonburi.jpg',
    tagline: 'ทะเลใกล้กรุง และคาเฟ่ริมหาด',
    isUserFavorite: true,
  },
  {
    id: 'chiangmai',
    nameEn: 'Chiang Mai',
    nameTh: 'เชียงใหม่',
    provinceKey: 'เชียงใหม่',
    imageUrl: '/images/destinations/chiangmai.jpg',
    tagline: 'สโลว์บาร์ ธรรมชาติ และดอยสูง',
  },
  {
    id: 'phuket',
    nameEn: 'Phuket',
    nameTh: 'ภูเก็ต',
    provinceKey: 'ภูเก็ต',
    imageUrl: '/images/destinations/phuket.jpg',
    tagline: 'ไข่มุกอันดามัน ย่านเมืองเก่าชิโนโปรตุกีส',
  },
  {
    id: 'huahin',
    nameEn: 'Hua Hin / Cha-am',
    nameTh: 'หัวหิน • ประจวบฯ',
    provinceKey: 'ประจวบคีรีขันธ์',
    imageUrl: '/images/destinations/huahin.jpg',
    tagline: 'หาดทรายขาว ลมทะเล และอ่างเก็บน้ำเขาเต่า',
    isUserFavorite: true,
  },
  {
    id: 'krabi',
    nameEn: 'Krabi',
    nameTh: 'กระบี่',
    provinceKey: 'กระบี่',
    imageUrl: '/images/destinations/krabi.jpg',
    tagline: 'สระมรกต และหินผาอ่าวไร่เลย์',
    isUserFavorite: true,
  },
  {
    id: 'hatyai',
    nameEn: 'Hat Yai / Songkhla',
    nameTh: 'หาดใหญ่ • สงขลา',
    provinceKey: 'สงขลา',
    imageUrl: '/images/destinations/hatyai.jpg',
    tagline: 'เมืองเก่าถนนนางงาม วิวเขาคอหงส์ และคาเฟ่ธรรมชาติ',
    isUserFavorite: true,
  },
  {
    id: 'kanchanaburi',
    nameEn: 'Kanchanaburi',
    nameTh: 'กาญจนบุรี',
    provinceKey: 'กาญจนบุรี',
    imageUrl: '/images/destinations/kanchanaburi.jpg',
    tagline: 'แม่น้ำแคว ป่าเขียวขจี และน้ำตกเอราวัณ',
  },
  {
    id: 'khaoyai',
    nameEn: 'Khao Yai / Korat',
    nameTh: 'เขาใหญ่ • นครราชสีมา',
    provinceKey: 'นครราชสีมา',
    searchTerm: 'เขาใหญ่',
    imageUrl: '/images/destinations/khaoyai.jpg',
    tagline: 'โอโซนบริสุทธิ์ ฟาร์ม และขุนเขา',
  },
  {
    id: 'nan',
    nameEn: 'Nan',
    nameTh: 'น่าน',
    provinceKey: 'น่าน',
    imageUrl: '/images/destinations/nan.jpg',
    tagline: 'ทุ่งนาปัว และวิถีชีวิตเนิบช้า',
  },
  {
    id: 'samui',
    nameEn: 'Koh Samui / Surat',
    nameTh: 'เกาะสมุย • สุราษฎร์ฯ',
    provinceKey: 'สุราษฎร์ธานี',
    imageUrl: '/images/destinations/samui.jpg',
    tagline: 'ทะเลอ่าวไทย เขื่อนเชี่ยวหลาน และเกาะในฝัน',
  },
  {
    id: 'ayutthaya',
    nameEn: 'Ayutthaya',
    nameTh: 'พระนครศรีอยุธยา',
    provinceKey: 'พระนครศรีอยุธยา',
    imageUrl: '/images/destinations/ayutthaya.jpg',
    tagline: 'เมืองเก่ามรดกโลก คาเฟ่ริมน้ำ และเสน่ห์สยาม',
  },
];
