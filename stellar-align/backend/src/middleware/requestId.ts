import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

// Extend Express Request to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Use existing request ID from header or generate new one
  req.requestId = req.get("X-Request-ID") || uuidv4();
  req.startTime = Date.now();

  // Add request ID to response headers
  res.setHeader("X-Request-ID", req.requestId);

  next();
}
