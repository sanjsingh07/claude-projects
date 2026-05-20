# Stellar Align - Comprehensive Codebase Audit Report

## Executive Summary & Production Readiness
**Verdict: NOT READY FOR APP STORE RELEASE**

While the Stellar Align app possesses a rich feature set integrating Swiss Ephemeris calculations and AI-driven horoscopes, it is currently in a development state and requires a hardening phase before a public release. The core blockers for production are missing security implementations (fake social token validation), hardcoded local API endpoints in the frontend, and potential data integrity issues with user birth dates during social sign-ups.

---

## 1. Bugs, Logic Errors & Vulnerabilities

### Social Login Data Integrity (Bug)
- **Location:** `backend/src/services/auth.service.ts` (Line 125)
- **Issue:** When a new user registers via social login, their `birthDateTime` is automatically hardcoded to `new Date(Date.UTC(..., 12, 0, 0))` (today at 12:00 UTC), and `birthTimezone` is set to `"UTC"`. While `profileCompleted` is set to `false`, any background job or fallback that calculates charts before the profile is updated will generate completely inaccurate astrological data for that user.

### Silent Failures in Chart Calculation (Logic Error)
- **Location:** `backend/src/controllers/authController.ts`
- **Issue:** Natal chart calculation often runs asynchronously (fire-and-forget). If the Swiss Ephemeris calculation or database insertion fails, the user is left without a natal chart. The system lacks a robust retry mechanism or atomic transaction to handle these failures gracefully.

### Fragile LLM Parsing (Vulnerability)
- **Location:** `backend/src/services/llmProvider.ts` / AI Content Services
- **Issue:** The AI horoscope generation heavily relies on parsing raw JSON from Claude/Nvidia outputs. While there is error handling, there is no strict schema validation (like Zod) on the LLM output before it's saved to the database, risking malformed text displaying on the frontend.

---

## 2. Hardcoded Values & Secrets

### Hardcoded Development URLs
- **Location:** `frontend/src/services/api.ts` (Lines 8-11)
- **Issue:** The API base URLs are hardcoded to `http://localhost:3000/api`, `http://host.docker.internal:3000/api`, and `http://10.0.2.2:3000/api`. This will cause the app to instantly fail on a real production device.
- **Fix:** Enforce the use of `EXPO_PUBLIC_API_URL` via environment variables for all builds.

### Hardcoded UI/Astrology Logic
- **Location:** `backend/src/services/astrologyFormatter.ts` (Line 27)
- **Issue:** Contains `// Logic to determine badge color based on sign element or just hardcoded examples`. This implies visual mappings are currently hardcoded rather than dynamically mapped from a unified theme config.

---

## 3. Frontend / Backend / Database Discrepancies

### Type Safety on JSON Fields
- **Location:** `backend/prisma/schema.prisma` vs `frontend/src/types/index.ts`
- **Issue:** In the database, `notificationSettings` and `privacySettings` are stored as generic `Json` fields with default stringified values. However, the frontend strictly types them (e.g., `NotificationSettings` interface). The backend lacks runtime validation to ensure the JSON blob stored in the database actually matches the frontend's strict interface, which could lead to frontend crashes if a malformed JSON blob is sent.

### Data Model Overlap
- **Issue:** There is structural overlap between `User.notificationSettings` / `User.privacySettings` and the dedicated `UserSettings` table. This split-brain configuration makes updating settings complicated and prone to state discrepancies between the UI and the database.

---

## 4. Placeholders & Missing Implementations (TODOs/FIXMEs)

### Apple ID Verification (Critical Security Blocker)
- **Location:** `backend/src/controllers/authController.ts` (Line 253)
- **Issue:** `// Apple ID token verification placeholder`. The backend currently accepts social login payloads without cryptographically verifying the token with Apple's servers. Anyone can spoof a social login by hitting the API with a fake token.

### Placeholder Horoscopes
- **Location:** `backend/src/controllers/horoscopeController.ts` (Lines 88-89)
- **Issue:** `// User doesn't have a natal chart yet or hasn't completed profile - create placeholder`. The API returns dummy data if the chart isn't ready. This needs a proper UI loading state or "Complete your profile" prompt instead of injecting placeholder horoscope text.

---

## Suggested Improvements & Release Checklist

Before releasing to the App Store or Google Play, complete the following:

1. **Security:** Implement actual cryptographic verification for Apple and Google OAuth tokens in the backend. Remove the placeholder logic.
2. **Environment Configuration:** Remove local IP fallbacks in the frontend. Ensure `app.json` and `eas.json` are properly configured to inject production API URLs.
3. **Data Integrity:** Refactor the social login flow so that a user cannot proceed past the initial screen until they provide valid birth data, rather than injecting a fake 12:00 UTC date.
4. **Validation:** Introduce `zod` or `yup` in the backend to validate incoming JSON for settings, and validate the JSON payloads returning from LLMs before saving them.
5. **App Store Compliance:** Apple requires a functional "Delete Account" feature inside the app. Ensure `isDeleted` flags in the DB are properly respected and the frontend has a clear deletion button.