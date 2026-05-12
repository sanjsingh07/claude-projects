# Exhaustive Codebase Audit Report: Stellar Align

**Date:** May 6, 2026
**Project:** Stellar Align (Astrology-based Social App)
**Author:** Gemini CLI Agent

---

## 1. Structural Issues & Architectural Risks

### 1.1 Fragile Background Task Processing
- **Location:** `backend/src/controllers/authController.ts` (Line 101)
- **Issue:** The initial natal chart calculation is triggered in a non-blocking manner using `.catch()`. 
- **Risk:** There is no persistent job queue (e.g., Bull/Redis). If the server restarts or crashes immediately after a user registers, the calculation is lost, and the user will have an empty chart until they manually trigger a recalculation.
- **Code Snippet:**
  ```typescript
  // Calculate natal chart in background (non-blocking)
  this.calculateUserChart(result.user.id).catch((err) => {
    logger.error("Failed to calculate initial chart", { userId: result.user.id, error: err });
  });
  ```

### 1.2 Hybrid Zodiac System Discrepancy
- **Location:** `backend/prisma/schema.prisma` vs `backend/src/controllers/authController.ts`
- **Issue:** 
    - `NatalChart` model defaults to `SIDEREAL` (Vedic) zodiac type.
    - `AuthController.calculateUserChart` calculates `westernChart` as `TROPICAL` and then `vedicChart` as `SIDEREAL`.
    - It saves `sunSign`, `moonSign`, and `risingSign` from the `westernChart` (Tropical) while potentially keeping the default `zodiacType: SIDEREAL`.
- **Risk:** Major data inconsistency. A user might see their "Sun Sign" as Pisces (Tropical) but the record metadata says Sidereal. This affects all downstream logic like horoscopes and compatibility.
- **Code Snippet (`authController.ts`):**
  ```typescript
  const westernChart = await astrologyService.calculateNatalChart(..., ZodiacType.TROPICAL);
  const vedicChart = await calculateVedicChart(..., westernChart);
  await prisma.natalChart.create({
    data: {
      sunSign: westernChart.sun.sign, // Tropical
      moonSign: westernChart.moon.sign, // Tropical
      zodiacType: ZodiacType.TROPICAL, // Overrides default, but divisional charts are Sidereal
      // ... divisionalCharts are from vedicChart (Sidereal)
    }
  });
  ```

### 1.3 Missing Visualization Implementation
- **Location:** `frontend/src/screens/ChartScreen.tsx` and `frontend/src/components/VedicChartCard.tsx`
- **Issue:** The static HTML mockups (`screens_09-chart.html`) feature a sophisticated circular chart wheel with planetary aspects. Neither the Western nor the Vedic React Native components implement this visualization.
- **Impact:** High. The app's primary "hook" (the visual chart) is currently just a list of text placements.

---

## 2. Hardcoded Values & Environment Exposure

### 2.1 Hardcoded Local API URLs
- **Location:** `frontend/src/services/api.ts` (Lines 8-10)
- **Issue:** Local development URLs for iOS/Android emulators are hardcoded.
- **Risk:** Manual modification required for physical device testing or staging/production builds if Expo configs are not perfectly set.
- **Code Snippet:**
  ```typescript
  const IOS_SIMULATOR_URL = 'http://host.docker.internal:3000/api';
  const ANDROID_EMULATOR_URL = 'http://10.0.2.2:3000/api';
  ```

### 2.2 Hardcoded Astrology Orbs
- **Location:** `backend/src/services/astrology.ts` (Line 36) and `backend/src/services/transits/transitEngine.ts` (Line 20)
- **Issue:** Aspect orbs are hardcoded as static constants.
- **Risk:** Standard astrology often requires dynamic orbs (e.g., larger for Sun/Moon). The discrepancy between `astrology.ts` (Orb 8) and `transitEngine.ts` (Orb 2.5) might cause a transit to be missed even if it's considered "active" by natal standards.

---

## 3. Discrepancies & Gaps

### 3.1 Unpopulated User Metadata
- **Location:** `backend/prisma/schema.prisma` vs `backend/src/controllers/authController.ts`
- **Issue:** The `User` model has a `birthUtcOffset` field, but `AuthController.register` never populates it.
- **Impact:** Inconsistent timezone math in downstream services that might rely on the offset rather than just the IANA timezone string.

### 3.2 Placeholder Social Authentication
- **Location:** `backend/src/controllers/authController.ts` (Lines 185, 203)
- **Issue:** `googleAuth` and `appleAuth` are essentially empty. `socialLogin` is implemented but uses a fallback for Apple user names.
- **Impact:** Feature incompleteness for social sign-on.

### 3.3 Weak AI Fallbacks
- **Location:** `backend/src/services/aiContent.ts` (Line 391)
- **Issue:** The rule-based fallback for compatibility and horoscopes is extremely generic.
- **Code Snippet:**
  ```typescript
  private generateRuleBasedCompatibility(score: number, _aspects: any[]) {
    // Just checks the score, ignores signs/aspects entirely
    return { summary: score > 60 ? "Harmonious..." : "Challenging..." };
  }
  ```

---

## 4. Feature Implementation & Testing Gaps

### 4.1 Ineffective Transit Testing
- **Location:** `backend/src/test-transits.ts`
- **Issue:** The test script uses an empty `mockNatal` object.
- **Risk:** It will never detect natal transits, making it useless for verifying the core "transit engine" logic against actual natal placements.

### 4.2 Transit Sampling Frequency
- **Location:** `backend/src/services/transits/transitEngine.ts` (Line 59)
- **Issue:** Annual forecasts sample every 4 days.
- **Risk:** Quick-moving planets (Moon, Mercury) move through signs and aspects in <4 days, meaning an annual forecast will miss numerous significant lunar events.

---

## 5. Summary of Recommended Fixes

1.  **Introduce a Job Queue:** Use BullMQ or similar for `calculateUserChart` to ensure reliability.
2.  **Unify Zodiac Logic:** Decide on a single primary system for the `NatalChart` record or store explicit Tropical vs Sidereal sign pairs.
3.  **Implement SVG Chart Wheel:** Prioritize a React Native SVG implementation of the chart wheel to match mockups.
4.  **Externalize Config:** Move API URLs and Astrology Orbs to environment variables or a DB-backed configuration table.
5.  **Enhance Test Data:** Update `test-transits.ts` with a realistic natal chart containing multiple planets.

---
*Report generated by Stellar Align Audit Sub-Agent.*
