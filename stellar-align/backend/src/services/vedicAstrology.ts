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

const FIRE_SIGNS: ZodiacSign[] = [ZodiacSign.ARIES, ZodiacSign.LEO, ZodiacSign.SAGITTARIUS];
const EARTH_SIGNS: ZodiacSign[] = [ZodiacSign.TAURUS, ZodiacSign.VIRGO, ZodiacSign.CAPRICORN];
const AIR_SIGNS: ZodiacSign[] = [ZodiacSign.GEMINI, ZodiacSign.LIBRA, ZodiacSign.AQUARIUS];

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

// Divisional chart helpers
function getNavamsaSign(sign: ZodiacSign, degreeInSign: number): ZodiacSign {
  const navamsaIndex = Math.floor(degreeInSign / (3 + 1/3));
  let trineGroup = 0;
  if (FIRE_SIGNS.includes(sign)) trineGroup = 0;
  else if (EARTH_SIGNS.includes(sign)) trineGroup = 1;
  else if (AIR_SIGNS.includes(sign)) trineGroup = 2;
  else trineGroup = 3;
  return ZODIAC_SIGNS[(trineGroup * 3 + navamsaIndex) % 12];
}

function createHouses(ascSign: ZodiacSign) {
  const ascIndex = getSignIndex(ascSign);
  return Array.from({ length: 12 }, (_, i) => ({
    house: i + 1, sign: ZODIAC_SIGNS[(ascIndex + i) % 12], degree: 0
  }));
}

function calculateDivisional(
  planets: PlanetPosition[], ascendant: PlanetPosition, ayanamsa: number,
  chartType: DivisionalChartType,
): DivisionalChart {
  const planetaryPositions: DivisionalChartPosition[] = planets.map((p) => {
    const siderealLon = toSiderealLongitude(p.longitude, ayanamsa);
    const degreeInSign = getDegreeInSign(siderealLon);
    const sign = getSignFromLongitude(siderealLon);

    let dSign: ZodiacSign = sign;
    let dDegree: number = degreeInSign;

    if (chartType === DivisionalChartType.D1) {
      dSign = sign;
    } else if (chartType === DivisionalChartType.D2) {
      const signIndex = getSignIndex(sign);
      const isOdd = [0, 2, 4, 6, 8, 10].includes(signIndex);
      const inSecondHalf = degreeInSign >= 15;
      if (isOdd) {
        dSign = inSecondHalf ? ZODIAC_SIGNS[(signIndex + 1) % 12] : sign; // Leo / Cancer mapping simplified
      } else {
        dSign = inSecondHalf ? sign : ZODIAC_SIGNS[(signIndex + 11) % 12];
      }
    } else if (chartType === DivisionalChartType.D4) {
      const segment = Math.floor(degreeInSign / 7.5);
      const trineStart = FIRE_SIGNS.includes(sign) ? 0 : EARTH_SIGNS.includes(sign) ? 1 : AIR_SIGNS.includes(sign) ? 2 : 3;
      dSign = ZODIAC_SIGNS[(trineStart * 3 + segment) % 12];
    } else if (chartType === DivisionalChartType.D9) {
      dSign = getNavamsaSign(sign, degreeInSign);
    } else if (chartType === DivisionalChartType.D10) {
      const signIndex = getSignIndex(sign);
      const dasamsaIndex = Math.floor(degreeInSign / 3);
      const start = [0, 2, 4, 6, 8, 10].includes(signIndex) ? signIndex : (signIndex + 6) % 12;
      dSign = ZODIAC_SIGNS[(start + dasamsaIndex) % 12];
    } else if (chartType === DivisionalChartType.D11) {
      const signIndex = getSignIndex(sign);
      const ekadasamsaIndex = Math.floor(degreeInSign / (30 / 11));
      dSign = ZODIAC_SIGNS[(signIndex + ekadasamsaIndex) % 12];
    }

    return {
      planet: p.planet.toLowerCase() as any, 
      sign: dSign,
      degree: Math.floor(dDegree), 
      house: 1, // Will be calculated after ascendant is set
    };
  });

  const siderealAsc = toSiderealLongitude(ascendant.longitude, ayanamsa);
  const ascDegree = getDegreeInSign(siderealAsc);
  const ascSign = getSignFromLongitude(siderealAsc);

  let dAsc: ZodiacSign = ascSign;
  let dAscDegree = ascDegree;

  if (chartType === DivisionalChartType.D1) {
    dAsc = ascSign;
  } else if (chartType === DivisionalChartType.D2) {
    const ascIndex = getSignIndex(ascSign);
    const isOdd = [0, 2, 4, 6, 8, 10].includes(ascIndex);
    const inSecondHalf = ascDegree >= 15;
    dAsc = isOdd ? (inSecondHalf ? ZodiacSign.CANCER : ZodiacSign.LEO) : (inSecondHalf ? ZodiacSign.LEO : ZodiacSign.CANCER);
  } else if (chartType === DivisionalChartType.D4) {
    const segment = Math.floor(ascDegree / 7.5);
    const trineStart = FIRE_SIGNS.includes(ascSign) ? 0 : EARTH_SIGNS.includes(ascSign) ? 1 : AIR_SIGNS.includes(ascSign) ? 2 : 3;
    dAsc = ZODIAC_SIGNS[(trineStart * 3 + segment) % 12];
  } else if (chartType === DivisionalChartType.D9) {
    dAsc = getNavamsaSign(ascSign, ascDegree);
  } else if (chartType === DivisionalChartType.D10) {
    const ascIndex = getSignIndex(ascSign);
    const dasamsaIndex = Math.floor(ascDegree / 3);
    const start = [0, 2, 4, 6, 8, 10].includes(ascIndex) ? ascIndex : (ascIndex + 6) % 12;
    dAsc = ZODIAC_SIGNS[(start + dasamsaIndex) % 12];
  } else if (chartType === DivisionalChartType.D11) {
    const ascIndex = getSignIndex(ascSign);
    const ekadasamsaIndex = Math.floor(ascDegree / (30 / 11));
    dAsc = ZODIAC_SIGNS[(ascIndex + ekadasamsaIndex) % 12];
  }

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
    ascendantDegree: Math.floor(dAscDegree),
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

  const d1 = calculateDivisional(planets, ascendant, ayanamsa, DivisionalChartType.D1);
  const d2 = calculateDivisional(planets, ascendant, ayanamsa, DivisionalChartType.D2);
  const d4 = calculateDivisional(planets, ascendant, ayanamsa, DivisionalChartType.D4);
  const d9 = calculateDivisional(planets, ascendant, ayanamsa, DivisionalChartType.D9);
  const d10 = calculateDivisional(planets, ascendant, ayanamsa, DivisionalChartType.D10);
  const d11 = calculateDivisional(planets, ascendant, ayanamsa, DivisionalChartType.D11);

  const moonSidereal = toSiderealLongitude(natalChartData.moon.longitude, ayanamsa);
  const moonNakshatra = calculateNakshatra(moonSidereal);
  const ascSidereal = toSiderealLongitude(ascendant.longitude, ayanamsa);
  const ascNakshatra = calculateNakshatra(ascSidereal);

  const dashas = calculateVimshottariDasha(moonSidereal, date);
  const yogas = detectYogas(d1);

  return {
    d1, d2, d4, d9, d10, d11,
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
