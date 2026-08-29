const fs = require('fs');
const path = require('path');

console.log('Generating all 460 authentic spots across all 77 Thai provinces...');

// Photo library with distinct high-res photography matching place themes
const PHOTOS = {
  temple_gold: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80',
  temple_white: 'https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?auto=format&fit=crop&w=1200&q=80',
  temple_ancient: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1200&q=80',
  mountain_fog: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
  mountain_green: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  mountain_sunset: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
  beach_tropical: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  beach_cliff: 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=1200&q=80',
  beach_sunset: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  island_lagoon: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=1200&q=80',
  waterfall_jungle: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80',
  waterfall_blue: 'https://images.unsplash.com/photo-1546587348-d12660c30c50?auto=format&fit=crop&w=1200&q=80',
  lake_dam: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
  park_urban: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80',
  park_trees: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
  oldtown_heritage: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80',
  art_museum: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80',
  cafe_lifestyle: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
  night_market: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
  cave_nature: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80'
};

// Province coordinates and base landmark profiles
const PROVINCE_CONFIG = {
  // 15 Hubs (10 spots)
  'กรุงเทพฯ': { lat: 13.7563, lng: 100.5018, isMajor: true, region: 'central' },
  'เชียงใหม่': { lat: 18.7883, lng: 98.9853, isMajor: true, region: 'north' },
  'ภูเก็ต': { lat: 7.8804, lng: 98.3923, isMajor: true, region: 'south' },
  'ชลบุรี': { lat: 13.3611, lng: 100.9847, isMajor: true, region: 'east_west' },
  'ประจวบคีรีขันธ์': { lat: 11.8124, lng: 99.7972, isMajor: true, region: 'east_west' },
  'กาญจนบุรี': { lat: 14.0228, lng: 99.5328, isMajor: true, region: 'east_west' },
  'กระบี่': { lat: 8.0863, lng: 98.9063, isMajor: true, region: 'south' },
  'สุราษฎร์ธานี': { lat: 9.1388, lng: 99.3215, isMajor: true, region: 'south' },
  'เชียงราย': { lat: 19.9105, lng: 99.8406, isMajor: true, region: 'north' },
  'พระนครศรีอยุธยา': { lat: 14.3532, lng: 100.5684, isMajor: true, region: 'central' },
  'ขอนแก่น': { lat: 16.4322, lng: 102.8236, isMajor: true, region: 'northeast' },
  'นครราชสีมา': { lat: 14.9799, lng: 102.0978, isMajor: true, region: 'northeast' },
  'น่าน': { lat: 18.7756, lng: 100.7730, isMajor: true, region: 'north' },
  'พังงา': { lat: 8.4501, lng: 98.5255, isMajor: true, region: 'south' },
  'สงขลา': { lat: 7.1898, lng: 100.5954, isMajor: true, region: 'south' },

  // Remaining 62 Provinces (5 spots each)
  // North (6)
  'ลำปาง': { lat: 18.2888, lng: 99.4928, isMajor: false, region: 'north' },
  'ลำพูน': { lat: 18.5745, lng: 99.0087, isMajor: false, region: 'north' },
  'แม่ฮ่องสอน': { lat: 19.3020, lng: 97.9654, isMajor: false, region: 'north' },
  'แพร่': { lat: 18.1446, lng: 100.1410, isMajor: false, region: 'north' },
  'พะเยา': { lat: 19.1664, lng: 99.9022, isMajor: false, region: 'north' },
  'อุตรดิตถ์': { lat: 17.6201, lng: 100.0993, isMajor: false, region: 'north' },

  // South (9)
  'นครศรีธรรมราช': { lat: 8.4304, lng: 99.9631, isMajor: false, region: 'south' },
  'ตรัง': { lat: 7.5563, lng: 99.6114, isMajor: false, region: 'south' },
  'ชุมพร': { lat: 10.4930, lng: 99.1800, isMajor: false, region: 'south' },
  'ระนอง': { lat: 9.9658, lng: 98.6348, isMajor: false, region: 'south' },
  'พัทลุง': { lat: 7.6167, lng: 100.0833, isMajor: false, region: 'south' },
  'สตูล': { lat: 6.6238, lng: 100.0674, isMajor: false, region: 'south' },
  'ปัตตานี': { lat: 6.8696, lng: 101.2501, isMajor: false, region: 'south' },
  'ยะลา': { lat: 6.5411, lng: 101.2804, isMajor: false, region: 'south' },
  'นราธิวาส': { lat: 6.4255, lng: 101.8253, isMajor: false, region: 'south' },

  // Northeast (18)
  'อุบลราชธานี': { lat: 15.2448, lng: 104.8473, isMajor: false, region: 'northeast' },
  'อุดรธานี': { lat: 17.4157, lng: 102.7859, isMajor: false, region: 'northeast' },
  'บุรีรัมย์': { lat: 14.9930, lng: 103.1029, isMajor: false, region: 'northeast' },
  'สุรินทร์': { lat: 14.8829, lng: 103.4936, isMajor: false, region: 'northeast' },
  'ศรีสะเกษ': { lat: 15.1186, lng: 104.3220, isMajor: false, region: 'northeast' },
  'ร้อยเอ็ด': { lat: 16.0538, lng: 103.6520, isMajor: false, region: 'northeast' },
  'มหาสารคาม': { lat: 16.1851, lng: 103.3007, isMajor: false, region: 'northeast' },
  'กาฬสินธุ์': { lat: 16.4328, lng: 103.5063, isMajor: false, region: 'northeast' },
  'สกลนคร': { lat: 17.1546, lng: 104.1486, isMajor: false, region: 'northeast' },
  'นครพนม': { lat: 17.3999, lng: 104.7836, isMajor: false, region: 'northeast' },
  'มุกดาหาร': { lat: 16.5436, lng: 104.7235, isMajor: false, region: 'northeast' },
  'เลย': { lat: 17.4860, lng: 101.7223, isMajor: false, region: 'northeast' },
  'หนองคาย': { lat: 17.8783, lng: 102.7420, isMajor: false, region: 'northeast' },
  'บึงกาฬ': { lat: 18.3609, lng: 103.6464, isMajor: false, region: 'northeast' },
  'หนองบัวลำภู': { lat: 17.2044, lng: 102.4414, isMajor: false, region: 'northeast' },
  'ชัยภูมิ': { lat: 15.8105, lng: 102.0315, isMajor: false, region: 'northeast' },
  'ยโสธร': { lat: 15.7926, lng: 104.1451, isMajor: false, region: 'northeast' },
  'อำนาจเจริญ': { lat: 15.8585, lng: 104.6258, isMajor: false, region: 'northeast' },

  // East & West (9)
  'ระยอง': { lat: 12.6814, lng: 101.2816, isMajor: false, region: 'east_west' },
  'จันทบุรี': { lat: 12.6114, lng: 102.1039, isMajor: false, region: 'east_west' },
  'ตราด': { lat: 12.2428, lng: 102.5175, isMajor: false, region: 'east_west' },
  'ฉะเชิงเทรา': { lat: 13.6904, lng: 101.0779, isMajor: false, region: 'east_west' },
  'ปราจีนบุรี': { lat: 14.0510, lng: 101.3734, isMajor: false, region: 'east_west' },
  'สระแก้ว': { lat: 13.8140, lng: 102.0718, isMajor: false, region: 'east_west' },
  'เพชรบุรี': { lat: 13.1110, lng: 99.9398, isMajor: false, region: 'east_west' },
  'ราชบุรี': { lat: 13.5358, lng: 99.8164, isMajor: false, region: 'east_west' },
  'ตาก': { lat: 16.8839, lng: 99.1258, isMajor: false, region: 'east_west' },

  // Central (20)
  'นนทบุรี': { lat: 13.8621, lng: 100.5144, isMajor: false, region: 'central' },
  'ปทุมธานี': { lat: 14.0208, lng: 100.5250, isMajor: false, region: 'central' },
  'สมุทรปราการ': { lat: 13.5991, lng: 100.5998, isMajor: false, region: 'central' },
  'สมุทรสาคร': { lat: 13.5475, lng: 100.2744, isMajor: false, region: 'central' },
  'สมุทรสงคราม': { lat: 13.4098, lng: 99.9968, isMajor: false, region: 'central' },
  'นครปฐม': { lat: 13.8196, lng: 100.0601, isMajor: false, region: 'central' },
  'สุพรรณบุรี': { lat: 14.4745, lng: 100.1177, isMajor: false, region: 'central' },
  'อ่างทอง': { lat: 14.5896, lng: 100.4550, isMajor: false, region: 'central' },
  'สิงห์บุรี': { lat: 14.8911, lng: 100.4014, isMajor: false, region: 'central' },
  'ชัยนาท': { lat: 15.1852, lng: 100.1252, isMajor: false, region: 'central' },
  'ลพบุรี': { lat: 14.7995, lng: 100.6534, isMajor: false, region: 'central' },
  'สระบุรี': { lat: 14.5289, lng: 100.9108, isMajor: false, region: 'central' },
  'นครนายก': { lat: 14.2069, lng: 101.2131, isMajor: false, region: 'central' },
  'เพชรบูรณ์': { lat: 16.4190, lng: 101.1566, isMajor: false, region: 'central' },
  'พิจิตร': { lat: 16.4429, lng: 100.3490, isMajor: false, region: 'central' },
  'พิษณุโลก': { lat: 16.8211, lng: 100.2659, isMajor: false, region: 'central' },
  'สุโขทัย': { lat: 17.0078, lng: 99.8235, isMajor: false, region: 'central' },
  'กำแพงเพชร': { lat: 16.4828, lng: 99.5227, isMajor: false, region: 'central' },
  'นครสวรรค์': { lat: 15.7057, lng: 100.1380, isMajor: false, region: 'central' },
  'อุทัยธานี': { lat: 15.3835, lng: 100.0246, isMajor: false, region: 'central' }
};

console.log('Config loaded for 77 provinces:', Object.keys(PROVINCE_CONFIG).length);
