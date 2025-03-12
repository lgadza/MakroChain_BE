export interface TransactionDTO {
  id: string;
  farmerId: string;
  buyerId?: string | null;
  harvestId?: string | null;
  transactionType: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionDate: string | Date;
  status: string;
  notes?: string | null;
  reference?: string | null;
  blockchainHash?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateTransactionDTO {
  farmerId: string;
  buyerId?: string;
  harvestId?: string;
  transactionType: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionDate?: string | Date;
  status?: string;
  notes?: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTransactionDTO {
  status?: string;
  notes?: string | null;
  reference?: string | null;
  blockchainHash?: string | null;
  metadata?: Record<string, any> | null;
}

export interface TransactionQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  farmerId?: string;
  buyerId?: string;
  harvestId?: string;
  transactionType?: string | string[];
  status?: string | string[];
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface TransactionResponse {
  id: string;
  farmerId: string;
  buyerId: string | null;
  harvestId: string | null;
  transactionType: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionDate: string;
  status: string;
  statusDisplay: string;
  notes: string | null;
  reference: string | null;
  blockchainHash: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionListResponse {
  transactions: TransactionResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// For creating a transaction directly from a harvest sale
export interface HarvestSaleTransactionDTO {
  harvestId: string;
  buyerId: string;
  paymentMethod: string;
  amount: number;
  currency?: string;
  notes?: string;
}
