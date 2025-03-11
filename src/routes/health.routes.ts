import { Router } from "express";
import { healthController } from "../controllers/health.controller.js";

const router = Router();

router.get("/", healthController.check);

export default router;
