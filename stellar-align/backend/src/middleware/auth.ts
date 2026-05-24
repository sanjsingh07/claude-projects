import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { JwtPayload } from "../types/api";
import { prisma } from "../config/database";
import { cache } from "../config/redis";

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const cacheKey = `auth_user:${payload.userId}`;

    let user: {
      id: string;
      email: string;
      isActive: boolean;
      isDeleted: boolean;
    } | null = null;

    try {
      user = await cache.get<typeof user>(cacheKey);
    } catch {
      user = null;
    }

    if (!user) {
      // Verify user exists in DB to prevent issues with orphaned tokens from deleted users.
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, isActive: true, isDeleted: true },
      });

      if (user && user.isActive && !user.isDeleted) {
        cache.set(cacheKey, user, 300).catch(() => undefined);
      }
    }

    if (!user || !user.isActive || user.isDeleted) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User not found or inactive",
        },
      });
      return;
    }

    req.userId = payload.userId;
    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          code: "TOKEN_EXPIRED",
          message: "Token has expired",
        },
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid token",
      },
    });
  }
}

// Optional auth - sets user if token present but doesn't require it
export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, isActive: true, isDeleted: true },
    });

    if (user && user.isActive && !user.isDeleted) {
      req.userId = payload.userId;
      req.user = {
        id: user.id,
        email: user.email,
      };
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
}

// Factory for checking specific permissions
export function requireAuth(): (
  req: Request,
  res: Response,
  next: NextFunction,
) => void {
  return authMiddleware as any;
}
