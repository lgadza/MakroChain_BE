import { jest, expect, describe, it } from "@jest/globals";
import {
  createHarvestSchema,
  updateHarvestSchema,
  harvestQuerySchema,
  sellHarvestSchema,
  reserveHarvestSchema,
  idParamSchema,
} from "../../validation/harvest.validation.js";
import {
  QualityGrade,
  MarketStatus,
  UnitOfMeasure,
} from "../../constants/harvestTypes.js";

describe("Harvest Validation Schemas", () => {
  describe("createHarvestSchema", () => {
    it("should validate a valid harvest creation payload", () => {
      const validPayload = {
        farmerId: "123e4567-e89b-12d3-a456-426614174000",
        cropType: "Corn",
        variety: "Sweet Corn",
        quantity: 150.5,
        unitOfMeasure: UnitOfMeasure.KILOGRAM,
        qualityGrade: QualityGrade.A,
        harvestDate: new Date(),
        storageLocation: "Warehouse A",
        expectedPrice: 2.5,
        marketStatus: MarketStatus.AVAILABLE,
      };

      const result = createHarvestSchema.validate(validPayload);
      expect(result.error).toBeUndefined();
    });

    it("should validate when optional fields are omitted", () => {
      const validPayload = {
        farmerId: "123e4567-e89b-12d3-a456-426614174000",
        cropType: "Corn",
        quantity: 150.5,
        unitOfMeasure: UnitOfMeasure.KILOGRAM,
        qualityGrade: QualityGrade.A,
        harvestDate: new Date(),
        expectedPrice: 2.5,
      };

      const result = createHarvestSchema.validate(validPayload);
      expect(result.error).toBeUndefined();
    });

    it("should validate with null/empty for optional fields", () => {
      const validPayload = {
        farmerId: "123e4567-e89b-12d3-a456-426614174000",
        cropType: "Corn",
        variety: null,
        quantity: 150.5,
        unitOfMeasure: UnitOfMeasure.KILOGRAM,
        qualityGrade: QualityGrade.A,
        harvestDate: new Date(),
        storageLocation: "",
        expectedPrice: 2.5,
      };

      const result = createHarvestSchema.validate(validPayload);
      expect(result.error).toBeUndefined();
    });

    it("should reject when farmerId is invalid", () => {
      const invalidPayload = {
        farmerId: "invalid-uuid",
        cropType: "Corn",
        quantity: 150.5,
        unitOfMeasure: UnitOfMeasure.KILOGRAM,
        qualityGrade: QualityGrade.A,
        harvestDate: new Date(),
        expectedPrice: 2.5,
      };

      const result = createHarvestSchema.validate(invalidPayload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Farmer ID must be a valid UUID");
    });

    it("should reject when required fields are missing", () => {
      const invalidPayload = {
        farmerId: "123e4567-e89b-12d3-a456-426614174000",
        // Missing cropType
        variety: "Sweet Corn",
        // Missing quantity
        unitOfMeasure: UnitOfMeasure.KILOGRAM,
        // Missing qualityGrade
        // Missing harvestDate
        // Missing expectedPrice
      };

      const result = createHarvestSchema.validate(invalidPayload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("required");
    });

    it("should reject when quantity is negative", () => {
      const invalidPayload = {
        farmerId: "123e4567-e89b-12d3-a456-426614174000",
        cropType: "Corn",
        quantity: -5,
        unitOfMeasure: UnitOfMeasure.KILOGRAM,
        qualityGrade: QualityGrade.A,
        harvestDate: new Date(),
        expectedPrice: 2.5,
      };

      const result = createHarvestSchema.validate(invalidPayload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Quantity must be positive");
    });

    it("should reject when harvestDate is in future", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const invalidPayload = {
        farmerId: "123e4567-e89b-12d3-a456-426614174000",
        cropType: "Corn",
        quantity: 150.5,
        unitOfMeasure: UnitOfMeasure.KILOGRAM,
        qualityGrade: QualityGrade.A,
        harvestDate: tomorrow,
        expectedPrice: 2.5,
      };

      const result = createHarvestSchema.validate(invalidPayload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain(
        "Harvest date cannot be in the future"
      );
    });
  });

  describe("updateHarvestSchema", () => {
    it("should validate a valid harvest update payload", () => {
      const validPayload = {
        cropType: "Wheat",
        variety: "Winter Wheat",
        expectedPrice: 3.0,
      };

      const result = updateHarvestSchema.validate(validPayload);
      expect(result.error).toBeUndefined();
    });

    it("should reject an empty update payload", () => {
      const emptyPayload = {};

      const result = updateHarvestSchema.validate(emptyPayload);
      expect(result.error).toBeDefined();
      // Should require at least one field
      expect(result.error?.message).toContain("at least");
    });

    it("should reject invalid unit of measure", () => {
      const invalidPayload = {
        unitOfMeasure: "invalid-unit",
      };

      const result = updateHarvestSchema.validate(invalidPayload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain(
        "Unit of measure must be one of the supported values"
      );
    });
  });

  describe("harvestQuerySchema", () => {
    it("should validate valid query parameters", () => {
      const validQuery = {
        page: 2,
        limit: 20,
        sortBy: "harvestDate",
        sortOrder: "ASC",
        cropType: "Corn",
        qualityGrade: [QualityGrade.A, QualityGrade.B],
        fromDate: "2023-01-01",
        toDate: "2023-12-31",
        minQuantity: 100,
        maxQuantity: 200,
      };

      const result = harvestQuerySchema.validate(validQuery);
      expect(result.error).toBeUndefined();
    });

    it("should apply default values when not provided", () => {
      const minimalQuery = {};

      const result = harvestQuerySchema.validate(minimalQuery);
      expect(result.error).toBeUndefined();
      expect(result.value).toMatchObject({
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "DESC",
      });
    });

    it("should reject invalid sort fields", () => {
      const invalidQuery = {
        sortBy: "invalidField",
      };

      const result = harvestQuerySchema.validate(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain(
        "Sort by field must be one of the supported values"
      );
    });

    it("should reject when toDate is before fromDate", () => {
      const invalidQuery = {
        fromDate: "2023-12-31",
        toDate: "2023-01-01",
      };

      const result = harvestQuerySchema.validate(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain(
        "To date must be after from date"
      );
    });

    it("should reject when maxQuantity is less than minQuantity", () => {
      const invalidQuery = {
        minQuantity: 200,
        maxQuantity: 100,
      };

      const result = harvestQuerySchema.validate(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain(
        "Maximum quantity must be greater than minimum quantity"
      );
    });
  });

  describe("sellHarvestSchema", () => {
    it("should validate valid sell payload", () => {
      const validPayload = {
        buyerId: "123e4567-e89b-12d3-a456-426614174000",
        transactionId: "123e4567-e89b-12d3-a456-426614174001",
      };

      const result = sellHarvestSchema.validate(validPayload);
      expect(result.error).toBeUndefined();
    });

    it("should validate when transactionId is omitted", () => {
      const validPayload = {
        buyerId: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = sellHarvestSchema.validate(validPayload);
      expect(result.error).toBeUndefined();
    });

    it("should reject when buyerId is missing", () => {
      const invalidPayload = {
        transactionId: "123e4567-e89b-12d3-a456-426614174001",
      };

      const result = sellHarvestSchema.validate(invalidPayload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Buyer ID is required");
    });

    it("should reject when buyerId is invalid", () => {
      const invalidPayload = {
        buyerId: "invalid-uuid",
      };

      const result = sellHarvestSchema.validate(invalidPayload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Buyer ID must be a valid UUID");
    });
  });

  describe("reserveHarvestSchema", () => {
    it("should validate valid reserve payload with buyerId", () => {
      const validPayload = {
        buyerId: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = reserveHarvestSchema.validate(validPayload);
      expect(result.error).toBeUndefined();
    });

    it("should validate empty payload (no buyerId)", () => {
      const emptyPayload = {};

      const result = reserveHarvestSchema.validate(emptyPayload);
      expect(result.error).toBeUndefined();
    });

    it("should reject when buyerId is invalid", () => {
      const invalidPayload = {
        buyerId: "invalid-uuid",
      };

      const result = reserveHarvestSchema.validate(invalidPayload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Buyer ID must be a valid UUID");
    });
  });

  describe("idParamSchema", () => {
    it("should validate valid ID", () => {
      const validParams = {
        id: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = idParamSchema.validate(validParams);
      expect(result.error).toBeUndefined();
    });

    it("should reject when ID is missing", () => {
      const invalidParams = {};

      const result = idParamSchema.validate(invalidParams);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("ID is required");
    });

    it("should reject when ID is invalid", () => {
      const invalidParams = {
        id: "invalid-uuid",
      };

      const result = idParamSchema.validate(invalidParams);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("ID must be a valid UUID");
    });
  });
});
