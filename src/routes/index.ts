import express from "express";
import healthRoutes from "./health.routes.js";

// Create a router instance
const router = express.Router();

// Register route modules
router.use("/health", healthRoutes);

// Add more routes here as they are developed
// Example:
// router.use('/users', userRoutes);
// router.use('/auth', authRoutes);

export default router;
