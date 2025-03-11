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
  },

  // JWT config
  jwt: {
    secret: process.env.JWT_SECRET || "secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || "100"), // max requests per windowMs
  },
};

// Make sure to export the config as default
export default config;
