-- Iteration 4: real authentication. Users get a bcrypt password hash; every data
-- route starts scoping by the authenticated user_id instead of the seeded id 1.
--
-- The id-1 'local@aiflipper.app' row seeded in 001 keeps the migrated legacy
-- inventory owned by someone. It has no password_hash, so it can never be logged
-- into — it's demo data, not an account. New registrations get fresh ids.

ALTER TABLE users ADD COLUMN password_hash text;

-- Real accounts must have an email; the legacy row already does. Enforce it going
-- forward without rejecting the seeded row (which is non-null anyway).
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
