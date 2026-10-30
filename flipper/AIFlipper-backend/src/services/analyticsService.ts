import { pool } from '../db/pool';

// Iteration 6: honest analytics. The previous implementation seeded every KPI
// with mockup constants — BASE_PROFIT = 12576.80 and BASE_INV_VALUE = 43466.00
// were *added* to real numbers so a brand-new account still showed "$12,842"
// total profit, and avgRoi/sellThrough fell back to the literal 142.0 / 88.4
// from the design comps. topSourcing and highMarginFlips were fully static
// arrays with stock-photo URLs. None of it was real.
//
// This version computes everything from the inventory_items table. Realized
// profit uses the sold_* columns the schema already carries (migration 001):
//   profit = sold_price − buy_price − actual_fees_paid − shipping_cost_paid
// where the fee/shipping columns fall back to the estimate when a sale was
// logged without them. Where there is genuinely no data — a new user who has
// sold nothing — the honest answer is zero and an empty array, and the UI shows
// an empty state rather than a fabricated dashboard.

// Same estimate the shared calculator uses, for sold items logged without an
// explicit shipping cost. Kept local so this service doesn't depend on the
// calculator's internals.
const ESTIMATED_SHIPPING = 20.9;

interface AnalyticsResult {
  hero: { totalProfit: number; trendPercentage: number; sparkline: number[] };
  secondary: { grossInventoryValue: number; avgRoi: number; sellThroughRate: number };
  profitByCategory: Array<{ category: string; amount: number; percentage: number }>;
  topSourcing: Array<{ rank: string; location: string; activePickups: number; amount: string }>;
  highMarginFlips: Array<{ name: string; imageUrl: string; margin: string; trend: string }>;
}

const round2 = (n: number): number => parseFloat(n.toFixed(2));

// Realized profit on a sold row. sold_price is authoritative; fees and shipping
// use the actuals when present and fall back to the estimate otherwise. A row
// marked Sold with no sold_price yields 0 (nothing to realize yet).
const realizedProfit = (r: {
  sold_price: number | null;
  buy_price: number;
  actual_fees_paid: number | null;
  shipping_cost_paid: number | null;
}): number => {
  if (r.sold_price === null) return 0;
  const fees = r.actual_fees_paid ?? 0;
  const shipping = r.shipping_cost_paid ?? ESTIMATED_SHIPPING;
  return r.sold_price - r.buy_price - fees - shipping;
};

const compactMoney = (n: number): string => {
  const sign = n < 0 ? '-' : '+';
  const abs = Math.abs(n);
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
};

export const getAnalytics = async (userId: number): Promise<AnalyticsResult> => {
  // One pass over the user's live rows. Everything below is derived from this;
  // no constants are added to the results.
  const { rows } = await pool.query(
    `SELECT product_name, category, image_url, status, buy_price, roi,
            sold_price, sold_at, actual_fees_paid, shipping_cost_paid, source_location
       FROM inventory_items
      WHERE user_id = $1 AND deleted_at IS NULL`,
    [userId]
  );

  const totalItems = rows.length;
  const soldRows = rows.filter((r) => r.status === 'Sold' && r.sold_price !== null);
  const openRows = rows.filter((r) => r.status === 'Listed' || r.status === 'Pending');

  // --- Hero: realized profit + a sparkline/trend from sold_at buckets ---
  const totalProfit = round2(soldRows.reduce((sum, r) => sum + realizedProfit(r), 0));

  // Sparkline: profit bucketed into the last 8 weeks by sold_at, oldest→newest.
  // Weeks with no sales are genuine zeros. An account with no dated sales gets an
  // empty array and the UI renders no bars rather than a decorative wave.
  const dated = soldRows
    .filter((r) => r.sold_at)
    .map((r) => ({ when: new Date(r.sold_at).getTime(), profit: realizedProfit(r) }))
    .filter((r) => Number.isFinite(r.when));

  let sparkline: number[] = [];
  let trendPercentage = 0;
  if (dated.length > 0) {
    const WEEKS = 8;
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const buckets = new Array(WEEKS).fill(0);
    for (const d of dated) {
      const weeksAgo = Math.floor((now - d.when) / weekMs);
      if (weeksAgo >= 0 && weeksAgo < WEEKS) {
        buckets[WEEKS - 1 - weeksAgo] += d.profit;
      }
    }
    sparkline = buckets.map((v) => round2(v));

    // Trend: last bucket vs the previous one, as a percentage. Only meaningful
    // when the earlier week had activity; otherwise report 0 rather than a
    // divide-by-zero "Infinity%".
    const last = buckets[WEEKS - 1];
    const prev = buckets[WEEKS - 2];
    if (prev > 0) {
      trendPercentage = parseFloat((((last - prev) / prev) * 100).toFixed(1));
    }
  }

  // --- Secondary KPIs ---
  const grossInventoryValue = round2(openRows.reduce((sum, r) => sum + Number(r.buy_price), 0));

  // avgRoi over sold items only — realized ROI is the honest figure. Uses the
  // roi already stored on the row (computed by the shared calculator at save).
  const soldWithRoi = soldRows.filter((r) => Number.isFinite(Number(r.roi)) && Number(r.roi) !== 0);
  const avgRoi =
    soldWithRoi.length > 0
      ? parseFloat((soldWithRoi.reduce((s, r) => s + Number(r.roi), 0) / soldWithRoi.length).toFixed(1))
      : 0;

  const sellThroughRate =
    totalItems > 0 ? parseFloat(((soldRows.length / totalItems) * 100).toFixed(1)) : 0;

  // --- Profit by category (sold items only, real categories) ---
  const byCat = new Map<string, number>();
  for (const r of soldRows) {
    const cat = (r.category || 'Uncategorized').trim() || 'Uncategorized';
    byCat.set(cat, (byCat.get(cat) ?? 0) + realizedProfit(r));
  }
  const catEntries = [...byCat.entries()]
    .map(([category, amount]) => ({ category, amount: round2(amount) }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  const catTotal = catEntries.reduce((s, c) => s + c.amount, 0);
  const profitByCategory = catEntries.map((c) => ({
    ...c,
    percentage: catTotal > 0 ? Math.round((c.amount / catTotal) * 100) : 0,
  }));

  // --- Top sourcing (from source_location on sold items) ---
  const bySrc = new Map<string, { count: number; profit: number }>();
  for (const r of soldRows) {
    const loc = (r.source_location || '').trim();
    if (!loc) continue;
    const cur = bySrc.get(loc) ?? { count: 0, profit: 0 };
    cur.count += 1;
    cur.profit += realizedProfit(r);
    bySrc.set(loc, cur);
  }
  const topSourcing = [...bySrc.entries()]
    .sort((a, b) => b[1].profit - a[1].profit)
    .slice(0, 3)
    .map(([location, v], i) => ({
      rank: String(i + 1).padStart(2, '0'),
      location,
      activePickups: v.count,
      amount: compactMoney(v.profit),
    }));

  // --- High-margin flips (sold items ranked by realized margin %) ---
  const highMarginFlips = soldRows
    .map((r) => {
      const profit = realizedProfit(r);
      const marginPct = r.sold_price && Number(r.sold_price) > 0 ? (profit / Number(r.sold_price)) * 100 : 0;
      return {
        name: r.product_name as string,
        imageUrl: (r.image_url as string) || '',
        marginPct,
      };
    })
    .filter((f) => f.marginPct > 0)
    .sort((a, b) => b.marginPct - a.marginPct)
    .slice(0, 5)
    .map((f) => ({
      name: f.name,
      imageUrl: f.imageUrl,
      margin: `${f.marginPct.toFixed(0)}%`,
      trend: '↗',
    }));

  return {
    hero: { totalProfit, trendPercentage, sparkline },
    secondary: { grossInventoryValue, avgRoi, sellThroughRate },
    profitByCategory,
    topSourcing,
    highMarginFlips,
  };
};
