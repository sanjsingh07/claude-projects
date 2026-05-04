-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chartStyle" TEXT NOT NULL DEFAULT 'western',
    "defaultDivisionalChart" "DivisionalChartType" NOT NULL DEFAULT 'D1',
    "darkMode" BOOLEAN NOT NULL DEFAULT true,
    "accentColor" TEXT NOT NULL DEFAULT 'violet',
    "dailyReadingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dailyReadingTime" TEXT NOT NULL DEFAULT '08:00',
    "transitAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "transitAlertsLevel" TEXT NOT NULL DEFAULT 'major',
    "compatibilityEnabled" BOOLEAN NOT NULL DEFAULT false,
    "compatibilityFreq" TEXT NOT NULL DEFAULT 'weekly',
    "birthdayRemindersEnabled" BOOLEAN NOT NULL DEFAULT true,
    "shareBirthData" BOOLEAN NOT NULL DEFAULT false,
    "analyticsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
