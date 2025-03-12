import { rateLimit } from "express-rate-limit"; // Correct import with curly braces
import config from "../config/app.config.js"; // Make sure we're importing app.config directly

// Create a rate limiter with values from configuration
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
});

// More restrictive limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.rateLimit.auth || 10, // Use config value with fallback
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts, please try again later.",
});

// Limiter for user creation endpoints
export const createAccountLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: config.rateLimit.createAccount || 5, // Use config value with fallback
  standardHeaders: true,
  legacyHeaders: false,
  message:
    "Too many accounts created from this IP, please try again after 24 hours.",
});
