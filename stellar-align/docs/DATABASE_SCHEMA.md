# Stellar Align - Database Schema

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      users      │       │   birth_charts  │       │  planetary_positions
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │       │ id (PK)         │
│ email           │  │    │ user_id (FK)    │<──────│ chart_id (FK)   │
│ password_hash   │  └────>│ birth_date      │       │ planet          │
│ first_name      │       │ birth_time      │       │ sign            │
│ last_name       │       │ latitude        │       │ degree          │
│ birth_date      │       │ longitude       │       │ house           │
│ birth_time      │       │ timezone        │       │ retrograde      │
│ birth_lat       │       │ sun_sign        │       │ aspect_to       │
│ birth_lng       │       │ moon_sign       │       │ aspect_type     │
│ location_name   │       │ rising_sign     │       └─────────────────┘
│ timezone        │       │ created_at      │
│ settings        │       │ updated_at      │
│ push_token      │       └─────────────────┘
│ is_active       │                │
│ created_at      │                │
│ updated_at      │                ▼
└─────────────────┘       ┌─────────────────┐
         │                  │  chart_aspects  │
         │                  ├─────────────────┤
         │                  │ id (PK)         │
         │                  │ chart_id (FK)   │
         │                  │ planet1         │
         │                  │ planet2         │
         │                  │ aspect_type     │
         │                  │ orb             │
         │                  │ nature          │
         │                  └─────────────────┘
         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  friends        │       │  compatibility  │       │ daily_horoscopes│
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │──────>│ friend_id (FK)  │<─────│ user_id (FK)    │
│ friend_id (FK)  │       │ score           │       │ date            │
│ status          │       │ strengths       │       │ sun_transit     │
│ compat_score    │       │ challenges      │       │ moon_transit    │
│ created_at      │       │ description     │       │ key_transits    │
└─────────────────┘       │ aspects         │       │ categories      │
                          │ created_at      │       │ raw_content     │
                          └─────────────────┘       │ created_at      │
                                                  └─────────────────┘
┌─────────────────┐       ┌─────────────────┐
│  notifications  │       │ push_tokens     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │       │ user_id (FK)    │
│ type            │       │ token           │
│ title           │       │ platform        │
│ body            │       │ device_info     │
│ data            │       │ is_active       │
│ is_read         │       │ created_at      │
│ sent_at         │       └─────────────────┘
│ created_at      │
└─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│   user_sessions │       │  audit_logs     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │       │ user_id (FK)    │
│ token           │       │ action          │
│ refresh_token   │       │ entity_type     │
│ ip_address      │       │ entity_id       │
│ user_agent      │       │ old_values      │
│ expires_at      │       │ new_values      │
│ created_at      │       │ ip_address      │
└─────────────────┘       │ created_at      │
                          └─────────────────┘

┌─────────────────┐
│   transits_cache │
├─────────────────┤
│ id (PK)         │
│ date            │
│ planet          │
│ sign            │
│ degree          │
│ aspect_name     │
│ aspect_sign     │
│ aspect_degree   │
│ orb             │
│ nature          │
│ keywords        │
│ created_at      │
└─────────────────┘
```

## SQL Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    birth_date DATE NOT NULL,
    birth_time TIME,
    birth_latitude DECIMAL(10, 8),
    birth_longitude DECIMAL(11, 8),
    location_name VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified_at TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Birth charts table
CREATE TABLE birth_charts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    birth_date DATE NOT NULL,
    birth_time TIME,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    sun_sign VARCHAR(20) NOT NULL,
    sun_degree DECIMAL(5, 2) NOT NULL,
    moon_sign VARCHAR(20) NOT NULL,
    moon_degree DECIMAL(5, 2) NOT NULL,
    rising_sign VARCHAR(20),
    rising_degree DECIMAL(5, 2),
    mc_sign VARCHAR(20),
    mc_degree DECIMAL(5, 2),
    chart_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Planetary positions table
CREATE TABLE planetary_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chart_id UUID REFERENCES birth_charts(id) ON DELETE CASCADE,
    planet VARCHAR(20) NOT NULL,
    sign VARCHAR(20) NOT NULL,
    degree DECIMAL(5, 2) NOT NULL,
    house INTEGER,
    house_cusp_degree DECIMAL(5, 2),
    is_retrograde BOOLEAN DEFAULT FALSE,
    speed DECIMAL(8, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chart aspects table
CREATE TABLE chart_aspects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chart_id UUID REFERENCES birth_charts(id) ON DELETE CASCADE,
    planet1 VARCHAR(20) NOT NULL,
    planet2 VARCHAR(20) NOT NULL,
    aspect_type VARCHAR(20) NOT NULL, -- conjunction, sextile, square, trine, opposition
    orb DECIMAL(4, 2) NOT NULL,
    nature VARCHAR(10), -- harmonious, challenging, neutral
    applying_or_separating VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily horoscopes table
CREATE TABLE daily_horoscopes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    horoscope_date DATE NOT NULL,
    sun_transit JSONB NOT NULL,
    moon_transit JSONB NOT NULL,
    key_transits JSONB DEFAULT '[]',
    self_category JSONB NOT NULL,
    work_category JSONB NOT NULL,
    love_category JSONB NOT NULL,
    social_category JSONB NOT NULL,
    raw_content TEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, horoscope_date)
);

-- Friends table
CREATE TABLE friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
    compatibility_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    UNIQUE(user_id, friend_id)
);

-- Compatibility results table
CREATE TABLE compatibility_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL,
    emotional_score INTEGER,
    intellectual_score INTEGER,
    physical_score INTEGER,
    spiritual_score INTEGER,
    strengths TEXT[],
    challenges TEXT[],
    detailed_analysis JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_id, user2_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- daily_horoscope, transit_alert, friend_request, etc.
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Push tokens table
CREATE TABLE push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform VARCHAR(20) NOT NULL, -- ios, android, web
    device_info JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, token)
);

-- User sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    last_activity_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transits cache table for astronomical calculations
CREATE TABLE transits_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transit_date DATE NOT NULL,
    planet VARCHAR(20) NOT NULL,
    sign VARCHAR(20) NOT NULL,
    degree DECIMAL(5, 2) NOT NULL,
    speed DECIMAL(8, 4),
    is_retrograde BOOLEAN DEFAULT FALSE,
    aspect_planet VARCHAR(20),
    aspect_sign VARCHAR(20),
    aspect_degree DECIMAL(5, 2),
    aspect_type VARCHAR(20),
    aspect_orb DECIMAL(4, 2),
    nature VARCHAR(10),
    keywords TEXT[],
    expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '7 days',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(transit_date, planet)
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_birth_date ON users(birth_date);

CREATE INDEX idx_birth_charts_user_id ON birth_charts(user_id);

CREATE INDEX idx_planetary_positions_chart_id ON planetary_positions(chart_id);
CREATE INDEX idx_planetary_positions_planet ON planetary_positions(planet);

CREATE INDEX idx_daily_horoscopes_user_date ON daily_horoscopes(user_id, horoscope_date);

CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);

CREATE INDEX idx_compatibility_user1 ON compatibility_results(user1_id);
CREATE INDEX idx_compatibility_user2 ON compatibility_results(user2_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_read;

CREATE INDEX idx_transits_cache_date ON transits_cache(transit_date);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(access_token);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_birth_charts_updated_at BEFORE UPDATE ON birth_charts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compatibility_results_updated_at BEFORE UPDATE ON compatibility_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Data Types Reference

### Zodiac Signs
```
aries, taurus, gemini, cancer, leo, virgo,
libra, scorpio, sagittarius, capricorn, aquarius, pisces
```

### Planets/Luminaries
```
sun, moon, mercury, venus, mars, jupiter, saturn,
uranus, neptune, pluto, ascendant, mc (midheaven), ic, desc
```

### Aspect Types
```
conjunction (0°), semi-sextile (30°), semi-square (45°),
sextile (60°), quintile (72°), square (90°), trine (120°),
quincunx (150°), opposition (180°)
```

### House Systems
```
placidus (default), equal, whole_sign, koch, campanus
```
