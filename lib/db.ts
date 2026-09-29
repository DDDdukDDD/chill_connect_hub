import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { MOCK_EVENTS } from '@/data/mockData';
import { AdminEventItem } from './eventsStore';
import { EventDataSource } from './sourcesStore';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'chill_database.json');
export const TMP_DB_FILE = path.join(os.tmpdir(), 'chill_database.json');

// Detect serverless environment (e.g. Vercel, AWS Lambda, Netlify) where /var/task is read-only
export const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.NETLIFY
);

export interface DatabaseSchema {
  version: string;
  lastUpdated: string;
  autoPublish: boolean;
  events: AdminEventItem[];
  sources?: EventDataSource[];
  tickets: Array<{
    ticketId: string;
    eventId: string;
    userId: string;
    userName: string;
    isCheckedIn: boolean;
    checkInTime?: string;
    createdAt: string;
  }>;
  hostWallet: {
    totalRevenue: number;
    totalTips: number;
    claimedBounties: string[];
    transactions: Array<{
      id: string;
      type: 'ticket_sale' | 'tip' | 'bounty' | 'withdraw';
      amount: number;
      title: string;
      date: string;
    }>;
  };
  reviews: Array<{
    id: string;
    eventId: string;
    eventTitle: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    tipAmount: number;
    createdAt: string;
  }>;
}

// Initial seed database
const INITIAL_DATABASE: DatabaseSchema = {
  version: '2.0.0',
  lastUpdated: new Date().toISOString(),
  autoPublish: false,
  events: MOCK_EVENTS.map((ev) => ({
    ...ev,
    approvalStatus: 'approved' as const,
    source: 'Chill & Connect Official',
    sourceUrl: 'https://chill-connect-hub.vercel.app',
  })),
  tickets: [
    {
      ticketId: 'CCH-2026-0001',
      eventId: '1',
      userId: 'user-default',
      userName: 'กวินท์ (Nut)',
      isCheckedIn: false,
      createdAt: new Date().toISOString(),
    },
    {
      ticketId: 'CCH-2026-0002',
      eventId: '3',
      userId: 'user-default',
      userName: 'กวินท์ (Nut)',
      isCheckedIn: false,
      createdAt: new Date().toISOString(),
    },
  ],
  hostWallet: {
    totalRevenue: 4350,
    totalTips: 520,
    claimedBounties: [],
    transactions: [
      {
        id: 'tx-1',
        type: 'ticket_sale',
        amount: 2800,
        title: 'ขายตั๋ว Board Game Night & Specialty Drip Coffee (8 ที่นั่ง)',
        date: '20 ส.ค. 2026',
      },
      {
        id: 'tx-2',
        type: 'ticket_sale',
        amount: 1550,
        title: 'ขายตั๋ว Sunset Yoga & Sound Bath in the Park (10 ที่นั่ง)',
        date: '19 ส.ค. 2026',
      },
      {
        id: 'tx-3',
        type: 'tip',
        amount: 520,
        title: 'เงินทิปสนับสนุนจากผู้เข้าร่วมกิจกรรม',
        date: '20 ส.ค. 2026',
      },
    ],
  },
  reviews: [
    {
      id: 'rev-1',
      eventId: '4',
      eventTitle: 'HYROX Bangkok Fitness Bootcamp 2026',
      userId: 'user-default',
      userName: 'กวินท์ (Nut)',
      rating: 5,
      comment: 'กิจกรรมดีมาก โค้ชสอนเป็นกันเอง ได้เพื่อนใหม่สายวิ่งเยอะมากครับ!',
      tipAmount: 50,
      createdAt: '18 ส.ค. 2026',
    },
  ],
};

// Ensure data directory and database file exist
async function ensureDbExists(): Promise<void> {
  if (IS_SERVERLESS) return;
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    try {
      await fs.access(DB_FILE);
    } catch {
      // Create initial DB file
      await fs.writeFile(DB_FILE, JSON.stringify(INITIAL_DATABASE, null, 2), 'utf-8');
    }
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error?.code !== 'EROFS') {
      console.warn('Notice: Could not initialize local DB directory:', error?.message);
    }
  }
}

// Read entire database from disk (supports Serverless /tmp and bundled read-only)
export async function readDatabase(): Promise<DatabaseSchema> {
  // 1. If in serverless and an updated copy was written to /tmp in this instance, read it
  if (IS_SERVERLESS) {
    try {
      const tmpData = await fs.readFile(TMP_DB_FILE, 'utf-8');
      return JSON.parse(tmpData) as DatabaseSchema;
    } catch {
      // tmp file does not exist yet; fall through to read bundled database
    }
  }

  await ensureDbExists();
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data) as DatabaseSchema;
  } catch (err) {
    console.warn('Reading database file from disk failed, returning fallback seed:', err);
    return INITIAL_DATABASE;
  }
}

// Write entire database to disk (safe against EROFS on Vercel/AWS Lambda)
export async function writeDatabase(db: DatabaseSchema): Promise<void> {
  db.lastUpdated = new Date().toISOString();
  const jsonContent = JSON.stringify(db, null, 2);

  // In serverless environments, /var/task is read-only; use /tmp directly
  if (IS_SERVERLESS) {
    try {
      await fs.writeFile(TMP_DB_FILE, jsonContent, 'utf-8');
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.warn('Notice: Failed writing to /tmp database:', error?.message);
    }
    return;
  }

  // Local development or stateful server:
  await ensureDbExists();
  try {
    await fs.writeFile(DB_FILE, jsonContent, 'utf-8');
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error?.code === 'EROFS') {
      // Fallback to /tmp if environment was not automatically detected as serverless
      try {
        await fs.writeFile(TMP_DB_FILE, jsonContent, 'utf-8');
      } catch {
        // Retained safely in memory
      }
      return;
    }
    console.error('Error writing database to disk:', err);
  }
}

// ── Re-export modern enterprise Data Access Layer (DAO) ──
export * from './db/index';

