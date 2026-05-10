import { Router, Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middleware/auth";
import { prisma } from "../config/database";
import { astrologyService } from "../services/astrology";
import { calculateVedicChart } from "../services/vedicAstrology";
import { AyanamsaType, HouseSystem, ZodiacType, DivisionalChartType } from "@prisma/client";
import { FULL_NATAL_CHART_INCLUDE } from "../models/natalChart";
import logger from "../config/logger";

const router = Router();

router.use(authMiddleware);

// GET /vedic/chart - Get user's Vedic chart with all divisional charts
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { profileCompleted: true }
    });

    const chart = await prisma.natalChart.findUnique({
      where: { userId: req.userId },
      include: {
        ...FULL_NATAL_CHART_INCLUDE,
        divisionalCharts: {
          include: {
            planetaryPositions: true,
            houses: true,
          }
        },
      },
    });

    if (!user?.profileCompleted || !chart) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Natal chart or complete profile not found",
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

// POST /vedic/calculate - Calculate Vedic chart with divisional charts
router.post(
  "/calculate",
  [
    body("ayanamsa")
      .optional()
      .isIn(["lahiri", "raman", "krishnamurti", "fagan-bradley"]),
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

      if (!user.profileCompleted || !user.birthLatitude || !user.birthLongitude || !user.birthDateTime) {
        res.status(400).json({
          success: false,
          error: {
            code: "PROFILE_INCOMPLETE",
            message: "Birth location and date/time required",
          },
        });
        return;
      }

      const ayanamsaType = (req.body.ayanamsa?.toUpperCase() as AyanamsaType) || AyanamsaType.LAHIRI;
      
      const birthDateTime = user.birthDateTime;
      const dateStr = birthDateTime.toISOString().split("T")[0];
      const timeStr = user.birthTimeUnknown
        ? "12:00"
        : `${birthDateTime.getUTCHours().toString().padStart(2, '0')}:${birthDateTime.getUTCMinutes().toString().padStart(2, '0')}`;

      // First calculate the base natal chart (tropical positions)
      const baseTropicalChart = await astrologyService.calculateNatalChart(
        user.birthDateTime,
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
          date: user.birthDateTime,
          time: timeStr,
          latitude: user.birthLatitude,
          longitude: user.birthLongitude,
          timezone: user.birthTimezone || "UTC",
          ayanamsa: ayanamsaType,
        },
        baseTropicalChart
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
        longitude: p.degree,
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
      const userId = req.userId!;
      
      const chart = await prisma.natalChart.upsert({
        where: { userId },
        create: {
          userId,
          sunSign: (d1Sun?.sign as any) || baseTropicalChart.sun.sign || ZodiacSign.ARIES,
          moonSign: (d1Moon?.sign as any) || baseTropicalChart.moon.sign || ZodiacSign.ARIES,
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
          sunSign: (d1Sun?.sign as any) || baseTropicalChart.sun.sign || ZodiacSign.ARIES,
          moonSign: (d1Moon?.sign as any) || baseTropicalChart.moon.sign || ZodiacSign.ARIES,
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

      // Create or update divisional charts
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

      // Fetch complete chart with divisional charts
      const completeChart = await prisma.natalChart.findUnique({
        where: { userId },
        include: { 
          ...FULL_NATAL_CHART_INCLUDE,
          divisionalCharts: {
            include: {
              planetaryPositions: true,
              houses: true,
            }
          },
        },
      });

      res.json({
        success: true,
        data: completeChart,
      });
    } catch (error) {
      logger.error("Vedic chart calculation failed", { error });
      next(error);
    }
  }
);

// GET /vedic/chart/divisional/:chartType - Get specific divisional chart
router.get(
  "/divisional/:chartType",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chartType } = req.params;
      const validTypes = ["D1", "D2", "D4", "D9", "D10"];

      if (!validTypes.includes(chartType.toUpperCase())) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_CHART_TYPE",
            message: `Chart type must be one of: ${validTypes.join(", ")}`,
          },
        });
        return;
      }


      const natalChart = await prisma.natalChart.findUnique({
        where: { userId: req.userId },
      });

      if (!natalChart) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Natal chart not found" },
        });
        return;
      }

      const divisionalChart = await prisma.divisionalChart.findFirst({
        where: {
          natalChartId: natalChart.id,
          chartType: chartType.toUpperCase() as DivisionalChartType,
        },
        include: {
          planetaryPositions: true,
          houses: true,
        },
      });

      if (!divisionalChart) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Divisional chart not found" },
        });
        return;
      }

      res.json({
        success: true,
        data: divisionalChart,
      });
    } catch (error) {
      next(error);
    }
  }
);


// GET /vedic/chart/nakshatra - Get user's nakshatra details
router.get("/nakshatra", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chart = await prisma.natalChart.findUnique({
      where: { userId: req.userId },
    });

    if (!chart) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Natal chart not found" },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        nakshatra: chart.nakshatra,
        pada: chart.nakshatraPada,
        lord: chart.nakshatraLord,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /vedic/recalculate - Recalculate Vedic chart with different ayanamsa
router.post(
  "/recalculate",
  [
    body("ayanamsa")
      .optional()
      .isIn(["lahiri", "raman", "krishnamurti", "fagan-bradley"]),
  ],
  async (req: Request, _res: Response, next: NextFunction) => {
    // Delegate to the calculate endpoint logic - just call calculate
    req.url = '/calculate';
    return next();
  }
);

export default router;
