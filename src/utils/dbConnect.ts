import { Sequelize, DataTypes } from "sequelize";
import dotenv from "dotenv";
import { initModels } from "../models/index.js";
import { setupLogger } from "./logger.js";
import { initUser } from "../models/user.model.js";

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

// Initialize all models
export const initializeModels = () => {
  // Initialize User model
  const User = initUser(sequelize, DataTypes);

  // Add other model initializations here as your app grows

  return {
    User,
    // Add other models here
  };
};

// Connect to database and sync all models
export const connectDB = async () => {
  try {
    // Initialize all models
    initializeModels();

    // Sync all models with the database
    // In development, you might want to use { force: true } to recreate tables
    // In production, use { alter: true } for safer migrations or don't use any parameter
    await sequelize.sync();

    logger.info("Database synchronized successfully");
    return true;
  } catch (error) {
    logger.error("Unable to connect to the database or sync models:", {
      error,
    });
    throw error;
  }
};

export default sequelize;
