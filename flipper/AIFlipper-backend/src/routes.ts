import { Router, Request, Response } from 'express';
import { identifyImage } from './services/visionService';
import { getMarketData } from './services/marketService';
import { calculateDeal } from './services/calculatorService';
import { getAnalytics } from './services/analyticsService';
import { getSettings, updateSettings } from './services/settingsService';
import { getInventoryItems, saveInventoryItem, deleteInventoryItem } from './services/inventoryService';
import { generateListing } from './services/listingService';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Identification & Analysis endpoint
router.post('/identify', async (req: Request, res: Response) => {
  try {
    const { image, productName: manualName } = req.body;
    
    let identity;
    if (manualName) {
      identity = { productName: manualName, category: 'Manual Entry' };
    } else {
      if (!image) {
        return res.status(400).json({ error: 'No image data or product name provided' });
      }
      identity = await identifyImage(image);
    }
    
    // 1. Fetch user algorithms from settings
    const settings = getSettings();
    const feePercentage = (settings.defaultFee || 13.5) / 100;
    const targetRoi = settings.targetRoi || 45.0;

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
router.get('/analytics', (req: Request, res: Response) => {
  try {
    const data = getAnalytics();
    res.status(200).json(data);
  } catch (error) {
    console.error('Analytics Route Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Settings endpoints
router.get('/settings', (req: Request, res: Response) => {
  try {
    const data = getSettings();
    res.status(200).json(data);
  } catch (error) {
    console.error('Settings Route Error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.post('/settings', (req: Request, res: Response) => {
  try {
    const updatedData = updateSettings(req.body);
    res.status(200).json(updatedData);
  } catch (error) {
    console.error('Settings Route Error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Inventory endpoints (Database integration)
router.get('/inventory', (req: Request, res: Response) => {
  try {
    const items = getInventoryItems();
    res.status(200).json(items);
  } catch (error) {
    console.error('Inventory GET Error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

router.post('/inventory', (req: Request, res: Response) => {
  try {
    const savedItem = saveInventoryItem(req.body);
    res.status(200).json(savedItem);
  } catch (error) {
    console.error('Inventory POST Error:', error);
    res.status(500).json({ error: 'Failed to save inventory item' });
  }
});

router.delete('/inventory/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const success = deleteInventoryItem(id);
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
router.post('/generate-listing', async (req: Request, res: Response) => {
  try {
    const { productName, category, condition } = req.body;
    if (!productName) {
      return res.status(400).json({ error: 'Missing productName parameter' });
    }
    const listing = await generateListing(productName, category || 'General', condition || 'LIKE NEW');
    res.status(200).json(listing);
  } catch (error) {
    console.error('Listing Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate copy writing' });
  }
});

export default router;
