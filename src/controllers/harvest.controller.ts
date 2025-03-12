import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import HarvestService from "../services/harvest.service.js";
import { sendSuccess } from "../utils/responseUtil.js";
import logger from "../utils/logger.js";
import { ErrorFactory } from "../utils/errorUtils.js";
import {
  HarvestDTO,
  HarvestResponse,
  HarvestQueryParams,
  CreateHarvestDTO,
  UpdateHarvestDTO,
  SellHarvestDTO,
  ReserveHarvestDTO,
} from "../dto/harvest.dto.js";
import { MarketStatus } from "../constants/harvestTypes.js";
import { Roles } from "../constants/roles.js";

export class HarvestController {
  private harvestService = HarvestService;

  /**
   * Transform Harvest model to DTO response
   */
  private toResponseDTO(harvest: any): HarvestResponse {
    return {
      id: harvest.id,
      farmerId: harvest.farmerId,
      cropType: harvest.cropType,
      variety: harvest.variety,
      quantity: Number(harvest.quantity),
      unitOfMeasure: harvest.unitOfMeasure,
      qualityGrade: harvest.qualityGrade,
      harvestDate:
        harvest.harvestDate instanceof Date
          ? harvest.harvestDate.toISOString().split("T")[0]
          : harvest.harvestDate,
      storageLocation: harvest.storageLocation,
      expectedPrice: Number(harvest.expectedPrice),
      marketStatus: harvest.marketStatus,
      totalValue: Number((harvest.quantity * harvest.expectedPrice).toFixed(2)),
      buyerId: harvest.buyerId,
      transactionId: harvest.transactionId,
      blockchainHash: harvest.blockchainHash,
      createdAt:
        harvest.createdAt instanceof Date
          ? harvest.createdAt.toISOString()
          : harvest.createdAt,
      updatedAt:
        harvest.updatedAt instanceof Date
          ? harvest.updatedAt.toISOString()
          : harvest.updatedAt,
    };
  }

  /**
   * Get all harvests with filtering and pagination
   */
  getAllHarvests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = req.query as unknown as HarvestQueryParams;

      // Parse pagination options
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const sortBy = query.sortBy || "createdAt";
      const sortOrder =
        (query.sortOrder?.toUpperCase() as "ASC" | "DESC") || "DESC";

      // Parse filter options
      const filters: any = {};

      if (query.cropType) filters.cropType = query.cropType;
      if (query.qualityGrade)
        filters.qualityGrade = Array.isArray(query.qualityGrade)
          ? query.qualityGrade
          : [query.qualityGrade];
      if (query.marketStatus)
        filters.marketStatus = Array.isArray(query.marketStatus)
          ? query.marketStatus
          : [query.marketStatus];
      if (query.fromDate) filters.fromDate = new Date(query.fromDate);
      if (query.toDate) filters.toDate = new Date(query.toDate);
      if (query.minQuantity) filters.minQuantity = Number(query.minQuantity);
      if (query.maxQuantity) filters.maxQuantity = Number(query.maxQuantity);

      const result = await this.harvestService.searchHarvests(filters, {
        page,
        limit,
        sortBy,
        sortOrder,
      });

      const responseData = {
        harvests: result.harvests.map((harvest) => this.toResponseDTO(harvest)),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.pages,
        },
      };

      sendSuccess(
        res,
        responseData.harvests,
        "Harvests retrieved successfully",
        200,
        {
          pagination: responseData.pagination,
        }
      );
    } catch (error) {
      logger.error(
        `Failed to get harvests: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      next(error);
    }
  };

  /**
   * Get available harvests for marketplace
   */
  getAvailableHarvests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = req.query as unknown as HarvestQueryParams;

      // Parse pagination options
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const sortBy = query.sortBy || "createdAt";
      const sortOrder =
        (query.sortOrder?.toUpperCase() as "ASC" | "DESC") || "DESC";

      // Parse filter options
      const filters: any = {};

      if (query.cropType) filters.cropType = query.cropType;
      if (query.qualityGrade)
        filters.qualityGrade = Array.isArray(query.qualityGrade)
          ? query.qualityGrade
          : [query.qualityGrade];
      if (query.minQuantity) filters.minQuantity = Number(query.minQuantity);
      if (query.maxQuantity) filters.maxQuantity = Number(query.maxQuantity);

      const result = await this.harvestService.getAvailableHarvests(
        { page, limit, sortBy, sortOrder },
        filters
      );

      const responseData = {
        harvests: result.harvests.map((harvest) => this.toResponseDTO(harvest)),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.pages,
        },
      };

      sendSuccess(
        res,
        responseData.harvests,
        "Available harvests retrieved successfully",
        200,
        {
          pagination: responseData.pagination,
        }
      );
    } catch (error) {
      logger.error(
        `Failed to get available harvests: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      next(error);
    }
  };

  /**
   * Get a single harvest by ID
   */
  getHarvestById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const harvest = await this.harvestService.getHarvestById(id);

      sendSuccess(
        res,
        this.toResponseDTO(harvest),
        "Harvest retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get harvests for a specific farmer
   */
  getFarmerHarvests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { farmerId } = req.params;
      const query = req.query as unknown as HarvestQueryParams;

      // Parse pagination options
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const sortBy = query.sortBy || "createdAt";
      const sortOrder =
        (query.sortOrder?.toUpperCase() as "ASC" | "DESC") || "DESC";

      // Parse filter options
      const filters: any = {};

      if (query.marketStatus)
        filters.marketStatus = Array.isArray(query.marketStatus)
          ? query.marketStatus
          : [query.marketStatus];

      const result = await this.harvestService.getFarmerHarvests(
        farmerId,
        { page, limit, sortBy, sortOrder },
        filters
      );

      const responseData = {
        harvests: result.harvests.map((harvest) => this.toResponseDTO(harvest)),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.pages,
        },
      };

      sendSuccess(
        res,
        responseData.harvests,
        "Farmer harvests retrieved successfully",
        200,
        {
          pagination: responseData.pagination,
        }
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new harvest
   */
  createHarvest = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const harvestData: CreateHarvestDTO = req.body;

      // If user is a farmer, ensure they can only create harvests for themselves
      if (req.user?.role !== Roles.ADMIN && req.user?.role !== Roles.MANAGER) {
        harvestData.farmerId = req.user?.userId as string;
      }

      // Prepare data for service by ensuring harvestDate is a Date object
      const serviceData: Partial<any> = { ...harvestData };

      // Convert harvestDate to Date object
      if (harvestData.harvestDate) {
        serviceData.harvestDate = new Date(harvestData.harvestDate);
      }

      const harvest = await this.harvestService.createHarvest(serviceData);

      sendSuccess(
        res,
        this.toResponseDTO(harvest),
        "Harvest created successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a harvest
   */
  updateHarvest = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const harvestData: UpdateHarvestDTO = req.body;

      // For non-admin/manager users, first verify ownership
      if (req.user?.role !== Roles.ADMIN && req.user?.role !== Roles.MANAGER) {
        const harvest = await this.harvestService.getHarvestById(id);

        if (harvest.farmerId !== req.user?.userId) {
          throw ErrorFactory.forbidden("You can only update your own harvests");
        }
      }

      // Prepare data for service by ensuring harvestDate is a Date object
      const serviceData: Partial<any> = { ...harvestData };

      // Convert harvestDate to Date object if it exists
      if (harvestData.harvestDate) {
        serviceData.harvestDate = new Date(harvestData.harvestDate);
      }

      const updatedHarvest = await this.harvestService.updateHarvest(
        id,
        serviceData
      );

      sendSuccess(
        res,
        this.toResponseDTO(updatedHarvest),
        "Harvest updated successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a harvest
   */
  deleteHarvest = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      // For non-admin/manager users, first verify ownership
      if (req.user?.role !== Roles.ADMIN && req.user?.role !== Roles.MANAGER) {
        const harvest = await this.harvestService.getHarvestById(id);

        if (harvest.farmerId !== req.user?.userId) {
          throw ErrorFactory.forbidden("You can only delete your own harvests");
        }
      }

      await this.harvestService.deleteHarvest(id);

      sendSuccess(res, null, "Harvest deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark a harvest as sold
   */
  markHarvestAsSold = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { buyerId, transactionId }: SellHarvestDTO = req.body;

      // For non-admin/manager users, first verify ownership
      if (req.user?.role !== Roles.ADMIN && req.user?.role !== Roles.MANAGER) {
        const harvest = await this.harvestService.getHarvestById(id);

        if (harvest.farmerId !== req.user?.userId) {
          throw ErrorFactory.forbidden("You can only sell your own harvests");
        }
      }

      const updatedHarvest = await this.harvestService.markAsSold(
        id,
        buyerId,
        transactionId
      );

      sendSuccess(
        res,
        this.toResponseDTO(updatedHarvest),
        "Harvest marked as sold successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark a harvest as reserved
   */
  markHarvestAsReserved = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { buyerId }: ReserveHarvestDTO = req.body;

      // For non-admin/manager users, first verify ownership
      if (req.user?.role !== Roles.ADMIN && req.user?.role !== Roles.MANAGER) {
        const harvest = await this.harvestService.getHarvestById(id);

        if (harvest.farmerId !== req.user?.userId) {
          throw ErrorFactory.forbidden(
            "You can only reserve your own harvests"
          );
        }
      }

      const updatedHarvest = await this.harvestService.markAsReserved(
        id,
        buyerId
      );

      sendSuccess(
        res,
        this.toResponseDTO(updatedHarvest),
        "Harvest marked as reserved successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get harvests by buyer ID
   */
  getBuyerHarvests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { buyerId } = req.params;
      const query = req.query as unknown as HarvestQueryParams;

      // Parse pagination options
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const sortBy = query.sortBy || "createdAt";
      const sortOrder =
        (query.sortOrder?.toUpperCase() as "ASC" | "DESC") || "DESC";

      // Set up buyer filter
      const filters: any = {
        buyerId: buyerId,
      };

      if (query.marketStatus)
        filters.marketStatus = Array.isArray(query.marketStatus)
          ? query.marketStatus
          : [query.marketStatus];

      const result = await this.harvestService.searchHarvests(filters, {
        page,
        limit,
        sortBy,
        sortOrder,
      });

      const responseData = {
        harvests: result.harvests.map((harvest) => this.toResponseDTO(harvest)),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.pages,
        },
      };

      sendSuccess(
        res,
        responseData.harvests,
        "Buyer harvests retrieved successfully",
        200,
        {
          pagination: responseData.pagination,
        }
      );
    } catch (error) {
      next(error);
    }
  };
}

export default new HarvestController();
