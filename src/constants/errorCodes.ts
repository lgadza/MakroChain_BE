export const ErrorCodes = {
  // Authentication errors (1xxx)
  INVALID_CREDENTIALS: { code: 1001, message: "Invalid email or password" },
  UNAUTHORIZED: { code: 1002, message: "Unauthorized access" },
  TOKEN_EXPIRED: { code: 1003, message: "Authentication token has expired" },
  TOKEN_INVALID: { code: 1004, message: "Invalid authentication token" },

  // Validation errors (2xxx)
  VALIDATION_ERROR: { code: 2001, message: "Validation failed" },
  INVALID_INPUT: { code: 2002, message: "Invalid input data" },
  MISSING_REQUIRED_FIELD: { code: 2003, message: "Required field is missing" },

  // Resource errors (3xxx)
  RESOURCE_NOT_FOUND: { code: 3001, message: "Resource not found" },
  RESOURCE_ALREADY_EXISTS: { code: 3002, message: "Resource already exists" },
  RESOURCE_CONFLICT: { code: 3003, message: "Resource conflict" },

  // Database errors (4xxx)
  DATABASE_ERROR: { code: 4001, message: "Database error occurred" },
  QUERY_FAILED: { code: 4002, message: "Database query failed" },

  // Server errors (5xxx)
  INTERNAL_SERVER_ERROR: { code: 5001, message: "Internal server error" },
  SERVICE_UNAVAILABLE: {
    code: 5002,
    message: "Service temporarily unavailable",
  },

  // API errors (6xxx)
  RATE_LIMIT_EXCEEDED: { code: 6001, message: "Rate limit exceeded" },
  API_ERROR: { code: 6002, message: "API error" },
};

export type ErrorCodeType = keyof typeof ErrorCodes;
