import { Request, Response, NextFunction } from "express";
import PhoneService from "../services/phone.service.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { createError } from "../utils/errorUtils.js";
import { sendSuccess } from "../utils/responseUtil.js";
import logger from "../utils/logger.js";
import { ErrorCode } from "../constants/errorCodes.js";

export class PhoneController {
  private phoneService: typeof PhoneService;

  constructor() {
    this.phoneService = PhoneService;
  }

  /**
   * Get all phones for the authenticated user
   */
  getUserPhones = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.userId) {
        next(
          createError(
            401,
            "Authentication required",
            ErrorCode.INVALID_CREDENTIALS
          )
        );
        return;
      }

      const { phoneType, isDefault, isVerified } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const options: any = { page, limit };
      if (phoneType) options.phoneType = phoneType;
      if (isDefault !== undefined) options.isDefault = isDefault === "true";
      if (isVerified !== undefined) options.isVerified = isVerified === "true";

      const result = await this.phoneService.getUserPhones(
        req.user.userId,
        options
      );

      sendSuccess(
        res,
        result.phones,
        "Phone numbers retrieved successfully",
        200,
        {
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: result.pages,
          },
        }
      );
    } catch (error) {
      logger.error(
        `Failed to get phones: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      next(
        createError(
          500,
          "Failed to retrieve phone numbers",
          ErrorCode.DB_QUERY_ERROR
        )
      );
    }
  };

  /**
   * Get a specific phone by ID
   */
  getPhoneById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.userId) {
        next(
          createError(
            401,
            "Authentication required",
            ErrorCode.INVALID_CREDENTIALS
          )
        );
        return;
      }

      const { id } = req.params;
      const phone = await this.phoneService.getPhoneById(id);

      // Check if the phone belongs to the authenticated user
      if (phone.userId !== req.user.userId && req.user.role !== "ADMIN") {
        next(
          createError(
            403,
            "You don't have permission to access this phone number",
            ErrorCode.RESOURCE_ACCESS_DENIED
          )
        );
        return;
      }

      sendSuccess(res, phone, "Phone number retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new phone
   */
  createPhone = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.userId) {
        next(
          createError(
            401,
            "Authentication required",
            ErrorCode.INVALID_CREDENTIALS
          )
        );
        return;
      }

      const phoneData = req.body;
      const newPhone = await this.phoneService.createPhone(
        req.user.userId,
        phoneData
      );

      sendSuccess(res, newPhone, "Phone number created successfully", 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update an existing phone
   */
  updatePhone = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.userId) {
        next(
          createError(
            401,
            "Authentication required",
            ErrorCode.INVALID_CREDENTIALS
          )
        );
        return;
      }

      const { id } = req.params;
      const phoneData = req.body;

      const updatedPhone = await this.phoneService.updatePhone(
        id,
        req.user.userId,
        phoneData
      );

      sendSuccess(res, updatedPhone, "Phone number updated successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a phone
   */
  deletePhone = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.userId) {
        next(
          createError(
            401,
            "Authentication required",
            ErrorCode.INVALID_CREDENTIALS
          )
        );
        return;
      }

      const { id } = req.params;

      await this.phoneService.deletePhone(id, req.user.userId);

      sendSuccess(res, null, "Phone number deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Set a phone as default
   */
  setPhoneAsDefault = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.userId) {
        next(
          createError(
            401,
            "Authentication required",
            ErrorCode.INVALID_CREDENTIALS
          )
        );
        return;
      }

      const { id } = req.params;

      await this.phoneService.setPhoneAsDefault(id, req.user.userId);

      sendSuccess(res, null, "Phone number set as default successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Request a verification code for a phone number
   */
  requestVerificationCode = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.userId) {
        next(
          createError(
            401,
            "Authentication required",
            ErrorCode.INVALID_CREDENTIALS
          )
        );
        return;
      }

      const { id } = req.params;
      const verificationCode = await this.phoneService.requestVerificationCode(
        id,
        req.user.userId
      );

      // In a production environment, we would send the code via SMS
      // and not include it in the response
      // For development/testing, we include it in the response
      sendSuccess(
        res,
        { verificationCode },
        "Verification code sent successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify a phone number with a verification code
   */
  verifyPhone = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.userId) {
        next(
          createError(
            401,
            "Authentication required",
            ErrorCode.INVALID_CREDENTIALS
          )
        );
        return;
      }

      const { id } = req.params;
      const { verificationCode } = req.body;

      await this.phoneService.verifyPhone(
        id,
        req.user.userId,
        verificationCode
      );

      sendSuccess(res, null, "Phone number verified successfully");
    } catch (error) {
      next(error);
    }
  };
}

export default new PhoneController();
