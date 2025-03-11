import { Request, Response } from "express";
import { sendSuccess } from "../utils/responseUtil.js";

class HealthController {
  public check = (req: Request, res: Response): void => {
    sendSuccess(
      res,
      {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
      "Server is healthy"
    );
  };
}

export const healthController = new HealthController();
