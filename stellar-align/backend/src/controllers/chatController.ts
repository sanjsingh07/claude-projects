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

Your responses should be:
- Insightful, compassionate, and empowering
- Based on astrological principles but accessible to beginners
- Personalized to the user's specific chart when relevant
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

      // Get user's natal chart for context
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

      // Build context from natal chart
      let chartContext = '';
      if (user.profileCompleted && user.natalChart) {
        chartContext = `
User's Natal Chart Context:
- Sun Sign: ${user.natalChart.sunSign}
- Moon Sign: ${user.natalChart.moonSign}
- Rising Sign: ${user.natalChart.risingSign}
`;
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
