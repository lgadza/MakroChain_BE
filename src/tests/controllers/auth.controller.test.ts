import { Request, Response } from "express";
import { AuthController } from "../../controllers/auth.controller.js";
import { AuthService } from "../../services/auth.service.js";
import { AuthenticatedRequest } from "../../middleware/authMiddleware.js";
import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { ErrorFactory } from "../../utils/errorUtils.js";
import { LoginDto, RegisterDto } from "../../dto/auth.dto.js";
import { Op } from "sequelize";

// Mock dependencies
jest.mock("../../services/auth.service.js");
jest.mock("../../utils/logger.js", () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

// Define TypeScript interfaces for our mock types
interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Create properly typed mock functions for AuthService
type RegisterFn = (
  userData: RegisterDto
) => Promise<{ user: UserResponse; tokens: AuthTokens }>;
type LoginFn = (
  loginData: LoginDto
) => Promise<{ user: UserResponse; tokens: AuthTokens }>;
type RefreshTokenFn = (refreshToken: string) => Promise<AuthTokens>;
type LogoutFn = (userId: string) => Promise<void>;
type GetUserByIdFn = (userId: string) => Promise<UserResponse>;

describe("AuthController", () => {
  let authController: AuthController;
  let mockAuthService: {
    register: jest.MockedFunction<RegisterFn>;
    login: jest.MockedFunction<LoginFn>;
    refreshToken: jest.MockedFunction<RefreshTokenFn>;
    logout: jest.MockedFunction<LogoutFn>;
    getUserById: jest.MockedFunction<GetUserByIdFn>;
  };
  let mockRequest: Partial<Request>;
  let mockAuthRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  const mockUser: UserResponse = {
    id: "123",
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "USER",
  };

  const mockTokens: AuthTokens = {
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
  };

  beforeEach(() => {
    // Setup mocks with explicit types
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      getUserById: jest.fn(),
    };

    authController = new AuthController();
    (authController as any).authService = mockAuthService;

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
      status: jest.fn().mockReturnThis() as jest.MockedFunction<
        (code: number) => Response
      >,
      json: jest.fn() as jest.MockedFunction<(body?: any) => Response>,
    };

    mockNext = jest.fn();
  });

  describe("User Registration", () => {
    it("should successfully register a new user and return user data with tokens", async () => {
      // Setup
      const registerData = {
        email: "new@example.com",
        password: "Password123!",
        firstName: "New",
        lastName: "User",
      };

      mockRequest.body = registerData;

      const registerResult = {
        user: {
          id: "456",
          email: registerData.email,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          role: "USER",
        },
        tokens: mockTokens,
      };

      mockAuthService.register.mockResolvedValue(registerResult);

      // Execute
      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith(registerData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "User registered successfully",
        data: {
          user: registerResult.user,
          tokens: registerResult.tokens,
        },
      });
    });

    it("should handle error when registering with an existing email", async () => {
      // Setup
      const registerData = {
        email: "existing@example.com",
        password: "Password123!",
        firstName: "Existing",
        lastName: "User",
      };

      mockRequest.body = registerData;

      const error = ErrorFactory.badRequest("Email already registered");
      mockAuthService.register.mockRejectedValue(error);

      // Execute
      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalled();
      const passedError = mockNext.mock.calls[0][0];
      expect(passedError).toEqual(error);
    });
  });

  describe("User Authentication", () => {
    describe("login", () => {
      it("should successfully login a user and return user data with tokens", async () => {
        // Setup
        const loginData = {
          email: "test@example.com",
          password: "Password123!",
        };

        mockRequest.body = loginData;

        const loginResult = {
          user: mockUser,
          tokens: mockTokens,
        };

        mockAuthService.login.mockResolvedValue(loginResult);

        // Execute
        await authController.login(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        // Assert
        expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          message: "Login successful",
          data: {
            user: loginResult.user,
            tokens: loginResult.tokens,
          },
        });
      });

      it("should handle invalid credentials during login", async () => {
        // Setup
        const loginData = {
          email: "test@example.com",
          password: "WrongPassword",
        };

        mockRequest.body = loginData;

        // Execute
        await authController.login(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        // Assert
        expect(mockNext).toHaveBeenCalled();
        const passedError = mockNext.mock.calls[0][0];
      });
    });

    describe("refreshToken", () => {
      it("should successfully refresh tokens and return new tokens", async () => {
        // Setup
        mockRequest.body = { refreshToken: "valid-refresh-token" };

        mockAuthService.refreshToken.mockResolvedValue(mockTokens);

        // Execute
        await authController.refreshToken(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        // Assert
        expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
          "valid-refresh-token"
        );
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          message: "Token refreshed successfully",
          data: { tokens: mockTokens },
        });
      });

      describe.each([
        {
          scenario: "missing refresh token",
          body: {},
          expectedError: ErrorFactory.badRequest("Refresh token is required"),
          shouldCallService: false,
        },
        {
          scenario: "invalid refresh token",
          body: { refreshToken: "invalid-refresh-token" },
          expectedError: ErrorFactory.unauthorized("Invalid refresh token"),
          shouldCallService: true,
          serviceError: ErrorFactory.unauthorized("Invalid refresh token"),
        },
      ])(
        "when $scenario",
        ({ body, expectedError, shouldCallService, serviceError }) => {
          it(`should handle ${
            body.refreshToken ? "invalid" : "missing"
          } refresh token appropriately`, async () => {
            // Setup
            mockRequest.body = body;

            if (serviceError) {
              mockAuthService.refreshToken.mockRejectedValue(serviceError);
            }

            // Execute
            await authController.refreshToken(
              mockRequest as Request,
              mockResponse as Response,
              mockNext
            );

            // Assert
            if (shouldCallService) {
              expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
                body.refreshToken
              );
            } else {
              expect(mockAuthService.refreshToken).not.toHaveBeenCalled();
            }

            expect(mockNext).toHaveBeenCalled();
            const passedError = mockNext.mock.calls[0][0];
            expect(passedError).toEqual(expectedError);
          });
        }
      );
    });

    describe("logout", () => {
      it("should successfully logout a user and return success message", async () => {
        // Setup
        mockAuthService.logout.mockResolvedValue(undefined);

        // Execute
        await authController.logout(
          mockAuthRequest as AuthenticatedRequest,
          mockResponse as Response,
          mockNext
        );

        // Assert
        expect(mockAuthService.logout).toHaveBeenCalledWith("123");
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          message: "Logged out successfully",
          data: null,
        });
      });

      it("should handle unauthenticated user during logout attempt", async () => {
        // Setup
        const unauthRequest: Partial<AuthenticatedRequest> = {
          ...mockRequest,
          user: undefined,
        };

        const error = ErrorFactory.unauthorized("Authentication required");

        // Execute
        await authController.logout(
          unauthRequest as AuthenticatedRequest,
          mockResponse as Response,
          mockNext
        );

        // Assert
        expect(mockAuthService.logout).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalled();
        const passedError = mockNext.mock.calls[0][0];
        expect(passedError).toEqual(error);
      });

      it("should handle server errors during logout process", async () => {
        // Setup
        const error = ErrorFactory.internal("Logout failed");
        mockAuthService.logout.mockImplementation(() => Promise.reject(error));

        // Execute
        await authController.logout(
          mockAuthRequest as AuthenticatedRequest,
          mockResponse as Response,
          mockNext
        );

        // Assert
        expect(mockNext).toHaveBeenCalled();
        const passedError = mockNext.mock.calls[0][0];
        expect(passedError).toEqual(error);
      });
    });
  });

  describe("User Profile", () => {
    describe("getCurrentUser", () => {
      it("should successfully return current authenticated user profile", async () => {
        // Setup
        mockAuthService.getUserById.mockResolvedValue(mockUser);

        // Execute
        await authController.getCurrentUser(
          mockAuthRequest as AuthenticatedRequest,
          mockResponse as Response,
          mockNext
        );

        // Assert
        expect(mockAuthService.getUserById).toHaveBeenCalledWith("123");
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: { user: mockUser },
          message: "Success",
        });
      });

      it("should handle unauthenticated user when requesting profile", async () => {
        // Setup
        const unauthRequest: Partial<AuthenticatedRequest> = {
          ...mockRequest,
          user: undefined,
        };

        const error = ErrorFactory.unauthorized("Authentication required");

        // Execute
        await authController.getCurrentUser(
          unauthRequest as AuthenticatedRequest,
          mockResponse as Response,
          mockNext
        );

        // Assert
        expect(mockAuthService.getUserById).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalled();
        const passedError = mockNext.mock.calls[0][0];
        expect(passedError).toEqual(error);
      });

      it("should handle database errors when retrieving user profile", async () => {
        // Setup
        const error = ErrorFactory.internal(
          "Failed to retrieve user information"
        );
        mockAuthService.getUserById.mockRejectedValue(error);

        // Execute
        await authController.getCurrentUser(
          mockAuthRequest as AuthenticatedRequest,
          mockResponse as Response,
          mockNext
        );

        // Assert
        expect(mockNext).toHaveBeenCalled();
        const passedError = mockNext.mock.calls[0][0];
        expect(passedError).toEqual(error);
      });
    });
  });
});
