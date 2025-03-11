import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authMiddleware.js";
import {
  Roles,
  Permissions,
  Resources,
  RBAC_MATRIX,
} from "../constants/roles.js";
import { createError } from "../utils/errorUtils.js";
import logger from "../utils/logger.js";

/**
 * Middleware to restrict access by user role
 */
export const requireRole = (roles: Roles | Roles[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const user = req.user;

      if (!user) {
        next(createError(401, "Authentication required"));
        return;
      }

      const userRole = user.role as Roles;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(userRole)) {
        next(createError(403, "Insufficient permissions"));
        return;
      }

      next();
    } catch (error) {
      logger.error(
        `Authorization error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      next(createError(500, "Authorization process failed"));
    }
  };
};

/**
 * Middleware to check if user has specific permission for a resource
 */
export const hasPermission = (resource: Resources, permission: Permissions) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const user = req.user;

      if (!user) {
        next(createError(401, "Authentication required"));
        return;
      }

      const userRole = user.role as Roles;

      // Ensure valid role
      if (!Object.values(Roles).includes(userRole)) {
        next(createError(403, "Invalid user role"));
        return;
      }

      // Get permissions for this role and resource
      // Use type assertion to help TypeScript understand the structure
      const roleMatrix = RBAC_MATRIX as Record<
        Roles,
        Record<Resources, Permissions[]>
      >;
      const rolePermissions = roleMatrix[userRole]?.[resource] || [];

      if (!rolePermissions.includes(permission)) {
        next(createError(403, "Insufficient permissions for this operation"));
        return;
      }

      next();
    } catch (error) {
      logger.error(
        `Permission check error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      next(createError(500, "Permission check failed"));
    }
  };
};

/**
 * Resource ownership check - ensures users can only access their own resources
 */
export const isResourceOwner = (
  extractOwnerId: (req: AuthenticatedRequest) => string | undefined
) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const user = req.user;

      if (!user) {
        next(createError(401, "Authentication required"));
        return;
      }

      const userRole = user.role as Roles;

      // Admins and managers bypass ownership check
      if (userRole === Roles.ADMIN || userRole === Roles.MANAGER) {
        next();
        return;
      }

      const resourceOwnerId = extractOwnerId(req);

      if (!resourceOwnerId || resourceOwnerId !== user.userId) {
        next(createError(403, "You can only access your own resources"));
        return;
      }

      next();
    } catch (error) {
      logger.error(
        `Ownership check error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      next(createError(500, "Ownership verification failed"));
    }
  };
};
