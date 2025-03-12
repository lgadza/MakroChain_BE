import express from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import addressRoutes from "./address.routes.js";
import phoneRoutes from "./phone.routes.js";
import harvestRoutes from "./harvest.routes.js";
import transactionRoutes from "./transaction.routes.js";
import loanRoutes from "./loan.routes.js";

// Create a router instance
const router = express.Router();

// Register route modules
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/addresses", addressRoutes);
router.use("/phones", phoneRoutes);
router.use("/harvests", harvestRoutes);
router.use("/transactions", transactionRoutes);
router.use("/loans", loanRoutes);

// Add more routes here as they are developed
// Example:
// router.use('/products', productRoutes);
// router.use('/orders', orderRoutes);

export default router;
