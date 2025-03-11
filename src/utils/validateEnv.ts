import { cleanEnv, str, port, url } from "envalid";
import logger from "./logger.js";

/**
 * Validates required environment variables and provides defaults for optional ones
 */
export function validateEnv() {
  try {
    return cleanEnv(process.env, {
      PORT: port({ default: 3000 }),
      DB_USER: str(),
      DB_HOST: str(),
      DB_NAME: str(),
      DB_PASSWORD: str(),
      DB_PORT: port({ default: 5432 }),
      DATABASE_URL: url({ desc: "Full database connection URL" }),
      JWT_SECRET: str(),
      NODE_ENV: str({
        choices: ["development", "test", "production"],
        default: "development",
      }),
    });
  } catch (error) {
    logger.error("Environment validation failed", { error });
    throw new Error("Invalid environment configuration. Check your .env file.");
  }
}

export default validateEnv;
