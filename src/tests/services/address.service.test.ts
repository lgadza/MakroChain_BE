import {
  jest,
  expect,
  describe,
  it,
  beforeEach,
} from "../../tests/test-utils.js";
import { AddressService } from "../../services/address.service.js";
import AddressRepository from "../../repositories/address.repository.js";

// Mock the AddressRepository
jest.mock("../../repositories/address.repository.js");
jest.mock("../../utils/logger.js", () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

describe("AddressService", () => {
  let addressService: AddressService;
  const mockAddressData: any = {
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
    addressService = new AddressService();
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe("getUserAddresses", () => {
    it("should return paginated addresses and metadata", async () => {
      const mockCount = 3;
      const mockRows = [mockAddressData, { ...mockAddressData, id: "456" }];

      (AddressRepository.findByUserId as jest.Mock).mockResolvedValueOnce({
        count: mockCount,
        rows: mockRows,
      });

      const userId = "user123";
      const options = { addressType: "HOME", page: 2, limit: 10 };
      const result = await addressService.getUserAddresses(userId, options);

      expect(AddressRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        options
      );
      expect(result).toEqual({
        addresses: mockRows,
        total: mockCount,
        pages: 1, // Math.ceil(3 / 10) = 1
      });
    });

    it("should throw an error when database query fails", async () => {
      (AddressRepository.findByUserId as jest.Mock).mockRejectedValueOnce(
        new Error("Database error")
      );

      const userId = "user123";
      await expect(addressService.getUserAddresses(userId)).rejects.toThrow(
        "Failed to fetch addresses"
      );
    });
  });

  describe("getAddressById", () => {
    it("should return an address when valid ID is provided", async () => {
      (AddressRepository.findById as jest.Mock).mockResolvedValueOnce(
        mockAddressData
      );

      const result = await addressService.getAddressById("123");

      expect(AddressRepository.findById).toHaveBeenCalledWith("123");
      expect(result).toEqual(mockAddressData);
    });

    it("should throw an error when address is not found", async () => {
      (AddressRepository.findById as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        addressService.getAddressById("nonexistentId")
      ).rejects.toThrow("Address not found");
    });
  });

  describe("createAddress", () => {
    it("should create and return a new address", async () => {
      const addressData = {
        addressType: "SHIPPING",
        street1: "456 Market St",
        city: "Newtown",
        state: "State",
        postalCode: "67890",
        country: "Country",
      };

      (AddressRepository.create as jest.Mock).mockResolvedValueOnce({
        ...addressData,
        id: "789",
        userId: "user123",
      });

      const result = await addressService.createAddress("user123", addressData);

      expect(AddressRepository.create).toHaveBeenCalledWith({
        ...addressData,
        userId: "user123",
      });
      expect(result).toEqual({
        ...addressData,
        id: "789",
        userId: "user123",
      });
    });

    it("should throw an error when creation fails", async () => {
      (AddressRepository.create as jest.Mock).mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(
        addressService.createAddress("user123", {
          addressType: "HOME",
          street1: "Test St",
          city: "City",
          state: "State",
          postalCode: "12345",
          country: "Country",
        })
      ).rejects.toThrow("Failed to create address");
    });
  });

  describe("updateAddress", () => {
    it("should update and return address when owner makes request", async () => {
      (AddressRepository.findById as jest.Mock).mockResolvedValueOnce({
        ...mockAddressData,
        userId: "user123",
      });

      const updateData = { street1: "789 New St", city: "Updated City" };
      (AddressRepository.update as jest.Mock).mockResolvedValueOnce([
        1,
        [{ ...mockAddressData, ...updateData }],
      ]);

      const result = await addressService.updateAddress(
        "123",
        "user123",
        updateData
      );

      expect(AddressRepository.findById).toHaveBeenCalledWith("123");
      expect(AddressRepository.update).toHaveBeenCalledWith("123", updateData);
      expect(result).toEqual({ ...mockAddressData, ...updateData });
    });

    it("should throw an error when address is not found", async () => {
      (AddressRepository.findById as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        addressService.updateAddress("nonexistent", "user123", {})
      ).rejects.toThrow("Address not found");
    });

    it("should throw an error when non-owner attempts update", async () => {
      (AddressRepository.findById as jest.Mock).mockResolvedValueOnce({
        ...mockAddressData,
        userId: "anotherUser",
      });

      await expect(
        addressService.updateAddress("123", "user123", {
          street1: "Unauthorized",
        })
      ).rejects.toThrow("You don't have permission to update this address");
    });
  });

  describe("deleteAddress", () => {
    it("should delete an address when owner makes request", async () => {
      (AddressRepository.findById as jest.Mock).mockResolvedValueOnce({
        ...mockAddressData,
        userId: "user123",
      });
      (AddressRepository.delete as jest.Mock).mockResolvedValueOnce(1);

      await addressService.deleteAddress("123", "user123");

      expect(AddressRepository.findById).toHaveBeenCalledWith("123");
      expect(AddressRepository.delete).toHaveBeenCalledWith("123");
    });

    it("should throw an error when address is not found", async () => {
      (AddressRepository.findById as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        addressService.deleteAddress("nonexistent", "user123")
      ).rejects.toThrow("Address not found");
    });

    it("should throw an error when non-owner attempts deletion", async () => {
      (AddressRepository.findById as jest.Mock).mockResolvedValueOnce({
        ...mockAddressData,
        userId: "anotherUser",
      });

      await expect(
        addressService.deleteAddress("123", "user123")
      ).rejects.toThrow("You don't have permission to delete this address");
    });
  });

  describe("setAddressAsDefault", () => {
    it("should set an address as default", async () => {
      (AddressRepository.setAsDefault as jest.Mock).mockResolvedValueOnce(true);

      await addressService.setAddressAsDefault("123", "user123");

      expect(AddressRepository.setAsDefault).toHaveBeenCalledWith(
        "123",
        "user123"
      );
    });

    it("should throw an error when address cannot be set as default", async () => {
      (AddressRepository.setAsDefault as jest.Mock).mockResolvedValueOnce(
        false
      );

      await expect(
        addressService.setAddressAsDefault("123", "user123")
      ).rejects.toThrow("Address not found or could not be set as default");
    });
  });

  describe("verifyAddressOwnership", () => {
    it("should verify ownership correctly", async () => {
      (
        AddressRepository.verifyUserOwnership as jest.Mock
      ).mockResolvedValueOnce(true);

      const result = await addressService.verifyAddressOwnership(
        "user123",
        "123"
      );

      expect(AddressRepository.verifyUserOwnership).toHaveBeenCalledWith(
        "user123",
        "123"
      );
      expect(result).toBe(true);
    });

    it("should throw an error when verification fails", async () => {
      (
        AddressRepository.verifyUserOwnership as jest.Mock
      ).mockRejectedValueOnce(new Error("Database error"));

      await expect(
        addressService.verifyAddressOwnership("user123", "123")
      ).rejects.toThrow("Failed to verify address ownership");
    });
  });
});
