import crypto from "crypto";
import { Op } from "sequelize";
import Phone, { PhoneAttributes } from "../models/phone.model.js";

export class PhoneRepository {
  /**
   * Find phone by ID
   */
  async findById(id: string): Promise<Phone | null> {
    return Phone.findByPk(id);
  }

  /**
   * Find all phones for a user
   */
  async findByUserId(
    userId: string,
    options: {
      phoneType?: string;
      isDefault?: boolean;
      isVerified?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ rows: Phone[]; count: number }> {
    const { phoneType, isDefault, isVerified, page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    // Build the where clause
    const whereClause: any = { userId };
    if (phoneType) {
      whereClause.phoneType = phoneType;
    }
    if (isDefault !== undefined) {
      whereClause.isDefault = isDefault;
    }
    if (isVerified !== undefined) {
      whereClause.isVerified = isVerified;
    }

    return Phone.findAndCountAll({
      where: whereClause,
      offset,
      limit,
      order: [
        ["phoneType", "ASC"],
        ["isDefault", "DESC"],
        ["updatedAt", "DESC"],
      ],
    });
  }

  /**
   * Check if phone number already exists
   */
  async phoneExists(
    countryCode: string,
    number: string,
    excludeId?: string
  ): Promise<boolean> {
    const whereClause: any = {
      countryCode,
      number,
    };

    // Exclude the current phone if updating
    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const count = await Phone.count({ where: whereClause });
    return count > 0;
  }

  /**
   * Create a new phone
   */
  async create(phoneData: Partial<PhoneAttributes>): Promise<Phone> {
    return Phone.create(phoneData as any);
  }

  /**
   * Update a phone
   */
  async update(
    id: string,
    phoneData: Partial<PhoneAttributes>
  ): Promise<[number, Phone[]]> {
    return Phone.update(phoneData, {
      where: { id },
      returning: true,
    });
  }

  /**
   * Delete a phone
   */
  async delete(id: string): Promise<number> {
    return Phone.destroy({ where: { id } });
  }

  /**
   * Find default phone for a user by type
   */
  async findDefaultByUserAndType(
    userId: string,
    phoneType: string
  ): Promise<Phone | null> {
    return Phone.findOne({
      where: {
        userId,
        phoneType,
        isDefault: true,
      },
    });
  }

  /**
   * Set a phone as default and unset others
   */
  async setAsDefault(id: string, userId: string): Promise<boolean> {
    try {
      // Begin a transaction to ensure consistency
      const phone = await Phone.findByPk(id);
      if (!phone || phone.userId !== userId) {
        return false;
      }

      // Get the phone type from the found phone
      const phoneType = phone.phoneType;

      // Update all phones of the same type for this user to not be default
      await Phone.update(
        { isDefault: false },
        {
          where: {
            userId,
            phoneType,
            isDefault: true,
          },
        }
      );

      // Set the specified phone as default
      await phone.update({ isDefault: true });

      return true;
    } catch (error) {
      console.error("Error setting phone as default:", error);
      return false;
    }
  }

  /**
   * Generate verification code for phone
   */
  async generateVerificationCode(id: string): Promise<string | null> {
    try {
      const phone = await Phone.findByPk(id);
      if (!phone) {
        return null;
      }

      // Generate a random 6-digit code
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      // Set expiration time (e.g., 10 minutes from now)
      const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

      await phone.update({ verificationCode, verificationExpires });

      return verificationCode;
    } catch (error) {
      console.error("Error generating verification code:", error);
      return null;
    }
  }

  /**
   * Verify phone with verification code
   */
  async verifyPhone(id: string, code: string): Promise<boolean> {
    try {
      const phone = await Phone.findByPk(id);
      if (
        !phone ||
        !phone.verificationCode ||
        !phone.verificationExpires ||
        phone.verificationCode !== code ||
        new Date() > phone.verificationExpires
      ) {
        return false;
      }

      await phone.update({
        isVerified: true,
        verificationCode: undefined,
        verificationExpires: undefined,
      });

      return true;
    } catch (error) {
      console.error("Error verifying phone:", error);
      return false;
    }
  }

  /**
   * Check if a user owns a phone
   */
  async verifyUserOwnership(userId: string, phoneId: string): Promise<boolean> {
    const phone = await Phone.findOne({
      where: {
        id: phoneId,
        userId,
      },
    });

    return !!phone;
  }
}

export default new PhoneRepository();
