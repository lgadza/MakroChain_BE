import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { Op } from "sequelize";
import { HarvestRepository } from "../../repositories/harvest.repository.js";
import { MarketStatus } from "../../constants/harvestTypes.js";

// Mock Harvest model
const mockHarvestFunctions = {
  findByPk: jest.fn(),
  findAndCountAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

// Mock the model before importing
jest.mock("../../models/harvest.model.js", () => mockHarvestFunctions);

describe("HarvestRepository", () => {
  let harvestRepository: HarvestRepository;
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
  };

  beforeEach(() => {
    harvestRepository = new HarvestRepository();
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("should find a harvest by id", async () => {
      mockHarvestFunctions.findByPk.mockResolvedValue(mockHarvest);

      const result = await harvestRepository.findById(mockHarvest.id);

      expect(mockHarvestFunctions.findByPk).toHaveBeenCalledWith(
        mockHarvest.id
      );
      expect(result).toEqual(mockHarvest);
    });

    it("should return null when harvest not found", async () => {
      mockHarvestFunctions.findByPk.mockResolvedValue(null);

      const result = await harvestRepository.findById("nonexistent-id");

      expect(mockHarvestFunctions.findByPk).toHaveBeenCalledWith(
        "nonexistent-id"
      );
      expect(result).toBeNull();
    });
  });

  describe("findByFarmerId", () => {
    it("should find harvests by farmer id with default options", async () => {
      const mockResult = {
        count: 1,
        rows: [mockHarvest],
      };
      mockHarvestFunctions.findAndCountAll.mockResolvedValue(mockResult);

      const result = await harvestRepository.findByFarmerId("farmer123");

      expect(mockHarvestFunctions.findAndCountAll).toHaveBeenCalledWith({
        where: { farmerId: "farmer123" },
        limit: 10,
        offset: 0,
        order: [["createdAt", "DESC"]],
      });
      expect(result).toEqual(mockResult);
    });

    it("should find harvests by farmer id with custom options", async () => {
      const mockResult = {
        count: 1,
        rows: [mockHarvest],
      };
      mockHarvestFunctions.findAndCountAll.mockResolvedValue(mockResult);

      const result = await harvestRepository.findByFarmerId("farmer123", {
        limit: 20,
        offset: 20,
        marketStatus: MarketStatus.SOLD,
        sortBy: "harvestDate",
        sortOrder: "ASC",
      });

      expect(mockHarvestFunctions.findAndCountAll).toHaveBeenCalledWith({
        where: {
          farmerId: "farmer123",
          marketStatus: MarketStatus.SOLD,
        },
        limit: 20,
        offset: 20,
        order: [["harvestDate", "ASC"]],
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe("findAvailableHarvests", () => {
    it("should find available harvests with default options", async () => {
      const mockResult = {
        count: 1,
        rows: [mockHarvest],
      };
      mockHarvestFunctions.findAndCountAll.mockResolvedValue(mockResult);

      const result = await harvestRepository.findAvailableHarvests();

      expect(mockHarvestFunctions.findAndCountAll).toHaveBeenCalledWith({
        where: { marketStatus: MarketStatus.AVAILABLE },
        limit: 10,
        offset: 0,
        order: [["createdAt", "DESC"]],
      });
      expect(result).toEqual(mockResult);
    });

    it("should find available harvests with crop type filter", async () => {
      const mockResult = {
        count: 1,
        rows: [mockHarvest],
      };
      mockHarvestFunctions.findAndCountAll.mockResolvedValue(mockResult);

      const result = await harvestRepository.findAvailableHarvests({
        cropType: "Corn",
      });

      expect(mockHarvestFunctions.findAndCountAll).toHaveBeenCalledWith({
        where: {
          marketStatus: MarketStatus.AVAILABLE,
          cropType: "Corn",
        },
        limit: 10,
        offset: 0,
        order: [["createdAt", "DESC"]],
      });
      expect(result).toEqual(mockResult);
    });

    it("should find available harvests with quantity range", async () => {
      const mockResult = {
        count: 1,
        rows: [mockHarvest],
      };
      mockHarvestFunctions.findAndCountAll.mockResolvedValue(mockResult);

      const result = await harvestRepository.findAvailableHarvests({
        minQuantity: 100,
        maxQuantity: 200,
      });

      expect(mockHarvestFunctions.findAndCountAll).toHaveBeenCalledWith({
        where: {
          marketStatus: MarketStatus.AVAILABLE,
          quantity: {
            [Op.gte]: 100,
            [Op.lte]: 200,
          },
        },
        limit: 10,
        offset: 0,
        order: [["createdAt", "DESC"]],
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe("create", () => {
    it("should create a new harvest", async () => {
      const harvestData = {
        farmerId: "farmer123",
        cropType: "Corn",
        quantity: 150.5,
        unitOfMeasure: "kg",
        qualityGrade: "A",
        harvestDate: new Date("2023-08-15"),
        expectedPrice: 2.5,
      };
      mockHarvestFunctions.create.mockResolvedValue(mockHarvest);

      const result = await harvestRepository.create(harvestData);

      expect(mockHarvestFunctions.create).toHaveBeenCalledWith(harvestData);
      expect(result).toEqual(mockHarvest);
    });
  });

  describe("update", () => {
    it("should update a harvest", async () => {
      const updateData = {
        expectedPrice: 3.0,
      };
      mockHarvestFunctions.update.mockResolvedValue([
        1,
        [{ ...mockHarvest, ...updateData }],
      ]);

      const result = await harvestRepository.update(mockHarvest.id, updateData);

      expect(mockHarvestFunctions.update).toHaveBeenCalledWith(updateData, {
        where: { id: mockHarvest.id },
        returning: true,
      });
      expect(result[0]).toBe(1);
      expect(result[1][0]).toEqual({ ...mockHarvest, ...updateData });
    });
  });

  describe("delete", () => {
    it("should delete a harvest", async () => {
      mockHarvestFunctions.destroy.mockResolvedValue(1);

      const result = await harvestRepository.delete(mockHarvest.id);

      expect(mockHarvestFunctions.destroy).toHaveBeenCalledWith({
        where: { id: mockHarvest.id },
      });
      expect(result).toBe(1);
    });
  });

  describe("updateMarketStatus", () => {
    it("should update market status", async () => {
      const newStatus = MarketStatus.SOLD;
      const relatedData = { buyerId: "buyer123" };
      mockHarvestFunctions.update.mockResolvedValue([
        1,
        [{ ...mockHarvest, marketStatus: newStatus, ...relatedData }],
      ]);

      const result = await harvestRepository.updateMarketStatus(
        mockHarvest.id,
        newStatus,
        relatedData
      );

      expect(mockHarvestFunctions.update).toHaveBeenCalledWith(
        { marketStatus: newStatus, ...relatedData },
        {
          where: { id: mockHarvest.id },
          returning: true,
        }
      );
      expect(result[0]).toBe(1);
      expect(result[1][0]).toEqual({
        ...mockHarvest,
        marketStatus: newStatus,
        ...relatedData,
      });
    });
  });

  describe("search", () => {
    it("should search with multiple criteria", async () => {
      const mockResult = {
        count: 1,
        rows: [mockHarvest],
      };
      mockHarvestFunctions.findAndCountAll.mockResolvedValue(mockResult);

      const criteria = {
        cropType: "Corn",
        qualityGrade: ["A", "B"],
        marketStatus: [MarketStatus.AVAILABLE],
        fromDate: new Date("2023-01-01"),
        toDate: new Date("2023-12-31"),
        farmerId: "farmer123",
      };

      const result = await harvestRepository.search(criteria);

      expect(mockHarvestFunctions.findAndCountAll).toHaveBeenCalledWith({
        where: {
          cropType: { [Op.iLike]: "%Corn%" },
          qualityGrade: { [Op.in]: ["A", "B"] },
          marketStatus: { [Op.in]: [MarketStatus.AVAILABLE] },
          harvestDate: {
            [Op.gte]: criteria.fromDate,
            [Op.lte]: criteria.toDate,
          },
          farmerId: "farmer123",
        },
        limit: 10,
        offset: 0,
        order: [["createdAt", "DESC"]],
      });
      expect(result).toEqual(mockResult);
    });
  });
});
