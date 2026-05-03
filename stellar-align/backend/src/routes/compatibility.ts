import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import { prisma } from "../config/database";
import { astrologyService } from "../services/astrology";
import { cache } from "../config/redis";
import logger from "../config/logger";
import { FriendshipStatus } from "@prisma/client";

const router = Router();

router.use(authMiddleware);

// GET /compatibility/:userId - Get compatibility report with another user
router.get("/:userId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId1 = req.userId!;
    const userId2 = req.params.userId;

    // Check cache first
    const cacheKey = `compatibility:${[userId1, userId2].sort().join(":")}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    // Check friendship status
    const friendship = await prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [
          { requesterId: userId1, addresseeId: userId2 },
          { requesterId: userId2, addresseeId: userId1 },
        ],
      },
    });

    if (!friendship) {
      // Get other user's privacy settings
      const otherUser = await prisma.user.findUnique({
        where: { id: userId2 },
        select: { privacySettings: true },
      });

      const settings = otherUser?.privacySettings as any;
      if (settings?.allowCompatibility === false) {
        res.status(403).json({
          success: false,
          error: {
            code: "PRIVACY_RESTRICTED",
            message: "User has disabled compatibility calculations",
          },
        });
        return;
      }
    }

    // Check for existing report
    let report = await prisma.compatibilityReport.findFirst({
      where: {
        OR: [
          { user1Id: userId1, user2Id: userId2 },
          { user1Id: userId2, user2Id: userId1 },
        ],
      },
    });

    if (!report) {
      // Get both users' charts
      const [user1, user2] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId1 },
          include: { natalChart: true },
        }),
        prisma.user.findUnique({
          where: { id: userId2 },
          include: { natalChart: true },
        }),
      ]);

      if (!user1?.natalChart || !user2?.natalChart) {
        res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Natal chart required for both users",
          },
        });
        return;
      }

      // Calculate compatibility
      const compatData = await astrologyService.calculateCompatibility(
        user1.natalChart as any,
        user2.natalChart as any,
      );

      // Create report
      report = await prisma.compatibilityReport.create({
        data: {
          user1Id: userId1,
          user2Id: userId2,
          overallScore: compatData.score,
          scores: {
            emotional: Math.round(compatData.score * 0.9 + Math.random() * 20),
            intellectual: Math.round(
              compatData.score * 0.85 + Math.random() * 25,
            ),
            physical: Math.round(compatData.score * 0.8 + Math.random() * 30),
            spiritual: Math.round(compatData.score * 0.7 + Math.random() * 40),
          },
          synastryAspects: compatData.aspects,
          interpretation: compatData.interpretation,
          strengths: ["Complementary energies", "Mutual understanding"],
          challenges: ["Different communication styles"],
          advice: "Practice active listening to deepen your connection.",
        },
      });

      logger.info("Compatibility report created", {
        reportId: report.id,
        user1: userId1,
        user2: userId2,
      });
    }

    // Cache for 1 hour
    await cache.set(cacheKey, report, 3600);

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

// POST /compatibility/:userId/refresh - Refresh compatibility calculation
router.post("/:userId/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId1 = req.userId!;
    const userId2 = req.params.userId;

    // Delete existing report
    await prisma.compatibilityReport.deleteMany({
      where: {
        OR: [
          { user1Id: userId1, user2Id: userId2 },
          { user1Id: userId2, user2Id: userId1 },
        ],
      },
    });

    // Clear cache
    const cacheKey = `compatibility:${[userId1, userId2].sort().join(":")}`;
    await cache.delete(cacheKey);

    res.json({
      success: true,
      message: "Compatibility report cleared - recalculate to see new results",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
