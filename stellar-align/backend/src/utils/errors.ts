// Custom error classes

export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    code: string = "INTERNAL_ERROR",
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, code = "VALIDATION_ERROR") {
    super(400, message, code);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = "Resource not found", code = "NOT_FOUND") {
    super(404, message, code);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "Unauthorized", code = "UNAUTHORIZED") {
    super(401, message, code);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = "Forbidden", code = "FORBIDDEN") {
    super(403, message, code);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, code = "CONFLICT") {
    super(409, message, code);
  }
}

// Error codes for common scenarios
export const ErrorCodes = {
  // Auth errors
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  USER_EXISTS: "USER_EXISTS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  PASSWORD_TOO_WEAK: "PASSWORD_TOO_WEAK",

  // Validation errors
  INVALID_DATE: "INVALID_DATE",
  INVALID_BIRTH_DATA: "INVALID_BIRTH_DATA",
  INVALID_COORDINATES: "INVALID_COORDINATES",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Resource errors
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  NOT_IMPLEMENTED: "NOT_IMPLEMENTED",

  // Rate limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // Calculation errors
  CHART_CALCULATION_FAILED: "CHART_CALCULATION_FAILED",
  TRANSIT_CALCULATION_FAILED: "TRANSIT_CALCULATION_FAILED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
