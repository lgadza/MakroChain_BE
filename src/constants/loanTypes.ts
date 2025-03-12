/**
 * Loan status constants
 */
export enum LoanStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  ACTIVE = "ACTIVE",
  OVERDUE = "OVERDUE",
  REPAID = "REPAID",
  DEFAULTED = "DEFAULTED",
  RESTRUCTURED = "RESTRUCTURED",
  CANCELLED = "CANCELLED",
}

/**
 * Loan type constants
 */
export enum LoanType {
  EQUIPMENT = "EQUIPMENT",
  SEEDS = "SEEDS",
  FERTILIZER = "FERTILIZER",
  SEASONAL = "SEASONAL",
  INFRASTRUCTURE = "INFRASTRUCTURE",
  EMERGENCY = "EMERGENCY",
  OTHER = "OTHER",
}

/**
 * Payment frequency for loan repayments
 */
export enum RepaymentFrequency {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  BIANNUALLY = "BIANNUALLY",
  ANNUALLY = "ANNUALLY",
  LUMP_SUM = "LUMP_SUM",
  CUSTOM = "CUSTOM",
}

/**
 * Get all loan statuses
 */
export const getLoanStatuses = (): string[] => {
  return Object.values(LoanStatus);
};

/**
 * Get all loan types
 */
export const getLoanTypes = (): string[] => {
  return Object.values(LoanType);
};

/**
 * Get all repayment frequencies
 */
export const getRepaymentFrequencies = (): string[] => {
  return Object.values(RepaymentFrequency);
};
