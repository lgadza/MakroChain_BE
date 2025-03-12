/**
 * Transaction type constants
 */
export enum TransactionType {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  PAYMENT = "PAYMENT",
  REFUND = "REFUND",
  FEE = "FEE",
  TRANSFER = "TRANSFER",
  INTEREST = "INTEREST",
  ADJUSTMENT = "ADJUSTMENT",
  HARVEST_SALE = "HARVEST_SALE",
  LOAN_DISBURSEMENT = "LOAN_DISBURSEMENT",
  LOAN_PAYMENT = "LOAN_PAYMENT",
  TOKEN_ISSUANCE = "TOKEN_ISSUANCE", // Added for token minting
  TOKEN_REDEMPTION = "TOKEN_REDEMPTION", // Added for token redemption
  TOKEN_TRANSFER = "TOKEN_TRANSFER", // Added for token transfers
  SALE = "SALE", // Added for general sales transactions
}

/**
 * Transaction status constants
 */
export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
  PROCESSING = "PROCESSING",
}

/**
 * Payment method constants
 */
export enum PaymentMethod {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  MOBILE_MONEY = "MOBILE_MONEY",
  CARD = "CARD",
  CHECK = "CHECK",
  CREDIT = "CREDIT",
  BLOCKCHAIN = "BLOCKCHAIN", // Added for blockchain transactions
  OTHER = "OTHER",
}

/**
 * Common currency codes
 */
export enum Currency {
  USD = "USD",
  EUR = "EUR",
  GBP = "GBP",
  INR = "INR",
  KES = "KES",
  NGN = "NGN",
  ZAR = "ZAR",
  TOKEN = "TOKEN", // Added for token currency
  ETH = "ETH", // Added for Ethereum
  MATIC = "MATIC", // Added for Polygon/Matic
}

/**
 * Get all transaction types
 */
export const getTransactionTypes = (): string[] => {
  return Object.values(TransactionType);
};

/**
 * Get all transaction statuses
 */
export const getTransactionStatuses = (): string[] => {
  return Object.values(TransactionStatus);
};

/**
 * Get all payment methods
 */
export const getPaymentMethods = (): string[] => {
  return Object.values(PaymentMethod);
};

/**
 * Get all currency codes
 */
export const getCurrencies = (): string[] => {
  return Object.values(Currency);
};
