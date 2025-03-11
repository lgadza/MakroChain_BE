import jwt, { Secret, SignOptions } from "jsonwebtoken";
import logger from "./logger.js";

// Environment variables should be properly validated before use
const JWT_SECRET: Secret = process.env.JWT_SECRET || "your-secret-key"; // Use a strong secret in production
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const JWT_REFRESH_SECRET: Secret =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

interface TokenPayload {
  userId: string;
  role: string;
  [key: string]: any;
}

/**
 * Generates an access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as SignOptions);
  } catch (error) {
    logger.error(
      `Failed to generate access token: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    throw new Error("Failed to generate access token");
  }
};

/**
 * Generates a refresh token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  try {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    } as SignOptions);
  } catch (error) {
    logger.error(
      `Failed to generate refresh token: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    throw new Error("Failed to generate refresh token");
  }
};

/**
 * Verifies the access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    throw error;
  }
};

/**
 * Verifies the refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Refresh token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid refresh token");
    }
    throw error;
  }
};
