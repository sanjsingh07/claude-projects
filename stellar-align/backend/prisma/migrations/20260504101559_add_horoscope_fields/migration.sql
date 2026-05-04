-- AlterTable
ALTER TABLE "DailyHoroscope" ADD COLUMN     "aspects" JSONB,
ADD COLUMN     "energyScore" INTEGER,
ADD COLUMN     "moodAspects" JSONB,
ADD COLUMN     "primaryTransit" JSONB;
