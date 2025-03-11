import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { ErrorFactory } from "../utils/errorUtils.js";

// Augment Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ErrorFactory.unauthorized("No token provided", "UNAUTHORIZED");
    }

    const token = authHeader.split(" ")[1];
    const authService = new AuthService();

    try {
      const decoded = authService.verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const authService = new AuthService();

    try {
      const decoded = authService.verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // Just continue without setting req.user
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const roleMiddleware = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        ErrorFactory.unauthorized("Authentication required", "UNAUTHORIZED")
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ErrorFactory.forbidden("Insufficient permissions", "UNAUTHORIZED")
      );
    }

    next();
  };
};
