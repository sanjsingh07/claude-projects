import { Request, Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service";
import { prisma } from "../config/database";
import { ApiError, NotFoundError } from "../utils/errors";

class NotificationController {
  /**
   * Registers a push token for the current user
   */
  async registerToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, platform, deviceId } = req.body;
      const userId = req.userId!;

      if (!token || !platform) {
        throw new ApiError(400, "Token and platform are required", "MISSING_FIELDS");
      }

      await notificationService.registerToken(userId, token, platform, deviceId);

      res.json({
        success: true,
        message: "Push token registered successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivates a push token
   */
  async unregisterToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        throw new ApiError(400, "Token is required", "MISSING_FIELDS");
      }

      await notificationService.deactivateToken(token);

      res.json({
        success: true,
        message: "Push token unregistered successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gets notification history for the current user
   */
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { sentAt: "desc" },
        skip,
        take: limit,
      });

      const total = await prisma.notification.count({
        where: { userId },
      });

      res.json({
        success: true,
        data: notifications,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marks a notification as read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        throw new NotFoundError("Notification not found");
      }

      await prisma.notification.update({
        where: { id },
        data: { openedAt: new Date() },
      });

      res.json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
export default notificationController;
