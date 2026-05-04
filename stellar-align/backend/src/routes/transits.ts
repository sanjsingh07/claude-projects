import { Router } from "express";
import { query } from "express-validator";
import { transitController } from "../controllers/transitController";
import { authMiddleware } from "../middleware/auth";
import { validateRequest } from "../middleware/validator";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  [
    query("period")
      .optional()
      .isIn(["week", "month", "year"])
      .withMessage("Period must be week, month, or year"),
    validateRequest,
  ],
  transitController.getTransits,
);

export default router;
