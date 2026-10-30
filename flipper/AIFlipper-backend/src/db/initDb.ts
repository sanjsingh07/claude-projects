import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool } from './pool';
import { runMigrations } from './migrate';
import { insertLegacyItems } from '../services/inventoryService';

const LEGACY_INVENTORY = path.join(__dirname, '../../database/inventory.json');

/**
 * One-time import of the pre-Postgres JSON store. Runs only when inventory_items
 * is empty, so a fresh database gets seeded once with the existing demo data and
 * live data is never overwritten on subsequent boots.
 */
const importLegacyInventory = async (): Promise<void> => {
  const countResult = await pool.query<{ count: number }>(
    'SELECT count(*)::int AS count FROM inventory_items'
  );
  if (Number(countResult.rows[0]?.count ?? 0) > 0) return; // already has data
  if (!fs.existsSync(LEGACY_INVENTORY)) return; // nothing to import

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(LEGACY_INVENTORY, 'utf-8'));
  } catch {
    console.warn('[initDb] legacy inventory.json unreadable — skipping import');
    return;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return;

  const imported = await insertLegacyItems(parsed);
  console.log(`[initDb] imported ${imported} legacy inventory item(s) from inventory.json`);
};

/**
 * Runs before the server accepts connections: brings the schema up to date, then
 * seeds a fresh database from the old JSON file. Awaited in index.ts because
 * commonjs has no top-level await and the file-scoped init that used to run at
 * import time can't be async.
 */
export const initDb = async (): Promise<void> => {
  await runMigrations();
  await importLegacyInventory();
};
