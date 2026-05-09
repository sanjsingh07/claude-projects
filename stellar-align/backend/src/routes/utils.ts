import { Router, Request, Response } from "express";
import { getTimezoneFromCoords } from "../utils/timezone";
import { authMiddleware } from "../middleware/auth";

const router = Router();

/**
 * GET /utils/timezone?lat=...&lon=...
 * Resolves a timezone from coordinates.
 * This can be used by the frontend as a fallback or replacement for third-party APIs.
 */
router.get("/timezone", (req: Request, res: Response) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    res.status(400).json({
      success: false,
      error: { code: "MISSING_PARAMS", message: "lat and lon are required" },
    });
    return;
  }

  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lon as string);

  if (isNaN(latitude) || isNaN(longitude)) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_PARAMS", message: "lat and lon must be numbers" },
    });
    return;
  }

  const timezone = getTimezoneFromCoords(latitude, longitude);

  res.json({
    success: true,
    data: { timezone },
  });
});

export default router;
