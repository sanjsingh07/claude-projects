import logger from "../config/logger";
import { cache } from "../config/redis";
import { DateTime } from "luxon";
import { llmProvider } from "./llmProvider";
import { ZodiacSign } from "@prisma/client";

export type HoroscopeCategory = "self" | "work" | "love" | "social";

export interface DailyHoroscopeContent {
  self: string;
  work: string;
  love: string;
  social: string;
  overallTheme: string;
  keywords: string[];
  luckyNumbers: number[];
}

export interface VedicHoroscopeInput {
  nakshatra?: string | null;
  nakshatraPada?: number | null;
  nakshatraLord?: string | null;
  divisionalCharts?: any[];
  ayanamsa?: string;
}

export interface ChartInterpretation {
  summary: string;
  strengths: string[];
  challenges: string[];
  advice: string;
}

export interface CompatibilityInterpretation {
  summary: string;
  emotionalDynamics: string;
  intellectualConnection: string;
  physicalConnection: string;
  spiritualConnection: string;
  strengths: string[];
  challenges: string[];
  advice: string;
}

class AIContentService {
  /** Generate daily horoscope using configured LLM */
  async generateDailyHoroscope(
    natalChart: any,
    date: Date,
    moonSign: string,
    moonPhase: string,
    activeTransits: any[],
    vedicData?: VedicHoroscopeInput,
  ): Promise<DailyHoroscopeContent> {
    const cacheKey = `horoscope:${natalChart.userId}:${DateTime.fromJSDate(date).toISODate()}`;
    const cached = await cache.get<DailyHoroscopeContent>(cacheKey);
    if (cached) return cached;

    if (!llmProvider.isAvailable) {
      logger.warn("No LLM provider available, using rule-based fallback");
      return this.generateRuleBasedHoroscope(natalChart, moonSign, moonPhase);
    }

    try {
      const prompt = this.buildHoroscopePrompt({
        natalChart,
        date,
        moonSign,
        moonPhase,
        activeTransits,
        vedicData,
      });

      const response = await llmProvider.complete(
        [{ role: "user", content: prompt }],
        { maxTokens: 2000 },
      );

      const parsed = JSON.parse(this.sanitizeJSON(response.text));

      await cache.set(cacheKey, parsed, 86400);
      return parsed;
    } catch (error) {
      logger.error("AI horoscope generation failed", {
        error,
        provider: llmProvider.name,
      });
      return this.generateRuleBasedHoroscope(natalChart, moonSign, moonPhase);
    }
  }

  /** Generate natal chart interpretation */
  async generateChartInterpretation(
    natalChart: any,
  ): Promise<ChartInterpretation> {
    if (!llmProvider.isAvailable) {
      return this.generateRuleBasedChartInterpretation(natalChart);
    }

    const prompt = `You're an expert astrologer. Provide a personalized interpretation for this natal chart:

Sun Sign: ${natalChart.sunSign}
Moon Sign: ${natalChart.moonSign}
Rising Sign: ${natalChart.risingSign}
Chart Pattern: ${natalChart.chartPattern}

Major Aspects: ${JSON.stringify(natalChart.aspects?.slice(0, 5))}

Provide your response as valid JSON with these keys:
- summary (2-3 sentences overview)
- strengths (array of 3-4 strings)
- challenges (array of 2-3 strings)
- advice (1-2 sentences actionable advice)

Respond with ONLY the JSON object, no markdown fences.`;

    try {
      const response = await llmProvider.complete(
        [{ role: "user", content: prompt }],
        { maxTokens: 1500 },
      );
      return JSON.parse(this.sanitizeJSON(response.text));
    } catch (error) {
      logger.error("AI chart interpretation failed", { error });
      return this.generateRuleBasedChartInterpretation(natalChart);
    }
  }

  /** Generate compatibility interpretation */
  async generateCompatibilityInterpretation(
    chart1: any,
    chart2: any,
    synastryAspects: any[],
    score: number,
  ): Promise<CompatibilityInterpretation> {
    if (!llmProvider.isAvailable) {
      return this.generateRuleBasedCompatibility(score, synastryAspects);
    }

    const prompt = `You're an expert astrologer. Analyze the compatibility between these two people:

Person 1: ${chart1.sunSign} Sun, ${chart1.moonSign} Moon, ${chart1.risingSign} Rising
Person 2: ${chart2.sunSign} Sun, ${chart2.moonSign} Moon, ${chart2.risingSign} Rising

Compatibility Score: ${score}/100

Key Synastry Aspects:
${synastryAspects
  .slice(0, 8)
  .map((a) => `- ${a.planet1} ${a.aspectType} ${a.planet2} (orb: ${a.orb}°)`)
  .join("\n")}

Provide your response as valid JSON with these keys:
- summary (2-3 sentence overall assessment)
- emotionalDynamics (1 sentence)
- intellectualConnection (1 sentence)
- physicalConnection (1 sentence)
- spiritualConnection (1 sentence)
- strengths (array of 3-4 strings)
- challenges (array of 2-3 strings)
- advice (1-2 sentences)

Respond with ONLY the JSON object, no markdown fences.`;

    try {
      const response = await llmProvider.complete(
        [{ role: "user", content: prompt }],
        { maxTokens: 1500 },
      );
      return JSON.parse(this.sanitizeJSON(response.text));
    } catch (error) {
      logger.error("AI compatibility generation failed", { error });
      return this.generateRuleBasedCompatibility(score, synastryAspects);
    }
  }

  /** Check if daily horoscopes need generation */
  async shouldGenerateHoroscopes(): Promise<boolean> {
    const lastGeneration = await cache.get<{ date: string; count: number }>(
      "horoscope:last_generation",
    );
    const today = DateTime.now().toISODate();
    if (!lastGeneration) return true;
    return lastGeneration.date !== today;
  }

  /** Mark horoscopes as generated */
  async markGenerationComplete(count: number): Promise<void> {
    await cache.set(
      "horoscope:last_generation",
      {
        date: DateTime.now().toISODate(),
        count,
      },
      86400,
    );
  }

  // ============ PRIVATE METHODS ============

  private buildHoroscopePrompt(params: {
    natalChart: any;
    date: Date;
    moonSign: string;
    moonPhase: string;
    activeTransits: any[];
    vedicData?: VedicHoroscopeInput;
  }): string {
    const { natalChart, date, moonSign, moonPhase, activeTransits, vedicData } = params;

    const isVedic = vedicData?.nakshatra && (natalChart.zodiacType === "SIDEREAL" || natalChart.zodiacType === "sidereal");

    const vedicSection = isVedic
      ? `
VEDIC ASTROLOGY DATA:
- Nakshatra: ${vedicData.nakshatra} (Lord: ${vedicData.nakshatraLord})
- Pada: ${vedicData.nakshatraPada}
- Ayanamsa: ${vedicData.ayanamsa || "Lahiri"}
- Divisional Charts Available: ${vedicData.divisionalCharts?.map((c) => c.chartType).join(", ")}
`
      : "";

    const systemType = isVedic ? "Vedic (Sidereal)" : "Western (Tropical)";

    return `You are Stellar Align's resident astrologer. Generate a personalized daily horoscope based on the following data.
This chart uses the ${systemType} system.

USER'S NATAL CHART:
- Sun: ${natalChart.sunSign}
- Moon: ${natalChart.moonSign}
- Rising: ${natalChart.risingSign}
- Moon in House ${natalChart.planetaryPositions?.moon?.house || "?"}
${vedicSection}
CURRENT CELESTIAL WEATHER (${date.toDateString()}):
- Moon: ${moonSign}
- Moon Phase: ${moonPhase}
- Active Transits: ${activeTransits.map((t) => t.transitPlanet).join(", ")}

INSTRUCTIONS:
Generate 4 category horoscopes (self, work, love, social). Each should be:
- 2-3 sentences
- Specific and actionable
- Reflect current transits
- Tone: encouraging but grounded
${isVedic ? "- Incorporate Nakshatra insights and Vedic terminology where appropriate" : ""}

Provide your response as valid JSON:
{
  "self": "...",
  "work": "...",
  "love": "...",
  "social": "...",
  "overallTheme": "One word theme for the day",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "luckyNumbers": [7, 14, 21]
}

Respond with ONLY the JSON object, no markdown fences.`;
  }

  private generateRuleBasedHoroscope(
    natalChart: any,
    moonSign: string,
    moonPhase: string,
  ): DailyHoroscopeContent {
    const sunSign = natalChart.sunSign;
    const moonInSign = moonSign;

    const elements: Record<string, string> = {
      fire: "energy and initiative",
      earth: "stability and practical matters",
      air: "communication and connection",
      water: "emotions and intuition",
    };

    const sunElement = this.getElement(sunSign);
    const moonElement = this.getElement(moonInSign);
    const theme = `${elements[sunElement]} combined with ${elements[moonElement]}`;

    return {
      self: `The ${moonPhase} in ${moonInSign} highlights your ${moonElement} qualities. Take time for self-reflection today.`,
      work: `Your ${sunSign} energy supports focus on ${theme}. Progress steadily toward your goals.`,
      love: `The current moon phase suggests ${this.getMoonPhaseAdvice(moonPhase)} in relationships.`,
      social: `Connect with others meaningfully. Your ${sunSign} nature brings warmth to conversations.`,
      overallTheme: this.getTheme(moonSign, sunSign),
      keywords: [
        sunSign,
        moonSign,
        moonPhase.replace("-", " "),
        "growth",
        "balance",
      ],
      luckyNumbers: this.generateLuckyNumbers(natalChart.userId),
    };
  }

  private generateRuleBasedChartInterpretation(
    natalChart: any,
  ): ChartInterpretation {
    return {
      summary: `As a ${natalChart.sunSign} Sun with ${natalChart.moonSign} Moon, you embody the qualities of both fire and water in your personality.`,
      strengths: [
        `${natalChart.sunSign} brings confidence and leadership`,
        `${natalChart.moonSign} Moon adds emotional depth`,
        `${natalChart.risingSign} rising gives a ${natalChart.risingSign} approach to life`,
      ],
      challenges: [
        "Balancing inner needs with outer expression",
        "Managing the tension between sun and moon energies",
      ],
      advice:
        "Honor both your rational and emotional sides for greater wholeness.",
    };
  }

  private generateRuleBasedCompatibility(
    score: number,
    _aspects: any[],
  ): CompatibilityInterpretation {
    let summary = "";
    if (score >= 80)
      summary = "A highly harmonious connection with strong potential.";
    else if (score >= 60)
      summary = "A positive connection with good compatibility.";
    else if (score >= 40)
      summary = "A mixed connection with both challenges and opportunities.";
    else
      summary =
        "A challenging connection requiring patience and conscious effort.";

    return {
      summary,
      emotionalDynamics:
        score > 60
          ? "Strong emotional resonance"
          : "Emotional understanding builds over time",
      intellectualConnection:
        score > 50
          ? "Minds meet with mutual interest"
          : "Different perspectives offer growth",
      physicalConnection:
        score > 70
          ? "Natural physical harmony"
          : "Attraction may require cultivation",
      spiritualConnection:
        score > 60
          ? "Shared values support connection"
          : "Different paths, valid journeys",
      strengths: ["Complementary energies", "Learning opportunity"],
      challenges: ["May need patience", "Different approaches"],
      advice: "Practice active listening and mutual respect.",
    };
  }

  private getElement(sign: string): string {
    const fire: ZodiacSign[] = [ZodiacSign.ARIES, ZodiacSign.LEO, ZodiacSign.SAGITTARIUS];
    const earth: ZodiacSign[] = [ZodiacSign.TAURUS, ZodiacSign.VIRGO, ZodiacSign.CAPRICORN];
    const air: ZodiacSign[] = [ZodiacSign.GEMINI, ZodiacSign.LIBRA, ZodiacSign.AQUARIUS];

    const s = sign.toUpperCase() as ZodiacSign;
    if (fire.includes(s)) return "fire";
    if (earth.includes(s)) return "earth";
    if (air.includes(s)) return "air";
    return "water";
  }


  private getMoonPhaseAdvice(phase: string): string {
    const advice: Record<string, string> = {
      new: "planting seeds for new beginnings",
      "waxing-crescent": "nurturing growing connections",
      "first-quarter": "taking action in relationships",
      "waxing-gibbous": "refining and adjusting",
      full: "celebrating and releasing",
      "waning-gibbous": "harvesting insights",
      "last-quarter": "rebalancing and letting go",
      "waning-crescent": "resting and preparing",
    };
    return advice[phase] || "being authentic";
  }

  private getTheme(moonSign: string, sunSign: string): string {
    const themes = [
      "Transformation",
      "Discovery",
      "Balance",
      "Growth",
      "Harmony",
    ];
    const seed =
      (sunSign.charCodeAt(0) + moonSign.charCodeAt(0)) % themes.length;
    return themes[seed];
  }

  private generateLuckyNumbers(userId: string): number[] {
    const date = DateTime.now().toFormat("yyyyMMdd");
    const seed = userId.slice(0, 8) + date;
    const nums: number[] = [];
    let hash = this.hashString(seed);

    for (let i = 0; i < 3; i++) {
      hash = (hash * 31) % 100;
      nums.push((hash % 59) + 1);
    }

    return nums.sort((a, b) => a - b);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private sanitizeJSON(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }
    return cleaned.trim();
  }
}

export const aiContentService = new AIContentService();
export default aiContentService;
