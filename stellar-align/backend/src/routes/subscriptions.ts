import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { subscriptionService } from "../services/subscription.service";
import { env } from "../config/env";
import logger from "../config/logger";
import { NotFoundError } from "../utils/errors";

const router = Router();

router.post("/sync", authMiddleware, async (req, res, next) => {
  try {
    const status = await subscriptionService.syncRevenueCatSubscriber(req.userId!);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/revenuecat/webhook", async (req, res, next) => {
  try {
    if (env.REVENUECAT_WEBHOOK_AUTH_TOKEN) {
      const authorization = req.get("authorization");
      const expectedBearer = `Bearer ${env.REVENUECAT_WEBHOOK_AUTH_TOKEN}`;

      if (
        authorization !== env.REVENUECAT_WEBHOOK_AUTH_TOKEN &&
        authorization !== expectedBearer
      ) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED_WEBHOOK",
            message: "Invalid RevenueCat webhook authorization",
          },
        });
        return;
      }
    }

    const event = req.body?.event;
    const eventType = event?.type;
    const userId = event?.app_user_id || event?.original_app_user_id;

    if (eventType === "TEST") {
      res.json({ success: true });
      return;
    }

    if (!userId) {
      logger.warn("RevenueCat webhook missing app user id", { eventType });
      res.json({ success: true });
      return;
    }

    try {
      await subscriptionService.syncRevenueCatSubscriber(userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        logger.warn("RevenueCat webhook user not found", { eventType, userId });
        res.json({ success: true });
        return;
      }

      throw error;
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
