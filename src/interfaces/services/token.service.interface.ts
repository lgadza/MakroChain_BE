import Token from "../../models/token.model.js";
import { TokenStatus, BlockchainStatus } from "../../constants/tokenTypes.js";

export interface TokenFilterOptions {
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
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface TokenResult {
  tokens: Token[];
  total: number;
  pages: number;
}

export interface TokenBlockchainUpdateOptions {
  blockchainStatus: BlockchainStatus;
  blockchainTxId?: string;
  contractAddress?: string;
  tokenId?: string;
}

export interface TokenRedemptionOptions {
  redemptionAmount: number;
  redemptionDate?: Date;
  redemptionTxId?: string;
  notes?: string;
}

export interface ITokenService {
  getTokenById(id: string): Promise<Token>;

  getFarmerTokens(
    farmerId: string,
    options?: PaginationOptions,
    filters?: Partial<TokenFilterOptions>
  ): Promise<TokenResult>;

  getHarvestTokens(
    harvestId: string,
    options?: PaginationOptions
  ): Promise<TokenResult>;

  createToken(tokenData: Partial<Token>): Promise<Token>;

  updateToken(id: string, tokenData: Partial<Token>): Promise<Token>;

  updateTokenBlockchainStatus(
    id: string,
    blockchainOptions: TokenBlockchainUpdateOptions
  ): Promise<Token>;

  redeemToken(
    id: string,
    redemptionOptions: TokenRedemptionOptions
  ): Promise<Token>;

  deleteToken(id: string): Promise<boolean>;

  searchTokens(
    filters: TokenFilterOptions,
    pagination: PaginationOptions
  ): Promise<TokenResult>;

  checkAndUpdateExpiredTokens(): Promise<number>;

  mintToken(id: string): Promise<Token>;
}
