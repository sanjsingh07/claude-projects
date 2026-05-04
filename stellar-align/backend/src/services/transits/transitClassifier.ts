export type TransitType = "major" | "minor" | "shadow";
export type ImpactLevel = "low" | "moderate" | "high" | "intense" | "profound";

const OUTER_PLANETS = ["JUPITER", "SATURN", "URANUS", "NEPTUNE", "PLUTO"];
const INNER_PLANETS = ["MERCURY", "VENUS", "MARS"];
const HARD_ASPECTS = ["CONJUNCTION", "SQUARE", "OPPOSITION"];

export function classifyTransitType(
  planet1: string,
  type: string,
  isIngress: boolean,
  isRetrogradeChange: boolean,
  orb: number
): TransitType {
  if (isIngress || isRetrogradeChange) return "major";
  
  if (OUTER_PLANETS.includes(planet1)) return "major";
  
  if (orb < 1) return "major";
  if (orb > 3) return "shadow";
  
  return "minor";
}

export function determineImpactLevel(
  planet1: string,
  type: string,
  isIngress: boolean,
  orb: number
): { level: ImpactLevel; label: string } {
  let level: ImpactLevel = "moderate";
  
  if (isIngress) {
    level = "high";
  } else if (OUTER_PLANETS.includes(planet1)) {
    if (orb < 1) {
      level = "profound";
    } else if (["SATURN", "PLUTO"].includes(planet1) && HARD_ASPECTS.includes(type)) {
      level = "intense";
    } else {
      level = "high";
    }
  } else if (INNER_PLANETS.includes(planet1)) {
    level = "moderate";
  } else if (orb > 5) {
    level = "low";
  }

  return {
    level,
    label: `Impact: · ${level}`
  };
}
