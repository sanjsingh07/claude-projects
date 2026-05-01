# Stellar Align

Personalized astrology app with daily AI-generated horoscopes, natal chart analysis, compatibility matching, and social features.

## Features

- **Daily Horoscopes**: AI-powered personalized daily insights
- **Natal Charts**: Accurate birth chart calculations using Swiss Ephemeris
- **Compatibility**: Compare charts with friends and see compatibility scores
- **Transit Tracking**: Current planetary positions and aspects
- **Social**: Connect with friends, share horoscopes

## Tech Stack

### Backend
- **Node.js + TypeScript + Express**
- **PostgreSQL + Prisma ORM**
- **Redis**: Caching & sessions
- **Swiss Ephemeris**: Accurate astrology calculations
- **Anthropic Claude**: AI-generated horoscope content
- **JWT**: Authentication

### Frontend
- **React Native (Expo)**
- **TypeScript**
- **React Navigation**: Routing
- **TanStack Query**: Data fetching
- **Zustand**: State management
- **SVG Icons**: Custom zodiac symbols

## Project Structure

```
stellar-align/
├── backend/
│   ├── src/
│   │   ├── config/         # Database, Redis, env
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, validation, errors
│   │   ├── models/         # Prisma schema
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   │   ├── astrology.ts      # Chart calculations
│   │   │   ├── aiContent.ts      # Claude AI integration
│   │   │   └── auth.service.ts   # Authentication
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Helpers
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI
│   │   ├── screens/      # App screens
│   │   ├── navigation/   # Navigators
│   │   ├── hooks/        # Custom hooks
│   │   ├── services/     # API client
│   │   ├── store/        # Zustand stores
│   │   └── types/        # TypeScript types
│   └── package.json
│
└── .env.example
```

## Environment Variables

```env
# Backend
DATABASE_URL="postgresql://user:pass@localhost:5432/stellar_align"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key

# AI Provider — set to "nvidia" (default) or "anthropic"
AI_PROVIDER=nvidia

# NVIDIA NIM (used when AI_PROVIDER=nvidia)
NVIDIA_API_KEY=your-nvidia-api-key
NVIDIA_MODEL=qwen/qwen3.5-397b-a17b

# Anthropic (used when AI_PROVIDER=anthropic)
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Frontend
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## Getting Started

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npx expo start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | Login |
| POST | /auth/register | Register |
| GET | /users/me | Current user |
| GET | /chart | Natal chart |
| GET | /horoscope/today | Today's horoscope |
| GET | /friends | Friend list |
| GET | /compatibility/:id | Compatibility report |

## License

MIT
