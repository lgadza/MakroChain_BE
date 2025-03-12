import AddressRepository from "../repositories/address.repository.js";
import { createError } from "../utils/errorUtils.js";
import { ErrorCode } from "../constants/errorCodes.js";
import logger from "../utils/logger.js";
import { AddressAttributes } from "../models/address.model.js";

export class AddressService {
  private addressRepository = AddressRepository;

  /**
   * Get all addresses for a user with pagination and filters
   */
  async getUserAddresses(
    userId: string,
    options: {
      addressType?: string;
      isDefault?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    addresses: AddressAttributes[];
    total: number;
    pages: number;
  }> {
    try {
      const { page = 1, limit = 10 } = options;
      const { rows, count } = await this.addressRepository.findByUserId(
        userId,
        options
      );

      return {
        addresses: rows,
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error(
        `Error fetching addresses for user ${userId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw createError(
        500,
        "Failed to fetch addresses",
        ErrorCode.DB_QUERY_ERROR
      );
    }
  }

  /**
   * Get a specific address by ID
   */
  async getAddressById(id: string): Promise<AddressAttributes> {
    try {
      const address = await this.addressRepository.findById(id);

      if (!address) {
        throw createError(
          404,
          "Address not found",
          ErrorCode.RESOURCE_NOT_FOUND
        );
      }

      return address;
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) {
        throw error;
      }
      logger.error(
        `Error fetching address ${id}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw createError(
        500,
        "Failed to fetch address",
        ErrorCode.DB_QUERY_ERROR
      );
    }
  }

  /**
   * Create a new address for a user
   */
  async createAddress(
    userId: string,
    addressData: Partial<AddressAttributes>
  ): Promise<AddressAttributes> {
    try {
      const newAddress = await this.addressRepository.create({
        ...addressData,
        userId,
      });

      return newAddress;
    } catch (error) {
      logger.error(
        `Error creating address for user ${userId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw createError(500, "Failed to create address", ErrorCode.DB_ERROR);
    }
  }

  /**
   * Update an existing address
   */
  async updateAddress(
    id: string,
    userId: string,
    addressData: Partial<AddressAttributes>
  ): Promise<AddressAttributes> {
    try {
      // Check if the address exists and belongs to the user
      const address = await this.addressRepository.findById(id);

      if (!address) {
        throw createError(
          404,
          "Address not found",
          ErrorCode.RESOURCE_NOT_FOUND
        );
      }

      if (address.userId !== userId) {
        throw createError(
          403,
          "You don't have permission to update this address",
          ErrorCode.RESOURCE_ACCESS_DENIED
        );
      }

      // Prevent updating the userId
      delete (addressData as any).userId;

      const [updated, rows] = await this.addressRepository.update(
        id,
        addressData
      );

      if (!updated || rows.length === 0) {
        throw createError(
          404,
          "Address not found or could not be updated",
          ErrorCode.RESOURCE_NOT_FOUND
        );
      }

      return rows[0];
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) {
        throw error;
      }
      logger.error(
        `Error updating address ${id}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw createError(500, "Failed to update address", ErrorCode.DB_ERROR);
    }
  }

  /**
   * Delete an address
   */
  async deleteAddress(id: string, userId: string): Promise<void> {
    try {
      // Check if the address exists and belongs to the user
      const address = await this.addressRepository.findById(id);

      if (!address) {
        throw createError(
          404,
          "Address not found",
          ErrorCode.RESOURCE_NOT_FOUND
        );
      }

      if (address.userId !== userId) {
        throw createError(
          403,
          "You don't have permission to delete this address",
          ErrorCode.RESOURCE_ACCESS_DENIED
        );
      }

      const deleted = await this.addressRepository.delete(id);

      if (!deleted) {
        throw createError(
          404,
          "Address not found or could not be deleted",
          ErrorCode.RESOURCE_NOT_FOUND
        );
      }
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) {
        throw error;
      }
      logger.error(
        `Error deleting address ${id}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw createError(500, "Failed to delete address", ErrorCode.DB_ERROR);
    }
  }

  /**
   * Set an address as default
   */
  async setAddressAsDefault(id: string, userId: string): Promise<void> {
    try {
      const success = await this.addressRepository.setAsDefault(id, userId);

      if (!success) {
        throw createError(
          404,
          "Address not found or could not be set as default",
          ErrorCode.RESOURCE_NOT_FOUND
        );
      }
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) {
        throw error;
      }
      logger.error(
        `Error setting address ${id} as default: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw createError(
        500,
        "Failed to set address as default",
        ErrorCode.DB_ERROR
      );
    }
  }

  /**
   * Verify user owns an address
   */
  async verifyAddressOwnership(
    userId: string,
    addressId: string
  ): Promise<boolean> {
    try {
      return this.addressRepository.verifyUserOwnership(userId, addressId);
    } catch (error) {
      logger.error(
        `Error verifying address ownership: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw createError(
        500,
        "Failed to verify address ownership",
        ErrorCode.DB_QUERY_ERROR
      );
    }
  }
}

// Export both the class and a default singleton instance
export default new AddressService();
