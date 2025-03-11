import { Sequelize } from "sequelize";
import logger from "./logger.js";

/**
 * Tests the database connection with the provided configuration
 * @returns Promise<boolean> - True if connection successful, false otherwise
 */
export async function testDatabaseConnection(
  sequelize: Sequelize
): Promise<boolean> {
  try {
    await sequelize.authenticate();
    logger.info("Database connection has been established successfully.");
    return true;
  } catch (error) {
    logger.error("Unable to connect to the database:", {
      error,
      dbHost: process.env.DB_HOST,
      dbName: process.env.DB_NAME,
      dbUser: process.env.DB_USER,
      // Don't log the actual password
      usingEnvPassword: !!process.env.DB_PASSWORD,
    });

    // Provide helpful debugging information
    logger.info("Database connection troubleshooting tips:", {
      tips: [
        "Verify your PostgreSQL server is running",
        "Check that the username and password are correct",
        "Ensure the database exists and is accessible",
        "Confirm the host and port are correct",
        "Try connecting with a PostgreSQL client like pgAdmin to test credentials",
      ],
    });

    return false;
  }
}

export default testDatabaseConnection;
