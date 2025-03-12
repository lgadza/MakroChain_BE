import { Response } from "express";
import { PhoneController } from "../../controllers/phone.controller.js";
import PhoneService from "../../services/phone.service.js";
import { AuthenticatedRequest } from "../../middleware/authMiddleware.js";
import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { sendSuccess } from "../../utils/responseUtil.js";

// Mock dependencies
jest.mock("../../services/phone.service.js");
jest.mock("../../utils/logger.js", () => ({
  error: jest.fn(),
  info: jest.fn(),
}));
jest.mock("../../utils/responseUtil.js", () => ({
  sendSuccess: jest.fn(),
}));

describe("PhoneController", () => {
  let phoneController: PhoneController;
  let mockPhoneService: jest.Mocked<typeof PhoneService>;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  const mockPhoneData = {
    id: "123",
    userId: "user123",
    phoneType: "MOBILE",
    countryCode: "1",
    number: "5551234567",
    extension: null,
    isDefault: true,
    isVerified: false,
    verificationCode: null,
    verificationExpires: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Setup mocks
    mockPhoneService = {
      getUserPhones: jest.fn(),
      getPhoneById: jest.fn(),
      createPhone: jest.fn(),
      updatePhone: jest.fn(),
      deletePhone: jest.fn(),
      setPhoneAsDefault: jest.fn(),
      requestVerificationCode: jest.fn(),
      verifyPhone: jest.fn(),
      verifyPhoneOwnership: jest.fn(),
    } as unknown as jest.Mocked<typeof PhoneService>;

    phoneController = new PhoneController();
    (phoneController as any).phoneService = mockPhoneService;

    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: {
        userId: "user123",
        role: "USER",
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis() as unknown as (
        code: number
      ) => Response,
      json: jest.fn() as unknown as Response["json"],
    };

    mockNext = jest.fn();

    // Reset mocks
    (sendSuccess as jest.Mock).mockReset();
  });

  describe("getUserPhones", () => {
    it("should return paginated phones with metadata", async () => {
      // Setup
      mockRequest.query = {
        phoneType: "MOBILE",
        page: "2",
        limit: "10",
        isVerified: "true",
      };

      const mockPhones = [mockPhoneData, { ...mockPhoneData, id: "456" }];
      const mockResult = {
        phones: mockPhones,
        total: 25,
        pages: 3,
      };
      mockPhoneService.getUserPhones.mockResolvedValue(mockResult);

      // Execute
      await phoneController.getUserPhones(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockPhoneService.getUserPhones).toHaveBeenCalledWith("user123", {
        phoneType: "MOBILE",
        page: 2,
        limit: 10,
        isVerified: true,
      });
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        mockPhones,
        "Phone numbers retrieved successfully",
        200,
        {
          pagination: {
            page: 2,
            limit: 10,
            total: 25,
            totalPages: 3,
          },
        }
      );
    });

    it("should return unauthorized error when not authenticated", async () => {
      // Setup
      mockRequest.user = undefined;

      // Execute
      await phoneController.getUserPhones(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockPhoneService.getUserPhones).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Authentication required");
    });
  });

  describe("getPhoneById", () => {
    it("should return phone when user is owner", async () => {
      // Setup
      mockRequest.params = { id: "123" };
      mockPhoneService.getPhoneById.mockResolvedValue({
        ...mockPhoneData,
        userId: "user123",
      });

      // Execute
      await phoneController.getPhoneById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockPhoneService.getPhoneById).toHaveBeenCalledWith("123");
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        { ...mockPhoneData, userId: "user123" },
        "Phone number retrieved successfully"
      );
    });

    it("should return phone when user is admin", async () => {
      // Setup
      mockRequest.params = { id: "123" };
      mockRequest.user = { userId: "adminUser", role: "ADMIN" };
      mockPhoneService.getPhoneById.mockResolvedValue({
        ...mockPhoneData,
        userId: "user123", // Different from requesting user
      });

      // Execute
      await phoneController.getPhoneById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockPhoneService.getPhoneById).toHaveBeenCalledWith("123");
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        { ...mockPhoneData, userId: "user123" },
        "Phone number retrieved successfully"
      );
    });

    it("should return forbidden error when non-owner non-admin requests", async () => {
      // Setup
      mockRequest.params = { id: "123" };
      mockRequest.user = { userId: "otherUser", role: "USER" };
      mockPhoneService.getPhoneById.mockResolvedValue({
        ...mockPhoneData,
        userId: "user123", // Different from requesting user
      });

      // Execute
      await phoneController.getPhoneById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockPhoneService.getPhoneById).toHaveBeenCalledWith("123");
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });
  });

  describe("createPhone", () => {
    it("should create and return a new phone", async () => {
      // Setup
      mockRequest.body = {
        phoneType: "HOME",
        countryCode: "44",
        number: "7700900123",
      };
      mockPhoneService.createPhone.mockResolvedValue({
        ...mockRequest.body,
        id: "789",
        userId: "user123",
      });

      // Execute
      await phoneController.createPhone(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockPhoneService.createPhone).toHaveBeenCalledWith(
        "user123",
        mockRequest.body
      );
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        {
          ...mockRequest.body,
          id: "789",
          userId: "user123",
        },
        "Phone number created successfully",
        201
      );
    });
  });

  describe("updatePhone", () => {
    it("should update and return the phone", async () => {
      // Setup
      mockRequest.params = { id: "123" };
      mockRequest.body = { extension: "123" };
      mockPhoneService.updatePhone.mockResolvedValue({
        ...mockPhoneData,
        ...mockRequest.body,
      });

      // Execute
      await phoneController.updatePhone(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockPhoneService.updatePhone).toHaveBeenCalledWith(
        "123",
        "user123",
        mockRequest.body
      );
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        {
          ...mockPhoneData,
          ...mockRequest.body,
        },
        "Phone number updated successfully"
      );
    });
  });

  describe("requestVerificationCode", () => {
    it("should request and return verification code", async () => {
      // Setup
      mockRequest.params = { id: "123" };
      mockPhoneService.requestVerificationCode.mockResolvedValue("123456");

      // Execute
      await phoneController.requestVerificationCode(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockPhoneService.requestVerificationCode).toHaveBeenCalledWith(
        "123",
        "user123"
      );
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        { verificationCode: "123456" },
        "Verification code sent successfully"
      );
    });
  });

  describe("verifyPhone", () => {
    it("should verify phone number with code", async () => {
      // Setup
      mockRequest.params = { id: "123" };
      mockRequest.body = { verificationCode: "123456" };
      mockPhoneService.verifyPhone.mockResolvedValue(undefined);

      // Execute
      await phoneController.verifyPhone(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockPhoneService.verifyPhone).toHaveBeenCalledWith(
        "123",
        "user123",
        "123456"
      );
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        null,
        "Phone number verified successfully"
      );
    });
  });

  describe("deletePhone", () => {
    it("should delete the phone and return success", async () => {
      // Setup
      mockRequest.params = { id: "123" };
      mockPhoneService.deletePhone.mockResolvedValue(undefined);

      // Execute
      await phoneController.deletePhone(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockPhoneService.deletePhone).toHaveBeenCalledWith(
        "123",
        "user123"
      );
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        null,
        "Phone number deleted successfully"
      );
    });
  });

  describe("setPhoneAsDefault", () => {
    it("should set the phone as default", async () => {
      // Setup
      mockRequest.params = { id: "123" };
      mockPhoneService.setPhoneAsDefault.mockResolvedValue(undefined);

      // Execute
      await phoneController.setPhoneAsDefault(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockPhoneService.setPhoneAsDefault).toHaveBeenCalledWith(
        "123",
        "user123"
      );
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        null,
        "Phone number set as default successfully"
      );
    });
  });
});
