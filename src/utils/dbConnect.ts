import { Sequelize } from "sequelize";
import dotenv from "dotenv";
// Using relative imports instead of path aliases
import { initModels } from "../models/index.js";
import { setupLogger } from "./logger.js";

dotenv.config();
const logger = setupLogger();

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DATABASE_URL ||
    "postgres://postgres:E1a2g3le@localhost:5432/makrochain",
  {
    logging: (msg) => logger.debug(msg),
    dialect: "postgres",
    dialectOptions: {
      ssl:
        process.env.NODE_ENV === "production"
          ? {
              require: true,
              rejectUnauthorized: false,
            }
          : false,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info("Database connection has been established successfully.");

    // Initialize models
    initModels(sequelize);

    return sequelize;
  } catch (error) {
    logger.error("Unable to connect to the database:", error);
    throw error;
  }
};

export default sequelize;
