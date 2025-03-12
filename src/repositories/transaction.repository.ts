import { Op } from "sequelize";
import Transaction from "../models/transaction.model.js";

export class TransactionRepository {
  /**
   * Find transaction by ID
   */
  async findById(id: string): Promise<Transaction | null> {
    return Transaction.findByPk(id);
  }

  /**
   * Find transactions by farmer ID
   */
  async findByFarmerId(
    farmerId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
      transactionType?: string;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
    } = {}
  ): Promise<{ rows: Transaction[]; count: number }> {
    const {
      limit = 10,
      offset = 0,
      status,
      transactionType,
      sortBy = "transactionDate",
      sortOrder = "DESC",
    } = options;

    const where: any = { farmerId };

    if (status) {
      where.status = status;
    }

    if (transactionType) {
      where.transactionType = transactionType;
    }

    return Transaction.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });
  }

  /**
   * Find transactions by buyer ID
   */
  async findByBuyerId(
    buyerId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
      transactionType?: string;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
    } = {}
  ): Promise<{ rows: Transaction[]; count: number }> {
    const {
      limit = 10,
      offset = 0,
      status,
      transactionType,
      sortBy = "transactionDate",
      sortOrder = "DESC",
    } = options;

    const where: any = { buyerId };

    if (status) {
      where.status = status;
    }

    if (transactionType) {
      where.transactionType = transactionType;
    }

    return Transaction.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });
  }

  /**
   * Find transactions by harvest ID
   */
  async findByHarvestId(
    harvestId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
    } = {}
  ): Promise<{ rows: Transaction[]; count: number }> {
    const {
      limit = 10,
      offset = 0,
      status,
      sortBy = "transactionDate",
      sortOrder = "DESC",
    } = options;

    const where: any = { harvestId };

    if (status) {
      where.status = status;
    }

    return Transaction.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });
  }

  /**
   * Create a new transaction record
   */
  async create(transactionData: Partial<Transaction>): Promise<Transaction> {
    return Transaction.create(transactionData as any);
  }

  /**
   * Update a transaction record
   */
  async update(
    id: string,
    transactionData: Partial<Transaction>
  ): Promise<[number, Transaction[]]> {
    const [affectedCount, affectedRows] = await Transaction.update(
      transactionData,
      {
        where: { id },
        returning: true,
      }
    );
    return [affectedCount, affectedRows];
  }

  /**
   * Delete a transaction record
   */
  async delete(id: string): Promise<number> {
    return Transaction.destroy({ where: { id } });
  }

  /**
   * Update transaction status
   */
  async updateStatus(
    id: string,
    status: string
  ): Promise<[number, Transaction[]]> {
    return Transaction.update(
      { status },
      {
        where: { id },
        returning: true,
      }
    );
  }

  /**
   * Search transactions by various criteria
   */
  async search(
    criteria: {
      farmerId?: string;
      buyerId?: string;
      harvestId?: string;
      transactionType?: string[];
      status?: string[];
      fromDate?: Date;
      toDate?: Date;
      minAmount?: number;
      maxAmount?: number;
      reference?: string;
    },
    pagination: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
    } = {}
  ): Promise<{ rows: Transaction[]; count: number }> {
    const {
      farmerId,
      buyerId,
      harvestId,
      transactionType,
      status,
      fromDate,
      toDate,
      minAmount,
      maxAmount,
      reference,
    } = criteria;

    const {
      limit = 10,
      offset = 0,
      sortBy = "transactionDate",
      sortOrder = "DESC",
    } = pagination;

    const where: any = {};

    if (farmerId) {
      where.farmerId = farmerId;
    }

    if (buyerId) {
      where.buyerId = buyerId;
    }

    if (harvestId) {
      where.harvestId = harvestId;
    }

    if (transactionType && transactionType.length > 0) {
      where.transactionType = { [Op.in]: transactionType };
    }

    if (status && status.length > 0) {
      where.status = { [Op.in]: status };
    }

    if (fromDate || toDate) {
      where.transactionDate = {};
      if (fromDate) {
        where.transactionDate[Op.gte] = fromDate;
      }
      if (toDate) {
        where.transactionDate[Op.lte] = toDate;
      }
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) {
        where.amount[Op.gte] = minAmount;
      }
      if (maxAmount !== undefined) {
        where.amount[Op.lte] = maxAmount;
      }
    }

    if (reference) {
      where.reference = { [Op.iLike]: `%${reference}%` };
    }

    return Transaction.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });
  }
}

// Export a default instance
export default new TransactionRepository();
