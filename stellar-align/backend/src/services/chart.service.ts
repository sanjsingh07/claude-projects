import { prisma } from "../config/database";
import logger from "../config/logger";
import { astrologyService } from "./astrology";
import { calculateVedicChart } from "./vedicAstrology";
import { HouseSystem, AyanamsaType, ZodiacType, DivisionalChartType } from "@prisma/client";
import { FULL_NATAL_CHART_INCLUDE } from "../models/natalChart";
import { chartQueue } from "../config/queue";

export class ChartService {
  /**
   * Enqueue a natal chart calculation for a user
   */
  async enqueueChartCalculation(userId: string): Promise<void> {
    await chartQueue.add(`calculate-chart-${userId}`, { userId }, {
      jobId: `chart-${userId}`, // Prevent duplicate jobs for the same user
    });
    logger.info("Enqueued natal chart calculation", { userId });
  }

  /**
   * Calculate both Western (Natal) and Vedic charts for a user
   * This is the method called by the worker
   */
  async calculateAllChartsForUser(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { natalChart: { include: FULL_NATAL_CHART_INCLUDE } },
      });

      // Skip if user not found or already has a natal chart
      if (!user) {
        logger.warn("User not found for chart calculation", { userId });
        return;
      }
      
      if (user.natalChart) {
        logger.info("User already has a natal chart, skipping initial calculation", { userId });
        return;
      }

      // Check if we have the required birth data
      if (
        user.birthDateTime &&
        user.birthLatitude != null &&
        user.birthLongitude != null
      ) {
        // Use default time of 12:00 if unknown or not provided
        const timeStr = (user.birthDateTime && !user.birthTimeUnknown)
          ? user.birthDateTime.toISOString().slice(11, 16) // Extract HH:mm from ISO string
          : "12:00";

        logger.info("Starting natal chart calculation", { 
          userId, 
          dateTime: user.birthDateTime,
          lat: user.birthLatitude,
          lon: user.birthLongitude
        });

        // 1. Calculate Western natal chart data first (Tropical)
        const westernChart = await astrologyService.calculateNatalChart(
          user.birthDateTime,
          timeStr,
          user.birthLatitude,
          user.birthLongitude,
          user.birthTimezone || "UTC",
          HouseSystem.PLACIDUS,
          ZodiacType.TROPICAL,
        );

        // 2. Calculate Vedic chart with divisional charts (using Western as base)
        const vedicChart = await calculateVedicChart(
          {
            date: user.birthDateTime,
            time: timeStr,
            latitude: user.birthLatitude,
            longitude: user.birthLongitude,
            timezone: user.birthTimezone || "UTC",
            ayanamsa: AyanamsaType.LAHIRI,
          },
          westernChart,
        );

        // Get Moon's nakshatra info
        const moonNakshatra = vedicChart.nakshatras.moon;
        
        // 3. Save everything in a single transaction
        await prisma.natalChart.create({
          data: {
            userId,
            sunSign: westernChart.sun.sign,
            moonSign: westernChart.moon.sign,
            risingSign: westernChart.ascendant?.sign || null,
            houseSystem: HouseSystem.PLACIDUS,
            calculationMethod: "swiss_ephemeris",
            zodiacType: ZodiacType.TROPICAL,
            ayanamsa: AyanamsaType.LAHIRI,
            nakshatra: moonNakshatra.name,
            nakshatraPada: moonNakshatra.pada,
            nakshatraLord: moonNakshatra.lord,
            calculatedAt: new Date(),
            planetaryPositions: {
              create: [
                "sun", "moon", "mercury", "venus", "mars", "jupiter", 
                "saturn", "uranus", "neptune", "pluto", "chiron", 
                "lilith", "node", "ascendant", "midheaven"
              ].map(p => {
                const pos = (westernChart as any)[p];
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
              }),
            },
            houses: {
              create: westernChart.houses.map(h => ({
                house: h.house,
                sign: h.sign,
                longitude: h.longitude,
                degree: h.degree,
                minute: h.minute,
              })),
            },
            aspects: {
              create: westernChart.aspects.map(a => ({
                planet1: a.planet1,
                planet2: a.planet2,
                type: a.type,
                angle: a.angle,
                orb: a.orb,
                applying: a.applying,
              })),
            },
            divisionalCharts: {
              create: [
                { chartType: DivisionalChartType.D1, data: vedicChart.d1 },
                { chartType: DivisionalChartType.D2, data: vedicChart.d2 },
                { chartType: DivisionalChartType.D4, data: vedicChart.d4 },
                { chartType: DivisionalChartType.D9, data: vedicChart.d9 },
                { chartType: DivisionalChartType.D10, data: vedicChart.d10 },
              ].map(dc => ({
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
              })),
            },
          },
        });

        logger.info("Atomic Western + Vedic chart calculation saved successfully via worker", {
          userId,
          sunSign: westernChart.sun.sign,
          moonSign: westernChart.moon.sign,
        });
      } else {
        logger.warn("Required birth data missing for chart calculation", {
          userId,
          hasDateTime: !!user.birthDateTime,
          hasLat: user.birthLatitude != null,
          hasLon: user.birthLongitude != null
        });
      }
    } catch (error) {
      logger.error("Failed to calculate charts for user in worker", {
        userId,
        error,
      });
      throw error; // Re-throw so BullMQ can retry
    }
  }
}

export const chartService = new ChartService();