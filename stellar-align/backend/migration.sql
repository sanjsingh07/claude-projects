-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE', 'APPLE');

-- CreateEnum
CREATE TYPE "ZodiacSign" AS ENUM ('ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES');

-- CreateEnum
CREATE TYPE "HouseSystem" AS ENUM ('PLACIDUS', 'KOCH', 'WHOLE_SIGN', 'EQUAL', 'PORPHYRY');

-- CreateEnum
CREATE TYPE "ZodiacType" AS ENUM ('TROPICAL', 'SIDEREAL');

-- CreateEnum
CREATE TYPE "AyanamsaType" AS ENUM ('LAHIRI', 'RAMAN', 'KRISHNAMURTI', 'FAGAN_BRADLEY');

-- CreateEnum
CREATE TYPE "DivisionalChartType" AS ENUM ('D1', 'D2', 'D4', 'D9', 'D10', 'D11');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "GeneratedBy" AS ENUM ('CLAUDE', 'RULE_BASED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT');

-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "role",
ADD COLUMN     "role" "ChatRole" NOT NULL;

-- AlterTable
ALTER TABLE "ContentTemplate" DROP COLUMN "sign",
ADD COLUMN     "sign" "ZodiacSign";

-- AlterTable
ALTER TABLE "DailyHoroscope" DROP COLUMN "moonSign",
ADD COLUMN     "moonSign" "ZodiacSign",
DROP COLUMN "generatedBy",
ADD COLUMN     "generatedBy" "GeneratedBy" NOT NULL DEFAULT 'CLAUDE';

-- AlterTable
ALTER TABLE "DivisionalChart" DROP COLUMN "chartType",
ADD COLUMN     "chartType" "DivisionalChartType" NOT NULL,
DROP COLUMN "ascendant",
ADD COLUMN     "ascendant" "ZodiacSign" NOT NULL;

-- AlterTable
ALTER TABLE "Friendship" DROP COLUMN "status",
ADD COLUMN     "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "NatalChart" DROP COLUMN "sunSign",
ADD COLUMN     "sunSign" "ZodiacSign" NOT NULL,
DROP COLUMN "moonSign",
ADD COLUMN     "moonSign" "ZodiacSign" NOT NULL,
DROP COLUMN "risingSign",
ADD COLUMN     "risingSign" "ZodiacSign",
DROP COLUMN "houseSystem",
ADD COLUMN     "houseSystem" "HouseSystem" NOT NULL DEFAULT 'PLACIDUS',
DROP COLUMN "ayanamsa",
ADD COLUMN     "ayanamsa" "AyanamsaType" NOT NULL DEFAULT 'LAHIRI',
DROP COLUMN "zodiacType",
ADD COLUMN     "zodiacType" "ZodiacType" NOT NULL DEFAULT 'SIDEREAL';

-- AlterTable
ALTER TABLE "Transit" DROP COLUMN "targetSign",
ADD COLUMN     "targetSign" "ZodiacSign";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "authProvider",
ADD COLUMN     "authProvider" "AuthProvider" NOT NULL DEFAULT 'EMAIL';

-- CreateIndex
CREATE INDEX "ContentTemplate_category_sign_idx" ON "ContentTemplate"("category", "sign");

-- CreateIndex
CREATE INDEX "DivisionalChart_chartType_idx" ON "DivisionalChart"("chartType");

-- CreateIndex
CREATE INDEX "Friendship_status_idx" ON "Friendship"("status");

-- CreateIndex
CREATE INDEX "NatalChart_sunSign_moonSign_risingSign_idx" ON "NatalChart"("sunSign", "moonSign", "risingSign");

-- CreateIndex
CREATE INDEX "User_authProvider_providerId_idx" ON "User"("authProvider", "providerId");

