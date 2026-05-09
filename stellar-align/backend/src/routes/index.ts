import { Router } from "express";
import authRoutes from "./auth";
import userRoutes from "./users";
import horoscopeRoutes from "./horoscope";
import chartRoutes from "./chart";
import friendRoutes from "./friends";
import compatibilityRoutes from "./compatibility";
import chatRoutes from "./chat";
import vedicChartRoutes from "./vedicChart";
import transitRoutes from "./transits";
import utilsRoutes from "./utils";

const router = Router();

// Health check
router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/horoscope", horoscopeRoutes);
router.use("/chart", chartRoutes);
router.use("/friends", friendRoutes);
router.use("/compatibility", compatibilityRoutes);
router.use("/chat", chatRoutes);
router.use("/vedic", vedicChartRoutes);
router.use("/transits", transitRoutes);
router.use("/utils", utilsRoutes);

export default router;
