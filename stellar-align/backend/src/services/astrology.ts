import { DateTime } from "luxon";
import logger from "../config/logger";
import { aiContentService } from "./aiContent";
import { llmProvider } from "./llmProvider";

// astronomia — pure JS, no native compilation
import * as julian from "astronomia/julian";
import * as moonposition from "astronomia/moonposition";
import * as planetposition from "astronomia/planetposition";

// VSOP87 planet data (bundled with astronomia)
import vsop87Bmercury from "astronomia/data/vsop87Bmercury";
import vsop87Bvenus from "astronomia/data/vsop87Bvenus";
import vsop87Bearth from "astronomia/data/vsop87Bearth";
import vsop87Bmars from "astronomia/data/vsop87Bmars";
import vsop87Bjupiter from "astronomia/data/vsop87Bjupiter";
import vsop87Bsaturn from "astronomia/data/vsop87Bsaturn";
import vsop87Buranus from "astronomia/data/vsop87Buranus";
import vsop87Bneptune from "astronomia/data/vsop87Bneptune";

// ────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────

const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

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
  | "ASCENDANT"
  | "MIDHEAVEN";
export type Sign = (typeof SIGNS)[number];
export type AspectType = keyof typeof ASPECTS;

export interface PlanetPosition {
  planet: PlanetName;
  longitude: number;
  latitude: number;
  distance: number;
  sign: Sign;
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
  sign: Sign;
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

// ────────────────────────────────────────────
// Planet model cache
// ────────────────────────────────────────────

const planetModels: Record<string, planetposition.Planet> = {
  MERCURY: new planetposition.Planet(vsop87Bmercury),
  VENUS: new planetposition.Planet(vsop87Bvenus),
  EARTH: new planetposition.Planet(vsop87Bearth),
  MARS: new planetposition.Planet(vsop87Bmars),
  JUPITER: new planetposition.Planet(vsop87Bjupiter),
  SATURN: new planetposition.Planet(vsop87Bsaturn),
  URANUS: new planetposition.Planet(vsop87Buranus),
  NEPTUNE: new planetposition.Planet(vsop87Bneptune),
};

// ────────────────────────────────────────────
// Utility functions
// ────────────────────────────────────────────

function getSignFromLongitude(longitude: number): Sign {
  const normalized = ((longitude % 360) + 360) % 360;
  return SIGNS[Math.floor(normalized / 30) % 12];
}

function getSignDegree(longitude: number): { degree: number; minute: number } {
  const normalized = ((longitude % 360) + 360) % 360;
  const withinSign = normalized % 30;
  const degree = Math.floor(withinSign);
  const minute = Math.round((withinSign - degree) * 60);
  return { degree, minute: minute === 60 ? 0 : minute };
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

// ────────────────────────────────────────────
// Julian Day helpers
// ────────────────────────────────────────────

function dateTimeToJD(dt: DateTime): number {
  return julian.CalendarGregorianToJD(
    dt.year,
    dt.month,
    dt.day + dt.hour / 24 + dt.minute / 1440 + dt.second / 86400,
  );
}

// ────────────────────────────────────────────
// Planetary position calculations (VSOP87 via astronomia)
// ────────────────────────────────────────────

function calcHeliocentricPosition(
  planetModel: planetposition.Planet,
  jd: number,
): { lon: number; lat: number; dist: number } {
  // position() returns heliocentric ecliptic position
  const pos = planetModel.position(jd);
  return { lon: pos.lon, lat: pos.lat, dist: pos.range };
}

function calcGeocentricLongitude(
  jd: number,
  planetKey: string,
): { longitude: number; latitude: number; distance: number } {
  if (planetKey === "EARTH") {
    throw new Error("Use geocentric helpers for Earth-based observations");
  }

  const earthPos = calcHeliocentricPosition(planetModels.EARTH, jd);
  const planetPos = calcHeliocentricPosition(planetModels[planetKey], jd);

  // Convert heliocentric to geocentric ecliptic
  const dx =
    planetPos.dist * Math.cos(planetPos.lon) -
    earthPos.dist * Math.cos(earthPos.lon);
  const dy =
    planetPos.dist * Math.sin(planetPos.lon) -
    earthPos.dist * Math.sin(earthPos.lon);
  const dz =
    planetPos.dist * Math.sin(planetPos.lat) -
    earthPos.dist * Math.sin(earthPos.lat);

  const longitude = normalizeAngle((Math.atan2(dy, dx) * 180) / Math.PI);
  const latitude =
    (Math.atan2(dz, Math.sqrt(dx * dx + dy * dy)) * 180) / Math.PI;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return { longitude, latitude, distance };
}

function calcSunPosition(jd: number): {
  longitude: number;
  latitude: number;
  distance: number;
} {
  const earthPos = calcHeliocentricPosition(planetModels.EARTH, jd);
  // Sun is opposite Earth in heliocentric coords
  const longitude = normalizeAngle(((earthPos.lon + 180) * 180) / Math.PI);
  const distance = earthPos.dist;
  return { longitude, latitude: 0, distance };
}

function calcMoonPosition(jd: number): {
  longitude: number;
  latitude: number;
  distance: number;
} {
  const moonPos = moonposition.position(jd);
  // moonposition returns ecliptic coords already
  const longitude = normalizeAngle(moonPos.lon);
  const latitude = moonPos.lat;
  const distance = moonPos.dist;
  return { longitude, latitude, distance };
}

// ────────────────────────────────────────────
// House cusp calculation (Placidus — pure JS)
// ────────────────────────────────────────────

function calcObliquity(jd: number): number {
  // Mean obliquity of the ecliptic (in degrees)
  const T = (jd - 2451545.0) / 36525;
  const eps = 23.439291 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T * T * T;
  return eps;
}

function calcRAMC(jd: number, geographicLon: number): number {
  // Greenwich sidereal time
  const T = (jd - 2451545.0) / 36525;
  let gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  gmst = normalizeAngle(gmst);

  // Local sidereal time = GMST + geographic longitude
  const lst = normalizeAngle(gmst + geographicLon);
  return lst;
}

function calcAscendant(
  ramc: number,
  obliquity: number,
  latitude: number,
): number {
  const RAMC = (ramc * Math.PI) / 180;
  const eps = (obliquity * Math.PI) / 180;
  const lat = (latitude * Math.PI) / 180;

  const y = Math.sin(RAMC);
  const x = -Math.cos(RAMC) * Math.cos(eps) - Math.tan(lat) * Math.sin(eps);
  let asc = (Math.atan2(y, x) * 180) / Math.PI;
  return normalizeAngle(asc);
}

function calcMidheaven(ramc: number, obliquity: number): number {
  const RAMC = (ramc * Math.PI) / 180;
  const eps = (obliquity * Math.PI) / 180;

  let mc =
    (Math.atan2(Math.sin(RAMC), Math.cos(RAMC) * Math.cos(eps)) * 180) /
    Math.PI;
  return normalizeAngle(mc);
}

// Placidus house cusp calculation
function calcPlacidusHouses(
  jd: number,
  latitude: number,
  geographicLon: number,
): HouseCusp[] {
  const obliquity = calcObliquity(jd);
  const ramc = calcRAMC(jd, geographicLon);

  const mc = calcMidheaven(ramc, obliquity);
  const asc = calcAscendant(ramc, obliquity, latitude);

  // Placidus semi-arc method
  const cusps: number[] = new Array(12).fill(0);
  cusps[0] = asc; // 1st house = Ascendant
  cusps[9] = mc; // 10th house = Midheaven

  const RAMC = (ramc * Math.PI) / 180;
  const eps = (obliquity * Math.PI) / 180;
  const lat = (latitude * Math.PI) / 180;

  // Calculate intermediate house cusps using Placidus semi-arc method
  for (let i = 1; i <= 6; i++) {
    if (i === 1 || i === 4) continue; // Ascendant (1) and IC (4) handled separately

    const fraction = i / 6; // Fraction of semi-arc
    const rightAscension = RAMC + (fraction * Math.PI) / 2;

    // Iterate to find the cusp
    let cuspRA = rightAscension;
    for (let iter = 0; iter < 20; iter++) {
      const sinAlt =
        Math.sin(lat) * Math.sin(eps) * Math.sin(cuspRA) +
        Math.cos(lat) *
          (Math.cos(eps) * Math.sin(cuspRA) * Math.cos(0) -
            Math.sin(eps) * Math.sin(0));
      // Altitude at the cusp fraction
      const targetAlt = Math.asin(
        Math.sin(lat) * Math.sin(eps) * Math.sin(RAMC + fraction * Math.PI) +
          Math.cos(lat) * Math.cos(eps) * Math.cos(RAMC + fraction * Math.PI),
      );

      if (Math.abs(sinAlt - Math.sin(targetAlt)) < 0.0001) break;
      cuspRA += 0.001;
    }

    // Convert RA to longitude
    let cuspLon =
      (Math.atan2(Math.sin(cuspRA), Math.cos(cuspRA) * Math.cos(eps)) * 180) /
      Math.PI;
    cusps[i - 1] = normalizeAngle(cuspLon);
  }

  // Opposite houses (7-12) are 180° from houses 1-6
  for (let i = 0; i < 6; i++) {
    cusps[i + 6] = normalizeAngle(cusps[i] + 180);
  }

  // Ensure 10th house is exactly MC and 4th is IC
  cusps[9] = mc;
  cusps[3] = normalizeAngle(mc + 180);

  return cusps.map((cuspLon, idx) => {
    const sign = getSignFromLongitude(cuspLon);
    const deg = getSignDegree(cuspLon);
    return {
      house: idx + 1,
      longitude: cuspLon,
      sign,
      degree: deg.degree,
      minute: deg.minute,
    };
  });
}

// ────────────────────────────────────────────
// Assign planets to houses
// ────────────────────────────────────────────

function assignHouses(positions: PlanetPosition[], houses: HouseCusp[]): void {
  const houseLongitudes = houses.map((h) => h.longitude);

  positions.forEach((pos) => {
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
  });
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
          const applying =
            (p1.speed > p2.speed && p1.longitude < p2.longitude) ||
            (p2.speed > p1.speed && p2.longitude < p1.longitude);

          aspects.push({
            planet1: p1.planet,
            planet2: p2.planet,
            type: aspectName as AspectType,
            angle: aspectData.angle,
            orb,
            exact: orb < 1,
            applying,
          });
          break;
        }
      }
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
}

// ────────────────────────────────────────────
// Calculate speed by comparing positions 1 day apart
// ────────────────────────────────────────────

function estimateSpeed(
  calcFn: (jd: number) => { longitude: number },
  jd: number,
): number {
  const pos1 = calcFn(jd - 0.5);
  const pos2 = calcFn(jd + 0.5);
  let diff = pos2.longitude - pos1.longitude;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff; // degrees per day
}

// ────────────────────────────────────────────
// Build a PlanetPosition object
// ────────────────────────────────────────────

function makePlanetPos(
  planet: PlanetName,
  lonLatDist: { longitude: number; latitude: number; distance: number },
  speed: number,
): PlanetPosition {
  const sign = getSignFromLongitude(lonLatDist.longitude);
  const deg = getSignDegree(lonLatDist.longitude);

  return {
    planet,
    longitude: lonLatDist.longitude,
    latitude: lonLatDist.latitude,
    distance: lonLatDist.distance,
    sign,
    signDegree: deg.degree,
    degree: deg.degree,
    minute: deg.minute,
    retrograde: speed < 0,
    house: null,
    speed,
  };
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
): Promise<NatalChartData> {
  try {
    const timeParts = birthTime.split(":").map(Number);
    const dateTime = DateTime.fromJSDate(birthDate, { zone: timezone })
      .set({ hour: timeParts[0] || 0, minute: timeParts[1] || 0, second: 0 })
      .toUTC();

    const jd = dateTimeToJD(dateTime);

    // Calculate house cusps
    const houses = calcPlacidusHouses(jd, latitude, longitude);

    // Sun
    const sunPos = makePlanetPos(
      "SUN",
      calcSunPosition(jd),
      estimateSpeed((j) => calcSunPosition(j), jd),
    );

    // Moon
    const moonPos = makePlanetPos(
      "MOON",
      calcMoonPosition(jd),
      estimateSpeed((j) => calcMoonPosition(j), jd),
    );

    // Planets (geocentric)
    const planetKeys: { key: string; name: PlanetName }[] = [
      { key: "MERCURY", name: "MERCURY" },
      { key: "VENUS", name: "VENUS" },
      { key: "MARS", name: "MARS" },
      { key: "JUPITER", name: "JUPITER" },
      { key: "SATURN", name: "SATURN" },
      { key: "URANUS", name: "URANUS" },
      { key: "NEPTUNE", name: "NEPTUNE" },
    ];

    const planetPositions: PlanetPosition[] = [sunPos, moonPos];

    for (const { key, name } of planetKeys) {
      const pos = calcGeocentricLongitude(jd, key);
      const speed = estimateSpeed((j) => calcGeocentricLongitude(j, key), jd);
      planetPositions.push(makePlanetPos(name, pos, speed));
    }

    // Pluto (astronomia doesn't have VSOP87B for Pluto; use simplified approach)
    const plutoPos = calcSimplifiedPluto(jd);
    planetPositions.push(
      makePlanetPos(
        "PLUTO",
        plutoPos,
        estimateSpeed((j) => calcSimplifiedPluto(j), jd),
      ),
    );

    // North Node (mean node approximation)
    const nodePos = calcMeanNode(jd);
    planetPositions.push(makePlanetPos("NODE", nodePos, -0.053));

    // Chiron — simplified position (astronomia lacks Chiron data)
    const chironPos = calcSimplifiedChiron(jd);
    planetPositions.push(makePlanetPos("CHIRON", chironPos, 0.0));

    // Lilith (mean apogee) — simplified
    const lilithPos = calcSimplifiedLilith(jd);
    planetPositions.push(makePlanetPos("LILITH", lilithPos, 0.11));

    // Assign houses
    assignHouses(planetPositions, houses);

    // Ascendant & Midheaven
    const asc = houses[0]!;
    const mc = houses[9]!;

    const ascendantPos: PlanetPosition = {
      planet: "ASCENDANT",
      longitude: asc.longitude,
      latitude: 0,
      distance: 0,
      sign: asc.sign,
      signDegree: asc.degree,
      degree: asc.degree,
      minute: asc.minute,
      retrograde: false,
      house: 1,
      speed: 0,
    };

    const midheavenPos: PlanetPosition = {
      planet: "MIDHEAVEN",
      longitude: mc.longitude,
      latitude: 0,
      distance: 0,
      sign: mc.sign,
      signDegree: mc.degree,
      degree: mc.degree,
      minute: mc.minute,
      retrograde: false,
      house: 10,
      speed: 0,
    };

    planetPositions.push(ascendantPos, midheavenPos);

    // Aspects
    const aspects = calculateAspects(planetPositions);

    // Build the typed result
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

    logger.info("Natal chart calculated", {
      sunSign: chartData.sun.sign,
      moonSign: chartData.moon.sign,
      risingSign: chartData.ascendant.sign,
    });

    return chartData;
  } catch (error) {
    logger.error("Error calculating natal chart", { error });
    throw new Error("Failed to calculate natal chart");
  }
}

// ────────────────────────────────────────────
// Simplified positions for bodies not in astronomia
// ────────────────────────────────────────────

function calcSimplifiedPluto(jd: number): {
  longitude: number;
  latitude: number;
  distance: number;
} {
  // Simplified Pluto position based on orbital elements
  const T = (jd - 2451545.0) / 36525;
  const L0 = 238.928 + 0.0040507 * T * 36525; // mean longitude
  const longitude = normalizeAngle(
    L0 + 82.87 * Math.sin(((L0 - 44.47) * Math.PI) / 180),
  );
  return { longitude, latitude: 1.0, distance: 39.5 };
}

function calcMeanNode(jd: number): {
  longitude: number;
  latitude: number;
  distance: number;
} {
  // Mean longitude of ascending node
  const T = (jd - 2451545.0) / 36525;
  const longitude = normalizeAngle(125.0445 - 1934.1363 * T);
  return { longitude, latitude: 0, distance: 0.00257 };
}

function calcSimplifiedChiron(jd: number): {
  longitude: number;
  latitude: number;
  distance: number;
} {
  const T = (jd - 2451545.0) / 36525;
  const longitude = normalizeAngle(209.13 + (2.67 * T * 36525) / 50.7); // ~50.7 year period
  return { longitude, latitude: 2.5, distance: 8.5 };
}

function calcSimplifiedLilith(jd: number): {
  longitude: number;
  latitude: number;
  distance: number;
} {
  const T = (jd - 2451545.0) / 36525;
  const longitude = normalizeAngle(177.63 + 4069.03 * T); // ~8.85 year period
  return { longitude, latitude: 0, distance: 0.00257 };
}

// ────────────────────────────────────────────
// Current planetary positions (for transits)
// ────────────────────────────────────────────

export async function getCurrentPlanetaryPositions(): Promise<
  Partial<NatalChartData>
> {
  const now = DateTime.utc();
  const jd = dateTimeToJD(now);

  const sunPos = makePlanetPos(
    "SUN",
    calcSunPosition(jd),
    estimateSpeed((j) => calcSunPosition(j), jd),
  );
  const moonPos = makePlanetPos(
    "MOON",
    calcMoonPosition(jd),
    estimateSpeed((j) => calcMoonPosition(j), jd),
  );

  const positions: any = { sun: sunPos, moon: moonPos };

  for (const [key, name] of [
    ["MERCURY", "mercury"],
    ["VENUS", "venus"],
    ["MARS", "mars"],
    ["JUPITER", "jupiter"],
    ["SATURN", "saturn"],
    ["URANUS", "uranus"],
    ["NEPTUNE", "neptune"],
  ] as [string, string][]) {
    const pos = calcGeocentricLongitude(jd, key);
    const speed = estimateSpeed((j) => calcGeocentricLongitude(j, key), jd);
    positions[name] = makePlanetPos(key as PlanetName, pos, speed);
  }

  return positions;
}

// ────────────────────────────────────────────
// Moon phase
// ────────────────────────────────────────────

export function getMoonPhase(
  sunLongitude: number,
  moonLongitude: number,
): string {
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

// ────────────────────────────────────────────
// Chart elements
// ────────────────────────────────────────────

export function getChartElements(positions: PlanetPosition[]): {
  [key: string]: number;
} {
  const elements: { [key: string]: number } = {
    Fire: 0,
    Earth: 0,
    Air: 0,
    Water: 0,
  };

  const elementMap: { [key: string]: string } = {
    Aries: "Fire",
    Leo: "Fire",
    Sagittarius: "Fire",
    Taurus: "Earth",
    Virgo: "Earth",
    Capricorn: "Earth",
    Gemini: "Air",
    Libra: "Air",
    Aquarius: "Air",
    Cancer: "Water",
    Scorpio: "Water",
    Pisces: "Water",
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
  try {
    const { prisma } = await import("../config/database");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { natalChart: true },
    });

    if (!user?.natalChart) {
      throw new Error("Natal chart not found");
    }

    const transitPositions = await getCurrentPlanetaryPositions();
    const sunPos = transitPositions.sun!;
    const moonPos = transitPositions.moon!;

    const moonPhase = getMoonPhase(sunPos.longitude, moonPos.longitude);

    const content = await aiContentService.generateDailyHoroscope(
      user.natalChart,
      date,
      moonPos.sign,
      moonPhase,
      [],
    );

    const horoscope = await prisma.dailyHoroscope.create({
      data: {
        userId,
        forDate: date,
        moonSign: moonPos.sign,
        moonPhase,
        activeTransits: [],
        contentSelf: content.self,
        contentWork: content.work,
        contentLove: content.love,
        contentSocial: content.social,
        generatedBy: llmProvider.isAvailable ? "ai" : "rule_based",
      },
    });

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
  const s1 = chart1.sunSign?.toLowerCase() || "";
  const s2 = chart2.sunSign?.toLowerCase() || "";

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

export async function calculateCurrentTransits(): Promise<PlanetPosition[]> {
  const now = DateTime.utc();
  const jd = dateTimeToJD(now);

  const positions: PlanetPosition[] = [];

  positions.push(
    makePlanetPos("SUN", calcSunPosition(jd), estimateSpeed((j: number) => calcSunPosition(j), jd)),
  );
  positions.push(
    makePlanetPos("MOON", calcMoonPosition(jd), estimateSpeed((j: number) => calcMoonPosition(j), jd)),
  );

  for (const key of ["MERCURY", "VENUS", "MARS", "JUPITER", "SATURN", "URANUS", "NEPTUNE"]) {
    const pos = calcGeocentricLongitude(jd, key);
    const speed = estimateSpeed((j: number) => calcGeocentricLongitude(j, key), jd);
    positions.push(makePlanetPos(key as PlanetName, pos, speed));
  }

  return positions;
}

// ────────────────────────────────────────────
// Service object (used by routes/controllers)
// ────────────────────────────────────────────

export const astrologyService = {
  calculateNatalChart,
  generateDailyHoroscope,
  calculateCompatibility,
  getCurrentPlanetaryPositions,
  calculateTransits: calculateCurrentTransits,
  getMoonPhase,
  getChartElements,
};
