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
