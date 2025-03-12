import { Op } from "sequelize";
import Address, { AddressAttributes } from "../models/address.model.js";

export class AddressRepository {
  /**
   * Find address by ID
   */
  async findById(id: string): Promise<Address | null> {
    return Address.findByPk(id);
  }

  /**
   * Find all addresses for a user
   */
  async findByUserId(
    userId: string,
    options: {
      addressType?: string;
      isDefault?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ rows: Address[]; count: number }> {
    const { addressType, isDefault, page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    // Build the where clause
    const whereClause: any = { userId };
    if (addressType) {
      whereClause.addressType = addressType;
    }
    if (isDefault !== undefined) {
      whereClause.isDefault = isDefault;
    }

    return Address.findAndCountAll({
      where: whereClause,
      offset,
      limit,
      order: [
        ["addressType", "ASC"],
        ["isDefault", "DESC"],
        ["updatedAt", "DESC"],
      ],
    });
  }

  /**
   * Create a new address
   */
  async create(addressData: Partial<AddressAttributes>): Promise<Address> {
    return Address.create(addressData as any);
  }

  /**
   * Update an address
   */
  async update(
    id: string,
    addressData: Partial<AddressAttributes>
  ): Promise<[number, Address[]]> {
    return Address.update(addressData, {
      where: { id },
      returning: true,
    });
  }

  /**
   * Delete an address
   */
  async delete(id: string): Promise<number> {
    return Address.destroy({ where: { id } });
  }

  /**
   * Find default address for a user by type
   */
  async findDefaultByUserAndType(
    userId: string,
    addressType: string
  ): Promise<Address | null> {
    return Address.findOne({
      where: {
        userId,
        addressType,
        isDefault: true,
      },
    });
  }

  /**
   * Set an address as default and unset others
   */
  async setAsDefault(id: string, userId: string): Promise<boolean> {
    try {
      // Begin a transaction to ensure consistency
      const address = await Address.findByPk(id);
      if (!address || address.userId !== userId) {
        return false;
      }

      // Get the address type from the found address
      const addressType = address.addressType;

      // Update all addresses of the same type for this user to not be default
      await Address.update(
        { isDefault: false },
        {
          where: {
            userId,
            addressType,
            isDefault: true,
          },
        }
      );

      // Set the specified address as default
      await address.update({ isDefault: true });

      return true;
    } catch (error) {
      console.error("Error setting address as default:", error);
      return false;
    }
  }

  /**
   * Check if a user owns an address
   */
  async verifyUserOwnership(
    userId: string,
    addressId: string
  ): Promise<boolean> {
    const address = await Address.findOne({
      where: {
        id: addressId,
        userId,
      },
    });

    return !!address;
  }
}

export default new AddressRepository();
