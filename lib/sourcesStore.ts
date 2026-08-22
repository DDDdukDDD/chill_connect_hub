import { readDatabase, writeDatabase } from './db';

export interface EventDataSource {
  id: string;
  name: string;
  url: string;
  category: 'sports' | 'music' | 'exhibition' | 'running' | 'finance' | 'lifestyle' | 'all';
  categoryLabel: string;
  icon: string;
  status: 'active' | 'inactive';
  eventsCount: number;
  lastScraped?: string;
  isCustom?: boolean;
  description?: string;
}

export const DEFAULT_DATA_SOURCES: EventDataSource[] = [
  {
    id: 'thaiticketmajor',
    name: 'ThaiTicketMajor Sports & Stadiums',
    url: 'https://www.thaiticketmajor.com/sport/',
    category: 'sports',
    categoryLabel: '⚽ กีฬา & บอลไทยราชมังฯ',
    icon: '⚽',
    status: 'active',
    eventsCount: 4,
    lastScraped: 'วันนี้ 09:30 น.',
    description: 'ดึงแมตช์ฟุตบอลทีมชาติไทย, ฟุตบอลไทยลีก, และอีเวนต์กีฬาใหญ่ระดับประเทศ',
  },
  {
    id: 'eventpop',
    name: 'Eventpop Thailand',
    url: 'https://www.eventpop.me',
    category: 'lifestyle',
    categoryLabel: '🎟️ เวิร์กช็อป & ไลฟ์สไตล์',
    icon: '🎟️',
    status: 'active',
    eventsCount: 18,
    lastScraped: 'วันนี้ 09:15 น.',
    description: 'ฮับเวิร์กช็อปศิลปะ คลาสทำอาหาร สัมมนา และปาร์ตี้คอมมูนิตี้กรุงเทพฯ',
  },
  {
    id: 'ticketmelon',
    name: 'Ticketmelon Hub',
    url: 'https://www.ticketmelon.com',
    category: 'music',
    categoryLabel: '🎫 มิวสิคเฟส & งานสร้างสรรค์',
    icon: '🎫',
    status: 'active',
    eventsCount: 8,
    lastScraped: 'เมื่อวาน 22:00 น.',
    description: 'เทศกาลดนตรีอินดี้ระดับสากล นิทรรศการศิลปะ และงานดีเจสุดล้ำ',
  },
  {
    id: 'theconcert',
    name: 'The Concert Application',
    url: 'https://www.theconcert.com',
    category: 'music',
    categoryLabel: '🎵 คอนเสิร์ต & การแสดงสด',
    icon: '🎵',
    status: 'active',
    eventsCount: 7,
    lastScraped: 'เมื่อวาน 20:45 น.',
    description: 'คอนเสิร์ตศิลปิน T-POP / K-POP และ Live House ทั่วกรุงเทพฯ',
  },
  {
    id: 'qsncc',
    name: 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)',
    url: 'https://www.qsncc.com/en/whats-on/event-calendar',
    category: 'exhibition',
    categoryLabel: '🏛️ มหกรรมเอ็กซ์โป & สัปดาห์หนังสือ',
    icon: '🏛️',
    status: 'active',
    eventsCount: 20,
    lastScraped: 'วันนี้ 11:30 น.',
    description: 'งานแสดงสินค้าขนาดใหญ่ สัปดาห์หนังสือแห่งชาติ Sustainability Expo, Thailand Coffee Fest, Pet Expo และ Tech Summit',
  },
  {
    id: 'bitec',
    name: 'ไบเทค บางนา (BITEC)',
    url: 'https://www.bitec.co.th/events/',
    category: 'exhibition',
    categoryLabel: '🏢 งานแสดงสินค้า & เทรดแฟร์',
    icon: '🏢',
    status: 'active',
    eventsCount: 5,
    lastScraped: '2 วันที่แล้ว',
    description: 'งานแสดงสินค้านานาชาติ มอเตอร์โชว์ Cat Expo และมหกรรมเกมคอมมูนิตี้',
  },
  {
    id: 'impact',
    name: 'อิมแพ็ค เมืองทองธานี (IMPACT)',
    url: 'https://www.impact.co.th/index.php/visitor/event/th',
    category: 'exhibition',
    categoryLabel: '🎪 คอนเวนชัน & งานแฟร์ใหญ่',
    icon: '🎪',
    status: 'active',
    eventsCount: 30,
    lastScraped: 'วันนี้ 09:45 น.',
    description: 'งานแฟร์ของแต่งบ้าน มอเตอร์โชว์ มหกรรมอาหารระดับโลก คอนเสิร์ตใหญ่ และเทศกาลอาร์ตทอย',
  },
  {
    id: 'thairun',
    name: 'ThaiRun (ฮับคนรักการวิ่ง)',
    url: 'https://race.thai.run',
    category: 'running',
    categoryLabel: '🏃 งานวิ่ง & มาราธอนทั่วกรุง',
    icon: '🏃',
    status: 'active',
    eventsCount: 8,
    lastScraped: 'วันนี้ 07:00 น.',
    description: 'ปฏิทินงานวิ่งมาราธอน ซิตี้รัน มินิมาราธอน และวิ่งเทรลในกรุงเทพฯ',
  },
  {
    id: 'set',
    name: 'ตลาดหลักทรัพย์แห่งประเทศไทย (SET)',
    url: 'https://www.set.or.th',
    category: 'finance',
    categoryLabel: '📈 สัมมนาการเงิน & การลงทุน',
    icon: '📈',
    status: 'active',
    eventsCount: 4,
    lastScraped: '3 วันที่แล้ว',
    description: 'งานสัมมนาวางแผนการเงิน เวิร์กช็อปหุ้น กองทุน และพัฒนาทักษะธุรกิจ',
  },
  {
    id: 'bma',
    name: 'กรุงเทพมหานคร (BMA Events)',
    url: 'https://pr-bangkok.com',
    category: 'lifestyle',
    categoryLabel: '🌿 ดนตรีในสวน & เทศกาล กทม.',
    icon: '🌿',
    status: 'active',
    eventsCount: 4,
    lastScraped: 'วันนี้ 06:30 น.',
    description: 'กิจกรรมดนตรีในสวนสาธารณะ เทศกาลภาพยนตร์กรุงเทพฯ และตลาดนัดชุมชน',
  },
];

// In-memory cache for sources
let SOURCES_CACHE: EventDataSource[] | null = null;

export async function getAllDataSources(): Promise<EventDataSource[]> {
  const db = await readDatabase();
  let hasChanges = false;

  let merged: EventDataSource[] = [];
  if (db.sources && db.sources.length > 0) {
    merged = db.sources.map((storedSrc) => {
      const def = DEFAULT_DATA_SOURCES.find((d) => d.id === storedSrc.id);
      if (def) {
        if (storedSrc.url !== def.url || storedSrc.category !== def.category || storedSrc.categoryLabel !== def.categoryLabel) {
          hasChanges = true;
          return {
            ...storedSrc,
            url: def.url,
            category: def.category,
            categoryLabel: def.categoryLabel,
            name: def.name,
            description: def.description,
          };
        }
      }
      return storedSrc;
    });

    for (const def of DEFAULT_DATA_SOURCES) {
      if (!merged.some((s) => s.id === def.id)) {
        merged.push(def);
        hasChanges = true;
      }
    }
  } else {
    merged = DEFAULT_DATA_SOURCES;
    hasChanges = true;
  }

  SOURCES_CACHE = merged;
  if (hasChanges) {
    db.sources = merged;
    await writeDatabase(db);
  }

  return SOURCES_CACHE;
}

export async function addCustomDataSource(source: Omit<EventDataSource, 'id' | 'eventsCount' | 'lastScraped' | 'isCustom'>): Promise<EventDataSource[]> {
  const currentSources = await getAllDataSources();
  const newSource: EventDataSource = {
    ...source,
    id: `custom-src-${Date.now()}`,
    eventsCount: 0,
    lastScraped: 'ยังไม่เคยดึงข้อมูล',
    isCustom: true,
  };

  const updated = [newSource, ...currentSources];
  SOURCES_CACHE = updated;

  const db = await readDatabase();
  db.sources = updated;
  await writeDatabase(db);

  return updated;
}

export async function toggleDataSourceStatus(id: string, status: 'active' | 'inactive'): Promise<EventDataSource[]> {
  const currentSources = await getAllDataSources();
  const updated = currentSources.map((s) => (s.id === id ? { ...s, status } : s));
  SOURCES_CACHE = updated;

  const db = await readDatabase();
  db.sources = updated;
  await writeDatabase(db);

  return updated;
}

export async function deleteCustomDataSource(id: string): Promise<EventDataSource[]> {
  const currentSources = await getAllDataSources();
  const updated = currentSources.filter((s) => s.id !== id);
  SOURCES_CACHE = updated;

  const db = await readDatabase();
  db.sources = updated;
  await writeDatabase(db);

  return updated;
}

export async function updateSourceScrapedTime(sourceNameOrId: string, countAdded: number): Promise<void> {
  const currentSources = await getAllDataSources();
  const nowStr = `วันนี้ ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;

  const updated = currentSources.map((s) => {
    if (s.id === sourceNameOrId || s.name.toLowerCase().includes(sourceNameOrId.toLowerCase())) {
      return {
        ...s,
        eventsCount: s.eventsCount + countAdded,
        lastScraped: nowStr,
      };
    }
    return s;
  });

  SOURCES_CACHE = updated;
  const db = await readDatabase();
  db.sources = updated;
  await writeDatabase(db);
}
