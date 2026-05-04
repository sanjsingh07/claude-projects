import { DateTime } from "luxon";
import { 
  getPlanetaryPositions, 
  calculateUserTransits
} from "../astrology";
import { classifyTransitType, determineImpactLevel } from "./transitClassifier";
import { computeTransitProgress } from "./progressCalculator";
import { generateInterpretation } from "./interpretationGenerator";

const PLANET_SYMBOLS: Record<string, string> = {
  SUN: "☉", MOON: "☽", MERCURY: "☿", VENUS: "♀", MARS: "♂",
  JUPITER: "♃", SATURN: "♄", URANUS: "♅", NEPTUNE: "♆", PLUTO: "♇",
  CHIRON: "⚷", LILITH: "⚸", NODE: "☊", KETU: "☋",
  ASCENDANT: "ASC", MIDHEAVEN: "MC"
};

const SIGN_SYMBOLS: Record<string, string> = {
  ARIES: "♈", TAURUS: "♉", GEMINI: "♊", CANCER: "♋",
  LEO: "♌", VIRGO: "♍", LIBRA: "♎", SCORPIO: "♏",
  SAGITTARIUS: "♐", CAPRICORN: "♑", AQUARIUS: "♒", PISCES: "♓"
};

const ASPECT_SYMBOLS: Record<string, string> = {
  CONJUNCTION: "☌", SEXTILE: "✶", SQUARE: "□",
  TRINE: "△", OPPOSITION: "☍", QUINCUNX: "⚺"
};

export async function getTransitsForPeriod(
  natalChart: any,
  period: "week" | "month" | "year",
  startDate: Date = new Date()
) {
  const start = DateTime.fromJSDate(startDate).startOf("day");
  const end = start.plus({ 
    days: period === "week" ? 7 : period === "month" ? 30 : 365 
  });

  const { zodiacType, ayanamsa: ayanamsaType, planetaryPositions: natalPositions } = natalChart;
  const ayanamsaToUse = zodiacType === "SIDEREAL" ? ayanamsaType : undefined;

  const step = period === "week" ? 1 : period === "month" ? 1 : 4;
  const transitsFound = new Map<string, any>();
  
  let prevPositions: Record<string, any> | null = null;
  let currentDate = start;

  while (currentDate.toJSDate() <= end.toJSDate()) {
    const transitPositions = await getPlanetaryPositions(currentDate.toJSDate(), ayanamsaToUse);
    
    // 1. Detect Aspects to Natal Chart
    const dayTransits = calculateUserTransits(natalPositions, transitPositions as any);
    for (const transit of dayTransits) {
      const key = `aspect-${transit.planet1}-${transit.type}-${transit.planet2}`;
      if (!transitsFound.has(key)) {
        // Actually calculateUserTransits returns 'orb' already.
        const formattedOrb = `${Math.floor(transit.orb)}°${Math.round((transit.orb % 1) * 60).toString().padStart(2, '0')}'`;
        
        const type = classifyTransitType(transit.planet1, transit.type, false, false, transit.orb);
        const impact = determineImpactLevel(transit.planet1, transit.type, false, transit.orb);
        const progress = computeTransitProgress(new Date(), currentDate.toJSDate(), type, transit.orb);
        
        const sym1 = PLANET_SYMBOLS[transit.planet1.toUpperCase()] || transit.planet1;
        const sym2 = PLANET_SYMBOLS[transit.planet2.toUpperCase()] || transit.planet2;
        const aspSym = ASPECT_SYMBOLS[transit.type.toUpperCase()] || transit.type;

        transitsFound.set(key, {
          id: key,
          date: {
            iso: currentDate.toISO(),
            month: currentDate.toFormat("LLL").toUpperCase(),
            day: currentDate.day,
            year: currentDate.year
          },
          orb: {
            value: transit.orb,
            formatted: formattedOrb
          },
          type,
          title: `${capitalize(transit.planet1)} ${transit.type.toLowerCase()} ${capitalize(transit.planet2)}`,
          symbols: `${sym1} ${aspSym} ${sym2}`,
          description: generateInterpretation(transit.planet1, transit.type, transit.planet2),
          impact,
          progress
        });
      }
    }

    // 2. Detect Sign Ingresses
    if (prevPositions) {
      for (const planet in transitPositions) {
        const pos = (transitPositions as any)[planet];
        const prevPos = prevPositions[planet];
        if (pos.sign !== prevPos.sign) {
          const key = `ingress-${planet}-${pos.sign}`;
          if (!transitsFound.has(key)) {
            const sym = PLANET_SYMBOLS[planet.toUpperCase()] || planet;
            const signSym = SIGN_SYMBOLS[pos.sign.toUpperCase()] || pos.sign;            
            transitsFound.set(key, {
              id: key,
              date: {
                iso: currentDate.toISO(),
                month: currentDate.toFormat("LLL").toUpperCase(),
                day: currentDate.day,
                year: currentDate.year
              },
              orb: { value: 0, formatted: "0°00'" },
              type: "major",
              title: `${capitalize(planet)} enters ${capitalize(pos.sign)}`,
              symbols: `${sym} ${signSym} 00°`,
              description: generateInterpretation(capitalize(planet), "", undefined, capitalize(pos.sign), true),
              impact: { level: "high", label: "Impact: · high" },
              progress: { percentage: null, label: "active" }
            });
          }
        }

        // 3. Detect Retrograde Changes
        if (pos.retrograde !== prevPos.retrograde) {
          const key = `retrograde-${planet}-${pos.retrograde ? 'start' : 'end'}`;
          if (!transitsFound.has(key)) {
            const sym = PLANET_SYMBOLS[planet.toUpperCase()] || planet;
            
            transitsFound.set(key, {
              id: key,
              date: {
                iso: currentDate.toISO(),
                month: currentDate.toFormat("LLL").toUpperCase(),
                day: currentDate.day,
                year: currentDate.year
              },
              orb: { value: 0, formatted: "0°00'" },
              type: "major",
              title: `${capitalize(planet)} ${pos.retrograde ? 'goes retrograde' : 'goes direct'}`,
              symbols: `${sym} ${pos.retrograde ? 'R' : 'D'}`,
              description: generateInterpretation(capitalize(planet), "", undefined, undefined, false, true),
              impact: { level: "high", label: "Impact: · high" },
              progress: { percentage: null, label: "active" }
            });
          }
        }
      }
    }

    prevPositions = transitPositions;
    currentDate = currentDate.plus({ days: step });
  }

  return {
    period,
    range: {
      start: start.toISO(),
      end: end.toISO(),
      label: `${start.toFormat("LLL d")} – ${end.toFormat("LLL d, yyyy")}`
    },
    transits: Array.from(transitsFound.values()).sort((a, b) => 
      DateTime.fromISO(a.date.iso).toMillis() - DateTime.fromISO(b.date.iso).toMillis()
    )
  };
}

function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
