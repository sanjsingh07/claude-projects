export interface User {
  id: string;
  email: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  profileCompleted: boolean;
  birthDate?: string;
  birthTime?: string;
  birthTimeUnknown: boolean;
  birthTimezone?: string;
  birthLocationName?: string;
  birthLatitude?: number;
  birthLongitude?: number;
}

export interface NatalChart {
  id: string;
  sunSign: string;
  moonSign: string;
  risingSign?: string;
  planetaryPositions: PlanetPosition[];
  houses: number[];
  aspects: Aspect[];
  chartPattern?: string;
  calculatedAt: string;
}

export interface PlanetPosition {
  planet: string;
  sign: string;
  degree: number;
  minute: number;
  house?: number;
  retrograde: boolean;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  aspectType: string;
  angle: number;
  orb: number;
}

export type HoroscopeCategory = {
  id: 'self' | 'work' | 'love' | 'social';
  title: string;
  icon: string;
  content: string;
};

export interface DailyHoroscope {
  id: string;
  userId: string;
  forDate: string;
  moonSign: string;
  moonPhase: string;
  energyScore: number;
  moodAspects: {
    emotion: string;
    career: string;
    love: string;
    health: string;
  };
  primaryTransit: {
    title: string;
    badge: 'major' | 'minor' | 'shadow';
    planets: string;
    body: string;
    source: string;
  };
  aspects: {
    symbol: string;
    name: string;
    description: string;
    quality: 'opposition' | 'trine' | 'square' | 'conjunction' | 'sextile' | 'quincunx' | 'quintile' | 'shadow';
  }[];
  contentSelf: string;
  contentWork: string;
  contentLove: string;
  contentSocial: string;
  activeTransits: any[];
  generatedBy: 'CLAUDE' | 'RULE_BASED' | 'SYSTEM';
  viewedAt?: string;
  bookmarked: boolean;
  shared: boolean;
  createdAt: string;
}

export interface TransitForecast {
  period: 'week' | 'month' | 'year';
  range: {
    start: string;
    end: string;
    label: string;
  };
  transits: TransitForecastEvent[];
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
  type: 'major' | 'minor' | 'shadow';
  title: string;
  symbols: string;
  description: string;
  impact: {
    level: 'low' | 'moderate' | 'high' | 'intense' | 'profound';
    label: string;
  };
  progress: {
    percentage: number | null;
    label: string;
  };
}

export interface Transit {
  transitPlanet: string;
  planet: string;
  natalPlanet?: string;
  aspectType?: string;
  startDate: string;
  exactDate?: string;
  endDate: string;
  description: string;
  intensity: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  };
}

// ────────────────────────────────────────────
// Vedic Astrology Types
// ────────────────────────────────────────────

export type ZodiacType = 'tropical' | 'sidereal';
export type AyanamsaType = 'lahiri' | 'raman' | 'krishnamurti' | 'fagan-bradley';
export type DivisionalChartType = 'D1' | 'D2' | 'D4' | 'D9' | 'D10';
export type ZodiacSign = 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export type NakshatraName =
  | 'Ashwini' | 'Bharani' | 'Krittika' | 'Rohini' | 'Mrigashira' | 'Ardra'
  | 'Punarvasu' | 'Pushya' | 'Ashlesha' | 'Magha' | 'Purva Phalguni' | 'Uttara Phalguni'
  | 'Hasta' | 'Chitra' | 'Swati' | 'Vishakha' | 'Anuradha' | 'Jyeshtha'
  | 'Mula' | 'Purva Ashadha' | 'Uttara Ashadha' | 'Shravana' | 'Dhanishta'
  | 'Shatabhisha' | 'Purva Bhadrapada' | 'Uttara Bhadrapada' | 'Revati';

export interface Nakshatra {
  name: NakshatraName;
  pada: 1 | 2 | 3 | 4;
  lord: string;
  degree: number;
  padaDegree: number;
}

export interface DivisionalChartPosition {
  planet: string;
  sign: string;
  degree: number;
  house: number;
  retrograde?: boolean;
  combust?: boolean;
}

export interface DivisionalChart {
  id: string;
  natalChartId: string;
  chartType: DivisionalChartType;
  planetaryPositions: DivisionalChartPosition[];
  ascendant: string;
  ascendantDegree: number;
  houses: {
    house: number;
    sign: string;
    degree: number;
  }[];
  createdAt: string;
}

export interface VedicChart {
  d1: DivisionalChart;
  d2: DivisionalChart;
  d4: DivisionalChart;
  d9: DivisionalChart;
  d10: DivisionalChart;
  nakshatras: {
    moon: Nakshatra;
    ascendant: Nakshatra;
  };
  ayanamsa: number;
  ayanamsaType: AyanamsaType;
}

export interface NatalChartWithVedic extends NatalChart {
  zodiacType?: ZodiacType;
  ayanamsa?: AyanamsaType;
  nakshatra?: NakshatraName;
  nakshatraPada?: number;
  nakshatraLord?: string;
  divisionalCharts?: DivisionalChart[];
}
