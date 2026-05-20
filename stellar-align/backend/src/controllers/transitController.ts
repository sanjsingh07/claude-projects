import { Request, Response, NextFunction } from "express";
import { DateTime } from "luxon";
import { prisma } from "../config/database";
import { getTransitsForPeriod } from "../services/transits/transitEngine";
import { NotFoundError } from "../utils/errors";
import { cache } from "../config/redis";
import { FULL_NATAL_CHART_INCLUDE } from "../models/natalChart";

export class TransitController {
  // GET /transits?period=week|month|year
  async getTransits(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.userId!;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { natalChart: { include: FULL_NATAL_CHART_INCLUDE } },
      });

      if (!user?.profileCompleted || !user?.natalChart) {
        throw new NotFoundError("Birth profile or natal chart not found. Please complete your profile first.");
      }

      const userTimezone = user.birthTimezone || "UTC";
      const requestedPeriod = (req.query.period as string) || "week";
      let period = ["week", "month", "year"].includes(requestedPeriod)
        ? (requestedPeriod as "week" | "month" | "year")
        : "week";

      // Security check: only premium users can access month and year forecasts
      if (period !== "week" && !user.isPremium) {
        period = "week";
      }

      const startDateQuery = req.query.startDate as string;
      const startDate = startDateQuery 
        ? DateTime.fromISO(startDateQuery, { zone: userTimezone }).startOf("day").toJSDate()
        : DateTime.now().setZone(userTimezone).startOf("day").toJSDate();
      
      const chartContext = `${user.natalChart.zodiacType}:${user.natalChart.ayanamsa}:${user.natalChart.calculatedAt.toISOString()}`;
      const cacheKey = `transits:v3:${userId}:${period}:${user.isPremium ? 'premium' : 'standard'}:${DateTime.fromJSDate(startDate, { zone: userTimezone }).toISODate()}:${userTimezone}:${chartContext}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        res.json({ success: true, data: cached });
        return;
      }

      const data = await getTransitsForPeriod(user.natalChart, period, startDate, userTimezone);

      await cache.set(cacheKey, data, 3600); // Cache for 1 hour

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const transitController = new TransitController();
