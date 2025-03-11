import User from "../models/user.model.js";
import { createError } from "../utils/errorUtils.js";
import { Roles } from "../constants/roles.js";
import logger from "../utils/logger.js";
import { Op } from "sequelize";

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  /**
   * Get all users with pagination
   */
  async getAllUsers(
    page = 1,
    limit = 10
  ): Promise<{ users: UserData[]; total: number; pages: number }> {
    try {
      const offset = (page - 1) * limit;

      const { count, rows } = await User.findAndCountAll({
        attributes: [
          "id",
          "email",
          "firstName",
          "lastName",
          "role",
          "isActive",
          "lastLogin",
          "createdAt",
          "updatedAt",
        ],
        offset,
        limit,
      });

      return {
        users: rows as unknown as UserData[],
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error(
        `Error fetching users: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw createError(500, "Failed to fetch users from database");
    }
  }

  /**
   * Get a user by ID
   */
  async getUserById(id: string): Promise<UserData> {
    const user = await User.findByPk(id, {
      attributes: [
        "id",
        "email",
        "firstName",
        "lastName",
        "role",
        "isActive",
        "lastLogin",
        "createdAt",
        "updatedAt",
      ],
    });

    if (!user) {
      throw createError(404, "User not found");
    }

    return user as unknown as UserData;
  }

  /**
   * Update a user
   */
  async updateUser(id: string, data: Partial<UserData>): Promise<UserData> {
    const user = await User.findByPk(id);

    if (!user) {
      throw createError(404, "User not found");
    }

    // Prevent role escalation - only allow update to recognized roles
    if (data.role && !Object.values(Roles).includes(data.role as Roles)) {
      throw createError(400, "Invalid role");
    }

    // Remove sensitive fields that shouldn't be updated directly
    const sanitizedData = { ...data };
    delete (sanitizedData as any).id;
    delete (sanitizedData as any).password;

    // Update user data
    await user.update(sanitizedData);

    // Return the updated user without sensitive information
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const user = await User.findByPk(id);

      if (!user) {
        throw createError(404, "User not found");
      }

      await user.destroy();
    } catch (error) {
      logger.error(
        `Error deleting user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      if (error instanceof Error && error.message === "User not found") {
        throw error;
      }
      throw createError(500, "Failed to delete user");
    }
  }

  /**
   * Deactivate a user
   */
  async deactivateUser(id: string): Promise<void> {
    const user = await User.findByPk(id);

    if (!user) {
      throw createError(404, "User not found");
    }

    await user.update({ isActive: false });
  }

  /**
   * Activate a user
   */
  async activateUser(id: string): Promise<void> {
    const user = await User.findByPk(id);

    if (!user) {
      throw createError(404, "User not found");
    }

    await user.update({ isActive: true });
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw createError(404, "User not found");
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      throw createError(401, "Current password is incorrect");
    }

    // Update password
    await user.update({ password: newPassword });
  }

  /**
   * Search users
   */
  async searchUsers(
    query: string,
    page = 1,
    limit = 10
  ): Promise<{ users: UserData[]; total: number; pages: number }> {
    try {
      const offset = (page - 1) * limit;
      const { count, rows } = await User.findAndCountAll({
        attributes: [
          "id",
          "email",
          "firstName",
          "lastName",
          "role",
          "isActive",
          "lastLogin",
          "createdAt",
          "updatedAt",
        ],
        where: {
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${query}%` } },
            { lastName: { [Op.iLike]: `%${query}%` } },
            { email: { [Op.iLike]: `%${query}%` } },
          ],
        },
        offset,
        limit,
      });

      return {
        users: rows as unknown as UserData[],
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error(
        `Error searching users: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw createError(500, "Failed to search users");
    }
  }
}
