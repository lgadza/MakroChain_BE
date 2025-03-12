import {
  jest,
  expect,
  describe,
  it,
  beforeEach,
} from "../../tests/test-utils.js";
import { PhoneService } from "../../services/phone.service.js";
import PhoneRepository from "../../repositories/phone.repository.js";

// Mock the PhoneRepository
jest.mock("../../repositories/phone.repository.js");
jest.mock("../../utils/logger.js", () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

describe("PhoneService", () => {
  let phoneService: PhoneService;
  const mockPhoneData: any = {
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
      const mockRows = [mockPhoneData, { ...mockPhoneData, id: "456" }];

      (PhoneRepository.findByUserId as jest.Mock).mockResolvedValueOnce({
        count: mockCount,
        rows: mockRows,
      });

      const userId = "user123";
      const options = { phoneType: "MOBILE", page: 2, limit: 10 };
      const result = await phoneService.getUserPhones(userId, options);

      expect(PhoneRepository.findByUserId).toHaveBeenCalledWith(
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
      (PhoneRepository.findByUserId as jest.Mock).mockRejectedValueOnce(
        new Error("Database error")
      );

      const userId = "user123";
      await expect(phoneService.getUserPhones(userId)).rejects.toThrow(
        "Failed to fetch phone numbers"
      );
    });
  });

  describe("getPhoneById", () => {
    it("should return a phone when valid ID is provided", async () => {
      (PhoneRepository.findById as jest.Mock).mockResolvedValueOnce(
        mockPhoneData
      );

      const result = await phoneService.getPhoneById("123");

      expect(PhoneRepository.findById).toHaveBeenCalledWith("123");
      expect(result).toEqual(mockPhoneData);
    });

    it("should throw an error when phone is not found", async () => {
      (PhoneRepository.findById as jest.Mock).mockResolvedValueOnce(null);

      await expect(phoneService.getPhoneById("nonexistentId")).rejects.toThrow(
        "Phone number not found"
      );
    });
  });

  describe("createPhone", () => {
    it("should create and return a new phone", async () => {
      const phoneData = {
        phoneType: "WORK",
        countryCode: "44",
        number: "7700900123",
      };

      (PhoneRepository.phoneExists as jest.Mock).mockResolvedValueOnce(false);
      (PhoneRepository.create as jest.Mock).mockResolvedValueOnce({
        ...phoneData,
        id: "789",
        userId: "user123",
      });

      const result = await phoneService.createPhone("user123", phoneData);

      expect(PhoneRepository.phoneExists).toHaveBeenCalledWith(
        "44",
        "7700900123"
      );
      expect(PhoneRepository.create).toHaveBeenCalledWith({
        ...phoneData,
        userId: "user123",
      });
      expect(result).toEqual({
        ...phoneData,
        id: "789",
        userId: "user123",
      });
    });

    it("should throw an error when phone already exists", async () => {
      const phoneData = {
        phoneType: "WORK",
        countryCode: "44",
        number: "7700900123",
      };

      (PhoneRepository.phoneExists as jest.Mock).mockResolvedValueOnce(true);

      await expect(
        phoneService.createPhone("user123", phoneData)
      ).rejects.toThrow("Phone number already exists");
      expect(PhoneRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("updatePhone", () => {
    it("should update and return phone when owner makes request", async () => {
      (PhoneRepository.findById as jest.Mock).mockResolvedValueOnce({
        ...mockPhoneData,
        userId: "user123",
      });

      const updateData = { extension: "123" };
      (PhoneRepository.phoneExists as jest.Mock).mockResolvedValueOnce(false);
      (PhoneRepository.update as jest.Mock).mockResolvedValueOnce([
        1,
        [{ ...mockPhoneData, ...updateData }],
      ]);

      const result = await phoneService.updatePhone(
        "123",
        "user123",
        updateData
      );

      expect(PhoneRepository.findById).toHaveBeenCalledWith("123");
      expect(PhoneRepository.update).toHaveBeenCalledWith("123", updateData);
      expect(result).toEqual({ ...mockPhoneData, ...updateData });
    });

    it("should throw an error when phone is not found", async () => {
      (PhoneRepository.findById as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        phoneService.updatePhone("nonexistent", "user123", {})
      ).rejects.toThrow("Phone number not found");
    });

    it("should throw an error when non-owner attempts update", async () => {
      (PhoneRepository.findById as jest.Mock).mockResolvedValueOnce({
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
      (PhoneRepository.findById as jest.Mock).mockResolvedValueOnce({
        ...mockPhoneData,
        userId: "user123",
      });

      const updateData = { countryCode: "44", number: "7700900123" };
      (PhoneRepository.phoneExists as jest.Mock).mockResolvedValueOnce(true);

      await expect(
        phoneService.updatePhone("123", "user123", updateData)
      ).rejects.toThrow("Phone number already exists");
    });
  });

  describe("requestVerificationCode", () => {
    it("should generate and return a verification code", async () => {
      (PhoneRepository.findById as jest.Mock).mockResolvedValueOnce({
        ...mockPhoneData,
        userId: "user123",
      });

      (
        PhoneRepository.generateVerificationCode as jest.Mock
      ).mockResolvedValueOnce("123456");

      const code = await phoneService.requestVerificationCode("123", "user123");

      expect(PhoneRepository.findById).toHaveBeenCalledWith("123");
      expect(PhoneRepository.generateVerificationCode).toHaveBeenCalledWith(
        "123"
      );
      expect(code).toBe("123456");
    });

    it("should throw an error when phone is not found", async () => {
      (PhoneRepository.findById as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        phoneService.requestVerificationCode("nonexistent", "user123")
      ).rejects.toThrow("Phone number not found");
    });

    it("should throw an error when non-owner requests verification", async () => {
      (PhoneRepository.findById as jest.Mock).mockResolvedValueOnce({
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
      (PhoneRepository.findById as jest.Mock).mockResolvedValueOnce({
        ...mockPhoneData,
        userId: "user123",
      });

      (PhoneRepository.verifyPhone as jest.Mock).mockResolvedValueOnce(true);

      await phoneService.verifyPhone("123", "user123", "123456");

      expect(PhoneRepository.findById).toHaveBeenCalledWith("123");
      expect(PhoneRepository.verifyPhone).toHaveBeenCalledWith("123", "123456");
    });

    it("should throw an error when verification code is invalid", async () => {
      (PhoneRepository.findById as jest.Mock).mockResolvedValueOnce({
        ...mockPhoneData,
        userId: "user123",
      });

      (PhoneRepository.verifyPhone as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        phoneService.verifyPhone("123", "user123", "invalid")
      ).rejects.toThrow("Invalid or expired verification code");
    });
  });

  describe("deletePhone", () => {
    it("should delete a phone when owner makes request", async () => {
      (PhoneRepository.findById as jest.Mock).mockResolvedValueOnce({
        ...mockPhoneData,
        userId: "user123",
      });
      (PhoneRepository.delete as jest.Mock).mockResolvedValueOnce(1);

      await phoneService.deletePhone("123", "user123");

      expect(PhoneRepository.findById).toHaveBeenCalledWith("123");
      expect(PhoneRepository.delete).toHaveBeenCalledWith("123");
    });

    it("should throw an error when phone is not found", async () => {
      (PhoneRepository.findById as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        phoneService.deletePhone("nonexistent", "user123")
      ).rejects.toThrow("Phone number not found");
    });

    it("should throw an error when non-owner attempts deletion", async () => {
      (PhoneRepository.findById as jest.Mock).mockResolvedValueOnce({
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
      (PhoneRepository.setAsDefault as jest.Mock).mockResolvedValueOnce(true);

      await phoneService.setPhoneAsDefault("123", "user123");

      expect(PhoneRepository.setAsDefault).toHaveBeenCalledWith(
        "123",
        "user123"
      );
    });

    it("should throw an error when phone cannot be set as default", async () => {
      (PhoneRepository.setAsDefault as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        phoneService.setPhoneAsDefault("123", "user123")
      ).rejects.toThrow(
        "Phone number not found or could not be set as default"
      );
    });
  });

  describe("verifyPhoneOwnership", () => {
    it("should verify ownership correctly", async () => {
      (PhoneRepository.verifyUserOwnership as jest.Mock).mockResolvedValueOnce(
        true
      );

      const result = await phoneService.verifyPhoneOwnership("user123", "123");

      expect(PhoneRepository.verifyUserOwnership).toHaveBeenCalledWith(
        "user123",
        "123"
      );
      expect(result).toBe(true);
    });

    it("should throw an error when verification fails", async () => {
      (PhoneRepository.verifyUserOwnership as jest.Mock).mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(
        phoneService.verifyPhoneOwnership("user123", "123")
      ).rejects.toThrow("Failed to verify phone ownership");
    });
  });
});
