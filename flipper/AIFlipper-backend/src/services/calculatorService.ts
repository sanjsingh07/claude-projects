export interface CalculationResult {
  maxBuyPrice: number;
  estimatedProfit: number;
  roi: number;
  verdict: 'BUY' | 'RISKY' | 'PASS';
  confidence: 'Strong' | 'Medium' | 'Weak';
  velocity: string;
  breakdown: {
    avgSold: number;
    fees: number;
    shipping: number;
    targetProfit: number;
    purchaseCost: number;
  };
}

export const calculateDeal = (
  avgSoldPrice: number, 
  userBuyPrice?: number,
  feePercentage: number = 0.129,
  targetRoiPercent: number = 45.0
): CalculationResult => {
  const ESTIMATED_SHIPPING = 20.90;
  
  // Convert target ROI to a margin target
  // ROI = profit / cost => profit = cost * ROI => cost = revenue / (1 + ROI)
  // For target ROI of 45%, purchaseCost must be netRevenue / 1.45
  const fees = avgSoldPrice * feePercentage;
  const netRevenue = avgSoldPrice - fees - ESTIMATED_SHIPPING;
  
  const targetRoiDec = targetRoiPercent / 100;
  const maxBuyPrice = Math.max(0, netRevenue / (1 + targetRoiDec));
  
  // Use user input if provided, otherwise default to a reasonable buy cost (approx 40% of avg sold or 50)
  const purchaseCost = userBuyPrice !== undefined 
    ? userBuyPrice 
    : parseFloat((avgSoldPrice * 0.4).toFixed(2)) || 50.00; 
  
  const estimatedProfit = netRevenue - purchaseCost;
  const roi = purchaseCost > 0 ? (estimatedProfit / purchaseCost) * 100 : 0;

  let verdict: 'BUY' | 'RISKY' | 'PASS' = 'PASS';
  if (roi >= targetRoiPercent && estimatedProfit > 0) {
    verdict = 'BUY';
  } else if (estimatedProfit > 0) {
    verdict = 'RISKY';
  }

  let confidence: 'Strong' | 'Medium' | 'Weak' = 'Weak';
  if (roi >= targetRoiPercent + 15) {
    confidence = 'Strong';
  } else if (roi >= 10) {
    confidence = 'Medium';
  }

  // Calculate dynamic sales velocity representation (e.g. 4.2 Days, 12.0 Days)
  // Higher prices or lower margins take slightly longer
  const baseDays = 3.5;
  const priceFactor = Math.min(10, avgSoldPrice / 100);
  const velocityDays = baseDays + priceFactor + (verdict === 'PASS' ? 15 : verdict === 'RISKY' ? 5 : 0);
  const velocity = `${velocityDays.toFixed(1)} Days`;

  return {
    maxBuyPrice: parseFloat(maxBuyPrice.toFixed(2)),
    estimatedProfit: parseFloat(estimatedProfit.toFixed(2)),
    roi: parseFloat(roi.toFixed(1)),
    verdict,
    confidence,
    velocity,
    breakdown: {
      avgSold: avgSoldPrice,
      fees: parseFloat(fees.toFixed(2)),
      shipping: ESTIMATED_SHIPPING,
      targetProfit: parseFloat((maxBuyPrice * targetRoiDec).toFixed(2)),
      purchaseCost: purchaseCost
    }
  };
};
