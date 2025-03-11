import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";
import { createError } from "../utils/errorUtils.js";
import { AuthService } from "../services/auth.service.js";
import { LoginDto, RegisterDto } from "../dto/auth.dto.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { sendSuccess } from "../utils/responseUtil.js";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register a new user
   */
  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userData: RegisterDto = req.body;
      const result = await this.authService.register(userData);

      sendSuccess(
        res,
        {
          user: result.user,
          tokens: result.tokens,
        },
        "User registered successfully",
        201
      );
    } catch (error) {
      logger.error(
        `Registration failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      next(
        error instanceof Error
          ? createError(400, error.message)
          : createError(500, "Registration failed")
      );
    }
  };

  /**
   * Login user
   */
  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const loginData: LoginDto = req.body;
      const result = await this.authService.login(loginData);

      sendSuccess(
        res,
        {
          user: result.user,
          tokens: result.tokens,
        },
        "Login successful"
      );
    } catch (error) {
      logger.error(
        `Login failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      next(
        error instanceof Error
          ? createError(401, error.message)
          : createError(500, "Login failed")
      );
    }
  };

  /**
   * Refresh user token
   */
  refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        next(createError(400, "Refresh token is required"));
        return;
      }

      const tokens = await this.authService.refreshToken(refreshToken);

      sendSuccess(res, { tokens }, "Token refreshed successfully");
    } catch (error) {
      logger.error(
        `Token refresh failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      next(
        error instanceof Error
          ? createError(401, error.message)
          : createError(500, "Token refresh failed")
      );
    }
  };

  /**
   * Logout user
   */
  logout = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        next(createError(401, "Authentication required"));
        return;
      }

      await this.authService.logout(userId);

      sendSuccess(res, null, "Logged out successfully");
    } catch (error) {
      logger.error(
        `Logout failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      next(createError(500, "Logout failed"));
    }
  };

  /**
   * Get current authenticated user
   */
  getCurrentUser = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        next(createError(401, "Authentication required"));
        return;
      }

      const user = await this.authService.getUserById(userId);

      sendSuccess(res, { user });
    } catch (error) {
      logger.error(
        `Get current user failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      next(createError(500, "Failed to retrieve user information"));
    }
  };
}
