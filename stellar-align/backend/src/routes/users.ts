import { Router } from "express";
import { body } from "express-validator";
import { userController } from "../controllers/userController";
import { authMiddleware } from "../middleware/auth";
import { validateRequest } from "../middleware/validator";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /users/me - Get current user
router.get("/me", userController.getCurrentUser);

// PATCH /users/me - Update current user
router.patch(
  "/me",
  [
    body("displayName").optional().isLength({ min: 1, max: 100 }),
    body("bio").optional().isLength({ max: 500 }),
    body("birthDate").optional().isISO8601(),
    body("birthTime").optional().isString(),
    body("birthLocationName").optional().isString(),
    body("birthLatitude").optional().isFloat({ min: -90, max: 90 }),
    body("birthLongitude").optional().isFloat({ min: -180, max: 180 }),
    body("birthTimezone").optional().isString(),
    validateRequest,
  ],
  userController.updateCurrentUser,
);

// DELETE /users/me - Delete account
router.delete("/me", userController.deleteAccount);

// GET /users/me/settings - Get user settings
router.get("/me/settings", userController.getSettings);

// PATCH /users/me/settings - Update user settings
router.patch("/me/settings", userController.updateSettings);

// POST /users/me/device-token - Register push token
router.post(
  "/me/device-token",
  [
    body("token").notEmpty(),
    body("platform").isIn(["ios", "android", "web"]),
    validateRequest,
  ],
  userController.registerPushToken,
);

// POST /users/me/recalculate-chart - Recalculate natal chart
router.post(
  "/me/recalculate-chart",
  userController.recalculateNatalChart,
);

// GET /users/:id/profile - Get user profile
router.get("/:id/profile", userController.getUserProfile);

export default router;
