# FlipAI (AI Flipper)

A reseller's pocket buying agent. Point your phone at an item in a thrift store,
and the app identifies it, pulls sold-listing comps, and recommends the maximum
price you can pay while still hitting your target ROI.

The repo is three packages:

| Path                | What it is                                        |
| ------------------- | ------------------------------------------------- |
| `AIFlipper/`        | Expo / React Native mobile app (the client)       |
| `AIFlipper-backend/`| Express + TypeScript API (identification, pricing)|
| `shared/`           | `@flipper/shared` — deal math + domain types both sides import |

The mobile app talks to the backend over HTTP. Both must be running during
development. `shared/` is linked into each via `file:../shared`, so it must be
built before either side can resolve it (see below).

---

## Prerequisites

- **Node.js 18+** and npm (the backend and CI target Node 22)
- **PostgreSQL 14+** running locally — the backend persists to it and runs its
  migrations on boot
- **Expo-compatible device or simulator** — the Expo Go app on a physical
  phone, an iOS simulator (Xcode), or an Android emulator
- A **[SerpApi](https://serpapi.com/) key** for real eBay sold comps *(optional
  — without it the app serves clearly-labelled sample prices)*
- A **Google Cloud service-account key** with the Cloud Vision API enabled, for
  image identification *(optional — without it identification runs in mock mode)*

---

## 1. Shared package (`shared/`)

Build it first — both the backend and the app import `@flipper/shared` from its
compiled `dist/`, and a raw-TS package resolves in the typechecker but throws at
runtime.

```bash
cd shared
npm install
npm run build     # tsc -> dist/  (or `npm run dev` to watch)
npm test          # deal-math fixtures (node:test)
```

## 2. Backend (`AIFlipper-backend/`)

```bash
cd AIFlipper-backend
npm install
cp .env.example .env      # then fill in the values below
```

### Set up the database

The backend needs a PostgreSQL database and runs its migrations automatically on
boot. Create the database once, then point `DATABASE_URL` at it:

```bash
createdb aiflipper
```

### Configure `.env`

```ini
# Google Cloud service-account key used by visionService.
# Download from GCP Console > IAM & Admin > Service Accounts, with the
# Cloud Vision API enabled, and save it as google-key.json in this folder.
GOOGLE_APPLICATION_CREDENTIALS=./google-key.json

# SerpApi key used by marketService to fetch eBay SOLD comps.
# Without it, the app serves clearly-labelled sample prices instead of real ones.
SERPAPI_KEY=your_serpapi_key_here

# PostgreSQL connection string. Migrations run on boot.
DATABASE_URL=postgres://user:password@localhost:5432/aiflipper

# Secrets for signing JWTs. Use long random strings; the server refuses to
# start without them.
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Comma-separated browser Origins allowed via CORS (e.g. the Expo web host).
# Leave empty to allow all origins in development. Native clients send no Origin
# and are always allowed.
CORS_ORIGINS=

PORT=3000
```

> **Secrets never get committed.** `.env` and `google-key.json` are both listed
> in `AIFlipper-backend/.gitignore`. Keep them there — the service-account key
> grants access to your Google Cloud project.

### Run it

The `start` script runs the **compiled** output, so build first:

```bash
npm run build     # tsc -> dist/
npm start         # node dist/index.js
```

Or, for iterative development with auto-reload (no build step needed):

```bash
npm run dev       # nodemon src/index.ts
```

On boot the server logs whether each credential was found:

```
Server is running on http://localhost:3000
- Database: connected and migrated
- CORS: all origins (no allowlist set)
- SerpApi Key: LOADED
- Google Vision Credentials: CONFIGURED
```

`MISSING` / `NOT CONFIGURED` here is your signal that the app will fall back to
sample data for that capability. The API is served under `/api`
(e.g. `http://localhost:3000/api/inventory`). A deep `GET /health` (outside
`/api`) reports process **and** database liveness.

### Quality checks

```bash
npm run lint      # eslint (flat config) — floating-promise rules included
npm test          # zod validation-schema tests (node:test)
npm run build     # tsc -> dist/ (also runs automatically via prestart)
```

A `Dockerfile` is provided; build it from the **repo root** (`flipper/`) so the
`../shared` dependency is in the build context:

```bash
docker build -f AIFlipper-backend/Dockerfile -t aiflipper-backend .
```

---

## 2. Frontend (`AIFlipper/`)

```bash
cd AIFlipper
npm install
npm start          # Expo dev server; press i (iOS) / a (Android)
# or:
npm run ios
npm run android
```

### How the app finds the backend

`constants/Config.ts` resolves the API URL in this order:

1. **`EXPO_PUBLIC_API_URL`** — an explicit override. Set it in a gitignored
   `AIFlipper/.env` or in the build environment. Expo inlines `EXPO_PUBLIC_*`
   at build time.
2. **In development**, the host is auto-detected from the Metro bundler's own
   URL — so running on a physical device Just Works without hardcoding your
   Mac's LAN IP after every network change.
3. Falls back to `10.0.2.2` (Android emulator) or `localhost` (iOS simulator).

**Production builds have no dev server to infer the host from, so
`EXPO_PUBLIC_API_URL` is required** — the app throws at startup without it.

```bash
# AIFlipper/.env  (gitignored)
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000/api
```

---

## Notes

- The backend persists to PostgreSQL. Numbered SQL migrations under
  `AIFlipper-backend/src/db/` run automatically on boot; a fresh database is
  seeded once from the legacy `database/inventory.json` if present.
- Every data route requires a JWT and is scoped to the authenticated user — no
  request can read or write another user's rows.
- If the backend is unreachable, the app shows an explicit "can't reach server"
  state and, where a local cache exists, falls back to it — a failed load is
  never silently rendered as empty data.
