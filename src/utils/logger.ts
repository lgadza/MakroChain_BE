import winston from "winston";
import config from "../config/index.js";

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

export const setupLogger = () => {
  // Safe access to config with defaults
  const logLevel = config.logging?.level || "info";
  const logFormat = (config.logging as any)?.format || "json";

  // Pretty console format for development
  const devConsoleFormat = combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    printf(
      ({
        timestamp,
        level,
        message,
        service = "makrochain-backend",
        ...meta
      }) => {
        const metaStr =
          Object.keys(meta).length && meta.stack !== undefined
            ? `\n${meta.stack}`
            : Object.keys(meta).length
            ? `\n${JSON.stringify(meta, null, 2)}`
            : "";

        return `${timestamp} ${level.padEnd(
          18
        )} [${service}] ${message}${metaStr}`;
      }
    )
  );

  // JSON format for production/structured logging
  const jsonFormat = combine(timestamp(), errors({ stack: true }), json());

  // Choose format based on environment and config
  const selectedFormat =
    config.environment !== "production" && logFormat !== "json"
      ? devConsoleFormat
      : jsonFormat;

  return winston.createLogger({
    level: logLevel,
    format: selectedFormat,
    defaultMeta: { service: "makrochain-backend" },
    transports: [
      new winston.transports.Console({
        format: combine(
          colorize({ all: false, level: true, message: false }),
          selectedFormat
        ),
      }),
    ],
  });
};

// Create and export the logger
const logger = setupLogger();
export default logger;
