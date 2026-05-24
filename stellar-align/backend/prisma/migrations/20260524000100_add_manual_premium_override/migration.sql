ALTER TABLE "User" ADD COLUMN "manualPremiumOverride" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User"
SET "manualPremiumOverride" = true
WHERE "isPremium" = true
  AND "subscriptionExpiresAt" IS NULL;
