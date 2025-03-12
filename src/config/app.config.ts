import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const env = process.env.NODE_ENV || "development";

const config = {
  env,
  isProduction: env === "production",
  isDevelopment: env === "development",
  server: {
    port: parseInt(process.env.PORT || "3000", 10),
    host: process.env.HOST || "localhost",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "default_secret_key",
    expiresIn: process.env.JWT_EXPIRATION || "1d",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || "7d",
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "15000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
    auth: parseInt(process.env.RATE_LIMIT_AUTH || "10"),
    createAccount: parseInt(process.env.RATE_LIMIT_CREATE_ACCOUNT || "5"),
  },
  // Add CORS configuration
  cors: {
    origins: process.env.CORS_ORIGINS?.split(",") || "*",
  },
};

export default config;
