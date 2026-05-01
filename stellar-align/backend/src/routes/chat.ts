import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { chatController } from "../controllers/chatController";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /chat/history - Get chat history
router.get("/history", chatController.getHistory);

// POST /chat/message - Send a message
router.post("/message", chatController.sendMessage);

// DELETE /chat/session - Clear chat history
router.delete("/session", chatController.clearHistory);

export default router;
