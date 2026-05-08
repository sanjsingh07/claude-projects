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

---

## Vedic Node And Planet Status Display

**Date/Time:** Mon May  4 01:54:45 IST 2026

### What Changed and Why
- Fixed Rahu/Ketu placement in divisional charts by calculating Ketu through the backend varga mapping instead of synthesizing it as Rahu's opposite sign in the frontend.
- Added retrograde and combust metadata to stored divisional chart planet positions so the UI can show status markers next to planet names.
- Removed frontend-only opposite-sign Ketu generation, which was incorrect for D2 Hora and can be incorrect in other divisional charts.

### Summary of Changes
- Backend now derives Ketu from the node longitude plus 180 degrees and maps it independently through D1/D2/D4/D9/D10/D11.
- Backend divisional chart positions now include optional `retrograde` and `combust` flags.
- Frontend renders labels like `mercury(R)`, `mercury(c)`, or `mercury(Rc)` based on those flags.
- Added regression coverage for D2 Rahu/Ketu same-sign placement and retrograde/combust metadata.

### Files Modified
- `backend/src/services/astrology.ts`
- `backend/src/services/vedicAstrology.ts`
- `backend/src/services/vedicAstrology.test.ts`
- `backend/src/types/astrology.ts`
- `frontend/src/components/VedicChartCard.tsx`
- `frontend/src/types/index.ts`
- `report/changes.md`

## [2026-05-06] Remove redundant 'Your chart' summary from Profile screen
- Removed `ChartSummaryCard` from `ProfileScreen.tsx` to eliminate redundancy with the dedicated Chart tab.
- Deleted `ChartSummaryCard` component and its associated styles from `ProfileComponents.tsx`.
- Cleaned up unused `placements` data fetching/formatting in `ProfileScreen.tsx`.

**Files modified:**
- `frontend/src/screens/ProfileScreen.tsx`
- `frontend/src/components/ProfileComponents.tsx`

## [2026-05-06] - Fixes and D11 Removal
### Fixed
- **Western Chart Planetary Positions**: Fixed bug where planetary positions table was empty because the backend was returning an object instead of an array.
- **Data Consistency**: Added `transformPlanetaryPositions` utility to ensure consistent array format for all chart responses.

### Removed
- **D11 Divisional Chart**: Removed D11 (Ekadasamsa) from all layers of the application (DB, Backend, Frontend).

### Files Modified
- `backend/prisma/schema.prisma`
- `backend/src/routes/chart.ts`
- `backend/src/routes/vedicChart.ts`
- `backend/src/services/vedicAstrology.ts`
- `backend/src/services/vedicAstrology.test.ts`
- `backend/src/types/astrology.ts`
- `backend/src/utils/chart.ts`
- `frontend/src/components/VedicChartCard.tsx`
- `frontend/src/hooks/useVedicChart.ts`
- `frontend/src/screens/SettingsScreen.tsx`
- `frontend/src/store/vedicChartStore.ts`
- `frontend/src/types/index.ts`

## [2026-05-06] - Refined Transit Categorization
### Improved
- **Transit Classification**: Refined the logic in `transitClassifier.ts` to distinguish between "major", "minor", and "shadow" events. Previously, almost all events were flagged as "major".
- **Major Events**: Now restricted to significant shifts (ingresses, retrograde changes) and tight aspects of outer planets or very tight hard aspects of inner planets.
- **Minor Events**: Aspects with larger orbs or soft aspects of fast-moving planets are now correctly categorized as "minor".
- **Impact Levels**: Adjusted impact level determination to provide more nuanced labels (profound, intense, high, moderate, low) based on the specific transit.

### Files Modified
- `backend/src/services/transits/transitClassifier.ts`

## [2026-05-06] - Fixes for Natal and Vedic Chart Display
### Fixed
- **Natal Chart Planetary Positions**: Fixed bug where the planetary positions table was empty. Ensured that all chart endpoints explicitly transform stored data into the expected array format for the frontend, avoiding issues with raw Prisma objects and inconsistent storage formats.
- **Vedic Chart Layout**: Extended the Vedic chart (divisional chart) component to show more content. Removed the 'maxHeight: 300' restriction and nested 'ScrollView' in 'VedicChartCard.tsx' to allow the component to expand fully within its parent container.
- **Vedic Data Accuracy**: Updated Vedic chart calculation in 'routes/vedicChart.ts' to use Sidereal signs for Sun and Moon, ensuring the Big Three are correctly displayed in the Vedic view.
- **Data Consistency**: Improved 'transformPlanetaryPositions' utility to be more robust, handling both array and object formats defensively.

### Files Modified
- `backend/src/routes/chart.ts`
- `backend/src/routes/vedicChart.ts`
- `backend/src/controllers/userController.ts`
- `backend/src/utils/chart.ts`
- `frontend/src/components/VedicChartCard.tsx`

## [2026-05-06] - Fix syntax error in chart utility
### Fixed
- **Chart Utility Syntax**: Fixed an unterminated multi-line comment and removed a literal '...' placeholder in `backend/src/utils/chart.ts` that was causing compilation failure during development.

### Files Modified
- `backend/src/utils/chart.ts`

## [2026-05-07 15:19:45] Fix Prisma error in horoscope worker

### Summary
Fixed a Prisma crash occurring during background horoscope generation. The root cause was the `horoscopeWorker` attempting to process the scheduler job (`enqueue-daily-horoscopes`) as an individual user job, leading to `undefined` userId and date parameters.

### Files Modified
- `stellar-align/backend/src/jobs/horoscopeWorker.ts`: Updated worker logic to branch based on job name.
- `stellar-align/backend/src/services/astrology.ts`: Added input validation to `generateDailyHoroscope`.

### Details
- The worker now explicitly checks for the `enqueue-daily-horoscopes` job name and calls the bulk enqueuer.
- Individual jobs (which have dynamic names) fall through to the single-user generation logic.
- Improved error logging and type safety in the worker.

## [2026-05-07 15:30:00] Extend frontend with new screens

### Summary
Created 5 new screens for the Astra frontend prototype, following the established OKLCH design system and mobile-first architecture.

### Files Created
- `stellar-align/screens_06-chart.html`: Natal Chart visualization and placement details.
- `stellar-align/screens_07-chat.html`: AI Cosmic Guide chat interface.
- `stellar-align/screens_00-signup-start.html`: Onboarding start and social login.
- `stellar-align/screens_01-signup-birth.html`: Birth details entry form.
- `stellar-align/screens_02-signup-final.html`: Onboarding completion and core chart summary.

### Details
- Maintained consistency with `Instrument Serif` and `DM Sans` typography.
- Used standardized `oklch` color variables for all surfaces and accents.
- Implemented responsive mobile frame with status bar and home indicator.
- Integrated new screens into the existing navigation pattern (where applicable).

## [2026-05-07 16:42:57] Update RegisterScreen Step 2 design

### Summary
Updated the Step 2 (Birth Data) UI of the `RegisterScreen` to match the high-fidelity Astra design system.

### Files Modified
- `stellar-align/frontend/src/screens/Auth/RegisterScreen.tsx`: Replaced legacy inputs with Astra-themed components and layout.

### Details
- Implemented `stepHeader` and `stepNum` styling for onboarding clarity.
- Created custom `astraInput` components with `astraSurface` and `astraBorder` colors.
- Applied `Instrument Serif` italic styling to the main title (iOS).
- Updated the "Create Account" button label to "Calculate Natal Chart" for Step 2.
- Integrated the design patterns from `screens_01-signup-birth.html`.

## [2026-05-07 16:59] - Update RegisterScreen Step 2 Design
- Updated Step 2 of RegisterScreen (Birth Data) to match screens_01-signup-birth.html exactly.
- Implemented specific styling for headers, labels, inputs, and the "Calculate Natal Chart" button.
- Added "Island" and "Home Indicator" elements to match the design.
- Muted the AM/PM part of the time display to match the design.
- Removed the timezone selector from the UI as per the design, while keeping its logic in the state.
- Ensured typography (Instrument Serif and DM Sans) and colors (Astra theme) are correctly applied.
- Files modified:
  - stellar-align/frontend/src/screens/Auth/RegisterScreen.tsx

## [2026-05-07 17:15] - UX Refinement for RegisterScreen Step 2
- Removed the home indicator bar from the bottom of Step 2.
- Added a "Go Back" button to Step 2 to allow navigation back to Step 1.
- Implemented background tap dismissal for the keyboard across the entire screen and within modals.
- Fixed the location search modal being hidden by the keyboard by adding KeyboardAvoidingView and ensuring proper modal sizing.
- Added keyboardShouldPersistTaps="handled" to ScrollView and FlatList to improve interaction with inputs.
- Files modified:
  - stellar-align/frontend/src/screens/Auth/RegisterScreen.tsx

## [2026-05-08 13:58] - Fix Registration Crash (Express 'this' context)
### Fixed
- **Registration Crash**: Fixed `TypeError: Cannot read properties of undefined (reading 'calculateUserChart')` in `AuthController.ts`. The error occurred because the class method was called as a middleware by Express, losing its `this` context.
- **Controller Reliability**: Bound `this` context to all public methods in `AuthController`, `UserController`, and `HoroscopeController` using class constructors. This prevents similar errors in other endpoints that use `this` (e.g., `recalculateNatalChart`, `getInsights`).

### Files Modified
- `stellar-align/backend/src/controllers/authController.ts`
- `stellar-align/backend/src/controllers/userController.ts`
- `stellar-align/backend/src/controllers/horoscopeController.ts`

## [2026-05-08 14:05] - Fix Registration Display Name Saving
### Fixed
- **Display Name Saving**: Fixed an issue where the `fullName` entered during registration was not being passed to the backend, causing users to be created with the default name "User".
- **API and Hooks Update**: Updated `ApiService.register` and `useAuth` hook to correctly include the `displayName` field in the registration payload.

### Files Modified
- `stellar-align/frontend/src/services/api.ts`
- `stellar-align/frontend/src/hooks/useAuth.ts`
- `stellar-align/frontend/src/screens/Auth/RegisterScreen.tsx`

## [2026-05-08 14:36] - Add Gender Field to Database
### Added
- **Gender Support**: Added a `Gender` enum (`MALE`, `FEMALE`, `NON_BINARY`, `PREFER_NOT_TO_SAY`) and a `gender` field to the `User` model in the Prisma schema.
- **Registration Flow**: Updated `AuthController`, `AuthService`, and frontend API/hooks to handle and persist the user's gender selection during registration.
- **Type Safety**: Synchronized backend types with the new Prisma `Gender` enum.

### Files Modified
- `stellar-align/backend/prisma/schema.prisma`
- `stellar-align/backend/src/types/user.ts`
- `stellar-align/backend/src/services/auth.service.ts`
- `stellar-align/backend/src/controllers/authController.ts`
- `stellar-align/frontend/src/services/api.ts`
- `stellar-align/frontend/src/hooks/useAuth.ts`
- `stellar-align/frontend/src/screens/Auth/RegisterScreen.tsx`

## [2026-05-08 14:43] - Finalize Gender Support and DB Migration
### Added
- **Expanded Gender Options**: Updated `RegisterScreen.tsx` to support all four gender options (`MALE`, `FEMALE`, `NON_BINARY`, `PREFER_NOT_TO_SAY`) with a cycling selector.
- **Improved Mapping**: Implemented robust gender string mapping using regex to handle spaces and hyphens correctly for the backend enum.
- **Database Migration**: Applied the database schema changes using `prisma db push`.
- **Data Cleanup**: Resolved a migration conflict by removing orphaned `D11` divisional chart records using raw SQL, allowing the `DivisionalChartType` enum to be updated.

### Files Modified
- `stellar-align/frontend/src/screens/Auth/RegisterScreen.tsx`
- `stellar-align/report/changes.md`

## [2026-05-08 15:02:00] Fix birth time picker restriction bug
Fixed a bug in RegisterScreen Step 2 where picking a birth date first would restrict the birth time picker to a limited range (e.g., 00:00 - 05:30).
- **Files modified**:
  - `stellar-align/frontend/src/screens/Auth/RegisterScreen.tsx`
- **Changes**:
  - Added unique `key` props to all `DateTimePicker` instances to prevent native state leakage and ensure fresh instances when switching modes.
  - Updated `handleDateChange` to synchronize the date part of `timePickerDate` with the newly selected date while preserving the user's selected time. This ensures that the time picker always operates on the correct day, avoiding accidental future-date restrictions.

## [2026-05-08 15:18:00] Refine birth time picker fix for iOS/Expo
Further refined the birth time picker fix to specifically address the 05:30 (UTC boundary) restriction on iOS.
- **Files modified**:
  - `stellar-align/frontend/src/screens/Auth/RegisterScreen.tsx`
- **Changes**:
  - Removed the date synchronization logic from `handleDateChange`. By keeping `timePickerDate` on a neutral past date (e.g., Jan 1, 2000), we prevent the native iOS picker from applying "today" or "future" restrictions that were incorrectly triggering at the UTC day boundary (05:30 IST).
  - Maintained the unique `key` props to ensure fresh component instances and prevent prop leakage.


## Finally fixed -- birth time picker

✦ I have applied a more robust fix to resolve the time picker restriction on iOS.

  Investigation Findings
  The restriction to 00:00 - 05:30 IST corresponds exactly to a 00:00 UTC boundary. It appears that the native iOS picker was internally applying a "today" boundary in UTC, even when in time mode. This can happen if the component inherits a maximumDate from a previous instance
  or if the value prop's date part is interpreted as "today".

  Robust Fix Implementation
   1. Explicit Boundaries: I have explicitly set maximumDate and minimumDate on the Time Picker to far-future and far-past dates (2100 and 1900). This forces the native picker to clear any "today" or "now" restrictions that might have been inherited or applied by default.
   2. Date Normalization: In handleTimeChange, I now explicitly normalize the Date object to January 1, 2000, before saving it to state. This ensures that even if the native picker returns a date object set to "today", we immediately move it to a neutral past date. This
      prevents the boundary bug from triggering on the next time the picker is opened.
   3. Memoized Boundaries: I used useMemo for the Date Picker's maximumDate to ensure a consistent object reference, which helps prevent unnecessary re-renders of the native component.

  This combination of clearing boundaries and strict date normalization should ensure the time picker remains unrestricted regardless of the order in which the fields are filled.
## [2026-05-08 15:38:00] Fix Prisma 'gender' field validation error
Resolved a `PrismaClientValidationError` where the `gender` field was unknown to the Prisma client despite being in the schema.
- **Files modified**:
  - `stellar-align/backend/prisma/schema.prisma` (already had the field, but client was out of sync)
  - `stellar-align/backend/prisma/migrations/20260508100721_add_gender_to_user/migration.sql` (New migration)
- **Changes**:
  - Identified a conflicting `DATABASE_URL` in the environment (SQLite) that was overriding the PostgreSQL URL in `.env`.
  - Applied the pending schema changes (`Gender` enum and `User.gender` field) to the database using `prisma migrate dev`.
  - Regenerated the Prisma client to include the new types.
  
## [2026-05-08 16:35:00] Fix birth time mismatch after registration
Fixed a bug where the birth time picked during registration (e.g., 06:00 AM) was incorrectly displayed as 12:30 AM in the profile.
- **Files modified**:
  - `backend/src/controllers/authController.ts`
  - `backend/src/controllers/authController.spec.ts`
  - `backend/src/routes/chart.ts`
  - `backend/src/routes/vedicChart.ts`
- **Changes**:
  - **UTC Parsing**: Updated `AuthController.register` to parse birth time as UTC using `Date.UTC`. Previously, it was parsed as server local time, causing a timezone shift (e.g., 06:00 IST became 00:30 UTC).
  - **Consistent Time Extraction**: Replaced `toTimeString().slice(0, 5)` (local time) with `toISOString().slice(11, 16)` (UTC time) in `routes/chart.ts` and `routes/vedicChart.ts`. This ensures that astrological calculations always use the correct clock time regardless of the server's local timezone.
  - **New Unit Test**: Added `AuthController.spec.ts` to verify that birth time is correctly parsed as UTC during the registration flow.

## [2026-05-08 16:55:00] Implement automatic timezone lookup during registration
Added automatic timezone lookup based on birth location to ensure astrological accuracy.
- **Files modified**:
  - `frontend/src/screens/Auth/RegisterScreen.tsx`
- **Changes**:
  - **Automatic Lookup**: Updated `handleLocationSelect` to fetch the correct timezone ID (e.g., `America/New_York`) from `timeapi.io` using the selected location's coordinates.
  - **Improved Accuracy**: This replaces the hardcoded `Asia/Kolkata` default, ensuring that natal charts and transits are calculated using the correct UTC offset for the user's actual birth place.
  - **Loading State**: Added an activity indicator while the timezone lookup is in progress to provide user feedback.

## [2026-05-08 17:15:00] Fix missing Vedic charts after registration
Fixed a bug where the Vedic (divisional) charts were empty for newly registered users.
- **Files modified**:
  - `backend/src/controllers/authController.ts`
- **Changes**:
  - **Comprehensive Initial Calculation**: Updated the registration flow to calculate both Western and Vedic charts immediately after signup. Previously, only the Western chart was being generated.
  - **Vedic Data Persistence**: Ensured that the primary `NatalChart` record is updated with Vedic metadata (nakshatras, ayanamsa) and that all five divisional charts (D1, D2, D4, D9, D10) are created and saved to the database.
  - **Logic Unification**: Mirrored the "perfect condition" calculation logic from `UserController.ts`, including the use of high-precision Swiss Ephemeris for Western data and traditional Vedic formulas for sidereal data.
  - **Immediate Availability**: New users will now find their complete Vedic profile ready as soon as they navigate to the Chart tab for the first time.
