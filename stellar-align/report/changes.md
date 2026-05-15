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
## Vedic Chart Fix
- Fixed planetaryPositions bug in authController.ts which caused signup chart calculation to fail.
- Added planetary position transformation for divisional charts in vedicChart routes.
- Implemented auto-calculation of missing Vedic data in frontend useVedicChart hook.

## New Screen Templates
- Created screens_00-register-start.html (Register Step-1/Start).
- Created screens_00-login.html (Login Screen).
- Created screens_06-chart-new.html (Chart Screen redesign).
- Created screens_07-chat-new.html (Chat Screen redesign).

## Refined Screen Templates
- Created screens_00-signup-email.html (Signup Step-1: Email/Password).
- Created screens_06-chart-final.html (Consolidated Natal/Vedic Chart with toggle).
- Re-verified design consistency with existing Astra screens.


## [2026-05-08 23:05:00] Align RegisterScreen Step 2 background with Step 1
Updated RegisterScreen Step 2 to use the same star background as Step 1 for visual consistency.
- **Files modified**:
  - `stellar-align/frontend/src/screens/Auth/RegisterScreen.tsx`
- **Changes**:
  - Removed `backgroundColor: colors.astraBg` from the `astraScreen` style. This allows the `CostarBackground` component (rendered at the root level) to show through in Step 2, matching the star-field background of Step 1.
  - Maintained all other astra-themed component styles to preserve the design system's interactive elements.

## [2026-05-09 12:20:43] Refactor Signup/Login Flow
- **What was changed and why**: Updated the signup and login flow to match new design templates. Created a new starting screen and refactored existing screens for a better user experience.
- **Summary of changes**:
    - Created `RegisterStartScreen.tsx` as the new entry point.
    - Updated `RootNavigator.tsx` to set `RegisterStartScreen` as the initial screen.
    - Redesigned `LoginScreen.tsx` based on `screens_00-login.html`.
    - Redesigned `RegisterScreen.tsx` Step 1 based on `screens_00-signup-email.html`.
    - Added design elements like "island" and "indicator" across auth screens.
    - Preserved existing authentication and registration business logic.
- **Files modified**:
    - `stellar-align/frontend/src/screens/Auth/RegisterStartScreen.tsx` (New)
    - `stellar-align/frontend/src/navigation/RootNavigator.tsx`
    - `stellar-align/frontend/src/screens/Auth/LoginScreen.tsx`
    - `stellar-align/frontend/src/screens/Auth/RegisterScreen.tsx`

## [2026-05-09 12:56:03] Fix ReferenceError in RegisterScreen
- **What was changed and why**: Removed a syntax error (accidental text "een;") at the end of `RegisterScreen.tsx`.
- **Summary of changes**: Fixed a regression introduced during the UI refactor.
- **Files modified**:
    - `stellar-align/frontend/src/screens/Auth/RegisterScreen.tsx`

## [2026-05-09 13:32:29] Redirect Social Signup to Birth Data Step
- **What was changed and why**: Changed social login flow to ensure new users provide birth data instead of using placeholders.
- **Summary of changes**:
    - Updated `useAuth` hook to detect new social users and delay full authentication.
    - Updated `LoginScreen` and `RegisterStartScreen` to redirect new social users to registration Step 2.
    - Updated `RegisterScreen` to handle initial state from social providers and update profiles on completion.
- **Files modified**:
    - `stellar-align/frontend/src/hooks/useAuth.ts`
    - `stellar-align/frontend/src/screens/Auth/LoginScreen.tsx`
    - `stellar-align/frontend/src/screens/Auth/RegisterStartScreen.tsx`
    - `stellar-align/frontend/src/screens/Auth/RegisterScreen.tsx`

## [2026-05-09] Onboarding State Management
Implemented a robust onboarding state management system to prevent incorrect astrological calculations for incomplete user profiles.

### Changes:
- **Database**: Added `profileCompleted` (Boolean, default: false) to the `User` model in `schema.prisma`.
- **Backend - Auth**: 
  - Updated `AuthService.register` to set `profileCompleted: true`.
  - Updated `AuthService.socialLogin` to explicitly set `profileCompleted: false` for new users.
  - Updated `AuthService.mapDbUserToUser` to include the new flag.
- **Backend - User**:
  - Updated `UserController.updateCurrentUser` to recalculate and set `profileCompleted: true` when all required birth data (date, lat, lon, timezone) is provided.
- **Backend - Features**:
  - `HoroscopeController`: Now prevents AI horoscope generation for incomplete profiles, returning a "Chart Pending" placeholder instead.
  - `TransitController`: Prevents transit calculation for incomplete profiles.
  - `VedicChart`: Prevents Vedic chart calculation and retrieval for incomplete profiles.
  - `ChatController`: AI assistant now detects incomplete profiles and advises users to complete their birth data in Settings.
- **Frontend**:
  - Updated `User` type definition to include `profileCompleted`.
  - Updated `RootNavigator` to automatically redirect authenticated users with incomplete profiles to the onboarding flow (`Register` screen).
  - Updated `useAuth` hook to allow social login to trigger the onboarding redirection.

### Verified:
- Code reviewed for consistency across layers.
- Navigation logic handles both fresh signups and social logins with missing data.
- API endpoints are protected against premature calculations.

## [2026-05-09] Password Reset Flow Implementation
Resolved the "Broken Password Reset" issue by implementing a full end-to-end flow.

### Changes:
- **Backend - Services**:
  - Created `EmailService` (`email.service.ts`) to handle sending system emails.
  - Implemented `sendPasswordResetEmail` with a professional HTML template.
- **Backend - Auth**:
  - Refactored `AuthService.requestPasswordReset` to generate secure 32-byte hex tokens.
  - Connected password reset requests to the `EmailService`.
  - Added `PasswordResetToken` model to `schema.prisma` for future persistence (currently using Redis for active tokens).
- **Frontend - Services**:
  - Added `forgotPassword`, `resetPassword`, and `changePassword` methods to `api.ts`.
- **Frontend - UI**:
  - Implemented `handleForgotPassword` in `LoginScreen` to trigger the reset flow.
  - Created a new `ResetPasswordScreen` for users to securely set their new password using the token received via email.
  - Registered `ResetPasswordScreen` in the `RootNavigator`.

### Verified:
- End-to-end flow from request to password update.
- Token security (32-byte hex) and expiry (1 hour).
- User-friendly UI for both requesting and performing the reset.

## [2026-05-09] Astrological Precision Improvements
Refined the aspect and transit calculation engine to achieve high precision, specifically addressing the "applying vs separating" logic.

### Changes:
- **Backend - Astrology Service**:
  - Implemented `isAspectApplying` and `getOrb` helper functions in `astrology.ts`.
  - Used a time-step comparison (current vs. future state) to determine if an aspect is approaching or receding.
  - Correctly handles:
    - **Retrograde motion**: Aspects now correctly identify as applying even when a planet is moving "backwards".
    - **360/0 Boundary**: Normalized all calculations to ensure smooth transition across the Aries point.
    - **All Aspect Angles**: Logic works universally for Conjunctions (0°), Squares (90°), Oppositions (180°), etc.
- **Backend - Transit Engine**:
  - Updated `calculateSkyAspects` to include accurate `applying` status for planetary movements in the current sky.
  - Standardized the use of `calculateUserTransits` which now benefits from the improved precision.

### Verified:
- Manually checked edge cases involving the 0° Aries boundary.
- Verified that retrograde planets correctly influence the "applying" flag when moving toward a stationary natal point.

## [2026-05-09] Secure Social Authentication
Closed the critical security vulnerability where social ID tokens were being decoded without signature verification.

### Changes:
- **Backend - Dependencies**:
  - Added `google-auth-library` for robust Google token validation.
  - Added `apple-signin-auth` for secure Apple ID token verification using Apple's public keys.
- **Backend - Auth Controller**:
  - Refactored `socialLogin` to perform full cryptographic signature verification.
  - Google: Now uses `verifyIdToken` with audience check against `GOOGLE_CLIENT_ID`.
  - Apple: Now uses `verifyIdToken` to validate the token against Apple's certificate authority.
  - Replaced insecure `jwt.decode()` calls with protected library methods.

### Verified:
- Logic confirms token payload structure and signature before proceeding with user creation or login.
- Error handling specifically catches and logs verification failures while returning a safe `INVALID_TOKEN` error to the client.

## [2026-05-09] Database Schema Normalization
Successfully refactored the astrological data structure to move from unstructured `Json` blobs to a fully normalized, column-based relational model.

### Changes:
- **Prisma Schema Refactor**:
  - Replaced `Json` fields in `NatalChart` and `DivisionalChart` with explicit relations.
  - Added new models: `NatalPlanetPosition`, `NatalHouseCusp`, `NatalAspect`, `DivisionalPlanetPosition`, and `DivisionalHouseCusp`.
  - Added explicit fields for `degree`, `minute`, `sign`, `retrograde`, and `speed` for each celestial body.
- **Backend - Logic Updates**:
  - Updated `AuthController.calculateUserChart` to handle relational data creation during the initial Western and Vedic calculations.
  - Updated `vedicChart.ts` routes to correctly upsert relational data using transactions, ensuring data integrity by deleting old positions before inserting new ones.
  - Standardized the API responses to return the full nested relational structure, removing the need for manual `Json` transformations.
- **Performance & Queryability**:
  - The new structure allows for efficient indexing and complex SQL queries (e.g., finding all users with a specific Sun/Moon combination) which was previously impossible with `Json`.

### Verified:
- Upsert logic handles both creation and updates correctly within SQL transactions.
- API endpoints correctly fetch and return nested astrological data using Prisma's `include` directives.

## [2026-05-09] Timezone Dependency Resolution
Eliminated the critical dependency on `timeapi.io` by implementing a robust backend timezone resolution and validation system.

### Changes:
- **Backend - Dependencies**:
  - Integrated `geo-tz` for offline, high-performance coordinate-to-timezone lookups.
- **Backend - Utilities**:
  - Created `timezone.ts` utility to resolve and validate timezones from latitude/longitude.
  - Implemented `validateTimezone` which acts as a "source of truth" to ensure astrological calculations use the correct local time offset.
- **Backend - API**:
  - Added a new `GET /api/utils/timezone` endpoint, allowing the frontend to resolve timezones through the trusted backend instead of third-party services.
- **Backend - Logic**:
  - Updated `AuthService.register` and `UserController.updateCurrentUser` to automatically validate/resolve timezones whenever coordinates are provided or updated.
- **Frontend**:
  - Refactored `RegisterScreen` and `SettingsScreen` to use the new backend `/utils/timezone` endpoint.
  - Standardized timezone handling through the `api.ts` service.

### Verified:
- System now correctly identifies timezones without internet access to external timezone APIs.
- Backend automatically corrects mismatched timezones during profile updates, ensuring higher astrological accuracy.

## [2026-05-09] Transit Progress Refinement
Replaced the placeholder transit progress math with a scientifically accurate calculation that reflects the actual phase of the celestial event.

### Changes:
- **Backend - Progress Calculator**:
  - Refactored `computeTransitProgress` to take `maxOrb` and `isApplying` as parameters.
  - Implemented a phase-aware percentage logic:
    - **Applying Phase (0% - 50%)**: Percentage increases as the planet approaches the exact aspect degree.
    - **Peak (50%)**: The moment the aspect is exactly at its target angle.
    - **Separating Phase (50% - 100%)**: Percentage continues to increase as the planet moves away, reaching 100% when it exits the allowed orb.
- **Backend - Transit Engine**:
  - Updated both natal and sky transit calculations to pass the correct `maxOrb` (retrieved from aspect definitions) and the `applying` status.
  - Standardized progress reporting across all forecast periods (week, month, year).
- **Backend - Astrology Service**:
  - Updated the legacy `calculateForecast` function to use the same high-precision logic, removing the hardcoded `(10 - orb) * 10` formula.

### Verified:
- Logic correctly handles the transition from "upcoming" to "active" to "completed".
- Aspects with tight orbs (e.g., Quintiles) now report progress relative to their specific limits rather than a generic 10-degree window.

## [2026-05-09] Birth Time Accuracy Handling
Addressed the "Birth Time Fallback" issue by implementing explicit tracking for users who don't know their exact birth time, with corresponding UI warnings.

### Changes:
- **Database**: Added `birthTimeUnknown` (Boolean, default: false) to the `User` model in `schema.prisma`.
- **Backend - Logic**:
  - Updated all astrological calculation entry points (`AuthController`, `UserController`, `VedicChart`, `NatalChart`) to explicitly check the `birthTimeUnknown` flag.
  - While maintaining 12:00 PM as the mathematical midpoint fallback, the system now stores whether this was a user-provided time or a system estimate.
- **Frontend - UI**:
  - **Register Screen**: Added a toggle for "I don't know my birth time" with an immediate accuracy warning: "Without an exact time, your Rising sign and house placements will be estimated. Readings will be less precise."
  - **Settings Screen**: 
    - Updated the "Birth Data" modal to include the same toggle and warning.
    - Updated the main settings list to display "(Time Unknown)" for clarity.
- **Frontend - Logic**:
  - Updated `User` type and registration/update payloads to include the new flag.
  - Disabled time picker when the "unknown" toggle is active to prevent conflicting data entry.

### Verified:
- Toggle state persists correctly to the backend.
- UI warnings are prominent and explain the impact on astrological accuracy.
- Backend calculations continue to function with the 12:00 fallback but are now context-aware.

## [2026-05-09] Push Notification Delivery Logic
Implemented the full delivery logic for push notifications, completing the architecturally defined system.

### Changes:
- **Backend - Dependencies**:
  - Integrated `expo-server-sdk` for reliable push delivery to iOS and Android.
- **Backend - Services**:
  - Created `NotificationService` to manage token registration, delivery, and automatic cleanup of invalid tokens.
- **Backend - Controllers & Routes**:
  - Implemented `NotificationController` with endpoints for token management and notification history.
  - Registered `POST /notifications/tokens` and related routes.
- **Backend - Integration**:
  - Added real-time notifications for **Friend Requests** and **Friend Acceptance**.
  - Added automatic notifications when **Daily Horoscopes** are generated.
- **Frontend - Utilities**:
  - Created `notifications.ts` for managing device permissions and retrieving Expo push tokens.
- **Frontend - Integration**:
  - Updated `App.tsx` to configure foreground notifications and register the device token upon authentication.

### Verified:
- System correctly handles token lifecycle (registration, deactivation on error).
- Notifications are persisted in the database for history tracking.
- Critical user events now trigger immediate push alerts.

## [2026-05-10] Fix: Astrological Chart Defaulting to Aries 0°

Fixed a critical issue where both Western and Vedic charts would default all planetary positions to 0° Aries.

### Changes:
- **Backend - Ephemeris Management**:
  - Renamed and duplicated ephemeris files in `backend/ephe` to support both `_00` and `_18` naming conventions. This ensures the Swiss Ephemeris library can correctly locate planetary data for the 2026 date range.
- **Backend - Astrology Service**:
  - Fixed a broken bitwise check in `astrology.ts` that was causing the Moshier fallback logic to fail.
  - Improved error logging in `calcPlanetPosition` to provide better visibility into calculation failures.
- **Backend - Vedic Astrology Service**:
  - Fixed `getAyanamsa` to correctly handle the result object from `sweph.get_ayanamsa_ut`. Previously, it was returning 0 because it wasn't extracting the numeric data from the result object.
- **Backend - Bug Fixes (Field Mapping)**:
  - Fixed multiple instances in `authController.ts` and utility scripts where the code was incorrectly attempting to access `user.birthDate` instead of the correct model field `user.birthDateTime`. This was causing `undefined` to be passed to calculation services.
  - Standardized chart recalculation triggers to ensure valid birth data is always present before attempting calculation.

### Verified:
- Manually verified Swiss Ephemeris and Ayanamsa calculations using a standalone test script.
- Confirmed that correctly named ephemeris files and valid date data result in accurate planetary positions (e.g., Sun in Taurus/Aries depending on system) rather than 0° Aries.
- Verified that the system now correctly falls back to Moshier when files are missing but uses high-precision Swiss Ephemeris when they are available.

## [2026-05-10] Fix: Corrected Date Object Passing in Controller/Routes

Resolved the persistent 0° Aries issue by ensuring all calls to astrological services pass valid `Date` objects instead of ISO strings.

### Changes:
- **Backend - UserController**: Updated `calculateAllChartsForUserInternal` and `calculateVedicChartForUserInternal` to pass `user.birthDateTime` (Date object) instead of a derived string.
- **Backend - Routes**: Updated `chart.ts` and `vedicChart.ts` routes to pass the original `Date` object for more reliable Julian Day calculations.
- **Backend - Services**: Added `dateTime.isValid` validation in `astrology.ts` and `vedicAstrology.ts` to catch and report invalid inputs before they reach the Swiss Ephemeris engine.
- **Backend - Scripts**: Fixed `manual_chart_full.ts` to use correct date object passing.

### Verified:
- Traced the "0° Aries" and "Ephemeris file wrong" errors to an invalid Julian Day caused by `NaN` inputs from string-to-date conversion failures.
- Verified that passing a valid `Date` object resolves these errors and results in accurate planetary placements.

## [2026-05-10 22:25] Fix: Birthdate discrepancy in signup and settings

**What was changed and why:**
Fixed a bug where the birthdate entered during signup was stored as the previous day for users in positive timezone offsets (like IST). This was caused by the frontend sending a UTC ISO string which shifted the calendar date when parsed naively by the backend.

**Summary of changes:**
- Updated frontend `RegisterScreen.tsx` and `SettingsScreen.tsx` to send birthdates in local `YYYY-MM-DD` format.
- Hardened backend `AuthController.ts` and `userController.ts` to robustly parse birthdates. It now correctly handles both `YYYY-MM-DD` and ISO strings by using the provided `birthTimezone` to extract the intended local calendar date.
- Updated and expanded backend tests in `authController.spec.ts` to verify the fix and prevent regressions.
- Fixed `formatDate` on the frontend to correctly display `YYYY-MM-DD` as a local date.

**Files modified:**
- stellar-align/frontend/src/screens/Auth/RegisterScreen.tsx
- stellar-align/frontend/src/screens/SettingsScreen.tsx
- stellar-align/backend/src/controllers/authController.ts
- stellar-align/backend/src/controllers/userController.ts
- stellar-align/backend/src/controllers/authController.spec.ts


## [2026-05-10 23:13] Refactor: Profile screen and Transit filtering

**What was changed and why:**
Refactored the Profile screen to improve UX and add transit filtering capabilities as requested. The sign-out button was removed (as it exists in Settings) and a new persistent filtering section for transits was added.

**Summary of changes:**
- Removed `SignOutButton` from `ProfileScreen.tsx`.
- Created `transitStore.ts` using `zustand` and `AsyncStorage` to persist 5 transit filter toggles (Major, Minor, Shadow, Real-time, Personal).
- Refactored `NotificationSection` into a generic `ToggleSection` in `ProfileComponents.tsx` to support multiple settings sections.
- Added "Transit Settings" section to `ProfileScreen.tsx` with 5 toggle options.
- Updated `TransitsScreen.tsx` to respect these filters when rendering the transit forecast.

**Files modified:**
- stellar-align/frontend/src/store/transitStore.ts (new)
- stellar-align/frontend/src/components/ProfileComponents.tsx
- stellar-align/frontend/src/screens/ProfileScreen.tsx
- stellar-align/frontend/src/screens/TransitsScreen.tsx


## [2026-05-10 23:19] Fix: Corrected transit filter mapping for Personal and Real-time events

**What was changed and why:**
Fixed the filtering logic in the Transits screen where "Personal" and "Real-time" toggles were not working. This was because they were looking for non-existent properties on the transit items.

**Summary of changes:**
- Updated `TransitForecastEvent` type in `frontend/src/types/index.ts` to include `eventKind`.
- Corrected the filtering logic in `TransitsScreen.tsx` to map "Personal" to `natal_aspect` and "Real-time" to sky aspects, ingresses, and planetary stations.
- Added documentation to `transitStore.ts` explaining the mapping between frontend toggles and backend data.

**Files modified:**
- stellar-align/frontend/src/types/index.ts
- stellar-align/frontend/src/screens/TransitsScreen.tsx
- stellar-align/frontend/src/store/transitStore.ts


## [2026-05-11 23:59] New Screen: Celestial Map (Improved Chart Screen)

**What was changed and why:**
Created a new, high-fidelity Chart Screen template to replace the basic version. The new design supports both Tropical (Western) and Divisional (Vedic) astrology systems with an interactive, dual-mode interface.

**Summary of changes:**
- Created `screens_09-chart-v2.html` featuring a sophisticated "Celestial Map" design.
- Implemented a dual-system toggle for switching between Western and Vedic views.
- Added a high-detail Tropical Wheel using SVGs with zodiac segments and aspect lines.
- Designed an authentic North Indian style square chart for Vedic Divisional views.
- Included Varga selectors (D1, D9, D10) and a refined placements grid.
- Ensured design consistency with the Astra premium aesthetic (oklch colors, Instrument Serif).

**Files modified:**
- stellar-align/screens_09-chart-v2.html (new)
- stellar-align/report/changes.md

## [2026-05-11 23:59] Redesign: Celestial Map (Chart Screen v3)

**What was changed and why:**
Redesigned the Chart Screen template for the second time to meet higher aesthetic standards. The new design features a high-end 3D "Flip" interface to showcase the dual-system nature (Tropical vs. Divisional) of the app.

**Summary of changes:**
- Created `screens_09-chart-v3.html` with a 3D flippable celestial card.
- **Front Side:** Western Tropical Wheel with ethereal glows and aspect webs.
- **Back Side:** Vedic Divisional Chart (North Indian style) with custom "Gold" accents and traditional house numbering.
- Integrated a "Flip" interaction that updates the system label and theme colors dynamically.
- Refined the placement list with larger typography and improved iconography.
- Preserved existing project design tokens (oklch, Instrument Serif).

**Files modified:**
- stellar-align/screens_09-chart-v3.html (new)
- stellar-align/report/changes.md

## [2026-05-12 00:30] Refinement: Astra-Styled Chart Screen (v4)

**What was changed and why:**
Created a new Chart Screen template (`screens_09-chart-v4.html`) that directly maps the original layout to the premium "Astra" design system, as requested.

**Summary of changes:**
- Re-implemented the chart screen using core Astra UI components:
    - **Astra Header:** Standardized title and metadata.
    - **System Selector:** Styled after the Transit screen's period bar for visual consistency.
    - **Chart Card:** A centered, padded surface hosting both Tropical and Divisional visualizations.
    - **Refined Placements:** List items now match the aspect and transit list styles with optimized iconography.
- Integrated dual-view logic (Tropical Wheel / Vedic Divisional) with a simple tab-style toggle.
- Strictly adhered to the project's color scheme (oklch) and typography (Instrument Serif).

**Files modified:**
- stellar-align/screens_09-chart-v4.html (new)
- stellar-align/report/changes.md

## [2026-05-12 00:50] Refinement: Standardized Chart Screen (v5)

**What was changed and why:**
Created a new Chart Screen template (`screens_09-chart-v5.html`) that directly maps the structure and logic of the current `ChartScreen.tsx` to the project's premium "Astra" design system. This ensures a seamless transition between the functional React Native code and the stylized HTML templates.

**Summary of changes:**
- Re-implemented the chart screen layout using the functional components from `ChartScreen.tsx`:
    - **Header Toggle:** A toggle button to switch between Western and Vedic systems.
    - **Big Three Card:** Displays Sun, Moon, and Rising signs with icons in a horizontal row.
    - **Planetary Positions Card:** A detailed list of planetary placements with degrees and sign icons.
    - **Vedic Section:** Includes a divisional chart selector (D1, D9, D10), a North Indian style diamond chart, and a Nakshatra details card.
- Applied the full Astra design kit: `oklch` color palette, `Instrument Serif` headings, and standardized card/border styling.
- Integrated a small JavaScript script to demonstrate the Western/Vedic toggle behavior.

**Files modified:**
- stellar-align/screens_09-chart-v5.html (new)
- stellar-align/report/changes.md

## [2026-05-12 01:10] Project-Wide Rebranding: Stellar Align

**What was changed and why:**
Performed a comprehensive rebranding of the project from "Astra" to "Stellar Align" across all layers (HTML templates, React Native source code, and documentation) to align with the company's official identity.

**Summary of changes:**
- Renamed all HTML document titles and headers from "Astra" to "Stellar Align".
- Updated internal theme color keys from `astraBg`, `astraViolet`, etc. to `stellarBg`, `stellarViolet`, etc.
- Performed a global search-and-replace in the `frontend/src` directory to update all component references to the new color keys and project name.
- Updated `README.md` and `changes.md` to reflect the new branding.
- Ensured the new Chart Screen template (`screens_09-chart-v5.html`) is fully rebranded.

**Files modified:**
- All `.html` files in `stellar-align/`
- `stellar-align/frontend/src/**/*`
- `stellar-align/README.md`
- `stellar-align/report/changes.md`

## [2026-05-12 00:28] Final Rebranding Refinement: Stellar Align Everywhere

**What was changed and why:**
Completed the project-wide rebranding by removing the last remaining "Astra" references and renaming all "Costar" themed UI components to "Stellar" to ensure absolute consistency with the "Stellar Align" brand identity.

**Summary of changes:**
- Replaced "ASTRA V1.0.0 (BETA)" with "STELLAR ALIGN V1.0.0 (BETA)" in the Settings screen.
- Renamed all UI components from "Costar" prefix to "Stellar" prefix (e.g., `CostarButton` -> `StellarButton`, `CostarBackground` -> `StellarBackground`).
- Renamed physical component files to match the new "Stellar" naming convention.
- Performed a global search-and-replace across the entire frontend source code to update all imports and usages of the renamed components.
- Updated internal code comments to reflect the Stellar Align brand instead of Co-Star style inspiration.
- Verified that no "Astra" or "astra" branding remains in the source code or HTML templates.

**Files modified:**
- `stellar-align/frontend/src/screens/SettingsScreen.tsx`
- `stellar-align/frontend/src/components/StellarBackground.tsx` (renamed from CostarBackground.tsx)
- `stellar-align/frontend/src/components/StellarButton.tsx` (renamed from CostarButton.tsx)
- `stellar-align/frontend/src/components/StellarCard.tsx` (renamed from CostarCard.tsx)
- `stellar-align/frontend/src/components/index.ts`
- All screens and components in `stellar-align/frontend/src/**/*` (updated usages)
- `stellar-align/frontend/src/theme/theme.ts`
- `stellar-align/report/changes.md`

## [2026-05-13 19:16] - Multi-Key AI Providers & OpenRouter Integration

### Changed
- Refactored all LLM providers to support multiple API keys via comma-separated environment variables.
- Implemented API key selection strategy:
  - **Random selection** for daily horoscope and astrological interpretations.
  - **Mapped selection** (consistent per session) for chat interactions.
- Added **OpenRouter** as a new supported AI provider.
- Enhanced **Gemini** provider to support multiple keys and consistent selection.

### Modified Files
- `stellar-align/backend/src/config/env.ts`: Updated env schema for multiple keys and added OpenRouter config.
- `stellar-align/backend/src/services/llmProvider.ts`: Implemented `selectApiKey` logic and added `OpenRouterProvider`.
- `stellar-align/backend/src/services/aiContent.ts`: Updated calls to pass `purpose: "horoscope"` and `mappingId`.
- `stellar-align/backend/src/controllers/chatController.ts`: Updated calls to pass `purpose: "chat"` and `mappingId`.

### Why
To improve reliability, bypass rate limits via key rotation, and add support for OpenRouter's diverse model set.

## [2026-05-13 19:20] - Enhanced LLM Provider Logging

### Changed
- Added comprehensive logging to all LLM providers and the resilient wrapper.
- Implemented **request timing** (`duration` in ms) for all LLM attempts to identify slow responses.
- Added **API key masking** (`maskKey`) to logs to help identify problematic keys while maintaining security.
- Enhanced error reporting to include HTTP status codes and detailed error messages.
- Added `purpose` and `mappingId` context to rotation logs.

### Modified Files
- `stellar-align/backend/src/services/llmProvider.ts`: Added `maskKey`, timing logic, and expanded logger calls.

### Why
To improve observability and debugging of LLM provider performance and failures, specifically helping to distinguish between timeouts and configuration errors.

## [2026-05-13 19:25] - Fixed Horoscope Truncation and Race Conditions

### Changed
- Increased **maxTokens** to 4000 for all LLM providers to prevent response truncation.
- Implemented **detailed JSON parsing error logging** in `aiContent.ts` (logs text length and previews on failure).
- Switched DailyHoroscope database operation from `create` to `upsert` in `astrology.ts` to handle race conditions from parallel requests.
- Fixed return value in `generateDailyHoroscope` to correctly return normalized content.

### Modified Files
- `stellar-align/backend/src/services/aiContent.ts`
- `stellar-align/backend/src/services/astrology.ts`
- `stellar-align/backend/src/services/llmProvider.ts`

### Why
The new logging system revealed that long LLM response durations and truncation at 2000 tokens were causing JSON parsing errors and database unique constraint failures.

## [2026-05-13 19:35] - Implemented LLM Horoscope Retry Mechanism

### Changed
- Added `isFallback` flag to `DailyHoroscopeContent` to distinguish between AI-generated and rule-based horoscopes.
- Implemented **background retry mechanism**: if all LLMs fail, a retry job is scheduled for 5 minutes later using BullMQ.
- Improved **pull-to-refresh logic**: the controller now allows regenerating horoscopes if the existing one is a fallback (`RULE_BASED`) and at least 5 minutes old.
- Added **Redis cache invalidation** in `astrologyService` to ensure users see the updated AI content as soon as a background retry succeeds.
- Refined notifications: push notifications are now only sent when a high-quality (non-fallback) horoscope is successfully generated.

### Modified Files
- `stellar-align/backend/src/services/aiContent.ts`
- `stellar-align/backend/src/services/astrology.ts`
- `stellar-align/backend/src/controllers/horoscopeController.ts`

### Why
To ensure users eventually receive an AI-generated horoscope even if providers are temporarily down or timing out, while still providing an immediate fallback for the initial load.

## [2026-05-13 23:23] - Fix Gemini 404 Error
- **What was changed**: Updated Gemini model to `gemini-2.5-flash` which is a valid model for the `generateContent` method in this timeline.
- **Summary**: The previous models (`gemini-2.5-flash` in `env.ts` was actually a typo or placeholder, and `gemini-3.1-flash-live-preview` in `.env`) were either invalid or did not support the `generateContent` method, leading to 404 errors. Listed available models and confirmed `gemini-2.5-flash` works correctly.
- **Files modified**:
  - `stellar-align/backend/src/config/env.ts`
  - `stellar-align/backend/.env`

## [2026-05-13 23:48] - Resolve Gemini Truncation and JSON Parsing
- **What was changed**: Switched Gemini model to `gemini-3-flash-preview` and improved JSON sanitization.
- **Summary**: Gemini 2.x models were truncating responses early with `MAX_TOKENS` reason at ~750 characters despite high limits, likely due to internal "thinking" budgets. `gemini-3-flash-preview` handles the requested 4000 token limit correctly. Also enhanced `sanitizeJSON` to handle truncated or unclosed JSON and added `responseMimeType: "application/json"` to Gemini requests.
- **Files modified**:
  - `stellar-align/backend/src/config/env.ts`
  - `stellar-align/backend/.env`
  - `stellar-align/backend/src/services/aiContent.ts`
  - `stellar-align/backend/src/services/llmProvider.ts`

## [2026-05-14 01:14] - Sync Settings and Astrology Systems
- **What was changed**: Linked frontend `chartStyle` setting to backend `NatalChart.zodiacType` and cleaned up horoscope generation.
- **Summary**: Previously, changing the chart style (Western/Vedic) in the UI didn't update the underlying astronomical system used for daily horoscopes. Now, `updateUserSettings` automatically syncs `NatalChart.zodiacType` (TROPICAL/SIDEREAL) with the selected style. Also removed redundant transit filtering variables in `astrology.ts` as this categorization is already handled by the `AIContentService` prompt builder.
- **Files modified**:
  - `stellar-align/backend/src/services/settingsService.ts`
  - `stellar-align/backend/src/services/astrology.ts`

## 2026-05-14
- **What was changed and why:** Created a comprehensive codebase audit report requested by the user. Analyzed the frontend, backend, and DB for bugs, placeholders, and app-store readiness.
- **Summary of changes:** Added `report/audit-report.md`.
- **Files modified:** `report/audit-report.md`, `report/changes.md`

## [2026-05-14 16:48] - Add Transit Information Modal
- **What was changed and why:** Added an information button to the Transits screen to explain how transits are calculated and the differences between Western and Vedic systems.
- **Summary of changes:** 
  - Updated `TransitInfoModal.tsx` with detailed content on dual-system analysis (Tropical vs. Sidereal), transit classification (Major/Minor/Shadow), and energy flow (Applying/Separating).
  - Integrated the "i" info button into `TransitsScreen.tsx` header.
  - Added state and logic to trigger the modal from the `TransitsScreen`.
  - Ensured visual consistency with the `TodayScreen` info button.
- **Files modified:**
  - `stellar-align/frontend/src/components/TransitInfoModal.tsx`
  - `stellar-align/frontend/src/screens/TransitsScreen.tsx`

## [2026-05-14 16:55] - Refactor Chat Screen Design
- **What was changed and why:** Updated the chat screen to match the high-fidelity HTML mockup (screens_07-chat.html) for better visual appeal and brand consistency.
- **Summary of changes:** 
  - Redesigned header with AI avatar and "Consulting the stars..." status.
  - Implemented asymmetrical message bubbles (rounded with distinct tail corners).
  - Added a dynamic "typing indicator" during AI response generation.
  - Refined the input area with a pill-shaped box and circular send button.
  - Omitted attachment button as per requirements.
  - Switched to `DateTime` from luxon for accurate message timestamps.
- **Files modified:**
  - `stellar-align/frontend/src/screens/ChatScreen.tsx`

## [2026-05-14 17:02] - Fix Chat Alignment and Input UI
- **What was changed and why:** Corrected a layout bug where user messages were not properly right-aligned and removed an unwanted emoji icon from the input field.
- **Summary of changes:** 
  - Added `alignItems: 'flex-end'` to `userMsg` to ensure correct horizontal positioning within the flex container.
  - Added `textAlign: 'right'` to timestamps for user messages (`userTime`).
  - Removed the emoji icon and its associated styles from the chat input bar.
  - Improved `textInput` vertical padding for better alignment with the send button.
- **Files modified:**
  - `stellar-align/frontend/src/screens/ChatScreen.tsx`

## [2026-05-14 17:15] - Fix Chat Alignment and JSON Response Handling
- **What was changed and why:** Resolved persistent alignment issues for user messages and added robust handling for JSON-formatted AI responses.
- **Summary of changes:** 
  - Modified `llmProvider.ts` to use `text/plain` for Gemini chat responses, preventing forced JSON output.
  - Added `renderMessageContent` helper in `ChatScreen.tsx` to parse and format potential JSON strings from the AI.
  - Refined `ChatScreen` styles: removed redundant `width: '100%'` from message containers to allow `alignSelf: 'flex-end'` to work correctly.
  - Ensured `chatContent` uses `alignItems: 'stretch'` and `flexGrow: 1` for full-screen coverage.
- **Files modified:**
  - `stellar-align/backend/src/services/llmProvider.ts`
  - `stellar-align/frontend/src/screens/ChatScreen.tsx`

## [2026-05-14 17:25] - Fix Chat Alignment Mismatch and Response Truncation
- **What was changed and why:** Resolved a role string mismatch that broke user message alignment after refresh and fixed incomplete AI responses.
- **Summary of changes:** 
  - Updated `ChatScreen.tsx` to use case-insensitive role comparison (`msg.role.toLowerCase() === 'user'`), ensuring user messages stay right-aligned when loaded from history (where the role is returned as 'USER').
  - Increased `maxTokens` in `ChatController.ts` from 500 to 1500 to allow for longer, more complete astrological interpretations.
  - Updated the `ASTROLOGY_SYSTEM_PROMPT` in the backend to explicitly forbid JSON formatting, reinforcing the switch to plain text responses for chat.
- **Files modified:**
  - `stellar-align/frontend/src/screens/ChatScreen.tsx`
  - `stellar-align/backend/src/controllers/chatController.ts`

## [2026-05-15 15:45:00] Fix Chat Screen menu behavior and styling
Fixed issues with the three-dot menu in the Chat screen where it wouldn't close when clicking away and appeared disconnected from the icon.
- **Files modified**:
  - `stellar-align/frontend/src/screens/ChatScreen.tsx`
- **Changes**:
  - **Click-Away Behavior**: Moved the menu overlay from the header to the root of the `SafeAreaView`, ensuring the `Pressable` backdrop covers the entire screen to capture dismiss taps.
  - **Improved Positioning**: Adjusted the `menuContainer` top offset to `44px` to align it more closely with the three-dot icon, resolving the "floating" appearance.
  - **UI Polish**: Replaced the text-based vertical ellipsis (`⋮`) with a consistent `Ionicons` icon (`ellipsis-vertical`).

## [2026-05-15 16:00:00] Hide Delete Account button
Temporarily hid the "Delete Account" button from the Settings screen as it is not yet functional, while preserving the code for future implementation.
- **Files modified**:
  - `stellar-align/frontend/src/screens/SettingsScreen.tsx`
- **Changes**:
  - Commented out the `SettingsRow` for "Delete account" in the Danger zone section.
  - Added `isLast` prop to the "Sign out" button to ensure proper border styling as the now-last item in the section.

## [2026-05-15 16:30:00] Implement Premium Subscription System
Implemented a cross-platform (Apple/Google) subscription system to gate premium transit forecasts.
- **Backend**:
  - Added `isPremium` and `subscriptionExpiresAt` to the database.
  - Updated `AuthService` to propagate premium status in the user profile.
  - Secured `TransitController` to prevent non-premium access to month/year forecasts.
- **Frontend**:
  - Integrated `react-native-purchases` (RevenueCat) for subscription management.
  - Created `SubscriptionService` for handling IAP initialization, purchases, and restoration.
  - Developed a high-fidelity `Paywall` component listing premium benefits.
  - Gated "Month" and "Year" forecasts in `TransitsScreen` with paywall triggers and lock icons.
  - Added subscription status and upgrade paths to the `SettingsScreen`.

## [2026-05-15 16:45:00] Gated AI Chat Guidance
Implemented a daily message limit for non-premium users in the AI chat consultant.
- **Backend**:
  - Updated `ChatController.ts` to enforce a 1-message-per-day limit for standard members.
  - Used UTC-day based counting of user messages to determine limit status.
  - Returns a specific `PREMIUM_REQUIRED` error code when the limit is exceeded.
- **Frontend**:
  - Modified `ChatScreen.tsx` to detect the `PREMIUM_REQUIRED` error.
  - Automatically triggers the `Paywall` component when a user attempts to send more than one message per day.
  - Cleaned up file corruption and syntax errors in the chat screen component.
