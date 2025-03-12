import PhoneRepository from "../repositories/phone.repository.js";
import { createError } from "../utils/errorUtils.js";
import { ErrorCode } from "../constants/errorCodes.js";
import logger from "../utils/logger.js";
import { PhoneAttributes } from "../models/phone.model.js";

export class PhoneService {
  private phoneRepository = PhoneRepository;

  /**
   * Get all phones for a user with pagination and filters
   */
  async getUserPhones(
    userId: string,
    options: {
      phoneType?: string;
      isDefault?: boolean;
      isVerified?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    phones: PhoneAttributes[];
    total: number;
    pages: number;
  }> {
    try {
      const { page = 1, limit = 10 } = options;
      const { rows, count } = await this.phoneRepository.findByUserId(
        userId,
        options
      );

      return {
        phones: rows,
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error(
        `Error fetching phones for user ${userId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw createError(
        500,
        "Failed to fetch phone numbers",
        ErrorCode.DB_QUERY_ERROR
      );
    }
  }

  /**
   * Get a specific phone by ID
   */
  async getPhoneById(id: string): Promise<PhoneAttributes> {
    try {
      const phone = await this.phoneRepository.findById(id);

      if (!phone) {
        throw createError(
          404,
          "Phone number not found",
          ErrorCode.RESOURCE_NOT_FOUND
        );
      }

      return phone;
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) {
        throw error;
      }
      logger.error(
        `Error fetching phone ${id}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw createError(
        500,
        "Failed to fetch phone number",
        ErrorCode.DB_QUERY_ERROR
      );
    }
  }

  /**
   * Create a new phone for a user
   */
  async createPhone(
    userId: string,
    phoneData: Partial<PhoneAttributes>
  ): Promise<PhoneAttributes> {
    try {
      // Check if phone already exists
      const phoneExists = await this.phoneRepository.phoneExists(
        phoneData.countryCode!,
        phoneData.number!
      );

      if (phoneExists) {
        throw createError(
          409,
          "Phone number already exists",
          ErrorCode.RESOURCE_ALREADY_EXISTS
        );
      }

      const newPhone = await this.phoneRepository.create({
        ...phoneData,
        userId,
      });

      return newPhone;
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) {
        throw error;
      }
      logger.error(
        `Error creating phone for user ${userId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw createError(
        500,
        "Failed to create phone number",
        ErrorCode.DB_ERROR
      );
    }
  }

  /**
   * Update an existing phone
   */
  async updatePhone(
    phoneId: string,
    userId: string,
    data: Partial<PhoneAttributes>
  ): Promise<PhoneAttributes> {
    try {
      const phone = await this.phoneRepository.findById(phoneId);

      if (!phone) {
        throw createError(
          404,
          "Phone number not found",
          ErrorCode.RESOURCE_NOT_FOUND
        );
      }

      // Verify ownership
      try {
        await this.verifyPhoneOwnership(userId, phoneId);
      } catch (error) {
        throw createError(
          403,
          "You don't have permission to update this phone number",
          ErrorCode.RESOURCE_ACCESS_DENIED
        );
      }

      // Check if phone number already exists (if updating the phone number)
      if (data.number && data.countryCode) {
        const existingPhone = await this.phoneRepository.phoneExists(
          data.countryCode,
          data.number,
          phoneId
        );
        if (existingPhone) {
          throw createError(
            409,
            "Phone number already exists",
            ErrorCode.RESOURCE_ALREADY_EXISTS
          );
        }
      }

      const [_, updatedPhones] = await this.phoneRepository.update(
        phoneId,
        data
      );
      if (!updatedPhones || updatedPhones.length === 0) {
        throw createError(500, "Failed to update phone", ErrorCode.DB_ERROR);
      }
      return updatedPhones[0];
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) {
        throw error;
      }
      logger.error(
        `Error updating phone ${phoneId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw createError(
        500,
        "Failed to update phone number",
        ErrorCode.DB_ERROR
      );
    }
  }

  /**
   * Delete a phone
   */
  async deletePhone(id: string, userId: string): Promise<void> {
    try {
      // Check if the phone exists and belongs to the user
      const phone = await this.phoneRepository.findById(id);

      if (!phone) {
        throw createError(
          404,
          "Phone number not found",
          ErrorCode.RESOURCE_NOT_FOUND
        );
      }

      if (phone.userId !== userId) {
        throw createError(
          403,
          "You don't have permission to delete this phone number",
          ErrorCode.RESOURCE_ACCESS_DENIED
        );
      }

      const deleted = await this.phoneRepository.delete(id);

      if (!deleted) {
        throw createError(
          404,
          "Phone number not found or could not be deleted",
          ErrorCode.RESOURCE_NOT_FOUND
        );
      }
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) {
        throw error;
      }
      logger.error(
        `Error deleting phone ${id}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw createError(
        500,
        "Failed to delete phone number",
        ErrorCode.DB_ERROR
      );
    }
  }

  /**
   * Set a phone as default
   */
  async setPhoneAsDefault(id: string, userId: string): Promise<void> {
    try {
      const success = await this.phoneRepository.setAsDefault(id, userId);

      if (!success) {
        throw createError(
          404,
          "Phone number not found or could not be set as default",
          ErrorCode.RESOURCE_NOT_FOUND
        );
      }
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) {
        throw error;
      }
      logger.error(
        `Error setting phone ${id} as default: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw createError(
        500,
        "Failed to set phone as default",
        ErrorCode.DB_ERROR
      );
    }
  }

  /**
   * Request verification code for a phone number
   */
  async requestVerificationCode(id: string, userId: string): Promise<string> {
    try {
      // Check if the phone exists and belongs to the user
      const phone = await this.phoneRepository.findById(id);

      if (!phone) {
        throw createError(
          404,
          "Phone number not found",
          ErrorCode.RESOURCE_NOT_FOUND
        );
      }

      if (phone.userId !== userId) {
        throw createError(
          403,
          "You don't have permission to verify this phone number",
          ErrorCode.RESOURCE_ACCESS_DENIED
        );
      }

      // Generate verification code
      const verificationCode =
        await this.phoneRepository.generateVerificationCode(id);

      if (!verificationCode) {
        throw createError(
          500,
          "Failed to generate verification code",
          ErrorCode.INTERNAL_SERVER_ERROR
        );
      }

      // In a real application, you would send the verification code via SMS here
      // For now, we'll just return it for testing purposes
      return verificationCode;
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) {
        throw error;
      }
      logger.error(
        `Error requesting verification code for phone ${id}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw createError(
        500,
        "Failed to request verification code",
        ErrorCode.DB_ERROR
      );
    }
  }

  /**
   * Verify a phone number with verification code
   */
  async verifyPhone(id: string, userId: string, code: string): Promise<void> {
    try {
      // Check if the phone exists and belongs to the user
      const phone = await this.phoneRepository.findById(id);

      if (!phone) {
        throw createError(
          404,
          "Phone number not found",
          ErrorCode.RESOURCE_NOT_FOUND
        );
      }

      if (phone.userId !== userId) {
        throw createError(
          403,
          "You don't have permission to verify this phone number",
          ErrorCode.RESOURCE_ACCESS_DENIED
        );
      }

      // Verify the code
      const isVerified = await this.phoneRepository.verifyPhone(id, code);

      if (!isVerified) {
        throw createError(
          400,
          "Invalid or expired verification code",
          ErrorCode.VALIDATION_ERROR
        );
      }
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) {
        throw error;
      }
      logger.error(
        `Error verifying phone ${id}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw createError(
        500,
        "Failed to verify phone number",
        ErrorCode.DB_ERROR
      );
    }
  }

  /**
   * Verify user owns a phone
   */
  async verifyPhoneOwnership(
    userId: string,
    phoneId: string
  ): Promise<boolean> {
    try {
      const isOwner = await this.phoneRepository.verifyUserOwnership(
        userId,
        phoneId
      );

      if (!isOwner) {
        throw createError(
          403,
          "You do not own this phone number",
          ErrorCode.RESOURCE_ACCESS_DENIED
        );
      }

      return true;
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) {
        throw error;
      }
      logger.error(
        `Error verifying phone ownership: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw createError(
        500,
        "Failed to verify phone ownership",
        ErrorCode.DB_QUERY_ERROR
      );
    }
  }
}

// Export both the class and a default singleton instance
export default new PhoneService();
