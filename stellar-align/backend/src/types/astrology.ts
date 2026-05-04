import { 
  ZodiacSign, 
  HouseSystem as PrismaHouseSystem, 
  ZodiacType, 
  AyanamsaType as PrismaAyanamsaType, 
  DivisionalChartType as PrismaDivisionalChartType 
} from "@prisma/client";

// Astrology domain types

export { ZodiacSign };

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
  | "lilith"
  | "rahu"
  | "ketu";

export type HouseSystem = PrismaHouseSystem;

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

export interface MoodAspects {
  emotion: string;
  career: string;
  love: string;
  health: string;
}

export interface PrimaryTransit {
  title: string;
  badge: "major" | "minor" | "shadow";
  planets: string;
  body: string;
  source: string;
}

export interface AspectEntry {
  symbol: string;
  name: string;
  description: string;
  quality: string;
}

export interface DailyHoroscope {
  id: string;
  userId: string;
  forDate: Date;
  moonSign: ZodiacSign;
  moonPhase: string;
  energyScore: number;
  moodAspects: MoodAspects;
  primaryTransit: PrimaryTransit;
  aspects: AspectEntry[];
  contentSelf: string;
  contentWork: string;
  contentLove: string;
  contentSocial: string;
  activeTransits: Transit[];
  generatedBy: "CLAUDE" | "RULE_BASED" | "SYSTEM";
  viewedAt?: Date | null;
  bookmarked: boolean;
  shared: boolean;
  createdAt: Date;
}

export interface TransitForecastEvent {
  id: string;
  date: {
    iso: string;
    month: string;
    day: number;
    year: number;
  };
  orb: {
    value: number;
    formatted: string;
  };
  type: "major" | "minor" | "shadow";
  title: string;
  symbols: string;
  description: string;
  impact: {
    level: string;
    label: string;
  };
  progress: {
    percentage: number | null;
    label: string;
  };
}

export interface TransitForecast {
  period: "week" | "month" | "year";
  range: {
    start: string;
    end: string;
    label: string;
  };
  transits: TransitForecastEvent[];
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

export { ZodiacType };
export type AyanamsaType = PrismaAyanamsaType;
export type DivisionalChartType = PrismaDivisionalChartType;

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
  retrograde?: boolean;
  combust?: boolean;
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
