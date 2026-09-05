-- =============================================================================
-- 🌿 Chill & Connect Hub: Enterprise Production Database Schema (PostgreSQL)
-- Designed for High Scalability, Zero Concurrency Race Conditions, and 77 Provinces
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Fast full-text & fuzzy Thai search

-- -----------------------------------------------------------------------------
-- 1. USERS & ROLES
-- -----------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('member', 'host', 'organizer', 'admin');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'member',
    bio TEXT,
    city VARCHAR(100) DEFAULT 'กรุงเทพฯ',
    total_xp INT NOT NULL DEFAULT 0,
    user_level INT NOT NULL DEFAULT 1,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_total_xp ON users(total_xp DESC);

-- -----------------------------------------------------------------------------
-- 2. 🌲 LIFESTYLE SPOTS (พิกัดเที่ยว & จุดฮีลใจ 77 จังหวัด)
-- Includes PostGIS Spatial Index for "Near Me" (< 10km) instant radius queries
-- -----------------------------------------------------------------------------
CREATE TYPE spot_category AS ENUM (
    'park', 'cafe', 'art', 'oldtown', 'workspace', 'viewpoint', 'nature'
);

CREATE TABLE lifestyle_spots (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category spot_category NOT NULL,
    category_label VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    address TEXT,
    open_hours VARCHAR(100) NOT NULL DEFAULT '08:00 - 18:00 น.',
    price VARCHAR(100) DEFAULT 'เข้าฟรี',
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    gallery_images TEXT[] DEFAULT ARRAY[]::TEXT[],
    vibe_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    highlights TEXT[] DEFAULT ARRAY[]::TEXT[],
    rating NUMERIC(3, 2) DEFAULT 4.80,
    review_count INT DEFAULT 0,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    -- PostGIS geography column (auto-calculated from lat/lng)
    geom GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fast Indexing for Spatial, Filtering & Fuzzy Search
CREATE INDEX idx_spots_province_category ON lifestyle_spots(province, category);
CREATE INDEX idx_spots_geom ON lifestyle_spots USING GIST(geom);
CREATE INDEX idx_spots_vibe_tags ON lifestyle_spots USING GIN(vibe_tags);
CREATE INDEX idx_spots_title_trgm ON lifestyle_spots USING GIN(title gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- 3. 👥 & 🏛️ EVENTS (Community Meetups & Major Fairs/Expos)
-- Clean pillar separation with strict capacity check constraints
-- -----------------------------------------------------------------------------
CREATE TYPE event_pillar_type AS ENUM ('community', 'public_venue');
CREATE TYPE event_status_type AS ENUM ('recruiting', 'full', 'ended', 'cancelled');

CREATE TABLE events (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    event_type event_pillar_type NOT NULL,
    category VARCHAR(50) NOT NULL,
    tag VARCHAR(100),
    venue_tag VARCHAR(50), -- 'qsncc', 'bitec', 'impact'
    province VARCHAR(100) NOT NULL,
    location_name TEXT NOT NULL,
    meeting_point TEXT, -- landmark specific for meetups
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    date_display_text VARCHAR(150),
    time_display_text VARCHAR(150),
    price_text VARCHAR(100) DEFAULT 'ฟรี',
    image_url TEXT NOT NULL,
    description TEXT NOT NULL,
    host_id UUID REFERENCES users(id) ON DELETE SET NULL,
    host_name VARCHAR(150) NOT NULL,
    host_avatar TEXT,
    external_url TEXT,
    status event_status_type NOT NULL DEFAULT 'recruiting',
    participants_count INT NOT NULL DEFAULT 1,
    max_participants INT NOT NULL DEFAULT 10,
    created_at_timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Capacity constraint to prevent database corruption
    CONSTRAINT chk_event_capacity CHECK (participants_count <= max_participants)
);

CREATE INDEX idx_events_pillar_status ON events(event_type, status);
CREATE INDEX idx_events_province ON events(province);
CREATE INDEX idx_events_start_date ON events(start_date DESC);
CREATE INDEX idx_events_venue_tag ON events(venue_tag) WHERE venue_tag IS NOT NULL;
CREATE INDEX idx_events_title_trgm ON events USING GIN(title gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- 4. 🎟️ EVENT PARTICIPANTS & TICKETS
-- Atomic booking table preventing duplicate enrollments
-- -----------------------------------------------------------------------------
CREATE TABLE event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(50) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(150) NOT NULL,
    user_avatar TEXT,
    ticket_code VARCHAR(30) UNIQUE NOT NULL,
    is_checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    note TEXT,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Guarantee 1 ticket per user per event
    CONSTRAINT uq_event_user UNIQUE (event_id, user_id)
);

CREATE INDEX idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX idx_event_participants_user_id ON event_participants(user_id);

-- -----------------------------------------------------------------------------
-- 5. ⚡ CHALLENGE QUESTS (Gamified Lifestyle Quests)
-- -----------------------------------------------------------------------------
CREATE TABLE challenge_quests (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    category_label VARCHAR(100) NOT NULL,
    icon_name VARCHAR(50) NOT NULL DEFAULT 'Zap',
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
    target_total INT NOT NULL DEFAULT 3,
    target_unit VARCHAR(50) NOT NULL DEFAULT 'ครั้ง',
    reward_xp INT NOT NULL DEFAULT 100,
    reward_badge VARCHAR(100) NOT NULL,
    badge_icon VARCHAR(50),
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quest_id VARCHAR(50) NOT NULL REFERENCES challenge_quests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_progress INT NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_user_quest UNIQUE (quest_id, user_id)
);

CREATE INDEX idx_user_quests_user ON user_quests(user_id);
CREATE INDEX idx_user_quests_completed ON user_quests(user_id, is_completed);

-- -----------------------------------------------------------------------------
-- 6. ⭐ REVIEWS & COMMUNITY FEEDBACK
-- -----------------------------------------------------------------------------
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(50) REFERENCES events(id) ON DELETE CASCADE,
    spot_id VARCHAR(50) REFERENCES lifestyle_spots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(150) NOT NULL,
    user_avatar TEXT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    tip_amount INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_event ON reviews(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_reviews_spot ON reviews(spot_id) WHERE spot_id IS NOT NULL;
