// English (RTGS) province names → Thai, for sources that publish provinces in English.
const PROVINCES: Array<[string, string]> = [
  ['Bangkok', 'กรุงเทพมหานคร'], ['Amnat Charoen', 'อำนาจเจริญ'], ['Ang Thong', 'อ่างทอง'], ['Bueng Kan', 'บึงกาฬ'],
  ['Buri Ram', 'บุรีรัมย์'], ['Chachoengsao', 'ฉะเชิงเทรา'], ['Chai Nat', 'ชัยนาท'], ['Chaiyaphum', 'ชัยภูมิ'],
  ['Chanthaburi', 'จันทบุรี'], ['Chiang Mai', 'เชียงใหม่'], ['Chiang Rai', 'เชียงราย'], ['Chon Buri', 'ชลบุรี'],
  ['Chumphon', 'ชุมพร'], ['Kalasin', 'กาฬสินธุ์'], ['Kamphaeng Phet', 'กำแพงเพชร'], ['Kanchanaburi', 'กาญจนบุรี'],
  ['Khon Kaen', 'ขอนแก่น'], ['Krabi', 'กระบี่'], ['Lampang', 'ลำปาง'], ['Lamphun', 'ลำพูน'], ['Loei', 'เลย'],
  ['Lop Buri', 'ลพบุรี'], ['Mae Hong Son', 'แม่ฮ่องสอน'], ['Maha Sarakham', 'มหาสารคาม'], ['Mukdahan', 'มุกดาหาร'],
  ['Nakhon Nayok', 'นครนายก'], ['Nakhon Pathom', 'นครปฐม'], ['Nakhon Phanom', 'นครพนม'], ['Nakhon Ratchasima', 'นครราชสีมา'],
  ['Nakhon Sawan', 'นครสวรรค์'], ['Nakhon Si Thammarat', 'นครศรีธรรมราช'], ['Nan', 'น่าน'], ['Narathiwat', 'นราธิวาส'],
  ['Nong Bua Lam Phu', 'หนองบัวลำภู'], ['Nong Khai', 'หนองคาย'], ['Nonthaburi', 'นนทบุรี'], ['Pathum Thani', 'ปทุมธานี'],
  ['Pattani', 'ปัตตานี'], ['Phang Nga', 'พังงา'], ['Phatthalung', 'พัทลุง'], ['Phayao', 'พะเยา'], ['Phetchabun', 'เพชรบูรณ์'],
  ['Phetchaburi', 'เพชรบุรี'], ['Phichit', 'พิจิตร'], ['Phitsanulok', 'พิษณุโลก'], ['Phra Nakhon Si Ayutthaya', 'พระนครศรีอยุธยา'],
  ['Ayutthaya', 'พระนครศรีอยุธยา'], ['Phrae', 'แพร่'], ['Phuket', 'ภูเก็ต'], ['Prachin Buri', 'ปราจีนบุรี'],
  ['Prachuap Khiri Khan', 'ประจวบคีรีขันธ์'], ['Ranong', 'ระนอง'], ['Ratchaburi', 'ราชบุรี'], ['Rayong', 'ระยอง'],
  ['Roi Et', 'ร้อยเอ็ด'], ['Sa Kaeo', 'สระแก้ว'], ['Sakon Nakhon', 'สกลนคร'], ['Samut Prakan', 'สมุทรปราการ'],
  ['Samut Sakhon', 'สมุทรสาคร'], ['Samut Songkhram', 'สมุทรสงคราม'], ['Saraburi', 'สระบุรี'], ['Satun', 'สตูล'],
  ['Si Sa Ket', 'ศรีสะเกษ'], ['Sing Buri', 'สิงห์บุรี'], ['Songkhla', 'สงขลา'], ['Sukhothai', 'สุโขทัย'],
  ['Suphan Buri', 'สุพรรณบุรี'], ['Surat Thani', 'สุราษฎร์ธานี'], ['Surin', 'สุรินทร์'], ['Tak', 'ตาก'], ['Trang', 'ตรัง'],
  ['Trat', 'ตราด'], ['Ubon Ratchathani', 'อุบลราชธานี'], ['Udon Thani', 'อุดรธานี'], ['Uthai Thani', 'อุทัยธานี'],
  ['Uttaradit', 'อุตรดิตถ์'], ['Yala', 'ยะลา'], ['Yasothon', 'ยโสธร'],
];

// Spacing and hyphens vary between sources ("Chon Buri" / "Chonburi", "Phang-nga")
const normalize = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '');
const BY_ENGLISH = new Map(PROVINCES.map(([english, thai]) => [normalize(english), thai]));

export function thaiProvinceName(english: string | undefined): string | undefined {
  return english ? BY_ENGLISH.get(normalize(english)) : undefined;
}

// ISO 3166-2:TH numeric codes (also used by the Tourism Directory), keyed by the app's Thai names (MASTER_77_PROVINCES)
const ISO_CODES: Record<string, string> = {
  'กรุงเทพฯ': '10', 'สมุทรปราการ': '11', 'นนทบุรี': '12', 'ปทุมธานี': '13', 'พระนครศรีอยุธยา': '14', 'อ่างทอง': '15',
  'ลพบุรี': '16', 'สิงห์บุรี': '17', 'ชัยนาท': '18', 'สระบุรี': '19', 'ชลบุรี': '20', 'ระยอง': '21', 'จันทบุรี': '22',
  'ตราด': '23', 'ฉะเชิงเทรา': '24', 'ปราจีนบุรี': '25', 'นครนายก': '26', 'สระแก้ว': '27', 'นครราชสีมา': '30',
  'บุรีรัมย์': '31', 'สุรินทร์': '32', 'ศรีสะเกษ': '33', 'อุบลราชธานี': '34', 'ยโสธร': '35', 'ชัยภูมิ': '36',
  'อำนาจเจริญ': '37', 'บึงกาฬ': '38', 'หนองบัวลำภู': '39', 'ขอนแก่น': '40', 'อุดรธานี': '41', 'เลย': '42',
  'หนองคาย': '43', 'มหาสารคาม': '44', 'ร้อยเอ็ด': '45', 'กาฬสินธุ์': '46', 'สกลนคร': '47', 'นครพนม': '48',
  'มุกดาหาร': '49', 'เชียงใหม่': '50', 'ลำพูน': '51', 'ลำปาง': '52', 'อุตรดิตถ์': '53', 'แพร่': '54', 'น่าน': '55',
  'พะเยา': '56', 'เชียงราย': '57', 'แม่ฮ่องสอน': '58', 'นครสวรรค์': '60', 'อุทัยธานี': '61', 'กำแพงเพชร': '62',
  'ตาก': '63', 'สุโขทัย': '64', 'พิษณุโลก': '65', 'พิจิตร': '66', 'เพชรบูรณ์': '67', 'ราชบุรี': '70',
  'กาญจนบุรี': '71', 'สุพรรณบุรี': '72', 'นครปฐม': '73', 'สมุทรสาคร': '74', 'สมุทรสงคราม': '75', 'เพชรบุรี': '76',
  'ประจวบคีรีขันธ์': '77', 'นครศรีธรรมราช': '80', 'กระบี่': '81', 'พังงา': '82', 'ภูเก็ต': '83', 'สุราษฎร์ธานี': '84',
  'ระนอง': '85', 'ชุมพร': '86', 'สงขลา': '90', 'สตูล': '91', 'ตรัง': '92', 'พัทลุง': '93', 'ปัตตานี': '94',
  'ยะลา': '95', 'นราธิวาส': '96',
};

/** "TH-55" for "น่าน"; undefined for unknown names */
export function provinceIsoCode(thaiName: string): string | undefined {
  const code = ISO_CODES[thaiName];
  return code ? `TH-${code}` : undefined;
}
