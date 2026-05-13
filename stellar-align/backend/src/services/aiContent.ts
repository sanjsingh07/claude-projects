import logger from "../config/logger";
import { cache } from "../config/redis";
import { DateTime } from "luxon";
import { llmProvider } from "./llmProvider";
import {
  ASPECT_SYMBOLS,
  capitalize,
  formatOrb,
  PLANET_SYMBOLS,
} from "./transits/transitConstants";

export type HoroscopeCategory = "self" | "work" | "love" | "social";

export interface DailyHoroscopeContent {
  self: string;
  work: string;
  love: string;
  social: string;
  energyScore: number;
  moodAspects: {
    emotion: string;
    career: string;
    love: string;
    health: string;
  };
  primaryTransit: {
    title: string;
    badge: string;
    planets: string;
    body: string;
    source: string;
  };
  aspects: {
    symbol: string;
    name: string;
    description: string;
    quality: string;
  }[];
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
    const cacheKey = [
      "horoscope-content",
      "v2",
      natalChart.userId,
      DateTime.fromJSDate(date).toISODate(),
      natalChart.zodiacType || "TROPICAL",
      natalChart.ayanamsa || "none",
    ].join(":");
    const cached = await cache.get<DailyHoroscopeContent>(cacheKey);
    if (cached) return cached;

    if (!llmProvider.isAvailable) {
      logger.warn("No LLM provider available, using rule-based fallback");
      return this.generateRuleBasedHoroscope(natalChart, moonSign, moonPhase, activeTransits);
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
        { maxTokens: 4000, purpose: "horoscope", mappingId: natalChart.userId },
      );

      let parsed;
      try {
        const sanitized = this.sanitizeJSON(response.text);
        parsed = JSON.parse(sanitized);
      } catch (e: any) {
        logger.error("Failed to parse AI horoscope JSON", {
          error: e.message,
          text_length: response.text?.length,
          preview: response.text?.substring(0, 200) + "...",
          end_preview: response.text?.substring(response.text?.length - 200),
        });
        throw e;
      }

      const normalized = this.normalizeDailyContent(parsed, natalChart, moonSign, moonPhase, activeTransits);

      await cache.set(cacheKey, normalized, 86400);
      return normalized;
    } catch (error: any) {
      logger.error("AI horoscope generation failed", {
        error: error.message,
        stack: error.stack,
        provider: llmProvider.name,
      });
      return this.generateRuleBasedHoroscope(natalChart, moonSign, moonPhase, activeTransits);
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
        { maxTokens: 1500, purpose: "horoscope", mappingId: natalChart.userId },
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
        { maxTokens: 1500, purpose: "horoscope", mappingId: natalChart.userId },
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
    const systemType = isVedic ? "Vedic (Sidereal)" : "Western (Tropical)";

    // 1. NATAL DATA SUMMARY
    const natalPos = natalChart.planetaryPositions as any;
    const natalSummary = Object.entries(natalPos)
      .filter(([_, pos]: any) => pos.sign)
      .map(([planet, pos]: any) => `${capitalize(planet)}: ${pos.sign} ${pos.degree ?? pos.signDegree}°${pos.minute ?? 0}'${pos.house ? ` (House ${pos.house})` : ""}`)
      .join("\n");

    const natalAspects = Array.isArray(natalChart.aspects)
      ? natalChart.aspects
          .slice(0, 10)
          .map((a: any) => `- ${capitalize(a.planet1)} ${String(a.type || a.aspectType).toLowerCase()} ${capitalize(a.planet2)} (${formatOrb(Number(a.orb || 0))} orb)`)
          .join("\n")
      : "No natal aspects supplied.";

    // 2. VEDIC-SPECIFIC DATA (D1, D9, Nakshatras)
    let vedicSection = "";
    if (isVedic) {
      const divisionalSummary = (vedicData.divisionalCharts || [])
        .map((dc: any) => {
          const positions = (dc.planetaryPositions || [])
            .map((p: any) => `  - ${capitalize(p.planet)}: ${p.sign} ${Math.floor(p.degree)}°${Math.round((p.degree % 1) * 60)}' (House ${p.house})`)
            .join("\n");
          return `\n${dc.chartType} CHART (Ascendant: ${dc.ascendant} ${dc.ascendantDegree.toFixed(1)}°):\n${positions}`;
        })
        .join("\n");

      vedicSection = `
VEDIC ASTROLOGY DEPTH:
- Birth Nakshatra: ${vedicData.nakshatra} (Lord: ${vedicData.nakshatraLord})
- Pada: ${vedicData.nakshatraPada}
- Ayanamsa: ${vedicData.ayanamsa || "Lahiri"}
${divisionalSummary}
`;
    }

    // 3. TRANSIT CATEGORIZATION
    const personalTransits = activeTransits.filter(t => t.eventKind === "natal_aspect");
    const mundaneTransits = activeTransits.filter(t => t.eventKind !== "natal_aspect");

    const personalSummary = this.formatTransitSummary(personalTransits);
    const mundaneSummary = this.formatTransitSummary(mundaneTransits);

    return `You are Stellar Align's resident expert astrologer. Generate a deeply personalized daily horoscope.
System: ${systemType}

USER'S NATAL CHART (BASE):
${natalSummary}
- Sun/Moon/Rising: ${natalChart.sunSign} / ${natalChart.moonSign} / ${natalChart.risingSign}
- Natal Aspects:
${natalAspects}
${vedicSection}

CURRENT CELESTIAL WEATHER (${date.toDateString()}):
- Moon Sign: ${moonSign}
- Moon Phase: ${moonPhase}

PERSONAL TRANSITS (Transit-to-Natal contacts):
${personalSummary}

MUNDANE TRANSITS (Collective/Sky aspects & Ingresses):
${mundaneSummary}

GOAL:
Produce a reading that feels "astrological" but reads like high-end psychological/emotional editorial. 

INSTRUCTIONS:
1. SPEAK IN SECOND PERSON ("You are...", "Your heart...").
2. USE THE NATAL CHART AS THE ANCHOR. The reading must be derived from the user’s natal chart and current transits.
3. TONE: Intimate, specific, emotionally precise, grounded, and readable. No mystical fluff, no cliché filler, no robotic structure.
4. NO DISCLAIMERS. No "astrology is for entertainment" or "this is just a guide".
5. PRIMARY TRANSIT: Select the most significant transit today. This MUST feel like a direct statement about the user's chart.
6. Do not use generic sign horoscopes. Every sentence should be anchored in the natal placements, houses, natal aspects, current Moon, ingress, retrograde, or active transit data above.
7. Avoid repeated sentence structures across self, work, love, and social.

Structure as valid JSON:
{
  "self": "...",
  "work": "...",
  "love": "...",
  "social": "...",
  "energyScore": 0-100,
  "moodAspects": { 
    "emotion": "Single punchy word (e.g. steady)", 
    "career": "Single punchy word (e.g. rising)", 
    "love": "Single punchy word (e.g. tense)", 
    "health": "Single punchy word (e.g. clear)" 
  },
  "primaryTransit": {
    "title": "Poetic/Technical Title",
    "badge": "major|minor|shadow",
    "planets": "Technical string (e.g. ♂ ☌ ♄)",
    "body": "Deep 3-4 sentence interpretation. Use <em>...</em> for emphasis.",
    "source": "Context line"
  },
  "aspects": [
    { "symbol": "...", "name": "...", "description": "Punchy 1-sentence interpretation", "quality": "..." }
  ]
}

Respond with ONLY the JSON object.`;
  }

  private generateRuleBasedHoroscope(
    natalChart: any,
    moonSign: string,
    moonPhase: string,
    activeTransits: any[] = []
  ): DailyHoroscopeContent {
    const sunSign = capitalize(natalChart.sunSign);
    const risingSign = natalChart.risingSign ? capitalize(natalChart.risingSign) : "your rising sign";
    const moonInSign = capitalize(moonSign);

    const topTransit = activeTransits.length > 0 
      ? [...activeTransits].sort((a, b) => this.transitImportance(a) - this.transitImportance(b))[0]
      : null;

    const primaryTransit: any = topTransit ? {
      title: topTransit.title || `${capitalize(topTransit.planet1)} ${String(topTransit.type).toLowerCase()} your ${capitalize(topTransit.planet2)}`,
      badge: this.normalizeBadge(topTransit.type),
      planets: topTransit.symbols || `${PLANET_SYMBOLS[String(topTransit.planet1).toUpperCase()] || topTransit.planet1} ${ASPECT_SYMBOLS[String(topTransit.aspectType || topTransit.type).toUpperCase()] || "↔"} ${PLANET_SYMBOLS[String(topTransit.planet2).toUpperCase()] || topTransit.planet2}`,
      body: `${capitalize(topTransit.planet1)} is pressing on your natal ${capitalize(topTransit.planet2)}. <em>The exact point matters:</em> this is not a general mood, but a specific pressure on your chart. Notice where the day asks for a more exact response from your ${capitalize(topTransit.planet2)} energy.`,
      source: `Today · 1 of ${activeTransits.length} active transits`
    } : {
      title: `Moon in ${moonInSign}`,
      badge: "minor",
      planets: `Moon in ${moonInSign}`,
      body: `The ${moonPhase} pulls attention toward your ${sunSign} Sun and ${risingSign} way of meeting the world. <em>Keep the day close to the body:</em> small choices will tell you more than broad declarations.`,
      source: "Today's positions"
    };

    return this.normalizeDailyContent({
      self: `The ${moonPhase} in ${moonInSign} makes your inner weather harder to ignore. Your ${sunSign} Sun wants coherence, while ${risingSign} shows you where the outside world is asking for a cleaner response.`,
      work: `Move through obligations with fewer explanations and sharper proof. The chart favors one solid repair over three dramatic promises.`,
      love: `Affection needs precision today. Say the thing you actually mean, especially if your first instinct is to smooth it over.`,
      social: `Choose the room where your nervous system can stay honest. Your presence lands better when it is not edited for approval.`,
      energyScore: 70,
      moodAspects: {
        emotion: activeTransits.length > 3 ? "intense" : "steady",
        career: "focused",
        love: "warm",
        health: "stable"
      },
      primaryTransit,
      aspects: activeTransits.slice(0, 4).map(t => this.transitToAspectEntry(t))
    }, natalChart, moonSign, moonPhase, activeTransits);
  }

  private formatTransitSummary(activeTransits: any[]): string {
    if (!activeTransits.length) return "- No exact transit contacts found for this local day; use Moon sign/phase and natal chart as the anchor.";

    return activeTransits
      .slice(0, 12)
      .map((t, index) => {
        if (t.title && t.orb?.formatted) {
          return `- ${index + 1}. ${t.title}; symbols ${t.symbols || "n/a"}; orb ${t.orb.formatted}; type ${t.type}; impact ${t.impact?.level || "moderate"}`;
        }
        return `- ${index + 1}. ${capitalize(t.planet1)} ${String(t.type || t.aspectType).toLowerCase()} natal ${capitalize(t.planet2)}; orb ${formatOrb(Number(t.orb || 0))}; exact ${Boolean(t.exact)}`;
      })
      .join("\n");
  }

  private normalizeDailyContent(
    raw: any,
    natalChart: any,
    moonSign: string,
    moonPhase: string,
    activeTransits: any[],
  ): DailyHoroscopeContent {
    const fallbackTransit = activeTransits[0];
    const primaryTransit = raw?.primaryTransit || {};

    return {
      self: this.requiredText(raw?.self, `Your ${capitalize(natalChart.sunSign)} Sun needs an honest read on the room today.`),
      work: this.requiredText(raw?.work, "Do less performing and more finishing; one clean decision carries the day."),
      love: this.requiredText(raw?.love, "Keep affection specific. The unsaid thing is louder than usual."),
      social: this.requiredText(raw?.social, "Stay close to people who let your timing be real."),
      energyScore: this.clampScore(raw?.energyScore),
      moodAspects: {
        emotion: this.shortStatus(raw?.moodAspects?.emotion, "steady"),
        career: this.shortStatus(raw?.moodAspects?.career, "focused"),
        love: this.shortStatus(raw?.moodAspects?.love, "warm"),
        health: this.shortStatus(raw?.moodAspects?.health, "stable"),
      },
      primaryTransit: {
        title: this.requiredText(primaryTransit.title, fallbackTransit?.title || `Moon in ${capitalize(moonSign)}`),
        badge: this.normalizeBadge(primaryTransit.badge || fallbackTransit?.type),
        planets: this.requiredText(primaryTransit.planets, fallbackTransit?.symbols || `Moon in ${capitalize(moonSign)}`),
        body: this.requiredText(primaryTransit.body, fallbackTransit?.description || `The ${moonPhase} gives your natal chart a quieter signal today. <em>Notice what repeats</em>; that is where the sky is being specific.`),
        source: this.requiredText(primaryTransit.source, activeTransits.length ? `Today · 1 of ${activeTransits.length} active transits` : "Today's positions"),
      },
      aspects: Array.isArray(raw?.aspects) && raw.aspects.length
        ? raw.aspects.slice(0, 4).map((a: any) => ({
            symbol: this.requiredText(a.symbol, "✶"),
            name: this.requiredText(a.name, "Lunar emphasis"),
            description: this.requiredText(a.description, "A small adjustment changes the tone."),
            quality: this.normalizeQuality(a.quality),
          }))
        : activeTransits.slice(0, 4).map(t => this.transitToAspectEntry(t)),
    };
  }

  private transitToAspectEntry(t: any) {
    const quality = this.normalizeQuality(t.quality || t.aspectType || t.type);
    return {
      symbol: t.symbol || ASPECT_SYMBOLS[String(t.aspectType || t.type).toUpperCase()] || "✶",
      name: t.name || t.title || `${capitalize(t.planet1)} ${quality} ${capitalize(t.planet2)}`,
      description: t.description ? String(t.description).replace(/<[^>]*>/g, "").split(".")[0] : `${capitalize(t.planet1 || "Moon")} makes the chart speak more plainly.`,
      quality,
    };
  }

  private normalizeBadge(value: unknown): "major" | "minor" | "shadow" {
    const v = String(value || "").toLowerCase();
    if (v === "major" || v === "minor" || v === "shadow") return v;
    return "minor";
  }

  private normalizeQuality(value: unknown): string {
    const v = String(value || "").toLowerCase();
    const allowed = ["opposition", "trine", "square", "conjunction", "sextile", "quincunx", "quintile", "shadow"];
    return allowed.includes(v) ? v : "shadow";
  }

  private requiredText(value: unknown, fallback: string): string {
    const text = typeof value === "string" ? value.trim() : "";
    return text.length ? text : fallback;
  }

  private shortStatus(value: unknown, fallback: string): string {
    return this.requiredText(value, fallback).split(/\s+/)[0].toLowerCase();
  }

  private clampScore(value: unknown): number {
    const n = Number(value);
    if (!Number.isFinite(n)) return 70;
    return Math.max(0, Math.min(100, Math.round(n)));
  }

  private transitOrbValue(t: any): number {
    if (typeof t?.orb?.value === "number") return t.orb.value;
    if (typeof t?.orb === "number") return t.orb;
    return 99;
  }

  private transitImportance(t: any): number {
    const kindWeight = t?.eventKind === "natal_aspect" ? 0 : t?.eventKind === "sky_aspect" ? 1.5 : 3;
    const typeWeight = t?.type === "major" ? 0 : t?.type === "minor" ? 0.75 : 1.25;
    return kindWeight + typeWeight + this.transitOrbValue(t);
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
