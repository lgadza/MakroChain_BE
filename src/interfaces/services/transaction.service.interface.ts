import Transaction from "../../models/transaction.model.js";
import {
  TransactionType,
  TransactionStatus,
} from "../../constants/transactionTypes.js";

export interface TransactionFilterOptions {
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
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface TransactionResult {
  transactions: Transaction[];
  total: number;
  pages: number;
}

export interface CreateHarvestSaleOptions {
  harvestId: string;
  buyerId: string;
  paymentMethod: string;
  amount: number;
  currency?: string;
  notes?: string;
}

export interface ITransactionService {
  getTransactionById(id: string): Promise<Transaction>;

  getFarmerTransactions(
    farmerId: string,
    options?: PaginationOptions,
    filters?: Partial<TransactionFilterOptions>
  ): Promise<TransactionResult>;

  getBuyerTransactions(
    buyerId: string,
    options?: PaginationOptions,
    filters?: Partial<TransactionFilterOptions>
  ): Promise<TransactionResult>;

  getHarvestTransactions(
    harvestId: string,
    options?: PaginationOptions,
    filters?: Partial<TransactionFilterOptions>
  ): Promise<TransactionResult>;

  createTransaction(
    transactionData: Partial<Transaction>
  ): Promise<Transaction>;

  createHarvestSaleTransaction(
    options: CreateHarvestSaleOptions
  ): Promise<Transaction>;

  updateTransaction(
    id: string,
    transactionData: Partial<Transaction>
  ): Promise<Transaction>;

  updateTransactionStatus(
    id: string,
    status: TransactionStatus
  ): Promise<Transaction>;

  deleteTransaction(id: string): Promise<boolean>;

  searchTransactions(
    filters: TransactionFilterOptions,
    pagination: PaginationOptions
  ): Promise<TransactionResult>;
}
