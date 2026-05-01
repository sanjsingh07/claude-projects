-- AlterTable
ALTER TABLE "NatalChart" ADD COLUMN     "ayanamsa" TEXT NOT NULL DEFAULT 'lahiri',
ADD COLUMN     "nakshatra" TEXT,
ADD COLUMN     "nakshatraLord" TEXT,
ADD COLUMN     "nakshatraPada" INTEGER,
ADD COLUMN     "zodiacType" TEXT NOT NULL DEFAULT 'sidereal';

-- CreateTable
CREATE TABLE "DivisionalChart" (
    "id" TEXT NOT NULL,
    "natalChartId" TEXT NOT NULL,
    "chartType" TEXT NOT NULL,
    "planetaryPositions" JSONB NOT NULL,
    "ascendant" TEXT NOT NULL,
    "ascendantDegree" DOUBLE PRECISION NOT NULL,
    "houses" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DivisionalChart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DivisionalChart_natalChartId_idx" ON "DivisionalChart"("natalChartId");

-- CreateIndex
CREATE INDEX "DivisionalChart_chartType_idx" ON "DivisionalChart"("chartType");

-- AddForeignKey
ALTER TABLE "DivisionalChart" ADD CONSTRAINT "DivisionalChart_natalChartId_fkey" FOREIGN KEY ("natalChartId") REFERENCES "NatalChart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
