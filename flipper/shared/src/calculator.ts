import type { CalculationResult } from './types';

// The single source of truth for the buy/pass decision. The backend runs this
// per scan (routes.ts) and the client re-runs it live as the user edits the
// purchase cost (ResultScreen). Previously each side had its own copy: the
// client defaulted to a 13.5% fee while the server used 12.9%, and the client
// hardcoded `/1.45` for the max-buy ceiling, silently ignoring the user's
// target ROI. Sharing this function is what makes those disagreements
// impossible.
export const calculateDeal = (
  avgSoldPrice: number,
  userBuyPrice?: number,
  feePercentage: number = 0.129,
  targetRoiPercent: number = 45.0
): CalculationResult => {
  const ESTIMATED_SHIPPING = 20.90;

  // An unvalidated fee or a market lookup that found nothing used to propagate
  // NaN through every field, and JSON.stringify turns NaN into null — the UI
  // rendered "$NaN" or blank for every currency figure with no error anywhere.
  if (!Number.isFinite(avgSoldPrice) || avgSoldPrice <= 0 || !Number.isFinite(feePercentage)) {
    return emptyResult(Number.isFinite(avgSoldPrice) ? avgSoldPrice : 0, ESTIMATED_SHIPPING);
  }

  const safeTargetRoi = Number.isFinite(targetRoiPercent) && targetRoiPercent >= 0 ? targetRoiPercent : 45.0;

  // Convert target ROI to a margin target
  // ROI = profit / cost => profit = cost * ROI => cost = revenue / (1 + ROI)
  // For target ROI of 45%, purchaseCost must be netRevenue / 1.45
  const fees = avgSoldPrice * feePercentage;
  const netRevenue = avgSoldPrice - fees - ESTIMATED_SHIPPING;

  const targetRoiDec = safeTargetRoi / 100;
  const maxBuyPrice = Math.max(0, netRevenue / (1 + targetRoiDec));

  // Fall back to a heuristic buy cost only when the caller supplied none.
  // `|| 50.00` used to fabricate a $50 cost whenever the heuristic produced 0.
  const heuristicCost = parseFloat((avgSoldPrice * 0.4).toFixed(2));
  const purchaseCost = userBuyPrice !== undefined && Number.isFinite(userBuyPrice)
    ? userBuyPrice
    : heuristicCost;

  const estimatedProfit = netRevenue - purchaseCost;

  // A free item with positive profit is an unbounded ROI, not 0% — reporting 0
  // labelled the best possible deal RISKY.
  const roi = purchaseCost > 0
    ? (estimatedProfit / purchaseCost) * 100
    : estimatedProfit > 0 ? Number.MAX_SAFE_INTEGER : 0;

  let verdict: 'BUY' | 'RISKY' | 'PASS' = 'PASS';
  if (roi >= safeTargetRoi && estimatedProfit > 0) {
    verdict = 'BUY';
  } else if (estimatedProfit > 0) {
    verdict = 'RISKY';
  }

  let confidence: 'Strong' | 'Medium' | 'Weak' = 'Weak';
  if (roi >= safeTargetRoi + 15) {
    confidence = 'Strong';
  } else if (roi >= 10) {
    confidence = 'Medium';
  }

  // NOTE: `velocity` below is a deterministic function of price and verdict, not
  // a market signal, but it is presented to the user as "SALES VELOCITY".
  // Scheduled for replacement with real sold_at data.
  const baseDays = 3.5;
  const priceFactor = Math.min(10, avgSoldPrice / 100);
  const velocityDays = baseDays + priceFactor + (verdict === 'PASS' ? 15 : verdict === 'RISKY' ? 5 : 0);
  const velocity = `${velocityDays.toFixed(1)} Days`;

  return {
    maxBuyPrice: parseFloat(maxBuyPrice.toFixed(2)),
    estimatedProfit: parseFloat(estimatedProfit.toFixed(2)),
    roi: parseFloat(Math.min(roi, 99999).toFixed(1)),
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

// Returned when there is no usable market price. Every figure is zero and the
// verdict is PASS, which is the honest answer to "should I buy this?" when we
// could not find out what it sells for.
const emptyResult = (avgSold: number, shipping: number): CalculationResult => ({
  maxBuyPrice: 0,
  estimatedProfit: 0,
  roi: 0,
  verdict: 'PASS',
  confidence: 'Weak',
  velocity: 'Unknown',
  breakdown: {
    avgSold,
    fees: 0,
    shipping,
    targetProfit: 0,
    purchaseCost: 0
  }
});
