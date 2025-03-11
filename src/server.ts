import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { rateLimit } from "express-rate-limit";
import { errorHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";
import { setupLogger } from "./utils/logger.js";
import { connectDB } from "./utils/dbConnect.js";
import swaggerDocs from "./utils/swagger.js";
import { logEndpoints } from "./utils/endpointLogger.js";
import { applyHelmetMiddleware } from "./middleware/helmet.middleware.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import config from "./config/index.js"; // Fixed import path with .js extension

const app = express();
const logger = setupLogger();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
applyHelmetMiddleware(app); // Apply helmet middleware
app.use(cors());
app.use(express.json());
app.use(morgan("combined"));
app.use(limiter);
// app.use(apiLimiter); // Apply the rate limiting middleware to all requests

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use("/api", routes);

// Error handling
app.use(errorHandler);

const PORT = config.port || 3000;

// Function to initialize server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    logger.info("Database connection established");

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(
        `API Documentation available at http://localhost:${PORT}/api-docs`
      );

      // Log all registered endpoints as a table
      logEndpoints(app, logger);
    });

    // For graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM signal received: closing HTTP server");
      server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    logger.error(`Server initialization failed: ${(error as Error).message}`);
    process.exit(1);
  }
};

// Start the server
const server = startServer();

export default server;
