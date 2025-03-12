import { TransactionRepository } from "../repositories/transaction.repository.js";
import HarvestService from "../services/harvest.service.js";
import {
  ITransactionService,
  TransactionFilterOptions,
  PaginationOptions,
  TransactionResult,
  CreateHarvestSaleOptions,
} from "../interfaces/services/transaction.service.interface.js";
import Transaction from "../models/transaction.model.js";
import {
  TransactionType,
  TransactionStatus,
  Currency,
  PaymentMethod,
} from "../constants/transactionTypes.js";
import { ErrorFactory } from "../utils/errorUtils.js";
import logger from "../utils/logger.js";

export class TransactionService implements ITransactionService {
  private transactionRepository: TransactionRepository;
  private harvestService;

  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.harvestService = HarvestService;
  }

  /**
   * Get a transaction by ID
   */
  async getTransactionById(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      throw ErrorFactory.notFound(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  /**
   * Get transactions for a specific farmer
   */
  async getFarmerTransactions(
    farmerId: string,
    options: PaginationOptions = {},
    filters: Partial<TransactionFilterOptions> = {}
  ): Promise<TransactionResult> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "transactionDate",
        sortOrder = "DESC",
      } = options;
      const offset = (page - 1) * limit;

      const { rows, count } = await this.transactionRepository.findByFarmerId(
        farmerId,
        {
          limit,
          offset,
          status: filters.status?.[0],
          transactionType: filters.transactionType?.[0],
          sortBy,
          sortOrder,
        }
      );

      return {
        transactions: rows,
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error(
        `Error getting farmer transactions: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to retrieve farmer transactions");
    }
  }

  /**
   * Get transactions for a specific buyer
   */
  async getBuyerTransactions(
    buyerId: string,
    options: PaginationOptions = {},
    filters: Partial<TransactionFilterOptions> = {}
  ): Promise<TransactionResult> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "transactionDate",
        sortOrder = "DESC",
      } = options;
      const offset = (page - 1) * limit;

      const { rows, count } = await this.transactionRepository.findByBuyerId(
        buyerId,
        {
          limit,
          offset,
          status: filters.status?.[0],
          transactionType: filters.transactionType?.[0],
          sortBy,
          sortOrder,
        }
      );

      return {
        transactions: rows,
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error(
        `Error getting buyer transactions: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to retrieve buyer transactions");
    }
  }

  /**
   * Get transactions for a specific harvest
   */
  async getHarvestTransactions(
    harvestId: string,
    options: PaginationOptions = {},
    filters: Partial<TransactionFilterOptions> = {}
  ): Promise<TransactionResult> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "transactionDate",
        sortOrder = "DESC",
      } = options;
      const offset = (page - 1) * limit;

      const { rows, count } = await this.transactionRepository.findByHarvestId(
        harvestId,
        {
          limit,
          offset,
          status: filters.status?.[0],
          sortBy,
          sortOrder,
        }
      );

      return {
        transactions: rows,
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error(
        `Error getting harvest transactions: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to retrieve harvest transactions");
    }
  }

  /**
   * Create a new transaction
   */
  async createTransaction(
    transactionData: Partial<Transaction>
  ): Promise<Transaction> {
    try {
      // Set default values if not provided
      if (!transactionData.currency) {
        transactionData.currency = Currency.USD;
      }

      if (!transactionData.status) {
        transactionData.status = TransactionStatus.PENDING;
      }

      if (!transactionData.transactionDate) {
        transactionData.transactionDate = new Date();
      }

      // Special validation for sale transactions
      if (
        transactionData.transactionType === TransactionType.SALE &&
        !transactionData.harvestId
      ) {
        throw ErrorFactory.validation(
          "Harvest ID is required for sale transactions"
        );
      }

      // Create the transaction
      const transaction = await this.transactionRepository.create(
        transactionData
      );
      return transaction;
    } catch (error) {
      logger.error(
        `Error creating transaction: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      if (error instanceof Error && error.name === "SequelizeValidationError") {
        throw ErrorFactory.validation(
          "Invalid transaction data",
          undefined,
          error
        );
      }

      if (error instanceof Error && error.name === "ValidationError") {
        throw error; // Rethrow our custom validation errors
      }

      throw ErrorFactory.internal("Failed to create transaction record");
    }
  }

  /**
   * Create a transaction specifically for a harvest sale
   */
  async createHarvestSaleTransaction(
    options: CreateHarvestSaleOptions
  ): Promise<Transaction> {
    try {
      // First, get the harvest to verify it exists and to get the farmer ID
      const harvest = await this.harvestService.getHarvestById(
        options.harvestId
      );

      // Create transaction data
      const transactionData: Partial<Transaction> = {
        farmerId: harvest.farmerId,
        buyerId: options.buyerId,
        harvestId: options.harvestId,
        transactionType: TransactionType.SALE,
        amount: options.amount,
        currency: options.currency || Currency.USD,
        paymentMethod: options.paymentMethod,
        status: TransactionStatus.PENDING,
        notes: options.notes || `Payment for harvest: ${harvest.cropType}`,
      };

      // Create the transaction
      const transaction = await this.createTransaction(transactionData);

      // Mark the harvest as sold and link the transaction
      await this.harvestService.markAsSold(
        options.harvestId,
        options.buyerId,
        transaction.id
      );

      return transaction;
    } catch (error) {
      logger.error(
        `Error creating harvest sale transaction: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      // Rethrow errors from other services (like harvest service)
      if (
        error instanceof Error &&
        (error.name === "NotFoundError" ||
          error.name === "ConflictError" ||
          error.name === "ValidationError")
      ) {
        throw error;
      }

      throw ErrorFactory.internal("Failed to create harvest sale transaction");
    }
  }

  /**
   * Update an existing transaction
   */
  async updateTransaction(
    id: string,
    transactionData: Partial<Transaction>
  ): Promise<Transaction> {
    try {
      // Get the transaction to confirm it exists
      const transaction = await this.getTransactionById(id);

      // Prevent updating certain fields if transaction is completed
      if (transaction.status === TransactionStatus.COMPLETED) {
        const protectedFields = [
          "farmerId",
          "buyerId",
          "harvestId",
          "transactionType",
          "amount",
          "currency",
          "transactionDate",
        ];

        const hasProtectedFields = protectedFields.some((field) =>
          Object.prototype.hasOwnProperty.call(transactionData, field)
        );

        if (hasProtectedFields) {
          throw ErrorFactory.forbidden(
            "Cannot update core transaction details after it has been completed"
          );
        }
      }

      // Update the transaction
      const [affectedCount, affectedRows] =
        await this.transactionRepository.update(id, transactionData);

      if (affectedCount === 0) {
        throw ErrorFactory.notFound(`Transaction with ID ${id} not found`);
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
        `Error updating transaction: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      if (error instanceof Error && error.name === "SequelizeValidationError") {
        throw ErrorFactory.validation(
          "Invalid transaction data",
          undefined,
          error
        );
      }

      throw ErrorFactory.internal("Failed to update transaction record");
    }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    id: string,
    status: TransactionStatus
  ): Promise<Transaction> {
    try {
      const transaction = await this.getTransactionById(id);

      // Check for valid state transitions
      if (
        transaction.status === TransactionStatus.COMPLETED &&
        status !== TransactionStatus.REFUNDED
      ) {
        throw ErrorFactory.conflict(
          "Completed transactions can only be changed to refunded status"
        );
      }

      if (
        transaction.status === TransactionStatus.CANCELLED ||
        transaction.status === TransactionStatus.REFUNDED
      ) {
        throw ErrorFactory.conflict(
          `Transactions in ${transaction.status} status cannot be updated`
        );
      }

      // Update the status
      const [affectedCount, affectedRows] =
        await this.transactionRepository.updateStatus(id, status);

      if (affectedCount === 0) {
        throw ErrorFactory.notFound(`Transaction with ID ${id} not found`);
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
        `Error updating transaction status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      throw ErrorFactory.internal("Failed to update transaction status");
    }
  }

  /**
   * Delete a transaction
   * Note: In production, you might want to prevent deletion and use soft deletes instead
   */
  async deleteTransaction(id: string): Promise<boolean> {
    try {
      const transaction = await this.getTransactionById(id);

      // Prevent deleting completed/processed transactions
      if (
        [TransactionStatus.COMPLETED, TransactionStatus.REFUNDED].includes(
          transaction.status as TransactionStatus
        )
      ) {
        throw ErrorFactory.forbidden(
          `Transactions in ${transaction.status} status cannot be deleted`
        );
      }

      const deletedCount = await this.transactionRepository.delete(id);
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
        `Error deleting transaction: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to delete transaction record");
    }
  }

  /**
   * Search transactions by various criteria
   */
  async searchTransactions(
    filters: TransactionFilterOptions,
    pagination: PaginationOptions
  ): Promise<TransactionResult> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "transactionDate",
        sortOrder = "DESC",
      } = pagination;
      const offset = (page - 1) * limit;

      // Convert date strings to Date objects if necessary
      let fromDate = undefined;
      let toDate = undefined;

      if (filters.fromDate) {
        fromDate = new Date(filters.fromDate);
      }

      if (filters.toDate) {
        toDate = new Date(filters.toDate);
      }

      const searchCriteria = {
        ...filters,
        fromDate,
        toDate,
      };

      const { rows, count } = await this.transactionRepository.search(
        searchCriteria,
        {
          limit,
          offset,
          sortBy,
          sortOrder,
        }
      );

      return {
        transactions: rows,
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error(
        `Error searching transactions: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to search transactions");
    }
  }
}

// Export both the class and a default singleton instance
export default new TransactionService();
