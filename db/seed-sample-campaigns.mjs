// SAMPLE: three flight-prize campaigns, to see several campaigns running at once (owner 2026-11-04).
// Usage: node db/seed-sample-campaigns.mjs           adds or updates them in the development database
//        node db/seed-sample-campaigns.mjs --remove  takes them out again
// Writes only to the database in .env.development.local, and refuses when that is the live one.
import { existsSync, readFileSync } from 'node:fs';
import { postgres } from './env.mjs';

const parse = (file) =>
  Object.fromEntries(
    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((line) => /^[A-Z0-9_]+=/.test(line))
      .map((line) => {
        const at = line.indexOf('=');
        return [line.slice(0, at), line.slice(at + 1).trim().replace(/^["']|["']$/g, '')];
      }),
  );
const DEV_FILE = new URL('../.env.development.local', import.meta.url);
const LIVE_FILE = new URL('../.env.local', import.meta.url);
if (!existsSync(DEV_FILE)) throw new Error('.env.development.local is missing');
const devUrl = parse(DEV_FILE).POSTGRES_URL_NON_POOLING;
if (!devUrl) throw new Error('POSTGRES_URL_NON_POOLING is not set in .env.development.local');
const projectRef = (url) => decodeURIComponent(new URL(url).username).split('.')[1];
const liveUrl = existsSync(LIVE_FILE) ? parse(LIVE_FILE).POSTGRES_URL_NON_POOLING : '';
if (liveUrl && projectRef(liveUrl) === projectRef(devUrl)) throw new Error('.env.development.local points at the live database. Nothing was changed.');

const SAMPLES = [
  {
    slug: 'sample-flight-phuket', reward: 'reward-flight-phuket', place: 'ภูเก็ต', cost: 500, image: '/campaign/flight-phuket.png',
    body: 'วิ่งสวนสาธารณะครบ 3 สวน แล้ววางมือถือสักวัน ครบสองชาเลนจ์ก็มี XP พอแลกสิทธิ์ลุ้นตั๋วไปทะเลภูเก็ต',
    strip: 'ครบ 2 ชาเลนจ์ รับสิทธิ์ลุ้นตั๋วไปกลับภูเก็ต',
    steps: ['comm-quest-2', 'comm-quest-5'],
  },
  {
    slug: 'sample-flight-japan', reward: 'reward-flight-japan', place: 'ญี่ปุ่น', cost: 800, image: '/campaign/flight-japan.png',
    body: 'ตะลุยคาเฟ่และแกลเลอรีในกรุงเทพฯ ครบสามชาเลนจ์ก็มี XP พอแลกสิทธิ์ลุ้นตั๋วไปญี่ปุ่น',
    strip: 'ครบ 3 ชาเลนจ์ รับสิทธิ์ลุ้นตั๋วไปกลับญี่ปุ่น',
    steps: ['comm-quest-1', '1', 'comm-quest-6'],
  },
  {
    slug: 'sample-flight-china', reward: 'reward-flight-china', place: 'จีน', cost: 850, image: '/campaign/flight-china.png',
    body: 'ลองบอร์ดเกมใหม่ ไปฮีลใจ แล้วตื่นเช้าไปชมทะเลหมอก ครบสามชาเลนจ์ก็มี XP พอแลกสิทธิ์ลุ้นตั๋วไปจีน',
    strip: 'ครบ 3 ชาเลนจ์ รับสิทธิ์ลุ้นตั๋วไปกลับจีน',
    steps: ['comm-quest-7', 'quest-off-4', 'quest-1792000844813'],
  },
];

const sql = postgres(devUrl, { max: 1, ssl: 'require', prepare: false, onnotice: () => {} });
try {
  if (process.argv.includes('--remove')) {
    await sql`delete from app.campaigns where slug in ${sql(SAMPLES.map((s) => s.slug))}`;
    await sql`delete from app.rewards where slug in ${sql(SAMPLES.map((s) => s.reward))}`;
    console.log('Sample flight campaigns removed from the development database.');
  } else {
    await sql.begin(async (tx) => {
      for (const s of SAMPLES) {
        const [reward] = await tx`
          insert into app.rewards (slug, title, category, category_label, cost_xp, stock_count, discount_value, valid_until, draw_entry)
          values (${s.reward}, ${`สิทธิ์ลุ้นตั๋วเครื่องบินไป${s.place}`}, 'merch', 'ของรางวัลพิเศษ', ${s.cost}, 1, ${`ตั๋วเครื่องบินไปกลับ${s.place} 1 ที่นั่ง`}, '2026-12-31', ${tx.json({ drawLabel: '15 ม.ค. 2570', prizeCount: 1 })})
          on conflict (slug) do update set cost_xp = excluded.cost_xp
          returning id`;
        const fields = {
          name: `[ตัวอย่าง] ลุ้นตั๋วไป${s.place}`, eyebrow: 'แคมเปญตัวอย่าง', headline: `ออกไปใช้ชีวิต ลุ้นตั๋วเครื่องบินไป${s.place}`, body: s.body, strip_text: s.strip, cta: 'ดูรายละเอียด',
          starts_on: '2026-11-01', ends_on: '2026-12-31', prize_image: s.image, reward_id: reward.id, show_on_home: true, published: true,
        };
        const [row] = await tx`insert into app.campaigns ${tx({ slug: s.slug, ...fields })} on conflict (slug) do update set ${tx(fields)} returning id`;
        await tx`delete from app.campaign_quests where campaign_id = ${row.id}`;
        for (const [position, slug] of s.steps.entries()) {
          const added = await tx`
            insert into app.campaign_quests (campaign_id, quest_id, role, sort_order)
            select ${row.id}, q.id, 'step', ${position} from app.quests q where q.slug = ${slug} returning quest_id`;
          if (added.length === 0) throw new Error(`Challenge ${slug} is not in this database`);
        }
      }
    });
    console.log('Sample flight campaigns are in the development database.');
  }
} finally {
  await sql.end();
}
