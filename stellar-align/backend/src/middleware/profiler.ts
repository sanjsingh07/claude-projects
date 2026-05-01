import { Request, Response, NextFunction } from "express";
import { cache } from "../config/redis";

interface ProfileEntry {
  method: string;
  path: string;
  duration: number;
  timestamp: Date;
  statusCode: number;
  userId?: string;
}

export function profilerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on("finish", async () => {
    const duration = Date.now() - start;

    const profile: ProfileEntry = {
      method: req.method,
      path: req.path,
      duration,
      timestamp: new Date(),
      statusCode: res.statusCode,
      userId: req.userId,
    };

    // Log slow requests (over 500ms)
    if (duration > 500) {
      const { timestamp, ...rest } = profile;
      console.warn("Slow request detected", rest);
    }

    // Store metrics for aggregated stats
    const key = `metrics:endpoint:${req.method}:${req.route?.path || req.path}`;
    try {
      await cache.set(
        key,
        { duration, statusCode: res.statusCode },
        60, // short TTL for real-time metrics
      );
    } catch {
      // Ignore cache errors for profiling
    }
  });

  next();
}
