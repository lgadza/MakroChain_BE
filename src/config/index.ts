import dotenv from "dotenv";
dotenv.config();

// Configuration settings
const config = {
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || "development",

  // Database config
  database: {
    name: process.env.DB_NAME || "makrochain",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    dialect: "postgres",
    ssl: process.env.DB_SSL === "true",
    sync: process.env.DB_SYNC === "true" || false,
    forceSync: process.env.DB_FORCE_SYNC === "true" || false,
  },

  // JWT config
  jwt: {
    secret: process.env.JWT_SECRET || "secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },

  // Rate limiting configuration
  rateLimit: {
    standard: parseInt(process.env.RATE_LIMIT_STANDARD || "100"),
    auth: parseInt(process.env.RATE_LIMIT_AUTH || "10"),
    createAccount: parseInt(process.env.RATE_LIMIT_CREATE_ACCOUNT || "5"),
  },

  // CORS configuration
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : "*",

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
};

// Make sure to export the config as default
export default config;
