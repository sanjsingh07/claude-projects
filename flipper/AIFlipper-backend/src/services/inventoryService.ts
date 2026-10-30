import { pool } from '../db/pool';
import { InventoryItem } from '@flipper/shared';

// Iteration 4: every function takes the authenticated user's id and scopes its
// query by it, so no request can read or mutate another user's rows. The legacy
// import still owns its rows under user 1 (the seeded, non-loginable demo user).
const LEGACY_USER_ID = 1;

const VERDICTS = ['BUY', 'RISKY', 'PASS'] as const;
const STATUSES = ['Listed', 'Sold', 'Pending'] as const;

// Nothing upstream guarantees POST /inventory sends a number for a price or a
// recognised status. A bad status silently excluded the row from every analytics
// filter; a string price broke the analytics reductions outright.
const num = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
};

// Nullable money: an omitted or unparseable value becomes NULL (the column is
// nullable) rather than 0, so analytics can tell "not recorded" from "recorded
// as zero". A logged $0 fee is a real datum; a missing one must not masquerade
// as it.
const numOrNull = (value: unknown): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
};

const textOrNull = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const oneOf = <T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value) : fallback;

// DB rows are snake_case; numeric/bigint columns are already parsed to JS numbers
// by the type parsers in pool.ts. Map to the shared camelCase InventoryItem. The
// extra columns (sold_price, source_location, ...) aren't part of InventoryItem
// yet, so Iteration 3 doesn't surface them.
const rowToItem = (row: {
  id: number;
  product_name: string;
  category: string;
  image_url: string;
  condition: string;
  buy_price: number;
  avg_sold_price: number;
  estimated_profit: number;
  roi: number;
  verdict: InventoryItem['verdict'];
  status: InventoryItem['status'];
  created_at: Date | string;
  sold_price: number | null;
  sold_at: Date | string | null;
  actual_fees_paid: number | null;
  shipping_cost_paid: number | null;
  source_location: string | null;
}): InventoryItem => ({
  id: row.id,
  productName: row.product_name,
  category: row.category,
  imageUrl: row.image_url,
  condition: row.condition,
  buyPrice: row.buy_price,
  avgSoldPrice: row.avg_sold_price,
  estimatedProfit: row.estimated_profit,
  roi: row.roi,
  verdict: row.verdict,
  status: row.status,
  createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  soldPrice: row.sold_price,
  soldAt: row.sold_at instanceof Date ? row.sold_at.toISOString() : row.sold_at,
  actualFeesPaid: row.actual_fees_paid,
  shippingCostPaid: row.shipping_cost_paid,
  sourceLocation: row.source_location,
});

export const getInventoryItems = async (userId: number): Promise<InventoryItem[]> => {
  const { rows } = await pool.query(
    `SELECT * FROM inventory_items
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC`,
    [userId]
  );
  return rows.map(rowToItem);
};

export const saveInventoryItem = async (userId: number, item: Partial<InventoryItem>): Promise<InventoryItem> => {
  const status = oneOf(item.status, STATUSES, 'Listed');

  // Sold-detail fields feed Iteration 6 analytics. They're only meaningful for a
  // Sold item; if the status isn't Sold we null them all so a later status
  // change back to Listed doesn't leave stale realized-sale data behind. When an
  // item IS sold and a sale price was given but no explicit sold_at, stamp it now
  // (via COALESCE with now() in the SQL below) so it lands in the trend buckets.
  const isSold = status === 'Sold';
  const soldPrice = isSold ? numOrNull(item.soldPrice) : null;
  const soldAt = isSold ? textOrNull(item.soldAt) : null; // ISO string or null
  const actualFeesPaid = isSold ? numOrNull(item.actualFeesPaid) : null;
  const shippingCostPaid = isSold ? numOrNull(item.shippingCostPaid) : null;
  // source_location is useful on any item (where it was picked up), not just sold.
  const sourceLocation = textOrNull(item.sourceLocation);

  const fields = {
    productName: item.productName || 'Unknown Item',
    category: item.category || 'General',
    imageUrl: item.imageUrl || '',
    condition: item.condition || 'LIKE NEW',
    buyPrice: num(item.buyPrice),
    avgSoldPrice: num(item.avgSoldPrice),
    estimatedProfit: num(item.estimatedProfit),
    roi: num(item.roi),
    verdict: oneOf(item.verdict, VERDICTS, 'BUY'),
    status,
    soldPrice,
    soldAt,
    actualFeesPaid,
    shippingCostPaid,
    sourceLocation,
  };

  // A client editing an item it already holds sends that item's id — upsert so
  // the edit updates in place (and un-deletes, if it was soft-deleted) rather
  // than creating a duplicate. A new scan sends no id and gets a fresh bigserial.
  if (typeof item.id === 'number' && Number.isFinite(item.id)) {
    // The WHERE on the UPDATE half of the upsert scopes by user_id, so a client
    // sending someone else's row id cannot overwrite it — the ON CONFLICT match
    // updates nothing it doesn't own. A brand-new id from this user inserts
    // normally. (The INSERT half always stamps the caller's user_id.)
    const { rows } = await pool.query(
      `INSERT INTO inventory_items
         (id, user_id, product_name, category, image_url, condition,
          buy_price, avg_sold_price, estimated_profit, roi, verdict, status,
          sold_price, sold_at, actual_fees_paid, shipping_cost_paid, source_location)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
               $13,
               COALESCE($14::timestamptz, CASE WHEN $13::numeric IS NOT NULL THEN now() END),
               $15,$16,$17)
       ON CONFLICT (id) DO UPDATE SET
         product_name = EXCLUDED.product_name,
         category = EXCLUDED.category,
         image_url = EXCLUDED.image_url,
         condition = EXCLUDED.condition,
         buy_price = EXCLUDED.buy_price,
         avg_sold_price = EXCLUDED.avg_sold_price,
         estimated_profit = EXCLUDED.estimated_profit,
         roi = EXCLUDED.roi,
         verdict = EXCLUDED.verdict,
         status = EXCLUDED.status,
         sold_price = EXCLUDED.sold_price,
         sold_at = EXCLUDED.sold_at,
         actual_fees_paid = EXCLUDED.actual_fees_paid,
         shipping_cost_paid = EXCLUDED.shipping_cost_paid,
         source_location = EXCLUDED.source_location,
         updated_at = now(),
         deleted_at = NULL
       WHERE inventory_items.user_id = $2
       RETURNING *`,
      [item.id, userId, fields.productName, fields.category, fields.imageUrl,
       fields.condition, fields.buyPrice, fields.avgSoldPrice, fields.estimatedProfit,
       fields.roi, fields.verdict, fields.status,
       fields.soldPrice, fields.soldAt, fields.actualFeesPaid,
       fields.shippingCostPaid, fields.sourceLocation]
    );
    // Zero rows means the id exists but belongs to another user (the WHERE
    // filtered the update out). Treat it as a fresh insert for this user rather
    // than leaking that the id is taken.
    if (rows.length > 0) return rowToItem(rows[0]);
  }

  const { rows } = await pool.query(
    `INSERT INTO inventory_items
       (user_id, product_name, category, image_url, condition,
        buy_price, avg_sold_price, estimated_profit, roi, verdict, status,
        sold_price, sold_at, actual_fees_paid, shipping_cost_paid, source_location)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
             $12,
             COALESCE($13::timestamptz, CASE WHEN $12::numeric IS NOT NULL THEN now() END),
             $14,$15,$16)
     RETURNING *`,
    [userId, fields.productName, fields.category, fields.imageUrl, fields.condition,
     fields.buyPrice, fields.avgSoldPrice, fields.estimatedProfit, fields.roi,
     fields.verdict, fields.status,
     fields.soldPrice, fields.soldAt, fields.actualFeesPaid,
     fields.shippingCostPaid, fields.sourceLocation]
  );
  return rowToItem(rows[0]);
};

export const deleteInventoryItem = async (userId: number, id: number): Promise<boolean> => {
  // Soft delete: keep the row (analytics history, future audit) and let every
  // read filter it out via deleted_at IS NULL. Scoped by user_id so one user
  // can't delete another's item. rowCount is 0 when the id doesn't exist, was
  // already deleted, or isn't theirs — which the route turns into a 404.
  const { rowCount } = await pool.query(
    `UPDATE inventory_items SET deleted_at = now(), updated_at = now()
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    [id, userId]
  );
  return (rowCount ?? 0) > 0;
};

/**
 * One-time seed of a fresh database from the pre-Postgres inventory.json. Called
 * by initDb only when the table is empty. Preserves each row's original id and
 * createdAt so the migrated demo data is identical to the old app, reusing the
 * same coercion as the live API so a hand-edited JSON row can't insert a bad
 * status or a string price. Realigns the id sequence afterwards so the next
 * generated id can't collide with a preserved one.
 */
export const insertLegacyItems = async (rawItems: unknown[]): Promise<number> => {
  const withId = `INSERT INTO inventory_items
      (id, user_id, product_name, category, image_url, condition,
       buy_price, avg_sold_price, estimated_profit, roi, verdict, status, created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (id) DO NOTHING`;
  const withoutId = `INSERT INTO inventory_items
      (user_id, product_name, category, image_url, condition,
       buy_price, avg_sold_price, estimated_profit, roi, verdict, status, created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`;

  const client = await pool.connect();
  let inserted = 0;
  try {
    await client.query('BEGIN');
    for (const raw of rawItems) {
      const item = (raw ?? {}) as Record<string, unknown>;
      const id = typeof item.id === 'number' && Number.isFinite(item.id) ? item.id : null;
      const createdAt = typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString();
      const common = [
        LEGACY_USER_ID,
        item.productName || 'Unknown Item',
        item.category || 'General',
        item.imageUrl || '',
        item.condition || 'LIKE NEW',
        num(item.buyPrice),
        num(item.avgSoldPrice),
        num(item.estimatedProfit),
        num(item.roi),
        oneOf(item.verdict, VERDICTS, 'BUY'),
        oneOf(item.status, STATUSES, 'Listed'),
        createdAt,
      ];
      if (id !== null) {
        await client.query(withId, [id, ...common]);
      } else {
        await client.query(withoutId, common);
      }
      inserted++;
    }
    // Move the serial past the largest explicitly-inserted id.
    await client.query(
      `SELECT setval(pg_get_serial_sequence('inventory_items','id'),
                     GREATEST((SELECT COALESCE(max(id), 1) FROM inventory_items), 1))`
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return inserted;
};
