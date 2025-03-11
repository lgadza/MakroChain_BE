import { Request, Response, NextFunction } from "express";
import { ErrorCodes, ErrorCodeType } from "../constants/errorCodes.js";
import logger from "../utils/logger.js";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errorCode?: number;
  details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    errorCodeType?: ErrorCodeType,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    if (errorCodeType) {
      this.errorCode = ErrorCodes[errorCodeType].code;
      // Use custom message if provided, otherwise use default error code message
      if (message === ErrorCodes[errorCodeType].message) {
        this.message = ErrorCodes[errorCodeType].message;
      }
    }

    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(
    message: string = "Bad request",
    errorCodeType?: ErrorCodeType,
    details?: unknown
  ) {
    super(message, 400, errorCodeType, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message: string = "Unauthorized",
    errorCodeType: ErrorCodeType = "UNAUTHORIZED",
    details?: unknown
  ) {
    super(message, 401, errorCodeType, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message: string = "Forbidden",
    errorCodeType?: ErrorCodeType,
    details?: unknown
  ) {
    super(message, 403, errorCodeType, details);
  }
}

export class NotFoundError extends AppError {
  constructor(
    message: string = "Not found",
    errorCodeType: ErrorCodeType = "RESOURCE_NOT_FOUND",
    details?: unknown
  ) {
    super(message, 404, errorCodeType, details);
  }
}

export class ConflictError extends AppError {
  constructor(
    message: string = "Conflict",
    errorCodeType: ErrorCodeType = "RESOURCE_CONFLICT",
    details?: unknown
  ) {
    super(message, 409, errorCodeType, details);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string = "Validation failed",
    errorCodeType: ErrorCodeType = "VALIDATION_ERROR",
    details?: unknown
  ) {
    super(message, 422, errorCodeType, details);
  }
}

export class InternalServerError extends AppError {
  constructor(
    message: string = "Internal server error",
    errorCodeType: ErrorCodeType = "INTERNAL_SERVER_ERROR",
    details?: unknown
  ) {
    super(message, 500, errorCodeType, details);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  const statusCode = "statusCode" in err ? err.statusCode : 500;
  const message = err.message || "Something went wrong";
  const errorCode = "errorCode" in err ? err.errorCode : undefined;
  const details = "details" in err ? err.details : undefined;

  // Log different levels based on status code
  const logMethod = statusCode >= 500 ? logger.error : logger.warn;

  logMethod(`[${statusCode}] ${message}`, {
    errorCode,
    error: err.stack,
    path: req.path,
    method: req.method,
    details,
    userId: req.headers["user-id"] || "anonymous",
    requestId: req.headers["x-request-id"] || "unknown",
  });

  // Format response based on environment
  const response = {
    status: "error",
    statusCode,
    message,
    ...(errorCode && { errorCode }),
    ...(process.env.NODE_ENV === "development" && details ? { details } : {}),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};
