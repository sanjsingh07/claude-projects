/*
  Warnings:

  - You are about to drop the column `houses` on the `DivisionalChart` table. All the data in the column will be lost.
  - You are about to drop the column `planetaryPositions` on the `DivisionalChart` table. All the data in the column will be lost.
  - You are about to drop the column `aspects` on the `NatalChart` table. All the data in the column will be lost.
  - You are about to drop the column `houses` on the `NatalChart` table. All the data in the column will be lost.
  - You are about to drop the column `planetaryPositions` on the `NatalChart` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DivisionalChart" DROP COLUMN "houses",
DROP COLUMN "planetaryPositions";

-- AlterTable
ALTER TABLE "NatalChart" DROP COLUMN "aspects",
DROP COLUMN "houses",
DROP COLUMN "planetaryPositions";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthTimeUnknown" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileCompleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "NatalPlanetPosition" (
    "id" TEXT NOT NULL,
    "natalChartId" TEXT NOT NULL,
    "planet" TEXT NOT NULL,
    "sign" "ZodiacSign" NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL,
    "degree" INTEGER NOT NULL,
    "minute" INTEGER NOT NULL,
    "house" INTEGER,
    "retrograde" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NatalPlanetPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NatalHouseCusp" (
    "id" TEXT NOT NULL,
    "natalChartId" TEXT NOT NULL,
    "house" INTEGER NOT NULL,
    "sign" "ZodiacSign" NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "degree" INTEGER NOT NULL,
    "minute" INTEGER NOT NULL,

    CONSTRAINT "NatalHouseCusp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NatalAspect" (
    "id" TEXT NOT NULL,
    "natalChartId" TEXT NOT NULL,
    "planet1" TEXT NOT NULL,
    "planet2" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "angle" DOUBLE PRECISION NOT NULL,
    "orb" DOUBLE PRECISION NOT NULL,
    "applying" BOOLEAN NOT NULL,

    CONSTRAINT "NatalAspect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DivisionalPlanetPosition" (
    "id" TEXT NOT NULL,
    "divisionalChartId" TEXT NOT NULL,
    "planet" TEXT NOT NULL,
    "sign" "ZodiacSign" NOT NULL,
    "degree" DOUBLE PRECISION NOT NULL,
    "house" INTEGER NOT NULL,
    "retrograde" BOOLEAN NOT NULL DEFAULT false,
    "combust" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DivisionalPlanetPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DivisionalHouseCusp" (
    "id" TEXT NOT NULL,
    "divisionalChartId" TEXT NOT NULL,
    "house" INTEGER NOT NULL,
    "sign" "ZodiacSign" NOT NULL,
    "degree" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DivisionalHouseCusp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NatalPlanetPosition_planet_sign_idx" ON "NatalPlanetPosition"("planet", "sign");

-- CreateIndex
CREATE UNIQUE INDEX "NatalPlanetPosition_natalChartId_planet_key" ON "NatalPlanetPosition"("natalChartId", "planet");

-- CreateIndex
CREATE UNIQUE INDEX "NatalHouseCusp_natalChartId_house_key" ON "NatalHouseCusp"("natalChartId", "house");

-- CreateIndex
CREATE INDEX "NatalAspect_natalChartId_idx" ON "NatalAspect"("natalChartId");

-- CreateIndex
CREATE UNIQUE INDEX "DivisionalPlanetPosition_divisionalChartId_planet_key" ON "DivisionalPlanetPosition"("divisionalChartId", "planet");

-- CreateIndex
CREATE UNIQUE INDEX "DivisionalHouseCusp_divisionalChartId_house_key" ON "DivisionalHouseCusp"("divisionalChartId", "house");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- AddForeignKey
ALTER TABLE "NatalPlanetPosition" ADD CONSTRAINT "NatalPlanetPosition_natalChartId_fkey" FOREIGN KEY ("natalChartId") REFERENCES "NatalChart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NatalHouseCusp" ADD CONSTRAINT "NatalHouseCusp_natalChartId_fkey" FOREIGN KEY ("natalChartId") REFERENCES "NatalChart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NatalAspect" ADD CONSTRAINT "NatalAspect_natalChartId_fkey" FOREIGN KEY ("natalChartId") REFERENCES "NatalChart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DivisionalPlanetPosition" ADD CONSTRAINT "DivisionalPlanetPosition_divisionalChartId_fkey" FOREIGN KEY ("divisionalChartId") REFERENCES "DivisionalChart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DivisionalHouseCusp" ADD CONSTRAINT "DivisionalHouseCusp_divisionalChartId_fkey" FOREIGN KEY ("divisionalChartId") REFERENCES "DivisionalChart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
