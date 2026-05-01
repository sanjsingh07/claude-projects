import { Router, Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middleware/auth";
import { prisma } from "../config/database";
import { astrologyService } from "../services/astrology";

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

    // Transform planetaryPositions object to array for frontend
    const planetaryPositionsObj = chart.planetaryPositions as any;
    const positionsArray = planetaryPositionsObj
      ? Object.values(planetaryPositionsObj).map((p: any) => ({
          planet: p.planet?.toString?.()?.toLowerCase?.() || p.planet,
          sign: p.sign,
          degree: p.degree,
          minute: p.minute,
          house: p.house,
          retrograde: p.retrograde,
        }))
      : [];

    res.json({
      success: true,
      data: {
        ...chart,
        planetaryPositions: positionsArray,
        houses: chart.houses,
        aspects: chart.aspects,
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

      const houseSystem = req.body.houseSystem || "placidus";

      const chartData = await astrologyService.calculateNatalChart(
        user.birthDate,
        user.birthTime?.toTimeString().slice(0, 5) || "12:00",
        user.birthLatitude,
        user.birthLongitude,
        user.birthTimezone,
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

      res.json({
        success: true,
        data: chart,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /chart/transits - Get current transits for user
router.get("/transits", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { natalChart: true },
    });

    if (!user?.natalChart) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Natal chart required" },
      });
      return;
    }

    const transits = await astrologyService.calculateTransits();
    const currentPositions = await astrologyService.getCurrentPlanetaryPositions();
    const moonPhase = astrologyService.getMoonPhase(
      currentPositions.sun?.longitude ?? 0,
      currentPositions.moon?.longitude ?? 0,
    );

    res.json({
      success: true,
      data: {
        date: new Date().toISOString(),
        moonPhase,
        transits,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
