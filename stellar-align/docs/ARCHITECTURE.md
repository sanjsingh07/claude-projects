# Stellar Align - System Architecture

## Overview
Modern astrology application with personalized birth charts, daily horoscopes, social features, and AI-generated content.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │   React Native   │  │   iOS Native    │  │  Android Native │          │
│  │     Mobile App   │  │    (Swift)      │  │   (Kotlin)      │          │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘          │
└───────────┼────────────────────┼────────────────────┼────────────────────┘
            │                    │                    │
            └────────────────────┼────────────────────┘
                               │ HTTPS/WSS
            ┌──────────────────▼────────────────────┐
            │           API GATEWAY                   │
            │     (Rate Limiting, Auth, SSL)          │
            └──────────────────┬────────────────────┘
                               │
┌──────────────────────────────┼─────────────────────────────────────────────┐
│                         API LAYER                                          │
│  ┌───────────────────────────▼────────────────────────────────────────┐ │
│  │                        Express Server                                 │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │ │
│  │  │Auth Router  │ │Chart Router│ │Horoscope    │ │Social Router│    │ │
│  │  │  /auth/*    │ │ /chart/*   │ │  Router     │ │  /social/*  │    │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │ │
│  │  │User Router  │ │Push Router │ │Admin Router │ │Webhook      │    │ │
│  │  │  /user/*    │ │ /push/*    │ │  /admin/*   │ │  /webhook/* │    │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────┼─────────────────────────────────────────────┐
│                      SERVICE LAYER                                         │
│  ┌───────────────────────────▼─────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐          │ │
│   │   │  AuthService │   │ ChartService │   │Horoscope     │          │ │
│  │   │              │   │              │   │  Service     │          │ │
│  │   └──────────────┘   └──────────────┘   └──────────────┘          │ │
│  │   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐          │ │
│  │   │SocialService │   │ PushService  │   │Notification  │          │ │
│  │   │              │   │              │   │  Service     │          │ │
│  │   └──────────────┘   └──────────────┘   └──────────────┘          │ │
│  │   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐          │ │
│  │   │CacheService  │   │  JobService  │   │  LogService  │          │ │
│  │   │              │   │              │   │              │          │ │
│  │   └──────────────┘   └──────────────┘   └──────────────┘          │ │
│  │                                                                        │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
            │                │                 │
┌───────────▼────────────────▼─────────────────▼──────────────────────────────┐
│                           DATA LAYER                                       │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌────────────┐ │
│  │  PostgreSQL   │  │    Redis      │  │  Object Store │  │  Queue     │ │
│  │  (Primary DB) │  │   (Cache)     │  │    (S3/MinIO)│  │ (BullMQ)   │ │
│  │               │  │               │  │               │  │            │ │
│  │ - Users       │  │ - Sessions    │  │ - Images      │  │ - Jobs     │ │
│  │ - Charts      │  │ - Horoscopes  │  │ - Assets      │  │ - Notifications│
│  │ - Relationships│  │ - Rate Limits │  │               │  │            │ │
│  │ - Daily Content│  │               │  │               │  │            │ │
│  └───────────────┘  └───────────────┘  └───────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
            │                │                 │
┌───────────▼────────────────▼─────────────────▼──────────────────────────────┐
│                        EXTERNAL SERVICES                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │    Claude    │ │    Google    │ │    Apple     │ │  Firebase    │    │
│  │   API (AI)   │ │   OAuth 2.0  │ │   Sign In    │ │ Cloud Messaging│   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                      │
│  │    Swiss     │ │   OneSignal  │ │   Expo       │                      │
│  │  Ephemeris   │ │  Push (opt)  │ │   Server     │                      │
│  └──────────────┘ └──────────────┘ └──────────────┘                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Service Boundaries

### Auth Service
- JWT token management (access + refresh tokens)
- Social login (Google, Apple)
- Password reset flow
- Session management

### Chart Service
- Natal chart calculation
- Planetary positions
- House calculations
- Aspect calculations
- Transit calculations

### Horoscope Service
- Daily horoscope generation
- Category-based insights (Self, Work, Love, Social)
- Transit interpretation
- AI content generation

### Social Service
- Friend connections
- Compatibility calculations
- Relationship insights
- Privacy controls

### Push Service
- Token registration
- Scheduled notifications
- Push delivery tracking

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                       │
├─────────────────────────────────────────────────────────┤
│  1. Transport: TLS 1.3, Certificate Pinning            │
│  2. Authentication: JWT (RS256), Refresh Rotation     │
│  3. Authorization: RBAC with scope-based claims          │
│  4. Input Validation: Joi/Zod schemas, SQL injection   │
│  5. Rate Limiting: Sliding window per user/IP          │
│  6. Audit Logging: Immutable event log                   │
└─────────────────────────────────────────────────────────┘
```

## Scalability Considerations

- Horizontal scaling via stateless API servers
- Redis for session storage and caching
- Read replicas for database
- Job queue for async processing
- CDN for static assets
