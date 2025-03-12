import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { HarvestService } from "../../services/harvest.service.js";
import { HarvestRepository } from "../../repositories/harvest.repository.js";
import { MarketStatus } from "../../constants/harvestTypes.js";

// Mock the HarvestRepository
jest.mock("../../repositories/harvest.repository.js", () => {
  const mockRepository = {
    findById: jest.fn(),
    findByFarmerId: jest.fn(),
    findAvailableHarvests: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateMarketStatus: jest.fn(),
    search: jest.fn(),
  };
  return {
    HarvestRepository: jest.fn(() => mockRepository),
    __mockRepository: mockRepository,
  };
});

// Mock logger
jest.mock("../../utils/logger.js", () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

describe("HarvestService", () => {
  let harvestService: HarvestService;
  let mockHarvestRepository: any;

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
    createdAt: new Date(),
    updatedAt: new Date(),
    isAvailable: () => true,
    canBeSold: () => true,
  };

  const soldHarvest = {
    ...mockHarvest,
    marketStatus: MarketStatus.SOLD,
    buyerId: "buyer123",
    isAvailable: () => false,
    canBeSold: () => false,
  };

  beforeEach(() => {
    // Import mock repository to get access to mock functions
    const {
      __mockRepository,
    } = require("../../repositories/harvest.repository.js");
    mockHarvestRepository = __mockRepository;

    // Clear all mocks
    jest.clearAllMocks();

    // Create harvestService instance
    harvestService = new HarvestService();
  });

  describe("getHarvestById", () => {
    it("should return harvest when found", async () => {
      mockHarvestRepository.findById.mockResolvedValue(mockHarvest);

      const result = await harvestService.getHarvestById(mockHarvest.id);

      expect(mockHarvestRepository.findById).toHaveBeenCalledWith(
        mockHarvest.id
      );
      expect(result).toEqual(mockHarvest);
    });

    it("should throw NotFoundError when harvest not found", async () => {
      mockHarvestRepository.findById.mockResolvedValue(null);

      await expect(
        harvestService.getHarvestById("nonexistent-id")
      ).rejects.toThrow("Harvest with ID nonexistent-id not found");
    });
  });

  describe("getFarmerHarvests", () => {
    it("should return farmer harvests with pagination", async () => {
      const mockResponse = {
        rows: [mockHarvest],
        count: 1,
      };
      mockHarvestRepository.findByFarmerId.mockResolvedValue(mockResponse);

      const result = await harvestService.getFarmerHarvests("farmer123", {
        page: 2,
        limit: 5,
      });

      expect(mockHarvestRepository.findByFarmerId).toHaveBeenCalledWith(
        "farmer123",
        {
          limit: 5,
          offset: 5, // (page-1) * limit
          marketStatus: undefined,
          sortBy: "createdAt",
          sortOrder: "DESC",
        }
      );
      expect(result).toEqual({
        harvests: [mockHarvest],
        total: 1,
        pages: 1,
      });
    });

    it("should handle errors gracefully", async () => {
      mockHarvestRepository.findByFarmerId.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        harvestService.getFarmerHarvests("farmer123")
      ).rejects.toThrow("Failed to retrieve farmer harvests");
    });
  });

  describe("getAvailableHarvests", () => {
    it("should return available harvests with filters", async () => {
      const mockResponse = {
        rows: [mockHarvest],
        count: 1,
      };
      mockHarvestRepository.findAvailableHarvests.mockResolvedValue(
        mockResponse
      );

      const result = await harvestService.getAvailableHarvests(
        { page: 1, limit: 10 },
        { cropType: "Corn", minQuantity: 100 }
      );

      expect(mockHarvestRepository.findAvailableHarvests).toHaveBeenCalledWith({
        cropType: "Corn",
        limit: 10,
        offset: 0,
        minQuantity: 100,
        sortBy: "createdAt",
        sortOrder: "DESC",
      });
      expect(result).toEqual({
        harvests: [mockHarvest],
        total: 1,
        pages: 1,
      });
    });
  });

  describe("createHarvest", () => {
    it("should create a harvest with default market status", async () => {
      const harvestData = {
        farmerId: "farmer123",
        cropType: "Corn",
        quantity: 150.5,
        unitOfMeasure: "kg",
        qualityGrade: "A",
        harvestDate: new Date("2023-08-15"),
        expectedPrice: 2.5,
      };
      mockHarvestRepository.create.mockResolvedValue(mockHarvest);

      const result = await harvestService.createHarvest(harvestData);

      expect(mockHarvestRepository.create).toHaveBeenCalledWith({
        ...harvestData,
        marketStatus: MarketStatus.AVAILABLE,
      });
      expect(result).toEqual(mockHarvest);
    });

    it("should handle validation errors", async () => {
      const harvestData = {
        /* invalid data */
      };
      const error = new Error("Validation error");
      error.name = "SequelizeValidationError";

      mockHarvestRepository.create.mockRejectedValue(error);

      await expect(harvestService.createHarvest(harvestData)).rejects.toThrow(
        "Invalid harvest data"
      );
    });
  });

  describe("updateHarvest", () => {
    it("should update a harvest", async () => {
      const updateData = { expectedPrice: 3.0 };
      const updatedHarvest = { ...mockHarvest, ...updateData };

      mockHarvestRepository.findById.mockResolvedValue(mockHarvest);
      mockHarvestRepository.update.mockResolvedValue([1, [updatedHarvest]]);

      const result = await harvestService.updateHarvest(
        mockHarvest.id,
        updateData
      );

      expect(mockHarvestRepository.update).toHaveBeenCalledWith(
        mockHarvest.id,
        updateData
      );
      expect(result).toEqual(updatedHarvest);
    });

    it("should prevent updating protected fields of sold harvests", async () => {
      mockHarvestRepository.findById.mockResolvedValue(soldHarvest);

      await expect(
        harvestService.updateHarvest(soldHarvest.id, { farmerId: "new-farmer" })
      ).rejects.toThrow(
        "Cannot update core harvest details after it has been sold"
      );
    });

    it("should allow updating non-protected fields of sold harvests", async () => {
      const updateData = { storageLocation: "New Location" };
      const updatedHarvest = { ...soldHarvest, ...updateData };

      mockHarvestRepository.findById.mockResolvedValue(soldHarvest);
      mockHarvestRepository.update.mockResolvedValue([1, [updatedHarvest]]);

      const result = await harvestService.updateHarvest(
        soldHarvest.id,
        updateData
      );

      expect(mockHarvestRepository.update).toHaveBeenCalledWith(
        soldHarvest.id,
        updateData
      );
      expect(result).toEqual(updatedHarvest);
    });
  });

  describe("deleteHarvest", () => {
    it("should delete an available harvest", async () => {
      mockHarvestRepository.findById.mockResolvedValue(mockHarvest);
      mockHarvestRepository.delete.mockResolvedValue(1);

      const result = await harvestService.deleteHarvest(mockHarvest.id);

      expect(mockHarvestRepository.delete).toHaveBeenCalledWith(mockHarvest.id);
      expect(result).toBe(true);
    });

    it("should prevent deleting sold harvests", async () => {
      mockHarvestRepository.findById.mockResolvedValue(soldHarvest);

      await expect(
        harvestService.deleteHarvest(soldHarvest.id)
      ).rejects.toThrow("Cannot delete a harvest that has been sold");
    });
  });

  describe("markAsSold", () => {
    it("should mark an available harvest as sold", async () => {
      const buyerId = "buyer123";
      const transactionId = "transaction123";
      const soldHarvest = {
        ...mockHarvest,
        marketStatus: MarketStatus.SOLD,
        buyerId,
        transactionId,
      };

      mockHarvestRepository.findById.mockResolvedValue(mockHarvest);
      mockHarvestRepository.updateMarketStatus.mockResolvedValue([
        1,
        [soldHarvest],
      ]);

      const result = await harvestService.markAsSold(
        mockHarvest.id,
        buyerId,
        transactionId
      );

      expect(mockHarvestRepository.updateMarketStatus).toHaveBeenCalledWith(
        mockHarvest.id,
        MarketStatus.SOLD,
        { buyerId, transactionId }
      );
      expect(result).toEqual(soldHarvest);
    });

    it("should throw ConflictError if harvest is not available for sale", async () => {
      const nonSellableHarvest = {
        ...mockHarvest,
        marketStatus: MarketStatus.PROCESSING,
        canBeSold: () => false,
      };

      mockHarvestRepository.findById.mockResolvedValue(nonSellableHarvest);

      await expect(
        harvestService.markAsSold(nonSellableHarvest.id, "buyer123")
      ).rejects.toThrow("Harvest is not available for sale");
    });
  });

  describe("markAsReserved", () => {
    it("should mark an available harvest as reserved", async () => {
      const buyerId = "buyer123";
      const reservedHarvest = {
        ...mockHarvest,
        marketStatus: MarketStatus.RESERVED,
        buyerId,
      };

      mockHarvestRepository.findById.mockResolvedValue(mockHarvest);
      mockHarvestRepository.updateMarketStatus.mockResolvedValue([
        1,
        [reservedHarvest],
      ]);

      const result = await harvestService.markAsReserved(
        mockHarvest.id,
        buyerId
      );

      expect(mockHarvestRepository.updateMarketStatus).toHaveBeenCalledWith(
        mockHarvest.id,
        MarketStatus.RESERVED,
        { buyerId }
      );
      expect(result).toEqual(reservedHarvest);
    });

    it("should throw ConflictError if harvest is not available", async () => {
      const nonAvailableHarvest = {
        ...mockHarvest,
        marketStatus: MarketStatus.SOLD,
      };

      mockHarvestRepository.findById.mockResolvedValue(nonAvailableHarvest);

      await expect(
        harvestService.markAsReserved(nonAvailableHarvest.id)
      ).rejects.toThrow("Harvest cannot be reserved");
    });
  });

  describe("searchHarvests", () => {
    it("should search harvests with filters and pagination", async () => {
      const mockResponse = {
        rows: [mockHarvest],
        count: 1,
      };
      mockHarvestRepository.search.mockResolvedValue(mockResponse);

      const filters = {
        cropType: "Corn",
        marketStatus: [MarketStatus.AVAILABLE],
      };
      const pagination = { page: 2, limit: 5 };

      const result = await harvestService.searchHarvests(filters, pagination);

      expect(mockHarvestRepository.search).toHaveBeenCalledWith(filters, {
        limit: 5,
        offset: 5, // (page-1) * limit
        sortBy: "createdAt",
        sortOrder: "DESC",
      });
      expect(result).toEqual({
        harvests: [mockHarvest],
        total: 1,
        pages: 1,
      });
    });
  });
});
