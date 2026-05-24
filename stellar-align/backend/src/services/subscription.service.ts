import axios from "axios";
import { prisma } from "../config/database";
import { env } from "../config/env";
import logger from "../config/logger";
import { ApiError, NotFoundError } from "../utils/errors";

type RevenueCatSubscriberResponse = {
  subscriber?: {
    entitlements?: Record<
      string,
      {
        expires_date?: string | null;
        purchase_date?: string | null;
        product_identifier?: string;
      }
    >;
  };
};

const REVENUECAT_API_URL = "https://api.revenuecat.com/v1/subscribers";

function parseRevenueCatDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export class SubscriptionService {
  async syncRevenueCatSubscriber(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isPremium: true,
        manualPremiumOverride: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!env.REVENUECAT_REST_API_KEY) {
      throw new ApiError(
        503,
        "RevenueCat server API key is not configured",
        "SUBSCRIPTION_SYNC_UNAVAILABLE",
      );
    }

    let subscriberData: RevenueCatSubscriberResponse = {};

    try {
      const response = await axios.get<RevenueCatSubscriberResponse>(
        `${REVENUECAT_API_URL}/${encodeURIComponent(userId)}`,
        {
          headers: {
            Authorization: `Bearer ${env.REVENUECAT_REST_API_KEY}`,
          },
          timeout: 10000,
        },
      );
      subscriberData = response.data;
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 404) {
        throw error;
      }
    }

    const entitlement =
      subscriberData.subscriber?.entitlements?.[env.REVENUECAT_ENTITLEMENT_ID];
    const expiresAt = parseRevenueCatDate(entitlement?.expires_date);
    const hasActiveRevenueCatPremium = Boolean(
      entitlement && (!expiresAt || expiresAt.getTime() > Date.now()),
    );
    const isPremium = user.manualPremiumOverride || hasActiveRevenueCatPremium;
    const subscriptionExpiresAt = hasActiveRevenueCatPremium ? expiresAt : null;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium,
        subscriptionExpiresAt,
      },
    });

    logger.info("Subscription status synced", {
      userId,
      hasActiveRevenueCatPremium,
      manualPremiumOverride: user.manualPremiumOverride,
      isPremium,
      subscriptionExpiresAt,
    });

    return {
      isPremium: updatedUser.isPremium,
      subscriptionExpiresAt: updatedUser.subscriptionExpiresAt,
      manualPremiumOverride: updatedUser.manualPremiumOverride,
    };
  }
}

export const subscriptionService = new SubscriptionService();
