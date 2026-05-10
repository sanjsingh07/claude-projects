import { Router, Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middleware/auth";
import { prisma } from "../config/database";
import { astrologyService } from "../services/astrology";
import { HouseSystem, ZodiacType, AyanamsaType } from "@prisma/client";
import { FULL_NATAL_CHART_INCLUDE } from "../models/natalChart";
import logger from "../config/logger";

const router = Router();

router.use(authMiddleware);

// GET /chart - Get user's natal chart
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chart = await prisma.natalChart.findUnique({
      where: { userId: req.userId },
      include: FULL_NATAL_CHART_INCLUDE,
    });

    if (!chart) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Natal chart not found",
        },
      });
      return;
    }

    res.json({
      success: true,
      data: chart,
    });
  } catch (error) {
    next(error);
  }
});

// POST /chart/recalculate - Recalculate natal chart
router.post(
  "/recalculate",
  [
    body("houseSystem")
      .optional()
      .isIn(["placidus", "koch", "equal", "whole", "porphyry"]),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { natalChart: { include: FULL_NATAL_CHART_INCLUDE } },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "User not found" },
        });
        return;
      }

      if (!user.birthDateTime || user.birthLatitude == null || user.birthLongitude == null) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_BIRTH_DATA",
            message: "Birth location and date/time required",
          },
        });
        return;
      }

      const houseSystemMap: Record<string, HouseSystem> = {
        placidus: HouseSystem.PLACIDUS,
        koch: HouseSystem.KOCH,
        equal: HouseSystem.EQUAL,
        whole: HouseSystem.WHOLE_SIGN,
        porphyry: HouseSystem.PORPHYRY,
      };
      const houseSystem = houseSystemMap[req.body.houseSystem || "placidus"];

      const birthDateTime = user.birthDateTime;
      const dateStr = birthDateTime.toISOString().split("T")[0];
      const timeStr = user.birthTimeUnknown
        ? "12:00"
        : `${birthDateTime.getUTCHours().toString().padStart(2, '0')}:${birthDateTime.getUTCMinutes().toString().padStart(2, '0')}`;

      const chartData = await astrologyService.calculateNatalChart(
        dateStr,
        timeStr,
        user.birthLatitude,
        user.birthLongitude,
        user.birthTimezone || "UTC",
        houseSystem,
        user.natalChart?.zodiacType || ZodiacType.TROPICAL,
        user.natalChart?.ayanamsa || AyanamsaType.LAHIRI
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

      // Upsert natal chart
      const userId = req.userId!;
      const chart = await prisma.natalChart.upsert({
        where: { userId },
        create: {
          userId,
          sunSign: chartData.sun.sign || ZodiacSign.ARIES,
          moonSign: chartData.moon.sign || ZodiacSign.ARIES,
          risingSign: chartData.ascendant?.sign || null,
          houseSystem,
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
          sunSign: chartData.sun.sign || ZodiacSign.ARIES,
          moonSign: chartData.moon.sign || ZodiacSign.ARIES,
          risingSign: chartData.ascendant?.sign || null,
          houseSystem,
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
        include: FULL_NATAL_CHART_INCLUDE
      });

      res.json({
        success: true,
        data: chart,
      });
    } catch (error) {
      logger.error("Recalculate chart route failed", { error });
      next(error);
    }
  },
);

export default router;
