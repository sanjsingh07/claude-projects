import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { prisma } from "../config/database";
import { env } from "../config/env";
import logger from "../config/logger";

class NotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo({ accessToken: env.EXPO_ACCESS_TOKEN });
  }

  /**
   * Registers or updates a push token for a user
   */
  async registerToken(userId: string, token: string, platform: string, deviceId?: string): Promise<void> {
    if (!Expo.isExpoPushToken(token)) {
      throw new Error(`Invalid Expo push token: ${token}`);
    }

    await prisma.pushToken.upsert({
      where: {
        userId_token: {
          userId,
          token,
        },
      },
      update: {
        platform,
        deviceId,
        isActive: true,
        lastUsedAt: new Date(),
      },
      create: {
        userId,
        token,
        platform,
        deviceId,
        isActive: true,
      },
    });

    logger.info("Push token registered", { userId, platform });
  }

  /**
   * Deactivates a push token
   */
  async deactivateToken(token: string): Promise<void> {
    await prisma.pushToken.updateMany({
      where: { token },
      data: { isActive: false },
    });
  }

  /**
   * Sends a notification to a specific user across all their active devices
   */
  async sendToUser(
    userId: string,
    payload: { title: string; body: string; data?: any; type: string }
  ): Promise<void> {
    const tokens = await prisma.pushToken.findMany({
      where: { userId, isActive: true },
    });

    if (tokens.length === 0) {
      logger.info("No active push tokens for user", { userId });
      return;
    }

    const messages: ExpoPushMessage[] = [];
    for (const pushToken of tokens) {
      messages.push({
        to: pushToken.token,
        sound: "default",
        title: payload.title,
        body: payload.body,
        data: { ...payload.data, type: payload.type },
      });
    }

    // Save notification records to database
    await prisma.notification.createMany({
      data: tokens.map((t) => ({
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        pushTokenId: t.id,
      })),
    });

    // Chunk and send
    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        logger.error("Error sending push notification chunk", { error });
      }
    }

    // Handle tickets (identify invalid tokens)
    this.handleTickets(tickets, tokens.map(t => t.token));
  }

  /**
   * Analyzes tickets and deactivates invalid tokens
   */
  private handleTickets(tickets: ExpoPushTicket[], tokens: string[]): void {
    tickets.forEach((ticket, index) => {
      if (ticket.status === "error") {
        if (ticket.details?.error === "DeviceNotRegistered") {
          const invalidToken = tokens[index];
          if (invalidToken) {
            logger.info("Deactivating invalid push token", { token: invalidToken });
            this.deactivateToken(invalidToken).catch(err => 
              logger.error("Failed to deactivate token", { err })
            );
          }
        }
      }
    });
  }

  /**
   * System-wide broadcast (use sparingly)
   */
  async broadcast(payload: { title: string; body: string; data?: any; type: string }): Promise<void> {
    // In a real app, this would be a background job that processes users in batches
    const activeTokens = await prisma.pushToken.findMany({
      where: { isActive: true },
    });

    logger.info("Starting broadast", { count: activeTokens.length });

    const messages: ExpoPushMessage[] = activeTokens.map(t => ({
      to: t.token,
      sound: "default",
      title: payload.title,
      body: payload.body,
      data: { ...payload.data, type: payload.type },
    }));

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await this.expo.sendPushNotificationsAsync(chunk).catch(err => 
        logger.error("Broadcast chunk failed", { err })
      );
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
