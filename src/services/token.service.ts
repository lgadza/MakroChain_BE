import { TokenRepository } from "../repositories/token.repository.js";
import {
  ITokenService,
  TokenFilterOptions,
  PaginationOptions,
  TokenResult,
  TokenBlockchainUpdateOptions,
  TokenRedemptionOptions,
} from "../interfaces/services/token.service.interface.js";
import Token from "../models/token.model.js";
import {
  TokenStatus,
  BlockchainStatus,
  TokenType,
} from "../constants/tokenTypes.js";
import { ErrorFactory } from "../utils/errorUtils.js";
import logger from "../utils/logger.js";
import TransactionService from "./transaction.service.js";
import {
  TransactionType,
  PaymentMethod,
  Currency,
} from "../constants/transactionTypes.js";

export class TokenService implements ITokenService {
  private tokenRepository: TokenRepository;
  private transactionService;

  constructor() {
    this.tokenRepository = new TokenRepository();
    this.transactionService = TransactionService;
  }

  /**
   * Get a token by ID
   */
  async getTokenById(id: string): Promise<Token> {
    const token = await this.tokenRepository.findById(id);

    if (!token) {
      throw ErrorFactory.notFound(`Token with ID ${id} not found`);
    }

    return token;
  }

  /**
   * Get tokens for a specific farmer
   */
  async getFarmerTokens(
    farmerId: string,
    options: PaginationOptions = {},
    filters: Partial<TokenFilterOptions> = {}
  ): Promise<TokenResult> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "earnedDate",
        sortOrder = "DESC",
      } = options;
      const offset = (page - 1) * limit;

      const { rows, count } = await this.tokenRepository.findByFarmerId(
        farmerId,
        {
          limit,
          offset,
          status: filters.status,
          tokenType: filters.tokenType as string,
          blockchainStatus: filters.blockchainStatus,
          sortBy,
          sortOrder,
        }
      );

      return {
        tokens: rows,
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error(
        `Error getting farmer tokens: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to retrieve farmer tokens");
    }
  }

  /**
   * Get tokens for a specific harvest
   */
  async getHarvestTokens(
    harvestId: string,
    options: PaginationOptions = {}
  ): Promise<TokenResult> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "earnedDate",
        sortOrder = "DESC",
      } = options;
      const offset = (page - 1) * limit;

      const { rows, count } = await this.tokenRepository.findByHarvestId(
        harvestId,
        {
          limit,
          offset,
          sortBy,
          sortOrder,
        }
      );

      return {
        tokens: rows,
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error(
        `Error getting harvest tokens: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to retrieve harvest tokens");
    }
  }

  /**
   * Create a new token
   */
  async createToken(tokenData: Partial<Token>): Promise<Token> {
    try {
      // Set default values if not provided
      if (!tokenData.status) {
        tokenData.status = TokenStatus.PENDING;
      }

      if (!tokenData.tokenType) {
        tokenData.tokenType = TokenType.HARVEST;
      }

      if (!tokenData.blockchainStatus) {
        tokenData.blockchainStatus = BlockchainStatus.UNMINTED;
      }

      if (!tokenData.earnedDate) {
        tokenData.earnedDate = new Date();
      }

      // Create the token
      const token = await this.tokenRepository.create(tokenData);
      return token;
    } catch (error) {
      logger.error(
        `Error creating token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      if (error instanceof Error && error.name === "SequelizeValidationError") {
        throw ErrorFactory.validation("Invalid token data", undefined, error);
      }

      throw ErrorFactory.internal("Failed to create token record");
    }
  }

  /**
   * Update an existing token
   */
  async updateToken(id: string, tokenData: Partial<Token>): Promise<Token> {
    try {
      // Get the token to confirm it exists
      const token = await this.getTokenById(id);

      // Cannot update tokens that are already redeemed or expired
      if (
        [TokenStatus.REDEEMED, TokenStatus.EXPIRED].includes(
          token.status as TokenStatus
        )
      ) {
        throw ErrorFactory.forbidden(
          `Cannot update token details after it has been ${token.status}`
        );
      }

      // Update the token
      const [affectedCount, affectedRows] = await this.tokenRepository.update(
        id,
        tokenData
      );

      if (affectedCount === 0) {
        throw ErrorFactory.notFound(`Token with ID ${id} not found`);
      }

      return affectedRows[0];
    } catch (error) {
      // Rethrow specific errors
      if (
        error instanceof Error &&
        (error.name === "NotFoundError" || error.name === "ForbiddenError")
      ) {
        throw error;
      }

      logger.error(
        `Error updating token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      if (error instanceof Error && error.name === "SequelizeValidationError") {
        throw ErrorFactory.validation("Invalid token data", undefined, error);
      }

      throw ErrorFactory.internal("Failed to update token record");
    }
  }

  /**
   * Update token blockchain status
   */
  async updateTokenBlockchainStatus(
    id: string,
    blockchainOptions: TokenBlockchainUpdateOptions
  ): Promise<Token> {
    try {
      const token = await this.getTokenById(id);
      const { blockchainStatus, blockchainTxId, contractAddress, tokenId } =
        blockchainOptions;

      // Prepare update data
      const updateData: Partial<Token> = {
        blockchainStatus: blockchainStatus as string,
      };

      if (blockchainTxId) {
        updateData.blockchainTxId = blockchainTxId;
      }

      if (contractAddress) {
        updateData.contractAddress = contractAddress;
      }

      if (tokenId) {
        updateData.tokenId = tokenId;
      }

      // Update the token blockchain status
      const [affectedCount, affectedRows] =
        await this.tokenRepository.updateBlockchainInfo(
          id,
          blockchainStatus as string,
          updateData
        );

      if (affectedCount === 0) {
        throw ErrorFactory.notFound(`Token with ID ${id} not found`);
      }

      // If token is minted, create a transaction record
      if (
        blockchainStatus === BlockchainStatus.MINTED &&
        token.blockchainStatus !== BlockchainStatus.MINTED
      ) {
        try {
          await this.transactionService.createTransaction({
            farmerId: token.farmerId,
            transactionType: TransactionType.TOKEN_ISSUANCE,
            amount: parseFloat(token.tokenAmount.toString()),
            currency: Currency.TOKEN,
            paymentMethod: PaymentMethod.BLOCKCHAIN,
            notes: `Token minted for harvest ${token.harvestId}`,
            reference: `TOKEN-${token.id}`,
            metadata: {
              tokenId: token.id,
              harvestId: token.harvestId,
              blockchainTxId: blockchainTxId,
              tokenType: token.tokenType,
            },
          });
        } catch (transactionError) {
          logger.error(
            `Failed to create token issuance transaction: ${
              transactionError instanceof Error
                ? transactionError.message
                : "Unknown error"
            }`
          );
          // We don't want to fail the token status update if transaction fails
          // Just log the error
        }
      }

      return affectedRows[0];
    } catch (error) {
      // Rethrow specific errors
      if (
        error instanceof Error &&
        (error.name === "NotFoundError" || error.name === "ConflictError")
      ) {
        throw error;
      }

      logger.error(
        `Error updating token blockchain status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      throw ErrorFactory.internal("Failed to update token blockchain status");
    }
  }

  /**
   * Redeem a token
   */
  async redeemToken(
    id: string,
    redemptionOptions: TokenRedemptionOptions
  ): Promise<Token> {
    try {
      const token = await this.getTokenById(id);

      // Only active tokens can be redeemed
      if (
        token.status !== TokenStatus.ACTIVE &&
        token.status !== TokenStatus.PENDING
      ) {
        throw ErrorFactory.conflict(
          `Cannot redeem token in ${token.status} status`
        );
      }

      // Verify token is not expired
      if (token.expiryDate && token.expiryDate < new Date()) {
        // Update to expired status
        await this.tokenRepository.updateStatus(id, TokenStatus.EXPIRED);
        throw ErrorFactory.conflict("Cannot redeem expired token");
      }

      // Record the redemption
      const [affectedCount, affectedRows] =
        await this.tokenRepository.recordRedemption(
          id,
          redemptionOptions.redemptionAmount,
          redemptionOptions.redemptionDate,
          redemptionOptions.redemptionTxId
        );

      if (affectedCount === 0) {
        throw ErrorFactory.notFound(`Token with ID ${id} not found`);
      }

      // Create a transaction record for this redemption
      try {
        await this.transactionService.createTransaction({
          farmerId: token.farmerId,
          transactionType: TransactionType.TOKEN_REDEMPTION,
          amount: redemptionOptions.redemptionAmount,
          currency: Currency.USD,
          paymentMethod: PaymentMethod.BLOCKCHAIN,
          transactionDate: redemptionOptions.redemptionDate || new Date(),
          notes:
            redemptionOptions.notes ||
            `Token redemption for harvest ${token.harvestId}`,
          reference: `TOKEN-REDEMPTION-${token.id}`,
          metadata: {
            tokenId: token.id,
            harvestId: token.harvestId,
            redemptionTxId: redemptionOptions.redemptionTxId,
            tokenType: token.tokenType,
          },
        });
      } catch (transactionError) {
        logger.error(
          `Failed to create token redemption transaction: ${
            transactionError instanceof Error
              ? transactionError.message
              : "Unknown error"
          }`
        );
        // We don't want to fail the redemption if transaction creation fails
      }

      return affectedRows[0];
    } catch (error) {
      // Rethrow specific errors
      if (
        error instanceof Error &&
        (error.name === "NotFoundError" || error.name === "ConflictError")
      ) {
        throw error;
      }

      logger.error(
        `Error redeeming token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to redeem token");
    }
  }

  /**
   * Delete a token
   * Note: Only PENDING tokens can be deleted
   */
  async deleteToken(id: string): Promise<boolean> {
    try {
      const token = await this.getTokenById(id);

      // Prevent deleting tokens that are not in PENDING state
      if (token.status !== TokenStatus.PENDING) {
        throw ErrorFactory.forbidden(
          `Tokens in ${token.status} status cannot be deleted`
        );
      }

      const deletedCount = await this.tokenRepository.delete(id);
      return deletedCount > 0;
    } catch (error) {
      // Rethrow specific errors
      if (
        error instanceof Error &&
        (error.name === "NotFoundError" || error.name === "ForbiddenError")
      ) {
        throw error;
      }

      logger.error(
        `Error deleting token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to delete token record");
    }
  }

  /**
   * Search tokens by various criteria
   */
  async searchTokens(
    filters: TokenFilterOptions,
    pagination: PaginationOptions
  ): Promise<TokenResult> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "earnedDate",
        sortOrder = "DESC",
      } = pagination;
      const offset = (page - 1) * limit;

      // Convert date strings to Date objects if necessary
      let fromDate = undefined;
      let toDate = undefined;

      if (filters.fromDate) {
        fromDate = filters.fromDate;
      }

      if (filters.toDate) {
        toDate = filters.toDate;
      }

      const searchCriteria = {
        ...filters,
        fromDate,
        toDate,
      };

      const { rows, count } = await this.tokenRepository.search(
        searchCriteria,
        {
          limit,
          offset,
          sortBy,
          sortOrder,
        }
      );

      return {
        tokens: rows,
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error(
        `Error searching tokens: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to search tokens");
    }
  }

  /**
   * Check for expired tokens and update their status
   */
  async checkAndUpdateExpiredTokens(): Promise<number> {
    try {
      const expiredTokens = await this.tokenRepository.getExpiredTokens();
      let updatedCount = 0;

      for (const token of expiredTokens) {
        try {
          await this.tokenRepository.updateStatus(
            token.id,
            TokenStatus.EXPIRED
          );
          updatedCount++;
        } catch (error) {
          logger.error(
            `Failed to update expired token ${token.id}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      return updatedCount;
    } catch (error) {
      logger.error(
        `Error checking expired tokens: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to check for expired tokens");
    }
  }

  /**
   * Mint a token on the blockchain
   */
  async mintToken(id: string): Promise<Token> {
    try {
      const token = await this.getTokenById(id);

      // Check if the token is in a valid status for minting
      if (
        token.status !== TokenStatus.PENDING &&
        token.status !== TokenStatus.ACTIVE
      ) {
        throw ErrorFactory.conflict(
          `Cannot mint token in ${token.status} status`
        );
      }

      // Check if token is already minted or in the process
      if (token.blockchainStatus !== BlockchainStatus.UNMINTED) {
        throw ErrorFactory.conflict(
          `Token is already in ${token.blockchainStatus} blockchain status`
        );
      }

      // Update to pending minting status first
      await this.updateTokenBlockchainStatus(id, {
        blockchainStatus: BlockchainStatus.PENDING_MINTING,
      });

      // This would be where you call your blockchain service to mint the token
      // For now, we'll simulate a successful minting
      const mintResult = {
        success: true,
        blockchainTxId: `0x${Math.random().toString(16).substr(2, 64)}`,
        tokenId: `TOKEN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        contractAddress: "0x8901B0cbe7F326b7F0482AFE3f330cb6611d8E3a",
      };

      // Update token with blockchain info
      if (mintResult.success) {
        return this.updateTokenBlockchainStatus(id, {
          blockchainStatus: BlockchainStatus.MINTED,
          blockchainTxId: mintResult.blockchainTxId,
          tokenId: mintResult.tokenId,
          contractAddress: mintResult.contractAddress,
        });
      } else {
        // Update to failed status
        await this.updateTokenBlockchainStatus(id, {
          blockchainStatus: BlockchainStatus.FAILED,
        });

        throw ErrorFactory.internal("Failed to mint token on blockchain");
      }
    } catch (error) {
      // If it's a blockchain interaction error, update the token status
      if (
        error instanceof Error &&
        error.name !== "NotFoundError" &&
        error.name !== "ConflictError"
      ) {
        try {
          await this.updateTokenBlockchainStatus(id, {
            blockchainStatus: BlockchainStatus.FAILED,
          });
        } catch (updateError) {
          logger.error(
            `Failed to update token status to FAILED: ${
              updateError instanceof Error
                ? updateError.message
                : "Unknown error"
            }`
          );
        }
      }

      // Rethrow specific errors
      if (
        error instanceof Error &&
        (error.name === "NotFoundError" || error.name === "ConflictError")
      ) {
        throw error;
      }

      logger.error(
        `Error minting token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to mint token");
    }
  }
}

// Export a default instance
export default new TokenService();
