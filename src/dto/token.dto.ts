export interface TokenDTO {
  id: string;
  harvestId: string;
  farmerId: string;
  tokenAmount: number;
  earnedDate: string | Date;
  expiryDate?: string | Date | null;
  status: string;
  tokenType: string;
  blockchainStatus: string;
  blockchainTxId?: string | null;
  contractAddress?: string | null;
  tokenId?: string | null;
  metadata?: object | null;
  redemptionDate?: string | Date | null;
  redemptionAmount?: number | null;
  redemptionTxId?: string | null;
  lastUpdated: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateTokenDTO {
  harvestId: string;
  farmerId: string;
  tokenAmount: number;
  earnedDate?: Date;
  expiryDate?: Date;
  tokenType?: string;
  metadata?: object;
}

export interface UpdateTokenDTO {
  tokenAmount?: number;
  expiryDate?: Date;
  status?: string;
  tokenType?: string;
  blockchainStatus?: string;
  blockchainTxId?: string;
  contractAddress?: string;
  tokenId?: string;
  metadata?: object;
}

export interface TokenBlockchainUpdateDTO {
  blockchainStatus: string;
  blockchainTxId?: string;
  contractAddress?: string;
  tokenId?: string;
}

export interface TokenRedemptionDTO {
  redemptionAmount: number;
  redemptionDate?: Date;
  redemptionTxId?: string;
  notes?: string;
}

export interface TokenQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  status?: string | string[];
  tokenType?: string | string[];
  farmerId?: string;
  harvestId?: string;
  blockchainStatus?: string | string[];
  minAmount?: number;
  maxAmount?: number;
  fromDate?: string;
  toDate?: string;
  hasBlockchainInfo?: boolean;
}

export interface TokenResponse extends TokenDTO {
  statusDisplay: string;
  blockchainStatusDisplay: string;
  isExpired: boolean;
  daysUntilExpiry?: number | null;
}

export interface TokenListResponse {
  tokens: TokenResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TokenMintingResponse {
  tokenId: string;
  blockchainTxId: string;
  status: string;
  message: string;
}
