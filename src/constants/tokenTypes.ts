/**
 * Token status constants
 */
export enum TokenStatus {
  PENDING = "PENDING",
  REDEEMED = "REDEEMED",
  EXPIRED = "EXPIRED",
  ACTIVE = "ACTIVE",
  REVOKED = "REVOKED",
}

/**
 * Token type constants
 */
export enum TokenType {
  HARVEST = "HARVEST",
  REWARD = "REWARD",
  LOYALTY = "LOYALTY",
  PROMOTIONAL = "PROMOTIONAL",
}

/**
 * Token blockchain status
 */
export enum BlockchainStatus {
  UNMINTED = "UNMINTED",
  PENDING_MINTING = "PENDING_MINTING",
  MINTED = "MINTED",
  TRANSFER_PENDING = "TRANSFER_PENDING",
  TRANSFER_COMPLETE = "TRANSFER_COMPLETE",
  FAILED = "FAILED",
}

/**
 * Get all token statuses
 */
export const getTokenStatuses = (): string[] => {
  return Object.values(TokenStatus);
};

/**
 * Get all token types
 */
export const getTokenTypes = (): string[] => {
  return Object.values(TokenType);
};

/**
 * Get all blockchain status types
 */
export const getBlockchainStatuses = (): string[] => {
  return Object.values(BlockchainStatus);
};
