import User from "../models/user.model.js";
import { LoginDto, RegisterDto } from "../dto/auth.dto.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.util.js";
import logger from "../utils/logger.js";
import { Roles } from "../constants/roles.js";
import UserService from "./user.service.js"; // Import the default instance
import { IAuthService } from "../interfaces/services/auth.service.interface.js";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export class AuthService implements IAuthService {
  /**
   * Register a new user
   */
  async register(
    userData: RegisterDto
  ): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    // Check if email already exists
    const existingUser = await User.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Create the new user
    const user = await User.create({
      ...userData,
      username: (userData as any).username || userData.email, // Add username, use email as fallback if not provided
      role: userData.role || Roles.BUYER, // Default to USER role if not specified
    });

    // Generate tokens
    const tokens = this.generateAuthTokens(user.id, user.role);

    // Store refresh token in user record
    await user.update({ refreshToken: tokens.refreshToken });

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Login an existing user
   */
  async login(
    loginData: LoginDto
  ): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    // Find the user by email
    const user = await User.findOne({ where: { email: loginData.email } });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(loginData.password);

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error("Account is inactive");
    }

    // Generate tokens
    const tokens = this.generateAuthTokens(user.id, user.role);

    // Update user's last login time and refresh token
    await user.update({
      lastLogin: new Date(),
      refreshToken: tokens.refreshToken,
    });

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify the refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Find the user by ID
      const user = await User.findByPk(payload.userId);

      if (!user || user.refreshToken !== refreshToken || !user.isActive) {
        throw new Error("Invalid refresh token");
      }

      // Generate new tokens
      const tokens = this.generateAuthTokens(user.id, user.role);

      // Update the refresh token in the database
      await user.update({ refreshToken: tokens.refreshToken });

      return tokens;
    } catch (error) {
      logger.error(
        `Token refresh error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw new Error("Invalid refresh token");
    }
  }

  /**
   * Logout a user by clearing their refresh token
   */
  async logout(userId: string): Promise<void> {
    await User.update({ refreshToken: null }, { where: { id: userId } });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserResponse> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error("User not found");
    }

    return this.sanitizeUser(user);
  }

  /**
   * Generate authentication tokens for a user
   */
  private generateAuthTokens(userId: string, role: string): AuthTokens {
    const payload = { userId, role };

    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  /**
   * Sanitize user object to remove sensitive data
   */
  private sanitizeUser(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }
}

// Export a default instance
export default new AuthService();
