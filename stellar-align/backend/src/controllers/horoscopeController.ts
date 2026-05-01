import { Request, Response, NextFunction } from "express";
import { DateTime } from "luxon";
import { prisma } from "../config/database";
import { cache } from "../config/redis";
import { NotFoundError } from "../utils/errors";
import { astrologyService } from "../services/astrology";
import logger from "../config/logger";

export class HoroscopeController {
  // GET /horoscope/today
  async getToday(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const today = DateTime.now().setZone("utc").startOf("day").toJSDate();

      // Check cache
      const cacheKey = `horoscope:${userId}:${today.toISOString()}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        res.json({ success: true, data: cached });
        return;
      }

      // Get or create horoscope
      let horoscope = await prisma.dailyHoroscope.findUnique({
        where: {
          userId_forDate: {
            userId,
            forDate: today,
          },
        },
      });

      if (!horoscope) {
        // First check if user has a natal chart
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { natalChart: true },
        });

        if (!user?.natalChart) {
          // User doesn't have a natal chart yet - create placeholder
          // Don't cache placeholder - allow retry on next request
          horoscope = await prisma.dailyHoroscope.create({
            data: {
              userId,
              forDate: today,
              moonSign: "unknown",
              moonPhase: "unknown",
              activeTransits: [],
              contentSelf:
                "Your natal chart is being calculated. Please check back soon for your personalized daily horoscope.",
              contentWork:
                "Your cosmic work insights are being prepared based on your birth chart.",
              contentLove:
                "Your love forecast is being calculated with your unique astrological signature.",
              contentSocial:
                "Your social astrology insights are being generated.",
              generatedBy: "system",
            },
          });
          // Don't cache placeholder - allow retry on next request
          res.json({
            success: true,
            data: horoscope,
          });
          return;
        } else {
          try {
            // Generate new horoscope
            horoscope = await astrologyService.generateDailyHoroscope(
              userId,
              today,
            );
          } catch (error: any) {
            // Handle any other generation errors
            logger.error("Horoscope generation failed", { error, userId });
            throw error;
          }
        }
      }

      // Mark as viewed
      if (horoscope && !horoscope.viewedAt) {
        await prisma.dailyHoroscope.update({
          where: { id: horoscope.id },
          data: { viewedAt: new Date() },
        });
      }

      // Cache for 1 hour
      await cache.set(cacheKey, horoscope, 3600);

      res.json({
        success: true,
        data: horoscope,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /horoscope/:date
  async getByDate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const dateStr = req.params.date;
      const date = DateTime.fromISO(dateStr).startOf("day").toJSDate();

      if (isNaN(date.getTime())) {
        res.status(400).json({
          success: false,
          error: { code: "INVALID_DATE", message: "Invalid date format" },
        });
        return;
      }

      // Limit to past 30 days and future 7 days
      const now = DateTime.now().startOf("day");
      const requested = DateTime.fromJSDate(date).startOf("day");
      const daysDiff = requested.diff(now, "days").days;

      if (daysDiff > 7) {
        res.status(400).json({
          success: false,
          error: {
            code: "FUTURE_LIMIT",
            message: "Cannot request horoscope more than 7 days ahead",
          },
        });
        return;
      }

      const horoscope = await prisma.dailyHoroscope.findUnique({
        where: {
          userId_forDate: {
            userId,
            forDate: date,
          },
        },
      });

      if (!horoscope) {
        // Generate if within allowed range
        if (daysDiff <= 7 && daysDiff >= -30) {
          try {
            const generated = await astrologyService.generateDailyHoroscope(
              userId,
              date,
            );
            res.json({ success: true, data: generated });
            return;
          } catch (error: any) {
            if (error.message?.includes("Natal chart not found")) {
              const generated = await prisma.dailyHoroscope.create({
                data: {
                  userId,
                  forDate: date,
                  moonSign: "unknown",
                  moonPhase: "unknown",
                  activeTransits: [],
                  contentSelf:
                    "Your natal chart is being calculated. Please check back soon for your personalized horoscope.",
                  contentWork:
                    "Your cosmic work insights are being prepared based on your birth chart.",
                  contentLove:
                    "Your love forecast is being calculated with your unique astrological signature.",
                  contentSocial:
                    "Your social astrology insights are being generated.",
                  generatedBy: "system",
                },
              });
              res.json({ success: true, data: generated });
              return;
            }
            throw error;
          }
        }
        throw new NotFoundError("Horoscope not found for this date");
      }

      res.json({ success: true, data: horoscope });
    } catch (error) {
      next(error);
    }
  }

  // GET /horoscope/history
  async getHistory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const limit = parseInt(req.query.limit as string) || 30;
      const page = parseInt(req.query.page as string) || 1;

      const horoscopes = await prisma.dailyHoroscope.findMany({
        where: { userId },
        orderBy: { forDate: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      });

      const total = await prisma.dailyHoroscope.count({
        where: { userId },
      });

      res.json({
        success: true,
        data: horoscopes,
        meta: {
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrevious: page > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /horoscope/:id/bookmark
  async toggleBookmark(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const horoscopeId = req.params.id;
      const { bookmarked } = req.body;

      const horoscope = await prisma.dailyHoroscope.update({
        where: { id: horoscopeId, userId: req.userId },
        data: { bookmarked },
      });

      // Invalidate cache
      const cacheKey = `horoscope:${req.userId}:${horoscope.forDate.toISOString()}`;
      await cache.delete(cacheKey);

      res.json({
        success: true,
        data: { bookmarked: horoscope.bookmarked },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /horoscope/:id/share
  async shareHoroscope(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const horoscopeId = req.params.id;

      const horoscope = await prisma.dailyHoroscope.update({
        where: { id: horoscopeId, userId: req.userId },
        data: { shared: true },
      });

      // Track analytics
      await prisma.analyticsEvent.create({
        data: {
          userId: req.userId,
          eventType: "horoscope_shared",
          eventData: { horoscopeId, date: horoscope.forDate },
        },
      });

      res.json({
        success: true,
        data: { shared: true },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /horoscope/insights
  async getInsights(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.userId!;

      // Get user's recent horoscopes for pattern analysis
      const recentHoroscopes = await prisma.dailyHoroscope.findMany({
        where: { userId, viewedAt: { not: null } },
        orderBy: { forDate: "desc" },
        take: 30,
        select: {
          forDate: true,
          bookmarked: true,
          shared: true,
        },
      });

      const total = await prisma.dailyHoroscope.count({ where: { userId } });
      const bookmarked = await prisma.dailyHoroscope.count({
        where: { userId, bookmarked: true },
      });
      const shared = await prisma.dailyHoroscope.count({
        where: { userId, shared: true },
      });

      const streak = this.calculateStreak(
        recentHoroscopes.map((h) => h.forDate),
      );

      res.json({
        success: true,
        data: {
          totalHoroscopes: total,
          bookmarked,
          shared,
          currentStreak: streak,
          recentActivity: recentHoroscopes.slice(0, 7),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  private calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;

    const sorted = dates
      .map((d) => DateTime.fromJSDate(d).startOf("day"))
      .sort((a, b) => b.toMillis() - a.toMillis());
    const today = DateTime.now().startOf("day");

    let streak = 0;
    let currentDate = today;

    for (const date of sorted) {
      if (date.equals(currentDate)) {
        streak++;
        currentDate = currentDate.minus({ days: 1 });
      } else if (date < currentDate) {
        break;
      }
    }

    return streak;
  }
}

export const horoscopeController = new HoroscopeController();
