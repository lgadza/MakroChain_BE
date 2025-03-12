import { Request, Response } from "express";
import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { HarvestController } from "../../controllers/harvest.controller.js";
import { AuthenticatedRequest } from "../../middleware/authMiddleware.js";
import { Roles } from "../../constants/roles.js";
import { MarketStatus } from "../../constants/harvestTypes.js";

// Mock dependencies
jest.mock("../../services/harvest.service.js", () => ({
  __esModule: true,
  default: {
    getHarvestById: jest.fn(),
    getFarmerHarvests: jest.fn(),
    getAvailableHarvests: jest.fn(),
    createHarvest: jest.fn(),
    updateHarvest: jest.fn(),
    deleteHarvest: jest.fn(),
    markAsSold: jest.fn(),
    markAsReserved: jest.fn(),
    searchHarvests: jest.fn(),
  },
}));

jest.mock("../../utils/logger.js", () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

jest.mock("../../utils/responseUtil.js", () => ({
  sendSuccess: jest.fn(),
}));

jest.mock("../../utils/errorUtils.js", () => ({
  ErrorFactory: {
    forbidden: jest.fn((msg) => {
      const error = new Error(msg);
      error.name = "ForbiddenError";
      return error;
    }),
    notFound: jest.fn((msg) => {
      const error = new Error(msg);
      error.name = "NotFoundError";
      return error;
    }),
    conflict: jest.fn((msg) => {
      const error = new Error(msg);
      error.name = "ConflictError";
      return error;
    }),
    internal: jest.fn((msg) => {
      const error = new Error(msg);
      error.name = "InternalServerError";
      return error;
    }),
  },
}));

// Get mocked service
import HarvestService from "../../services/harvest.service.js";
import { sendSuccess } from "../../utils/responseUtil.js";
import { ErrorFactory } from "../../utils/errorUtils.js";

describe("HarvestController", () => {
  let harvestController: HarvestController;
  let mockRequest: Partial<Request>;
  let mockAuthRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  const mockHarvest = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    farmerId: "farmer123",
    cropType: "Corn",
    variety: "Sweet Corn",
    quantity: 150.5,
    unitOfMeasure: "kg",
    qualityGrade: "A",
    harvestDate: new Date("2023-08-15"),
    storageLocation: "Warehouse A",
    expectedPrice: 2.5,
    marketStatus: MarketStatus.AVAILABLE,
    buyerId: null,
    transactionId: null,
    blockchainHash: null,
    createdAt: new Date("2023-08-15T10:30:00Z"),
    updatedAt: new Date("2023-08-15T10:30:00Z"),
  };

  beforeEach(() => {
    harvestController = new HarvestController();

    mockRequest = {
      params: {},
      query: {},
      body: {},
    };

    mockAuthRequest = {
      ...mockRequest,
      user: {
        userId: "farmer123",
        role: Roles.FARMER,
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
    jest.clearAllMocks();
    (sendSuccess as jest.Mock).mockReset();
  });

  describe("getAllHarvests", () => {
    it("should return paginated harvests with filters", async () => {
      mockRequest.query = {
        page: "2",
        limit: "10",
        cropType: "Corn",
        marketStatus: "AVAILABLE",
      };

      const mockResult = {
        harvests: [mockHarvest],
        total: 1,
        pages: 1,
      };

      (HarvestService.searchHarvests as jest.Mock).mockResolvedValue(
        mockResult
      );

      await harvestController.getAllHarvests(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(HarvestService.searchHarvests).toHaveBeenCalledWith(
        expect.objectContaining({
          cropType: "Corn",
          marketStatus: ["AVAILABLE"],
        }),
        expect.objectContaining({
          page: 2,
          limit: 10,
          sortBy: "createdAt",
          sortOrder: "DESC",
        })
      );

      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        expect.any(Array),
        "Harvests retrieved successfully",
        200,
        expect.objectContaining({
          pagination: expect.any(Object),
        })
      );
    });

    it("should handle errors", async () => {
      (HarvestService.searchHarvests as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await harvestController.getAllHarvests(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getAvailableHarvests", () => {
    it("should return available harvests with filters", async () => {
      mockRequest.query = {
        page: "1",
        limit: "20",
        cropType: "Corn",
      };

      const mockResult = {
        harvests: [mockHarvest],
        total: 1,
        pages: 1,
      };

      (HarvestService.getAvailableHarvests as jest.Mock).mockResolvedValue(
        mockResult
      );

      await harvestController.getAvailableHarvests(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(HarvestService.getAvailableHarvests).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 20,
          sortBy: "createdAt",
          sortOrder: "DESC",
        }),
        expect.objectContaining({
          cropType: "Corn",
        })
      );

      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        expect.any(Array),
        "Available harvests retrieved successfully",
        200,
        expect.objectContaining({
          pagination: expect.any(Object),
        })
      );
    });

    it("should handle errors", async () => {
      (HarvestService.getAvailableHarvests as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await harvestController.getAvailableHarvests(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getHarvestById", () => {
    it("should return a harvest by id", async () => {
      mockRequest.params = {
        id: mockHarvest.id,
      };

      (HarvestService.getHarvestById as jest.Mock).mockResolvedValue(
        mockHarvest
      );

      await harvestController.getHarvestById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(HarvestService.getHarvestById).toHaveBeenCalledWith(
        mockHarvest.id
      );
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        expect.objectContaining({
          id: mockHarvest.id,
          farmerId: mockHarvest.farmerId,
          cropType: mockHarvest.cropType,
        }),
        "Harvest retrieved successfully"
      );
    });

    it("should handle errors", async () => {
      mockRequest.params = { id: "nonexistent-id" };
      const error = new Error("Harvest not found");
      (HarvestService.getHarvestById as jest.Mock).mockRejectedValue(error);

      await harvestController.getHarvestById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getFarmerHarvests", () => {
    it("should return harvests for a specific farmer", async () => {
      mockRequest.params = { farmerId: "farmer123" };
      mockRequest.query = {
        page: "1",
        limit: "10",
        sortBy: "harvestDate",
        sortOrder: "DESC",
      };

      const mockResult = {
        harvests: [mockHarvest],
        total: 1,
        pages: 1,
      };

      (HarvestService.getFarmerHarvests as jest.Mock).mockResolvedValue(
        mockResult
      );

      await harvestController.getFarmerHarvests(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(HarvestService.getFarmerHarvests).toHaveBeenCalledWith(
        "farmer123",
        expect.objectContaining({
          page: 1,
          limit: 10,
          sortBy: "harvestDate",
          sortOrder: "DESC",
        }),
        expect.any(Object)
      );

      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        expect.any(Array),
        "Farmer harvests retrieved successfully",
        200,
        expect.objectContaining({
          pagination: expect.any(Object),
        })
      );
    });

    it("should handle errors", async () => {
      mockRequest.params = { farmerId: "nonexistent-farmer" };
      const error = new Error("Farmer not found");
      (HarvestService.getFarmerHarvests as jest.Mock).mockRejectedValue(error);

      await harvestController.getFarmerHarvests(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("createHarvest", () => {
    it("should create a new harvest when admin/manager", async () => {
      const adminAuthRequest = {
        ...mockRequest,
        user: {
          userId: "admin123",
          role: Roles.ADMIN,
        },
        body: {
          farmerId: "farmer123",
          cropType: "Corn",
          quantity: 150,
          unitOfMeasure: "kg",
          qualityGrade: "A",
          harvestDate: "2023-08-15",
          expectedPrice: 2.5,
        },
      };

      (HarvestService.createHarvest as jest.Mock).mockResolvedValue(
        mockHarvest
      );

      await harvestController.createHarvest(
        adminAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(HarvestService.createHarvest).toHaveBeenCalledWith(
        expect.objectContaining({
          farmerId: "farmer123",
          cropType: "Corn",
          harvestDate: expect.any(Date),
        })
      );

      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        expect.objectContaining({
          id: mockHarvest.id,
        }),
        "Harvest created successfully",
        201
      );
    });

    it("should force farmerId to be the current user when farmer role", async () => {
      mockAuthRequest.body = {
        farmerId: "someone-else", // This should be overridden
        cropType: "Corn",
        quantity: 150,
        unitOfMeasure: "kg",
        qualityGrade: "A",
        harvestDate: "2023-08-15",
        expectedPrice: 2.5,
      };

      (HarvestService.createHarvest as jest.Mock).mockResolvedValue({
        ...mockHarvest,
        farmerId: "farmer123", // The actual user ID
      });

      await harvestController.createHarvest(
        mockAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Check that farmerId was overridden with the user's ID
      expect(HarvestService.createHarvest).toHaveBeenCalledWith(
        expect.objectContaining({
          farmerId: "farmer123", // Should be the user ID, not "someone-else"
          cropType: "Corn",
        })
      );
    });

    it("should handle validation errors", async () => {
      mockAuthRequest.body = {
        // Missing required fields
      };

      const error = new Error("Validation error");
      (HarvestService.createHarvest as jest.Mock).mockRejectedValue(error);

      await harvestController.createHarvest(
        mockAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("updateHarvest", () => {
    it("should update harvest when admin role", async () => {
      const adminAuthRequest = {
        ...mockRequest,
        user: {
          userId: "admin123",
          role: Roles.ADMIN,
        },
        params: {
          id: mockHarvest.id,
        },
        body: {
          expectedPrice: 3.0,
        },
      };

      const updatedHarvest = { ...mockHarvest, expectedPrice: 3.0 };
      (HarvestService.updateHarvest as jest.Mock).mockResolvedValue(
        updatedHarvest
      );

      await harvestController.updateHarvest(
        adminAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(HarvestService.updateHarvest).toHaveBeenCalledWith(
        mockHarvest.id,
        expect.objectContaining({
          expectedPrice: 3.0,
        })
      );

      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        expect.objectContaining({
          id: mockHarvest.id,
          expectedPrice: 3.0,
        }),
        "Harvest updated successfully"
      );
    });

    it("should check ownership before updating for farmer role", async () => {
      // User is trying to update a harvest they don't own
      mockAuthRequest.params = { id: mockHarvest.id };
      mockAuthRequest.body = { expectedPrice: 3.0 };
      mockAuthRequest.user = {
        userId: "different-farmer",
        role: Roles.FARMER,
      };

      // Mock that the harvest belongs to farmer123, not different-farmer
      (HarvestService.getHarvestById as jest.Mock).mockResolvedValue({
        ...mockHarvest,
        farmerId: "farmer123",
      });

      await harvestController.updateHarvest(
        mockAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(HarvestService.getHarvestById).toHaveBeenCalledWith(
        mockHarvest.id
      );
      expect(HarvestService.updateHarvest).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "You can only update your own harvests",
        })
      );
    });

    it("should allow updating when farmer owns the harvest", async () => {
      mockAuthRequest.params = { id: mockHarvest.id };
      mockAuthRequest.body = { expectedPrice: 3.0 };
      // User ID matches the farmerId
      mockAuthRequest.user = {
        userId: "farmer123",
        role: Roles.FARMER,
      };

      (HarvestService.getHarvestById as jest.Mock).mockResolvedValue({
        ...mockHarvest,
        farmerId: "farmer123",
      });

      const updatedHarvest = { ...mockHarvest, expectedPrice: 3.0 };
      (HarvestService.updateHarvest as jest.Mock).mockResolvedValue(
        updatedHarvest
      );

      await harvestController.updateHarvest(
        mockAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(HarvestService.getHarvestById).toHaveBeenCalledWith(
        mockHarvest.id
      );
      expect(HarvestService.updateHarvest).toHaveBeenCalledWith(
        mockHarvest.id,
        expect.objectContaining({
          expectedPrice: 3.0,
        })
      );
    });
  });

  describe("deleteHarvest", () => {
    it("should delete harvest when admin role", async () => {
      const adminAuthRequest = {
        ...mockRequest,
        user: {
          userId: "admin123",
          role: Roles.ADMIN,
        },
        params: {
          id: mockHarvest.id,
        },
      };

      (HarvestService.deleteHarvest as jest.Mock).mockResolvedValue(true);

      await harvestController.deleteHarvest(
        adminAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(HarvestService.deleteHarvest).toHaveBeenCalledWith(mockHarvest.id);
      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        null,
        "Harvest deleted successfully"
      );
    });

    it("should check ownership before deleting for farmer role", async () => {
      // User is trying to delete a harvest they don't own
      mockAuthRequest.params = { id: mockHarvest.id };
      mockAuthRequest.user = {
        userId: "different-farmer",
        role: Roles.FARMER,
      };

      // Mock that the harvest belongs to farmer123, not different-farmer
      (HarvestService.getHarvestById as jest.Mock).mockResolvedValue({
        ...mockHarvest,
        farmerId: "farmer123",
      });

      await harvestController.deleteHarvest(
        mockAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(HarvestService.getHarvestById).toHaveBeenCalledWith(
        mockHarvest.id
      );
      expect(HarvestService.deleteHarvest).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "You can only delete your own harvests",
        })
      );
    });

    it("should handle service errors", async () => {
      mockAuthRequest.params = { id: mockHarvest.id };
      const error = new Error("Cannot delete sold harvest");
      (HarvestService.getHarvestById as jest.Mock).mockResolvedValue(
        mockHarvest
      );
      (HarvestService.deleteHarvest as jest.Mock).mockRejectedValue(error);

      await harvestController.deleteHarvest(
        mockAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("markHarvestAsSold", () => {
    it("should mark harvest as sold when admin role", async () => {
      const adminAuthRequest = {
        ...mockRequest,
        user: {
          userId: "admin123",
          role: Roles.ADMIN,
        },
        params: {
          id: mockHarvest.id,
        },
        body: {
          buyerId: "buyer123",
          transactionId: "tx123",
        },
      };

      const soldHarvest = {
        ...mockHarvest,
        marketStatus: MarketStatus.SOLD,
        buyerId: "buyer123",
        transactionId: "tx123",
      };
      (HarvestService.markAsSold as jest.Mock).mockResolvedValue(soldHarvest);

      await harvestController.markHarvestAsSold(
        adminAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(HarvestService.markAsSold).toHaveBeenCalledWith(
        mockHarvest.id,
        "buyer123",
        "tx123"
      );

      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        expect.objectContaining({
          id: mockHarvest.id,
          marketStatus: MarketStatus.SOLD,
          buyerId: "buyer123",
          transactionId: "tx123",
        }),
        "Harvest marked as sold successfully"
      );
    });

    it("should check ownership before marking as sold for farmer role", async () => {
      // User is trying to sell a harvest they don't own
      mockAuthRequest.params = { id: mockHarvest.id };
      mockAuthRequest.body = { buyerId: "buyer123" };
      mockAuthRequest.user = {
        userId: "different-farmer",
        role: Roles.FARMER,
      };

      // Mock that the harvest belongs to farmer123, not different-farmer
      (HarvestService.getHarvestById as jest.Mock).mockResolvedValue({
        ...mockHarvest,
        farmerId: "farmer123",
      });

      await harvestController.markHarvestAsSold(
        mockAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(HarvestService.getHarvestById).toHaveBeenCalledWith(
        mockHarvest.id
      );
      expect(HarvestService.markAsSold).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "You can only sell your own harvests",
        })
      );
    });
  });

  describe("markHarvestAsReserved", () => {
    it("should mark harvest as reserved when admin role", async () => {
      const adminAuthRequest = {
        ...mockRequest,
        user: {
          userId: "admin123",
          role: Roles.ADMIN,
        },
        params: {
          id: mockHarvest.id,
        },
        body: {
          buyerId: "buyer123",
        },
      };

      const reservedHarvest = {
        ...mockHarvest,
        marketStatus: MarketStatus.RESERVED,
        buyerId: "buyer123",
      };
      (HarvestService.markAsReserved as jest.Mock).mockResolvedValue(
        reservedHarvest
      );

      await harvestController.markHarvestAsReserved(
        adminAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(HarvestService.markAsReserved).toHaveBeenCalledWith(
        mockHarvest.id,
        "buyer123"
      );

      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        expect.objectContaining({
          id: mockHarvest.id,
          marketStatus: MarketStatus.RESERVED,
          buyerId: "buyer123",
        }),
        "Harvest marked as reserved successfully"
      );
    });

    it("should allow marking as reserved without buyerId", async () => {
      mockAuthRequest.params = { id: mockHarvest.id };
      mockAuthRequest.body = {}; // No buyerId specified

      // Mock that the harvest belongs to the current farmer
      (HarvestService.getHarvestById as jest.Mock).mockResolvedValue({
        ...mockHarvest,
        farmerId: "farmer123",
      });

      const reservedHarvest = {
        ...mockHarvest,
        marketStatus: MarketStatus.RESERVED,
      };
      (HarvestService.markAsReserved as jest.Mock).mockResolvedValue(
        reservedHarvest
      );

      await harvestController.markHarvestAsReserved(
        mockAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(HarvestService.markAsReserved).toHaveBeenCalledWith(
        mockHarvest.id,
        undefined
      );
    });
  });

  describe("getBuyerHarvests", () => {
    it("should return harvests for a specific buyer", async () => {
      mockRequest.params = { buyerId: "buyer123" };
      mockRequest.query = {
        page: "1",
        limit: "10",
        sortBy: "harvestDate",
        sortOrder: "DESC",
      };

      const buyerHarvests = [
        {
          ...mockHarvest,
          marketStatus: MarketStatus.SOLD,
          buyerId: "buyer123",
        },
      ];

      const mockResult = {
        harvests: buyerHarvests,
        total: 1,
        pages: 1,
      };

      (HarvestService.searchHarvests as jest.Mock).mockResolvedValue(
        mockResult
      );

      await harvestController.getBuyerHarvests(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(HarvestService.searchHarvests).toHaveBeenCalledWith(
        expect.objectContaining({
          buyerId: "buyer123",
        }),
        expect.objectContaining({
          page: 1,
          limit: 10,
          sortBy: "harvestDate",
          sortOrder: "DESC",
        })
      );

      expect(sendSuccess).toHaveBeenCalledWith(
        mockResponse as Response,
        expect.any(Array),
        "Buyer harvests retrieved successfully",
        200,
        expect.objectContaining({
          pagination: expect.any(Object),
        })
      );
    });
  });
});
