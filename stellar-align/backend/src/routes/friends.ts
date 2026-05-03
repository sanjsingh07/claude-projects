import { Router, Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middleware/auth";
import { prisma } from "../config/database";
import { validateRequest } from "../middleware/validator";
import { ApiError } from "../utils/errors";
import { FriendshipStatus } from "@prisma/client";

const router = Router();

router.use(authMiddleware);

// GET /friends - List friends
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ requesterId: req.userId }, { addresseeId: req.userId }],
      },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            natalChart: { select: { sunSign: true } },
          },
        },
        addressee: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            natalChart: { select: { sunSign: true } },
          },
        },
      },
    });

    const friends = friendships.map((f: any) => {
      const friend = f.requesterId === req.userId ? f.addressee : f.requester;
      return {
        friendshipId: f.id,
        ...friend,
        sunSign: friend.natalChart?.sunSign,
        compatibilityScore: undefined, // Would calculate
      };
    });

    res.json({ success: true, data: friends });
  } catch (error) {
    next(error);
  }
});

// GET /friends/requests - Get pending requests
router.get("/requests", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.friendship.findMany({
      where: {
        addresseeId: req.userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        requester: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            natalChart: { select: { sunSign: true } },
          },
        },
      },
    });

    const formatted = requests.map((r: any) => ({
      id: r.id,
      from: {
        ...r.requester,
        sunSign: r.requester.natalChart?.sunSign,
      },
      sentAt: r.createdAt,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
});

// POST /friends/request - Send friend request
router.post(
  "/request",
  [body("userId").isUUID(), validateRequest],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.body;

      if (userId === req.userId) {
        throw new ApiError(400, "Cannot friend yourself", "INVALID_REQUEST");
      }

      // Check if friendship already exists
      const existing = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: req.userId, addresseeId: userId },
            { requesterId: userId, addresseeId: req.userId },
          ],
        },
      });

      if (existing) {
        if (existing.status === FriendshipStatus.ACCEPTED) {
          throw new ApiError(409, "Already friends", "ALREADY_FRIENDS");
        }
        if (existing.status === FriendshipStatus.PENDING) {
          throw new ApiError(409, "Request already pending", "REQUEST_PENDING");
        }
      }

      const friendship = await prisma.friendship.create({
        data: {
          requesterId: req.userId!,
          addresseeId: userId,
          status: FriendshipStatus.PENDING,
        },
      });

      res.status(201).json({
        success: true,
        data: { requestId: friendship.id, status: FriendshipStatus.PENDING },
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /friends/accept - Accept friend request
router.post(
  "/accept",
  [body("requestId").isUUID(), validateRequest],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { requestId } = req.body;

      const friendship = await prisma.friendship.update({
        where: {
          id: requestId,
          addresseeId: req.userId,
          status: FriendshipStatus.PENDING,
        },
        data: {
          status: FriendshipStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      // Generate compatibility report in background
      // compatibilityService.calculateBetweenUsers(friendship.requesterId, req.userId!);

      res.json({
        success: true,
        data: { friendshipId: friendship.id, status: FriendshipStatus.ACCEPTED },
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /friends/reject - Reject friend request
router.post(
  "/reject",
  [body("requestId").isUUID(), validateRequest],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { requestId } = req.body;

      await prisma.friendship.delete({
        where: {
          id: requestId,
          addresseeId: req.userId,
          status: FriendshipStatus.PENDING,
        },
      });

      res.json({ success: true, message: "Request rejected" });
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /friends/:id - Remove friend
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.friendship.delete({
      where: {
        id: req.params.id,
        OR: [{ requesterId: req.userId }, { addresseeId: req.userId }],
        status: FriendshipStatus.ACCEPTED,
      },
    });

    res.json({ success: true, message: "Friend removed" });
  } catch (error) {
    next(error);
  }
});


export default router;
