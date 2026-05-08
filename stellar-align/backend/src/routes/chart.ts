import { Router, Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middleware/auth";
import { prisma } from "../config/database";
import { astrologyService } from "../services/astrology";
import { HouseSystem } from "@prisma/client";
import { transformPlanetaryPositions } from "../utils/chart";

const router = Router();

router.use(authMiddleware);

// GET /chart - Get user's natal chart
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chart = await prisma.natalChart.findUnique({
      where: { userId: req.userId },
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

    const planetaryPositions = transformPlanetaryPositions(chart.planetaryPositions);

    res.json({
      success: true,
      data: {
        id: chart.id,
        userId: chart.userId,
        sunSign: chart.sunSign,
        moonSign: chart.moonSign,
        risingSign: chart.risingSign,
        planetaryPositions,
        houses: chart.houses,
        aspects: chart.aspects,
        chartPattern: chart.chartPattern,
        houseSystem: chart.houseSystem,
        zodiacType: chart.zodiacType,
        ayanamsa: chart.ayanamsa,
        nakshatra: chart.nakshatra,
        nakshatraPada: chart.nakshatraPada,
        nakshatraLord: chart.nakshatraLord,
        calculatedAt: chart.calculatedAt,
      },
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
        include: { natalChart: true },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "User not found" },
        });
        return;
      }

      if (!user.birthLatitude || !user.birthLongitude) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_BIRTH_DATA",
            message: "Birth location required",
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

      const chartData = await astrologyService.calculateNatalChart(
        user.birthDate,
        user.birthTime?.toISOString().slice(11, 16) || "12:00",
        user.birthLatitude,
        user.birthLongitude,
        user.birthTimezone,
        houseSystem,
        user.natalChart?.zodiacType || "SIDEREAL",
        user.natalChart?.ayanamsa || "LAHIRI"
      );

      // Upsert natal chart
      const userId = req.userId!;
      const chart = await prisma.natalChart.upsert({
        where: { userId },
        create: {
          userId,
          sunSign: chartData.sun.sign,
          moonSign: chartData.moon.sign,
          risingSign: chartData.ascendant.sign,
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
          houseSystem,
          calculationMethod: "astronomia",
        },
        update: {
          sunSign: chartData.sun.sign,
          moonSign: chartData.moon.sign,
          risingSign: chartData.ascendant.sign,
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
          houseSystem,
          calculationMethod: "astronomia",
          calculatedAt: new Date(),
        },
      });

      const planetaryPositions = transformPlanetaryPositions(chart.planetaryPositions);

      res.json({
        success: true,
        data: {
          id: chart.id,
          userId: chart.userId,
          sunSign: chart.sunSign,
          moonSign: chart.moonSign,
          risingSign: chart.risingSign,
          planetaryPositions,
          houses: chart.houses,
          aspects: chart.aspects,
          chartPattern: chart.chartPattern,
          houseSystem: chart.houseSystem,
          calculationMethod: chart.calculationMethod,
          zodiacType: chart.zodiacType,
          ayanamsa: chart.ayanamsa,
          nakshatra: chart.nakshatra,
          nakshatraPada: chart.nakshatraPada,
          nakshatraLord: chart.nakshatraLord,
          calculatedAt: chart.calculatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
