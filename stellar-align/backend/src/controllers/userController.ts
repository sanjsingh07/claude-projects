import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { cache } from "../config/redis";
import { ApiError, NotFoundError } from "../utils/errors";
import { astrologyService } from "../services/astrology";
import logger from "../config/logger";

export class UserController {
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

      const { passwordHash, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: userWithoutPassword,
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

      logger.info("Profile update received", {
        userId: req.userId,
        birthLatitude: updateData.birthLatitude,
        birthLongitude: updateData.birthLongitude,
        hasAllFields: !!(updateData.birthLatitude && updateData.birthLongitude),
      });

      // Validate birth data if provided
      if (
        updateData.birthDate ||
        updateData.birthLatitude ||
        updateData.birthLongitude
      ) {
        // Inline validation to avoid 'this' binding issues
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

      // Convert birthDate ISO string to Date object if provided
      // The date string already contains the correct calendar date
      if (updateData.birthDate) {
        // Parse the ISO date string and create a Date that preserves the local date
        // We use the date parts directly to avoid timezone conversion issues
        const birthDate = new Date(updateData.birthDate);
        const year = birthDate.getUTCFullYear();
        const month = birthDate.getUTCMonth();
        const day = birthDate.getUTCDate();
        // Create date at UTC midnight to avoid timezone shifts
        processedData.birthDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      }

      // Convert birthTime string (HH:mm) to Date object if provided
      if (updateData.birthTime) {
        // Convert time string "HH:mm" to Date object
        // Use a fixed reference date (2000-01-01) to store only the time
        const [hours, minutes] = updateData.birthTime.split(":");
        // Create date in UTC to avoid timezone issues
        const timeDate = new Date(Date.UTC(2000, 0, 1, parseInt(hours, 10), parseInt(minutes, 10), 0, 0));
        processedData.birthTime = timeDate;
      }

      // Copy other fields directly
      if (updateData.birthLocationName) {
        processedData.birthLocationName = updateData.birthLocationName;
      }
      if (updateData.birthTimezone) {
        processedData.birthTimezone = updateData.birthTimezone;
      }
      if (updateData.birthLatitude !== undefined) {
        processedData.birthLatitude = updateData.birthLatitude;
      }
      if (updateData.birthLongitude !== undefined) {
        processedData.birthLongitude = updateData.birthLongitude;
      }

      const user = await prisma.user.update({
        where: { id: req.userId },
        data: processedData,
      });

      // Invalidate cache
      await cache.delete(`user:${req.userId}`);

      // If birth data was updated and we have all required fields, calculate natal chart
      if (
        (updateData.birthDate || updateData.birthLatitude || updateData.birthLongitude || updateData.birthTime) &&
        user.birthLatitude != null &&
        user.birthLongitude != null
      ) {
        logger.info("Triggering natal chart calculation", {
          userId: req.userId,
          birthLatitude: user.birthLatitude,
          birthLongitude: user.birthLongitude,
        });
        
        // Call natal chart calculation synchronously (fire-and-forget)
        // We use setImmediate to avoid blocking the response
        setImmediate(async () => {
          try {
            await userController.calculateNatalChartForUserInternal(req.userId!);
            logger.info("Natal chart calculation completed", { userId: req.userId });
          } catch (err: any) {
            logger.error("Natal chart calculation failed", {
              userId: req.userId,
              error: err?.message || String(err),
              stack: err?.stack,
            });
          }
        });
      } else {
        logger.info("Skipping natal chart calculation", {
          userId: req.userId,
          hasBirthData: !!(updateData.birthDate || updateData.birthLatitude || updateData.birthLongitude || updateData.birthTime),
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

  private async calculateNatalChartForUserInternal(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { natalChart: true },
    });

    // Skip if user not found or already has a natal chart
    if (!user || user.natalChart) {
      return;
    }

    if (
      user.birthDate &&
      user.birthLatitude != null &&
      user.birthLongitude != null
    ) {
      const timeStr = user.birthTime
        ? user.birthTime.toISOString().slice(11, 16)
        : "12:00";

      const chartData = await astrologyService.calculateNatalChart(
        user.birthDate,
        timeStr,
        user.birthLatitude,
        user.birthLongitude,
        user.birthTimezone || "UTC",
      );

      await prisma.natalChart.create({
        data: {
          userId,
          sunSign: chartData.sun.sign,
          moonSign: chartData.moon.sign,
          risingSign: chartData.ascendant?.sign || "unknown",
          planetaryPositions: {
            sun: chartData.sun,
            moon: chartData.moon,
            mercury: chartData.mercury,
            venus: chartData.venus,
            mars: chartData.mars,
            jupiter: chartData.jupiter,
            saturn: chartData.saturn,
            uranus: chartData.uranus,
            neptune: chartData.neptune,
            pluto: chartData.pluto,
            chiron: chartData.chiron,
            lilith: chartData.lilith,
            node: chartData.node,
            ascendant: chartData.ascendant,
            midheaven: chartData.midheaven,
          } as any,
          houses: chartData.houses as any,
          aspects: chartData.aspects as any,
          chartPattern: undefined,
          houseSystem: "placidus",
          calculationMethod: "astronomia",
          calculatedAt: new Date(),
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

      // Recalculate
      await this.calculateNatalChartForUserInternal(userId);

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
          isFriend = friendship.status === "accepted";
          friendRequestPending = friendship.status === "pending";
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
        select: {
          notificationSettings: true,
          privacySettings: true,
        },
      });

      res.json({
        success: true,
        data: user,
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
      const { notificationSettings, privacySettings } = req.body;

      const user = await prisma.user.update({
        where: { id: req.userId },
        data: {
          notificationSettings: notificationSettings
            ? { ...notificationSettings }
            : undefined,
          privacySettings: privacySettings ? { ...privacySettings } : undefined,
        },
      });

      res.json({
        success: true,
        data: {
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
