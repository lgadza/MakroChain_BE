import { rateLimit } from "express-rate-limit";
import config from "../config/index.js";

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimit?.standard || 100, // limit each IP based on config or default to 100
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",
});

// More restrictive limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.rateLimit?.auth || 10, // 10 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts, please try again later.",
});

// Limiter for user creation endpoints
export const createAccountLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: config.rateLimit?.createAccount || 5, // 5 accounts per day
  standardHeaders: true,
  legacyHeaders: false,
  message:
    "Too many accounts created from this IP, please try again after 24 hours.",
});
