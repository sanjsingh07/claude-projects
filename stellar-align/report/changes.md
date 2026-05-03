# Backend Improvements Report

## Summary of Changes
Refactored the Stellar Align backend to improve astrological precision, database integrity, and system scalability.

### 1. High-Precision Astrology Engine (Swiss Ephemeris)
- **Replaced `astronomia` with `sweph`**: Integrated the industry-standard Swiss Ephemeris (N-API bindings).
- **Improved Accuracy**: Planetary positions now include corrections for nutation and aberration. Fixed rough approximations for Pluto, Chiron, and Lilith.
- **Enhanced House Systems**: Added native support for Placidus, Koch, Whole Sign, Equal, and Porphyry house systems.
- **True Node Support**: Switched from Mean Node to True Node by default for better astrological accuracy.

### 2. Database & Type Safety (Prisma Enums)
- **Strictly Typed Enums**: Replaced raw string fields with PostgreSQL Enums for:
    - `ZodiacSign` (ARIES, TAURUS, etc.)
    - `HouseSystem` (PLACIDUS, WHOLE_SIGN, etc.)
    - `AuthProvider` (EMAIL, GOOGLE, APPLE)
    - `FriendshipStatus` (PENDING, ACCEPTED, etc.)
    - `DivisionalChartType` (D1, D9, etc.)
- **Project-Wide Refactor**: Updated all controllers, routes, and services to use these Enums, eliminating runtime string-matching errors.

### 3. Background Processing (BullMQ)
- **Asynchronous Horoscope Generation**: Integrated `BullMQ` with Redis to handle heavy AI-generation tasks outside the request-response cycle.
- **Scheduled Jobs**: Implemented a daily cron job (03:00 UTC) that enqueues horoscope generation for all active users.
- **Scalability**: Decoupled CPU-intensive astrological calculations and LLM calls from the main API process.

### 4. Vedic Astrology Enhancements
- **Vimshottari Dasha**: Implemented the primary Vedic predictive system based on moon nakshatra longitude at birth.
- **Yoga Detection**: Added a framework to identify traditional planetary yogas (e.g., Gaja Kesari Yoga, Budha Aditya Yoga).
- **High-Precision Ayanamsa**: Utilized Swiss Ephemeris native ayanamsa modes (Lahiri, Raman, etc.) for sidereal calculations.

## Technical Debt Resolved
- Removed unused imports and variables across `app.ts`, `index.ts`, and services.
- Unified astrology types between the database schema and the service layer.
- Fixed inconsistent casing in sign and status strings.

## Verification Results
- **Type Check**: `npx tsc --noEmit` returns 0 errors.
- **Schema**: Prisma client regenerated and verified with new Enums.
- **Performance**: API response times for chart retrieval are now faster due to pre-calculated background data.

---

## Pull-to-Refresh Feedback

**Date/Time:** Mon May  4 00:56:20 IST 2026

### What Changed and Why
- Added visible refresh feedback to the chart screen so users can see when pull-to-refresh is actively loading data.
- Enhanced the native refresh control with spinner colors and refresh title styling for clearer platform feedback.

### Summary of Changes
- Shows an inline refresh status indicator under the chart header while the refresh request is running.
- Displays context-aware copy for Western natal chart refreshes and Vedic chart refreshes.
- Preserves existing chart loading behavior and does not trigger any new calculation endpoint.

### Files Modified
- `frontend/src/screens/ChartScreen.tsx`
- `report/changes.md`

---

## Vedic Divisional Ascendant Accuracy

**Date/Time:** Mon May  4 01:24:44 IST 2026

### What Changed and Why
- Corrected Vedic divisional chart ascendant and planet sign mapping to better match Parashara-style varga calculations.
- Fixed stored divisional degrees so D1 uses the sidereal in-sign degree and divisional charts store the degree within the generated varga sign instead of the original rashi degree.
- Made frontend ascendant display fall back to the first house data when needed and format fractional degrees cleanly.

### Summary of Changes
- Updated D2 Hora, D4 Chaturthamsa, D9 Navamsa, D10 Dashamsa, and D11 Rudramsa mappings in the backend Vedic astrology service.
- Added focused backend regression tests for D1 ascendant storage and varga sign mappings.
- Kept the change scoped to Vedic divisional chart calculation/display; Western chart calculation was not changed.

### Files Modified
- `backend/src/services/vedicAstrology.ts`
- `backend/src/services/vedicAstrology.test.ts`
- `frontend/src/components/VedicChartCard.tsx`
- `report/changes.md`
