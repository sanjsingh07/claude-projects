import { Router } from "express";
import { body } from "express-validator";
import { authController } from "../controllers/authController";
import { validateRequest } from "../middleware/validator";

const router = Router();

// POST /auth/register
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("birthDate").isISO8601().withMessage("Birth date is required"),
    body("birthTimezone").notEmpty(),
    validateRequest,
  ],
  authController.register,
);

// POST /auth/login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
    validateRequest,
  ],
  authController.login,
);

// POST /auth/refresh
router.post("/refresh", authController.refreshToken);

// POST /auth/logout
router.post("/logout", authController.logout);

// POST /auth/forgot-password
router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail(), validateRequest],
  authController.forgotPassword,
);

// POST /auth/reset-password
router.post(
  "/reset-password",
  [
    body("token").notEmpty(),
    body("password").isLength({ min: 8 }),
    validateRequest,
  ],
  authController.resetPassword,
);

// POST /auth/change-password
router.post(
  "/change-password",
  [
    body("currentPassword").notEmpty(),
    body("newPassword").isLength({ min: 8 }),
    validateRequest,
  ],
  authController.changePassword,
);

// Social login (client-side OAuth flow)
router.post(
  "/social",
  [
    body("provider").isIn(["google", "apple"]).withMessage("Invalid provider"),
    body("idToken").notEmpty().withMessage("idToken is required"),
    validateRequest,
  ],
  authController.socialLogin,
);

export default router;
