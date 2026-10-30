import 'dotenv/config';
import { Pool, types } from 'pg';

// pg hands NUMERIC (OID 1700) and BIGINT (OID 20) back as strings to avoid the
// precision loss of forcing them through a float. Our money columns are
// numeric(12,2) and our ids are bigserial — both fit safely in a JS number, and
// the shared API contract types them as `number` (InventoryItem.buyPrice, .id,
// Settings.defaultFee, ...). Parse them once here rather than coercing in every
// row mapper. If this app ever grows ids past 2^53 this must revisit, but a
// bigserial starting at 1 will not get there.
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));
types.setTypeParser(20, (val) => (val === null ? null : parseInt(val, 10)));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env and point it at your ' +
      'local Postgres, e.g. postgres://aiflipper:password@localhost:5432/aiflipper'
  );
}

export const pool = new Pool({ connectionString });
