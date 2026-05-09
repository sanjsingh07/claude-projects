import { Router, Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middleware/auth";
import { prisma } from "../config/database";
import { calculateNatalChart } from "../services/astrology";
import { calculateVedicChart } from "../services/vedicAstrology";
import { AyanamsaType, HouseSystem, ZodiacType, DivisionalChartType } from "@prisma/client";

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
        divisionalCharts: {
          include: {
            planetaryPositions: true,
            houses: true,
          }
        },
        planetaryPositions: true,
        houses: true,
        aspects: true,
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

      if (!user.profileCompleted || !user.birthLatitude || !user.birthLongitude) {
        res.status(400).json({
          success: false,
          error: {
            code: "PROFILE_INCOMPLETE",
            message: "Birth location and profile completion required",
          },
        });
        return;
      }

      const ayanamsaType = (req.body.ayanamsa?.toUpperCase() as AyanamsaType) || AyanamsaType.LAHIRI;
      const birthTime = user.birthTime
        ? user.birthTime.toISOString().slice(11, 16)
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
      
      // We need to handle the relations manually since Prisma upsert doesn't support nested deletes
      let natalChart = await prisma.natalChart.findUnique({ where: { userId } });
      
      if (natalChart) {
        await prisma.$transaction([
          prisma.natalPlanetPosition.deleteMany({ where: { natalChartId: natalChart.id } }),
          prisma.natalHouseCusp.deleteMany({ where: { natalChartId: natalChart.id } }),
          prisma.natalAspect.deleteMany({ where: { natalChartId: natalChart.id } }),
          prisma.divisionalChart.deleteMany({ where: { natalChartId: natalChart.id } }),
          prisma.natalChart.update({
            where: { id: natalChart.id },
            data: {
              sunSign: (d1Sun?.sign as any) || chartData.sun.sign,
              moonSign: (d1Moon?.sign as any) || chartData.moon.sign,
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
                create: vedicChart.d1.planetaryPositions.map(p => ({
                  planet: p.planet.toUpperCase(),
                  sign: p.sign,
                  longitude: 0,
                  latitude: 0,
                  distance: 0,
                  speed: 0,
                  degree: Math.floor(p.degree),
                  minute: Math.round((p.degree % 1) * 60),
                  house: p.house,
                  retrograde: p.retrograde || false,
                })),
              },
              houses: {
                create: vedicChart.d1.houses.map(h => ({
                  house: h.house,
                  sign: h.sign,
                  longitude: 0,
                  degree: 0,
                  minute: 0,
                })),
              },
            },
          }),
        ]);
      } else {
        natalChart = await prisma.natalChart.create({
          data: {
            userId,
            sunSign: (d1Sun?.sign as any) || chartData.sun.sign,
            moonSign: (d1Moon?.sign as any) || chartData.moon.sign,
            risingSign: vedicChart.d1.ascendant,
            houseSystem: HouseSystem.WHOLE_SIGN,
            calculationMethod: "vedic",
            zodiacType: ZodiacType.SIDEREAL,
            ayanamsa: ayanamsaType,
            nakshatra: moonNakshatra.name,
            nakshatraPada: moonNakshatra.pada,
            nakshatraLord: moonNakshatra.lord,
            planetaryPositions: {
              create: vedicChart.d1.planetaryPositions.map(p => ({
                planet: p.planet.toUpperCase(),
                sign: p.sign,
                longitude: 0,
                latitude: 0,
                distance: 0,
                speed: 0,
                degree: Math.floor(p.degree),
                minute: Math.round((p.degree % 1) * 60),
                house: p.house,
                retrograde: p.retrograde || false,
              })),
            },
            houses: {
              create: vedicChart.d1.houses.map(h => ({
                house: h.house,
                sign: h.sign,
                longitude: 0,
                degree: 0,
                minute: 0,
              })),
            },
          },
        });
      }

      // Create divisional charts
      const divisionalChartsData = [
        { chartType: DivisionalChartType.D1, data: vedicChart.d1 },
        { chartType: DivisionalChartType.D2, data: vedicChart.d2 },
        { chartType: DivisionalChartType.D4, data: vedicChart.d4 },
        { chartType: DivisionalChartType.D9, data: vedicChart.d9 },
        { chartType: DivisionalChartType.D10, data: vedicChart.d10 },
      ];

      for (const dc of divisionalChartsData) {
        await prisma.divisionalChart.create({
          data: {
            natalChartId: natalChart.id,
            chartType: dc.chartType,
            ascendant: dc.data.ascendant,
            ascendantDegree: dc.data.ascendantDegree,
            planetaryPositions: {
              create: dc.data.planetaryPositions.map(p => ({
                planet: p.planet.toUpperCase(),
                sign: p.sign,
                degree: p.degree,
                house: p.house,
                retrograde: p.retrograde || false,
                combust: p.combust || false,
              })),
            },
            houses: {
              create: dc.data.houses.map(h => ({
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
          divisionalCharts: {
            include: {
              planetaryPositions: true,
              houses: true,
            }
          },
          planetaryPositions: true,
          houses: true,
          aspects: true,
        },
      });

      res.json({
        success: true,
        data: completeChart,
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
