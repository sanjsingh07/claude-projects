import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool } from './pool';

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

/**
 * Applies every migrations/*.sql file that hasn't run yet, in filename order.
 * Numbered prefixes (001_, 002_, ...) make lexical order == chronological order.
 * Each file runs in its own transaction and is recorded in schema_migrations, so
 * a crash leaves the schema either fully at version N or fully at N-1, never
 * half-applied, and re-running is a no-op.
 */
export const runMigrations = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename    text PRIMARY KEY,
        applied_at  timestamptz NOT NULL DEFAULT now()
      )
    `);

    const appliedResult = await client.query<{ filename: string }>(
      'SELECT filename FROM schema_migrations'
    );
    const applied = new Set(appliedResult.rows.map((r) => r.filename));

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`[migrate] applied ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${(err as Error).message}`);
      }
    }
  } finally {
    client.release();
  }
};

// Standalone entry point: `npm run migrate` (ts-node src/db/migrate.ts).
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('[migrate] schema up to date');
      return pool.end();
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
