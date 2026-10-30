import { pool } from '../db/pool';
import { Settings } from '@flipper/shared';

export const DEFAULT_SETTINGS: Settings = {
  ebayActive: true,
  amazonActive: true,
  mercariActive: false,
  defaultFee: 13.5,
  targetRoi: 45.0,
  priceDrops: true,
  highDemand: true,
};

const boolOr = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

// `|| fallback` silently replaces a legitimate 0 — a 0% fee platform became
// 13.5%, and a 0% target ROI became 45%. Validate the type and range instead,
// so only genuinely missing or invalid values fall back.
const numberOr = (value: unknown, fallback: number, min: number, max: number): number => {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

// Reading only known keys is also what stops `POST /settings` from being mass
// assignment — arbitrary client keys can no longer reach the stored object.
export const coerceSettings = (raw: unknown): Settings => {
  const input = (raw ?? {}) as Record<string, unknown>;

  return {
    ebayActive: boolOr(input.ebayActive, DEFAULT_SETTINGS.ebayActive),
    amazonActive: boolOr(input.amazonActive, DEFAULT_SETTINGS.amazonActive),
    mercariActive: boolOr(input.mercariActive, DEFAULT_SETTINGS.mercariActive),
    // A negative target ROI would make `netRevenue / (1 + roi)` divide by zero
    // at -100 and produce an Infinity max-buy-price, which serializes as null.
    defaultFee: numberOr(input.defaultFee, DEFAULT_SETTINGS.defaultFee, 0, 100),
    targetRoi: numberOr(input.targetRoi, DEFAULT_SETTINGS.targetRoi, 0, 1000),
    priceDrops: boolOr(input.priceDrops, DEFAULT_SETTINGS.priceDrops),
    highDemand: boolOr(input.highDemand, DEFAULT_SETTINGS.highDemand),
  };
};

// numeric columns arrive as numbers (pool.ts type parser); map snake_case to the
// shared camelCase Settings shape.
const rowToSettings = (row: {
  ebay_active: boolean;
  amazon_active: boolean;
  mercari_active: boolean;
  default_fee: number;
  target_roi: number;
  price_drops: boolean;
  high_demand: boolean;
}): Settings => ({
  ebayActive: row.ebay_active,
  amazonActive: row.amazon_active,
  mercariActive: row.mercari_active,
  defaultFee: row.default_fee,
  targetRoi: row.target_roi,
  priceDrops: row.price_drops,
  highDemand: row.high_demand,
});

export const getSettings = async (userId: number): Promise<Settings> => {
  const { rows } = await pool.query('SELECT * FROM settings WHERE user_id = $1', [userId]);
  // A registered user gets a settings row at registration; fall back defensively
  // to the defaults rather than throwing if it's somehow missing.
  if (rows.length === 0) return { ...DEFAULT_SETTINGS };
  return coerceSettings(rowToSettings(rows[0]));
};

export const updateSettings = async (userId: number, newSettings: unknown): Promise<Settings> => {
  // `await` is load-bearing: once getSettings returns a Promise, spreading it
  // without awaiting (`{ ...getSettings() }`) yields none of the current fields,
  // so coerceSettings would reset every unspecified setting to its default. This
  // is the silent, no-diagnostic bug the async conversion had to get right.
  const current = await getSettings(userId);
  const input = (newSettings ?? {}) as Record<string, unknown>;

  // Merge only the keys actually supplied, so a partial update doesn't reset the
  // rest to defaults via coerceSettings' per-field fallbacks.
  const merged: Record<string, unknown> = { ...current };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    if (input[key] !== undefined) merged[key] = input[key];
  }

  const updated = coerceSettings(merged);

  await pool.query(
    `INSERT INTO settings
       (user_id, ebay_active, amazon_active, mercari_active,
        default_fee, target_roi, price_drops, high_demand, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())
     ON CONFLICT (user_id) DO UPDATE SET
       ebay_active = EXCLUDED.ebay_active,
       amazon_active = EXCLUDED.amazon_active,
       mercari_active = EXCLUDED.mercari_active,
       default_fee = EXCLUDED.default_fee,
       target_roi = EXCLUDED.target_roi,
       price_drops = EXCLUDED.price_drops,
       high_demand = EXCLUDED.high_demand,
       updated_at = now()`,
    [userId, updated.ebayActive, updated.amazonActive, updated.mercariActive,
     updated.defaultFee, updated.targetRoi, updated.priceDrops, updated.highDemand]
  );

  return updated;
};
