import { DateTime } from "luxon";
import logger from "../config/logger";
import { aiContentService } from "./aiContent";
import { llmProvider } from "./llmProvider";
import { ZodiacSign, HouseSystem, AyanamsaType, ZodiacType } from "@prisma/client";
import { notificationService } from "./notification.service";
import * as sweph from "sweph";
import path from "path";
import fs from "fs";

// ────────────────────────────────────────────
// Configuration
// ────────────────────────────────────────────

// Set ephemeris path if data exists
const ephePath = path.join(process.cwd(), "ephe");
if (fs.existsSync(ephePath)) {
  sweph.set_ephe_path(ephePath);
}

// ────────────────────────────────────────────
// Constants & Types
// ────────────────────────────────────────────

const ZODIAC_SIGNS: ZodiacSign[] = [
  ZodiacSign.ARIES, ZodiacSign.TAURUS, ZodiacSign.GEMINI, ZodiacSign.CANCER,
  ZodiacSign.LEO, ZodiacSign.VIRGO, ZodiacSign.LIBRA, ZodiacSign.SCORPIO,
  ZodiacSign.SAGITTARIUS, ZodiacSign.CAPRICORN, ZodiacSign.AQUARIUS, ZodiacSign.PISCES,
];

const ASPECTS = {
  CONJUNCTION: { angle: 0, orb: 8 },
  SEXTILE: { angle: 60, orb: 6 },
  SQUARE: { angle: 90, orb: 8 },
  TRINE: { angle: 120, orb: 8 },
  OPPOSITION: { angle: 180, orb: 8 },
  QUINCUNX: { angle: 150, orb: 3 },
} as const;

export type PlanetName =
  | "SUN"
  | "MOON"
  | "MERCURY"
  | "VENUS"
  | "MARS"
  | "JUPITER"
  | "SATURN"
  | "URANUS"
  | "NEPTUNE"
  | "PLUTO"
  | "CHIRON"
  | "LILITH"
  | "NODE"
  | "KETU"
  | "ASCENDANT"
  | "MIDHEAVEN";

export type AspectType = keyof typeof ASPECTS;

export interface PlanetPosition {
  planet: PlanetName;
  longitude: number;
  latitude: number;
  distance: number;
  sign: ZodiacSign;
  signDegree: number;
  degree: number;
  minute: number;
  retrograde: boolean;
  house: number | null;
  speed: number;
}

export interface HouseCusp {
  house: number;
  longitude: number;
  sign: ZodiacSign;
  degree: number;
  minute: number;
}

export interface Aspect {
  planet1: PlanetName;
  planet2: PlanetName;
  type: AspectType;
  angle: number;
  orb: number;
  exact: boolean;
  applying: boolean;
}

export interface NatalChartData {
  sun: PlanetPosition;
  moon: PlanetPosition;
  mercury: PlanetPosition;
  venus: PlanetPosition;
  mars: PlanetPosition;
  jupiter: PlanetPosition;
  saturn: PlanetPosition;
  uranus: PlanetPosition;
  neptune: PlanetPosition;
  pluto: PlanetPosition;
  chiron: PlanetPosition;
  lilith: PlanetPosition;
  node: PlanetPosition;
  ascendant: PlanetPosition;
  midheaven: PlanetPosition;
  houses: HouseCusp[];
  aspects: Aspect[];
}

// Map PlanetName to Swiss Ephemeris IDs
const PLANET_MAP: Record<string, number> = {
  SUN: sweph.constants.SE_SUN,
  MOON: sweph.constants.SE_MOON,
  MERCURY: sweph.constants.SE_MERCURY,
  VENUS: sweph.constants.SE_VENUS,
  MARS: sweph.constants.SE_MARS,
  JUPITER: sweph.constants.SE_JUPITER,
  SATURN: sweph.constants.SE_SATURN,
  URANUS: sweph.constants.SE_URANUS,
  NEPTUNE: sweph.constants.SE_NEPTUNE,
  PLUTO: sweph.constants.SE_PLUTO,
  CHIRON: sweph.constants.SE_CHIRON,
  LILITH: sweph.constants.SE_MEAN_APOG, // Dark Moon Lilith
  NODE: sweph.constants.SE_TRUE_NODE,   // Default to True Node
};

// ────────────────────────────────────────────
// Utility functions
// ────────────────────────────────────────────

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function sanitizeNumber(val: any, fallback: number = 0): number {
  if (val === null || val === undefined || isNaN(Number(val)) || !isFinite(Number(val))) {
    return fallback;
  }
  return Number(val);
}

function getSignFromLongitude(longitude: number): ZodiacSign {
  const lon = sanitizeNumber(longitude);
  const normalized = ((lon % 360) + 360) % 360;
  const index = Math.floor(normalized / 30) % 12;
  return ZODIAC_SIGNS[index] || ZodiacSign.ARIES;
}

function getSignDegree(longitude: number): { degree: number; minute: number } {
  const lon = sanitizeNumber(longitude);
  const normalized = ((lon % 360) + 360) % 360;
  const withinSign = normalized % 30;
  const degree = Math.floor(withinSign);
  const minute = Math.round((withinSign - degree) * 60);
  return { 
    degree: sanitizeNumber(degree), 
    minute: minute === 60 ? 0 : sanitizeNumber(minute) 
  };
}

function normalizeAngle(angle: number): number {
  const a = sanitizeNumber(angle);
  return ((a % 360) + 360) % 360;
}

// ────────────────────────────────────────────
// Planetary position calculations (Swiss Ephemeris)
// ────────────────────────────────────────────

function calcPlanetPosition(
  jd: number,
  planet: PlanetName,
  flags: number = sweph.constants.SEFLG_SPEED,
): PlanetPosition {
  const seId = PLANET_MAP[planet];
  if (seId === undefined) {
    throw new Error(`Planet ${planet} not supported in SE mapping`);
  }

  let result = sweph.calc_ut(jd, seId, flags);
  
  // If Swiss Ephemeris fails (usually missing files), fallback to Moshier
  if (result.error && !(flags & sweph.constants.SEFLG_MOSEPH)) {
    logger.warn(`SwissEph failed for ${planet}, falling back to Moshier`, { 
      error: result.error,
      jd,
      planet 
    });
    result = sweph.calc_ut(jd, seId, sweph.constants.SEFLG_MOSEPH | sweph.constants.SEFLG_SPEED);
  }

  if (result.error) {
    logger.error(`sweph.calc_ut critical error for ${planet} after fallback`, { 
      error: result.error,
      jd,
      planet,
      flags: flags | sweph.constants.SEFLG_MOSEPH
    });
  }
  
  const [longitude, latitude, distance, lonSpeed] = result.data || [0, 0, 0, 0];
  
  const safeLon = sanitizeNumber(longitude);
  const safeLat = sanitizeNumber(latitude);
  const safeDist = sanitizeNumber(distance);
  const safeSpeed = sanitizeNumber(lonSpeed);

  const sign = getSignFromLongitude(safeLon);
  const deg = getSignDegree(safeLon);

  return {
    planet,
    longitude: safeLon,
    latitude: safeLat,
    distance: safeDist,
    sign,
    signDegree: deg.degree,
    degree: deg.degree,
    minute: deg.minute,
    retrograde: safeSpeed < 0,
    house: null,
    speed: safeSpeed,
  };
}

// ────────────────────────────────────────────
// House cusp calculation
// ────────────────────────────────────────────

function calcHouses(
  jd: number,
  latitude: number,
  longitude: number,
  system: HouseSystem = HouseSystem.PLACIDUS,
): { houses: HouseCusp[]; ascendant: number; midheaven: number } {
  // Map HouseSystem to SE codes
  const systemMap: Record<HouseSystem, string> = {
    [HouseSystem.PLACIDUS]: "P",
    [HouseSystem.KOCH]: "K",
    [HouseSystem.WHOLE_SIGN]: "W",
    [HouseSystem.EQUAL]: "E",
    [HouseSystem.PORPHYRY]: "O",
  };

  const seSystem = systemMap[system] || "P";
  const result = sweph.houses(jd, latitude, longitude, seSystem);

  const rawHouses = result.data?.houses || Array(12).fill(0);
  const rawPoints = result.data?.points || [0, 0];

  const houses: HouseCusp[] = rawHouses.map((cuspLon: number, idx: number) => {
    const safeLon = sanitizeNumber(cuspLon);
    const sign = getSignFromLongitude(safeLon);
    const deg = getSignDegree(safeLon);
    return {
      house: idx + 1,
      longitude: safeLon,
      sign,
      degree: deg.degree,
      minute: deg.minute,
    };
  });

  return {
    houses,
    ascendant: sanitizeNumber(rawPoints[0]), 
    midheaven: sanitizeNumber(rawPoints[1]),
  };
}


// ────────────────────────────────────────────
// Assign planets to houses
// ────────────────────────────────────────────

function assignHouses(positions: PlanetPosition[], houses: HouseCusp[], system: HouseSystem): void {
  const houseLongitudes = houses.map((h) => h.longitude);

  positions.forEach((pos) => {
    if (system === HouseSystem.WHOLE_SIGN) {
      // Whole sign: house 1 starts at 0° of the ascendant's sign
      const ascSign = houses[0].sign;
      const ascSignIdx = ZODIAC_SIGNS.indexOf(ascSign);
      const planetSignIdx = ZODIAC_SIGNS.indexOf(pos.sign);
      pos.house = ((planetSignIdx - ascSignIdx + 12) % 12) + 1;
    } else {
      for (let i = 0; i < 12; i++) {
        const start = houseLongitudes[i];
        const end = houseLongitudes[(i + 1) % 12];

        let isInHouse: boolean;
        if (start < end) {
          isInHouse = pos.longitude >= start && pos.longitude < end;
        } else {
          isInHouse = pos.longitude >= start || pos.longitude < end;
        }

        if (isInHouse) {
          pos.house = i + 1;
          break;
        }
      }
    }
  });
}

// ────────────────────────────────────────────
// Aspect calculation helpers
// ────────────────────────────────────────────

export function getOrb(lon1: number, lon2: number, targetAngle: number): number {
  let diff = Math.abs(lon1 - lon2);
  if (diff > 180) diff = 360 - diff;
  return Math.abs(diff - targetAngle);
}

/**
 * Determines if an aspect is applying (getting closer to exact) or separating.
 * Uses a small time-step (1 minute) to compare the current orb with the future orb.
 */
export function isAspectApplying(
  p1: { longitude: number; speed: number },
  p2: { longitude: number; speed: number },
  targetAngle: number,
): boolean {
  const dt = 1 / 1440; // 1 minute in days (assuming speed is degrees/day)
  
  const currentOrb = getOrb(p1.longitude, p2.longitude, targetAngle);
  const futureOrb = getOrb(
    normalizeAngle(p1.longitude + p1.speed * dt),
    normalizeAngle(p2.longitude + p2.speed * dt),
    targetAngle,
  );

  // Return true if the distance to the exact aspect is decreasing
  return futureOrb < currentOrb;
}

// ────────────────────────────────────────────
// Aspect calculation
// ────────────────────────────────────────────

function calculateAspects(planets: PlanetPosition[]): Aspect[] {
  const aspects: Aspect[] = [];
  const list = Object.values(planets);

  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const p1 = list[i]!;
      const p2 = list[j]!;

      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;

      for (const [aspectName, aspectData] of Object.entries(ASPECTS)) {
        const orb = Math.abs(diff - aspectData.angle);
        if (orb <= aspectData.orb) {
          aspects.push({
            planet1: p1.planet,
            planet2: p2.planet,
            type: aspectName as AspectType,
            angle: aspectData.angle,
            orb,
            exact: orb < 1,
            applying: isAspectApplying(p1, p2, aspectData.angle),
          });
          break;
        }
      }
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
}

// ────────────────────────────────────────────
// Natal chart calculation
// ────────────────────────────────────────────

export async function calculateNatalChart(
  birthDate: Date,
  birthTime: string,
  latitude: number,
  longitude: number,
  timezone: string,
  houseSystem: HouseSystem = HouseSystem.PLACIDUS,
  zodiacType: ZodiacType = ZodiacType.TROPICAL,
  ayanamsaType: AyanamsaType = AyanamsaType.LAHIRI,
): Promise<NatalChartData> {
  try {
    const timeParts = birthTime.split(":").map(Number);
    const dateTime = DateTime.fromJSDate(birthDate, { zone: timezone })
      .set({ hour: timeParts[0] || 0, minute: timeParts[1] || 0, second: 0 })
      .toUTC();

    if (!dateTime.isValid) {
      throw new Error(`Invalid birth date or timezone: ${birthDate}, ${timezone}`);
    }

    // Convert to Julian Day
    const jd = sweph.julday(
      dateTime.year,
      dateTime.month,
      dateTime.day,
      dateTime.hour + dateTime.minute / 60 + dateTime.second / 3600,
      sweph.constants.SE_GREG_CAL
    );

    let ayanamsa = 0;
    if (zodiacType === ZodiacType.SIDEREAL) {
      const { getAyanamsa } = await import("./vedicAstrology");
      ayanamsa = getAyanamsa(jd, ayanamsaType);
    }

    // Calculate house cusps
    const { houses: tropicalHouses, ascendant: tropicalAsc, midheaven: tropicalMc } = calcHouses(jd, latitude, longitude, houseSystem);

    const planetsToCalc: PlanetName[] = [
      "SUN", "MOON", "MERCURY", "VENUS", "MARS", "JUPITER", "SATURN",
      "URANUS", "NEPTUNE", "PLUTO", "CHIRON", "LILITH", "NODE"
    ];

    let planetPositions = planetsToCalc.map(p => calcPlanetPosition(jd, p));

    // Convert to Sidereal if requested
    if (ayanamsa !== 0) {
      const { toSiderealLongitude } = await import("./vedicAstrology");
      planetPositions = planetPositions.map(pos => {
        const siderealLon = toSiderealLongitude(pos.longitude, ayanamsa);
        return {
          ...pos,
          longitude: siderealLon,
          sign: getSignFromLongitude(siderealLon),
          ...getSignDegree(siderealLon),
        };
      });
    }

    // Adjust houses for Sidereal
    let houses = tropicalHouses;
    let ascendant = tropicalAsc;
    let midheaven = tropicalMc;

    if (ayanamsa !== 0) {
      const { toSiderealLongitude } = await import("./vedicAstrology");
      houses = tropicalHouses.map(h => {
        const siderealLon = toSiderealLongitude(h.longitude, ayanamsa);
        return {
          ...h,
          longitude: siderealLon,
          sign: getSignFromLongitude(siderealLon),
          ...getSignDegree(siderealLon),
        };
      });
      ascendant = toSiderealLongitude(tropicalAsc, ayanamsa);
      midheaven = toSiderealLongitude(tropicalMc, ayanamsa);
    }

    // Assign houses
    assignHouses(planetPositions, houses, houseSystem);

    // Create Ascendant & Midheaven positions
    const ascSign = getSignFromLongitude(ascendant);
    const ascDeg = getSignDegree(ascendant);
    const ascendantPos: PlanetPosition = {
      planet: "ASCENDANT",
      longitude: ascendant,
      latitude: 0,
      distance: 0,
      sign: ascSign,
      signDegree: ascDeg.degree,
      degree: ascDeg.degree,
      minute: ascDeg.minute,
      retrograde: false,
      house: 1,
      speed: 0,
    };

    const mcSign = getSignFromLongitude(midheaven);
    const mcDeg = getSignDegree(midheaven);
    const midheavenPos: PlanetPosition = {
      planet: "MIDHEAVEN",
      longitude: midheaven,
      latitude: 0,
      distance: 0,
      sign: mcSign,
      signDegree: mcDeg.degree,
      degree: mcDeg.degree,
      minute: mcDeg.minute,
      retrograde: false,
      house: 10,
      speed: 0,
    };

    planetPositions.push(ascendantPos, midheavenPos);

    // Aspects
    const aspects = calculateAspects(planetPositions);

    // Build the result
    const posMap: Record<string, PlanetPosition> = {};
    for (const p of planetPositions) {
      posMap[p.planet] = p;
    }

    const chartData: NatalChartData = {
      sun: posMap.SUN,
      moon: posMap.MOON,
      mercury: posMap.MERCURY,
      venus: posMap.VENUS,
      mars: posMap.MARS,
      jupiter: posMap.JUPITER,
      saturn: posMap.SATURN,
      uranus: posMap.URANUS,
      neptune: posMap.NEPTUNE,
      pluto: posMap.PLUTO,
      chiron: posMap.CHIRON,
      lilith: posMap.LILITH,
      node: posMap.NODE,
      ascendant: posMap.ASCENDANT,
      midheaven: posMap.MIDHEAVEN,
      houses,
      aspects,
    };

    logger.info("Natal chart calculated with Swiss Ephemeris", {
      sunSign: chartData.sun.sign,
      moonSign: chartData.moon.sign,
      risingSign: chartData.ascendant.sign,
      houseSystem,
      zodiacType
    });

    return chartData;
  } catch (error) {
    logger.error("Error calculating natal chart", { error });
    throw new Error("Failed to calculate natal chart");
  }
}


// ────────────────────────────────────────────
// Current planetary positions (for transits)
// ────────────────────────────────────────────

export async function getPlanetaryPositions(
  date: Date = new Date(),
  ayanamsaType?: AyanamsaType,
): Promise<Partial<NatalChartData>> {
  const dt = DateTime.fromJSDate(date).toUTC();
  const jd = sweph.julday(
    dt.year,
    dt.month,
    dt.day,
    dt.hour + dt.minute / 60 + dt.second / 3600,
    sweph.constants.SE_GREG_CAL,
  );

  let ayanamsa = 0;
  if (ayanamsaType) {
    const { getAyanamsa } = await import("./vedicAstrology");
    ayanamsa = getAyanamsa(jd, ayanamsaType);
  }

  const planets: PlanetName[] = [
    "SUN",
    "MOON",
    "MERCURY",
    "VENUS",
    "MARS",
    "JUPITER",
    "SATURN",
    "URANUS",
    "NEPTUNE",
    "PLUTO",
  ];

  const positions: any = {};
  for (const p of planets) {
    let pos = calcPlanetPosition(jd, p);
    if (ayanamsa !== 0) {
      const { toSiderealLongitude } = await import("./vedicAstrology");
      const siderealLon = toSiderealLongitude(pos.longitude, ayanamsa);
      pos = {
        ...pos,
        longitude: siderealLon,
        sign: getSignFromLongitude(siderealLon),
        ...getSignDegree(siderealLon),
      };
    }
    positions[p.toLowerCase()] = pos;
  }

  return positions;
}

// Keep backward compatibility if needed, but we should use getPlanetaryPositions
export async function getCurrentPlanetaryPositions(): Promise<Partial<NatalChartData>> {
  return getPlanetaryPositions(new Date());
}

// ────────────────────────────────────────────
// Service Helpers
// ────────────────────────────────────────────

export function getMoonPhase(sunLongitude: number, moonLongitude: number): string {
  const separation = normalizeAngle(moonLongitude - sunLongitude);

  if (separation < 5) return "New Moon";
  if (separation < 85) return "Waxing Crescent";
  if (separation < 95) return "First Quarter";
  if (separation < 175) return "Waxing Gibbous";
  if (separation < 185) return "Full Moon";
  if (separation < 265) return "Waning Gibbous";
  if (separation < 275) return "Last Quarter";
  if (separation < 355) return "Waning Crescent";
  return "New Moon";
}

export function getChartElements(positions: PlanetPosition[]): { [key: string]: number } {
  const elements: { [key: string]: number } = { Fire: 0, Earth: 0, Air: 0, Water: 0 };

  const elementMap: Record<ZodiacSign, string> = {
    [ZodiacSign.ARIES]: "Fire", [ZodiacSign.LEO]: "Fire", [ZodiacSign.SAGITTARIUS]: "Fire",
    [ZodiacSign.TAURUS]: "Earth", [ZodiacSign.VIRGO]: "Earth", [ZodiacSign.CAPRICORN]: "Earth",
    [ZodiacSign.GEMINI]: "Air", [ZodiacSign.LIBRA]: "Air", [ZodiacSign.AQUARIUS]: "Air",
    [ZodiacSign.CANCER]: "Water", [ZodiacSign.SCORPIO]: "Water", [ZodiacSign.PISCES]: "Water",
  };

  const personalPlanets = ["SUN", "MOON", "MERCURY", "VENUS", "MARS"];
  positions.forEach((pos) => {
    if (personalPlanets.includes(pos.planet)) {
      const element = elementMap[pos.sign];
      if (element) elements[element] += 1;
    }
  });

  return elements;
}

// ────────────────────────────────────────────
// Generate daily horoscope for a user
// ────────────────────────────────────────────

export async function generateDailyHoroscope(
  userId: string,
  date: Date,
): Promise<any> {
  if (!userId) {
    throw new Error("userId is required for horoscope generation");
  }
  if (!date || isNaN(date.getTime())) {
    throw new Error("Valid date is required for horoscope generation");
  }

  try {
    const { prisma } = await import("../config/database");
    const { getTransitsForPeriod } = await import("./transits/transitEngine");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        natalChart: {
          include: {
            planetaryPositions: true,
            houses: true,
            aspects: true,
            divisionalCharts: {
              include: {
                planetaryPositions: true
              }
            }
          }
        } 
      },
    });

    if (!user?.natalChart) {
      throw new Error("Natal chart not found");
    }

    const { zodiacType, ayanamsa: ayanamsaType } = user.natalChart;
    
    // Calculate transits for today using the consolidated transit engine
    const userTimezone = user.birthTimezone || "UTC";
    const forecastData = await getTransitsForPeriod(user.natalChart, "week", date, userTimezone);
    
    // Filter for transits happening exactly today (or very close)
    const todayISO = DateTime.fromJSDate(date, { zone: userTimezone }).toISODate();
    const todayTransits = forecastData.transits.filter(t => 
      DateTime.fromISO(t.date.iso, { zone: userTimezone }).toISODate() === todayISO || t.orb.value < 0.5
    );

    // Separate Personal (Natal) vs Mundane (Sky) transits for the AI
    const personalTransits = todayTransits.filter(t => t.eventKind === "natal_aspect");
    const mundaneTransits = todayTransits.filter(t => t.eventKind === "sky_aspect" || t.eventKind === "ingress" || t.eventKind.includes("station"));

    // Get current planetary positions for moon sign/phase
    const transitPositions = await getPlanetaryPositions(
      date, 
      zodiacType === "SIDEREAL" ? ayanamsaType : undefined
    );
    
    const sunPos = transitPositions.sun as any;
    const moonPos = transitPositions.moon as any;
    const moonPhase = getMoonPhase(sunPos.longitude, moonPos.longitude);

    // Prepare Vedic data if applicable
    let vedicData = undefined;
    if (zodiacType === "SIDEREAL") {
      const { calculateNakshatra } = await import("./vedicAstrology");
      const moonNak = calculateNakshatra(moonPos.longitude);
      vedicData = {
        nakshatra: moonNak.name,
        nakshatraPada: moonNak.pada,
        nakshatraLord: moonNak.lord,
        ayanamsa: ayanamsaType,
        divisionalCharts: user.natalChart.divisionalCharts,
      };
    }

    const content = await aiContentService.generateDailyHoroscope(
      user.natalChart,
      date,
      moonPos.sign,
      moonPhase,
      todayTransits, // Keep the full list for DB storage
      vedicData
    );

    const horoscope = await prisma.dailyHoroscope.create({
      data: {
        userId,
        forDate: date,
        moonSign: moonPos.sign,
        moonPhase,
        activeTransits: todayTransits as any,
        energyScore: content.energyScore,
        moodAspects: content.moodAspects,
        primaryTransit: content.primaryTransit,
        aspects: content.aspects,
        contentSelf: content.self,
        contentWork: content.work,
        contentLove: content.love,
        contentSocial: content.social,
        generatedBy: llmProvider.isAvailable ? "CLAUDE" : "RULE_BASED",
        generationVersion: 2,
      },
    });

    // Notify user in background
    (async () => {
      try {
        await notificationService.sendToUser(userId, {
          title: "Your Daily Insight is Ready",
          body: `Discover what the stars have in store for you today, ${user.displayName || "traveler"}.`,
          type: "daily_horoscope",
          data: { horoscopeId: horoscope.id },
        });
      } catch (err) {
        logger.error("Failed to send horoscope notification", { err, userId });
      }
    })();

    return horoscope;
  } catch (error) {
    logger.error("Failed to generate daily horoscope", { error, userId, date: date.toISOString() });
    throw error;
  }
}


// ────────────────────────────────────────────
// Compatibility calculation
// ────────────────────────────────────────────

export async function calculateCompatibility(
  chart1: any,
  chart2: any,
): Promise<{ score: number; aspects: any[]; interpretation: any }> {
  const s1 = (chart1.sunSign as string).toLowerCase();
  const s2 = (chart2.sunSign as string).toLowerCase();

  const elementMap: Record<string, string> = {
    aries: "fire", leo: "fire", sagittarius: "fire",
    taurus: "earth", virgo: "earth", capricorn: "earth",
    gemini: "air", libra: "air", aquarius: "air",
    cancer: "water", scorpio: "water", pisces: "water",
  };

  const e1 = elementMap[s1] || "fire";
  const e2 = elementMap[s2] || "fire";

  const elementScores: Record<string, Record<string, number>> = {
    fire: { fire: 80, air: 90, earth: 50, water: 40 },
    earth: { fire: 50, earth: 80, air: 40, water: 90 },
    air: { fire: 90, earth: 40, air: 80, water: 50 },
    water: { fire: 40, earth: 90, air: 50, water: 80 },
  };

  const score = Math.round(elementScores[e1]?.[e2] ?? 60);

  const compatResult = await aiContentService.generateCompatibilityInterpretation(
    chart1, chart2, [], score,
  ).catch(() => ({
    summary: `${s1} and ${s2} share ${e1 === e2 ? "the same element" : "complementary energies"}.`,
    emotionalDynamics: "",
    intellectualConnection: "",
    physicalConnection: "",
    spiritualConnection: "",
    strengths: [],
    challenges: [],
    advice: "",
  }));

  return { score, aspects: [], interpretation: compatResult };
}

// ────────────────────────────────────────────
// Transit calculation (current positions)
// ────────────────────────────────────────────

export async function calculateTransits(
  date: Date = new Date(),
  ayanamsaType?: AyanamsaType,
): Promise<PlanetPosition[]> {
  const dt = DateTime.fromJSDate(date).toUTC();
  const jd = sweph.julday(
    dt.year,
    dt.month,
    dt.day,
    dt.hour + dt.minute / 60 + dt.second / 3600,
    sweph.constants.SE_GREG_CAL,
  );

  let ayanamsa = 0;
  if (ayanamsaType) {
    const { getAyanamsa } = await import("./vedicAstrology");
    ayanamsa = getAyanamsa(jd, ayanamsaType);
  }

  const planets: PlanetName[] = [
    "SUN",
    "MOON",
    "MERCURY",
    "VENUS",
    "MARS",
    "JUPITER",
    "SATURN",
    "URANUS",
    "NEPTUNE",
    "PLUTO",
  ];

  const results: PlanetPosition[] = [];
  for (const p of planets) {
    let pos = calcPlanetPosition(jd, p);
    if (ayanamsa !== 0) {
      const { toSiderealLongitude } = await import("./vedicAstrology");
      const siderealLon = toSiderealLongitude(pos.longitude, ayanamsa);
      pos = {
        ...pos,
        longitude: siderealLon,
        sign: getSignFromLongitude(siderealLon),
        ...getSignDegree(siderealLon),
      };
    }
    results.push(pos);
  }

  return results;
}

export async function calculateCurrentTransits(): Promise<PlanetPosition[]> {
  return calculateTransits(new Date());
}


// ────────────────────────────────────────────
// Transit calculation (against natal chart)
// ────────────────────────────────────────────

export function calculateUserTransits(
  natalPositions: any[] | Record<string, any>,
  transitPositions: Record<string, PlanetPosition>,
): Aspect[] {
  const transits: Aspect[] = [];
  const transitPlanets = Object.values(transitPositions);
  
  // Robustly handle both legacy object and new relation array formats
  const natalPlanets = Array.isArray(natalPositions) 
    ? natalPositions 
    : Object.values(natalPositions);
    
  const filteredNatalPlanets = natalPlanets.filter(p => p && p.longitude !== undefined);

  for (const tPos of transitPlanets) {
    for (const nPos of filteredNatalPlanets) {
      let diff = Math.abs(tPos.longitude - nPos.longitude);
      if (diff > 180) diff = 360 - diff;

      for (const [aspectName, aspectData] of Object.entries(ASPECTS)) {
        const orb = Math.abs(diff - aspectData.angle);
        if (orb <= aspectData.orb) {
          transits.push({
            planet1: tPos.planet, // Transit planet
            planet2: nPos.planet, // Natal planet
            type: aspectName as AspectType,
            angle: aspectData.angle,
            orb,
            exact: orb < 1,
            applying: isAspectApplying(tPos, { ...nPos, speed: 0 }, aspectData.angle),
          });
          break;
        }
      }
    }
  }

  return transits.sort((a, b) => a.orb - b.orb);
}

// ────────────────────────────────────────────
// Forecast calculation
// ────────────────────────────────────────────

export async function calculateForecast(
  natalChart: any,
  startDate: Date,
  period: "week" | "month" | "year",
): Promise<any[]> {
  const endDate = DateTime.fromJSDate(startDate).plus({ 
    days: period === "week" ? 7 : period === "month" ? 30 : 365 
  }).toJSDate();

  const { zodiacType, ayanamsa: ayanamsaType, planetaryPositions: natalPositions } = natalChart;
  const ayanamsaToUse = zodiacType === "SIDEREAL" ? ayanamsaType : undefined;

  // For forecasting, we'll sample the period
  // Week: every day
  // Month: every 3 days
  // Year: every 15 days
  const step = period === "week" ? 1 : period === "month" ? 3 : 15;
  const transitsFound = new Map<string, any>();

  let currentDate = DateTime.fromJSDate(startDate);
  while (currentDate.toJSDate() <= endDate) {
    const transitPositions = await getPlanetaryPositions(currentDate.toJSDate(), ayanamsaToUse);
    const dayTransits = calculateUserTransits(natalPositions, transitPositions as any);

    for (const transit of dayTransits) {
      const key = `${transit.planet1}-${transit.type}-${transit.planet2}`;
      if (!transitsFound.has(key)) {
        // Simple heuristic for type and impact
        let type = "minor";
        let impact = "moderate";
        
        if (["SUN", "MOON", "VENUS", "MARS"].includes(transit.planet1)) {
           if (transit.exact) {
             type = "major";
             impact = "high";
           }
        } else if (["SATURN", "PLUTO"].includes(transit.planet1)) {
           impact = "intense";
           type = "major";
        }

        // Generate symbolic line
        const sym1 = PLANET_SYMBOLS[transit.planet1 as PlanetName] || transit.planet1;
        const sym2 = PLANET_SYMBOLS[transit.planet2 as PlanetName] || transit.planet2;
        const aspSym = ASPECT_SYMBOLS[transit.type as AspectType] || transit.type;

        // Calculate accurate progress
        const maxOrb = ASPECTS[transit.type as AspectType]?.orb || 8;
        const intensity = Math.max(0, Math.min(1, 1 - transit.orb / maxOrb));
        let progress: number;
        if (transit.applying) {
          progress = intensity * 50;
        } else {
          progress = 50 + (1 - intensity) * 50;
        }

        transitsFound.set(key, {
          date: currentDate.toJSDate(),
          title: `${capitalize(transit.planet1)} ${transit.type.toLowerCase()} ${capitalize(transit.planet2)}`,
          type,
          symbolic: `${sym1} ${aspSym} ${sym2}`,
          orb: `${Math.floor(transit.orb)}°${Math.round((transit.orb % 1) * 60)}'`,
          impact: `· ${impact}`,
          progress: transit.exact ? 100 : Math.round(progress),
          description: `A ${transit.type.toLowerCase()} aspect from transit ${transit.planet1} to your natal ${transit.planet2}.`,
        });
      }
    }
    currentDate = currentDate.plus({ days: step });
  }

  return Array.from(transitsFound.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

const PLANET_SYMBOLS: Record<PlanetName, string> = {
  SUN: "☉", MOON: "☽", MERCURY: "☿", VENUS: "♀", MARS: "♂",
  JUPITER: "♃", SATURN: "♄", URANUS: "♅", NEPTUNE: "♆", PLUTO: "♇",
  CHIRON: "⚷", LILITH: "⚸", NODE: "☊", KETU: "☋",
  ASCENDANT: "ASC", MIDHEAVEN: "MC"
};

const ASPECT_SYMBOLS: Record<AspectType, string> = {
  CONJUNCTION: "☌", SEXTILE: "✶", SQUARE: "□",
  TRINE: "△", OPPOSITION: "☍", QUINCUNX: "⚺"
};

// ────────────────────────────────────────────
// Service object
// ────────────────────────────────────────────

export const astrologyService = {
  calculateNatalChart,
  generateDailyHoroscope,
  calculateCompatibility,
  getPlanetaryPositions,
  getCurrentPlanetaryPositions,
  calculateTransits,
  getMoonPhase,
  getChartElements,
  calculateUserTransits,
  calculateForecast,
};
