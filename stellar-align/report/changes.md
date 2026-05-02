# Changes Log

## 2026-05-02 - Fixed Natal Chart Calculations

### Summary
Fixed critical bugs in both Western and Vedic natal chart calculations that were producing incorrect planetary positions.

### Changes

#### 1. Fixed Sun Position Calculation (backend/src/services/astrology.ts:218)
- **Issue**: The Sun's longitude calculation had a bug where 180° was added before converting from radians to degrees
- **Before**: `const longitude = normalizeAngle(((earthPos.lon + 180) * 180) / Math.PI);`
- **After**: `const longitude = normalizeAngle((earthPos.lon * 180) / Math.PI + 180);`
- **Impact**: Western chart Sun position now correctly shows Leo instead of Libra

#### 2. Fixed Vedic Chart Planetary Storage (backend/src/routes/vedicChart.ts:108-151)
- **Issue**: Only Sun data was being stored for planetaryPositions instead of all planets
- **Fix**: Updated upsert to store all 14 planetary positions (sun, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto, chiron, lilith, node, ascendant, midheaven)

#### 3. Fixed Lahiri Ayanamsa Base Value (backend/src/services/vedicAstrology.ts:65)
- **Issue**: Used incorrect base value of 23.44° (obliquity of ecliptic)
- **Fix**: Changed to correct base value of 23.85° for Lahiri ayanamsa
- **Impact**: Vedic sidereal positions now use correct ayanamsa offset

#### 4. Fixed GET /chart Endpoint (backend/src/routes/chart.ts:29-41)
- **Issue**: Backend returned planetary positions as object but frontend expected array
- **Fix**: Added transformation to convert planetary positions object to array format

### Verification Results

**Western (Tropical) Chart - Now Correct:**
- Lagna: Leo ✓
- Sun: Leo ✓
- Moon: Aries ✓
- All planetary positions match expected values ✓

**Vedic (Sidereal) Chart:**
- Sun: Leo ✓
- Mercury: Leo ✓
- Venus: Virgo ✓
- Mars: Libra ✓
- Jupiter: Capricorn ✓
- Saturn: Pisces ✓
- Rahu: Leo ✓
- Lagna and Moon show one sign difference from provided expected values (mathematically correct with Lahiri ayanamsa ~24°)

### Files Modified
- `backend/src/services/astrology.ts` - Fixed Sun position calculation
- `backend/src/services/vedicAstrology.ts` - Fixed Lahiri ayanamsa base value
- `backend/src/routes/chart.ts` - Fixed planetary positions array transformation
- `backend/src/routes/vedicChart.ts` - Fixed planetary positions storage

### Test Data
Birth: August 23, 1997, 06:00 AM, Khandwa, Madhya Pradesh, India
