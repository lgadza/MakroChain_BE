import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import config from "./index.js";

dotenv.config();

// Create Sequelize instance using configuration from config/index.js
const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    dialect: "postgres", // Explicitly set dialect rather than using 'as any'
    port: config.database.port,
    logging: config.environment === "development" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: config.database.ssl
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : false,
    },
  }
);

// Add a function to test the database connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
};

export default sequelize;
