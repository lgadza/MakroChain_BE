import { Response } from "express";
import { AddressController } from "../../controllers/address.controller.js";
import AddressService from "../../services/address.service.js";
import { AuthenticatedRequest } from "../../middleware/authMiddleware.js";
import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { sendSuccess } from "../../utils/responseUtil.js";

// Mock dependencies
jest.mock("../../services/address.service.js");
jest.mock("../../utils/logger.js", () => ({
  error: jest.fn(),
  info: jest.fn(),
}));
jest.mock("../../utils/responseUtil.js", () => ({
  sendSuccess: jest.fn(),
}));

describe("AddressController", () => {
  let addressController: AddressController;
  let mockAddressService: jest.Mocked<typeof AddressService>;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  const mockAddressData = {
    id: "123",
    userId: "user123",
    addressType: "HOME",
    street1: "123 Main St",
    street2: "Apt 4B",
    city: "Anytown",
    state: "State",
    postalCode: "12345",
    country: "Country",
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Setup mocks
    mockAddressService = {
      getUserAddresses: jest.fn(),
      getAddressById: jest.fn(),
      createAddress: jest.fn(),
      updateAddress: jest.fn(),
      deleteAddress: jest.fn(),
      setAddressAsDefault: jest.fn(),
      verifyAddressOwnership: jest.fn(),
    } as unknown as jest.Mocked<typeof AddressService>;

    addressController = new AddressController();
    (addressController as any).addressService = mockAddressService;

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

  describe("getUserAddresses", () => {
    it("should return paginated addresses with metadata", async () => {
      // Setup
      mockRequest.query = { addressType: "HOME", page: "2", limit: "10" };

      const mockAddresses = [
        mockAddressData,
        { ...mockAddressData, id: "456" },
      ];
      const mockResult = {
        addresses: mockAddresses,
        total: 25,
        pages: 3,
      };
      mockAddressService.getUserAddresses.mockResolvedValue(mockResult);

      // Execute
      await addressController.getUserAddresses(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockAddressService.getUserAddresses).toHaveBeenCalledWith(
        "user123",
        {
          addressType: "HOME",
          page: 2,
          limit: 10,
        }
      );
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        mockAddresses,
        "Addresses retrieved successfully",
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
      await addressController.getUserAddresses(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockAddressService.getUserAddresses).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect((error as any).statusCode).toBe(401);
      expect((error as any).message).toBe("Authentication required");
    });
  });

  describe("getAddressById", () => {
    it("should return address when user is owner", async () => {
      // Setup
      mockRequest.params = { id: "123" };
      mockAddressService.getAddressById.mockResolvedValue({
        ...mockAddressData,
        userId: "user123",
      });

      // Execute
      await addressController.getAddressById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockAddressService.getAddressById).toHaveBeenCalledWith("123");
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        { ...mockAddressData, userId: "user123" },
        "Address retrieved successfully"
      );
    });

    it("should return address when user is admin", async () => {
      // Setup
      mockRequest.params = { id: "123" };
      mockRequest.user = { userId: "adminUser", role: "ADMIN" };
      mockAddressService.getAddressById.mockResolvedValue({
        ...mockAddressData,
        userId: "user123", // Different from requesting user
      });

      // Execute
      await addressController.getAddressById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockAddressService.getAddressById).toHaveBeenCalledWith("123");
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        { ...mockAddressData, userId: "user123" },
        "Address retrieved successfully"
      );
    });

    it("should return forbidden error when non-owner non-admin requests", async () => {
      // Setup
      mockRequest.params = { id: "123" };
      mockRequest.user = { userId: "otherUser", role: "USER" };
      mockAddressService.getAddressById.mockResolvedValue({
        ...mockAddressData,
        userId: "user123", // Different from requesting user
      });

      // Execute
      await addressController.getAddressById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockAddressService.getAddressById).toHaveBeenCalledWith("123");
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect((error as any).statusCode).toBe(403);
    });
  });

  describe("createAddress", () => {
    it("should create and return a new address", async () => {
      // Setup
      mockRequest.body = {
        addressType: "SHIPPING",
        street1: "456 Market St",
        city: "Newtown",
        state: "State",
        postalCode: "67890",
        country: "Country",
      };
      mockAddressService.createAddress.mockResolvedValue({
        ...mockRequest.body,
        id: "789",
        userId: "user123",
      });

      // Execute
      await addressController.createAddress(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockAddressService.createAddress).toHaveBeenCalledWith(
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
        "Address created successfully",
        201
      );
    });

    it("should return unauthorized error when not authenticated", async () => {
      // Setup
      mockRequest.user = undefined;

      // Execute
      await addressController.createAddress(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockAddressService.createAddress).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect((error as any).statusCode).toBe(401);
    });
  });

  describe("updateAddress", () => {
    it("should update and return the address", async () => {
      // Setup
      mockRequest.params = { id: "123" };
      mockRequest.body = { street1: "789 New St", city: "Updated City" };
      mockAddressService.updateAddress.mockResolvedValue({
        ...mockAddressData,
        ...mockRequest.body,
      });

      // Execute
      await addressController.updateAddress(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockAddressService.updateAddress).toHaveBeenCalledWith(
        "123",
        "user123",
        mockRequest.body
      );
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        {
          ...mockAddressData,
          ...mockRequest.body,
        },
        "Address updated successfully"
      );
    });
  });

  describe("deleteAddress", () => {
    it("should delete the address and return success", async () => {
      // Setup
      mockRequest.params = { id: "123" };
      mockAddressService.deleteAddress.mockResolvedValue(undefined);

      // Execute
      await addressController.deleteAddress(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockAddressService.deleteAddress).toHaveBeenCalledWith(
        "123",
        "user123"
      );
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        null,
        "Address deleted successfully"
      );
    });
  });

  describe("setAddressAsDefault", () => {
    it("should set the address as default", async () => {
      // Setup
      mockRequest.params = { id: "123" };
      mockAddressService.setAddressAsDefault.mockResolvedValue(undefined);

      // Execute
      await addressController.setAddressAsDefault(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockAddressService.setAddressAsDefault).toHaveBeenCalledWith(
        "123",
        "user123"
      );
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        null,
        "Address set as default successfully"
      );
    });
  });
});
