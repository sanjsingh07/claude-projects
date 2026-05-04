import { DateTime } from "luxon";
import { 
  getPlanetaryPositions, 
  calculateUserTransits
} from "../astrology";
import { classifyTransitType, determineImpactLevel } from "./transitClassifier";
import { computeTransitProgress } from "./progressCalculator";
import { generateInterpretation } from "./interpretationGenerator";
import {
  ASPECT_SYMBOLS,
  capitalize,
  formatOrb,
  PLANET_SYMBOLS,
  SIGN_SYMBOLS,
} from "./transitConstants";

type ForecastPeriod = "week" | "month" | "year";

const FORECAST_ASPECTS = {
  CONJUNCTION: { angle: 0, orb: 2.6 },
  SEXTILE: { angle: 60, orb: 2.3 },
  SQUARE: { angle: 90, orb: 2.3 },
  TRINE: { angle: 120, orb: 2.3 },
  OPPOSITION: { angle: 180, orb: 2.5 },
  QUINCUNX: { angle: 150, orb: 1.5 },
  QUINTILE: { angle: 72, orb: 1 },
} as const;

const SKY_ASPECT_PLANETS = [
  "sun",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
];

export async function getTransitsForPeriod(
  natalChart: any,
  period: ForecastPeriod,
  startDate: Date = new Date(),
  timezone = "UTC",
) {
  const start = DateTime.fromJSDate(startDate, { zone: timezone }).startOf("day");
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
      const key = `natal-aspect-${transit.planet1}-${transit.type}-${transit.planet2}`;
      const type = classifyTransitType(transit.planet1, transit.type, false, false, transit.orb);
      const impact = determineImpactLevel(transit.planet1, transit.type, false, transit.orb);
      const progress = computeTransitProgress(DateTime.now().setZone(timezone).toJSDate(), currentDate.toJSDate(), type, transit.orb);
      const sym1 = PLANET_SYMBOLS[transit.planet1.toUpperCase()] || transit.planet1;
      const sym2 = PLANET_SYMBOLS[transit.planet2.toUpperCase()] || transit.planet2;
      const aspSym = ASPECT_SYMBOLS[transit.type.toUpperCase()] || transit.type;
      const natalPlanetName = natalPlanetLabel(transit.planet2);
      const event = {
        id: key,
        eventKind: "natal_aspect",
        aspectType: transit.type,
        quality: transit.type.toLowerCase(),
        date: formatEventDate(currentDate),
        orb: {
          value: transit.orb,
          formatted: formatOrb(transit.orb)
        },
        type,
        title: `${capitalize(transit.planet1)} ${aspectVerb(transit.type)} ${natalPlanetName}`,
        symbols: `${sym1} ${aspSym} ${sym2}`,
        description: generateInterpretation(transit.planet1, transit.type, transit.planet2, undefined, false, false, natalChart),
        impact,
        progress
      };
      upsertClosestEvent(transitsFound, key, event);
    }

    // 2. Detect current-sky planet-to-planet aspects like Mercury ⟂ Saturn.
    for (const aspect of calculateSkyAspects(transitPositions as Record<string, any>)) {
      const key = `sky-aspect-${aspect.planet1}-${aspect.type}-${aspect.planet2}`;
      const eventType = classifyTransitType(aspect.planet1, aspect.type, false, false, aspect.orb);
      const impact = determineImpactLevel(aspect.planet1, aspect.type, false, aspect.orb);
      const progress = computeTransitProgress(DateTime.now().setZone(timezone).toJSDate(), currentDate.toJSDate(), eventType, aspect.orb);
      const event = {
        id: key,
        eventKind: "sky_aspect",
        aspectType: aspect.type,
        quality: aspect.type.toLowerCase(),
        date: formatEventDate(currentDate),
        orb: {
          value: aspect.orb,
          formatted: formatOrb(aspect.orb),
        },
        type: eventType,
        title: `${capitalize(aspect.planet1)} ${aspectTitleSymbol(aspect.type)} ${capitalize(aspect.planet2)}`,
        symbols: `${formatPosition(aspect.pos1)} ${aspectTitleSymbol(aspect.type)} ${formatPosition(aspect.pos2)}`,
        description: generateSkyAspectInterpretation(aspect.planet1, aspect.type, aspect.planet2),
        impact,
        progress,
      };
      upsertClosestEvent(transitsFound, key, event);
    }

    // 3. Detect Sign Ingresses
    if (prevPositions) {
      for (const planet in transitPositions) {
        const pos = (transitPositions as any)[planet];
        const prevPos = prevPositions[planet];
        if (pos.sign !== prevPos.sign) {
          const key = `ingress-${planet}-${pos.sign}`;
          if (!transitsFound.has(key)) {
            const sym = PLANET_SYMBOLS[planet.toUpperCase()] || planet;
            const signSym = SIGN_SYMBOLS[pos.sign.toUpperCase()] || pos.sign;            
            upsertClosestEvent(transitsFound, key, {
              id: key,
              eventKind: "ingress",
              quality: "conjunction",
              date: formatEventDate(currentDate),
              orb: { value: 0, formatted: "0°00'" },
              type: "major",
              title: `${capitalize(planet)} enters ${capitalize(pos.sign)}`,
              symbols: `${sym} ${signSym} 00°`,
              description: generateInterpretation(capitalize(planet), "", undefined, capitalize(pos.sign), true, false, natalChart),
              impact: { level: "high", label: "Impact: · high" },
              progress: { percentage: null, label: "active" }
            });
          }
        }

        // 4. Detect Retrograde Changes
        if (pos.retrograde !== prevPos.retrograde) {
          const key = `retrograde-${planet}-${pos.retrograde ? 'start' : 'end'}`;
          if (!transitsFound.has(key)) {
            const sym = PLANET_SYMBOLS[planet.toUpperCase()] || planet;
            
            upsertClosestEvent(transitsFound, key, {
              id: key,
              eventKind: pos.retrograde ? "station_retrograde" : "station_direct",
              quality: "shadow",
              date: formatEventDate(currentDate),
              orb: { value: 0, formatted: "0°00'" },
              type: "major",
              title: `${capitalize(planet)} ${pos.retrograde ? 'retrograde' : 'direct'}`,
              symbols: `${sym} ${pos.retrograde ? 'R' : 'D'}`,
              description: generateInterpretation(capitalize(planet), "", undefined, undefined, false, true, natalChart),
              impact: { level: isOuterPlanet(planet) ? "profound" : "high", label: `Impact: · ${isOuterPlanet(planet) ? "profound" : "high"}` },
              progress: computeTransitProgress(DateTime.now().setZone(timezone).toJSDate(), currentDate.toJSDate(), "major", 0)
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

function calculateSkyAspects(transitPositions: Record<string, any>) {
  const positions = SKY_ASPECT_PLANETS
    .map((planet) => transitPositions[planet])
    .filter((pos) => pos?.longitude !== undefined);
  const aspects: Array<{
    planet1: string;
    planet2: string;
    type: keyof typeof FORECAST_ASPECTS;
    orb: number;
    pos1: any;
    pos2: any;
  }> = [];

  for (let i = 0; i < positions.length; i += 1) {
    for (let j = i + 1; j < positions.length; j += 1) {
      const pos1 = positions[i];
      const pos2 = positions[j];
      let diff = Math.abs(pos1.longitude - pos2.longitude);
      if (diff > 180) diff = 360 - diff;

      for (const [type, data] of Object.entries(FORECAST_ASPECTS) as Array<[keyof typeof FORECAST_ASPECTS, { angle: number; orb: number }]>) {
        const orb = Math.abs(diff - data.angle);
        if (orb <= data.orb) {
          aspects.push({
            planet1: pos1.planet,
            planet2: pos2.planet,
            type,
            orb,
            pos1,
            pos2,
          });
          break;
        }
      }
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
}

function upsertClosestEvent(events: Map<string, any>, key: string, event: any) {
  const existing = events.get(key);
  if (!existing || event.orb.value < existing.orb.value) {
    events.set(key, event);
  }
}

function formatEventDate(date: DateTime) {
  return {
    iso: date.toISO(),
    month: date.toFormat("LLL").toUpperCase(),
    day: date.day,
    year: date.year,
  };
}

function natalPlanetLabel(planet: string) {
  const normalized = planet.toLowerCase();
  if (normalized === "sun") return "your Sun";
  if (normalized === "moon") return "your Moon";
  if (normalized === "ascendant") return "your Rising";
  if (normalized === "midheaven") return "your Midheaven";
  return `your ${capitalize(planet)}`;
}

function aspectVerb(type: string) {
  const normalized = type.toUpperCase();
  const verbs: Record<string, string> = {
    CONJUNCTION: "conjuncts",
    SEXTILE: "sextiles",
    SQUARE: "squares",
    TRINE: "trines",
    OPPOSITION: "opposes",
    QUINCUNX: "quincunxes",
    QUINTILE: "quintiles",
  };
  return verbs[normalized] || normalized.toLowerCase();
}

function aspectTitleSymbol(type: string) {
  if (type.toUpperCase() === "SQUARE") return "⟂";
  return ASPECT_SYMBOLS[type.toUpperCase()] || type;
}

function formatPosition(pos: any) {
  const symbol = PLANET_SYMBOLS[String(pos.planet).toUpperCase()] || capitalize(pos.planet);
  const sign = SIGN_SYMBOLS[String(pos.sign).toUpperCase()] || capitalize(pos.sign);
  return `${symbol} ${pos.degree ?? pos.signDegree}° ${sign}`;
}

function isOuterPlanet(planet: string) {
  return ["jupiter", "saturn", "uranus", "neptune", "pluto"].includes(planet.toLowerCase());
}

function generateSkyAspectInterpretation(planet1: string, type: string, planet2: string) {
  const key = `${planet1.toLowerCase()}-${type.toUpperCase()}-${planet2.toLowerCase()}`;
  const reverseKey = `${planet2.toLowerCase()}-${type.toUpperCase()}-${planet1.toLowerCase()}`;
  const lines: Record<string, string> = {
    "mercury-SQUARE-saturn": "Think twice before you speak. <em>What feels blocked is being clarified</em> — not stopped. Re-express your point. Slower is faster.",
    "mars-TRINE-jupiter": "Confidence surges — act on it. <em>Momentum has somewhere to go</em>, especially when courage is paired with timing.",
    "venus-QUINTILE-neptune": "Gut instinct in relationships gets sharper. <em>The subtle signal is the useful one</em>; beauty tells the truth before logic catches up.",
    "sun-SQUARE-saturn": "Structure under review. <em>The day tests what can hold weight</em>, not to punish you, but to reveal the beam that needs reinforcement.",
    "venus-TRINE-pluto": "Desire goes deeper without needing to get louder. <em>Something honest pulls beneath the surface</em> and changes the terms of attraction.",
    "venus-SEXTILE-saturn": "Affection takes a practical shape. <em>Care becomes reliable</em> when it is shown through time, repair, and follow-through.",
    "mars-SQUARE-jupiter": "The engine runs hot. <em>Ambition needs a container</em>, or a useful risk becomes unnecessary excess.",
    "sun-OPPOSITION-moon": "The private self and visible self face each other. <em>What you feel needs room</em>, even if the schedule disagrees.",
  };

  const specific = lines[key] || lines[reverseKey];
  if (specific) return specific;

  const action = aspectVerb(type);
  const tone = type === "SQUARE" || type === "OPPOSITION"
    ? "friction becomes information"
    : type === "TRINE" || type === "SEXTILE"
      ? "support becomes available without much force"
      : "two drives share the same room";
  return `${capitalize(planet1)} ${action} ${capitalize(planet2)}. <em>${capitalize(tone)}</em>; the useful move is to respond to the exact pressure, not the general mood.`;
}
