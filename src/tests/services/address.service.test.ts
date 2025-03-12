import { jest, expect, describe, it, beforeEach } from "@jest/globals";

// First setup Jest mocks before importing modules
// Mock repository functions
const mockFindByUserId = jest.fn();
const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockSetAsDefault = jest.fn();
const mockVerifyUserOwnership = jest.fn();

// Create the repository mock object
const mockAddressRepository = {
  findByUserId: mockFindByUserId,
  findById: mockFindById,
  create: mockCreate,
  update: mockUpdate,
  delete: mockDelete,
  setAsDefault: mockSetAsDefault,
  verifyUserOwnership: mockVerifyUserOwnership,
};

// Mock the logger
jest.mock("../../utils/logger.js", () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

// Mock the repository module - this needs to be before importing the service
jest.mock(
  "../../repositories/address.repository.js",
  () => mockAddressRepository
);

// Now import the service
import { AddressService } from "../../services/address.service.js";

// Define interfaces to ensure type safety
interface Address {
  id: string;
  userId: string;
  addressType: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AddressQueryOptions {
  addressType?: string;
  page?: number;
  limit?: number;
}

interface PaginatedResult<T> {
  count: number;
  rows: T[];
}

interface AddressServiceMethods {
  getUserAddresses(
    userId: string,
    options?: AddressQueryOptions
  ): Promise<{
    addresses: Address[];
    total: number;
    pages: number;
  }>;
  getAddressById(id: string): Promise<Address>;
  createAddress(userId: string, data: Partial<Address>): Promise<Address>;
  updateAddress(
    id: string,
    userId: string,
    data: Partial<Address>
  ): Promise<Address>;
  deleteAddress(id: string, userId: string): Promise<void>;
  setAddressAsDefault(id: string, userId: string): Promise<void>;
  verifyAddressOwnership(userId: string, addressId: string): Promise<boolean>;
}

// Define repository method types for better type safety with mocks
interface AddressRepositoryMethods {
  findByUserId(
    userId: string,
    options?: AddressQueryOptions
  ): Promise<PaginatedResult<Address>>;
  findById(id: string): Promise<Address | null>;
  create(data: Partial<Address> & { userId: string }): Promise<Address>;
  update(id: string, data: Partial<Address>): Promise<[number, Address[]]>;
  delete(id: string): Promise<number>;
  setAsDefault(id: string, userId: string): Promise<boolean>;
  verifyUserOwnership(userId: string, addressId: string): Promise<boolean>;
}

describe("AddressService", () => {
  let addressService: AddressService & AddressServiceMethods;
  const mockAddressData: Address = {
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
      const mockRows: Address[] = [
        mockAddressData,
        { ...mockAddressData, id: "456" },
      ];

      const mockPaginatedResult: PaginatedResult<Address> = {
        count: mockCount,
        rows: mockRows,
      };

      mockAddressRepository.findByUserId.mockResolvedValueOnce(
        mockPaginatedResult
      );

      const userId = "user123";
      const options: AddressQueryOptions = {
        addressType: "HOME",
        page: 2,
        limit: 10,
      };
      const result = await addressService.getUserAddresses(userId, options);

      expect(mockAddressRepository.findByUserId).toHaveBeenCalledWith(
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
      const errorObj = new Error("Database error");
      mockAddressRepository.findByUserId.mockRejectedValueOnce(errorObj);

      const userId = "user123";
      await expect(addressService.getUserAddresses(userId)).rejects.toThrow(
        "Failed to fetch addresses"
      );
    });
  });

  describe("getAddressById", () => {
    it("should return an address when valid ID is provided", async () => {
      mockAddressRepository.findById.mockResolvedValueOnce(mockAddressData);

      const result = await addressService.getAddressById("123");

      expect(mockAddressRepository.findById).toHaveBeenCalledWith("123");
      expect(result).toEqual(mockAddressData);
    });

    it("should throw an error when address is not found", async () => {
      mockAddressRepository.findById.mockResolvedValueOnce(null);

      await expect(
        addressService.getAddressById("nonexistentId")
      ).rejects.toThrow("Address not found");
    });
  });

  describe("createAddress", () => {
    it("should create and return a new address", async () => {
      const addressData: Partial<Address> = {
        addressType: "SHIPPING",
        street1: "456 Market St",
        city: "Newtown",
        state: "State",
        postalCode: "67890",
        country: "Country",
      };

      const createdAddress: Address = {
        ...(addressData as Address),
        id: "789",
        userId: "user123",
      };

      mockAddressRepository.create.mockResolvedValueOnce(createdAddress);

      const result = await addressService.createAddress("user123", addressData);

      expect(mockAddressRepository.create).toHaveBeenCalledWith({
        ...addressData,
        userId: "user123",
      });
      expect(result).toEqual(createdAddress);
    });

    it("should throw an error when creation fails", async () => {
      const errorObj = new Error("Database error");
      mockAddressRepository.create.mockRejectedValueOnce(errorObj);

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
      mockAddressRepository.findById.mockResolvedValueOnce({
        ...mockAddressData,
        userId: "user123",
      });

      const updateData: Partial<Address> = {
        street1: "789 New St",
        city: "Updated City",
      };
      const updatedAddress = { ...mockAddressData, ...updateData };

      mockAddressRepository.update.mockResolvedValueOnce([1, [updatedAddress]]);

      const result = await addressService.updateAddress(
        "123",
        "user123",
        updateData
      );

      expect(mockAddressRepository.findById).toHaveBeenCalledWith("123");
      expect(mockAddressRepository.update).toHaveBeenCalledWith(
        "123",
        updateData
      );
      expect(result).toEqual(updatedAddress);
    });

    it("should throw an error when address is not found", async () => {
      mockAddressRepository.findById.mockResolvedValueOnce(null);

      await expect(
        addressService.updateAddress("nonexistent", "user123", {})
      ).rejects.toThrow("Address not found");
    });

    it("should throw an error when non-owner attempts update", async () => {
      mockAddressRepository.findById.mockResolvedValueOnce({
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
      mockAddressRepository.findById.mockResolvedValueOnce({
        ...mockAddressData,
        userId: "user123",
      });
      mockAddressRepository.delete.mockResolvedValueOnce(1);

      await addressService.deleteAddress("123", "user123");

      expect(mockAddressRepository.findById).toHaveBeenCalledWith("123");
      expect(mockAddressRepository.delete).toHaveBeenCalledWith("123");
    });

    it("should throw an error when address is not found", async () => {
      mockAddressRepository.findById.mockResolvedValueOnce(null);

      await expect(
        addressService.deleteAddress("nonexistent", "user123")
      ).rejects.toThrow("Address not found");
    });

    it("should throw an error when non-owner attempts deletion", async () => {
      mockAddressRepository.findById.mockResolvedValueOnce({
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
      mockAddressRepository.setAsDefault.mockResolvedValueOnce(true);

      await addressService.setAddressAsDefault("123", "user123");

      expect(mockAddressRepository.setAsDefault).toHaveBeenCalledWith(
        "123",
        "user123"
      );
    });

    it("should throw an error when address cannot be set as default", async () => {
      mockAddressRepository.setAsDefault.mockResolvedValueOnce(false);

      await expect(
        addressService.setAddressAsDefault("123", "user123")
      ).rejects.toThrow("Address not found or could not be set as default");
    });
  });

  describe("verifyAddressOwnership", () => {
    it("should verify ownership correctly", async () => {
      mockAddressRepository.verifyUserOwnership.mockResolvedValueOnce(true);

      const result = await addressService.verifyAddressOwnership(
        "user123",
        "123"
      );

      expect(mockAddressRepository.verifyUserOwnership).toHaveBeenCalledWith(
        "user123",
        "123"
      );
      expect(result).toBe(true);
    });

    it("should throw an error when verification fails", async () => {
      const errorObj = new Error("Database error");
      mockAddressRepository.verifyUserOwnership.mockRejectedValueOnce(errorObj);

      await expect(
        addressService.verifyAddressOwnership("user123", "123")
      ).rejects.toThrow("Failed to verify address ownership");
    });
  });
});
