import { Request, Response } from "express";
import { sequelize } from "../models/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get version from package.json without direct import
const getPackageVersion = (): string => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version || '1.0.0';
  } catch (error) {
    console.error("Failed to read package.json version:", error);
    return '1.0.0'; // Default version if file can't be read
  }
};

export const healthCheck = async (req: Request, res: Response) => {
  try {
    // Check database connection
    await sequelize.authenticate();

    const healthData = {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date(),
      version: getPackageVersion(),
      environment: process.env.NODE_ENV,
      databaseStatus: "connected",
      memoryUsage: process.memoryUsage(),
    };

    res.json(healthData);
  } catch (error) {
    res.status(503).json({
      status: "error",
      uptime: process.uptime(),
      timestamp: new Date(),
      error: "Database connection failed",
      details: process.env.NODE_ENV === "production" ? undefined : error,
    });
  }
};
