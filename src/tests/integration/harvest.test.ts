import {
  jest,
  expect,
  describe,
  it,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import { sequelize } from "../../models/index.js";
import User from "../../models/user.model.js";
import Harvest from "../../models/harvest.model.js";
import { generateAccessToken } from "../../utils/jwt.util.js";
import {
  MarketStatus,
  QualityGrade,
  UnitOfMeasure,
} from "../../constants/harvestTypes.js";
import { Roles } from "../../constants/roles.js";

// Mock JWT utils
jest.mock("../../utils/jwt.util.js", () => ({
  generateAccessToken: jest.fn().mockReturnValue("mock-token"),
  verifyAccessToken: jest.fn().mockReturnValue({
    userId: "farmer123",
    role: "FARMER",
  }),
}));

describe("Harvest API Integration Tests", () => {
  let farmerToken: string;
  let adminToken: string;
  let buyerToken: string;
  let harvestId: string;

  const mockUsers = {
    farmer: {
      id: "farmer123",
      email: "farmer@example.com",
      firstName: "Farmer",
      lastName: "One",
      role: Roles.FARMER,
    },
    admin: {
      id: "admin123",
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      role: Roles.ADMIN,
    },
    buyer: {
      id: "buyer123",
      email: "buyer@example.com",
      firstName: "Buyer",
      lastName: "One",
      role: Roles.USER,
    },
  };

  const mockHarvest = {
    farmerId: mockUsers.farmer.id,
    cropType: "Corn",
    variety: "Sweet Corn",
    quantity: 150.5,
    unitOfMeasure: UnitOfMeasure.KILOGRAM,
    qualityGrade: QualityGrade.A,
    harvestDate: new Date("2023-01-15"),
    storageLocation: "Warehouse A",
    expectedPrice: 2.5,
    marketStatus: MarketStatus.AVAILABLE,
  };

  // Mock sequelize models
  jest.mock("../../models/user.model.js", () => ({
    findByPk: jest.fn().mockImplementation((id) => {
      if (id === "farmer123") return Promise.resolve(mockUsers.farmer);
      if (id === "admin123") return Promise.resolve(mockUsers.admin);
      if (id === "buyer123") return Promise.resolve(mockUsers.buyer);
      return Promise.resolve(null);
    }),
  }));

  jest.mock("../../models/harvest.model.js", () => ({
    findByPk: jest.fn().mockImplementation((id) => {
      if (id === "harvest123") {
        return Promise.resolve({
          ...mockHarvest,
          id: "harvest123",
          canBeSold: () => true,
        });
      }
      return Promise.resolve(null);
    }),
    findAndCountAll: jest.fn().mockResolvedValue({
      rows: [{ ...mockHarvest, id: "harvest123" }],
      count: 1,
    }),
    create: jest.fn().mockImplementation((data) => {
      return Promise.resolve({
        ...mockHarvest,
        ...data,
        id: "harvest123",
      });
    }),
    update: jest.fn().mockImplementation(() => {
      return Promise.resolve([
        1,
        [{ ...mockHarvest, id: "harvest123", expectedPrice: 3.0 }],
      ]);
    }),
    destroy: jest.fn().mockResolvedValue(1),
  }));

  beforeAll(async () => {
    // Generate tokens for different roles
    farmerToken = `Bearer ${generateAccessToken({
      userId: mockUsers.farmer.id,
      role: mockUsers.farmer.role,
    })}`;
    adminToken = `Bearer ${generateAccessToken({
      userId: mockUsers.admin.id,
      role: mockUsers.admin.role,
    })}`;
    buyerToken = `Bearer ${generateAccessToken({
      userId: mockUsers.buyer.id,
      role: mockUsers.buyer.role,
    })}`;

    // Set harvestId for tests
    harvestId = "harvest123";
  });

  describe("GET /api/harvests", () => {
    it("should fetch harvests with admin token", async () => {
      const response = await request(app)
        .get("/api/harvests")
        .set("Authorization", adminToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it("should reject unauthorized access", async () => {
      const response = await request(app).get("/api/harvests");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/harvests/available", () => {
    it("should fetch available harvests without token", async () => {
      const response = await request(app).get("/api/harvests/available");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it("should fetch available harvests with filter", async () => {
      const response = await request(app).get(
        "/api/harvests/available?cropType=Corn&minQuantity=100"
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /api/harvests/:id", () => {
    it("should fetch a single harvest by ID", async () => {
      const response = await request(app).get(`/api/harvests/${harvestId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(harvestId);
    });

    it("should return 404 for non-existent harvest", async () => {
      const response = await request(app).get("/api/harvests/nonexistent");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/harvests", () => {
    it("should create a harvest with farmer token", async () => {
      const response = await request(app)
        .post("/api/harvests")
        .set("Authorization", farmerToken)
        .send({
          farmerId: mockUsers.farmer.id,
          cropType: "Wheat",
          quantity: 200.5,
          unitOfMeasure: UnitOfMeasure.KILOGRAM,
          qualityGrade: QualityGrade.A,
          harvestDate: "2023-01-15",
          expectedPrice: 3.2,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.cropType).toBe("Wheat");
    });

    it("should reject creation with invalid data", async () => {
      const response = await request(app)
        .post("/api/harvests")
        .set("Authorization", farmerToken)
        .send({
          // Missing required fields
          cropType: "Wheat",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/harvests/:id", () => {
    it("should update a harvest with farmer token", async () => {
      const response = await request(app)
        .put(`/api/harvests/${harvestId}`)
        .set("Authorization", farmerToken)
        .send({
          expectedPrice: 3.0,
          storageLocation: "New Location",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.expectedPrice).toBe(3.0);
    });

    it("should reject update with invalid data", async () => {
      const response = await request(app)
        .put(`/api/harvests/${harvestId}`)
        .set("Authorization", farmerToken)
        .send({
          expectedPrice: -1, // Invalid: negative price
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/harvests/:id", () => {
    it("should delete a harvest with farmer token", async () => {
      const response = await request(app)
        .delete(`/api/harvests/${harvestId}`)
        .set("Authorization", farmerToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });

    it("should reject deletion from unauthorized user", async () => {
      const response = await request(app)
        .delete(`/api/harvests/${harvestId}`)
        .set("Authorization", buyerToken);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/harvests/:id/sell", () => {
    it("should mark harvest as sold", async () => {
      const response = await request(app)
        .post(`/api/harvests/${harvestId}/sell`)
        .set("Authorization", farmerToken)
        .send({
          buyerId: mockUsers.buyer.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.marketStatus).toBe(MarketStatus.SOLD);
      expect(response.body.data.buyerId).toBe(mockUsers.buyer.id);
    });
  });

  describe("POST /api/harvests/:id/reserve", () => {
    it("should mark harvest as reserved", async () => {
      const response = await request(app)
        .post(`/api/harvests/${harvestId}/reserve`)
        .set("Authorization", farmerToken)
        .send({
          buyerId: mockUsers.buyer.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.marketStatus).toBe(MarketStatus.RESERVED);
      expect(response.body.data.buyerId).toBe(mockUsers.buyer.id);
    });
  });

  describe("GET /api/harvests/farmer/:farmerId", () => {
    it("should fetch farmer's harvests with farmer token", async () => {
      const response = await request(app)
        .get(`/api/harvests/farmer/${mockUsers.farmer.id}`)
        .set("Authorization", farmerToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should reject access to another farmer's harvests", async () => {
      // Generate token for another farmer
      const anotherFarmerToken = `Bearer ${generateAccessToken({
        userId: "another-farmer",
        role: Roles.FARMER,
      })}`;

      const response = await request(app)
        .get(`/api/harvests/farmer/${mockUsers.farmer.id}`)
        .set("Authorization", anotherFarmerToken);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/harvests/buyer/:buyerId", () => {
    it("should fetch buyer's purchased harvests with buyer token", async () => {
      const response = await request(app)
        .get(`/api/harvests/buyer/${mockUsers.buyer.id}`)
        .set("Authorization", buyerToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
