import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import TokenService from "../services/token.service.js";
import { sendSuccess } from "../utils/responseUtil.js";
import logger from "../utils/logger.js";
import { ErrorFactory } from "../utils/errorUtils.js";
import {
  TokenDTO,
  TokenResponse,
  TokenQueryParams,
  CreateTokenDTO,
  UpdateTokenDTO,
  TokenBlockchainUpdateDTO,
  TokenRedemptionDTO,
} from "../dto/token.dto.js";
import { TokenStatus } from "../constants/tokenTypes.js";
import { Roles } from "../constants/roles.js";

export class TokenController {
  private tokenService = TokenService;

  /**
   * Transform Token model to DTO response
   */
  private toResponseDTO(token: any): TokenResponse {
    let daysUntilExpiry = null;
    if (token.expiryDate) {
      const expiryDate = new Date(token.expiryDate);
      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      id: token.id,
      harvestId: token.harvestId,
      farmerId: token.farmerId,
      tokenAmount: Number(token.tokenAmount),
      earnedDate:
        token.earnedDate instanceof Date
          ? token.earnedDate.toISOString()
          : token.earnedDate,
      expiryDate:
        token.expiryDate instanceof Date
          ? token.expiryDate.toISOString()
          : token.expiryDate,
      status: token.status,
      tokenType: token.tokenType,
      blockchainStatus: token.blockchainStatus,
      blockchainTxId: token.blockchainTxId,
      contractAddress: token.contractAddress,
      tokenId: token.tokenId,
      metadata: token.metadata,
      redemptionDate:
        token.redemptionDate instanceof Date
          ? token.redemptionDate.toISOString()
          : token.redemptionDate,
      redemptionAmount:
        token.redemptionAmount !== null ? Number(token.redemptionAmount) : null,
      redemptionTxId: token.redemptionTxId,
      lastUpdated:
        token.lastUpdated instanceof Date
          ? token.lastUpdated.toISOString()
          : token.lastUpdated,
      createdAt:
        token.createdAt instanceof Date
          ? token.createdAt.toISOString()
          : token.createdAt,
      updatedAt:
        token.updatedAt instanceof Date
          ? token.updatedAt.toISOString()
          : token.updatedAt,
      statusDisplay: token.getStatusDisplay
        ? token.getStatusDisplay()
        : token.status.charAt(0) + token.status.slice(1).toLowerCase(),
      blockchainStatusDisplay: token.getBlockchainStatusDisplay
        ? token.getBlockchainStatusDisplay()
        : token.blockchainStatus.replace(/_/g, " "),
      isExpired: token.isExpired
        ? token.isExpired()
        : token.status === TokenStatus.EXPIRED,
      daysUntilExpiry: daysUntilExpiry,
    };
  }

  /**
   * Get all tokens with filtering and pagination
   */
  getAllTokens = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = req.query as unknown as TokenQueryParams;

      // Parse pagination options
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const sortBy = query.sortBy || "earnedDate";
      const sortOrder =
        (query.sortOrder?.toUpperCase() as "ASC" | "DESC") || "DESC";

      // Parse filter options
      const filters: any = {};

      if (query.farmerId) filters.farmerId = query.farmerId;
      if (query.harvestId) filters.harvestId = query.harvestId;
      if (query.status)
        filters.status = Array.isArray(query.status)
          ? query.status
          : [query.status];
      if (query.tokenType)
        filters.tokenType = Array.isArray(query.tokenType)
          ? query.tokenType
          : [query.tokenType];
      if (query.blockchainStatus)
        filters.blockchainStatus = Array.isArray(query.blockchainStatus)
          ? query.blockchainStatus
          : [query.blockchainStatus];
      if (query.fromDate) filters.fromDate = new Date(query.fromDate);
      if (query.toDate) filters.toDate = new Date(query.toDate);
      if (query.minAmount) filters.minAmount = Number(query.minAmount);
      if (query.maxAmount) filters.maxAmount = Number(query.maxAmount);
      if (query.hasBlockchainInfo !== undefined)
        filters.hasBlockchainInfo = query.hasBlockchainInfo;

      const result = await this.tokenService.searchTokens(filters, {
        page,
        limit,
        sortBy,
        sortOrder,
      });

      const responseData = {
        tokens: result.tokens.map((token) => this.toResponseDTO(token)),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.pages,
        },
      };

      sendSuccess(
        res,
        responseData.tokens,
        "Tokens retrieved successfully",
        200,
        {
          pagination: responseData.pagination,
        }
      );
    } catch (error) {
      logger.error(
        `Failed to get tokens: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      next(error);
    }
  };

  /**
   * Get a single token by ID
   */
  getTokenById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const token = await this.tokenService.getTokenById(id);

      sendSuccess(
        res,
        this.toResponseDTO(token),
        "Token retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get tokens for a specific farmer
   */
  getFarmerTokens = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { farmerId } = req.params;
      const query = req.query as unknown as TokenQueryParams;

      // Parse pagination options
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const sortBy = query.sortBy || "earnedDate";
      const sortOrder =
        (query.sortOrder?.toUpperCase() as "ASC" | "DESC") || "DESC";

      // Parse filter options
      const filters: any = {};

      if (query.status)
        filters.status = Array.isArray(query.status)
          ? query.status
          : [query.status];
      if (query.tokenType)
        filters.tokenType = Array.isArray(query.tokenType)
          ? query.tokenType
          : [query.tokenType];
      if (query.blockchainStatus)
        filters.blockchainStatus = Array.isArray(query.blockchainStatus)
          ? query.blockchainStatus
          : [query.blockchainStatus];

      const result = await this.tokenService.getFarmerTokens(
        farmerId,
        { page, limit, sortBy, sortOrder },
        filters
      );

      const responseData = {
        tokens: result.tokens.map((token) => this.toResponseDTO(token)),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.pages,
        },
      };

      sendSuccess(
        res,
        responseData.tokens,
        "Farmer tokens retrieved successfully",
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
   * Get tokens for a specific harvest
   */
  getHarvestTokens = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { harvestId } = req.params;
      const query = req.query as unknown as TokenQueryParams;

      // Parse pagination options
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const sortBy = query.sortBy || "earnedDate";
      const sortOrder =
        (query.sortOrder?.toUpperCase() as "ASC" | "DESC") || "DESC";

      const result = await this.tokenService.getHarvestTokens(harvestId, {
        page,
        limit,
        sortBy,
        sortOrder,
      });

      const responseData = {
        tokens: result.tokens.map((token) => this.toResponseDTO(token)),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.pages,
        },
      };

      sendSuccess(
        res,
        responseData.tokens,
        "Harvest tokens retrieved successfully",
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
   * Create a new token
   */
  createToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tokenData: CreateTokenDTO = req.body;
      const token = await this.tokenService.createToken(tokenData as any);

      sendSuccess(
        res,
        this.toResponseDTO(token),
        "Token created successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a token
   */
  updateToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const tokenData: UpdateTokenDTO = req.body;

      // For non-admin/manager users, first verify ownership
      if (req.user?.role !== Roles.ADMIN && req.user?.role !== Roles.MANAGER) {
        const token = await this.tokenService.getTokenById(id);

        if (token.farmerId !== req.user?.userId) {
          throw ErrorFactory.forbidden("You can only update your own tokens");
        }
      }

      const updatedToken = await this.tokenService.updateToken(
        id,
        tokenData as any
      );

      sendSuccess(
        res,
        this.toResponseDTO(updatedToken),
        "Token updated successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update token blockchain status
   */
  updateTokenBlockchainStatus = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const blockchainData: TokenBlockchainUpdateDTO = req.body;

      // Only admins and managers can update blockchain status
      if (req.user?.role !== Roles.ADMIN && req.user?.role !== Roles.MANAGER) {
        throw ErrorFactory.forbidden(
          "Only administrators and managers can update blockchain status"
        );
      }

      const updatedToken = await this.tokenService.updateTokenBlockchainStatus(
        id,
        blockchainData as any
      );

      sendSuccess(
        res,
        this.toResponseDTO(updatedToken),
        "Token blockchain status updated successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Redeem a token
   */
  redeemToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const redemptionData: TokenRedemptionDTO = req.body;

      // Only admins and managers can redeem tokens for now
      // In future, could allow farmers to initiate redemption requests
      if (req.user?.role !== Roles.ADMIN && req.user?.role !== Roles.MANAGER) {
        throw ErrorFactory.forbidden(
          "Only administrators and managers can redeem tokens"
        );
      }

      const updatedToken = await this.tokenService.redeemToken(
        id,
        redemptionData as any
      );

      sendSuccess(
        res,
        this.toResponseDTO(updatedToken),
        "Token redeemed successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a token
   */
  deleteToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      // For non-admin/manager users, first verify ownership
      if (req.user?.role !== Roles.ADMIN && req.user?.role !== Roles.MANAGER) {
        const token = await this.tokenService.getTokenById(id);

        if (token.farmerId !== req.user?.userId) {
          throw ErrorFactory.forbidden("You can only delete your own tokens");
        }
      }

      await this.tokenService.deleteToken(id);

      sendSuccess(res, null, "Token deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mint a token on the blockchain
   */
  mintToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      // Only admins and managers can mint tokens
      if (req.user?.role !== Roles.ADMIN && req.user?.role !== Roles.MANAGER) {
        throw ErrorFactory.forbidden(
          "Only administrators and managers can mint tokens"
        );
      }

      const mintedToken = await this.tokenService.mintToken(id);

      sendSuccess(
        res,
        this.toResponseDTO(mintedToken),
        "Token minted successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check for expired tokens and update their status (admin only)
   */
  checkExpiredTokens = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Only admins and managers can run this operation
      if (req.user?.role !== Roles.ADMIN && req.user?.role !== Roles.MANAGER) {
        throw ErrorFactory.forbidden(
          "Only administrators and managers can run this operation"
        );
      }

      const updatedCount =
        await this.tokenService.checkAndUpdateExpiredTokens();

      sendSuccess(
        res,
        { updatedCount },
        `${updatedCount} expired tokens have been updated`
      );
    } catch (error) {
      next(error);
    }
  };
}

// Export a default instance of the controller
export default new TokenController();
