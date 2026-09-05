-- =============================================================================
-- 🌱 Initial Seed Data for PostgreSQL / Supabase
-- =============================================================================

-- Seed Users
INSERT INTO users (id, email, full_name, role, city, total_xp, user_level, is_verified)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@chillconnect.hub', 'ผู้ดูแลระบบ Chill & Connect', 'admin', 'กรุงเทพฯ', 2500, 6, true),
    ('00000000-0000-0000-0000-000000000002', 'host.coachkarn@chillconnect.hub', 'โค้ชกานต์ (City Runners)', 'host', 'กรุงเทพฯ', 1200, 3, true),
    ('00000000-0000-0000-0000-000000000003', 'member.kawin@gmail.com', 'กวินท์ (Nut)', 'member', 'กรุงเทพฯ', 450, 1, true)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Community Meetup
INSERT INTO events (
    id, title, event_type, category, tag, province, location_name, meeting_point,
    start_date, start_time, end_time, date_display_text, time_display_text, price_text,
    image_url, description, host_id, host_name, host_avatar, status, participants_count, max_participants, created_at_timestamp
) VALUES (
    'comm-seed-1',
    'City Sunset Run & Recovery Stretch (วิ่งรับลมยามเย็น สวนเบญจกิติ)',
    'community',
    'move',
    'วิ่งเพื่อสุขภาพ',
    'กรุงเทพฯ',
    'ลานหน้าอาคารกระจก สวนเบญจกิติ',
    'หน้าทางเข้าบันไดกระจก หันหน้าออกทะเลสาบ',
    '2026-08-23',
    '17:30:00',
    '19:30:00',
    'เสาร์ 23 ส.ค. 2026',
    '17:30 - 19:30 น.',
    'ฟรี!',
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80',
    'วิ่งรับลมสบายๆ ระยะทาง 5 กม. เพซ 6.30 - 7.00 พร้อมคูลดาวน์และยืดเหยียดกล้ามเนื้อ เหมาะสำหรับทั้งมือใหม่และนักวิ่งเพื่อสุขภาพ',
    '00000000-0000-0000-0000-000000000002',
    'โค้ชกานต์ (City Runners)',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    'recruiting',
    4,
    10,
    1787350000000
) ON CONFLICT (id) DO NOTHING;

-- Seed Sample Major Fair / Expo
INSERT INTO events (
    id, title, event_type, category, tag, venue_tag, province, location_name,
    start_date, end_date, date_display_text, price_text, image_url, description,
    host_name, status, participants_count, max_participants, created_at_timestamp
) VALUES (
    'fair-seed-1',
    'ไทยเที่ยวไทย ครั้งที่ 71 @ ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)',
    'public_venue',
    'chill',
    'มหกรรมท่องเที่ยว',
    'qsncc',
    'กรุงเทพฯ',
    'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC Exhibition Hall 5-6)',
    '2026-08-22',
    '2026-08-25',
    '22 - 25 ส.ค. 2026',
    'เข้าชมฟรี!',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    'มหกรรมท่องเที่ยวไทยที่ยิ่งใหญ่ที่สุดแห่งปี ดีลโรงแรม ที่พัก แพ็กเกจท่องเที่ยวลดสูงสุด 70%',
    'ศูนย์การประชุมแห่งชาติสิริกิติ์ (QSNCC)',
    'recruiting',
    840,
    5000,
    1787400000000
) ON CONFLICT (id) DO NOTHING;

-- Seed Sample Challenge Quests
INSERT INTO challenge_quests (
    id, title, description, category, category_label, icon_name, difficulty,
    target_total, target_unit, reward_xp, reward_badge, is_popular
) VALUES 
    ('quest-1', 'นักสำรวจสวนสาธารณะ (Park Explorer)', 'เช็คอินสวนสาธารณะหรือพื้นที่สีเขียวในเมืองให้ครบ 3 แห่ง', 'nature', '🌲 ธรรมชาติ & เอาต์ดอร์', 'Trees', 'easy', 3, 'แห่ง', 150, 'Green Walker', true),
    ('quest-2', 'คอกาแฟตัวจริง (Coffee Hopper)', 'เช็คอินคาเฟ่หรือร้านกาแฟ Specialty ในเครือข่าย 5 ร้าน', 'cafe', '☕ คาเฟ่ & สโลว์ไลฟ์', 'Coffee', 'medium', 5, 'ร้าน', 250, 'Caffeine Master', true),
    ('quest-3', 'สายวิ่งเพื่อสุขภาพ (5K Finisher)', 'เข้าร่วมกิจกรรมวิ่งคอมมูนิตี้ครบ 2 ครั้ง', 'run', '🏃 วิ่ง & ฟิตเนส', 'Flame', 'hard', 2, 'ครั้ง', 300, 'Road Runner', false)
ON CONFLICT (id) DO NOTHING;
