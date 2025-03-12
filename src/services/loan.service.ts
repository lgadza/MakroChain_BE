import { LoanRepository } from "../repositories/loan.repository.js";
import {
  ILoanService,
  LoanFilterOptions,
  PaginationOptions,
  LoanResult,
  LoanStatusUpdateOptions,
  LoanPaymentOptions,
} from "../interfaces/services/loan.service.interface.js";
import Loan from "../models/loan.model.js";
import { LoanStatus } from "../constants/loanTypes.js";
import { ErrorFactory } from "../utils/errorUtils.js";
import logger from "../utils/logger.js";
import TransactionService from "./transaction.service.js";
import {
  TransactionType,
  PaymentMethod,
  Currency,
} from "../constants/transactionTypes.js";

export class LoanService implements ILoanService {
  private loanRepository: LoanRepository;
  private transactionService;

  constructor() {
    this.loanRepository = new LoanRepository();
    this.transactionService = TransactionService;
  }

  /**
   * Get a loan by ID
   */
  async getLoanById(id: string): Promise<Loan> {
    const loan = await this.loanRepository.findById(id);

    if (!loan) {
      throw ErrorFactory.notFound(`Loan with ID ${id} not found`);
    }

    return loan;
  }

  /**
   * Get loans for a specific farmer
   */
  async getFarmerLoans(
    farmerId: string,
    options: PaginationOptions = {},
    filters: Partial<LoanFilterOptions> = {}
  ): Promise<LoanResult> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "issuedDate",
        sortOrder = "DESC",
      } = options;
      const offset = (page - 1) * limit;

      const { rows, count } = await this.loanRepository.findByFarmerId(
        farmerId,
        {
          limit,
          offset,
          status: filters.status,
          loanType: filters.loanType as string,
          sortBy,
          sortOrder,
        }
      );

      return {
        loans: rows,
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error(
        `Error getting farmer loans: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to retrieve farmer loans");
    }
  }

  /**
   * Create a new loan
   */
  async createLoan(loanData: Partial<Loan>): Promise<Loan> {
    try {
      // Set default values if not provided
      if (!loanData.status) {
        loanData.status = LoanStatus.PENDING;
      }

      if (!loanData.issuedDate) {
        loanData.issuedDate = new Date();
      }

      // Set initial values for new loans
      loanData.amountPaid = 0;
      loanData.remainingBalance = loanData.amount;

      // Create the loan
      const loan = await this.loanRepository.create(loanData);
      return loan;
    } catch (error) {
      logger.error(
        `Error creating loan: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      if (error instanceof Error && error.name === "SequelizeValidationError") {
        throw ErrorFactory.validation("Invalid loan data", undefined, error);
      }

      throw ErrorFactory.internal("Failed to create loan record");
    }
  }

  /**
   * Update an existing loan
   */
  async updateLoan(id: string, loanData: Partial<Loan>): Promise<Loan> {
    try {
      // Get the loan to confirm it exists
      const loan = await this.getLoanById(id);

      // Cannot update loans that are already approved, active, or repaid
      if (
        [
          LoanStatus.APPROVED,
          LoanStatus.ACTIVE,
          LoanStatus.REPAID,
          LoanStatus.DEFAULTED,
        ].includes(loan.status as LoanStatus)
      ) {
        throw ErrorFactory.forbidden(
          `Cannot update loan details after it has been ${loan.status}`
        );
      }

      // Update the loan
      const [affectedCount, affectedRows] = await this.loanRepository.update(
        id,
        loanData
      );

      if (affectedCount === 0) {
        throw ErrorFactory.notFound(`Loan with ID ${id} not found`);
      }

      return affectedRows[0];
    } catch (error) {
      // Rethrow specific errors
      if (
        error instanceof Error &&
        (error.name === "NotFoundError" || error.name === "ForbiddenError")
      ) {
        throw error;
      }

      logger.error(
        `Error updating loan: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      if (error instanceof Error && error.name === "SequelizeValidationError") {
        throw ErrorFactory.validation("Invalid loan data", undefined, error);
      }

      throw ErrorFactory.internal("Failed to update loan record");
    }
  }

  /**
   * Update loan status with additional approval/rejection data
   */
  async updateLoanStatus(
    id: string,
    statusOptions: LoanStatusUpdateOptions
  ): Promise<Loan> {
    try {
      const loan = await this.getLoanById(id);
      const {
        status,
        approvedBy,
        approvedDate,
        disbursedDate,
        rejectionReason,
      } = statusOptions;

      // Validate status transitions
      if (loan.status === LoanStatus.REPAID && status !== LoanStatus.REPAID) {
        throw ErrorFactory.conflict(
          "Cannot change the status of a repaid loan"
        );
      }

      if (
        loan.status === LoanStatus.DEFAULTED &&
        ![LoanStatus.ACTIVE, LoanStatus.RESTRUCTURED].includes(status)
      ) {
        throw ErrorFactory.conflict(
          "Defaulted loans can only be set to active or restructured"
        );
      }

      // Prepare update data
      const updateData: Partial<Loan> = { status: status as string };

      // Add approval data if approving
      if (status === LoanStatus.APPROVED) {
        updateData.approvedBy = approvedBy;
        updateData.approvedDate = approvedDate || new Date();
      }

      // Add rejection reason if rejecting
      if (status === LoanStatus.REJECTED) {
        updateData.rejectionReason = rejectionReason;
      }

      // Add disbursement date if disbursing/activating
      if (status === LoanStatus.ACTIVE) {
        updateData.disbursedDate = disbursedDate || new Date();
      }

      // Update the loan status
      const [affectedCount, affectedRows] =
        await this.loanRepository.updateStatus(
          id,
          status as string,
          updateData
        );

      if (affectedCount === 0) {
        throw ErrorFactory.notFound(`Loan with ID ${id} not found`);
      }

      // If loan is being disbursed (activated), create a transaction
      if (status === LoanStatus.ACTIVE && loan.status !== LoanStatus.ACTIVE) {
        try {
          await this.transactionService.createTransaction({
            farmerId: loan.farmerId,
            transactionType: TransactionType.DEPOSIT,
            amount: parseFloat(loan.amount.toString()),
            currency: Currency.USD,
            paymentMethod: PaymentMethod.BANK_TRANSFER,
            notes: `Loan disbursement for ${loan.loanType.toLowerCase()} loan`,
            reference: `LOAN-${loan.id}`,
            metadata: {
              loanId: loan.id,
              loanType: loan.loanType,
            },
          });
        } catch (transactionError) {
          logger.error(
            `Failed to create loan disbursement transaction: ${
              transactionError instanceof Error
                ? transactionError.message
                : "Unknown error"
            }`
          );
          // We don't want to fail the loan status update if transaction fails
          // Just log the error
        }
      }

      return affectedRows[0];
    } catch (error) {
      // Rethrow specific errors
      if (
        error instanceof Error &&
        (error.name === "NotFoundError" || error.name === "ConflictError")
      ) {
        throw error;
      }

      logger.error(
        `Error updating loan status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      throw ErrorFactory.internal("Failed to update loan status");
    }
  }

  /**
   * Delete a loan
   * Note: Only PENDING or REJECTED loans can be deleted
   */
  async deleteLoan(id: string): Promise<boolean> {
    try {
      const loan = await this.getLoanById(id);

      // Prevent deleting loans that are approved or active
      if (
        ![
          LoanStatus.PENDING,
          LoanStatus.REJECTED,
          LoanStatus.CANCELLED,
        ].includes(loan.status as LoanStatus)
      ) {
        throw ErrorFactory.forbidden(
          `Loans in ${loan.status} status cannot be deleted`
        );
      }

      const deletedCount = await this.loanRepository.delete(id);
      return deletedCount > 0;
    } catch (error) {
      // Rethrow specific errors
      if (
        error instanceof Error &&
        (error.name === "NotFoundError" || error.name === "ForbiddenError")
      ) {
        throw error;
      }

      logger.error(
        `Error deleting loan: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to delete loan record");
    }
  }

  /**
   * Search loans by various criteria
   */
  async searchLoans(
    filters: LoanFilterOptions,
    pagination: PaginationOptions
  ): Promise<LoanResult> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "issuedDate",
        sortOrder = "DESC",
      } = pagination;
      const offset = (page - 1) * limit;

      // Convert date strings to Date objects if necessary
      let fromDate = undefined;
      let toDate = undefined;

      if (filters.fromDate) {
        fromDate = new Date(filters.fromDate);
      }

      if (filters.toDate) {
        toDate = new Date(filters.toDate);
      }

      const searchCriteria = {
        ...filters,
        fromDate,
        toDate,
      };

      const { rows, count } = await this.loanRepository.search(searchCriteria, {
        limit,
        offset,
        sortBy,
        sortOrder,
      });

      return {
        loans: rows,
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error(
        `Error searching loans: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to search loans");
    }
  }

  /**
   * Record a payment for a loan
   */
  async recordLoanPayment(
    id: string,
    paymentOptions: LoanPaymentOptions
  ): Promise<Loan> {
    try {
      const loan = await this.getLoanById(id);

      // Only active loans can receive payments
      if (
        loan.status !== LoanStatus.ACTIVE &&
        loan.status !== LoanStatus.OVERDUE
      ) {
        throw ErrorFactory.conflict(
          `Cannot record payment for loan in ${loan.status} status`
        );
      }

      // Record the payment on the loan
      const [affectedCount, affectedRows] =
        await this.loanRepository.recordPayment(
          id,
          paymentOptions.amount,
          paymentOptions.paymentDate
        );

      if (affectedCount === 0) {
        throw ErrorFactory.notFound(`Loan with ID ${id} not found`);
      }

      // Create a transaction record for this payment
      try {
        await this.transactionService.createTransaction({
          farmerId: loan.farmerId,
          transactionType: TransactionType.PAYMENT,
          amount: paymentOptions.amount,
          currency: Currency.USD,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          transactionDate: paymentOptions.paymentDate || new Date(),
          notes:
            paymentOptions.notes ||
            `Loan payment for ${loan.loanType.toLowerCase()} loan`,
          reference: `LOAN-PAYMENT-${loan.id}`,
          metadata: {
            loanId: loan.id,
            loanType: loan.loanType,
            paymentNumber: loan.amountPaid ? loan.amountPaid + 1 : 1,
          },
        });
      } catch (transactionError) {
        logger.error(
          `Failed to create loan payment transaction: ${
            transactionError instanceof Error
              ? transactionError.message
              : "Unknown error"
          }`
        );
        // We don't want to fail the payment record if transaction creation fails
      }

      return affectedRows[0];
    } catch (error) {
      // Rethrow specific errors
      if (
        error instanceof Error &&
        (error.name === "NotFoundError" || error.name === "ConflictError")
      ) {
        throw error;
      }

      logger.error(
        `Error recording loan payment: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to record loan payment");
    }
  }

  /**
   * Check for overdue loans and update their status
   */
  async checkAndUpdateOverdueLoans(): Promise<number> {
    try {
      const overdueLoans = await this.loanRepository.getOverdueLoans();
      let updatedCount = 0;

      for (const loan of overdueLoans) {
        try {
          await this.loanRepository.updateStatus(loan.id, LoanStatus.OVERDUE);
          updatedCount++;
        } catch (error) {
          logger.error(
            `Failed to update overdue loan ${loan.id}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      return updatedCount;
    } catch (error) {
      logger.error(
        `Error checking overdue loans: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw ErrorFactory.internal("Failed to check for overdue loans");
    }
  }
}

// Export a default instance
export default new LoanService();
