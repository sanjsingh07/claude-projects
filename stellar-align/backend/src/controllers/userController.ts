import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { cache } from "../config/redis";
import { ApiError, NotFoundError } from "../utils/errors";
import { validateTimezone } from "../utils/timezone";
import { astrologyService } from "../services/astrology";
import { calculateVedicChart } from "../services/vedicAstrology";
import logger from "../config/logger";
import { HouseSystem, AyanamsaType, ZodiacType, DivisionalChartType, FriendshipStatus } from "@prisma/client";
import { buildUserProfile } from "../services/userService";

export class UserController {
  constructor() {
    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.updateCurrentUser = this.updateCurrentUser.bind(this);
    this.deleteAccount = this.deleteAccount.bind(this);
    this.registerPushToken = this.registerPushToken.bind(this);
    this.recalculateNatalChart = this.recalculateNatalChart.bind(this);
    this.getUserProfile = this.getUserProfile.bind(this);
    this.getSettings = this.getSettings.bind(this);
    this.updateSettings = this.updateSettings.bind(this);
  }

  // GET /users/me
  async getCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { natalChart: true },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      const profile = buildUserProfile(user);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /users/me
  async updateCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const updateData: any = req.body;
      const currentUser = await prisma.user.findUnique({ where: { id: req.userId } });
      
      if (!currentUser) {
        throw new NotFoundError("User not found");
      }

      logger.info("Profile update received", {
        userId: req.userId,
        birthLatitude: updateData.birthLatitude,
        birthLongitude: updateData.birthLongitude,
      });

      // Validate birth data if provided
      if (
        updateData.birthDate ||
        updateData.birthLatitude !== undefined ||
        updateData.birthLongitude !== undefined
      ) {
        if (updateData.birthLatitude !== undefined) {
          if (updateData.birthLatitude < -90 || updateData.birthLatitude > 90) {
            throw new ApiError(400, "Invalid latitude", "INVALID_COORDINATES");
          }
        }

        if (updateData.birthLongitude !== undefined) {
          if (updateData.birthLongitude < -180 || updateData.birthLongitude > 180) {
            throw new ApiError(400, "Invalid longitude", "INVALID_COORDINATES");
          }
        }

        if (updateData.birthDate !== undefined) {
          const date = new Date(updateData.birthDate);
          if (isNaN(date.getTime())) {
            throw new ApiError(400, "Invalid birth date", "INVALID_DATE");
          }
        }
      }

      const processedData: any = { updatedAt: new Date() };

      if (updateData.birthDate) {
        const birthDate = new Date(updateData.birthDate);
        const year = birthDate.getUTCFullYear();
        const month = birthDate.getUTCMonth();
        const day = birthDate.getUTCDate();
        processedData.birthDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      }

      if (updateData.birthTime) {
        if (typeof updateData.birthTime !== 'string' || !updateData.birthTime.includes(':')) {
           throw new ApiError(400, "Invalid birth time format. Expected HH:mm", "INVALID_TIME");
        }
        const parts = updateData.birthTime.split(":");
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const timeDate = new Date(Date.UTC(2000, 0, 1, hours, minutes, 0, 0));
        processedData.birthTime = timeDate;
      }

      // Copy other fields
      ["displayName", "bio", "birthLocationName", "birthTimezone", "birthLatitude", "birthLongitude", "birthTimeUnknown"].forEach(field => {
        if (updateData[field] !== undefined) {
          processedData[field] = updateData[field];
        }
      });

      // Resolve/Validate timezone from coordinates if present
      if (processedData.birthLatitude != null && processedData.birthLongitude != null) {
        processedData.birthTimezone = validateTimezone(
          processedData.birthLatitude,
          processedData.birthLongitude,
          processedData.birthTimezone || currentUser.birthTimezone
        );
      }

      // Determine if profile is now complete
      const isComplete = !!(
        (processedData.birthDate || currentUser.birthDate) &&
        (processedData.birthLatitude !== undefined ? processedData.birthLatitude !== null : currentUser.birthLatitude !== null) &&
        (processedData.birthLongitude !== undefined ? processedData.birthLongitude !== null : currentUser.birthLongitude !== null) &&
        (processedData.birthTimezone || currentUser.birthTimezone)
      );
      
      processedData.profileCompleted = isComplete;

      const user = await prisma.user.update({
        where: { id: req.userId },
        data: processedData,
      });

      // Invalidate cache
      await cache.delete(`user:${req.userId}`);

      // If birth data was updated, trigger recalculation of both Western and Vedic charts
      const birthDataUpdated = !!(updateData.birthDate || updateData.birthTime || updateData.birthLatitude !== undefined || updateData.birthLongitude !== undefined);
      const hasAllBirthData = user.birthLatitude != null && user.birthLongitude != null && user.birthDate != null;

      if (birthDataUpdated && hasAllBirthData) {
        logger.info("Birth data updated, triggering chart recalculation", {
          userId: req.userId,
          birthLatitude: user.birthLatitude,
          birthLongitude: user.birthLongitude,
        });

        // Call chart calculation asynchronously (fire-and-forget)
        // We use setImmediate to avoid blocking the response
        setImmediate(async () => {
          try {
            // Force recalculate even if chart exists
            await userController.calculateAllChartsForUserInternal(req.userId!);
            logger.info("Chart recalculation completed", { userId: req.userId });
          } catch (err: any) {
            logger.error("Chart recalculation failed", {
              userId: req.userId,
              error: err?.message || String(err),
              stack: err?.stack,
            });
          }
        });
      } else {
        logger.info("Skipping chart recalculation", {
          userId: req.userId,
          hasBirthData: birthDataUpdated,
          hasLat: user.birthLatitude != null,
          hasLon: user.birthLongitude != null,
        });
      }

      const { passwordHash, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate both Western (Natal) and Vedic charts for a user
   */
  private async calculateAllChartsForUserInternal(userId: string): Promise<void> {
    // Calculate Western chart first
    await this.calculateNatalChartForUserInternal(userId, true);

    // Then calculate Vedic chart
    await this.calculateVedicChartForUserInternal(userId, AyanamsaType.LAHIRI);
  }

  /**
   * Calculate Western natal chart for a user
   * @param userId - The user ID
   * @param forceRecalculate - If true, recalculate even if chart exists
   */
  private async calculateNatalChartForUserInternal(userId: string, forceRecalculate: boolean = false): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { natalChart: true },
    });

    // Skip if user not found or already has a natal chart (unless forcing recalculate)
    if (!user || (user.natalChart && !forceRecalculate)) {
      return;
    }

    if (
      user.birthDate &&
      user.birthLatitude != null &&
      user.birthLongitude != null
    ) {
      const timeStr = (user.birthTime && !user.birthTimeUnknown)
        ? user.birthTime.toISOString().slice(11, 16)
        : "12:00";

      const chartData = await astrologyService.calculateNatalChart(
        user.birthDate,
        timeStr,
        user.birthLatitude,
        user.birthLongitude,
        user.birthTimezone || "UTC",
      );

      // Prepare planetary positions array
      const planets = [
        "sun", "moon", "mercury", "venus", "mars", "jupiter", 
        "saturn", "uranus", "neptune", "pluto", "chiron", 
        "lilith", "node", "ascendant", "midheaven"
      ];

      const planetaryPositionsData = planets.map(p => {
        const pos = (chartData as any)[p];
        return {
          planet: p.toUpperCase(),
          sign: pos.sign,
          longitude: pos.longitude,
          latitude: pos.latitude,
          distance: pos.distance,
          speed: pos.speed || 0,
          degree: pos.degree,
          minute: pos.minute,
          house: pos.house,
          retrograde: pos.retrograde || false,
        };
      });

      const housesData = chartData.houses.map(h => ({
        house: h.house,
        sign: h.sign,
        longitude: h.longitude,
        degree: h.degree,
        minute: h.minute,
      }));

      const aspectsData = chartData.aspects.map(a => ({
        planet1: a.planet1,
        planet2: a.planet2,
        type: a.type,
        angle: a.angle,
        orb: a.orb,
        applying: a.applying,
      }));

      // Use upsert to create or update
      await prisma.natalChart.upsert({
        where: { userId },
        create: {
          userId,
          sunSign: chartData.sun.sign,
          moonSign: chartData.moon.sign,
          risingSign: chartData.ascendant?.sign || null,
          houseSystem: HouseSystem.PLACIDUS,
          calculationMethod: "swiss_ephemeris",
          calculatedAt: new Date(),
          planetaryPositions: {
            create: planetaryPositionsData,
          },
          houses: {
            create: housesData,
          },
          aspects: {
            create: aspectsData,
          },
        },
        update: {
          sunSign: chartData.sun.sign,
          moonSign: chartData.moon.sign,
          risingSign: chartData.ascendant?.sign || null,
          calculatedAt: new Date(),
          planetaryPositions: {
            deleteMany: {},
            create: planetaryPositionsData,
          },
          houses: {
            deleteMany: {},
            create: housesData,
          },
          aspects: {
            deleteMany: {},
            create: aspectsData,
          },
        },
      });

      logger.info("Natal chart calculated and saved successfully", {
        userId,
        sunSign: chartData.sun.sign,
        moonSign: chartData.moon.sign,
        risingSign: chartData.ascendant?.sign,
      });
    }
  }

  /**
   * Calculate Vedic chart for a user
   * @param userId - The user ID
   * @param ayanamsaType - The ayanamsa type to use (default: LAHIRI)
   */
  private async calculateVedicChartForUserInternal(userId: string, ayanamsaType: AyanamsaType = AyanamsaType.LAHIRI): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { natalChart: true },
    });

    // Skip if user not found or doesn't have birth data
    if (!user || !user.birthDate || user.birthLatitude == null || user.birthLongitude == null) {
      return;
    }

    // Skip if no Western chart exists (we need it as base)
    if (!user.natalChart) {
      logger.warn("Cannot calculate Vedic chart without Western chart", { userId });
      return;
    }

    try {
      const timeStr = (user.birthTime && !user.birthTimeUnknown)
        ? user.birthTime.toISOString().slice(11, 16)
        : "12:00";

      // Vedic calculations ALWAYS need Tropical as the base to correctly apply Ayanamsa
      const baseTropicalChart = await astrologyService.calculateNatalChart(
        user.birthDate,
        timeStr,
        user.birthLatitude,
        user.birthLongitude,
        user.birthTimezone || "UTC",
        HouseSystem.PLACIDUS,
        ZodiacType.TROPICAL,
      );

      // Calculate Vedic chart with divisional charts
      const vedicChart = await calculateVedicChart(
        {
          date: user.birthDate,
          time: timeStr,
          latitude: user.birthLatitude,
          longitude: user.birthLongitude,
          timezone: user.birthTimezone || "UTC",
          ayanamsa: ayanamsaType,
        },
        baseTropicalChart,
      );

      // Get Moon's nakshatra info
      const moonNakshatra = vedicChart.nakshatras.moon;
      
      // Extract D1 positions for the main NatalChart signs
      const d1Sun = vedicChart.d1.planetaryPositions.find(p => p.planet === "sun");
      const d1Moon = vedicChart.d1.planetaryPositions.find(p => p.planet === "moon");

      // Prepare D1 planetary positions array for the main NatalChart
      const planetaryPositionsData = vedicChart.d1.planetaryPositions.map(p => ({
        planet: p.planet.toUpperCase(),
        sign: p.sign,
        longitude: p.degree, // Vedic already uses sign-relative degree, but we'll store it as longitude for compatibility
        latitude: 0,
        distance: 0,
        speed: 0,
        degree: Math.floor(p.degree),
        minute: Math.round((p.degree % 1) * 60),
        house: p.house,
        retrograde: p.retrograde || false,
      }));

      const housesData = vedicChart.d1.houses.map(h => ({
        house: h.house,
        sign: h.sign,
        longitude: h.degree,
        degree: Math.floor(h.degree),
        minute: Math.round((h.degree % 1) * 60),
      }));

      const aspectsData = baseTropicalChart.aspects.map(a => ({
        planet1: a.planet1,
        planet2: a.planet2,
        type: a.type,
        angle: a.angle,
        orb: a.orb,
        applying: a.applying,
      }));

      // Upsert natal chart with Vedic data
      const chart = await prisma.natalChart.upsert({
        where: { userId },
        create: {
          userId,
          sunSign: d1Sun?.sign || baseTropicalChart.sun.sign,
          moonSign: d1Moon?.sign || baseTropicalChart.moon.sign,
          risingSign: vedicChart.d1.ascendant,
          houseSystem: HouseSystem.WHOLE_SIGN,
          calculationMethod: "vedic",
          zodiacType: ZodiacType.SIDEREAL,
          ayanamsa: ayanamsaType,
          nakshatra: moonNakshatra.name,
          nakshatraPada: moonNakshatra.pada,
          nakshatraLord: moonNakshatra.lord,
          planetaryPositions: {
            create: planetaryPositionsData,
          },
          houses: {
            create: housesData,
          },
          aspects: {
            create: aspectsData,
          },
        },
        update: {
          sunSign: d1Sun?.sign || baseTropicalChart.sun.sign,
          moonSign: d1Moon?.sign || baseTropicalChart.moon.sign,
          risingSign: vedicChart.d1.ascendant,
          houseSystem: HouseSystem.WHOLE_SIGN,
          calculationMethod: "vedic",
          zodiacType: ZodiacType.SIDEREAL,
          ayanamsa: ayanamsaType,
          nakshatra: moonNakshatra.name,
          nakshatraPada: moonNakshatra.pada,
          nakshatraLord: moonNakshatra.lord,
          calculatedAt: new Date(),
          planetaryPositions: {
            deleteMany: {},
            create: planetaryPositionsData,
          },
          houses: {
            deleteMany: {},
            create: housesData,
          },
          aspects: {
            deleteMany: {},
            create: aspectsData,
          },
        },
      });

      // Create or update divisional charts (Removed D11)
      const divisionalChartsTypes = [
        DivisionalChartType.D1,
        DivisionalChartType.D2,
        DivisionalChartType.D4,
        DivisionalChartType.D9,
        DivisionalChartType.D10,
      ];

      // Delete existing divisional charts
      await prisma.divisionalChart.deleteMany({
        where: { natalChartId: chart.id },
      });

      // Create new divisional charts with nested positions and houses
      for (const chartType of divisionalChartsTypes) {
        const dcData = (vedicChart as any)[chartType.toLowerCase()];
        if (!dcData) continue;

        await prisma.divisionalChart.create({
          data: {
            natalChartId: chart.id,
            chartType,
            ascendant: dcData.ascendant,
            ascendantDegree: dcData.ascendantDegree,
            planetaryPositions: {
              create: dcData.planetaryPositions.map((p: any) => ({
                planet: p.planet.toUpperCase(),
                sign: p.sign,
                degree: p.degree,
                house: p.house,
                retrograde: p.retrograde || false,
                combust: p.combust || false,
              })),
            },
            houses: {
              create: dcData.houses.map((h: any) => ({
                house: h.house,
                sign: h.sign,
                degree: h.degree,
              })),
            },
          },
        });
      }

      logger.info("Vedic chart calculated and saved successfully", {
        userId,
        ayanamsa: vedicChart.ayanamsa,
        nakshatra: moonNakshatra.name,
      });
    } catch (error) {
      logger.error("Vedic chart calculation failed", {
        userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  // POST /users/me/recalculate-chart
  async recalculateNatalChart(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.userId!;

      // Clear any existing natal chart
      await prisma.natalChart.deleteMany({
        where: { userId },
      });

      // Recalculate both Western and Vedic charts
      await this.calculateAllChartsForUserInternal(userId);

      res.json({
        success: true,
        message: "Natal chart recalculated",
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /users/:id/profile
  async getUserProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.params.id;

      // Check cache first
      const cached = await cache.get(`user_profile:${userId}`);
      if (cached) {
        res.json({ success: true, data: cached });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId, isDeleted: false },
        include: { natalChart: true },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Check privacy settings
      const privacy = user.privacySettings as any;
      if (!privacy?.profileVisible) {
        throw new NotFoundError("User not found");
      }

      // Check if current user is friends with target
      let isFriend = false;
      let friendRequestPending = false;

      if (req.userId && req.userId !== userId) {
        const friendship = await prisma.friendship.findFirst({
          where: {
            OR: [
              { requesterId: req.userId, addresseeId: userId },
              { requesterId: userId, addresseeId: req.userId },
            ],
          },
        });

        if (friendship) {
          isFriend = friendship.status === FriendshipStatus.ACCEPTED;
          friendRequestPending = friendship.status === FriendshipStatus.PENDING;
        }
      }

      // Filter visibility based on settings
      const profile = {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        birthDate: user.birthDate,
        sunSign: user.natalChart?.sunSign,
        moonSign: user.natalChart?.moonSign,
        risingSign: user.natalChart?.risingSign,
        isFriend,
        friendRequestPending,
      };

      // Only show chart data to friends if chart visibility is 'friends'
      if (privacy?.chartVisible === "friends" && !isFriend) {
        (profile as any).sunSign = undefined;
        (profile as any).moonSign = undefined;
        (profile as any).risingSign = undefined;
      }

      // Cache for 5 minutes
      await cache.set(`user_profile:${userId}`, profile, 300);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /users/me
  async deleteAccount(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: req.userId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          email: `deleted_${req.userId}@deleted.com`,
        },
      });

      // Clear all tokens
      await cache.delete(`push_tokens:${req.userId}`);

      res.json({
        success: true,
        message: "Account scheduled for deletion",
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /users/me/settings
  async getSettings(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { settings: true },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      // If user settings table doesn't exist, create it
      let settings = user.settings;
      if (!settings) {
        settings = await prisma.userSettings.create({
          data: { userId: req.userId },
        });
      }

      res.json({
        success: true,
        data: {
          ...settings,
          notificationSettings: user.notificationSettings,
          privacySettings: user.privacySettings,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /users/me/settings
  async updateSettings(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { notificationSettings, privacySettings, ...otherSettings } = req.body;

      const user = await prisma.user.update({
        where: { id: req.userId },
        data: {
          notificationSettings: notificationSettings ? { ...notificationSettings } : undefined,
          privacySettings: privacySettings ? { ...privacySettings } : undefined,
          settings: Object.keys(otherSettings).length > 0 ? {
            update: {
              ...otherSettings,
              updatedAt: new Date(),
            }
          } : undefined,
        },
        include: { settings: true }
      });

      res.json({
        success: true,
        data: {
          ...user.settings,
          notificationSettings: user.notificationSettings,
          privacySettings: user.privacySettings,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /users/me/device-token
  async registerPushToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { token, platform, deviceId } = req.body;

      if (!token || !platform) {
        throw new ApiError(
          400,
          "Token and platform are required",
          "MISSING_FIELDS",
        );
      }

      await prisma.pushToken.upsert({
        where: {
          userId_token: {
            userId: req.userId!,
            token,
          },
        },
        create: {
          userId: req.userId!,
          token,
          platform,
          deviceId,
        },
        update: {
          isActive: true,
          lastUsedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: "Push token registered",
      });
    } catch (error) {
      next(error);
    }
  }

  // Note: birthDate stores the full date (YYYY-MM-DD)
  // birthTime stores only the time portion (HH:mm) as a DateTime
  // They are separate columns by design - birthDate is the calendar date,
  // birthTime is the time of day for more precise astrological calculations
}

export const userController = new UserController();
