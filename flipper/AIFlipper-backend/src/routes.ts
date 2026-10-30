import { Router, Request, Response } from 'express';
import { identifyImage } from './services/visionService';
import { getMarketData } from './services/marketService';
import { calculateDeal } from '@flipper/shared';
import { getAnalytics } from './services/analyticsService';
import { getSettings, updateSettings } from './services/settingsService';
import { getInventoryItems, saveInventoryItem, deleteInventoryItem } from './services/inventoryService';
import { generateListing } from './services/listingService';
import { requireAuth } from './middleware/requireAuth';
import { validateBody } from './middleware/validate';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  settingsSchema,
  inventoryItemSchema,
  identifySchema,
  generateListingSchema,
} from './validation/schemas';
import { registerUser, loginUser, refreshTokens, getUserById, AuthError } from './services/authService';
import type { Identification } from '@flipper/shared';

const router = Router();

// Health check lives at /health in index.ts (deep — it pings the DB), so there
// is no shallow /api/health here to shadow it.

// --- Auth (public) ---
// register/login/refresh mint tokens; /auth/me echoes the caller (behind auth).
// AuthError carries its own HTTP status; anything else is an unexpected 500.
router.post('/auth/register', validateBody(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    const result = await registerUser(email, password);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof AuthError) return res.status(error.status).json({ error: error.message });
    console.error('Register Error:', error);
    res.status(500).json({ error: 'Failed to register' });
  }
});

router.post('/auth/login', validateBody(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    const result = await loginUser(email, password);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AuthError) return res.status(error.status).json({ error: error.message });
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

router.post('/auth/refresh', validateBody(refreshSchema), async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body ?? {};
    const result = await refreshTokens(refreshToken);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AuthError) return res.status(error.status).json({ error: error.message });
    console.error('Refresh Error:', error);
    res.status(500).json({ error: 'Failed to refresh session' });
  }
});

router.get('/auth/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.userId!);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    console.error('Me Error:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

// Identification & Analysis endpoint
router.post('/identify', requireAuth, validateBody(identifySchema), async (req: Request, res: Response) => {
  try {
    const { image, productName: manualName } = req.body;

    let identity: Identification;
    if (manualName) {
      // Manual entry / "not this?" correction: the user has asserted the name,
      // so it's maximally confident and carries no alternates. This is also how
      // a picked alternate re-runs the market lookup against the right query.
      identity = {
        productName: String(manualName).trim(),
        category: 'Manual Entry',
        confidence: 1,
        alternates: [],
        detectedText: [],
        isMock: false,
      };
    } else {
      // validateBody(identifySchema) guarantees an image is present when no
      // productName was given, so no re-check is needed here.
      identity = await identifyImage(image);
    }
    
    // 1. Fetch user algorithms from settings. getSettings validates and clamps,
    // so a legitimate 0% fee or 0% target ROI survives instead of being
    // replaced by the defaults via `|| 13.5`.
    const settings = await getSettings(req.userId!);
    const feePercentage = settings.defaultFee / 100;
    const targetRoi = settings.targetRoi;

    // 2. Lookup Market Prices
    const market = await getMarketData(identity.productName);

    // 3. Calculate Deal dynamically using settings
    const analysis = calculateDeal(market.avgSoldPrice, undefined, feePercentage, targetRoi);

    res.status(200).json({
      ...identity,
      marketData: market,
      analysis
    });
  } catch (error) {
    console.error('Route Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Analytics endpoint
router.get('/analytics', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = await getAnalytics(req.userId!);
    res.status(200).json(data);
  } catch (error) {
    console.error('Analytics Route Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Settings endpoints
router.get('/settings', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = await getSettings(req.userId!);
    res.status(200).json(data);
  } catch (error) {
    console.error('Settings Route Error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.post('/settings', requireAuth, validateBody(settingsSchema), async (req: Request, res: Response) => {
  try {
    const updatedData = await updateSettings(req.userId!, req.body);
    res.status(200).json(updatedData);
  } catch (error) {
    console.error('Settings Route Error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Inventory endpoints (Database integration)
router.get('/inventory', requireAuth, async (req: Request, res: Response) => {
  try {
    const items = await getInventoryItems(req.userId!);
    res.status(200).json(items);
  } catch (error) {
    console.error('Inventory GET Error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

router.post('/inventory', requireAuth, validateBody(inventoryItemSchema), async (req: Request, res: Response) => {
  try {
    const savedItem = await saveInventoryItem(req.userId!, req.body);
    res.status(200).json(savedItem);
  } catch (error) {
    console.error('Inventory POST Error:', error);
    res.status(500).json({ error: 'Failed to save inventory item' });
  }
});

router.delete('/inventory/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    // parseInt with no guard accepted "abc" as NaN (matching nothing, so a 404
    // for what is really a bad request) and "5x" as 5 (deleting item 5).
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Item id must be an integer' });
    }

    const success = await deleteInventoryItem(req.userId!, id);
    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    console.error('Inventory DELETE Error:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

// Copywriting generator endpoint
router.post('/generate-listing', requireAuth, validateBody(generateListingSchema), async (req: Request, res: Response) => {
  try {
    const { productName, category, condition } = req.body;
    const listing = await generateListing(productName, category || 'General', condition || 'LIKE NEW');
    res.status(200).json(listing);
  } catch (error) {
    console.error('Listing Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate copy writing' });
  }
});

export default router;
