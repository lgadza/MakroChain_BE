import { jest, expect, describe, it, beforeEach } from "@jest/globals";

// Define mock functions first
const mockFindByUserId = jest.fn();
const mockFindById = jest.fn();
const mockPhoneExists = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockSetAsDefault = jest.fn();
const mockGenerateVerificationCode = jest.fn();
const mockVerifyPhone = jest.fn();
const mockVerifyUserOwnership = jest.fn();

// Create the repository mock object
const mockPhoneRepository = {
  findByUserId: mockFindByUserId,
  findById: mockFindById,
  phoneExists: mockPhoneExists,
  create: mockCreate,
  update: mockUpdate,
  delete: mockDelete,
  setAsDefault: mockSetAsDefault,
  generateVerificationCode: mockGenerateVerificationCode,
  verifyPhone: mockVerifyPhone,
  verifyUserOwnership: mockVerifyUserOwnership,
};

// Mock external dependencies
jest.mock("../../repositories/phone.repository.js", () => mockPhoneRepository);
jest.mock("../../utils/logger.js", () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

// Now import the service
import { PhoneService } from "../../services/phone.service.js";

// Define interfaces to ensure type safety
interface Phone {
  id: string;
  userId: string;
  phoneType: string;
  countryCode: string;
  number: string;
  extension?: string | null;
  isDefault?: boolean;
  isVerified?: boolean;
  verificationCode?: string | null;
  verificationExpires?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PhoneQueryOptions {
  phoneType?: string;
  isDefault?: boolean;
  isVerified?: boolean;
  page?: number;
  limit?: number;
}

interface PaginatedResult<T> {
  count: number;
  rows: T[];
}

interface PhoneServiceMethods {
  getUserPhones(
    userId: string,
    options?: PhoneQueryOptions
  ): Promise<{
    phones: Phone[];
    total: number;
    pages: number;
  }>;
  getPhoneById(id: string): Promise<Phone>;
  createPhone(userId: string, data: Partial<Phone>): Promise<Phone>;
  updatePhone(id: string, userId: string, data: Partial<Phone>): Promise<Phone>;
  deletePhone(id: string, userId: string): Promise<void>;
  setPhoneAsDefault(id: string, userId: string): Promise<void>;
  requestVerificationCode(id: string, userId: string): Promise<string>;
  verifyPhone(id: string, userId: string, code: string): Promise<void>;
  verifyPhoneOwnership(userId: string, phoneId: string): Promise<boolean>;
}

// Define repository method types for better type safety with mocks
interface PhoneRepositoryMethods {
  findByUserId(
    userId: string,
    options?: PhoneQueryOptions
  ): Promise<PaginatedResult<Phone>>;
  findById(id: string): Promise<Phone | null>;
  phoneExists(
    countryCode: string,
    number: string,
    excludeId?: string
  ): Promise<boolean>;
  create(data: Partial<Phone> & { userId: string }): Promise<Phone>;
  update(id: string, data: Partial<Phone>): Promise<[number, Phone[]]>;
  delete(id: string): Promise<number>;
  setAsDefault(id: string, userId: string): Promise<boolean>;
  generateVerificationCode(id: string): Promise<string>;
  verifyPhone(id: string, code: string): Promise<boolean>;
  verifyUserOwnership(userId: string, phoneId: string): Promise<boolean>;
}

describe("PhoneService", () => {
  let phoneService: PhoneService & PhoneServiceMethods;
  const mockPhoneData: Phone = {
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
    phoneService = new PhoneService();
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe("getUserPhones", () => {
    it("should return paginated phones and metadata", async () => {
      const mockCount = 3;
      const mockRows: Phone[] = [
        mockPhoneData,
        { ...mockPhoneData, id: "456" },
      ];

      const mockPaginatedResult: PaginatedResult<Phone> = {
        count: mockCount,
        rows: mockRows,
      };

      mockPhoneRepository.findByUserId.mockResolvedValueOnce(
        mockPaginatedResult
      );

      const userId = "user123";
      const options: PhoneQueryOptions = {
        phoneType: "MOBILE",
        page: 2,
        limit: 10,
      };
      const result = await phoneService.getUserPhones(userId, options);

      expect(mockPhoneRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        options
      );
      expect(result).toEqual({
        phones: mockRows,
        total: mockCount,
        pages: 1, // Math.ceil(3 / 10) = 1
      });
    });

    it("should throw an error when database query fails", async () => {
      const errorObj = new Error("Database error");
      mockPhoneRepository.findByUserId.mockRejectedValueOnce(errorObj);

      const userId = "user123";
      await expect(phoneService.getUserPhones(userId)).rejects.toThrow(
        "Failed to fetch phone numbers"
      );
    });
  });

  describe("getPhoneById", () => {
    it("should return a phone when valid ID is provided", async () => {
      mockPhoneRepository.findById.mockResolvedValueOnce(mockPhoneData);

      const result = await phoneService.getPhoneById("123");

      expect(mockPhoneRepository.findById).toHaveBeenCalledWith("123");
      expect(result).toEqual(mockPhoneData);
    });

    it("should throw an error when phone is not found", async () => {
      mockPhoneRepository.findById.mockResolvedValueOnce(null);

      await expect(phoneService.getPhoneById("nonexistentId")).rejects.toThrow(
        "Phone number not found"
      );
    });
  });

  describe("createPhone", () => {
    it("should create and return a new phone", async () => {
      const phoneData: Partial<Phone> = {
        phoneType: "WORK",
        countryCode: "44",
        number: "7700900123",
      };

      const createdPhone: Phone = {
        ...(phoneData as Phone),
        id: "789",
        userId: "user123",
        isDefault: false,
        isVerified: false,
      };

      mockPhoneRepository.phoneExists.mockResolvedValueOnce(false);
      mockPhoneRepository.create.mockResolvedValueOnce(createdPhone);

      const result = await phoneService.createPhone("user123", phoneData);

      expect(mockPhoneRepository.phoneExists).toHaveBeenCalledWith(
        "44",
        "7700900123"
      );
      expect(mockPhoneRepository.create).toHaveBeenCalledWith({
        ...phoneData,
        userId: "user123",
      });
      expect(result).toEqual(createdPhone);
    });

    it("should throw an error when phone already exists", async () => {
      const phoneData: Partial<Phone> = {
        phoneType: "WORK",
        countryCode: "44",
        number: "7700900123",
      };

      mockPhoneRepository.phoneExists.mockResolvedValueOnce(true);

      await expect(
        phoneService.createPhone("user123", phoneData)
      ).rejects.toThrow("Phone number already exists");
      expect(mockPhoneRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("updatePhone", () => {
    it("should update and return phone when owner makes request", async () => {
      mockPhoneRepository.findById.mockResolvedValueOnce({
        ...mockPhoneData,
        userId: "user123",
      });

      const updateData: Partial<Phone> = { extension: "123" };
      mockPhoneRepository.phoneExists.mockResolvedValueOnce(false);

      const updatedPhone = { ...mockPhoneData, ...updateData };
      mockPhoneRepository.update.mockResolvedValueOnce([1, [updatedPhone]]);

      const result = await phoneService.updatePhone(
        "123",
        "user123",
        updateData
      );

      expect(mockPhoneRepository.findById).toHaveBeenCalledWith("123");
      expect(mockPhoneRepository.update).toHaveBeenCalledWith(
        "123",
        updateData
      );
      expect(result).toEqual(updatedPhone);
    });

    it("should throw an error when phone is not found", async () => {
      mockPhoneRepository.findById.mockResolvedValueOnce(null);

      await expect(
        phoneService.updatePhone("nonexistent", "user123", {})
      ).rejects.toThrow("Phone number not found");
    });

    it("should throw an error when non-owner attempts update", async () => {
      mockPhoneRepository.findById.mockResolvedValueOnce({
        ...mockPhoneData,
        userId: "anotherUser",
      });

      await expect(
        phoneService.updatePhone("123", "user123", {
          extension: "Unauthorized",
        })
      ).rejects.toThrow(
        "You don't have permission to update this phone number"
      );
    });

    it("should throw an error when updating to an existing phone number", async () => {
      mockPhoneRepository.findById.mockResolvedValueOnce({
        ...mockPhoneData,
        userId: "user123",
      });

      const updateData: Partial<Phone> = {
        countryCode: "44",
        number: "7700900123",
      };
      mockPhoneRepository.phoneExists.mockResolvedValueOnce(true);

      await expect(
        phoneService.updatePhone("123", "user123", updateData)
      ).rejects.toThrow("Phone number already exists");
    });
  });

  describe("requestVerificationCode", () => {
    it("should generate and return a verification code", async () => {
      mockPhoneRepository.findById.mockResolvedValueOnce({
        ...mockPhoneData,
        userId: "user123",
      });

      mockPhoneRepository.generateVerificationCode.mockResolvedValueOnce(
        "123456"
      );

      const code = await phoneService.requestVerificationCode("123", "user123");

      expect(mockPhoneRepository.findById).toHaveBeenCalledWith("123");
      expect(mockPhoneRepository.generateVerificationCode).toHaveBeenCalledWith(
        "123"
      );
      expect(code).toBe("123456");
    });

    it("should throw an error when phone is not found", async () => {
      mockPhoneRepository.findById.mockResolvedValueOnce(null);

      await expect(
        phoneService.requestVerificationCode("nonexistent", "user123")
      ).rejects.toThrow("Phone number not found");
    });

    it("should throw an error when non-owner requests verification", async () => {
      mockPhoneRepository.findById.mockResolvedValueOnce({
        ...mockPhoneData,
        userId: "anotherUser",
      });

      await expect(
        phoneService.requestVerificationCode("123", "user123")
      ).rejects.toThrow(
        "You don't have permission to verify this phone number"
      );
    });
  });

  describe("verifyPhone", () => {
    it("should verify a phone with valid verification code", async () => {
      mockPhoneRepository.findById.mockResolvedValueOnce({
        ...mockPhoneData,
        userId: "user123",
      });

      mockPhoneRepository.verifyPhone.mockResolvedValueOnce(true);

      await phoneService.verifyPhone("123", "user123", "123456");

      expect(mockPhoneRepository.findById).toHaveBeenCalledWith("123");
      expect(mockPhoneRepository.verifyPhone).toHaveBeenCalledWith(
        "123",
        "123456"
      );
    });

    it("should throw an error when verification code is invalid", async () => {
      mockPhoneRepository.findById.mockResolvedValueOnce({
        ...mockPhoneData,
        userId: "user123",
      });

      mockPhoneRepository.verifyPhone.mockResolvedValueOnce(false);

      await expect(
        phoneService.verifyPhone("123", "user123", "invalid")
      ).rejects.toThrow("Invalid or expired verification code");
    });
  });

  describe("deletePhone", () => {
    it("should delete a phone when owner makes request", async () => {
      mockPhoneRepository.findById.mockResolvedValueOnce({
        ...mockPhoneData,
        userId: "user123",
      });
      mockPhoneRepository.delete.mockResolvedValueOnce(1);

      await phoneService.deletePhone("123", "user123");

      expect(mockPhoneRepository.findById).toHaveBeenCalledWith("123");
      expect(mockPhoneRepository.delete).toHaveBeenCalledWith("123");
    });

    it("should throw an error when phone is not found", async () => {
      mockPhoneRepository.findById.mockResolvedValueOnce(null);

      await expect(
        phoneService.deletePhone("nonexistent", "user123")
      ).rejects.toThrow("Phone number not found");
    });

    it("should throw an error when non-owner attempts deletion", async () => {
      mockPhoneRepository.findById.mockResolvedValueOnce({
        ...mockPhoneData,
        userId: "anotherUser",
      });

      await expect(phoneService.deletePhone("123", "user123")).rejects.toThrow(
        "You don't have permission to delete this phone number"
      );
    });
  });

  describe("setPhoneAsDefault", () => {
    it("should set a phone as default", async () => {
      mockPhoneRepository.setAsDefault.mockResolvedValueOnce(true);

      await phoneService.setPhoneAsDefault("123", "user123");

      expect(mockPhoneRepository.setAsDefault).toHaveBeenCalledWith(
        "123",
        "user123"
      );
    });

    it("should throw an error when phone cannot be set as default", async () => {
      mockPhoneRepository.setAsDefault.mockResolvedValueOnce(false);

      await expect(
        phoneService.setPhoneAsDefault("123", "user123")
      ).rejects.toThrow(
        "Phone number not found or could not be set as default"
      );
    });
  });

  describe("verifyPhoneOwnership", () => {
    it("should verify ownership correctly", async () => {
      mockPhoneRepository.verifyUserOwnership.mockResolvedValueOnce(true);

      const result = await phoneService.verifyPhoneOwnership("user123", "123");

      expect(mockPhoneRepository.verifyUserOwnership).toHaveBeenCalledWith(
        "user123",
        "123"
      );
      expect(result).toBe(true);
    });

    it("should throw an error when verification fails", async () => {
      const errorObj = new Error("Database error");
      mockPhoneRepository.verifyUserOwnership.mockRejectedValueOnce(errorObj);

      await expect(
        phoneService.verifyPhoneOwnership("user123", "123")
      ).rejects.toThrow("Failed to verify phone ownership");
    });
  });
});
