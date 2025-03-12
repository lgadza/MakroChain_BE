import { Op } from "sequelize";
import Loan from "../models/loan.model.js";

export class LoanRepository {
  /**
   * Find loan by ID
   */
  async findById(id: string): Promise<Loan | null> {
    return Loan.findByPk(id);
  }

  /**
   * Find loans by farmer ID
   */
  async findByFarmerId(
    farmerId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string | string[];
      loanType?: string;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
    } = {}
  ): Promise<{ rows: Loan[]; count: number }> {
    const {
      limit = 10,
      offset = 0,
      status,
      loanType,
      sortBy = "issuedDate",
      sortOrder = "DESC",
    } = options;

    const where: any = { farmerId };

    if (status) {
      where.status = Array.isArray(status) ? { [Op.in]: status } : status;
    }

    if (loanType) {
      where.loanType = loanType;
    }

    return Loan.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });
  }

  /**
   * Create a new loan record
   */
  async create(loanData: Partial<Loan>): Promise<Loan> {
    return Loan.create(loanData as any);
  }

  /**
   * Update a loan record
   */
  async update(id: string, loanData: Partial<Loan>): Promise<[number, Loan[]]> {
    const [affectedCount, affectedRows] = await Loan.update(loanData, {
      where: { id },
      returning: true,
    });
    return [affectedCount, affectedRows];
  }

  /**
   * Delete a loan record
   */
  async delete(id: string): Promise<number> {
    return Loan.destroy({ where: { id } });
  }

  /**
   * Update loan status
   */
  async updateStatus(
    id: string,
    status: string,
    additionalData: Partial<Loan> = {}
  ): Promise<[number, Loan[]]> {
    return Loan.update(
      { status, ...additionalData },
      {
        where: { id },
        returning: true,
      }
    );
  }

  /**
   * Search loans by various criteria
   */
  async search(
    criteria: {
      farmerId?: string;
      status?: string | string[];
      loanType?: string | string[];
      minAmount?: number;
      maxAmount?: number;
      fromDate?: Date;
      toDate?: Date;
      overdue?: boolean;
      approvedBy?: string;
    },
    pagination: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
    } = {}
  ): Promise<{ rows: Loan[]; count: number }> {
    const {
      farmerId,
      status,
      loanType,
      minAmount,
      maxAmount,
      fromDate,
      toDate,
      overdue,
      approvedBy,
    } = criteria;

    const {
      limit = 10,
      offset = 0,
      sortBy = "issuedDate",
      sortOrder = "DESC",
    } = pagination;

    const where: any = {};

    if (farmerId) {
      where.farmerId = farmerId;
    }

    if (status) {
      where.status = Array.isArray(status) ? { [Op.in]: status } : status;
    }

    if (loanType) {
      where.loanType = Array.isArray(loanType)
        ? { [Op.in]: loanType }
        : loanType;
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) {
        where.amount[Op.gte] = minAmount;
      }
      if (maxAmount !== undefined) {
        where.amount[Op.lte] = maxAmount;
      }
    }

    if (fromDate || toDate) {
      where.issuedDate = {};
      if (fromDate) {
        where.issuedDate[Op.gte] = fromDate;
      }
      if (toDate) {
        where.issuedDate[Op.lte] = toDate;
      }
    }

    if (overdue) {
      where.dueDate = { [Op.lt]: new Date() };
      where.status = { [Op.ne]: "REPAID" };
    }

    if (approvedBy) {
      where.approvedBy = approvedBy;
    }

    return Loan.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });
  }

  /**
   * Get overdue loans
   */
  async getOverdueLoans(): Promise<Loan[]> {
    const today = new Date();

    return Loan.findAll({
      where: {
        status: "ACTIVE",
        dueDate: {
          [Op.lt]: today,
        },
      },
    });
  }

  /**
   * Record loan payment
   */
  async recordPayment(
    id: string,
    paymentAmount: number,
    paymentDate: Date = new Date()
  ): Promise<[number, Loan[]]> {
    // First get the loan to calculate remaining balance
    const loan = await this.findById(id);

    if (!loan) {
      throw new Error(`Loan with ID ${id} not found`);
    }

    // Calculate new values
    const currentAmountPaid = loan.amountPaid || 0;
    const newAmountPaid =
      parseFloat(currentAmountPaid.toString()) + paymentAmount;
    const newRemainingBalance =
      parseFloat(loan.amount.toString()) - newAmountPaid;

    // Determine if the loan is fully repaid
    const status = newRemainingBalance <= 0 ? "REPAID" : loan.status;

    // Update the loan
    return this.update(id, {
      amountPaid: newAmountPaid,
      remainingBalance: Math.max(0, newRemainingBalance),
      lastPaymentDate: paymentDate,
      status,
    } as Partial<Loan>);
  }
}

// Export a default instance
export default new LoanRepository();
