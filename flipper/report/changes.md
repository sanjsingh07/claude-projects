# Changes Report - June 18, 2026

## Task: Initialize FlipAI - AI Flipper Pricing Assistant

### Summary
Scaffolded a complete MVP for a mobile flipping assistant app. The project includes a high-performance backend and a visually rich mobile frontend based on the provided "Velocity Dark" design system.

### Details
- **Backend**:
  - Initialized Node.js project with TypeScript.
  - Implemented `visionService` using Google Vision and OpenAI for product identification.
  - Implemented `priceService` with mock eBay pricing logic.
  - Implemented `analysisService` for real-time ROI and buy-price recommendations.
  - Set up Supabase integration for inventory management.
- **Mobile (Frontend)**:
  - Scaffolded Expo React Native project.
  - Implemented a Glassmorphic design system using `expo-blur` and custom theme tokens.
  - Created five core screens: Home, Scan (with camera), Result (with AI analysis), Inventory, and Analytics.
  - Integrated `lucide-react-native` for high-quality iconography.
- **Documentation**:
  - Created `flipper/README.md` with setup instructions.
  - Added `.env.example` for backend configuration.

### Files Modified/Created
- `flipper/backend/*` (Scaffolded backend)
- `flipper/mobile/*` (Scaffolded React Native app)
- `flipper/README.md`
- `report/changes.md`

---

# Changes Report - Mon Jun 22 15:12:56 +07 2026

## Task: Full-Fidelity 1:1 Design Refinements & Backend Sync Integration

### Summary
Iterated over the designs to align the React Native frontend screens 1:1 with the mockups (`home_scan`, `scan_result`, `item_details`, `inventory_tracker`, `profit_analytics`, `settings_targets`). Replaced all hardcoded local storage routines with a database-driven backend sync framework, and added the dynamic copy listing copywriting generator integration.

### Details
- **Backend Enhancements**:
  - Implemented database-driven inventory endpoints (`GET`, `POST`, `DELETE` /api/inventory) using dynamic JSON database file persistence seeded with the design mockup items.
  - Implemented dynamic calculation logic in `analyticsService` summing statistics directly from the database seeded with the design base totals.
  - Updated `calculatorService` to consume live fee & ROI configuration thresholds from settings.
  - Built an AI copywriting listing copywriting generator endpoint (`POST` /api/generate-listing) returning suggested tags, titles, and descriptions.
- **Frontend Refinements**:
  - Added centralized configuration in `constants/Config.ts`.
  - Fixed typography and color references inside `LoginScreen.tsx` resolving compiler bugs.
  - Created high-fidelity Verdict box, KPI grid, and 90d Price Trend sparkline elements inside `ResultScreen.tsx` to match the designs.
  - Connected the `GENERATE LISTING` button to fetch and render the AI listing copywriter copywriting in a modal.
  - Linked database operations (`db.ts`) directly with the backend, falling back gracefully to AsyncStorage.
  - Allowed inventory items to be clickable inside `InventoryScreen.tsx`, navigating operators to details where they can delete items or change status flags.
  - Integrated settings and analytics pages to pull/push state changes in real time.

### Files Modified/Created
- `flipper/AIFlipper/constants/Config.ts` (Created)
- `flipper/AIFlipper/database/db.ts` (Modified)
- `flipper/AIFlipper/screens/CaptureScreen.tsx` (Modified)
- `flipper/AIFlipper/screens/LoginScreen.tsx` (Modified)
- `flipper/AIFlipper/screens/SettingsScreen.tsx` (Modified)
- `flipper/AIFlipper/screens/AnalyticsScreen.tsx` (Modified)
- `flipper/AIFlipper/screens/ResultScreen.tsx` (Modified)
- `flipper/AIFlipper/screens/InventoryScreen.tsx` (Modified)
- `flipper/AIFlipper-backend/src/services/inventoryService.ts` (Created)
- `flipper/AIFlipper-backend/src/services/listingService.ts` (Created)
- `flipper/AIFlipper-backend/src/services/calculatorService.ts` (Modified)
- `flipper/AIFlipper-backend/src/services/analyticsService.ts` (Modified)
- `flipper/AIFlipper-backend/src/routes.ts` (Modified)
- `flipper/report/changes.md` (Modified)

---

# Changes Report - Mon Jun 22 15:20:08 +07 2026

## Task: Fix Environmental Variables Hoisting Load Order

### Summary
Fixed a module resolution hoisting bug in the backend where `visionService.ts` was evaluated before `dotenv.config()` ran in `index.ts`, resulting in `GOOGLE_APPLICATION_CREDENTIALS` being undefined.

### Details
- Moved `dotenv` environment loading to an immediate `import 'dotenv/config'` statement at the very top of `index.ts` to ensure all environmental keys are resolved before other imports are evaluated.
- Added `import 'dotenv/config'` to the top of `visionService.ts` to guarantee it safely retrieves the Google Vision key path even when run in standalone scripts or tests.

### Files Modified/Created
- `flipper/AIFlipper-backend/src/index.ts` (Modified)
- `flipper/AIFlipper-backend/src/services/visionService.ts` (Modified)
- `flipper/report/changes.md` (Modified)

---

# Changes Report - Mon Jun 22 15:22:15 +07 2026

## Task: Resolve Google Vision Key File Path Mismatch

### Summary
Fixed a path mismatch warning where the Google credentials file was not found by `visionService.ts`, caused by a leading space typo in the filename.

### Details
- Discovered that the key file at the root of `AIFlipper-backend` was named `" google-key.json"` (with a leading space) instead of `"google-key.json"`.
- Renamed `" google-key.json"` to `"google-key.json"` to match the path defined in the `.env` configuration file (`GOOGLE_APPLICATION_CREDENTIALS=./google-key.json`), ensuring it successfully loads without warning on startup.

### Files Modified/Created
- `flipper/report/changes.md` (Modified)

---

# Changes Report - Mon Jun 22 15:33:56 +07 2026

## Task: Resolve Folly Coroutines Compilation Error on iOS Build

### Summary
Fixed an iOS build compilation failure where `folly/coro/Coroutine.h` could not be found while compiling React Native Reanimated inside the iOS project workspace.

### Details
- Configured the iOS `Podfile` `post_install` hook to disable Folly coroutines (`-DFOLLY_CFG_NO_COROUTINES=1`) for all Xcode project build configurations.
- Handled `OTHER_CPLUSPLUSFLAGS` safely as either an Array or String structure to comply with Cocoapods' internal configurations and prevent type conversion syntax errors.
- Ran `pod install` successfully in the `flipper/AIFlipper/ios` folder, updating the generated workspace.

### Files Modified/Created
- `flipper/AIFlipper/ios/Podfile` (Modified)
- `flipper/report/changes.md` (Modified)

---

# Changes Report - Mon Jun 22 15:42:17 +07 2026

## Task: Resolve React Native Reanimated shadowTreeDidMount Typings Mismatch

> **⚠️ OBSOLETE — DO NOT RE-APPLY (noted 2026-09-05).**
> The hand-patch described below edited files inside `node_modules/react-native-reanimated`.
> Those edits were overwritten by the very next `npm install` and no longer exist in the tree.
> The fix ships upstream in **reanimated 4.1.7**, which guards the `shadowTreeDidMount`
> signature with `REACT_NATIVE_MINOR_VERSION`. `package.json` already pins
> `react-native-reanimated: ~4.1.1`, so a clean `npm install` picks up 4.1.7+ automatically.
> Re-applying this manual patch would only re-introduce a change that a reinstall discards.

### Summary
Fixed an iOS C++ compilation error in the `react-native-reanimated` Fabric hook where `shadowTreeDidMount` was marked `override` but type-mismatched the base virtual function in React Native 0.81.5.

### Details
- Inspected the React Native core Fabric header `UIManagerMountHook.h` and found `shadowTreeDidMount` takes `HighResTimeStamp` instead of `double` for the timestamp argument.
- Patched `react-native-reanimated` local package files `ReanimatedMountHook.h` and `ReanimatedMountHook.cpp` in `node_modules` to replace `double` with `HighResTimeStamp` in the override signature, aligning types and satisfying the compiler.

### Files Modified/Created
- `flipper/report/changes.md` (Modified)

---

# Changes Report - Tue Jul  7 15:00:30 +07 2026

## Task: Resolve Camera Greenlight Indicator Active in Background

### Summary
Fixed an issue where the iOS camera indicator (green light) remained active on the device even after navigating away from the scanner screen in the Expo app.

### Details
- Configured conditional rendering of the `<CameraView>` in `CaptureScreen.tsx` using the `useIsFocused` hook from `@react-navigation/native`.
- When the `CaptureScreen` is focused, `<CameraView>` is mounted. When the user navigates away, `<CameraView>` is unmounted, properly releasing the camera hardware and disabling the device's green light.
- Implemented a dark placeholder view when the screen is unfocused to maintain layout stability without visual layout shift.

### Files Modified/Created
- `flipper/AIFlipper/screens/CaptureScreen.tsx` (Modified)
- `flipper/report/changes.md` (Modified)

---

# Changes Report - Tue Jul  7 15:45:50 +07 2026

## Task: Align Frontend Client-Side Deal Calculation with Backend Settings

### Summary
Aligned the frontend client-side dynamically recalculated profit, ROI, and verdict calculations on the `ResultScreen` 1:1 with the user's active backend Settings parameters.

### Details
- Updated the backend `settingsService.ts` to include missing default settings fields (`priceDrops: true` and `highDemand: true`) in default parameters initialization to match frontend defaults.
- Modified the frontend `ResultScreen.tsx` to dynamically fetch active settings parameters (`defaultFee` and `targetRoi`) from the backend on mount.
- Aligned the frontend dynamic client-side recalculation formulas (triggered when changing the purchase cost or item condition) to use the fetched fee percentage and target ROI thresholds, matching the backend `calculatorService` formulas and logic.
- Configured robust fallback defaults in the UI in case backend settings service calls are unavailable.

### Files Modified/Created
- `flipper/AIFlipper-backend/src/services/settingsService.ts` (Modified)
- `flipper/AIFlipper/screens/ResultScreen.tsx` (Modified)
- `flipper/report/changes.md` (Modified)

---

# Changes Report - Tue Jul  7 15:56:50 +07 2026

## Task: Update Frontend API URL Configuration to Match Host Local IP

### Summary
Updated the frontend configuration file `Config.ts` to use the host computer's active local IP address (`172.16.0.32`) instead of `localhost`.

### Details
- Discovered that when building and running the Expo application targeting a physical iOS device (such as the user's `Jayyy’s iPhone`), the device cannot resolve network requests to `localhost`.
- Obtained the Mac host's active local network IP address (`172.16.0.32`).
- Replaced the hardcoded API URL target in `Config.ts` with the active IP address to restore 1:1 network connectivity and full endpoint configuration between the physical iOS device and the backend server.

### Files Modified/Created
- `flipper/AIFlipper/constants/Config.ts` (Modified)
- `flipper/report/changes.md` (Modified)
