import { Request, Response } from "express";

class HealthController {
  public check = (req: Request, res: Response): void => {
    res.status(200).json({
      status: "success",
      message: "Server is healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  };
}

export const healthController = new HealthController();
