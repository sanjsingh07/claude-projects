import { Request, Response, NextFunction } from "express";
import { validationResult, Result, ValidationError } from "express-validator";
import { ApiError } from "../utils/errors";

export function validateRequest(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const errors: Result<ValidationError> = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.type === "field" ? err.path : err.type,
      message: err.msg,
    }));

    const error = new ApiError(400, "Validation failed", "VALIDATION_ERROR");
    (error as any).details = errorMessages;
    next(error);
    return;
  }

  next();
}
