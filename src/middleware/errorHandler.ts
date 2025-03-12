import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";
import { HttpError } from "../utils/errorUtils.js";
import {
  ErrorCode,
  ErrorCodeType,
  ERROR_CODE_MESSAGES,
  HTTP_STATUS_TO_ERROR_CODE,
} from "../constants/errorCodes.js";

/**
 * Base application error class
 */
export class AppError extends Error {
  statusCode: number;
  errorCode?: ErrorCodeType;
  details?: unknown;

  constructor(
    message?: string,
    statusCode = 500,
    errorCode?: ErrorCodeType,
    details?: unknown
  ) {
    super(message || "An unexpected error occurred");
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request Error
 */
export class BadRequestError extends AppError {
  constructor(
    message?: string,
    errorCode: ErrorCodeType = ErrorCode.INVALID_INPUT,
    details?: unknown
  ) {
    super(message || ERROR_CODE_MESSAGES[errorCode], 400, errorCode, details);
  }
}

/**
 * 401 Unauthorized Error
 */
export class UnauthorizedError extends AppError {
  constructor(
    message?: string,
    errorCode: ErrorCodeType = ErrorCode.INVALID_CREDENTIALS,
    details?: unknown
  ) {
    super(message || ERROR_CODE_MESSAGES[errorCode], 401, errorCode, details);
  }
}

/**
 * 403 Forbidden Error
 */
export class ForbiddenError extends AppError {
  constructor(
    message?: string,
    errorCode: ErrorCodeType = ErrorCode.INSUFFICIENT_PERMISSIONS,
    details?: unknown
  ) {
    super(message || ERROR_CODE_MESSAGES[errorCode], 403, errorCode, details);
  }
}

/**
 * 404 Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(
    message?: string,
    errorCode: ErrorCodeType = ErrorCode.RESOURCE_NOT_FOUND,
    details?: unknown
  ) {
    super(message || ERROR_CODE_MESSAGES[errorCode], 404, errorCode, details);
  }
}

/**
 * 409 Conflict Error
 */
export class ConflictError extends AppError {
  constructor(
    message?: string,
    errorCode: ErrorCodeType = ErrorCode.RESOURCE_ALREADY_EXISTS,
    details?: unknown
  ) {
    super(message || ERROR_CODE_MESSAGES[errorCode], 409, errorCode, details);
  }
}

/**
 * 422 Validation Error
 */
export class ValidationError extends AppError {
  constructor(
    message?: string,
    errorCode: ErrorCodeType = ErrorCode.VALIDATION_ERROR,
    details?: unknown
  ) {
    super(message || ERROR_CODE_MESSAGES[errorCode], 422, errorCode, details);
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends AppError {
  constructor(
    message?: string,
    errorCode: ErrorCodeType = ErrorCode.INTERNAL_SERVER_ERROR,
    details?: unknown
  ) {
    super(message || ERROR_CODE_MESSAGES[errorCode], 500, errorCode, details);
  }
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error | AppError | HttpError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // Default error response
  let statusCode = 500;
  let message = "Internal Server Error";
  let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
  let details: unknown;

  // Handle HttpError instance (from createError utility)
  if (err instanceof HttpError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode =
      (err.code as unknown as ErrorCode) ||
      (HTTP_STATUS_TO_ERROR_CODE[statusCode] as ErrorCode);
    details = err.details;
  }
  // If it's our custom AppError, use its properties
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode =
      (err.errorCode as ErrorCode) ||
      (HTTP_STATUS_TO_ERROR_CODE[statusCode] as ErrorCode) ||
      ErrorCode.INTERNAL_SERVER_ERROR;
    details = err.details;
  } else if (err instanceof Error) {
    // For standard errors, use the message but keep status 500
    message = err.message || message;
  }

  // Log the error with appropriate level based on status code
  if (statusCode >= 500) {
    logger.error(
      `Error ${statusCode}: ${message}${err.stack ? `\n${err.stack}` : ""}`
    );
  } else if (statusCode >= 400) {
    logger.warn(`Error ${statusCode}: ${message}`);
  }

  // Prepare response object
  const errorResponse = {
    success: false,
    message,
    error: {
      code: errorCode,
      ...(details ? { details } : {}),
    },
    // Only include stack in development mode
    ...(process.env.NODE_ENV === "development" && err.stack
      ? { stack: err.stack }
      : {}),
  };

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * Catch-all for unhandled routes
 */
export const notFound = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new NotFoundError(`Not Found - ${req.originalUrl}`);
  next(error);
};
