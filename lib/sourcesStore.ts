import { readDatabase, updateDatabase } from './db/databaseFile';

export type SourceTargetType = 'events' | 'spots';
export type SourceRunStatus = 'success' | 'partial' | 'failed';

export interface EventDataSource {
  id: string;
  name: string;
  url: string;
  targetType: SourceTargetType;
  category: 'sports' | 'music' | 'exhibition' | 'running' | 'finance' | 'lifestyle' | 'all';
  categoryLabel: string;
  icon: string;
  status: 'active' | 'inactive';
  eventsCount: number;
  spotsCount?: number;
  lastScraped?: string;
  lastRunAt?: string;
  lastRunStatus?: SourceRunStatus;
  lastRunScanned?: number;
  lastRunImported?: number;
  lastRunDuplicates?: number;
  lastRunErrors?: string[];
  isCustom?: boolean;
  description?: string;
}

export const DEFAULT_DATA_SOURCES: EventDataSource[] = [
  {
    id: 'thaiticketmajor',
    name: 'ThaiTicketMajor Sports & Stadiums',
    url: 'https://www.thaiticketmajor.com/sport/',
    targetType: 'events',
    category: 'sports',
    categoryLabel: '⚽ กีฬา & บอลไทยราชมังฯ',
    icon: '⚽',
    status: 'active',
    eventsCount: 0,
    description: 'ดึงแมตช์ฟุตบอลทีมชาติไทย, ฟุตบอลไทยลีก, และอีเวนต์กีฬาใหญ่ระดับประเทศ',
  },
  {
    id: 'eventpop',
    name: 'Eventpop Thailand',
    url: 'https://www.eventpop.me',
    targetType: 'events',
    category: 'lifestyle',
    categoryLabel: '🎟️ เวิร์กช็อป & ไลฟ์สไตล์',
    icon: '🎟️',
    status: 'active',
    eventsCount: 0,
    description: 'ฮับเวิร์กช็อปศิลปะ คลาสทำอาหาร สัมมนา และปาร์ตี้คอมมูนิตี้กรุงเทพฯ',
  },
  {
    id: 'ticketmelon',
    name: 'Ticketmelon Hub',
    url: 'https://www.ticketmelon.com',
    targetType: 'events',
    category: 'music',
    categoryLabel: '🎫 มิวสิคเฟส & งานสร้างสรรค์',
    icon: '🎫',
    status: 'active',
    eventsCount: 0,
    description: 'เทศกาลดนตรีอินดี้ระดับสากล นิทรรศการศิลปะ และงานดีเจสุดล้ำ',
  },
  {
    id: 'theconcert',
    name: 'The Concert Application',
    url: 'https://www.theconcert.com',
    targetType: 'events',
    category: 'music',
    categoryLabel: '🎵 คอนเสิร์ต & การแสดงสด',
    icon: '🎵',
    status: 'active',
    eventsCount: 0,
    description: 'คอนเสิร์ตศิลปิน T-POP / K-POP และ Live House ทั่วกรุงเทพฯ',
  },
  {
    id: 'qsncc',
    name: 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)',
    url: 'https://www.qsncc.com/en/whats-on/event-calendar',
    targetType: 'events',
    category: 'exhibition',
    categoryLabel: '🏛️ มหกรรมเอ็กซ์โป & สัปดาห์หนังสือ',
    icon: '🏛️',
    status: 'active',
    eventsCount: 0,
    description: 'งานแสดงสินค้าขนาดใหญ่ สัปดาห์หนังสือแห่งชาติ Sustainability Expo, Thailand Coffee Fest, Pet Expo และ Tech Summit',
  },
  {
    id: 'bitec',
    name: 'ไบเทค บางนา (BITEC)',
    url: 'https://www.bitec.co.th/whats-on',
    targetType: 'events',
    category: 'exhibition',
    categoryLabel: '🏢 งานแสดงสินค้า & เทรดแฟร์',
    icon: '🏢',
    status: 'active',
    eventsCount: 0,
    description: 'งานแสดงสินค้านานาชาติ มอเตอร์โชว์ Cat Expo และมหกรรมเกมคอมมูนิตี้',
  },
  {
    id: 'impact',
    name: 'อิมแพ็ค เมืองทองธานี (IMPACT)',
    url: 'https://www.impact.co.th/th/visitors/event-calendar',
    targetType: 'events',
    category: 'exhibition',
    categoryLabel: '🎪 คอนเวนชัน & งานแฟร์ใหญ่',
    icon: '🎪',
    status: 'active',
    eventsCount: 0,
    description: 'งานแฟร์ของแต่งบ้าน มอเตอร์โชว์ มหกรรมอาหารระดับโลก คอนเสิร์ตใหญ่ และเทศกาลอาร์ตทอย',
  },
  {
    id: 'thairun',
    name: 'ThaiRun (ฮับคนรักการวิ่ง)',
    url: 'https://race.thai.run/',
    targetType: 'events',
    category: 'running',
    categoryLabel: '🏃 งานวิ่ง & มาราธอนทั่วกรุง',
    icon: '🏃',
    status: 'active',
    eventsCount: 0,
    description: 'ปฏิทินงานวิ่งมาราธอน ซิตี้รัน มินิมาราธอน และวิ่งเทรลทั่วประเทศ (เฉพาะงานที่เปิดรับสมัคร ไม่รวมวิ่งเสมือน)',
  },
  {
    id: 'set',
    name: 'ตลาดหลักทรัพย์แห่งประเทศไทย (SET)',
    url: 'https://www.set.or.th',
    targetType: 'events',
    category: 'finance',
    categoryLabel: '📈 สัมมนาการเงิน & การลงทุน',
    icon: '📈',
    status: 'active',
    eventsCount: 0,
    description: 'งานสัมมนาวางแผนการเงิน เวิร์กช็อปหุ้น กองทุน และพัฒนาทักษะธุรกิจ',
  },
  {
    id: 'visit-bangkok-festivals',
    name: 'Visit Bangkok ปฏิทินเทศกาล (กทม.)',
    url: 'https://visit.bangkok.go.th/th/festival-calendar',
    targetType: 'events',
    category: 'lifestyle',
    categoryLabel: '🎉 เทศกาล & อีเวนต์ กทม.',
    icon: '🎉',
    status: 'active',
    eventsCount: 0,
    description: 'ปฏิทินเทศกาล นิทรรศการ และอีเวนต์ทางวัฒนธรรมของกรุงเทพมหานคร (อ่านจาก RSS ทางการ 20 รายการล่าสุด)',
  },
  {
    id: 'bma',
    name: 'กรุงเทพมหานคร (BMA Events)',
    url: 'https://pr-bangkok.com',
    targetType: 'events',
    category: 'lifestyle',
    categoryLabel: '🌿 ดนตรีในสวน & เทศกาล กทม.',
    icon: '🌿',
    status: 'active',
    eventsCount: 0,
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
      const normalized = {
        ...storedSrc,
        targetType: storedSrc.targetType || def?.targetType || 'events',
        eventsCount: storedSrc.lastRunAt ? storedSrc.eventsCount : 0,
        spotsCount: storedSrc.lastRunAt ? storedSrc.spotsCount || 0 : 0,
        lastScraped: storedSrc.lastRunAt ? storedSrc.lastScraped : undefined,
      };
      if (def) {
        if (storedSrc.url !== def.url || storedSrc.category !== def.category || storedSrc.categoryLabel !== def.categoryLabel) {
          hasChanges = true;
          return {
            ...normalized,
            url: def.url,
            category: def.category,
            categoryLabel: def.categoryLabel,
            name: def.name,
            description: def.description,
          };
        }
      }
      if (normalized.targetType !== storedSrc.targetType || normalized.eventsCount !== storedSrc.eventsCount || normalized.spotsCount !== storedSrc.spotsCount) {
        hasChanges = true;
      }
      return normalized;
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
    await updateDatabase((data) => {
      data.sources = merged;
    });
  }

  return SOURCES_CACHE;
}

/**
 * Applies a change to the latest stored source list inside the serialized file update,
 * so concurrent writers (e.g. parallel scrape results) never drop each other's changes.
 */
async function mutateSources(change: (sources: EventDataSource[]) => EventDataSource[]): Promise<EventDataSource[]> {
  await getAllDataSources(); // make sure defaults are merged and stored first
  const saved = await updateDatabase((data) => {
    data.sources = change(data.sources && data.sources.length > 0 ? data.sources : DEFAULT_DATA_SOURCES);
  });
  SOURCES_CACHE = saved.sources || [];
  return SOURCES_CACHE;
}

export async function addCustomDataSource(source: Omit<EventDataSource, 'id' | 'eventsCount' | 'lastScraped' | 'isCustom'>): Promise<EventDataSource[]> {
  const newSource: EventDataSource = {
    ...source,
    id: `custom-src-${Date.now()}`,
    eventsCount: 0,
    spotsCount: 0,
    isCustom: true,
  };
  return mutateSources((sources) => [newSource, ...sources]);
}

export async function toggleDataSourceStatus(id: string, status: 'active' | 'inactive'): Promise<EventDataSource[]> {
  return mutateSources((sources) => sources.map((s) => (s.id === id ? { ...s, status } : s)));
}

export async function deleteCustomDataSource(id: string): Promise<EventDataSource[]> {
  return mutateSources((sources) => sources.filter((s) => s.id !== id));
}

export async function updateSourceScrapedTime(sourceNameOrId: string, countAdded: number): Promise<void> {
  const nowStr = `วันนี้ ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;

  await mutateSources((sources) => sources.map((s) => {
    if (s.id === sourceNameOrId || s.name.toLowerCase().includes(sourceNameOrId.toLowerCase())) {
      return {
        ...s,
        eventsCount: s.eventsCount + countAdded,
        lastScraped: nowStr,
        lastRunAt: new Date().toISOString(),
        lastRunStatus: 'success' as const,
        lastRunScanned: countAdded,
        lastRunImported: countAdded,
        lastRunDuplicates: 0,
        lastRunErrors: [],
      };
    }
    return s;
  }));
}

export async function recordSourceScrape(
  sourceId: string,
  result: {
    targetType: SourceTargetType;
    scannedCount: number;
    importedCount: number;
    duplicateCount: number;
    errors: string[];
  }
): Promise<void> {
  const now = new Date();
  await mutateSources((sources) => sources.map((source) => {
    if (source.id !== sourceId) return source;
    const runStatus: SourceRunStatus = result.errors.length === 0
      ? 'success'
      : result.importedCount > 0 ? 'partial' : 'failed';
    return {
      ...source,
      eventsCount: result.targetType === 'events' ? source.eventsCount + result.importedCount : source.eventsCount,
      spotsCount: result.targetType === 'spots' ? (source.spotsCount || 0) + result.importedCount : source.spotsCount || 0,
      lastScraped: now.toLocaleString('th-TH'),
      lastRunAt: now.toISOString(),
      lastRunStatus: runStatus,
      lastRunScanned: result.scannedCount,
      lastRunImported: result.importedCount,
      lastRunDuplicates: result.duplicateCount,
      lastRunErrors: result.errors,
    };
  }));
}
