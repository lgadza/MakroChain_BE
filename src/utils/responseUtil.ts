import { Response } from "express";

/**
 * Standard API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code?: string | number;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    [key: string]: any;
  };
}

/**
 * Send a successful response
 * @param res Express response object
 * @param data The data to return
 * @param message Success message
 * @param statusCode HTTP status code (default: 200)
 * @param meta Additional metadata
 */
export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message: string = "Success",
  statusCode: number = 200,
  meta?: ApiResponse["meta"]
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param res Express response object
 * @param message Error message
 * @param statusCode HTTP status code (default: 500)
 * @param errorCode Custom error code
 * @param errorDetails Additional error details
 */
export const sendError = (
  res: Response,
  message: string = "Internal Server Error",
  statusCode: number = 500,
  errorCode?: string | number,
  errorDetails?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error: {
      code: errorCode,
    },
  };

  if (errorDetails) {
    response.error!.details = errorDetails;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a not found response
 * @param res Express response object
 * @param message Error message
 */
export const sendNotFound = (
  res: Response,
  message: string = "Resource not found"
): Response => {
  return sendError(res, message, 404, "NOT_FOUND");
};

/**
 * Send a bad request response
 * @param res Express response object
 * @param message Error message
 * @param errorDetails Additional error details
 */
export const sendBadRequest = (
  res: Response,
  message: string = "Bad request",
  errorDetails?: any
): Response => {
  return sendError(res, message, 400, "BAD_REQUEST", errorDetails);
};

/**
 * Send an unauthorized response
 * @param res Express response object
 * @param message Error message
 */
export const sendUnauthorized = (
  res: Response,
  message: string = "Unauthorized"
): Response => {
  return sendError(res, message, 401, "UNAUTHORIZED");
};

/**
 * Send a forbidden response
 * @param res Express response object
 * @param message Error message
 */
export const sendForbidden = (
  res: Response,
  message: string = "Forbidden"
): Response => {
  return sendError(res, message, 403, "FORBIDDEN");
};
