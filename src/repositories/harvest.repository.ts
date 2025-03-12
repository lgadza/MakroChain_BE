import { Op } from "sequelize";
import Harvest from "../models/harvest.model.js";
import { MarketStatus } from "../constants/harvestTypes.js";

export class HarvestRepository {
  /**
   * Find harvest by ID
   */
  async findById(id: string): Promise<Harvest | null> {
    return Harvest.findByPk(id);
  }

  /**
   * Find harvests by farmer ID
   */
  async findByFarmerId(
    farmerId: string,
    options: {
      limit?: number;
      offset?: number;
      marketStatus?: string;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
    } = {}
  ): Promise<{ rows: Harvest[]; count: number }> {
    const {
      limit = 10,
      offset = 0,
      marketStatus,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = options;

    const where: any = { farmerId };
    if (marketStatus) {
      where.marketStatus = marketStatus;
    }

    return Harvest.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });
  }

  /**
   * Find available harvests for sale
   */
  async findAvailableHarvests(
    options: {
      cropType?: string;
      limit?: number;
      offset?: number;
      minQuantity?: number;
      maxQuantity?: number;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
    } = {}
  ): Promise<{ rows: Harvest[]; count: number }> {
    const {
      cropType,
      limit = 10,
      offset = 0,
      minQuantity,
      maxQuantity,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = options;

    const where: any = {
      marketStatus: MarketStatus.AVAILABLE,
    };

    if (cropType) {
      where.cropType = cropType;
    }

    if (minQuantity !== undefined || maxQuantity !== undefined) {
      where.quantity = {};
      if (minQuantity !== undefined) {
        where.quantity[Op.gte] = minQuantity;
      }
      if (maxQuantity !== undefined) {
        where.quantity[Op.lte] = maxQuantity;
      }
    }

    return Harvest.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });
  }

  /**
   * Create a new harvest record
   */
  async create(harvestData: Partial<Harvest>): Promise<Harvest> {
    return Harvest.create(harvestData as any);
  }

  /**
   * Update a harvest record
   */
  async update(
    id: string,
    harvestData: Partial<Harvest>
  ): Promise<[number, Harvest[]]> {
    const [affectedCount, affectedRows] = await Harvest.update(harvestData, {
      where: { id },
      returning: true,
    });
    return [affectedCount, affectedRows];
  }

  /**
   * Delete a harvest record
   */
  async delete(id: string): Promise<number> {
    return Harvest.destroy({ where: { id } });
  }

  /**
   * Update market status
   */
  async updateMarketStatus(
    id: string,
    status: MarketStatus,
    relatedData: { buyerId?: string; transactionId?: string } = {}
  ): Promise<[number, Harvest[]]> {
    const updateData: any = {
      marketStatus: status,
      ...relatedData,
    };

    return Harvest.update(updateData, {
      where: { id },
      returning: true,
    });
  }

  /**
   * Search harvests by various criteria
   */
  async search(
    criteria: {
      cropType?: string;
      qualityGrade?: string[];
      marketStatus?: string[];
      fromDate?: Date;
      toDate?: Date;
      farmerId?: string;
      buyerId?: string;
    },
    pagination: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
    } = {}
  ): Promise<{ rows: Harvest[]; count: number }> {
    const {
      cropType,
      qualityGrade,
      marketStatus,
      fromDate,
      toDate,
      farmerId,
      buyerId,
    } = criteria;

    const {
      limit = 10,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = pagination;

    const where: any = {};

    if (cropType) {
      where.cropType = { [Op.iLike]: `%${cropType}%` };
    }

    if (qualityGrade && qualityGrade.length > 0) {
      where.qualityGrade = { [Op.in]: qualityGrade };
    }

    if (marketStatus && marketStatus.length > 0) {
      where.marketStatus = { [Op.in]: marketStatus };
    }

    if (fromDate || toDate) {
      where.harvestDate = {};
      if (fromDate) {
        where.harvestDate[Op.gte] = fromDate;
      }
      if (toDate) {
        where.harvestDate[Op.lte] = toDate;
      }
    }

    if (farmerId) {
      where.farmerId = farmerId;
    }

    if (buyerId) {
      where.buyerId = buyerId;
    }

    return Harvest.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });
  }
}

// Export a default instance
export default new HarvestRepository();
