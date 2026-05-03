-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE', 'APPLE');
CREATE TYPE "ZodiacSign" AS ENUM ('ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES');
CREATE TYPE "HouseSystem" AS ENUM ('PLACIDUS', 'KOCH', 'WHOLE_SIGN', 'EQUAL', 'PORPHYRY');
CREATE TYPE "ZodiacType" AS ENUM ('TROPICAL', 'SIDEREAL');
CREATE TYPE "AyanamsaType" AS ENUM ('LAHIRI', 'RAMAN', 'KRISHNAMURTI', 'FAGAN_BRADLEY');
CREATE TYPE "DivisionalChartType" AS ENUM ('D1', 'D2', 'D4', 'D9', 'D10', 'D11');
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED');
CREATE TYPE "GeneratedBy" AS ENUM ('CLAUDE', 'RULE_BASED', 'SYSTEM');
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT');

-- User
ALTER TABLE "User" 
  ALTER COLUMN "authProvider" DROP DEFAULT,
  ALTER COLUMN "authProvider" TYPE "AuthProvider" USING UPPER("authProvider")::"AuthProvider",
  ALTER COLUMN "authProvider" SET DEFAULT 'EMAIL';

-- NatalChart
ALTER TABLE "NatalChart" 
  ALTER COLUMN "sunSign" TYPE "ZodiacSign" USING UPPER("sunSign")::"ZodiacSign",
  ALTER COLUMN "moonSign" TYPE "ZodiacSign" USING UPPER("moonSign")::"ZodiacSign",
  ALTER COLUMN "risingSign" TYPE "ZodiacSign" USING (CASE WHEN "risingSign" IS NOT NULL THEN UPPER("risingSign")::"ZodiacSign" ELSE NULL END),
  ALTER COLUMN "houseSystem" DROP DEFAULT,
  ALTER COLUMN "houseSystem" TYPE "HouseSystem" USING (
    CASE 
      WHEN UPPER("houseSystem") = 'WHOLE' THEN 'WHOLE_SIGN'::"HouseSystem"
      ELSE UPPER("houseSystem")::"HouseSystem"
    END
  ),
  ALTER COLUMN "houseSystem" SET DEFAULT 'PLACIDUS',
  ALTER COLUMN "ayanamsa" DROP DEFAULT,
  ALTER COLUMN "ayanamsa" TYPE "AyanamsaType" USING (
    CASE 
      WHEN UPPER("ayanamsa") = 'FAGAN-BRADLEY' THEN 'FAGAN_BRADLEY'::"AyanamsaType"
      ELSE UPPER("ayanamsa")::"AyanamsaType"
    END
  ),
  ALTER COLUMN "ayanamsa" SET DEFAULT 'LAHIRI',
  ALTER COLUMN "zodiacType" DROP DEFAULT,
  ALTER COLUMN "zodiacType" TYPE "ZodiacType" USING UPPER("zodiacType")::"ZodiacType",
  ALTER COLUMN "zodiacType" SET DEFAULT 'SIDEREAL';

-- DivisionalChart
ALTER TABLE "DivisionalChart" 
  ALTER COLUMN "chartType" TYPE "DivisionalChartType" USING UPPER("chartType")::"DivisionalChartType",
  ALTER COLUMN "ascendant" TYPE "ZodiacSign" USING UPPER("ascendant")::"ZodiacSign";

-- DailyHoroscope
-- Handle 'unknown' first
UPDATE "DailyHoroscope" SET "moonSign" = NULL WHERE "moonSign" = 'unknown' OR "moonSign" = 'UNKNOWN';

ALTER TABLE "DailyHoroscope" 
  ALTER COLUMN "moonSign" TYPE "ZodiacSign" USING (CASE WHEN "moonSign" IS NOT NULL THEN UPPER("moonSign")::"ZodiacSign" ELSE NULL END),
  ALTER COLUMN "generatedBy" DROP DEFAULT,
  ALTER COLUMN "generatedBy" TYPE "GeneratedBy" USING (
    CASE 
      WHEN UPPER("generatedBy") = 'AI' THEN 'CLAUDE'::"GeneratedBy"
      ELSE UPPER("generatedBy")::"GeneratedBy"
    END
  ),
  ALTER COLUMN "generatedBy" SET DEFAULT 'CLAUDE';

-- Friendship
ALTER TABLE "Friendship" 
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "FriendshipStatus" USING UPPER("status")::"FriendshipStatus",
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- ChatMessage
ALTER TABLE "ChatMessage" 
  ALTER COLUMN "role" TYPE "ChatRole" USING UPPER("role")::"ChatRole";

-- ContentTemplate
ALTER TABLE "ContentTemplate" 
  ALTER COLUMN "sign" TYPE "ZodiacSign" USING (CASE WHEN "sign" IS NOT NULL THEN UPPER("sign")::"ZodiacSign" ELSE NULL END);

-- Transit
ALTER TABLE "Transit" 
  ALTER COLUMN "targetSign" TYPE "ZodiacSign" USING (CASE WHEN "targetSign" IS NOT NULL THEN UPPER("targetSign")::"ZodiacSign" ELSE NULL END);

-- Re-create indexes if needed (Prisma might have dropped them if they were on changed columns)
-- Actually, ALTER COLUMN usually keeps indexes in Postgres unless the column is dropped.
-- But let's verify if they need to be re-created based on the diff output.
-- The diff output showed dropping and adding columns, which drops indexes.
-- Since I am ALTERING, the indexes should remain, but let's check if names changed or anything.

-- Re-run npx prisma generate after this.
