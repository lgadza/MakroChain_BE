import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import TransactionService from "../services/transaction.service.js";
import { sendSuccess } from "../utils/responseUtil.js";
import logger from "../utils/logger.js";
import { ErrorFactory } from "../utils/errorUtils.js";
import {
  TransactionDTO,
  TransactionResponse,
  TransactionQueryParams,
  CreateTransactionDTO,
  UpdateTransactionDTO,
  HarvestSaleTransactionDTO,
} from "../dto/transaction.dto.js";
import {
  TransactionStatus,
  TransactionType,
} from "../constants/transactionTypes.js";
import { Roles } from "../constants/roles.js";

export class TransactionController {
  private transactionService = TransactionService;

  /**
   * Transform Transaction model to DTO response
   */
  private toResponseDTO(transaction: any): TransactionResponse {
    return {
      id: transaction.id,
      farmerId: transaction.farmerId,
      buyerId: transaction.buyerId,
      harvestId: transaction.harvestId,
      transactionType: transaction.transactionType,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      paymentMethod: transaction.paymentMethod,
      transactionDate:
        transaction.transactionDate instanceof Date
          ? transaction.transactionDate.toISOString()
          : transaction.transactionDate,
      status: transaction.status,
      statusDisplay: transaction.getStatusDisplay
        ? transaction.getStatusDisplay()
        : transaction.status.charAt(0) +
          transaction.status.slice(1).toLowerCase(),
      notes: transaction.notes,
      reference: transaction.reference,
      blockchainHash: transaction.blockchainHash,
      metadata: transaction.metadata,
      createdAt:
        transaction.createdAt instanceof Date
          ? transaction.createdAt.toISOString()
          : transaction.createdAt,
      updatedAt:
        transaction.updatedAt instanceof Date
          ? transaction.updatedAt.toISOString()
          : transaction.updatedAt,
    };
  }

  /**
   * Get all transactions with filtering and pagination
   */
  getAllTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = req.query as unknown as TransactionQueryParams;

      // Parse pagination options
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const sortBy = query.sortBy || "transactionDate";
      const sortOrder =
        (query.sortOrder?.toUpperCase() as "ASC" | "DESC") || "DESC";

      // Parse filter options
      const filters: any = {};

      if (query.farmerId) filters.farmerId = query.farmerId;
      if (query.buyerId) filters.buyerId = query.buyerId;
      if (query.harvestId) filters.harvestId = query.harvestId;
      if (query.transactionType)
        filters.transactionType = Array.isArray(query.transactionType)
          ? query.transactionType
          : [query.transactionType];
      if (query.status)
        filters.status = Array.isArray(query.status)
          ? query.status
          : [query.status];
      if (query.fromDate) filters.fromDate = new Date(query.fromDate);
      if (query.toDate) filters.toDate = new Date(query.toDate);
      if (query.minAmount) filters.minAmount = Number(query.minAmount);
      if (query.maxAmount) filters.maxAmount = Number(query.maxAmount);

      const result = await this.transactionService.searchTransactions(filters, {
        page,
        limit,
        sortBy,
        sortOrder,
      });

      const responseData = {
        transactions: result.transactions.map((transaction) =>
          this.toResponseDTO(transaction)
        ),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.pages,
        },
      };

      sendSuccess(
        res,
        responseData.transactions,
        "Transactions retrieved successfully",
        200,
        {
          pagination: responseData.pagination,
        }
      );
    } catch (error) {
      logger.error(
        `Failed to get transactions: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      next(error);
    }
  };

  /**
   * Get a single transaction by ID
   */
  getTransactionById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const transaction = await this.transactionService.getTransactionById(id);

      sendSuccess(
        res,
        this.toResponseDTO(transaction),
        "Transaction retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get transactions for a specific farmer
   */
  getFarmerTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { farmerId } = req.params;
      const query = req.query as unknown as TransactionQueryParams;

      // Parse pagination options
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const sortBy = query.sortBy || "transactionDate";
      const sortOrder =
        (query.sortOrder?.toUpperCase() as "ASC" | "DESC") || "DESC";

      // Parse filter options
      const filters: any = {};

      if (query.transactionType)
        filters.transactionType = Array.isArray(query.transactionType)
          ? query.transactionType
          : [query.transactionType];
      if (query.status)
        filters.status = Array.isArray(query.status)
          ? query.status
          : [query.status];

      const result = await this.transactionService.getFarmerTransactions(
        farmerId,
        { page, limit, sortBy, sortOrder },
        filters
      );

      const responseData = {
        transactions: result.transactions.map((transaction) =>
          this.toResponseDTO(transaction)
        ),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.pages,
        },
      };

      sendSuccess(
        res,
        responseData.transactions,
        "Farmer transactions retrieved successfully",
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
   * Get transactions for a specific buyer
   */
  getBuyerTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { buyerId } = req.params;
      const query = req.query as unknown as TransactionQueryParams;

      // Parse pagination options
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const sortBy = query.sortBy || "transactionDate";
      const sortOrder =
        (query.sortOrder?.toUpperCase() as "ASC" | "DESC") || "DESC";

      // Parse filter options
      const filters: any = {};

      if (query.transactionType)
        filters.transactionType = Array.isArray(query.transactionType)
          ? query.transactionType
          : [query.transactionType];
      if (query.status)
        filters.status = Array.isArray(query.status)
          ? query.status
          : [query.status];

      const result = await this.transactionService.getBuyerTransactions(
        buyerId,
        { page, limit, sortBy, sortOrder },
        filters
      );

      const responseData = {
        transactions: result.transactions.map((transaction) =>
          this.toResponseDTO(transaction)
        ),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.pages,
        },
      };

      sendSuccess(
        res,
        responseData.transactions,
        "Buyer transactions retrieved successfully",
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
   * Get transactions for a specific harvest
   */
  getHarvestTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { harvestId } = req.params;
      const query = req.query as unknown as TransactionQueryParams;

      // Parse pagination options
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const sortBy = query.sortBy || "transactionDate";
      const sortOrder =
        (query.sortOrder?.toUpperCase() as "ASC" | "DESC") || "DESC";

      // Parse filter options
      const filters: any = {};

      if (query.status)
        filters.status = Array.isArray(query.status)
          ? query.status
          : [query.status];

      const result = await this.transactionService.getHarvestTransactions(
        harvestId,
        { page, limit, sortBy, sortOrder },
        filters
      );

      const responseData = {
        transactions: result.transactions.map((transaction) =>
          this.toResponseDTO(transaction)
        ),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.pages,
        },
      };

      sendSuccess(
        res,
        responseData.transactions,
        "Harvest transactions retrieved successfully",
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
   * Create a new transaction
   */
  createTransaction = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const transactionData: CreateTransactionDTO = req.body;

      // If user is a farmer, ensure they can only create transactions for themselves
      if (req.user?.role === Roles.FARMER) {
        transactionData.farmerId = req.user?.userId as string;
      }

      const transaction = await this.transactionService.createTransaction(
        transactionData as any
      );

      sendSuccess(
        res,
        this.toResponseDTO(transaction),
        "Transaction created successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a harvest sale transaction
   */
  createHarvestSaleTransaction = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        harvestId,
        buyerId,
        paymentMethod,
        amount,
        currency,
        notes,
      }: HarvestSaleTransactionDTO = req.body;

      const transaction =
        await this.transactionService.createHarvestSaleTransaction({
          harvestId,
          buyerId,
          paymentMethod,
          amount,
          currency,
          notes,
        });

      sendSuccess(
        res,
        this.toResponseDTO(transaction),
        "Harvest sale transaction created successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a transaction
   */
  updateTransaction = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const transactionData: UpdateTransactionDTO = req.body;

      // For non-admin/manager users, first verify ownership
      if (req.user?.role !== Roles.ADMIN && req.user?.role !== Roles.MANAGER) {
        const transaction = await this.transactionService.getTransactionById(
          id
        );

        if (transaction.farmerId !== req.user?.userId) {
          throw ErrorFactory.forbidden(
            "You can only update your own transactions"
          );
        }
      }

      const updatedTransaction =
        await this.transactionService.updateTransaction(
          id,
          transactionData as any
        );

      sendSuccess(
        res,
        this.toResponseDTO(updatedTransaction),
        "Transaction updated successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update transaction status
   */
  updateTransactionStatus = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // For non-admin/manager users, first verify ownership
      if (req.user?.role !== Roles.ADMIN && req.user?.role !== Roles.MANAGER) {
        const transaction = await this.transactionService.getTransactionById(
          id
        );

        if (transaction.farmerId !== req.user?.userId) {
          throw ErrorFactory.forbidden(
            "You can only update your own transactions"
          );
        }
      }

      const updatedTransaction =
        await this.transactionService.updateTransactionStatus(
          id,
          status as TransactionStatus
        );

      sendSuccess(
        res,
        this.toResponseDTO(updatedTransaction),
        "Transaction status updated successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a transaction
   */
  deleteTransaction = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      // For non-admin/manager users, first verify ownership
      if (req.user?.role !== Roles.ADMIN && req.user?.role !== Roles.MANAGER) {
        const transaction = await this.transactionService.getTransactionById(
          id
        );

        if (transaction.farmerId !== req.user?.userId) {
          throw ErrorFactory.forbidden(
            "You can only delete your own transactions"
          );
        }
      }

      await this.transactionService.deleteTransaction(id);

      sendSuccess(res, null, "Transaction deleted successfully");
    } catch (error) {
      next(error);
    }
  };
}

// Export a default instance of the controller
export default new TransactionController();
