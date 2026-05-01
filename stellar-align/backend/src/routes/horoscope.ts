import { Router } from "express";
import { body } from "express-validator";
import { horoscopeController } from "../controllers/horoscopeController";
import { authMiddleware } from "../middleware/auth";
import { validateRequest } from "../middleware/validator";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /horoscope/today - Get today's horoscope
router.get("/today", horoscopeController.getToday);

// GET /horoscope/history - Get horoscope history
router.get("/history", horoscopeController.getHistory);

// GET /horoscope/insights - Get horoscope insights/stats
router.get("/insights", horoscopeController.getInsights);

// GET /horoscope/:date - Get horoscope for specific date
router.get("/:date", horoscopeController.getByDate);

// POST /horoscope/:id/bookmark - Toggle bookmark
router.post(
  "/:id/bookmark",
  [body("bookmarked").isBoolean(), validateRequest],
  horoscopeController.toggleBookmark,
);

// POST /horoscope/:id/share - Share horoscope
router.post("/:id/share", horoscopeController.shareHoroscope);

export default router;
