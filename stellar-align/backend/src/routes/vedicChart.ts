import { Router, Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middleware/auth";
import { prisma } from "../config/database";
import { calculateNatalChart } from "../services/astrology";
import { calculateVedicChart } from "../services/vedicAstrology";
import { AyanamsaType, HouseSystem, ZodiacType, DivisionalChartType } from "@prisma/client";
import { transformPlanetaryPositions } from "../utils/chart";

const router = Router();

router.use(authMiddleware);

// GET /vedic/chart - Get user's Vedic chart with all divisional charts
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chart = await prisma.natalChart.findUnique({
      where: { userId: req.userId },
      include: {
        divisionalCharts: true,
      },
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
        calculationMethod: chart.calculationMethod,
        zodiacType: chart.zodiacType,
        ayanamsa: chart.ayanamsa,
        nakshatra: chart.nakshatra,
        nakshatraPada: chart.nakshatraPada,
        nakshatraLord: chart.nakshatraLord,
        calculatedAt: chart.calculatedAt,
        divisionalCharts: chart.divisionalCharts,
      },
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

      const ayanamsaType = (req.body.ayanamsa?.toUpperCase() as AyanamsaType) || AyanamsaType.LAHIRI;
      const birthTime = user.birthTime
        ? user.birthTime.toTimeString().slice(0, 5)
        : "12:00";

      // First calculate the base natal chart (tropical positions)
      const chartData = await calculateNatalChart(
        user.birthDate,
        birthTime,
        user.birthLatitude,
        user.birthLongitude,
        user.birthTimezone
      );

      // Calculate Vedic chart with divisional charts
      const vedicChart = await calculateVedicChart(
        {
          date: user.birthDate,
          time: birthTime,
          latitude: user.birthLatitude,
          longitude: user.birthLongitude,
          timezone: user.birthTimezone,
          ayanamsa: ayanamsaType,
        },
        chartData
      );

      // Get Moon's nakshatra info
      const moonNakshatra = vedicChart.nakshatras.moon;

      // Extract D1 positions for the main NatalChart signs
      const d1Sun = vedicChart.d1.planetaryPositions.find(p => p.planet === "sun");
      const d1Moon = vedicChart.d1.planetaryPositions.find(p => p.planet === "moon");

      // Upsert natal chart with Vedic data
      const userId = req.userId!;
      const chart = await prisma.natalChart.upsert({
        where: { userId },
        create: {
          userId,
          sunSign: (d1Sun?.sign as any) || chartData.sun.sign,
          moonSign: (d1Moon?.sign as any) || chartData.moon.sign,
          risingSign: vedicChart.d1.ascendant,
          planetaryPositions: vedicChart.d1.planetaryPositions as any,
          houses: vedicChart.d1.houses as any,
          aspects: chartData.aspects as any,
          chartPattern: undefined,
          houseSystem: HouseSystem.WHOLE_SIGN, // Vedic uses whole sign
          calculationMethod: "vedic",
          zodiacType: ZodiacType.SIDEREAL,
          ayanamsa: ayanamsaType,
          nakshatra: moonNakshatra.name,
          nakshatraPada: moonNakshatra.pada,
          nakshatraLord: moonNakshatra.lord,
        },
        update: {
          sunSign: (d1Sun?.sign as any) || chartData.sun.sign,
          moonSign: (d1Moon?.sign as any) || chartData.moon.sign,
          risingSign: vedicChart.d1.ascendant,
          planetaryPositions: vedicChart.d1.planetaryPositions as any,
          houses: vedicChart.d1.houses as any,
          aspects: chartData.aspects as any,
          chartPattern: undefined,
          houseSystem: HouseSystem.WHOLE_SIGN,
          calculationMethod: "vedic",
          zodiacType: ZodiacType.SIDEREAL,
          ayanamsa: ayanamsaType,
          nakshatra: moonNakshatra.name,
          nakshatraPada: moonNakshatra.pada,
          nakshatraLord: moonNakshatra.lord,
          calculatedAt: new Date(),
        },
      });

      // Create or update divisional charts (Removed D11)
      const divisionalChartsData = [
        { chartType: DivisionalChartType.D1, data: vedicChart.d1 },
        { chartType: DivisionalChartType.D2, data: vedicChart.d2 },
        { chartType: DivisionalChartType.D4, data: vedicChart.d4 },
        { chartType: DivisionalChartType.D9, data: vedicChart.d9 },
        { chartType: DivisionalChartType.D10, data: vedicChart.d10 },
      ];

      // Delete existing divisional charts and create new ones
      await prisma.divisionalChart.deleteMany({
        where: { natalChartId: chart.id },
      });

      await prisma.divisionalChart.createMany({
        data: divisionalChartsData.map((dc) => ({
          natalChartId: chart.id,
          chartType: dc.chartType,
          planetaryPositions: dc.data.planetaryPositions as any,
          ascendant: dc.data.ascendant,
          ascendantDegree: dc.data.ascendantDegree,
          houses: dc.data.houses as any,
        })),
      });

      // Fetch complete chart with divisional charts
      const completeChart = await prisma.natalChart.findUnique({
        where: { userId },
        include: { divisionalCharts: true },
      });

      const planetaryPositions = transformPlanetaryPositions(completeChart?.planetaryPositions);

      res.json({
        success: true,
        data: {
          id: completeChart?.id,
          userId: completeChart?.userId,
          sunSign: completeChart?.sunSign,
          moonSign: completeChart?.moonSign,
          risingSign: completeChart?.risingSign,
          planetaryPositions,
          houses: completeChart?.houses,
          aspects: completeChart?.aspects,
          chartPattern: completeChart?.chartPattern,
          houseSystem: completeChart?.houseSystem,
          calculationMethod: completeChart?.calculationMethod,
          zodiacType: completeChart?.zodiacType,
          ayanamsa: completeChart?.ayanamsa,
          nakshatra: completeChart?.nakshatra,
          nakshatraPada: completeChart?.nakshatraPada,
          nakshatraLord: completeChart?.nakshatraLord,
          calculatedAt: completeChart?.calculatedAt,
          divisionalCharts: completeChart?.divisionalCharts,
          vedicChart: {
            ayanamsa: vedicChart.ayanamsa,
            ayanamsaType: vedicChart.ayanamsaType,
            nakshatras: vedicChart.nakshatras,
          },
        },
      });
    } catch (error) {
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
      const validTypes = ["D1", "D2", "D4", "D9", "D10"]; // Removed D11

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
