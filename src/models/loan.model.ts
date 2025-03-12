import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import {
  LoanStatus,
  LoanType,
  RepaymentFrequency,
} from "../constants/loanTypes.js";

export interface LoanAttributes {
  id: string;
  farmerId: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  repaymentFrequency: string;
  loanType: string;
  status: string;
  issuedDate: Date;
  dueDate: Date;
  approvedBy?: string | null;
  approvedDate?: Date | null;
  disbursedDate?: Date | null;
  collateral?: string | null;
  notes?: string | null;
  rejectionReason?: string | null;
  lastPaymentDate?: Date | null;
  amountPaid?: number | null;
  remainingBalance?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanCreationAttributes
  extends Optional<
    LoanAttributes,
    | "id"
    | "status"
    | "approvedBy"
    | "approvedDate"
    | "disbursedDate"
    | "collateral"
    | "notes"
    | "rejectionReason"
    | "lastPaymentDate"
    | "amountPaid"
    | "remainingBalance"
    | "createdAt"
    | "updatedAt"
  > {}

class Loan
  extends Model<LoanAttributes, LoanCreationAttributes>
  implements LoanAttributes
{
  public id!: string;
  public farmerId!: string;
  public amount!: number;
  public interestRate!: number;
  public durationMonths!: number;
  public repaymentFrequency!: string;
  public loanType!: string;
  public status!: string;
  public issuedDate!: Date;
  public dueDate!: Date;
  public approvedBy!: string | null;
  public approvedDate!: Date | null;
  public disbursedDate!: Date | null;
  public collateral!: string | null;
  public notes!: string | null;
  public rejectionReason!: string | null;
  public lastPaymentDate!: Date | null;
  public amountPaid!: number | null;
  public remainingBalance!: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper methods
  public isPending(): boolean {
    return this.status === LoanStatus.PENDING;
  }

  public isApproved(): boolean {
    return (
      this.status === LoanStatus.APPROVED || this.status === LoanStatus.ACTIVE
    );
  }

  public isActive(): boolean {
    return this.status === LoanStatus.ACTIVE;
  }

  public isRejected(): boolean {
    return this.status === LoanStatus.REJECTED;
  }

  public isRepaid(): boolean {
    return this.status === LoanStatus.REPAID;
  }

  public isOverdue(): boolean {
    return this.status === LoanStatus.OVERDUE;
  }

  public getStatusDisplay(): string {
    return this.status.charAt(0) + this.status.slice(1).toLowerCase();
  }

  /**
   * Calculate total repayment amount (principal + interest)
   */
  public getTotalRepaymentAmount(): number {
    return this.amount * (1 + this.interestRate / 100);
  }

  /**
   * Calculate monthly payment
   */
  public getMonthlyPayment(): number {
    if (this.durationMonths <= 0) return 0;

    // Simple interest calculation
    const totalRepayment = this.getTotalRepaymentAmount();
    return parseFloat((totalRepayment / this.durationMonths).toFixed(2));
  }
}

export const initLoan = (sequelize: Sequelize): typeof Loan => {
  Loan.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      farmerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0,
        },
      },
      interestRate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0,
        },
      },
      durationMonths: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: true,
          min: 1,
        },
      },
      repaymentFrequency: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: RepaymentFrequency.MONTHLY,
        validate: {
          isIn: [Object.values(RepaymentFrequency)],
        },
      },
      loanType: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [Object.values(LoanType)],
        },
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: LoanStatus.PENDING,
        validate: {
          isIn: [Object.values(LoanStatus)],
        },
      },
      issuedDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      approvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      approvedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      disbursedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      collateral: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lastPaymentDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      amountPaid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
        validate: {
          isDecimal: true,
          min: 0,
        },
      },
      remainingBalance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          isDecimal: true,
          min: 0,
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Loan",
      tableName: "loans",
      hooks: {
        beforeValidate: (loan: Loan) => {
          // Set remaining balance if not provided
          if (loan.remainingBalance === undefined && loan.amount) {
            loan.remainingBalance = parseFloat(loan.amount.toString());
          }
        },
        beforeCreate: (loan: Loan) => {
          // Set issued date to today if not provided
          if (!loan.issuedDate) {
            loan.issuedDate = new Date();
          }

          // Ensure amount has max 2 decimal places
          if (loan.amount) {
            loan.amount = parseFloat(loan.amount.toFixed(2));
          }

          // Ensure interest rate has max 2 decimal places
          if (loan.interestRate) {
            loan.interestRate = parseFloat(loan.interestRate.toFixed(2));
          }
        },
      },
      indexes: [
        { fields: ["farmerId"] },
        { fields: ["status"] },
        { fields: ["issuedDate"] },
        { fields: ["dueDate"] },
        { fields: ["loanType"] },
      ],
    }
  );

  return Loan;
};

export default Loan;
