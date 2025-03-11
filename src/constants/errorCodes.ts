/**
 * Enumeration of error codes for consistent error handling
 */
export enum ErrorCode {
  // Authentication errors (1000-1999)
  INVALID_CREDENTIALS = "AUTH_1001",
  INVALID_TOKEN = "AUTH_1002",
  TOKEN_EXPIRED = "AUTH_1003",
  ACCOUNT_INACTIVE = "AUTH_1004",
  PASSWORD_MISMATCH = "AUTH_1005",
  EMAIL_ALREADY_EXISTS = "AUTH_1006",
  USERNAME_ALREADY_EXISTS = "AUTH_1007",

  // Authorization errors (2000-2999)
  INSUFFICIENT_PERMISSIONS = "AUTHZ_2001",
  RESOURCE_ACCESS_DENIED = "AUTHZ_2002",
  OWNERSHIP_REQUIRED = "AUTHZ_2003",

  // Resource errors (3000-3999)
  RESOURCE_NOT_FOUND = "RES_3001",
  RESOURCE_ALREADY_EXISTS = "RES_3002",
  RESOURCE_INVALID = "RES_3003",

  // Validation errors (4000-4999)
  VALIDATION_ERROR = "VAL_4001",
  INVALID_INPUT = "VAL_4002",
  MISSING_REQUIRED_FIELD = "VAL_4003",

  // Database errors (5000-5999)
  DB_ERROR = "DB_5001",
  DB_CONNECTION_ERROR = "DB_5002",
  DB_QUERY_ERROR = "DB_5003",

  // System errors (9000-9999)
  INTERNAL_SERVER_ERROR = "SYS_9001",
  SERVICE_UNAVAILABLE = "SYS_9002",
  EXTERNAL_SERVICE_ERROR = "SYS_9003",
}

export type ErrorCodeType = `${ErrorCode}`;

/**
 * Maps HTTP status codes to appropriate error codes
 */
export const HTTP_STATUS_TO_ERROR_CODE: Record<number, ErrorCodeType> = {
  400: ErrorCode.INVALID_INPUT,
  401: ErrorCode.INVALID_CREDENTIALS,
  403: ErrorCode.INSUFFICIENT_PERMISSIONS,
  404: ErrorCode.RESOURCE_NOT_FOUND,
  409: ErrorCode.RESOURCE_ALREADY_EXISTS,
  500: ErrorCode.INTERNAL_SERVER_ERROR,
};

/**
 * Maps error codes to default error messages
 */
export const ERROR_CODE_MESSAGES: Record<ErrorCodeType, string> = {
  [ErrorCode.INVALID_CREDENTIALS]: "Invalid credentials provided",
  [ErrorCode.INVALID_TOKEN]: "Invalid authentication token",
  [ErrorCode.TOKEN_EXPIRED]: "Authentication token has expired",
  [ErrorCode.ACCOUNT_INACTIVE]: "Account is inactive",
  [ErrorCode.PASSWORD_MISMATCH]: "Passwords do not match",
  [ErrorCode.EMAIL_ALREADY_EXISTS]: "Email address already in use",
  [ErrorCode.USERNAME_ALREADY_EXISTS]: "Username already in use",
  [ErrorCode.INSUFFICIENT_PERMISSIONS]:
    "Insufficient permissions to perform this action",
  [ErrorCode.RESOURCE_ACCESS_DENIED]: "Access to this resource is denied",
  [ErrorCode.OWNERSHIP_REQUIRED]: "You can only access your own resources",
  [ErrorCode.RESOURCE_NOT_FOUND]: "The requested resource was not found",
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: "This resource already exists",
  [ErrorCode.RESOURCE_INVALID]: "The resource is invalid or malformed",
  [ErrorCode.VALIDATION_ERROR]: "Validation failed for the provided data",
  [ErrorCode.INVALID_INPUT]: "Invalid input data provided",
  [ErrorCode.MISSING_REQUIRED_FIELD]: "Required field is missing",
  [ErrorCode.DB_ERROR]: "Database error occurred",
  [ErrorCode.DB_CONNECTION_ERROR]: "Database connection error",
  [ErrorCode.DB_QUERY_ERROR]: "Database query error",
  [ErrorCode.INTERNAL_SERVER_ERROR]: "Internal server error",
  [ErrorCode.SERVICE_UNAVAILABLE]: "Service is currently unavailable",
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: "Error in external service",
};
