import { Router } from 'express';

const router = Router();

// In-memory or local config fallback for settings
let settings = {
  dataStreams: {
    ebay: true,
    amazon: true,
    mercari: false
  },
  financials: {
    defaultFeePercent: 13.5,
    targetRoiPercent: 45.0
  },
  shippingPresets: [
    { id: '1', name: 'Standard Light (Under 1lb)', rate: 4.25, type: 'Flat' },
    { id: '2', name: 'Heavy Cargo (10lb+)', rate: 20.0, type: 'UPS' }
  ]
};

router.get('/', (req, res) => {
  res.json(settings);
});

router.post('/', (req, res) => {
  const { dataStreams, financials, shippingPresets } = req.body;
  if (dataStreams) settings.dataStreams = dataStreams;
  if (financials) settings.financials = financials;
  if (shippingPresets) settings.shippingPresets = shippingPresets;
  res.json({ success: true, settings });
});

export default router;
