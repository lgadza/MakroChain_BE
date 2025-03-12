import { Request, Response } from "express";
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
  ForbiddenError,
} from "../middleware/errorHandler.js";
import { ErrorCode, ErrorCodeType } from "../constants/errorCodes.js";

/**
 * Custom HTTP error class that extends Error
 */
export class HttpError extends Error {
  statusCode: number;
  code?: ErrorCodeType;
  details?: any;

  constructor(
    statusCode: number,
    message: string,
    errorCode?: ErrorCodeType,
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = errorCode;
    this.details = details;

    // This is for capturing proper stack trace in NodeJS
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a new HttpError
 * @param statusCode - HTTP status code
 * @param message - Error message
 * @param errorCode - Optional error code from ErrorCode enum
 * @param details - Optional error details
 * @returns HttpError instance
 */
export const createError = (
  statusCode: number,
  message: string,
  errorCode?: ErrorCodeType,
  details?: any
): HttpError => {
  return new HttpError(statusCode, message, errorCode, details);
};

/**
 * Create a not found error
 * @param message - Error message
 * @returns HttpError instance
 */
export const createNotFoundError = (
  message = "Resource not found"
): HttpError => {
  return createError(404, message, ErrorCode.RESOURCE_NOT_FOUND);
};

/**
 * Create an unauthorized error
 * @param message - Error message
 * @returns HttpError instance
 */
export const createUnauthorizedError = (
  message = "Unauthorized access"
): HttpError => {
  return createError(401, message, ErrorCode.INVALID_CREDENTIALS);
};

/**
 * Create a forbidden error
 * @param message - Error message
 * @returns HttpError instance
 */
export const createForbiddenError = (
  message = "Access forbidden"
): HttpError => {
  return createError(403, message, ErrorCode.INSUFFICIENT_PERMISSIONS);
};

/**
 * Create a validation error
 * @param message - Error message
 * @param details - Error details
 * @returns HttpError instance
 */
export const createValidationError = (
  message = "Validation failed",
  details?: any
): HttpError => {
  return createError(400, message, ErrorCode.VALIDATION_ERROR, details);
};

/**
 * Define common error types
 */
export const ErrorTypes = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER: 500,
};

/**
 * Create standard error responses
 */
export const Errors = {
  badRequest: (message = "Bad Request") =>
    createError(ErrorTypes.BAD_REQUEST, message),
  unauthorized: (message = "Unauthorized") =>
    createError(ErrorTypes.UNAUTHORIZED, message),
  forbidden: (message = "Forbidden") =>
    createError(ErrorTypes.FORBIDDEN, message),
  notFound: (message = "Not Found") =>
    createError(ErrorTypes.NOT_FOUND, message),
  conflict: (message = "Conflict") => createError(ErrorTypes.CONFLICT, message),
  internal: (message = "Internal Server Error") =>
    createError(ErrorTypes.INTERNAL_SERVER, message),
};

/**
 * Wraps async controller functions to catch errors and forward them to the error handler
 */
export const asyncHandler = (fn: Function) => {
  return async (req: Request, res: Response, next: Function) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Creates a standardized error response
 */
export const createErrorResponse = (error: AppError | Error) => {
  if (error instanceof AppError) {
    return {
      status: "error",
      statusCode: error.statusCode,
      message: error.message,
      ...(error.errorCode && { errorCode: error.errorCode }),
      ...(error.details && typeof error.details === "object"
        ? { details: error.details }
        : {}),
    };
  }

  return {
    status: "error",
    statusCode: 500,
    message: error.message || "Internal server error",
  };
};

/**
 * Helper function to create common errors
 */
export const ErrorFactory = {
  badRequest: (
    message?: string,
    errorCode?: ErrorCodeType,
    details?: unknown
  ) => new BadRequestError(message, errorCode, details),

  unauthorized: (
    message?: string,
    errorCode?: ErrorCodeType,
    details?: unknown
  ) => new UnauthorizedError(message, errorCode as ErrorCodeType, details),

  forbidden: (message?: string, errorCode?: ErrorCodeType, details?: unknown) =>
    new ForbiddenError(message, errorCode, details),

  notFound: (message?: string, errorCode?: ErrorCodeType, details?: unknown) =>
    new NotFoundError(message, errorCode as ErrorCodeType, details),

  conflict: (message?: string, errorCode?: ErrorCodeType, details?: unknown) =>
    new ConflictError(message, errorCode as ErrorCodeType, details),

  validation: (
    message?: string,
    errorCode?: ErrorCodeType,
    details?: unknown
  ) => new ValidationError(message, errorCode as ErrorCodeType, details),

  internal: (message?: string, errorCode?: ErrorCodeType, details?: unknown) =>
    new InternalServerError(message, errorCode as ErrorCodeType, details),
};
