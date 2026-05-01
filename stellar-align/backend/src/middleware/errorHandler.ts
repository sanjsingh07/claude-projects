import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/errors";
import logger from "../config/logger";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Generate request ID for tracking
  const requestId = (req as any).requestId || crypto.randomUUID();

  // Log the error
  logger.error("Request error", {
    requestId,
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
    userId: req.userId,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationErrors = err.errors.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: validationErrors,
      },
      meta: { requestId },
    });
    return;
  }

  // Handle known API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
      meta: { requestId },
    });
    return;
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid authentication token",
      },
      meta: { requestId },
    });
    return;
  }

  if (err.name === "TokenExpiredError") {
    res.status(401).json({
      success: false,
      error: {
        code: "TOKEN_EXPIRED",
        message: "Authentication token has expired",
      },
      meta: { requestId },
    });
    return;
  }

  // Handle Prisma errors
  if (err.name === "PrismaClientKnownRequestError") {
    const prismaError = err as any;

    // Unique constraint violation
    if (prismaError.code === "P2002") {
      res.status(409).json({
        success: false,
        error: {
          code: "ALREADY_EXISTS",
          message: "Resource already exists",
        },
        meta: { requestId },
      });
      return;
    }

    // Record not found
    if (prismaError.code === "P2025") {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Resource not found",
        },
        meta: { requestId },
      });
      return;
    }

    // Foreign key constraint
    if (prismaError.code === "P2003") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_REFERENCE",
          message: "Referenced resource does not exist",
        },
        meta: { requestId },
      });
      return;
    }
  }

  // Default - internal server error
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: isDevelopment ? err.message : "Something went wrong",
      ...(isDevelopment && { stack: err.stack }),
    },
    meta: { requestId },
  });
}

// Not found handler
export function notFoundHandler(req: Request, res: Response): void {
  const requestId = (req as any).requestId || crypto.randomUUID();

  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: { requestId },
  });
}
