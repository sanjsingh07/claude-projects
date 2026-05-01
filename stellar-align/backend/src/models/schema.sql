-- Stellar Align Database Schema
-- PostgreSQL 15+

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "cube";

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255), -- NULL for social login only
    auth_provider VARCHAR(50) DEFAULT 'email', -- 'email', 'google', 'apple'
    provider_id VARCHAR(255), -- External provider user ID

    -- Profile
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,

    -- Birth data (core to app)
    birth_date DATE NOT NULL,
    birth_time TIME WITH TIME ZONE,
    birth_location_name VARCHAR(255),
    birth_latitude DECIMAL(10, 8),
    birth_longitude DECIMAL(11, 8),
    birth_timezone VARCHAR(100),
    birth_utc_offset INTEGER, -- minutes from UTC

    -- Settings
    notification_settings JSONB DEFAULT '{
        "daily_horoscope": true,
        "transit_alerts": true,
        "friend_activity": false,
        "marketing": false,
        "push_time": "09:00"
    }'::jsonb,
    privacy_settings JSONB DEFAULT '{
        "profile_visible": true,
        "chart_visible": "friends", -- public, friends, private
        "allow_compatibility": true
    }'::jsonb,

    -- App metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email) WHERE NOT is_deleted;
CREATE INDEX idx_users_provider ON users(auth_provider, provider_id) WHERE auth_provider != 'email';
CREATE INDEX idx_users_birth_date ON users(birth_date);

-- ============================================
-- ASTROLOGY TABLES
-- ============================================

-- Natal charts (cached calculations)
CREATE TABLE natal_charts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Calculated data (Swiss Ephemeris outputs)
    sun_sign VARCHAR(20) NOT NULL,
    moon_sign VARCHAR(20) NOT NULL,
    rising_sign VARCHAR(20),

    -- Full chart data as JSON
    planetary_positions JSONB NOT NULL, -- Array of planet positions
    houses JSONB, -- 12 house cusps
    aspects JSONB, -- Planet aspects
    chart_pattern VARCHAR(50), -- e.g., "bucket", "splash", "locomotive"

    -- Calculation metadata
    calculation_method VARCHAR(50) DEFAULT 'swiss_ephemeris',
    house_system VARCHAR(20) DEFAULT 'placidus',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Index for chart lookups
CREATE INDEX idx_charts_user ON natal_charts(user_id);
CREATE INDEX idx_charts_signs ON natal_charts(sun_sign, moon_sign, rising_sign);

-- Planetary positions reference (for efficient queries)
CREATE TABLE planetary_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chart_id UUID NOT NULL REFERENCES natal_charts(id) ON DELETE CASCADE,
    planet VARCHAR(30) NOT NULL, -- sun, moon, mercury, etc.
    sign VARCHAR(20) NOT NULL,
    degree DECIMAL(5, 2) NOT NULL, -- 0.00 to 29.99
    minute INTEGER NOT NULL, -- 0-59
    house INTEGER, -- 1-12
    retrograde BOOLEAN DEFAULT FALSE,

    -- Full coordinate data
    longitude DECIMAL(8, 5) NOT NULL, -- 0.00000 to 359.99999
    latitude DECIMAL(8, 5), -- for moon/plutos
    distance_au DECIMAL(10, 8),

    speed_longitude DECIMAL(10, 6), -- daily motion

    UNIQUE(chart_id, planet)
);

CREATE INDEX idx_planetary_positions_chart ON planetary_positions(chart_id);
CREATE INDEX idx_planetary_positions_planet ON planetary_positions(planet);

-- Aspects between planets
CREATE TABLE planetary_aspects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chart_id UUID NOT NULL REFERENCES natal_charts(id) ON DELETE CASCADE,
    planet1 VARCHAR(30) NOT NULL,
    planet2 VARCHAR(30) NOT NULL,
    aspect_type VARCHAR(30) NOT NULL, -- conjunction, opposition, trine, etc.
    angle DECIMAL(5, 2) NOT NULL, -- actual angle
    orb DECIMAL(4, 2) NOT NULL, -- deviation from exact
    applying BOOLEAN, -- true if planets are moving toward exact aspect

    UNIQUE(chart_id, planet1, planet2, aspect_type)
);

CREATE INDEX idx_aspects_chart ON planetary_aspects(chart_id);

-- ============================================
-- DAILY HOROSCOPE TABLES
-- ============================================

-- Daily horoscopes (generated content)
CREATE TABLE daily_horoscopes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Date targeting
    for_date DATE NOT NULL,

    -- Transit data at generation time
    moon_sign VARCHAR(20),
    moon_phase VARCHAR(30),
    active_transits JSONB, -- Array of current transits

    -- Generated content (AI or rule-based)
    content_self TEXT NOT NULL,
    content_work TEXT NOT NULL,
    content_love TEXT NOT NULL,
    content_social TEXT NOT NULL,

    -- AI generation metadata
    generated_by VARCHAR(50) DEFAULT 'claude', -- AI model or 'rule_based'
    generation_prompt_hash VARCHAR(64), -- hash of prompt used
    generation_version INTEGER DEFAULT 1,

    -- Engagement tracking
    viewed_at TIMESTAMP WITH TIME ZONE,
    shared BOOLEAN DEFAULT FALSE,
    bookmarked BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, for_date)
);

-- Indexes for horoscope queries
CREATE INDEX idx_horoscopes_user_date ON daily_horoscopes(user_id, for_date DESC);
CREATE INDEX idx_horoscopes_date ON daily_horoscopes(for_date);

-- Transit tracking (for current/planned transits)
CREATE TABLE transits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transit_planet VARCHAR(30) NOT NULL, -- planet that is moving
    natal_planet VARCHAR(30), -- for planet-planet transits, NULL for sign ingress
    target_sign VARCHAR(20), -- for sign ingress

    aspect_type VARCHAR(30),
    start_date DATE NOT NULL,
    exact_date DATE,
    end_date DATE NOT NULL,

    -- Interpretation
    description TEXT,
    intensity INTEGER CHECK (intensity BETWEEN 1 AND 5),

    -- For personalization
    applies_to_signs VARCHAR(20)[] -- which sun signs this primarily affects
);

CREATE INDEX idx_transits_dates ON transits(start_date, end_date);

-- ============================================
-- SOCIAL FEATURES TABLES
-- ============================================

-- Friend connections
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(requester_id, addressee_id)
);

CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status) WHERE status = 'accepted';

-- Compatibility reports (cached)
CREATE TABLE compatibility_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Calculated scores
    overall_score DECIMAL(4, 2) NOT NULL, -- 0.00 to 100.00
    scores JSONB NOT NULL, -- breakdown: emotional, intellectual, physical, spiritual

    -- Synastry data
    synastry_aspects JSONB, -- aspects between two charts
    composite_chart_id UUID, -- reference to composite chart

    -- Generated content
    interpretation TEXT,
    strengths JSONB,
    challenges JSONB,
    advice TEXT,

    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user1_id, user2_id)
);

CREATE INDEX idx_compat_user1 ON compatibility_reports(user1_id);
CREATE INDEX idx_compat_user2 ON compatibility_reports(user2_id);
CREATE INDEX idx_compat_score ON compatibility_reports(overall_score DESC);

-- ============================================
-- NOTIFICATION & CONTENT TABLES
-- ============================================

-- Push notification tokens
CREATE TABLE push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform VARCHAR(20) NOT NULL, -- ios, android, web
    device_id VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, token)
);

CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_token ON push_tokens(token);

-- Notification log
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- daily_horoscope, transit_alert, friend_request, etc.
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB, -- payload for deeplinks

    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,

    push_token_id UUID REFERENCES push_tokens(id)
);

CREATE INDEX idx_notifications_user ON notifications(user_id, sent_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Content templates (for rule-based horoscopes)
CREATE TABLE content_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(30) NOT NULL, -- self, work, love, social
    sign VARCHAR(20),
    aspect_pattern VARCHAR(50), -- conjunction, trine, etc.
    moon_phase VARCHAR(30),

    template_text TEXT NOT NULL,
    tone VARCHAR(20) DEFAULT 'balanced', -- encouraging, cautionary, neutral
    intensity INTEGER CHECK (intensity BETWEEN 1 AND 5),

    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- JOB & QUEUE TABLES
-- ============================================

-- Background job tracking
CREATE TABLE job_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(50) NOT NULL, -- generate_horoscopes, send_notifications, etc.
    status VARCHAR(20) NOT NULL, -- pending, running, completed, failed
    payload JSONB,
    result JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_job_logs_type ON job_logs(job_type);
CREATE INDEX idx_job_logs_status ON job_logs(status);

-- ============================================
-- AUDIT & ANALYTICS
-- ============================================

-- Audit trail for data changes
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_table ON audit_logs(table_name, record_id);

-- User analytics events
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(50),
    event_data JSONB,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_event ON analytics_events(event_type, created_at DESC);

-- ============================================
-- VIEWS
-- ============================================

-- View for user's complete profile with chart data
CREATE VIEW user_profiles AS
SELECT
    u.id,
    u.email,
    u.email_verified,
    u.display_name,
    u.bio,
    u.avatar_url,
    u.birth_date,
    u.birth_time,
    u.birth_location_name,
    u.birth_latitude,
    u.birth_longitude,
    u.birth_timezone,
    nc.sun_sign,
    nc.moon_sign,
    nc.rising_sign,
    nc.chart_pattern,
    u.created_at,
    u.last_active_at
FROM users u
LEFT JOIN natal_charts nc ON nc.user_id = u.id
WHERE u.is_deleted = FALSE AND u.is_active = TRUE;

-- View for friends list with compatibility
CREATE VIEW user_friends AS
SELECT
    f.id,
    f.requester_id,
    f.addressee_id,
    u1.display_name as requester_name,
    u1.sun_sign as requester_sun_sign,
    u2.display_name as addressee_name,
    u2.sun_sign as addressee_sun_sign,
    cr.overall_score as compatibility_score,
    f.created_at,
    f.accepted_at
FROM friendships f
JOIN users u1 ON u1.id = f.requester_id
JOIN users u2 ON u2.id = f.addressee_id
LEFT JOIN user_profiles u1p ON u1p.id = u1.id
LEFT JOIN user_profiles u2p ON u2p.id = u2.id
LEFT JOIN compatibility_reports cr ON
    (cr.user1_id = f.requester_id AND cr.user2_id = f.addressee_id) OR
    (cr.user1_id = f.addressee_id AND cr.user2_id = f.requester_id)
WHERE f.status = 'accepted';

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compatibility_reports_updated_at BEFORE UPDATE ON compatibility_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate age
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN DATE_PART('year', AGE(CURRENT_DATE, birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- RLS POLICIES (Enable Row Level Security)
-- ============================================

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE natal_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_horoscopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibility_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Note: Create specific policies based on app authentication context
-- These are examples - adjust based on your auth implementation

-- Users can only see their own data (except public profiles)
CREATE POLICY user_own_data ON users
    FOR ALL
    USING (id = current_setting('app.current_user_id')::uuid);

-- Horoscopes are private to user
CREATE POLICY horoscope_own_data ON daily_horoscopes
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::uuid);

-- Friendships visible to involved parties
CREATE POLICY friendship_parties ON friendships
    FOR ALL
    USING (
        requester_id = current_setting('app.current_user_id')::uuid OR
        addressee_id = current_setting('app.current_user_id')::uuid
    );
