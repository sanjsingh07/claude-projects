// Astrology domain types

export type ZodiacSign =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

export type Planet =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto"
  | "chiron"
  | "north_node"
  | "south_node"
  | "lilith";

export type HouseSystem = "placidus" | "koch" | "equal" | "whole" | "porphyry";

export type AspectType =
  | "conjunction"
  | "sextile"
  | "square"
  | "trine"
  | "opposition"
  | "quincunx"
  | "quintile"
  | "biquintile";

export interface GeographicCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface BirthData {
  date: Date;
  time?: Date;
  coordinates: GeographicCoordinates;
  timezone: string;
  locationName?: string;
}

export interface CelestialPosition {
  longitude: number;
  latitude: number;
  distance: number;
  longitudeSpeed: number;
  sign: ZodiacSign;
  signDegree: number;
  signMinute: number;
  house?: number;
  retrograde: boolean;
}

export interface PlanetaryPosition extends CelestialPosition {
  planet: Planet;
}

export interface Aspect {
  planet1: Planet;
  planet2: Planet;
  type: AspectType;
  angle: number;
  orb: number;
  applying: boolean;
}

export interface House {
  number: number;
  cusp: number;
  sign: ZodiacSign;
}

export interface NatalChart {
  id: string;
  userId: string;
  calculatedAt: Date;
  birthData: BirthData;
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  risingSign?: ZodiacSign;
  planetaryPositions: Record<Planet, PlanetaryPosition>;
  houses: House[];
  aspects: Aspect[];
  chartPattern?: string;
  houseSystem: HouseSystem;
}

export interface Transit {
  planet: Planet;
  natalPlanet?: Planet;
  targetSign?: ZodiacSign;
  aspectType?: AspectType;
  startDate: Date;
  exactDate?: Date;
  endDate: Date;
  description: string;
  intensity: 1 | 2 | 3 | 4 | 5;
}

export interface HoroscopeCategory {
  category: "self" | "work" | "love" | "social";
  content: string;
  keywords: string[];
  rating: number; // 1-5
}

export interface DailyHoroscope {
  id: string;
  userId: string;
  date: Date;
  moonSign: ZodiacSign;
  moonPhase: string;
  activeTransits: Transit[];
  categories: HoroscopeCategory[];
  overallTheme: string;
  generatedBy: "ai" | "rule_based";
  generatedAt: Date;
}

export interface CompatibilityAspect {
  planet1: Planet;
  planet2: Planet;
  type: AspectType;
  angle: number;
  influence: "harmonious" | "challenging" | "neutral";
  description: string;
}

export interface CompatibilityReport {
  id: string;
  user1Id: string;
  user2Id: string;
  overallScore: number;
  emotionalScore: number;
  intellectualScore: number;
  physicalScore: number;
  spiritualScore: number;
  synastryAspects: CompatibilityAspect[];
  strengths: string[];
  challenges: string[];
  advice: string;
  generatedAt: Date;
}

// ────────────────────────────────────────────
// Vedic Astrology Types
// ────────────────────────────────────────────

export type ZodiacType = "tropical" | "sidereal";
export type AyanamsaType = "lahiri" | "raman" | "krishnamurti" | "fagan-bradley";
export type DivisionalChartType = "D1" | "D2" | "D4" | "D9" | "D10" | "D11";

// 27 Nakshatras (Lunar Mansions)
export type NakshatraName =
  | "Ashwini"
  | "Bharani"
  | "Krittika"
  | "Rohini"
  | "Mrigashira"
  | "Ardra"
  | "Punarvasu"
  | "Pushya"
  | "Ashlesha"
  | "Magha"
  | "Purva Phalguni"
  | "Uttara Phalguni"
  | "Hasta"
  | "Chitra"
  | "Swati"
  | "Vishakha"
  | "Anuradha"
  | "Jyeshtha"
  | "Mula"
  | "Purva Ashadha"
  | "Uttara Ashadha"
  | "Shravana"
  | "Dhanishta"
  | "Shatabhisha"
  | "Purva Bhadrapada"
  | "Uttara Bhadrapada"
  | "Revati";

export interface Nakshatra {
  name: NakshatraName;
  pada: 1 | 2 | 3 | 4; // Quarter (1-4)
  lord: Planet; // Nakshatra lord
  subLord?: string; // Sub-lord (for Krishnamurti)
  degree: number; // Starting degree in sign
  padaDegree: number; // Degree within pada
}

export interface VedicPlanetPosition {
  planet: Planet;
  siderealLongitude: number; // 0-360° sidereal
  tropicalLongitude: number; // 0-360° tropical
  latitude: number;
  distance: number;
  sign: ZodiacSign;
  signDegree: number; // 0-29.99
  degree: number; // Integer degree
  minute: number; // Minutes
  retrograde: boolean;
  house: number | null;
  nakshatra?: Nakshatra;
}

export interface DivisionalChartPosition {
  planet: Planet;
  sign: ZodiacSign;
  degree: number;
  house: number;
}

export interface DivisionalChart {
  id?: string;
  natalChartId: string;
  chartType: DivisionalChartType;
  planetaryPositions: DivisionalChartPosition[];
  ascendant: ZodiacSign;
  ascendantDegree: number;
  houses: {
    house: number;
    sign: ZodiacSign;
    degree: number;
  }[];
}

export interface VedicChart {
  d1: DivisionalChart; // Rashi - main chart
  d2: DivisionalChart; // Hora - wealth
  d4: DivisionalChart; // Chaturthamsa - fortune/property
  d9: DivisionalChart; // Navamsa - spouse, dharma
  d10: DivisionalChart; // Dasamsa - career
  d11: DivisionalChart; // Ekadasamsa - gains/losses
  nakshatras: {
    moon: Nakshatra;
    ascendant: Nakshatra;
  };
  ayanamsa: number; // Applied ayanamsa value
  ayanamsaType: AyanamsaType;
}

export interface VedicBirthData {
  date: Date;
  time: string;
  latitude: number;
  longitude: number;
  timezone: string;
  ayanamsa?: AyanamsaType;
}
