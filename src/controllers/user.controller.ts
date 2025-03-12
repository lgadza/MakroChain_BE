import { Request, Response, NextFunction } from "express";
import UserService from "../services/user.service.js"; // Import the default instance
// OR use the named import from the index
// import { UserService } from '../services/index.js';
import logger from "../utils/logger.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { createError } from "../utils/errorUtils.js";
import { asyncHandler } from "../utils/errorUtils.js";
import { sendSuccess } from "../utils/responseUtil.js";

export class UserController {
  private userService: typeof UserService;

  constructor() {
    this.userService = UserService;
  }

  /**
   * Get all users with pagination
   */
  getAllUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.userService.getAllUsers(page, limit);

      sendSuccess(res, result.users, "Users retrieved successfully", 200, {
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.pages,
        },
      });
    } catch (error) {
      logger.error(
        `Failed to get users: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      next(createError(500, "Failed to retrieve users"));
    }
  };

  /**
   * Search users with pagination
   */
  searchUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { query } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!query || typeof query !== "string") {
        next(createError(400, "Search query is required"));
        return;
      }

      const result = await this.userService.searchUsers(query, page, limit);

      sendSuccess(res, result.users, "Search results retrieved", 200, {
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.pages,
        },
        query,
      });
    } catch (error) {
      logger.error(
        `Failed to search users: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      next(createError(500, "Failed to search users"));
    }
  };

  /**
   * Get user by ID
   */
  getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);

      sendSuccess(res, user, "User retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a user
   */
  updateUser = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if user is updating themselves or has admin privileges
      if (req.user?.role !== "ADMIN" && req.user?.userId !== id) {
        next(createError(403, "You can only update your own profile"));
        return;
      }

      const updatedUser = await this.userService.updateUser(id, updateData);

      sendSuccess(res, updatedUser, "User updated successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a user
   */
  deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.userService.deleteUser(id);

      sendSuccess(res, null, "User deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deactivate a user
   */
  deactivateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.userService.deactivateUser(id);

      sendSuccess(res, null, "User deactivated successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Activate a user
   */
  activateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.userService.activateUser(id);

      sendSuccess(res, null, "User activated successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Change user's password
   */
  changePassword = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId } = req.user || {};
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        next(createError(401, "Authentication required"));
        return;
      }

      await this.userService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      sendSuccess(res, null, "Password changed successfully");
    } catch (error) {
      next(error);
    }
  };
}
