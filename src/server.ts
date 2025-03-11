import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { rateLimit } from "express-rate-limit";
import listEndpoints from "express-list-endpoints";
import Table from "cli-table3";
import chalk from "chalk";
import { errorHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";
import { setupLogger } from "./utils/logger.js";
import { connectDB } from "./utils/dbConnect.js";
import swaggerDocs from "./utils/swagger.js";
import { applyHelmetMiddleware } from "./middleware/helmet.middleware.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import config from "./config/index.js";

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
applyHelmetMiddleware(app);
app.use(cors());
app.use(express.json());
app.use(morgan("combined"));
app.use(limiter);

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
    // Connect to database and initialize models
    await connectDB();
    logger.info("Database connection established and models synchronized");

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(
        `API Documentation available at http://localhost:${PORT}/api-docs`
      );

      // Log all registered endpoints using proper table formatting
      try {
        const endpoints = listEndpoints(app);
        const totalRoutes = endpoints.reduce(
          (count, route) => count + route.methods.length,
          0
        );

        // Define the table with column headers
        const table = new Table({
          head: [
            chalk.bold("METHOD"),
            chalk.bold("PATH"),
            chalk.bold("MIDDLEWARE"),
          ],
          colWidths: [15, 50, 50],
          style: {
            head: ["cyan"],
            border: ["gray"],
          },
        });

        // Add rows to the table
        endpoints.forEach((route) => {
          const path = route.path;
          const middleware = route.middlewares.join(", ") || "none";

          route.methods.forEach((method) => {
            // Color the method based on type
            let coloredMethod;
            switch (method) {
              case "GET":
                coloredMethod = chalk.green(method);
                break;
              case "POST":
                coloredMethod = chalk.yellow(method);
                break;
              case "PUT":
                coloredMethod = chalk.blue(method);
                break;
              case "DELETE":
                coloredMethod = chalk.red(method);
                break;
              default:
                coloredMethod = chalk.gray(method);
            }

            table.push([coloredMethod, path, middleware]);
          });
        });

        // Log the table with a header
        logger.info(`API Routes (${totalRoutes} total routes):`);
        console.log(table.toString());
      } catch (error) {
        logger.error("Failed to generate endpoints table", { error });
      }
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
