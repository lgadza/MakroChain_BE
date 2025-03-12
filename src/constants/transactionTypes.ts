/**
 * Transaction type constants
 */
export enum TransactionType {
  SALE = "SALE",
  PAYMENT = "PAYMENT",
  REFUND = "REFUND",
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  FEE = "FEE",
  OTHER = "OTHER",
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
}

/**
 * Payment method constants
 */
export enum PaymentMethod {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  MOBILE_MONEY = "MOBILE_MONEY",
  CREDIT_CARD = "CREDIT_CARD",
  CRYPTO = "CRYPTO",
  PLATFORM_CREDIT = "PLATFORM_CREDIT",
  OTHER = "OTHER",
}

/**
 * Common currency codes
 */
export enum Currency {
  USD = "USD",
  EUR = "EUR",
  ZIG = "ZIG", // Local currency example
  ZAR = "ZAR",
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
