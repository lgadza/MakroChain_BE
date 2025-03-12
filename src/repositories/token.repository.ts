import { Op } from "sequelize";
import Token from "../models/token.model.js";
import { TokenStatus } from "../constants/tokenTypes.js";

export class TokenRepository {
  /**
   * Find token by ID
   */
  async findById(id: string): Promise<Token | null> {
    return Token.findByPk(id);
  }

  /**
   * Find tokens by farmer ID
   */
  async findByFarmerId(
    farmerId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string | string[];
      tokenType?: string;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
      blockchainStatus?: string | string[];
    } = {}
  ): Promise<{ rows: Token[]; count: number }> {
    const {
      limit = 10,
      offset = 0,
      status,
      tokenType,
      blockchainStatus,
      sortBy = "earnedDate",
      sortOrder = "DESC",
    } = options;

    const where: any = { farmerId };

    if (status) {
      where.status = Array.isArray(status) ? { [Op.in]: status } : status;
    }

    if (tokenType) {
      where.tokenType = tokenType;
    }

    if (blockchainStatus) {
      where.blockchainStatus = Array.isArray(blockchainStatus)
        ? { [Op.in]: blockchainStatus }
        : blockchainStatus;
    }

    return Token.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });
  }

  /**
   * Find tokens by harvest ID
   */
  async findByHarvestId(
    harvestId: string,
    options: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
    } = {}
  ): Promise<{ rows: Token[]; count: number }> {
    const {
      limit = 10,
      offset = 0,
      sortBy = "earnedDate",
      sortOrder = "DESC",
    } = options;

    return Token.findAndCountAll({
      where: { harvestId },
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });
  }

  /**
   * Create a new token record
   */
  async create(tokenData: Partial<Token>): Promise<Token> {
    return Token.create(tokenData as any);
  }

  /**
   * Update a token record
   */
  async update(
    id: string,
    tokenData: Partial<Token>
  ): Promise<[number, Token[]]> {
    // Always update lastUpdated
    const updateData = {
      ...tokenData,
      lastUpdated: new Date(),
    };

    const [affectedCount, affectedRows] = await Token.update(updateData, {
      where: { id },
      returning: true,
    });

    return [affectedCount, affectedRows];
  }

  /**
   * Delete a token record
   */
  async delete(id: string): Promise<number> {
    return Token.destroy({ where: { id } });
  }

  /**
   * Update token status
   */
  async updateStatus(
    id: string,
    status: string,
    additionalData: Partial<Token> = {}
  ): Promise<[number, Token[]]> {
    return Token.update(
      {
        status,
        lastUpdated: new Date(),
        ...additionalData,
      },
      {
        where: { id },
        returning: true,
      }
    );
  }

  /**
   * Update blockchain information
   */
  async updateBlockchainInfo(
    id: string,
    blockchainStatus: string,
    blockchainData: Partial<Token> = {}
  ): Promise<[number, Token[]]> {
    return Token.update(
      {
        blockchainStatus,
        lastUpdated: new Date(),
        ...blockchainData,
      },
      {
        where: { id },
        returning: true,
      }
    );
  }

  /**
   * Search tokens by various criteria
   */
  async search(
    criteria: {
      farmerId?: string;
      harvestId?: string;
      status?: string | string[];
      tokenType?: string | string[];
      blockchainStatus?: string | string[];
      minAmount?: number;
      maxAmount?: number;
      fromDate?: Date;
      toDate?: Date;
      hasBlockchainInfo?: boolean;
    },
    pagination: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
    } = {}
  ): Promise<{ rows: Token[]; count: number }> {
    const {
      farmerId,
      harvestId,
      status,
      tokenType,
      blockchainStatus,
      minAmount,
      maxAmount,
      fromDate,
      toDate,
      hasBlockchainInfo,
    } = criteria;

    const {
      limit = 10,
      offset = 0,
      sortBy = "earnedDate",
      sortOrder = "DESC",
    } = pagination;

    const where: any = {};

    if (farmerId) {
      where.farmerId = farmerId;
    }

    if (harvestId) {
      where.harvestId = harvestId;
    }

    if (status) {
      where.status = Array.isArray(status) ? { [Op.in]: status } : status;
    }

    if (tokenType) {
      where.tokenType = Array.isArray(tokenType)
        ? { [Op.in]: tokenType }
        : tokenType;
    }

    if (blockchainStatus) {
      where.blockchainStatus = Array.isArray(blockchainStatus)
        ? { [Op.in]: blockchainStatus }
        : blockchainStatus;
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.tokenAmount = {};
      if (minAmount !== undefined) {
        where.tokenAmount[Op.gte] = minAmount;
      }
      if (maxAmount !== undefined) {
        where.tokenAmount[Op.lte] = maxAmount;
      }
    }

    if (fromDate || toDate) {
      where.earnedDate = {};
      if (fromDate) {
        where.earnedDate[Op.gte] = fromDate;
      }
      if (toDate) {
        where.earnedDate[Op.lte] = toDate;
      }
    }

    if (hasBlockchainInfo === true) {
      where.blockchainTxId = { [Op.ne]: null };
    } else if (hasBlockchainInfo === false) {
      where.blockchainTxId = null;
    }

    return Token.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });
  }

  /**
   * Get expired tokens
   */
  async getExpiredTokens(): Promise<Token[]> {
    const today = new Date();

    return Token.findAll({
      where: {
        status: {
          [Op.notIn]: [TokenStatus.EXPIRED, TokenStatus.REDEEMED],
        },
        expiryDate: {
          [Op.lt]: today,
          [Op.ne]: null,
        },
      },
    });
  }

  /**
   * Record token redemption
   */
  async recordRedemption(
    id: string,
    redemptionAmount: number,
    redemptionDate: Date = new Date(),
    redemptionTxId?: string
  ): Promise<[number, Token[]]> {
    return this.update(id, {
      status: TokenStatus.REDEEMED,
      redemptionAmount,
      redemptionDate,
      redemptionTxId,
    } as Partial<Token>);
  }
}

// Export a default instance
export default new TokenRepository();
