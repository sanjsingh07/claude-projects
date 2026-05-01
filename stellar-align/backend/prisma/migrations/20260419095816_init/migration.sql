-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,
    "authProvider" TEXT NOT NULL DEFAULT 'email',
    "providerId" TEXT,
    "displayName" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "birthTime" TIMESTAMP(3),
    "birthLocationName" TEXT,
    "birthLatitude" DOUBLE PRECISION,
    "birthLongitude" DOUBLE PRECISION,
    "birthTimezone" TEXT NOT NULL,
    "birthUtcOffset" INTEGER,
    "notificationSettings" JSONB NOT NULL DEFAULT '{"dailyHoroscope":true,"transitAlerts":true,"friendActivity":false,"marketing":false,"pushTime":"09:00"}',
    "privacySettings" JSONB NOT NULL DEFAULT '{"profileVisible":true,"chartVisible":"friends","allowCompatibility":true}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NatalChart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sunSign" TEXT NOT NULL,
    "moonSign" TEXT NOT NULL,
    "risingSign" TEXT,
    "planetaryPositions" JSONB NOT NULL,
    "houses" JSONB NOT NULL,
    "aspects" JSONB NOT NULL,
    "chartPattern" TEXT,
    "calculationMethod" TEXT NOT NULL DEFAULT 'swiss_ephemeris',
    "houseSystem" TEXT NOT NULL DEFAULT 'placidus',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NatalChart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyHoroscope" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "forDate" TIMESTAMP(3) NOT NULL,
    "moonSign" TEXT,
    "moonPhase" TEXT,
    "activeTransits" JSONB,
    "contentSelf" TEXT NOT NULL,
    "contentWork" TEXT NOT NULL,
    "contentLove" TEXT NOT NULL,
    "contentSocial" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL DEFAULT 'claude',
    "generationVersion" INTEGER NOT NULL DEFAULT 1,
    "viewedAt" TIMESTAMP(3),
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "bookmarked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyHoroscope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transit" (
    "id" TEXT NOT NULL,
    "transitPlanet" TEXT NOT NULL,
    "natalPlanet" TEXT,
    "targetSign" TEXT,
    "aspectType" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "exactDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "intensity" INTEGER NOT NULL,
    "appliesToSigns" TEXT[],

    CONSTRAINT "Transit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompatibilityReport" (
    "id" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "scores" JSONB NOT NULL,
    "synastryAspects" JSONB,
    "compositeChartId" TEXT,
    "interpretation" TEXT,
    "strengths" JSONB,
    "challenges" JSONB,
    "advice" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompatibilityReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "deviceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "pushTokenId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentTemplate" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sign" TEXT,
    "aspectPattern" TEXT,
    "moonPhase" TEXT,
    "templateText" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'balanced',
    "intensity" INTEGER NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ContentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobLog" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB,
    "result" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventCategory" TEXT,
    "eventData" JSONB,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_authProvider_providerId_idx" ON "User"("authProvider", "providerId");

-- CreateIndex
CREATE INDEX "User_birthDate_idx" ON "User"("birthDate");

-- CreateIndex
CREATE UNIQUE INDEX "NatalChart_userId_key" ON "NatalChart"("userId");

-- CreateIndex
CREATE INDEX "NatalChart_userId_idx" ON "NatalChart"("userId");

-- CreateIndex
CREATE INDEX "NatalChart_sunSign_moonSign_risingSign_idx" ON "NatalChart"("sunSign", "moonSign", "risingSign");

-- CreateIndex
CREATE INDEX "DailyHoroscope_userId_forDate_idx" ON "DailyHoroscope"("userId", "forDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyHoroscope_userId_forDate_key" ON "DailyHoroscope"("userId", "forDate");

-- CreateIndex
CREATE INDEX "Transit_startDate_endDate_idx" ON "Transit"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Friendship_requesterId_idx" ON "Friendship"("requesterId");

-- CreateIndex
CREATE INDEX "Friendship_addresseeId_idx" ON "Friendship"("addresseeId");

-- CreateIndex
CREATE INDEX "Friendship_status_idx" ON "Friendship"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_requesterId_addresseeId_key" ON "Friendship"("requesterId", "addresseeId");

-- CreateIndex
CREATE INDEX "CompatibilityReport_user1Id_idx" ON "CompatibilityReport"("user1Id");

-- CreateIndex
CREATE INDEX "CompatibilityReport_user2Id_idx" ON "CompatibilityReport"("user2Id");

-- CreateIndex
CREATE UNIQUE INDEX "CompatibilityReport_user1Id_user2Id_key" ON "CompatibilityReport"("user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "PushToken_userId_idx" ON "PushToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PushToken_userId_token_key" ON "PushToken"("userId", "token");

-- CreateIndex
CREATE INDEX "ContentTemplate_category_sign_idx" ON "ContentTemplate"("category", "sign");

-- CreateIndex
CREATE INDEX "JobLog_jobType_idx" ON "JobLog"("jobType");

-- CreateIndex
CREATE INDEX "JobLog_status_idx" ON "JobLog"("status");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_createdAt_idx" ON "AnalyticsEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_createdAt_idx" ON "AnalyticsEvent"("eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "NatalChart" ADD CONSTRAINT "NatalChart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyHoroscope" ADD CONSTRAINT "DailyHoroscope_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompatibilityReport" ADD CONSTRAINT "CompatibilityReport_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompatibilityReport" ADD CONSTRAINT "CompatibilityReport_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushToken" ADD CONSTRAINT "PushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
