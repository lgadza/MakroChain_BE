import { Request, Response, NextFunction } from "express";
import AddressService from "../services/address.service.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { createError } from "../utils/errorUtils.js";
import { sendSuccess } from "../utils/responseUtil.js";
import logger from "../utils/logger.js";
import { ErrorCode } from "../constants/errorCodes.js";

export class AddressController {
  private addressService: typeof AddressService;

  constructor() {
    this.addressService = AddressService;
  }

  /**
   * Get all addresses for the authenticated user
   */
  getUserAddresses = async (
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

      const { addressType, isDefault } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const options: any = { page, limit };
      if (addressType) options.addressType = addressType;
      if (isDefault !== undefined) options.isDefault = isDefault === "true";

      const result = await this.addressService.getUserAddresses(
        req.user.userId,
        options
      );

      sendSuccess(
        res,
        result.addresses,
        "Addresses retrieved successfully",
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
        `Failed to get addresses: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      next(
        createError(
          500,
          "Failed to retrieve addresses",
          ErrorCode.DB_QUERY_ERROR
        )
      );
    }
  };

  /**
   * Get a specific address by ID
   */
  getAddressById = async (
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
      const address = await this.addressService.getAddressById(id);

      // Check if the address belongs to the authenticated user
      if (address.userId !== req.user.userId && req.user.role !== "ADMIN") {
        next(
          createError(
            403,
            "You don't have permission to access this address",
            ErrorCode.RESOURCE_ACCESS_DENIED
          )
        );
        return;
      }

      sendSuccess(res, address, "Address retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new address
   */
  createAddress = async (
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

      const addressData = req.body;
      const newAddress = await this.addressService.createAddress(
        req.user.userId,
        addressData
      );

      sendSuccess(res, newAddress, "Address created successfully", 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update an existing address
   */
  updateAddress = async (
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
      const addressData = req.body;

      const updatedAddress = await this.addressService.updateAddress(
        id,
        req.user.userId,
        addressData
      );

      sendSuccess(res, updatedAddress, "Address updated successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete an address
   */
  deleteAddress = async (
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

      await this.addressService.deleteAddress(id, req.user.userId);

      sendSuccess(res, null, "Address deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Set an address as default
   */
  setAddressAsDefault = async (
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

      await this.addressService.setAddressAsDefault(id, req.user.userId);

      sendSuccess(res, null, "Address set as default successfully");
    } catch (error) {
      next(error);
    }
  };
}

export default new AddressController();
