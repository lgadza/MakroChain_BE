/// <reference types="jest" />
import { AuthService } from "../../services/auth.service.js";
import User from "../../models/user.model.js";
import * as jwtUtils from "../../utils/jwt.util.js";
import { Roles } from "../../constants/roles.js";
import { jest, expect, describe, it, beforeEach } from "@jest/globals";

// Mock dependencies
jest.mock("../../models/user.model.js");
jest.mock("../../utils/jwt.util.js");
jest.mock("../../utils/logger.js", () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

// Define a proper interface for our mock User
interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  username: string;
  isActive: boolean;
  lastLogin: Date | null;
  refreshToken?: string;
  comparePassword: jest.Mock;
  update: jest.Mock;
  destroy?: jest.Mock;
}

describe("AuthService", () => {
  let authService: AuthService;
  let mockFindOne: jest.Mock;
  let mockCreate: jest.Mock;
  let mockFindByPk: jest.Mock;
  let mockUpdate: jest.Mock;

  const mockUserData: MockUser = {
    id: "123",
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    role: Roles.USER,
    username: "test@example.com",
    isActive: true,
    lastLogin: null,
    comparePassword: jest.fn(),
    update: jest.fn(),
  };

  const mockTokens = {
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
  };

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();

    // Setup mock implementation
    mockFindOne = jest.fn();
    mockCreate = jest.fn();
    mockFindByPk = jest.fn();
    mockUpdate = jest.fn();

    // Assign mocks to User model methods
    (User.findOne as jest.Mock) = mockFindOne;
    (User.create as jest.Mock) = mockCreate;
    (User.findByPk as jest.Mock) = mockFindByPk;
    (User.update as jest.Mock) = mockUpdate;

    // Default mock implementations for JWT utils
    (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue(
      mockTokens.accessToken
    );
    (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue(
      mockTokens.refreshToken
    );
    (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue({
      userId: "123",
      role: Roles.USER,
    });
  });

  describe("register", () => {
    it("should create a new user and return user data with tokens", async () => {
      // Setup
      const registerData = {
        email: "new@example.com",
        password: "Password123!",
        firstName: "New",
        lastName: "User",
      };

      const createdUser: MockUser = {
        ...mockUserData,
        email: registerData.email,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockFindOne.mockResolvedValue(null);
      mockCreate.mockResolvedValue(createdUser);

      // Execute
      const result = await authService.register(registerData);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith({
        where: { email: registerData.email },
      });
      expect(mockCreate).toHaveBeenCalledWith({
        ...registerData,
        username: registerData.email,
        role: Roles.USER,
      });
      expect(createdUser.update).toHaveBeenCalledWith({
        refreshToken: mockTokens.refreshToken,
      });
      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("tokens");
      expect(result.tokens).toEqual(mockTokens);
    });

    it("should throw an error if email already exists", async () => {
      // Setup
      const registerData = {
        email: "existing@example.com",
        password: "Password123!",
        firstName: "Existing",
        lastName: "User",
      };

      mockFindOne.mockResolvedValue({ id: "456" });

      // Execute & Assert
      await expect(authService.register(registerData)).rejects.toThrow(
        "Email already registered"
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("should use custom role if provided", async () => {
      // Setup
      const registerData = {
        email: "admin@example.com",
        password: "Password123!",
        firstName: "Admin",
        lastName: "User",
        role: Roles.ADMIN,
      };

      const createdUser: MockUser = {
        ...mockUserData,
        email: registerData.email,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        role: Roles.ADMIN,
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockFindOne.mockResolvedValue(null);
      mockCreate.mockResolvedValue(createdUser);

      // Execute
      await authService.register(registerData);

      // Assert
      expect(mockCreate).toHaveBeenCalledWith({
        ...registerData,
        username: registerData.email,
      });
    });
  });

  describe("login", () => {
    it("should return user data and tokens when credentials are valid", async () => {
      // Setup
      const loginData = {
        email: "test@example.com",
        password: "Password123!",
      };

      const mockUser: MockUser = {
        ...mockUserData,
        comparePassword: jest.fn().mockResolvedValue(true),
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockFindOne.mockResolvedValue(mockUser);

      // Execute
      const result = await authService.login(loginData);

      // Assert
      expect(mockFindOne).toHaveBeenCalledWith({
        where: { email: loginData.email },
      });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginData.password);
      expect(mockUser.update).toHaveBeenCalledWith({
        lastLogin: expect.any(Date),
        refreshToken: mockTokens.refreshToken,
      });
      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("tokens");
      expect(result.tokens).toEqual(mockTokens);
    });

    it("should throw an error if user is not found", async () => {
      // Setup
      const loginData = {
        email: "nonexistent@example.com",
        password: "Password123!",
      };

      mockFindOne.mockResolvedValue(null);

      // Execute & Assert
      await expect(authService.login(loginData)).rejects.toThrow(
        "Invalid credentials"
      );
    });

    it("should throw an error if password is incorrect", async () => {
      // Setup
      const loginData = {
        email: "test@example.com",
        password: "WrongPassword123!",
      };

      const mockUser: MockUser = {
        ...mockUserData,
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      mockFindOne.mockResolvedValue(mockUser);

      // Execute & Assert
      await expect(authService.login(loginData)).rejects.toThrow(
        "Invalid credentials"
      );
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginData.password);
    });

    it("should throw an error if account is inactive", async () => {
      // Setup
      const loginData = {
        email: "inactive@example.com",
        password: "Password123!",
      };

      const mockUser: MockUser = {
        ...mockUserData,
        isActive: false,
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      mockFindOne.mockResolvedValue(mockUser);

      // Execute & Assert
      await expect(authService.login(loginData)).rejects.toThrow(
        "Account is inactive"
      );
    });
  });

  describe("refreshToken", () => {
    it("should return new tokens when refresh token is valid", async () => {
      // Setup
      const refreshToken = "valid-refresh-token";
      const userId = "123";

      const mockUser: MockUser = {
        ...mockUserData,
        refreshToken,
        update: jest.fn().mockResolvedValue(undefined),
      };

      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue({ userId });
      mockFindByPk.mockResolvedValue(mockUser);

      // Execute
      const result = await authService.refreshToken(refreshToken);

      // Assert
      expect(jwtUtils.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockFindByPk).toHaveBeenCalledWith(userId);
      expect(mockUser.update).toHaveBeenCalledWith({
        refreshToken: mockTokens.refreshToken,
      });
      expect(result).toEqual(mockTokens);
    });

    it("should throw an error if refresh token verification fails", async () => {
      // Setup
      const refreshToken = "invalid-refresh-token";

      (jwtUtils.verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      // Execute & Assert
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
        "Invalid refresh token"
      );
      expect(mockFindByPk).not.toHaveBeenCalled();
    });

    it("should throw an error if user is not found", async () => {
      // Setup
      const refreshToken = "valid-refresh-token";
      const userId = "nonexistent";

      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue({ userId });
      mockFindByPk.mockResolvedValue(null);

      // Execute & Assert
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
        "Invalid refresh token"
      );
    });

    it("should throw an error if stored refresh token doesn't match", async () => {
      // Setup
      const refreshToken = "valid-refresh-token";
      const userId = "123";

      const mockUser: MockUser = {
        ...mockUserData,
        refreshToken: "different-refresh-token",
        isActive: true,
      };

      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue({ userId });
      mockFindByPk.mockResolvedValue(mockUser);

      // Execute & Assert
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
        "Invalid refresh token"
      );
    });

    it("should throw an error if user is inactive", async () => {
      // Setup
      const refreshToken = "valid-refresh-token";
      const userId = "123";

      const mockUser: MockUser = {
        ...mockUserData,
        refreshToken,
        isActive: false,
      };

      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue({ userId });
      mockFindByPk.mockResolvedValue(mockUser);

      // Execute & Assert
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
        "Invalid refresh token"
      );
    });
  });

  describe("logout", () => {
    it("should clear refresh token for the user", async () => {
      // Setup
      const userId = "123";
      mockUpdate.mockResolvedValue([1]); // Sequelize update returns array with count of affected rows

      // Execute
      await authService.logout(userId);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith(
        { refreshToken: null },
        { where: { id: userId } }
      );
    });
  });

  describe("getUserById", () => {
    it("should return sanitized user data", async () => {
      // Setup
      const userId = "123";

      mockFindByPk.mockResolvedValue(mockUserData);

      // Execute
      const result = await authService.getUserById(userId);

      // Assert
      expect(mockFindByPk).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        id: mockUserData.id,
        email: mockUserData.email,
        firstName: mockUserData.firstName,
        lastName: mockUserData.lastName,
        role: mockUserData.role,
      });
    });

    it("should throw an error if user is not found", async () => {
      // Setup
      const userId = "nonexistent";

      mockFindByPk.mockResolvedValue(null);

      // Execute & Assert
      await expect(authService.getUserById(userId)).rejects.toThrow(
        "User not found"
      );
    });
  });
});
