import { DateTime } from "luxon";
import { 
  ZodiacSign, DivisionalChartType, AyanamsaType 
} from "@prisma/client";
import { 
  Nakshatra, NakshatraName, VedicBirthData, VedicChart, 
  DivisionalChart, DivisionalChartPosition 
} from "../types/astrology";
import { PlanetName, PlanetPosition, NatalChartData } from "./astrology";
import * as sweph from "sweph";

const ZODIAC_SIGNS: ZodiacSign[] = [
  ZodiacSign.ARIES, ZodiacSign.TAURUS, ZodiacSign.GEMINI, ZodiacSign.CANCER,
  ZodiacSign.LEO, ZodiacSign.VIRGO, ZodiacSign.LIBRA, ZodiacSign.SCORPIO,
  ZodiacSign.SAGITTARIUS, ZodiacSign.CAPRICORN, ZodiacSign.AQUARIUS, ZodiacSign.PISCES,
];

const NAKSHATRAS: NakshatraName[] = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
  "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const NAKSHATRA_LORDS: Record<string, string> = {
  Ashwini: "Ketu", Bharani: "Venus", Krittika: "Sun", Rohini: "Moon",
  Mrigashira: "Mars", Ardra: "Rahu", Punarvasu: "Jupiter", Pushya: "Saturn",
  Ashlesha: "Mercury", Magha: "Ketu", "Purva Phalguni": "Venus", "Uttara Phalguni": "Sun",
  Hasta: "Moon", Chitra: "Mars", Swati: "Rahu", Vishakha: "Jupiter",
  Anuradha: "Saturn", Jyeshtha: "Mercury", Mula: "Ketu", "Purva Ashadha": "Venus",
  "Uttara Ashadha": "Sun", Shravana: "Moon", Dhanishta: "Mars", Shatabhisha: "Rahu",
  "Purva Bhadrapada": "Jupiter", "Uttara Bhadrapada": "Saturn", Revati: "Mercury",
};

const MOVABLE_SIGNS: ZodiacSign[] = [ZodiacSign.ARIES, ZodiacSign.CANCER, ZodiacSign.LIBRA, ZodiacSign.CAPRICORN];
const FIXED_SIGNS: ZodiacSign[] = [ZodiacSign.TAURUS, ZodiacSign.LEO, ZodiacSign.SCORPIO, ZodiacSign.AQUARIUS];

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function getSignFromLongitude(longitude: number): ZodiacSign {
  const normalized = ((longitude % 360) + 360) % 360;
  return ZODIAC_SIGNS[Math.floor(normalized / 30) % 12];
}

function getSignIndex(sign: ZodiacSign): number {
  return ZODIAC_SIGNS.indexOf(sign);
}

function getDegreeInSign(longitude: number): number {
  return ((longitude % 360) + 360) % 360 % 30;
}

function getAngularDistance(a: number, b: number): number {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return diff > 180 ? 360 - diff : diff;
}

// ────────────────────────────────────────────
// Ayanamsa calculation (Swiss Ephemeris)
// ────────────────────────────────────────────

export function getAyanamsa(jd: number, type: AyanamsaType = AyanamsaType.LAHIRI): number {
  const ayanamsaMap: Record<AyanamsaType, number> = {
    [AyanamsaType.LAHIRI]: sweph.constants.SE_SIDM_LAHIRI,
    [AyanamsaType.RAMAN]: sweph.constants.SE_SIDM_RAMAN,
    [AyanamsaType.KRISHNAMURTI]: sweph.constants.SE_SIDM_KRISHNAMURTI,
    [AyanamsaType.FAGAN_BRADLEY]: sweph.constants.SE_SIDM_FAGAN_BRADLEY,
  };

  const sidMode = ayanamsaMap[type] || sweph.constants.SE_SIDM_LAHIRI;
  sweph.set_sid_mode(sidMode, 0, 0);
  return sweph.get_ayanamsa_ut(jd);
}

export function toSiderealLongitude(tropicalLon: number, ayanamsa: number): number {
  return normalizeAngle(tropicalLon - ayanamsa);
}

export function calculateNakshatra(moonLongitude: number): Nakshatra {
  const normalized = normalizeAngle(moonLongitude);
  const nakshatraSpan = 13 + 1/3; // 13° 20'
  const nakshatraIndex = Math.floor(normalized / nakshatraSpan);
  const padaIndex = Math.floor((normalized % nakshatraSpan) / (nakshatraSpan / 4));
  const nakshatraName = NAKSHATRAS[nakshatraIndex % 27] as NakshatraName;
  const pada = ((padaIndex % 4) + 1) as 1 | 2 | 3 | 4;
  const lord = NAKSHATRA_LORDS[nakshatraName] || "Moon";

  return {
    name: nakshatraName, pada, lord: lord as any,
    degree: nakshatraIndex * nakshatraSpan,
    padaDegree: normalized % nakshatraSpan,
  };
}

// Divisional chart helpers. These follow the standard Parashara-style varga mappings.
function getSegmentIndex(degreeInSign: number, divisions: number): number {
  const segmentSize = 30 / divisions;
  return Math.min(Math.floor(degreeInSign / segmentSize), divisions - 1);
}

function getDivisionalDegree(degreeInSign: number, divisions: number): number {
  const segmentSize = 30 / divisions;
  const degree = ((degreeInSign % segmentSize) / segmentSize) * 30;
  return Math.round(degree * 10000) / 10000;
}

function getHoraSign(sign: ZodiacSign, degreeInSign: number): ZodiacSign {
  const signIndex = getSignIndex(sign);
  const isOddSign = [0, 2, 4, 6, 8, 10].includes(signIndex);
  const inSecondHalf = degreeInSign >= 15;

  if (isOddSign) {
    return inSecondHalf ? ZodiacSign.CANCER : ZodiacSign.LEO;
  }

  return inSecondHalf ? ZodiacSign.LEO : ZodiacSign.CANCER;
}

function getChaturthamsaSign(sign: ZodiacSign, degreeInSign: number): ZodiacSign {
  const signIndex = getSignIndex(sign);
  const segment = getSegmentIndex(degreeInSign, 4);
  return ZODIAC_SIGNS[(signIndex + segment * 3) % 12];
}

function getNavamsaSign(sign: ZodiacSign, degreeInSign: number): ZodiacSign {
  const signIndex = getSignIndex(sign);
  const navamsaIndex = getSegmentIndex(degreeInSign, 9);
  const start = MOVABLE_SIGNS.includes(sign)
    ? signIndex
    : FIXED_SIGNS.includes(sign)
      ? (signIndex + 8) % 12
      : (signIndex + 4) % 12;

  return ZODIAC_SIGNS[(start + navamsaIndex) % 12];
}

function getDasamsaSign(sign: ZodiacSign, degreeInSign: number): ZodiacSign {
  const signIndex = getSignIndex(sign);
  const dasamsaIndex = getSegmentIndex(degreeInSign, 10);
  const start = [0, 2, 4, 6, 8, 10].includes(signIndex) ? signIndex : (signIndex + 8) % 12;
  return ZODIAC_SIGNS[(start + dasamsaIndex) % 12];
}

function getDivisionalSign(sign: ZodiacSign, degreeInSign: number, chartType: DivisionalChartType): ZodiacSign {
  if (chartType === DivisionalChartType.D1) return sign;
  if (chartType === DivisionalChartType.D2) return getHoraSign(sign, degreeInSign);
  if (chartType === DivisionalChartType.D4) return getChaturthamsaSign(sign, degreeInSign);
  if (chartType === DivisionalChartType.D9) return getNavamsaSign(sign, degreeInSign);
  if (chartType === DivisionalChartType.D10) return getDasamsaSign(sign, degreeInSign);
  return sign;
}

function getDivisionalDegreeForChart(degreeInSign: number, chartType: DivisionalChartType): number {
  if (chartType === DivisionalChartType.D1) return Math.round(degreeInSign * 10000) / 10000;
  if (chartType === DivisionalChartType.D2) return getDivisionalDegree(degreeInSign, 2);
  if (chartType === DivisionalChartType.D4) return getDivisionalDegree(degreeInSign, 4);
  if (chartType === DivisionalChartType.D9) return getDivisionalDegree(degreeInSign, 9);
  if (chartType === DivisionalChartType.D10) return getDivisionalDegree(degreeInSign, 10);
  return Math.round(degreeInSign * 10000) / 10000;
}

function isCombust(planet: PlanetPosition, sun: PlanetPosition): boolean {
  const combustionOrbs: Partial<Record<PlanetName, number>> = {
    MOON: 12,
    MARS: 17,
    MERCURY: planet.retrograde ? 12 : 14,
    VENUS: planet.retrograde ? 8 : 10,
    JUPITER: 11,
    SATURN: 15,
  };
  const orb = combustionOrbs[planet.planet];

  return typeof orb === "number" && getAngularDistance(planet.longitude, sun.longitude) <= orb;
}

function createHouses(ascSign: ZodiacSign) {
  const ascIndex = getSignIndex(ascSign);
  return Array.from({ length: 12 }, (_, i) => ({
    house: i + 1, sign: ZODIAC_SIGNS[(ascIndex + i) % 12], degree: 0
  }));
}

function calculateDivisional(
  planets: PlanetPosition[], ascendant: PlanetPosition, ayanamsa: number, sun: PlanetPosition,
  chartType: DivisionalChartType,
): DivisionalChart {
  const planetaryPositions: DivisionalChartPosition[] = planets.map((p) => {
    const siderealLon = toSiderealLongitude(p.longitude, ayanamsa);
    const degreeInSign = getDegreeInSign(siderealLon);
    const sign = getSignFromLongitude(siderealLon);

    const dSign = getDivisionalSign(sign, degreeInSign, chartType);
    const dDegree = getDivisionalDegreeForChart(degreeInSign, chartType);

    return {
      planet: p.planet.toLowerCase() as any, 
      sign: dSign,
      degree: dDegree,
      house: 1, // Will be calculated after ascendant is set
      retrograde: p.retrograde,
      combust: isCombust(p, sun),
    };
  });

  const siderealAsc = toSiderealLongitude(ascendant.longitude, ayanamsa);
  const ascDegree = getDegreeInSign(siderealAsc);
  const ascSign = getSignFromLongitude(siderealAsc);

  const dAsc = getDivisionalSign(ascSign, ascDegree, chartType);
  const dAscDegree = getDivisionalDegreeForChart(ascDegree, chartType);

  // Final house assignment for divisional chart (Whole Sign)
  const dAscIdx = getSignIndex(dAsc);
  planetaryPositions.forEach(p => {
    const pSignIdx = getSignIndex(p.sign);
    p.house = ((pSignIdx - dAscIdx + 12) % 12) + 1;
  });

  return {
    natalChartId: "",
    chartType,
    planetaryPositions,
    ascendant: dAsc,
    ascendantDegree: dAscDegree,
    houses: createHouses(dAsc),
  };
}

export interface DashaPeriod {
  planet: string;
  startDate: Date;
  endDate: Date;
  subPeriods?: DashaPeriod[];
}

const DASHA_LORDS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
const DASHA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17];

export function calculateVimshottariDasha(
  moonLongitudeSidereal: number,
  birthDate: Date
): DashaPeriod[] {
  const nakshatraSpan = 13 + 1/3;
  const nakshatraIndex = Math.floor(moonLongitudeSidereal / nakshatraSpan);
  const degreeInNakshatra = moonLongitudeSidereal % nakshatraSpan;
  
  const startLordIndex = nakshatraIndex % 9;
  const fractionElapsed = degreeInNakshatra / nakshatraSpan;
  
  const periods: DashaPeriod[] = [];
  let currentDate = DateTime.fromJSDate(birthDate);
  
  // Calculate the remaining time in the first Dasha
  const firstDashaYears = DASHA_YEARS[startLordIndex];
  const elapsedYears = firstDashaYears * fractionElapsed;
  
  currentDate = currentDate.minus({ days: Math.floor(elapsedYears * 365.25) });

  // Generate 120 years of Dashas
  let lordIdx = startLordIndex;
  let totalYears = 0;
  
  while (totalYears < 120) {
    const lord = DASHA_LORDS[lordIdx];
    const years = DASHA_YEARS[lordIdx];
    const endDate = currentDate.plus({ days: Math.floor(years * 365.25) });
    
    periods.push({
      planet: lord,
      startDate: currentDate.toJSDate(),
      endDate: endDate.toJSDate(),
    });
    
    currentDate = endDate;
    lordIdx = (lordIdx + 1) % 9;
    totalYears += years;
  }

  return periods;
}


export function detectYogas(d1: DivisionalChart): string[] {
  const yogas: string[] = [];
  const positions = d1.planetaryPositions;
  const posMap = new Map(positions.map(p => [p.planet.toUpperCase(), p]));

  // 1. Gaja Kesari Yoga (Jupiter in Kendra from Moon)
  const jupiter = posMap.get("JUPITER");
  const moon = posMap.get("MOON");
  if (jupiter && moon) {
    const diff = (jupiter.house - moon.house + 12) % 12;
    if ([0, 3, 6, 9].includes(diff)) {
      yogas.push("Gaja Kesari Yoga");
    }
  }

  // 2. Budha Aditya Yoga (Sun and Mercury in same sign)
  const sun = posMap.get("SUN");
  const mercury = posMap.get("MERCURY");
  if (sun && mercury && sun.sign === mercury.sign) {
    yogas.push("Budha Aditya Yoga");
  }

  return yogas;
}

export async function calculateVedicChart(
  birthData: VedicBirthData,
  natalChartData: NatalChartData
): Promise<VedicChart & { dashas: DashaPeriod[]; yogas: string[] }> {
  const { date, time, timezone, ayanamsa: ayanamsaType = AyanamsaType.LAHIRI } = birthData;

  const timeParts = time.split(":").map(Number);
  const dateTime = DateTime.fromJSDate(date, { zone: timezone })
    .set({ hour: timeParts[0] || 0, minute: timeParts[1] || 0, second: 0 })
    .toUTC();

  const jd = sweph.julday(
    dateTime.year, dateTime.month, dateTime.day,
    dateTime.hour + dateTime.minute / 60 + dateTime.second / 3600,
    sweph.constants.SE_GREG_CAL
  );

  const ayanamsa = getAyanamsa(jd, ayanamsaType);

  const planets: PlanetPosition[] = [
    natalChartData.sun, natalChartData.moon, natalChartData.mercury,
    natalChartData.venus, natalChartData.mars, natalChartData.jupiter,
    natalChartData.saturn, natalChartData.uranus, natalChartData.neptune,
    natalChartData.pluto, natalChartData.chiron, natalChartData.lilith,
    natalChartData.node,
    {
      ...natalChartData.node,
      planet: "KETU",
      longitude: normalizeAngle(natalChartData.node.longitude + 180),
    },
  ];

  const ascendant: PlanetPosition = {
    planet: "ASCENDANT" as PlanetName,
    longitude: natalChartData.ascendant.longitude,
    latitude: 0, distance: 0,
    sign: natalChartData.ascendant.sign,
    signDegree: natalChartData.ascendant.signDegree,
    degree: natalChartData.ascendant.degree,
    minute: natalChartData.ascendant.minute,
    retrograde: false, house: 1, speed: 0,
  };

  const d1 = calculateDivisional(planets, ascendant, ayanamsa, natalChartData.sun, DivisionalChartType.D1);
  const d2 = calculateDivisional(planets, ascendant, ayanamsa, natalChartData.sun, DivisionalChartType.D2);
  const d4 = calculateDivisional(planets, ascendant, ayanamsa, natalChartData.sun, DivisionalChartType.D4);
  const d9 = calculateDivisional(planets, ascendant, ayanamsa, natalChartData.sun, DivisionalChartType.D9);
  const d10 = calculateDivisional(planets, ascendant, ayanamsa, natalChartData.sun, DivisionalChartType.D10);

  const moonSidereal = toSiderealLongitude(natalChartData.moon.longitude, ayanamsa);
  const moonNakshatra = calculateNakshatra(moonSidereal);
  const ascSidereal = toSiderealLongitude(ascendant.longitude, ayanamsa);
  const ascNakshatra = calculateNakshatra(ascSidereal);

  const dashas = calculateVimshottariDasha(moonSidereal, date);
  const yogas = detectYogas(d1);

  return {
    d1, d2, d4, d9, d10,
    nakshatras: { moon: moonNakshatra, ascendant: ascNakshatra },
    ayanamsa,
    ayanamsaType,
    dashas,
    yogas,
  };
}

export const vedicAstrologyService = {
  calculateVedicChart,
  getAyanamsa,
  toSiderealLongitude,
  calculateNakshatra,
};
