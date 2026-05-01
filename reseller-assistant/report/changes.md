# Changes Log

## 2026-05-01 - Fix Multiple Implementation Issues

### Summary
Fixed 9 critical and quality-of-life issues across the backend and frontend that were identified during project-wide review.

### Changes

#### Backend Fixes

1. **vision.py - JSON Extraction** (`backend/app/services/vision.py:115-128`)
   - Added handling for markdown code blocks (```json ... ```)
   - Claude responses wrapped in markdown now parse correctly
   - Uses regex to extract JSON from code blocks before fallback parsing

2. **vision.py - Model Name** (`backend/app/services/vision.py:59`)
   - Changed from `claude-sonnet-4-6-20250929` to `claude-3-sonnet-20240229`
   - Uses standard, available Claude model

3. **ebay.py - OAuth Token Request** (`backend/app/services/ebay.py:77-80`)
   - Fixed form-encoded data format for eBay OAuth2
   - Changed from dict to URL-encoded string
   - Token endpoint now receives properly formatted request

4. **Rate Limit Middleware** (`backend/app/middleware/rate_limit.py`)
   - No changes needed - working as designed
   - Note: Uses in-memory storage (restart clears limits)

#### Frontend Fixes

5. **api.ts - CSV Export Null Safety** (`frontend/src/lib/api.ts:92-109`)
   - Added null/undefined checks for all exported fields
   - Uses 'N/A' for missing est_value instead of 'undefined'
   - Handles missing item_name, brand, category gracefully

6. **api.ts - History Size Limit** (`frontend/src/lib/api.ts:72-78`)
   - Limited scan history to 100 items
   - Prevents unbounded localStorage growth
   - Oldest items removed when limit exceeded

7. **ErrorBoundary Component** (`frontend/src/components/ErrorBoundary.tsx`)
   - New React error boundary component
   - Catches and displays errors gracefully
   - Provides reload button for recovery

8. **main.tsx - Error Boundary Integration** (`frontend/src/main.tsx`)
   - Wrapped App with ErrorBoundary
   - All child components now protected

9. **frontend/Dockerfile**
   - Added package-lock.json copy for deterministic builds
   - Ensures consistent dependency installation

#### Configuration Fixes

10. **.env.example** (`backend/.env.example:11`)
    - Changed FREE_TIER_LIMIT from 5 to 10
    - Aligned with docker-compose.yml and main.py defaults

11. **requirements.txt** (root level)
    - Added root-level requirements file
    - References backend/requirements.txt
    - Enables `pip install -r requirements.txt` from project root

### Files Modified
- `backend/app/services/vision.py`
- `backend/app/services/ebay.py`
- `backend/.env.example`
- `frontend/src/lib/api.ts`
- `frontend/src/main.tsx`
- `frontend/Dockerfile`

### Files Added
- `frontend/src/components/ErrorBoundary.tsx`
- `requirements.txt`
- `report/changes.md`

### Testing Recommendations
1. Test image scan with Claude API (verify JSON parsing)
2. Test eBay integration with valid credentials
3. Verify CSV export with empty/missing fields
4. Confirm history limits at 100 items
5. Test error boundary with intentional errors

### Known Remaining Issues
- In-memory rate limiting (needs Redis for production)
- eBay OAuth may need production OAuth2 flow refinement
- No user authentication (documented as future enhancement)
