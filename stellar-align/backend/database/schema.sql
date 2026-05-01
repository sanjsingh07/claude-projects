-- Stellar Align Database Schema
-- PostgreSQL 15+ with PostGIS extension

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    phone VARCHAR(50) UNIQUE,
    phone_verified BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    birth_date DATE NOT NULL,
    birth_time TIME WITHOUT TIME ZONE,
    birth_timezone VARCHAR(50) DEFAULT 'UTC',
    birth_location_name VARCHAR(255),
    birth_latitude DECIMAL(10, 8),
    birth_longitude DECIMAL(11, 8),
    birth_location GEOGRAPHY(POINT, 4326),
    sun_sign VARCHAR(20),
    moon_sign VARCHAR(20),
    rising_sign VARCHAR(20),
    chart_id UUID, -- FK to birth_charts

    -- Social auth
    google_id VARCHAR(255) UNIQUE,
    apple_id VARCHAR(255) UNIQUE,

    -- Notification preferences
    push_enabled BOOLEAN DEFAULT TRUE,
    daily_notification_time TIME DEFAULT '09:00',
    notification_categories JSONB DEFAULT '{"daily": true, "transits": true, "friend_activity": true, "promotional": false}',

    -- Settings
    theme_preference VARCHAR(20) DEFAULT 'system',
    language VARCHAR(10) DEFAULT 'en',
    units VARCHAR(10) DEFAULT 'imperial', -- for distances

    -- Privacy
    profile_public BOOLEAN DEFAULT FALSE,
    allow_discovery BOOLEAN DEFAULT TRUE,
    show_charts_to_friends BOOLEAN DEFAULT TRUE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_latitude CHECK (birth_latitude IS NULL OR (birth_latitude >= -90 AND birth_latitude <= 90)),
    CONSTRAINT valid_longitude CHECK (birth_longitude IS NULL OR (birth_longitude >= -180 AND birth_longitude <= 180))
);

-- Indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_apple_id ON users(apple_id);
CREATE INDEX idx_users_location ON users USING GIST(birth_location) WHERE birth_location IS NOT NULL;
CREATE INDEX idx_users_birth_date ON users(birth_date);

-- Birth charts table (detailed astrological calculations)
CREATE TABLE birth_charts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    chart_type VARCHAR(50) NOT NULL DEFAULT 'natal', -- natal, transit, composite, etc.

    -- Core positions (stored as JSONB for flexibility)
    planetary_positions JSONB NOT NULL, -- { planet: { sign, degree, minute, house, ... } }

    -- House calculations
    houses JSONB, -- { 1: { sign, degree... }, 2: ... }
    house_system VARCHAR(20) DEFAULT 'placidus',

    -- Aspects
    aspects JSONB, -- Array of aspect objects

    -- Angles
    ascendant SIGN(20),
    midheaven VARCHAR(20),
    descendant VARCHAR(20),
    imum_coeli VARCHAR(20),

    -- Chart metadata
    calculation_datetime TIMESTAMP WITH TIME ZONE,
    calculation_version VARCHAR(20) DEFAULT '1.0',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_chart_type CHECK (chart_type IN ('natal', 'transit', 'progressed', 'composite', 'synastry'))
);

CREATE INDEX idx_birth_charts_user_id ON birth_charts(user_id);
CREATE INDEX idx_birth_charts_type ON birth_charts(chart_type);

-- Uploads/charts for friends (anonymous storage)
CREATE TABLE external_charts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- e.g., "Sarah" or "Mom"
    relationship VARCHAR(50), -- friend, partner, family, etc.
    birth_date DATE NOT NULL,
    birth_time TIME WITHOUT TIME ZONE,
    birth_timezone VARCHAR(50) DEFAULT 'UTC',
    birth_location_name VARCHAR(255),
    birth_latitude DECIMAL(10, 8),
    birth_longitude DECIMAL(11, 8),
    sun_sign VARCHAR(20),
    moon_sign VARCHAR(20),
    rising_sign VARCHAR(20),
    chart_id UUID REFERENCES birth_charts(id),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_external_charts_created_by ON external_charts(created_by);

-- ============================================
-- SOCIAL FEATURES
-- ============================================

-- Friendships/connections
CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, declined, blocked
    friendship_score INTEGER, -- 0-100 compatibility score
    compatibility_summary TEXT,
    aspects_with_user JSONB, -- Store calculated aspects with requester

    -- Once accepted, store relationship chart
    composite_chart_id UUID REFERENCES birth_charts(id),
    synastry_chart_id UUID REFERENCES birth_charts(id),

    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(requester_id, recipient_id),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'declined', 'blocked'))
);

CREATE INDEX idx_connections_requester ON connections(requester_id);
CREATE INDEX idx_connections_recipient ON connections(recipient_id);
CREATE INDEX idx_connections_status ON connections(status);

-- Friendship notes/insights
CREATE TABLE connection_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID REFERENCES connections(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL, -- compatibility, transit, daily, etc.
    category VARCHAR(50), -- love, work, communication, etc.
    title VARCHAR(255),
    content TEXT NOT NULL,
    planetary_aspects JSONB,
    valid_from DATE,
    valid_until DATE,
    seen BOOLEAN DEFAULT FALSE,
    favorited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_connection_insights_connection ON connection_insights(connection_id);
CREATE INDEX idx_connection_insights_type ON connection_insights(insight_type);

-- ============================================
-- DAILY HOROSCOPES
-- ============================================

-- Horoscope content
CREATE TABLE daily_horoscopes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Overall theme
    title VARCHAR(255),
    summary TEXT,
    theme VARCHAR(100),
    tone VARCHAR(50), -- challenging, harmonious, transformative, etc.
    energy_level INTEGER, -- 1-10

    -- Category-specific content
    categories JSONB NOT NULL DEFAULT '{
        "self": {"content": "", "highlight": "", "transits": []},
        "work": {"content": "", "highlight": "", "transits": []},
        "love": {"content": "", "highlight": "", "transits": []},
        "social": {"content": "", "highlight": "", "transits": []}
    }',

    -- Key transits for the day
    active_transits JSONB, -- [{ planet, aspect, target, exact_time, orb }]

    -- AI metadata
    ai_model VARCHAR(50),
    ai_prompt_hash VARCHAR(64),
    generation_time_ms INTEGER,

    -- User interaction
    is_read BOOLEAN DEFAULT FALSE,
    has_shared BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_horoscopes_user_date ON daily_horoscopes(user_id, date);
CREATE INDEX idx_daily_horoscopes_date ON daily_horoscopes(date);

-- Horoscope reactions/feedback (for improvement)
CREATE TABLE horoscope_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    horoscope_id UUID REFERENCES daily_horoscopes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50), -- or 'overall'
    accuracy_rating INTEGER, -- 1-5
    resonance_rating INTEGER, -- 1-5
    feedback_text TEXT,
    device_fingerprint VARCHAR(255), -- for anonymous tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS & PUSH
-- ============================================

-- User notification preferences (detailed)
CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

    -- Channel preferences
    daily_push BOOLEAN DEFAULT TRUE,
    transit_alerts BOOLEAN DEFAULT TRUE,
    friend_activity BOOLEAN DEFAULT TRUE,
    weekly_summary BOOLEAN DEFAULT TRUE,
    promotional_offers BOOLEAN DEFAULT FALSE,

    -- Timing
    daily_delivery_hour INTEGER DEFAULT 9, -- 0-23
    daily_delivery_minute INTEGER DEFAULT 0,
    timezone VARCHAR(50) DEFAULT 'UTC',
    quiet_hours_start TIME,
    quiet_hours_end TIME,

    -- Locale
    language VARCHAR(10) DEFAULT 'en',

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Push tokens
CREATE TABLE push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(512) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- firebase, onesignal, expo
    platform VARCHAR(20) NOT NULL, -- ios, android
    device_id VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, token)
);

CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_token ON push_tokens(token);

-- Scheduled notifications queue
CREATE TABLE scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- daily_horoscope, transit_alert, etc.
    title VARCHAR(255),
    body TEXT,
    data JSONB, -- Custom payload

    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scheduled_notifications_time ON scheduled_notifications(scheduled_for, sent_at);

-- ============================================
-- ACTIVITY & ANALYTICS
-- ============================================

-- User activity log
CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    activity_type VARCHAR(100) NOT NULL, -- view_horoscope, view_chart, add_friend, etc.
    metadata JSONB,
    client_info JSONB, -- app version, os, device
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_activity_user ON user_activity(user_id, created_at DESC);
CREATE INDEX idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX idx_user_activity_created ON user_activity(created_at);

-- Daily active users summary
CREATE TABLE daily_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    horoscopes_generated INTEGER DEFAULT 0,
    connections_made INTEGER DEFAULT 0,
    avg_session_duration_minutes DECIMAL(6,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CACHE & TEMP TABLES
-- ============================================

-- Ephemeris cache for calculated positions (expensive to compute)
CREATE TABLE ephemeris_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    planetary_positions JSONB NOT NULL,
    house_cusps JSONB, -- for different latitudes (stored as variant)
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 year'
);

CREATE INDEX idx_ephemeris_cache_date ON ephemeris_cache(date);
CREATE INDEX idx_ephemeris_cache_expires ON ephemeris_cache(expires_at);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamps automatically
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

CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_horoscopes_updated_at BEFORE UPDATE ON daily_horoscopes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update user chart_id when birth chart is created
CREATE OR REPLACE FUNCTION update_user_chart_id()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.chart_type = 'natal' THEN
        UPDATE users SET chart_id = NEW.id WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER after_chart_insert AFTER INSERT ON birth_charts
    FOR EACH ROW EXECUTE FUNCTION update_user_chart_id();

-- ============================================
-- VIEWS
-- ============================================

-- User profile with sign info
CREATE VIEW user_profiles AS
SELECT
    u.id,
    u.email,
    u.display_name,
    u.first_name,
    u.last_name,
    u.avatar_url,
    u.bio,
    u.sun_sign,
    u.moon_sign,
    u.rising_sign,
    u.birth_location_name,
    u.chart_id,
    u.profile_public,
    u.created_at
FROM users u
WHERE u.deleted_at IS NULL;

-- Active friends view
CREATE VIEW user_friendships AS
SELECT
    c.id,
    c.requester_id,
    c.recipient_id,
    c.status,
    c.friendship_score,
    c.composite_chart_id,
    CASE
        WHEN c.requester_id = current_user_id THEN u2.display_name
        ELSE u1.display_name
    END AS friend_name,
    c.requested_at,
    c.responded_at
FROM connections c
JOIN users u1 ON u1.id = c.requester_id
JOIN users u2 ON u2.id = c.recipient_id
WHERE c.status = 'accepted';

-- Daily horoscope summary view
CREATE VIEW horoscope_summary AS
SELECT
    dh.id,
    dh.user_id,
    dh.date,
    dh.title,
    dh.summary,
    dh.theme,
    dh.tone,
    dh.energy_level,
    u.sun_sign,
    u.moon_sign,
    dh.is_read,
    dh.created_at
FROM daily_horoscopes dh
JOIN users u ON u.id = dh.user_id;
