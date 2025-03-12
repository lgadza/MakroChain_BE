export interface LoanDTO {
  id: string;
  farmerId: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  repaymentFrequency: string;
  loanType: string;
  status: string;
  issuedDate: string | Date;
  dueDate: string | Date;
  approvedBy?: string | null;
  approvedDate?: string | Date | null;
  disbursedDate?: string | Date | null;
  collateral?: string | null;
  notes?: string | null;
  rejectionReason?: string | null;
  lastPaymentDate?: string | Date | null;
  amountPaid?: number | null;
  remainingBalance?: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateLoanDTO {
  farmerId: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  repaymentFrequency?: string;
  loanType: string;
  issuedDate?: Date;
  dueDate: Date;
  collateral?: string;
  notes?: string;
}

export interface UpdateLoanDTO {
  amount?: number;
  interestRate?: number;
  durationMonths?: number;
  repaymentFrequency?: string;
  loanType?: string;
  dueDate?: Date;
  collateral?: string;
  notes?: string;
}

export interface LoanStatusUpdateDTO {
  status: string;
  approvedBy?: string;
  approvedDate?: Date;
  disbursedDate?: Date;
  rejectionReason?: string;
}

export interface LoanPaymentDTO {
  amount: number;
  paymentDate?: Date;
  notes?: string;
}

export interface LoanQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  status?: string | string[];
  loanType?: string | string[];
  farmerId?: string;
  minAmount?: number;
  maxAmount?: number;
  fromDate?: string;
  toDate?: string;
  overdue?: boolean;
  approvedBy?: string;
}

export interface LoanResponse extends LoanDTO {
  statusDisplay: string;
  totalRepaymentAmount: number;
  monthlyPayment: number;
  percentagePaid?: number;
  remainingPayments?: number;
}

export interface LoanListResponse {
  loans: LoanResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
