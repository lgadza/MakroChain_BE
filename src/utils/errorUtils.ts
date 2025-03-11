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
import { ErrorCodeType } from "../constants/errorCodes.js";

/**
 * Custom error class with HTTP status code
 */
export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a new HttpError with the specified status code and message
 */
export const createError = (statusCode: number, message: string): HttpError => {
  return new HttpError(statusCode, message);
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
