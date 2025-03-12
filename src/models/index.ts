import fs from "fs";
import path from "path";
import { Sequelize, DataTypes } from "sequelize";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get dirname in ES modules
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const env = process.env.NODE_ENV || "development";

// Define types for our database interface
interface DbInterface {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
  [key: string]: any; // For model access
}

// Initialize database connection
function initializeSequelize(): Sequelize {
  if (env === "development" || env === "production") {
    // Use environment variables (preferred for security)
    return new Sequelize(
      process.env.DB_NAME || "makrochain",
      process.env.DB_USER || "postgres",
      process.env.DB_PASSWORD || "",
      {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        dialect: "postgres",
        logging: env === "development" ? console.log : false,
      }
    );
  } else if (env === "test") {
    // Test environment might use different settings
    return new Sequelize("sqlite::memory:", { logging: false });
  } else {
    // Fallback - try to load from config file
    try {
      const configPath = path.join(__dirname, "..", "config", "config.json");
      const configData = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const config = configData[env];

      return new Sequelize(
        config.database,
        config.username,
        config.password,
        config
      );
    } catch (error) {
      console.error("Failed to load database config:", error);
      throw new Error("Database configuration not found");
    }
  }
}

// Create and export sequelize instance
export const sequelize = initializeSequelize();

// Initialize models (will be expanded as more models are added)
import UserModel, { initUser } from "./user.model.js";
import { initAddress, initAddressAssociations } from "./address.model.js";
import { initPhone, initPhoneAssociations } from "./phone.model.js";

// Initialize the db object
const db: DbInterface = {
  sequelize,
  Sequelize,
};

// Initialize models
db.User = initUser(sequelize, DataTypes);
db.Address = initAddress(sequelize);
db.Phone = initPhone(sequelize);

// Add this initModels export function that's being imported by dbConnect.ts
export const initModels = (sequelize: Sequelize) => {
  // Initialize models with the provided sequelize instance
  const models = {
    User: initUser(sequelize, DataTypes),
    Address: initAddress(sequelize),
    Phone: initPhone(sequelize),
  };

  // Set up associations
  Object.values(models).forEach((model: any) => {
    if (model.associate) {
      model.associate(models);
    }
  });

  return models;
};

// Set up associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName]?.associate) {
    db[modelName].associate(db);
  }
});

initAddressAssociations();
initPhoneAssociations();

// Utility functions
export const syncModels = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log("Database synchronized successfully");
  } catch (error) {
    console.error("Error synchronizing database:", error);
    throw error;
  }
};

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully");
    return true;
  } catch (error) {
    console.error("Unable to connect to database:", error);
    return false;
  }
};

// Export models for easy access
export const models = {
  User: db.User,
  Address: db.Address,
  Phone: db.Phone,
};

export default db;
