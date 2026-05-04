import { describe, expect, it } from "vitest";
import { calculateUserTransits, PlanetPosition, PlanetName } from "./astrology";
import { ZodiacSign } from "@prisma/client";

function position(planet: PlanetName, longitude: number): PlanetPosition {
  return {
    planet,
    longitude,
    latitude: 0,
    distance: 1,
    sign: ZodiacSign.ARIES,
    signDegree: 0,
    degree: 0,
    minute: 0,
    retrograde: false,
    house: 1,
    speed: 1,
  };
}

describe("calculateUserTransits", () => {
  it("detects a conjunction between transit Sun and natal Sun", () => {
    const natalPositions = {
      SUN: { planet: "SUN", longitude: 10 },
    };
    const transitPositions = {
      sun: position("SUN", 11),
    };

    const transits = calculateUserTransits(natalPositions, transitPositions as any);
    
    expect(transits.length).toBeGreaterThan(0);
    const sunSun = transits.find(t => t.planet1 === "SUN" && t.planet2 === "SUN");
    expect(sunSun?.type).toBe("CONJUNCTION");
    expect(sunSun?.orb).toBeCloseTo(1, 1);
  });

  it("detects an opposition between transit Saturn and natal Moon", () => {
    const natalPositions = {
      MOON: { planet: "MOON", longitude: 50 },
    };
    const transitPositions = {
      saturn: position("SATURN", 231), // 50 + 180 + 1
    };

    const transits = calculateUserTransits(natalPositions, transitPositions as any);
    
    expect(transits.length).toBeGreaterThan(0);
    const saturnMoon = transits.find(t => t.planet1 === "SATURN" && t.planet2 === "MOON");
    expect(saturnMoon?.type).toBe("OPPOSITION");
    expect(saturnMoon?.orb).toBeCloseTo(1, 1);
  });
});
