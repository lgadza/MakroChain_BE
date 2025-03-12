import Loan from "../../models/loan.model.js";
import { LoanStatus } from "../../constants/loanTypes.js";

export interface LoanFilterOptions {
  farmerId?: string;
  status?: string | string[];
  loanType?: string | string[];
  minAmount?: number;
  maxAmount?: number;
  fromDate?: Date;
  toDate?: Date;
  overdue?: boolean;
  approvedBy?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface LoanResult {
  loans: Loan[];
  total: number;
  pages: number;
}

export interface LoanStatusUpdateOptions {
  status: LoanStatus;
  approvedBy?: string;
  approvedDate?: Date;
  disbursedDate?: Date;
  rejectionReason?: string;
}

export interface LoanPaymentOptions {
  amount: number;
  paymentDate?: Date;
  notes?: string;
}

export interface ILoanService {
  getLoanById(id: string): Promise<Loan>;

  getFarmerLoans(
    farmerId: string,
    options?: PaginationOptions,
    filters?: Partial<LoanFilterOptions>
  ): Promise<LoanResult>;

  createLoan(loanData: Partial<Loan>): Promise<Loan>;

  updateLoan(id: string, loanData: Partial<Loan>): Promise<Loan>;

  updateLoanStatus(
    id: string,
    statusOptions: LoanStatusUpdateOptions
  ): Promise<Loan>;

  deleteLoan(id: string): Promise<boolean>;

  searchLoans(
    filters: LoanFilterOptions,
    pagination: PaginationOptions
  ): Promise<LoanResult>;

  recordLoanPayment(
    id: string,
    paymentOptions: LoanPaymentOptions
  ): Promise<Loan>;

  checkAndUpdateOverdueLoans(): Promise<number>;
}
