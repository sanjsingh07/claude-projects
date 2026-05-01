import { DateTime } from "luxon";
import * as julian from "astronomia/julian";
import {
  Planet, ZodiacSign, VedicBirthData, VedicChart, DivisionalChart,
  DivisionalChartPosition, Nakshatra, NakshatraName, AyanamsaType,
} from "../types/astrology";
import { PlanetName, PlanetPosition, NatalChartData } from "./astrology";

const ZODIAC_SIGNS: ZodiacSign[] = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"
];

const NAKSHATRAS: NakshatraName[] = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
  "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const NAKSHATRA_LORDS: Record<string, string> = {
  Ashwini: "mars", Bharani: "venus", Krittika: "sun", Rohini: "moon",
  Mrigashira: "mars", Ardra: "rahu", Punarvasu: "jupiter", Pushya: "saturn",
  Ashlesha: "mercury", Magha: "ketu", "Purva Phalguni": "venus", "Uttara Phalguni": "sun",
  Hasta: "moon", Chitra: "mars", Swati: "rahu", Vishakha: "jupiter",
  Anuradha: "saturn", Jyeshtha: "mercury", Mula: "ketu", "Purva Ashadha": "venus",
  "Uttara Ashadha": "sun", Shravana: "moon", Dhanishta: "mars", Shatabhisha: "rahu",
  "Purva Bhadrapada": "jupiter", "Uttara Bhadrapada": "saturn", Revati: "mercury",
};

const FIRE_SIGNS = ["aries", "leo", "sagittarius"];
const EARTH_SIGNS = ["taurus", "virgo", "capricorn"];
const AIR_SIGNS = ["gemini", "libra", "aquarius"];

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

// Ayanamsa calculations
// Based on standard Vedic astrology references

export function calculateLahiriAyanamsa(jd: number): number {
  // T = centuries from J2000.0
  const T = (jd - 2451545.0) / 36525;

  // Lahiri ayanamsa (Chitrapaksha)
  // The Sun enters sidereal Aries when it reaches 0° in the sidereal zodiac
  // Based on the position of Chitra nakshatra (Spica)
  // Standard value: 0° at 285 CE, ~23.85° at J2000.0
  // Precession rate: ~50.3" per year = 0.0139722° per year
  const ayanamsa = 23.85 + (T * 1.3969444) + (0.00000036 * Math.pow(T * 36525, 2));

  return ayanamsa;
}

export function calculateRamanAyanamsa(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  // Raman ayanamsa: ~25.43° at J2000.0
  return 25.43 + (T * 1.3969444) + (0.00000036 * Math.pow(T * 36525, 2));
}

export function calculateKrishnamurtiAyanamsa(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  // Krishnamurti ayanamsa: ~23.85° at J2000.0 (similar to Lahiri)
  return 23.85 + (T * 1.3969444) + (0.00000036 * Math.pow(T * 36525, 2));
}

export function calculateFaganBradleyAyanamsa(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  // Fagan-Bradley: based on Aldebaran at 15° Scorpio
  return 24.0 + (T * 1.3969444) + (0.00000036 * Math.pow(T * 36525, 2));
}

export function getAyanamsa(jd: number, type: AyanamsaType = "lahiri"): number {
  switch (type) {
    case "lahiri": return calculateLahiriAyanamsa(jd);
    case "raman": return calculateRamanAyanamsa(jd);
    case "krishnamurti": return calculateKrishnamurtiAyanamsa(jd);
    case "fagan-bradley": return calculateFaganBradleyAyanamsa(jd);
    default: return calculateLahiriAyanamsa(jd);
  }
}

export function toSiderealLongitude(tropicalLon: number, ayanamsa: number): number {
  return normalizeAngle(tropicalLon - ayanamsa);
}

export function calculateNakshatra(moonLongitude: number): Nakshatra {
  const normalized = normalizeAngle(moonLongitude);
  const nakshatraSpan = 13.333333;
  const nakshatraIndex = Math.floor(normalized / nakshatraSpan);
  const padaIndex = Math.floor((normalized % nakshatraSpan) / (nakshatraSpan / 4));
  const nakshatraName = NAKSHATRAS[nakshatraIndex % 27] as NakshatraName;
  const pada = ((padaIndex % 4) + 1) as 1 | 2 | 3 | 4;
  const lord = NAKSHATRA_LORDS[nakshatraName] || "moon";

  return {
    name: nakshatraName, pada, lord: lord as any,
    degree: nakshatraIndex * nakshatraSpan,
    padaDegree: normalized % nakshatraSpan,
  };
}

// Divisional chart helpers
function getNavamsaSign(sign: ZodiacSign, degreeInSign: number): ZodiacSign {
  const navamsaIndex = Math.floor(degreeInSign / 3.3333);
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
  chartType: "D1" | "D2" | "D4" | "D9" | "D10" | "D11",
): DivisionalChart {
  const planetaryPositions: DivisionalChartPosition[] = planets.map((p) => {
    const siderealLon = toSiderealLongitude(p.longitude, ayanamsa);
    const degreeInSign = getDegreeInSign(siderealLon);
    const sign = getSignFromLongitude(siderealLon);

    if (chartType === "D1") {
      return {
        planet: p.planet.toLowerCase() as Planet, sign,
        degree: Math.floor(degreeInSign), house: p.house || 1,
      };
    }

    if (chartType === "D2") {
      const signIndex = getSignIndex(sign);
      const isOdd = [0, 2, 4, 6, 8, 10].includes(signIndex);
      const inSecondHalf = degreeInSign >= 15;
      let horaSign: ZodiacSign;
      if (isOdd) {
        horaSign = inSecondHalf ? ZODIAC_SIGNS[(signIndex + 1) % 12] : sign;
      } else {
        horaSign = inSecondHalf ? sign : ZODIAC_SIGNS[(signIndex + 11) % 12];
      }
      return {
        planet: p.planet.toLowerCase() as Planet, sign: horaSign,
        degree: Math.floor(degreeInSign), house: Math.floor(degreeInSign / 15) + 1,
      };
    }

    if (chartType === "D4") {
      const segment = Math.floor(degreeInSign / 7.5);
      let startSign = FIRE_SIGNS.includes(sign) ? 0 : EARTH_SIGNS.includes(sign) ? 1 : AIR_SIGNS.includes(sign) ? 2 : 3;
      const d4Sign = ZODIAC_SIGNS[(startSign * 3 + segment) % 12];
      return {
        planet: p.planet.toLowerCase() as Planet, sign: d4Sign,
        degree: Math.floor(degreeInSign % 7.5), house: segment + 1,
      };
    }

    if (chartType === "D9") {
      const d9Sign = getNavamsaSign(sign, degreeInSign);
      return {
        planet: p.planet.toLowerCase() as Planet, sign: d9Sign,
        degree: Math.floor(degreeInSign % 3.3333), house: Math.floor(degreeInSign / 3.3333) + 1,
      };
    }

    if (chartType === "D10") {
      const signIndex = getSignIndex(sign);
      const dasamsaIndex = Math.floor(degreeInSign / 3);
      const isOdd = [0, 2, 4, 6, 8, 10].includes(signIndex);
      const start = isOdd ? signIndex : (signIndex + 6) % 12;
      const d10Sign = ZODIAC_SIGNS[(start + dasamsaIndex) % 12];
      return {
        planet: p.planet.toLowerCase() as Planet, sign: d10Sign,
        degree: Math.floor(degreeInSign % 3), house: dasamsaIndex + 1,
      };
    }

    if (chartType === "D11") {
      const signIndex = getSignIndex(sign);
      const ekadasamsaIndex = Math.floor(degreeInSign / (30 / 11));
      const d11Sign = ZODIAC_SIGNS[(signIndex + ekadasamsaIndex) % 12];
      return {
        planet: p.planet.toLowerCase() as Planet, sign: d11Sign,
        degree: Math.floor(degreeInSign % (30 / 11)), house: ekadasamsaIndex + 1,
      };
    }

    return {
      planet: p.planet.toLowerCase() as Planet, sign,
      degree: Math.floor(degreeInSign), house: 1,
    };
  });

  const siderealAsc = toSiderealLongitude(ascendant.longitude, ayanamsa);
  const ascDegree = getDegreeInSign(siderealAsc);
  const ascSign = getSignFromLongitude(siderealAsc);

  let dAsc: ZodiacSign;
  let dAscDegree = ascDegree;

  if (chartType === "D1") {
    dAsc = ascSign;
  } else if (chartType === "D2") {
    const ascIndex = getSignIndex(ascSign);
    const isOdd = [0, 2, 4, 6, 8, 10].includes(ascIndex);
    const inSecondHalf = ascDegree >= 15;
    if (isOdd) {
      dAsc = inSecondHalf ? ZODIAC_SIGNS[(ascIndex + 1) % 12] : ascSign;
    } else {
      dAsc = inSecondHalf ? ascSign : ZODIAC_SIGNS[(ascIndex + 11) % 12];
    }
    dAscDegree = ascDegree % 15;
  } else if (chartType === "D4") {
    const segment = Math.floor(ascDegree / 7.5);
    let startSign = FIRE_SIGNS.includes(ascSign) ? 0 : EARTH_SIGNS.includes(ascSign) ? 1 : AIR_SIGNS.includes(ascSign) ? 2 : 3;
    dAsc = ZODIAC_SIGNS[(startSign * 3 + segment) % 12];
    dAscDegree = ascDegree % 7.5;
  } else if (chartType === "D9") {
    dAsc = getNavamsaSign(ascSign, ascDegree);
    dAscDegree = ascDegree % 3.3333;
  } else if (chartType === "D10") {
    const ascIndex = getSignIndex(ascSign);
    const dasamsaIndex = Math.floor(ascDegree / 3);
    const isOdd = [0, 2, 4, 6, 8, 10].includes(ascIndex);
    const start = isOdd ? ascIndex : (ascIndex + 6) % 12;
    dAsc = ZODIAC_SIGNS[(start + dasamsaIndex) % 12];
    dAscDegree = ascDegree % 3;
  } else if (chartType === "D11") {
    const ascIndex = getSignIndex(ascSign);
    const ekadasamsaIndex = Math.floor(ascDegree / (30 / 11));
    dAsc = ZODIAC_SIGNS[(ascIndex + ekadasamsaIndex) % 12];
    dAscDegree = ascDegree % (30 / 11);
  } else {
    dAsc = ascSign;
  }

  return {
    natalChartId: "",
    chartType,
    planetaryPositions,
    ascendant: dAsc,
    ascendantDegree: Math.floor(dAscDegree),
    houses: createHouses(dAsc),
  };
}

export async function calculateVedicChart(
  birthData: VedicBirthData,
  natalChartData: NatalChartData
): Promise<VedicChart> {
  const { date, time, timezone, ayanamsa: ayanamsaType = "lahiri" } = birthData;

  const timeParts = time.split(":").map(Number);
  const dateTime = DateTime.fromJSDate(date, { zone: timezone })
    .set({ hour: timeParts[0] || 0, minute: timeParts[1] || 0, second: 0 })
    .toUTC();

  const jd = julian.CalendarGregorianToJD(
    dateTime.year, dateTime.month,
    dateTime.day + dateTime.hour / 24 + dateTime.minute / 1440 + dateTime.second / 86400
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

  const d1 = calculateDivisional(planets, ascendant, ayanamsa, "D1");
  const d2 = calculateDivisional(planets, ascendant, ayanamsa, "D2");
  const d4 = calculateDivisional(planets, ascendant, ayanamsa, "D4");
  const d9 = calculateDivisional(planets, ascendant, ayanamsa, "D9");
  const d10 = calculateDivisional(planets, ascendant, ayanamsa, "D10");
  const d11 = calculateDivisional(planets, ascendant, ayanamsa, "D11");

  const moonSidereal = toSiderealLongitude(natalChartData.moon.longitude, ayanamsa);
  const moonNakshatra = calculateNakshatra(moonSidereal);
  const ascSidereal = toSiderealLongitude(ascendant.longitude, ayanamsa);
  const ascNakshatra = calculateNakshatra(ascSidereal);

  return {
    d1, d2, d4, d9, d10, d11,
    nakshatras: { moon: moonNakshatra, ascendant: ascNakshatra },
    ayanamsa,
    ayanamsaType,
  };
}

export const vedicAstrologyService = {
  calculateVedicChart,
  calculateLahiriAyanamsa,
  calculateRamanAyanamsa,
  calculateKrishnamurtiAyanamsa,
  calculateFaganBradleyAyanamsa,
  getAyanamsa,
  toSiderealLongitude,
  calculateNakshatra,
};
