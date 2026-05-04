import { Router } from "express";
import { transitController } from "../controllers/transitController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", transitController.getTransits);

export default router;
