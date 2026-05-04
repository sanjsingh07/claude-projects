import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { getTransitsForPeriod } from "../services/transits/transitEngine";
import { NotFoundError } from "../utils/errors";
import { cache } from "../config/redis";

export class TransitController {
  // GET /transits?period=week|month|year
  async getTransits(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const period = (req.query.period as "week" | "month" | "year") || "week";
      const startDateQuery = req.query.startDate as string;
      const startDate = startDateQuery ? new Date(startDateQuery) : new Date();
      
      const cacheKey = `transits:${userId}:${period}:${startDate.toISOString().split('T')[0]}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        res.json({ success: true, data: cached });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { natalChart: true },
      });

      if (!user?.natalChart) {
        throw new NotFoundError("Natal chart not found. Please calculate your chart first.");
      }

      const data = await getTransitsForPeriod(user.natalChart, period, startDate);

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
