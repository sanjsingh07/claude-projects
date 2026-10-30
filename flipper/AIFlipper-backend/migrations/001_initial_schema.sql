-- Iteration 3: replace the JSON file store with a real relational schema.
-- Money is numeric(12,2) (never float); ids are bigserial (no more Date.now()
-- collisions); rows carry created_at/updated_at/deleted_at.

-- Users. Iteration 3 runs single-tenant: one seeded local user (id 1) so that
-- settings and inventory have an owner to reference. Iteration 4 adds
-- password_hash + real auth via a later migration and starts scoping by user_id.
CREATE TABLE users (
  id          bigserial PRIMARY KEY,
  email       text UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO users (id, email) VALUES (1, 'local@aiflipper.app');
-- Advance the id sequence past the hand-inserted row so the next real user
-- (Iteration 4) doesn't collide with id 1.
SELECT setval(pg_get_serial_sequence('users', 'id'), 1, true);

-- Settings — one row per user. Booleans and clamped numerics mirror the shared
-- Settings type; the service still coerces on write, this is defense in depth.
CREATE TABLE settings (
  user_id        bigint PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  ebay_active    boolean NOT NULL DEFAULT true,
  amazon_active  boolean NOT NULL DEFAULT true,
  mercari_active boolean NOT NULL DEFAULT false,
  default_fee    numeric(5,2) NOT NULL DEFAULT 13.5,
  target_roi     numeric(6,2) NOT NULL DEFAULT 45.0,
  price_drops    boolean NOT NULL DEFAULT true,
  high_demand    boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

INSERT INTO settings (user_id) VALUES (1);

-- Inventory. The verdict/status CHECKs enforce the shared string unions at the
-- database level. The sold_*, source_location, platform, actual_fees_paid,
-- shipping_cost_paid, notes and quantity columns are the fields the UI already
-- implies; Iteration 6 (honest analytics) reads them instead of mockup constants.
CREATE TABLE inventory_items (
  id                 bigserial PRIMARY KEY,
  user_id            bigint NOT NULL DEFAULT 1 REFERENCES users(id) ON DELETE CASCADE,
  product_name       text NOT NULL DEFAULT 'Unknown Item',
  category           text NOT NULL DEFAULT 'General',
  image_url          text NOT NULL DEFAULT '',
  condition          text NOT NULL DEFAULT 'LIKE NEW',
  buy_price          numeric(12,2) NOT NULL DEFAULT 0,
  avg_sold_price     numeric(12,2) NOT NULL DEFAULT 0,
  estimated_profit   numeric(12,2) NOT NULL DEFAULT 0,
  roi                numeric(10,2) NOT NULL DEFAULT 0,
  verdict            text NOT NULL DEFAULT 'BUY'    CHECK (verdict IN ('BUY','RISKY','PASS')),
  status             text NOT NULL DEFAULT 'Listed' CHECK (status  IN ('Listed','Sold','Pending')),
  quantity           integer NOT NULL DEFAULT 1,
  source_location    text,
  platform           text,
  sold_price         numeric(12,2),
  sold_at            timestamptz,
  actual_fees_paid   numeric(12,2),
  shipping_cost_paid numeric(12,2),
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  deleted_at         timestamptz
);

-- Every read filters (user_id, deleted_at IS NULL) and orders by created_at.
CREATE INDEX idx_inventory_user_live ON inventory_items (user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_created ON inventory_items (created_at DESC);
