import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDeal } from './calculator';

// The repo's first tests. They are fixtures: fixed inputs with hand-computed
// outputs. Every number below was worked out by hand from the formula, so if
// the math drifts — or the client and server ever fork their own copies again —
// one of these assertions breaks loudly instead of the app quietly disagreeing
// with itself.

test('a profitable item is a BUY, with exact figures', () => {
  // avgSold 240, buy 50, fee 12.9%, target ROI 45%
  //   fees        = 240 * 0.129            = 30.96
  //   netRevenue  = 240 - 30.96 - 20.90    = 188.14
  //   profit      = 188.14 - 50            = 138.14
  //   roi         = 138.14 / 50 * 100      = 276.3
  //   maxBuy      = 188.14 / 1.45          = 129.75
  const deal = calculateDeal(240, 50, 0.129, 45);
  assert.equal(deal.verdict, 'BUY');
  assert.equal(deal.confidence, 'Strong');
  assert.equal(deal.estimatedProfit, 138.14);
  assert.equal(deal.roi, 276.3);
  assert.equal(deal.maxBuyPrice, 129.75);
  assert.equal(deal.velocity, '5.9 Days');
  assert.equal(deal.breakdown.fees, 30.96);
  assert.equal(deal.breakdown.shipping, 20.9);
});

test('max buy price scales with target ROI (not a hardcoded /1.45)', () => {
  // This is the bug the shared package fixes: ResultScreen hardcoded netRevenue
  // / 1.45 for the ceiling, so changing the target ROI in Settings moved every
  // other number but not the max buy price. Here the ceiling must track it.
  const at45 = calculateDeal(240, 50, 0.129, 45);
  const at100 = calculateDeal(240, 50, 0.129, 100);
  assert.equal(at45.maxBuyPrice, 129.75); // 188.14 / 1.45
  assert.equal(at100.maxBuyPrice, 94.07); // 188.14 / 2.00
  assert.ok(at100.maxBuyPrice < at45.maxBuyPrice);
});

test('a thin margin below the target ROI is RISKY, not BUY', () => {
  // profit is positive (+6.2) but ROI (10.3%) is under the 45% target.
  const deal = calculateDeal(100, 60, 0.129, 45);
  assert.equal(deal.verdict, 'RISKY');
  assert.equal(deal.confidence, 'Medium');
  assert.equal(deal.estimatedProfit, 6.2);
});

test('a loss is a PASS', () => {
  const deal = calculateDeal(100, 90, 0.129, 45);
  assert.equal(deal.verdict, 'PASS');
  assert.equal(deal.estimatedProfit, -23.8);
});

test('no usable market price yields an all-zero PASS, never NaN', () => {
  for (const noPrice of [0, -5, NaN, Infinity]) {
    const deal = calculateDeal(noPrice);
    assert.equal(deal.verdict, 'PASS', `input ${noPrice}`);
    assert.equal(deal.maxBuyPrice, 0);
    assert.equal(deal.estimatedProfit, 0);
    assert.equal(deal.roi, 0);
    assert.equal(deal.velocity, 'Unknown');
    assert.equal(deal.breakdown.shipping, 20.9);
  }
});

test('a free item with positive profit is an unbounded ROI, not 0% (BUY)', () => {
  const deal = calculateDeal(240, 0, 0.129, 45);
  assert.equal(deal.verdict, 'BUY');
  assert.equal(deal.confidence, 'Strong');
  assert.equal(deal.roi, 99999); // clamped, but far above the target — not 0
});

test('a higher platform fee lowers profit (the divergence this package prevents)', () => {
  const low = calculateDeal(240, 50, 0.129, 45);
  const high = calculateDeal(240, 50, 0.2, 45);
  assert.ok(high.estimatedProfit < low.estimatedProfit);
});

test('an omitted buy price falls back to a heuristic, not a fabricated $50', () => {
  // heuristic cost = avgSold * 0.4 = 96, so profit = 188.14 - 96 = 92.14
  const deal = calculateDeal(240, undefined, 0.129, 45);
  assert.equal(deal.breakdown.purchaseCost, 96);
  assert.equal(deal.estimatedProfit, 92.14);
});
