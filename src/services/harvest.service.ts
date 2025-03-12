import { HarvestRepository } from "../repositories/harvest.repository.js";
import {
  IHarvestService,
  HarvestFilterOptions,
  PaginationOptions,
  HarvestResult,
} from "../interfaces/services/harvest.service.interface.js";
import Harvest from "../models/harvest.model.js";
import { MarketStatus } from "../constants/harvestTypes.js";
import { ErrorFactory } from "../utils/errorUtils.js";
import logger from "../utils/logger.js";

export class HarvestService implements IHarvestService {
  private harvestRepository: HarvestRepository;

  constructor() {
    this.harvestRepository = new HarvestRepository();
  }

  /**
   * Get a harvest by ID
   */
  async getHarvestById(id: string): Promise<Harvest> {
    const harvest = await this.harvestRepository.findById(id);

    if (!harvest) {
      throw ErrorFactory.notFound(`Harvest with ID ${id} not found`);
    }

    return harvest;
  }

  /**
   * Get harvests for a specific farmer
   */
  async getFarmerHarvests(
    farmerId: string,
    options: PaginationOptions = {},
    filters: Partial<HarvestFilterOptions> = {}
  ): Promise<HarvestResult> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "DESC",
      } = options;
      const offset = (page - 1) * limit;

      const { rows, count } = await this.harvestRepository.findByFarmerId(
        farmerId,
        {
          limit,
          offset,
          marketStatus: filters.marketStatus?.[0],
          sortBy,
          sortOrder,
        }
      );

      return {
        harvests: rows,
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error(
        `Error getting farmer harvests: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to retrieve farmer harvests");
    }
  }

  /**
   * Get available harvests for marketplace
   */
  async getAvailableHarvests(
    options: PaginationOptions = {},
    filters: Partial<HarvestFilterOptions> = {}
  ): Promise<HarvestResult> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "DESC",
      } = options;
      const offset = (page - 1) * limit;

      const { rows, count } =
        await this.harvestRepository.findAvailableHarvests({
          cropType: filters.cropType,
          limit,
          offset,
          minQuantity: filters.minQuantity,
          maxQuantity: filters.maxQuantity,
          sortBy,
          sortOrder,
        });

      return {
        harvests: rows,
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error(
        `Error getting available harvests: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to retrieve available harvests");
    }
  }

  /**
   * Create a new harvest record
   */
  async createHarvest(harvestData: Partial<Harvest>): Promise<Harvest> {
    try {
      // Default market status to AVAILABLE if not provided
      if (!harvestData.marketStatus) {
        harvestData.marketStatus = MarketStatus.AVAILABLE;
      }

      const harvest = await this.harvestRepository.create(harvestData);
      return harvest;
    } catch (error) {
      logger.error(
        `Error creating harvest: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      if (error instanceof Error && error.name === "SequelizeValidationError") {
        throw ErrorFactory.validation("Invalid harvest data", undefined, error);
      }

      throw ErrorFactory.internal("Failed to create harvest record");
    }
  }

  /**
   * Update an existing harvest record
   */
  async updateHarvest(
    id: string,
    harvestData: Partial<Harvest>
  ): Promise<Harvest> {
    try {
      const harvest = await this.getHarvestById(id);

      // Prevent updating certain fields if harvest is sold
      if (harvest.marketStatus === MarketStatus.SOLD) {
        const protectedFields = [
          "farmerId",
          "cropType",
          "quantity",
          "harvestDate",
        ];
        const hasProtectedFields = protectedFields.some((field) =>
          Object.prototype.hasOwnProperty.call(harvestData, field)
        );

        if (hasProtectedFields) {
          throw ErrorFactory.forbidden(
            "Cannot update core harvest details after it has been sold"
          );
        }
      }

      // Update the harvest
      const [affectedCount, affectedRows] = await this.harvestRepository.update(
        id,
        harvestData
      );

      if (affectedCount === 0) {
        throw ErrorFactory.notFound(`Harvest with ID ${id} not found`);
      }

      return affectedRows[0];
    } catch (error) {
      // Rethrow errors from getHarvestById and other custom errors
      if (
        error instanceof Error &&
        (error.name === "NotFoundError" || error.name === "ForbiddenError")
      ) {
        throw error;
      }

      logger.error(
        `Error updating harvest: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      if (error instanceof Error && error.name === "SequelizeValidationError") {
        throw ErrorFactory.validation("Invalid harvest data", undefined, error);
      }

      throw ErrorFactory.internal("Failed to update harvest record");
    }
  }

  /**
   * Delete a harvest record
   */
  async deleteHarvest(id: string): Promise<boolean> {
    try {
      const harvest = await this.getHarvestById(id);

      // Prevent deleting sold harvests
      if (harvest.marketStatus === MarketStatus.SOLD) {
        throw ErrorFactory.forbidden(
          "Cannot delete a harvest that has been sold"
        );
      }

      const deletedCount = await this.harvestRepository.delete(id);
      return deletedCount > 0;
    } catch (error) {
      // Rethrow errors from getHarvestById and other custom errors
      if (
        error instanceof Error &&
        (error.name === "NotFoundError" || error.name === "ForbiddenError")
      ) {
        throw error;
      }

      logger.error(
        `Error deleting harvest: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to delete harvest record");
    }
  }

  /**
   * Mark a harvest as sold
   */
  async markAsSold(
    id: string,
    buyerId: string,
    transactionId?: string
  ): Promise<Harvest> {
    try {
      const harvest = await this.getHarvestById(id);

      // Check if harvest can be sold
      if (!harvest.canBeSold()) {
        throw ErrorFactory.conflict(
          `Harvest is not available for sale (current status: ${harvest.marketStatus})`
        );
      }

      const [affectedCount, affectedRows] =
        await this.harvestRepository.updateMarketStatus(id, MarketStatus.SOLD, {
          buyerId,
          transactionId,
        });

      if (affectedCount === 0) {
        throw ErrorFactory.notFound(`Harvest with ID ${id} not found`);
      }

      return affectedRows[0];
    } catch (error) {
      // Rethrow errors from getHarvestById and other custom errors
      if (
        error instanceof Error &&
        (error.name === "NotFoundError" || error.name === "ConflictError")
      ) {
        throw error;
      }

      logger.error(
        `Error marking harvest as sold: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to mark harvest as sold");
    }
  }

  /**
   * Mark a harvest as reserved
   */
  async markAsReserved(id: string, buyerId?: string): Promise<Harvest> {
    try {
      const harvest = await this.getHarvestById(id);

      // Check if harvest can be reserved
      if (harvest.marketStatus !== MarketStatus.AVAILABLE) {
        throw ErrorFactory.conflict(
          `Harvest cannot be reserved (current status: ${harvest.marketStatus})`
        );
      }

      const [affectedCount, affectedRows] =
        await this.harvestRepository.updateMarketStatus(
          id,
          MarketStatus.RESERVED,
          buyerId ? { buyerId } : {}
        );

      if (affectedCount === 0) {
        throw ErrorFactory.notFound(`Harvest with ID ${id} not found`);
      }

      return affectedRows[0];
    } catch (error) {
      // Rethrow errors from getHarvestById and other custom errors
      if (
        error instanceof Error &&
        (error.name === "NotFoundError" || error.name === "ConflictError")
      ) {
        throw error;
      }

      logger.error(
        `Error marking harvest as reserved: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to mark harvest as reserved");
    }
  }

  /**
   * Search harvests by various criteria
   */
  async searchHarvests(
    filters: HarvestFilterOptions,
    pagination: PaginationOptions
  ): Promise<HarvestResult> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "DESC",
      } = pagination;
      const offset = (page - 1) * limit;

      const { rows, count } = await this.harvestRepository.search(filters, {
        limit,
        offset,
        sortBy,
        sortOrder,
      });

      return {
        harvests: rows,
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error(
        `Error searching harvests: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to search harvests");
    }
  }
}

// Export both the class and a default singleton instance
export default new HarvestService();
