import { Request, Response } from "express";
import { UserController } from "../../controllers/user.controller.js";
import { UserService } from "../../services/user.service.js";
import { AuthenticatedRequest } from "../../middleware/authMiddleware.js";
import { jest, expect, describe, it, beforeEach } from "@jest/globals";

// Mock dependencies
jest.mock("../../services/user.service.js");
jest.mock("../../utils/logger.js", () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

describe("UserController", () => {
  let userController: UserController;
  let mockUserService: jest.Mocked<UserService>;
  let mockRequest: Partial<Request>;
  let mockAuthRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  const mockUserData = {
    id: "123",
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "USER",
    isActive: true,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Setup mocks
    mockUserService = new UserService() as jest.Mocked<UserService>;
    userController = new UserController();
    (userController as any).userService = mockUserService;

    mockRequest = {
      params: {},
      query: {},
      body: {},
    };

    mockAuthRequest = {
      ...mockRequest,
      user: {
        userId: "123",
        role: "USER",
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe("getAllUsers", () => {
    it("should return paginated users with metadata", async () => {
      // Setup
      mockRequest.query = { page: "2", limit: "10" };

      const mockUsers = [mockUserData, { ...mockUserData, id: "456" }];
      const mockPaginationResult = {
        users: mockUsers,
        total: 25,
        pages: 3,
      };

      mockUserService.getAllUsers = jest
        .fn()
        .mockResolvedValue(mockPaginationResult);

      // Execute
      await userController.getAllUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockUserService.getAllUsers).toHaveBeenCalledWith(2, 10);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUsers,
        meta: {
          total: 25,
          pages: 3,
          page: 2,
          limit: 10,
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should use default pagination values when not provided", async () => {
      // Setup
      mockRequest.query = {};

      const mockUsers = [mockUserData];
      const mockPaginationResult = {
        users: mockUsers,
        total: 1,
        pages: 1,
      };

      mockUserService.getAllUsers = jest
        .fn()
        .mockResolvedValue(mockPaginationResult);

      // Execute
      await userController.getAllUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockUserService.getAllUsers).toHaveBeenCalledWith(1, 10);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should handle errors and call next with error", async () => {
      // Setup
      mockRequest.query = {};
      const errorMessage = "Database error";

      mockUserService.getAllUsers = jest
        .fn()
        .mockRejectedValue(new Error(errorMessage));

      // Execute
      await userController.getAllUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.status).toBe(500);
      expect(error.message).toBe("Failed to retrieve users");
    });
  });

  describe("searchUsers", () => {
    it("should return users matching search query", async () => {
      // Setup
      mockRequest.query = { query: "John", page: "1", limit: "10" };

      const mockUsers = [mockUserData];
      const mockSearchResult = {
        users: mockUsers,
        total: 1,
        pages: 1,
      };

      mockUserService.searchUsers = jest
        .fn()
        .mockResolvedValue(mockSearchResult);

      // Execute
      await userController.searchUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockUserService.searchUsers).toHaveBeenCalledWith("John", 1, 10);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUsers,
        meta: {
          total: 1,
          pages: 1,
          page: 1,
          limit: 10,
          query: "John",
        },
      });
    });

    it("should return error when query is missing", async () => {
      // Setup
      mockRequest.query = { page: "1", limit: "10" };

      // Execute
      await userController.searchUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockUserService.searchUsers).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.status).toBe(400);
      expect(error.message).toBe("Search query is required");
    });

    it("should handle search errors", async () => {
      // Setup
      mockRequest.query = { query: "John" };
      mockUserService.searchUsers = jest
        .fn()
        .mockRejectedValue(new Error("Search error"));

      // Execute
      await userController.searchUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.status).toBe(500);
      expect(error.message).toBe("Failed to search users");
    });
  });

  describe("getUserById", () => {
    it("should return user when valid ID is provided", async () => {
      // Setup
      mockRequest.params = { id: "123" };
      mockUserService.getUserById = jest.fn().mockResolvedValue(mockUserData);

      // Execute
      await userController.getUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockUserService.getUserById).toHaveBeenCalledWith("123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUserData,
      });
    });

    it("should pass errors to error handler", async () => {
      // Setup
      mockRequest.params = { id: "nonexistent" };
      const notFoundError = new Error("User not found");
      (notFoundError as any).status = 404;
      mockUserService.getUserById = jest.fn().mockRejectedValue(notFoundError);

      // Execute
      await userController.getUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });
  });

  describe("updateUser", () => {
    it("should update and return user when owner makes request", async () => {
      // Setup
      mockAuthRequest.params = { id: "123" }; // Same as authenticated user
      mockAuthRequest.body = { firstName: "Updated" };
      mockUserService.updateUser = jest.fn().mockResolvedValue({
        ...mockUserData,
        firstName: "Updated",
      });

      // Execute
      await userController.updateUser(
        mockAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockUserService.updateUser).toHaveBeenCalledWith("123", {
        firstName: "Updated",
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "User updated successfully",
        data: expect.objectContaining({ firstName: "Updated" }),
      });
    });

    it("should update and return user when admin makes request", async () => {
      // Setup
      mockAuthRequest.params = { id: "456" }; // Different from authenticated user
      mockAuthRequest.user = { userId: "123", role: "ADMIN" };
      mockAuthRequest.body = { firstName: "AdminUpdated" };

      mockUserService.updateUser = jest.fn().mockResolvedValue({
        ...mockUserData,
        id: "456",
        firstName: "AdminUpdated",
      });

      // Execute
      await userController.updateUser(
        mockAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockUserService.updateUser).toHaveBeenCalledWith("456", {
        firstName: "AdminUpdated",
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should return forbidden error when non-owner non-admin makes request", async () => {
      // Setup
      mockAuthRequest.params = { id: "456" }; // Different from authenticated user
      mockAuthRequest.user = { userId: "123", role: "USER" };
      mockAuthRequest.body = { firstName: "Unauthorized" };

      // Execute
      await userController.updateUser(
        mockAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockUserService.updateUser).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.status).toBe(403);
      expect(error.message).toBe("You can only update your own profile");
    });
  });

  describe("deleteUser", () => {
    it("should delete user and return success message", async () => {
      // Setup
      mockRequest.params = { id: "123" };
      mockUserService.deleteUser = jest.fn().mockResolvedValue(undefined);

      // Execute
      await userController.deleteUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockUserService.deleteUser).toHaveBeenCalledWith("123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "User deleted successfully",
      });
    });

    it("should pass errors to error handler", async () => {
      // Setup
      mockRequest.params = { id: "nonexistent" };
      const notFoundError = new Error("User not found");
      mockUserService.deleteUser = jest.fn().mockRejectedValue(notFoundError);

      // Execute
      await userController.deleteUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });
  });

  describe("deactivateUser", () => {
    it("should deactivate user and return success message", async () => {
      // Setup
      mockRequest.params = { id: "123" };
      mockUserService.deactivateUser = jest.fn().mockResolvedValue(undefined);

      // Execute
      await userController.deactivateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockUserService.deactivateUser).toHaveBeenCalledWith("123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "User deactivated successfully",
      });
    });

    it("should pass errors to error handler", async () => {
      // Setup
      mockRequest.params = { id: "nonexistent" };
      const notFoundError = new Error("User not found");
      mockUserService.deactivateUser = jest
        .fn()
        .mockRejectedValue(notFoundError);

      // Execute
      await userController.deactivateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });
  });

  describe("activateUser", () => {
    it("should activate user and return success message", async () => {
      // Setup
      mockRequest.params = { id: "123" };
      mockUserService.activateUser = jest.fn().mockResolvedValue(undefined);

      // Execute
      await userController.activateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockUserService.activateUser).toHaveBeenCalledWith("123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "User activated successfully",
      });
    });

    it("should pass errors to error handler", async () => {
      // Setup
      mockRequest.params = { id: "nonexistent" };
      const notFoundError = new Error("User not found");
      mockUserService.activateUser = jest.fn().mockRejectedValue(notFoundError);

      // Execute
      await userController.activateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });
  });

  describe("changePassword", () => {
    it("should change password and return success message", async () => {
      // Setup
      mockAuthRequest.body = {
        currentPassword: "oldPassword",
        newPassword: "newPassword",
      };
      mockUserService.changePassword = jest.fn().mockResolvedValue(undefined);

      // Execute
      await userController.changePassword(
        mockAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockUserService.changePassword).toHaveBeenCalledWith(
        "123",
        "oldPassword",
        "newPassword"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Password changed successfully",
      });
    });

    it("should return authentication error when user is not authenticated", async () => {
      // Setup
      const unauthenticatedRequest: Partial<AuthenticatedRequest> = {
        ...mockRequest,
        user: undefined,
      };

      unauthenticatedRequest.body = {
        currentPassword: "oldPassword",
        newPassword: "newPassword",
      };

      // Execute
      await userController.changePassword(
        unauthenticatedRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockUserService.changePassword).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.status).toBe(401);
      expect(error.message).toBe("Authentication required");
    });

    it("should pass service errors to error handler", async () => {
      // Setup
      mockAuthRequest.body = {
        currentPassword: "wrongPassword",
        newPassword: "newPassword",
      };
      const passwordError = new Error("Current password is incorrect");
      mockUserService.changePassword = jest
        .fn()
        .mockRejectedValue(passwordError);

      // Execute
      await userController.changePassword(
        mockAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(passwordError);
    });
  });
});
