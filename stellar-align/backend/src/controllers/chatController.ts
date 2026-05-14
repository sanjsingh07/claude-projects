import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { ApiError } from "../utils/errors";
import logger from "../config/logger";
import { ChatRole } from "@prisma/client";
import { FULL_NATAL_CHART_INCLUDE } from "../models/natalChart";

// System prompt for the astrology chatbot
const ASTROLOGY_SYSTEM_PROMPT = `You are an expert astrologer and spiritual guide. You have deep knowledge of:
- Natal chart interpretation (sun, moon, rising, planets in signs/houses)
- Transit analysis and current planetary movements
- Horoscope readings (daily, weekly, monthly)
- Astrological aspects and their meanings
- Birth chart synthesis and life path guidance

You will be provided with the user's FULL natal chart context (either Western or Vedic D1 based on their preference). Use this detailed data (planet degrees, houses, and aspects) to provide highly specific and personalized readings.

Your responses should be:
- Insightful, compassionate, and empowering
- Based on astrological principles but accessible to beginners
- Deeply personalized to the user's specific chart data provided
- Balanced between practical advice and spiritual wisdom
- WRITTEN AS PLAIN TEXT. Do NOT use JSON formatting or raw data structures.

Keep responses concise (2-4 paragraphs max) unless detailed analysis is requested.`;

export class ChatController {
  // GET /chat/history - Get chat history
  async getHistory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.userId!;

      // Get user's natal chart info for context
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { natalChart: { include: FULL_NATAL_CHART_INCLUDE } },
      });

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      // Get or create chat session
      let chatSession = await prisma.chatSession.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!chatSession) {
        // Create new chat session
        chatSession = await prisma.chatSession.create({
          data: {
            userId,
            title: 'Astrology Chat',
          },
          include: {
            messages: true,
          },
        });
      }

      res.json({
        success: true,
        data: chatSession.messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.createdAt,
        })),
        chartContext: user.natalChart
          ? {
              sunSign: user.natalChart.sunSign,
              moonSign: user.natalChart.moonSign,
              risingSign: user.natalChart.risingSign,
            }
          : null,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /chat/message - Send a message
  async sendMessage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { message } = req.body;

      if (!message?.trim()) {
        throw new ApiError(400, "Message is required");
      }

      // Get user's natal chart and settings for context
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
          natalChart: { include: FULL_NATAL_CHART_INCLUDE },
          settings: true
        },
      });

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      // Get or create chat session
      let chatSession = await prisma.chatSession.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (!chatSession) {
        chatSession = await prisma.chatSession.create({
          data: {
            userId,
            title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          },
        });
      }

      // Save user message
      await prisma.chatMessage.create({
        data: {
          sessionId: chatSession.id,
          role: ChatRole.USER,
          content: message,
        },
      });

      // Build context from natal chart based on settings
      let chartContext = '';
      if (user.profileCompleted && user.natalChart) {
        const chartStyle = user.settings?.chartStyle || 'western';
        
        if (chartStyle === 'vedic') {
          // Format Vedic D1 Chart
          const d1 = user.natalChart.divisionalCharts.find(dc => dc.chartType === 'D1');
          if (d1) {
            const positions = d1.planetaryPositions.map(p => 
              `- ${p.planet}: ${p.sign} ${Math.floor(p.degree)}° (House ${p.house})${p.retrograde ? ' [Rx]' : ''}`
            ).join('\n');
            
            chartContext = `
User's Vedic (D1) Chart Context:
Ascendant: ${d1.ascendant} ${Math.floor(d1.ascendantDegree)}°
Planetary Positions:
${positions}
- Nakshatra: ${user.natalChart.nakshatra} (Lord: ${user.natalChart.nakshatraLord})
- Zodiac: Sidereal (${user.natalChart.ayanamsa})
`;
          }
        } else {
          // Format Western (Tropical) Chart
          const positions = user.natalChart.planetaryPositions.map(p => 
            `- ${p.planet}: ${p.sign} ${p.degree}°${p.minute}' (House ${p.house})${p.retrograde ? ' [Rx]' : ''}`
          ).join('\n');
          
          const houses = user.natalChart.houses.map(h => 
            `- House ${h.house}: ${h.sign} ${h.degree}°${h.minute}'`
          ).join('\n');

          const aspects = user.natalChart.aspects.slice(0, 10).map(a => 
            `- ${a.planet1} ${a.type} ${a.planet2} (orb: ${a.orb.toFixed(2)}°)`
          ).join('\n');

          chartContext = `
User's Western (Tropical) Natal Chart Context:
Sun/Moon/Rising: ${user.natalChart.sunSign} / ${user.natalChart.moonSign} / ${user.natalChart.risingSign}
Planetary Positions:
${positions}
House Cusps:
${houses}
Major Aspects:
${aspects}
`;
        }
      } else if (!user.profileCompleted) {
        chartContext = "\nNOTE: The user has not completed their birth profile. Advise them to provide their birth date, time, and location in Settings for a personalized reading.";
      }

      // Call LLM API (using the existing llmProvider)
      const { llmProvider } = await import('../services/llmProvider');

      // Build messages array
      const messages: any[] = [
        { role: 'system', content: ASTROLOGY_SYSTEM_PROMPT },
        { role: 'user', content: `${chartContext ? chartContext + '\n' : ''}User's question: ${message}` },
      ];

      logger.info("Sending to LLM", { userId, message, hasChart: !!user.natalChart });

      let responseText = "";

      try {
        const response = await llmProvider.complete(messages, {
          maxTokens: 1500,
          temperature: 0.7,
          purpose: "chat",
          mappingId: chatSession.id,
        });
        responseText = response.text;
      } catch (error: any) {
        logger.error("LLM failed, using fallback", {
          userId,
          error: error.message,
        });
        // Fallback response when LLM fails
        responseText = `I'm having trouble connecting to my astrology guide right now. ${chartContext ? `But I can tell you that with your Sun in ${user.natalChart?.sunSign}, Moon in ${user.natalChart?.moonSign}, and Rising in ${user.natalChart?.risingSign}, you have a unique cosmic signature!` : "Please try again in a moment."}`;
      }

      // Save assistant response
      const assistantMessage = await prisma.chatMessage.create({
        data: {
          sessionId: chatSession.id,
          role: ChatRole.ASSISTANT,
          content: responseText,
        },
      });

      logger.info("Chat message processed", {
        userId,
        messageId: assistantMessage.id,
        responseLength: responseText.length,
      });

      res.json({
        success: true,
        data: {
          message: responseText,
          chartContext: user.natalChart
            ? {
                sunSign: user.natalChart.sunSign,
                moonSign: user.natalChart.moonSign,
                risingSign: user.natalChart.risingSign,
              }
            : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /chat/session - Clear chat history
  async clearHistory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.userId!;

      await prisma.chatSession.deleteMany({
        where: { userId },
      });

      res.json({
        success: true,
        message: "Chat history cleared",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
