import { describe, expect, it } from "vitest";
import { AyanamsaType, DivisionalChartType, ZodiacSign } from "@prisma/client";
import * as sweph from "sweph";
import { calculateVedicChart, getAyanamsa } from "./vedicAstrology";
import { NatalChartData, PlanetName, PlanetPosition } from "./astrology";

const date = new Date(Date.UTC(2000, 0, 1));
const jd = sweph.julday(2000, 1, 1, 0, sweph.constants.SE_GREG_CAL);
const ayanamsa = getAyanamsa(jd, AyanamsaType.LAHIRI);

function tropicalFromSidereal(siderealLongitude: number): number {
  return (siderealLongitude + ayanamsa) % 360;
}

function position(planet: PlanetName, siderealLongitude: number): PlanetPosition {
  return {
    planet,
    longitude: tropicalFromSidereal(siderealLongitude),
    latitude: 0,
    distance: 1,
    sign: ZodiacSign.ARIES,
    signDegree: 0,
    degree: 0,
    minute: 0,
    retrograde: false,
    house: 1,
    speed: 0,
  };
}

function planet(chart: { planetaryPositions: Array<{ planet: string; sign: ZodiacSign }> }, name: string) {
  return chart.planetaryPositions.find((p) => p.planet === name);
}

const natalChartData: NatalChartData = {
  sun: position("SUN", 10), // Aries 10 degrees
  moon: position("MOON", 50), // Taurus 20 degrees
  mercury: position("MERCURY", 32), // Taurus 2 degrees
  venus: position("VENUS", 71), // Gemini 11 degrees
  mars: position("MARS", 0),
  jupiter: position("JUPITER", 229), // Scorpio 19 degrees
  saturn: position("SATURN", 0),
  uranus: position("URANUS", 0),
  neptune: position("NEPTUNE", 0),
  pluto: position("PLUTO", 0),
  chiron: position("CHIRON", 0),
  lilith: position("LILITH", 0),
  node: position("NODE", 0),
  ascendant: position("ASCENDANT", 37.833333), // Taurus 7 degrees 50 minutes
  midheaven: position("MIDHEAVEN", 0),
  houses: [],
  aspects: [],
};

describe("calculateVedicChart", () => {
  it("stores D1 ascendant as the sidereal ascendant sign and degree", async () => {
    const chart = await calculateVedicChart(
      { date, time: "00:00", latitude: 0, longitude: 0, timezone: "UTC", ayanamsa: AyanamsaType.LAHIRI },
      natalChartData,
    );

    expect(chart.d1.chartType).toBe(DivisionalChartType.D1);
    expect(chart.d1.ascendant).toBe(ZodiacSign.TAURUS);
    expect(chart.d1.ascendantDegree).toBeCloseTo(7.8333, 3);
  });

  it("uses Parashara-style varga sign mappings for planets and ascendant", async () => {
    const chart = await calculateVedicChart(
      { date, time: "00:00", latitude: 0, longitude: 0, timezone: "UTC", ayanamsa: AyanamsaType.LAHIRI },
      natalChartData,
    );

    expect(chart.d2.ascendant).toBe(ZodiacSign.CANCER);
    expect(planet(chart.d2, "sun")?.sign).toBe(ZodiacSign.LEO);
    expect(planet(chart.d2, "moon")?.sign).toBe(ZodiacSign.LEO);

    expect(chart.d4.ascendant).toBe(ZodiacSign.LEO);
    expect(planet(chart.d4, "sun")?.sign).toBe(ZodiacSign.CANCER);

    expect(chart.d9.ascendant).toBe(ZodiacSign.PISCES);
    expect(planet(chart.d9, "mercury")?.sign).toBe(ZodiacSign.CAPRICORN);

    expect(chart.d10.ascendant).toBe(ZodiacSign.PISCES);
    expect(planet(chart.d10, "mercury")?.sign).toBe(ZodiacSign.CAPRICORN);

    expect(planet(chart.d11, "venus")?.sign).toBe(ZodiacSign.GEMINI);
    expect(planet(chart.d11, "jupiter")?.sign).toBe(ZodiacSign.PISCES);
  });
});
