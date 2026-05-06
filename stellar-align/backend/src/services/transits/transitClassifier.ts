export type TransitType = "major" | "minor" | "shadow";
export type ImpactLevel = "low" | "moderate" | "high" | "intense" | "profound";

const OUTER_PLANETS = ["JUPITER", "SATURN", "URANUS", "NEPTUNE", "PLUTO"];
const INNER_PLANETS = ["SUN", "MOON", "MERCURY", "VENUS", "MARS"];
const HARD_ASPECTS = ["CONJUNCTION", "SQUARE", "OPPOSITION"];

export function classifyTransitType(
  planet1: string,
  type: string,
  isIngress: boolean,
  isRetrogradeChange: boolean,
  orb: number
): TransitType {
  const p1 = planet1.toUpperCase();
  const t = type.toUpperCase();

  if (isIngress || isRetrogradeChange) return "major";
  
  // Shadow check: large orbs are always background/shadow
  if (orb > 3.0) return "shadow";

  const isOuter = OUTER_PLANETS.includes(p1);
  const isHard = HARD_ASPECTS.includes(t);

  // 1. Outer Planets (Slow movers, high significance)
  if (isOuter) {
    // Hard aspects of outer planets are always major within orb
    if (isHard) return "major";
    
    // Soft aspects (Sextile, Trine) are major only when close to peak (tight orb)
    if (["SEXTILE", "TRINE"].includes(t) && orb < 1.0) return "major";
    
    // Otherwise outer planet transits are minor (background influence)
    return "minor";
  }

  // 2. Inner Planets (Fast movers, daily influence)
  if (INNER_PLANETS.includes(p1)) {
    // Inner planet hard aspects are major ONLY when very tight (the day of peak influence)
    if (isHard && orb < 0.5) return "major";
    
    return "minor";
  }
  
  // Default for other points (Nodes, Chiron, etc)
  if (orb < 1.0) return "major";

  return "minor";
}

export function determineImpactLevel(
  planet1: string,
  type: string,
  isIngress: boolean,
  orb: number
): { level: ImpactLevel; label: string } {
  const p1 = planet1.toUpperCase();
  const t = type.toUpperCase();
  let level: ImpactLevel = "moderate";
  
  if (isIngress) {
    level = OUTER_PLANETS.includes(p1) ? "profound" : "high";
  } else if (OUTER_PLANETS.includes(p1)) {
    if (orb < 0.5) {
      level = "profound";
    } else if (["SATURN", "PLUTO"].includes(p1) && HARD_ASPECTS.includes(t)) {
      level = "intense";
    } else if (orb < 2.0) {
      level = "high";
    } else {
      level = "moderate";
    }
  } else {
    // Inner planets and others
    if (orb < 0.2) {
      level = "high";
    } else if (orb < 1.5) {
      level = "moderate";
    } else {
      level = "low";
    }
  }

  return {
    level,
    label: `Impact: · ${level}`
  };
}
