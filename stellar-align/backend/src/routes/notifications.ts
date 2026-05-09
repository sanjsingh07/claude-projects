import { Router } from "express";
import { notificationController } from "../controllers/notificationController";
import { authMiddleware } from "../middleware/auth";
import { validateRequest } from "../middleware/validator";
import { body } from "express-validator";

const router = Router();

router.use(authMiddleware);

// POST /notifications/tokens - Register a push token
router.post(
  "/tokens",
  [
    body("token").notEmpty().withMessage("Token is required"),
    body("platform").isIn(["ios", "android", "web"]).withMessage("Invalid platform"),
    validateRequest,
  ],
  notificationController.registerToken
);

// DELETE /notifications/tokens - Unregister a push token
router.delete(
  "/tokens",
  [
    body("token").notEmpty().withMessage("Token is required"),
    validateRequest,
  ],
  notificationController.unregisterToken
);

// GET /notifications - Get notification history
router.get("/", notificationController.getHistory);

// PATCH /notifications/:id/read - Mark notification as read
router.patch("/:id/read", notificationController.markAsRead);

export default router;
