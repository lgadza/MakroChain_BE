import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.util.js";
import logger from "../utils/logger.js";
import { createError } from "../utils/errorUtils.js";

/**
 * Extended Express Request interface with user data
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
    [key: string]: any;
  };
}

/**
 * Authentication middleware to validate JWT tokens
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next(createError(401, "Authentication required"));
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      next(createError(401, "Invalid authentication token"));
      return;
    }

    try {
      // Verify the token and extract user data
      const decodedToken = verifyAccessToken(token);

      // Attach user info to the request object
      req.user = {
        ...decodedToken,
        userId: decodedToken.userId,
      };

      next();
    } catch (error) {
      if (error instanceof Error && error.message === "Token expired") {
        next(createError(401, "Token expired"));
      } else {
        next(createError(401, "Invalid authentication token"));
      }
    }
  } catch (error) {
    logger.error(
      `Authentication error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    next(createError(500, "Authentication process failed"));
  }
};

/**
 * Optional authentication that doesn't require a token but uses it if present
 */
export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      next();
      return;
    }

    try {
      const decodedToken = verifyAccessToken(token);
      req.user = {
        ...decodedToken,
      };
    } catch (error) {
      // Silently fail and continue without authentication
    }

    next();
  } catch (error) {
    next();
  }
};
