import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import LoanService from "../services/loan.service.js";
import { sendSuccess } from "../utils/responseUtil.js";
import logger from "../utils/logger.js";
import { ErrorFactory } from "../utils/errorUtils.js";
import {
  LoanDTO,
  LoanResponse,
  LoanQueryParams,
  CreateLoanDTO,
  UpdateLoanDTO,
  LoanStatusUpdateDTO,
  LoanPaymentDTO,
} from "../dto/loan.dto.js";
import { LoanStatus } from "../constants/loanTypes.js";
import { Roles } from "../constants/roles.js";

export class LoanController {
  private loanService = LoanService;

  /**
   * Transform Loan model to DTO response
   */
  private toResponseDTO(loan: any): LoanResponse {
    const totalRepaymentAmount = loan.getTotalRepaymentAmount
      ? loan.getTotalRepaymentAmount()
      : parseFloat(loan.amount) * (1 + parseFloat(loan.interestRate) / 100);

    const monthlyPayment = loan.getMonthlyPayment
      ? loan.getMonthlyPayment()
      : parseFloat((totalRepaymentAmount / loan.durationMonths).toFixed(2));

    // Calculate percentage paid if there is amountPaid
    const percentagePaid =
      loan.amountPaid !== null && loan.amount
        ? parseFloat(
            (
              (parseFloat(loan.amountPaid) / parseFloat(loan.amount)) *
              100
            ).toFixed(2)
          )
        : 0;

    // Estimate remaining payments
    const remainingPayments =
      loan.remainingBalance !== null && monthlyPayment > 0
        ? Math.ceil(parseFloat(loan.remainingBalance) / monthlyPayment)
        : loan.durationMonths;

    return {
      id: loan.id,
      farmerId: loan.farmerId,
      amount: Number(loan.amount),
      interestRate: Number(loan.interestRate),
      durationMonths: loan.durationMonths,
      repaymentFrequency: loan.repaymentFrequency,
      loanType: loan.loanType,
      status: loan.status,
      statusDisplay: loan.getStatusDisplay
        ? loan.getStatusDisplay()
        : loan.status.charAt(0) + loan.status.slice(1).toLowerCase(),
      issuedDate:
        loan.issuedDate instanceof Date
          ? loan.issuedDate.toISOString()
          : loan.issuedDate,
      dueDate:
        loan.dueDate instanceof Date
          ? loan.dueDate.toISOString()
          : loan.dueDate,
      approvedBy: loan.approvedBy,
      approvedDate:
        loan.approvedDate instanceof Date
          ? loan.approvedDate.toISOString()
          : loan.approvedDate,
      disbursedDate:
        loan.disbursedDate instanceof Date
          ? loan.disbursedDate.toISOString()
          : loan.disbursedDate,
      collateral: loan.collateral,
      notes: loan.notes,
      rejectionReason: loan.rejectionReason,
      lastPaymentDate:
        loan.lastPaymentDate instanceof Date
          ? loan.lastPaymentDate.toISOString()
          : loan.lastPaymentDate,
      amountPaid: loan.amountPaid !== null ? Number(loan.amountPaid) : null,
      remainingBalance:
        loan.remainingBalance !== null ? Number(loan.remainingBalance) : null,
      createdAt:
        loan.createdAt instanceof Date
          ? loan.createdAt.toISOString()
          : loan.createdAt,
      updatedAt:
        loan.updatedAt instanceof Date
          ? loan.updatedAt.toISOString()
          : loan.updatedAt,
      totalRepaymentAmount,
      monthlyPayment,
      percentagePaid,
      remainingPayments,
    };
  }

  /**
   * Get all loans with filtering and pagination
   */
  getAllLoans = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = req.query as unknown as LoanQueryParams;

      // Parse pagination options
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const sortBy = query.sortBy || "issuedDate";
      const sortOrder =
        (query.sortOrder?.toUpperCase() as "ASC" | "DESC") || "DESC";

      // Parse filter options
      const filters: any = {};

      if (query.farmerId) filters.farmerId = query.farmerId;
      if (query.status)
        filters.status = Array.isArray(query.status)
          ? query.status
          : [query.status];
      if (query.loanType)
        filters.loanType = Array.isArray(query.loanType)
          ? query.loanType
          : [query.loanType];
      if (query.fromDate) filters.fromDate = new Date(query.fromDate);
      if (query.toDate) filters.toDate = new Date(query.toDate);
      if (query.minAmount) filters.minAmount = Number(query.minAmount);
      if (query.maxAmount) filters.maxAmount = Number(query.maxAmount);
      if (query.overdue !== undefined) filters.overdue = Boolean(query.overdue);
      if (query.approvedBy) filters.approvedBy = query.approvedBy;

      const result = await this.loanService.searchLoans(filters, {
        page,
        limit,
        sortBy,
        sortOrder,
      });

      const responseData = {
        loans: result.loans.map((loan) => this.toResponseDTO(loan)),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.pages,
        },
      };

      sendSuccess(
        res,
        responseData.loans,
        "Loans retrieved successfully",
        200,
        {
          pagination: responseData.pagination,
        }
      );
    } catch (error) {
      logger.error(
        `Failed to get loans: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      next(error);
    }
  };

  /**
   * Get a single loan by ID
   */
  getLoanById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const loan = await this.loanService.getLoanById(id);

      sendSuccess(res, this.toResponseDTO(loan), "Loan retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get loans for a specific farmer
   */
  getFarmerLoans = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { farmerId } = req.params;
      const query = req.query as unknown as LoanQueryParams;

      // Parse pagination options
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const sortBy = query.sortBy || "issuedDate";
      const sortOrder =
        (query.sortOrder?.toUpperCase() as "ASC" | "DESC") || "DESC";

      // Parse filter options
      const filters: any = {};

      if (query.status)
        filters.status = Array.isArray(query.status)
          ? query.status
          : [query.status];
      if (query.loanType)
        filters.loanType = Array.isArray(query.loanType)
          ? query.loanType
          : [query.loanType];
      if (query.overdue !== undefined) filters.overdue = Boolean(query.overdue);

      const result = await this.loanService.getFarmerLoans(
        farmerId,
        { page, limit, sortBy, sortOrder },
        filters
      );

      const responseData = {
        loans: result.loans.map((loan) => this.toResponseDTO(loan)),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: result.pages,
        },
      };

      sendSuccess(
        res,
        responseData.loans,
        "Farmer loans retrieved successfully",
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
   * Create a new loan
   */
  createLoan = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const loanData: CreateLoanDTO = req.body;

      // If user is a farmer, ensure they can only create loans for themselves
      if (req.user?.role === Roles.FARMER) {
        loanData.farmerId = req.user?.userId as string;
      }

      const loan = await this.loanService.createLoan(loanData as any);

      sendSuccess(
        res,
        this.toResponseDTO(loan),
        "Loan created successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a loan
   */
  updateLoan = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const loanData: UpdateLoanDTO = req.body;

      // For non-admin/manager users, first verify ownership
      if (req.user?.role !== Roles.ADMIN && req.user?.role !== Roles.MANAGER) {
        const loan = await this.loanService.getLoanById(id);

        if (loan.farmerId !== req.user?.userId) {
          throw ErrorFactory.forbidden("You can only update your own loans");
        }
      }

      const updatedLoan = await this.loanService.updateLoan(
        id,
        loanData as any
      );

      sendSuccess(
        res,
        this.toResponseDTO(updatedLoan),
        "Loan updated successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update loan status
   */
  updateLoanStatus = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const statusData: LoanStatusUpdateDTO = req.body;

      // Only admins and managers can approve or reject loans
      if (
        req.user?.role !== Roles.ADMIN &&
        req.user?.role !== Roles.MANAGER &&
        (statusData.status === LoanStatus.APPROVED ||
          statusData.status === LoanStatus.REJECTED)
      ) {
        throw ErrorFactory.forbidden(
          "Only administrators and managers can approve or reject loans"
        );
      }

      // If approving, set the approver as the current user
      if (
        statusData.status === LoanStatus.APPROVED &&
        !statusData.approvedBy &&
        req.user?.userId
      ) {
        statusData.approvedBy = req.user.userId;
      }

      const updatedLoan = await this.loanService.updateLoanStatus(id, {
        status: statusData.status as LoanStatus,
        approvedBy: statusData.approvedBy,
        approvedDate: statusData.approvedDate,
        disbursedDate: statusData.disbursedDate,
        rejectionReason: statusData.rejectionReason,
      });

      sendSuccess(
        res,
        this.toResponseDTO(updatedLoan),
        "Loan status updated successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Record a loan payment
   */
  recordLoanPayment = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const paymentData: LoanPaymentDTO = req.body;

      // For non-admin/manager users, verify loan ownership
      if (req.user?.role !== Roles.ADMIN && req.user?.role !== Roles.MANAGER) {
        const loan = await this.loanService.getLoanById(id);

        if (loan.farmerId !== req.user?.userId) {
          throw ErrorFactory.forbidden(
            "You can only make payments for your own loans"
          );
        }
      }

      const updatedLoan = await this.loanService.recordLoanPayment(id, {
        amount: paymentData.amount,
        paymentDate: paymentData.paymentDate,
        notes: paymentData.notes,
      });

      sendSuccess(
        res,
        this.toResponseDTO(updatedLoan),
        "Loan payment recorded successfully"
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a loan
   */
  deleteLoan = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      // For non-admin/manager users, first verify ownership
      if (req.user?.role !== Roles.ADMIN && req.user?.role !== Roles.MANAGER) {
        const loan = await this.loanService.getLoanById(id);

        if (loan.farmerId !== req.user?.userId) {
          throw ErrorFactory.forbidden("You can only delete your own loans");
        }
      }

      await this.loanService.deleteLoan(id);

      sendSuccess(res, null, "Loan deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check for overdue loans and update their status (admin only)
   */
  checkOverdueLoans = async (
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

      const updatedCount = await this.loanService.checkAndUpdateOverdueLoans();

      sendSuccess(
        res,
        { updatedCount },
        `${updatedCount} overdue loans have been updated`
      );
    } catch (error) {
      next(error);
    }
  };
}

// Export a default instance of the controller
export default new LoanController();
