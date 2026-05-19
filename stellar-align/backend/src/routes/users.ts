import { Router } from "express";
import { body } from "express-validator";
import { userController } from "../controllers/userController";
import { authMiddleware } from "../middleware/auth";
import { validateRequest } from "../middleware/validator";
import { SettingsController } from "../controllers/SettingsController";

const router = Router();
const settingsController = new SettingsController();

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
    body("isPremium").optional().isBoolean(),
    validateRequest,
  ],
  userController.updateCurrentUser,
);

// PATCH /users/profile - Alias for update birth data as requested
router.patch(
  "/profile",
  [
    body("birthDate").optional().isISO8601(),
    body("birthTime").optional().isString(),
    body("birthLocationName").optional().isString(),
    body("birthLatitude").optional().isFloat({ min: -90, max: 90 }),
    body("birthLongitude").optional().isFloat({ min: -180, max: 180 }),
    body("birthTimezone").optional().isString(),
    body("isPremium").optional().isBoolean(),
    validateRequest,
  ],
  userController.updateCurrentUser,
);

// DELETE /users/me - Delete account
router.delete("/me", userController.deleteAccount);

// GET /users/settings - Get user settings
router.get("/settings", (req, res, next) => settingsController.getSettings(req, res, next));

// PATCH /users/settings - Update user settings
router.patch("/settings", (req, res, next) => settingsController.updateSettings(req, res, next));

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
