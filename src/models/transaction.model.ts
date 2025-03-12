import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import {
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  Currency,
} from "../constants/transactionTypes.js";

export interface TransactionAttributes {
  id: string;
  farmerId: string;
  buyerId?: string | null;
  harvestId?: string | null;
  transactionType: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionDate: Date;
  status: string;
  notes: string | null;
  reference: string | null;
  blockchainHash: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionCreationAttributes
  extends Optional<
    TransactionAttributes,
    | "id"
    | "buyerId"
    | "harvestId"
    | "notes"
    | "reference"
    | "blockchainHash"
    | "metadata"
    | "createdAt"
    | "updatedAt"
  > {}

class Transaction
  extends Model<TransactionAttributes, TransactionCreationAttributes>
  implements TransactionAttributes
{
  public id!: string;
  public farmerId!: string;
  public buyerId!: string | null;
  public harvestId!: string | null;
  public transactionType!: string;
  public amount!: number;
  public currency!: string;
  public paymentMethod!: string;
  public transactionDate!: Date;
  public status!: string;
  public notes!: string | null;
  public reference!: string | null;
  public blockchainHash!: string | null;
  public metadata!: Record<string, any> | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper methods
  public isCompleted(): boolean {
    return this.status === TransactionStatus.COMPLETED;
  }

  public isPending(): boolean {
    return this.status === TransactionStatus.PENDING;
  }

  public isFailed(): boolean {
    return this.status === TransactionStatus.FAILED;
  }

  public getStatusDisplay(): string {
    return this.status.charAt(0) + this.status.slice(1).toLowerCase();
  }
}

export const initTransaction = (
  sequelize: Sequelize,
  dataTypes: typeof DataTypes
) => {
  Transaction.init(
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      farmerId: {
        type: dataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      buyerId: {
        type: dataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      harvestId: {
        type: dataTypes.UUID,
        allowNull: true,
        references: {
          model: "harvests",
          key: "id",
        },
      },
      transactionType: {
        type: dataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [Object.values(TransactionType)],
        },
      },
      amount: {
        type: dataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
        },
      },
      currency: {
        type: dataTypes.STRING(3),
        allowNull: false,
        defaultValue: Currency.USD,
        validate: {
          isIn: [Object.values(Currency)],
        },
      },
      paymentMethod: {
        type: dataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [Object.values(PaymentMethod)],
        },
      },
      transactionDate: {
        type: dataTypes.DATE,
        allowNull: false,
        defaultValue: dataTypes.NOW,
      },
      status: {
        type: dataTypes.STRING(20),
        allowNull: false,
        defaultValue: TransactionStatus.PENDING,
        validate: {
          isIn: [Object.values(TransactionStatus)],
        },
      },
      notes: {
        type: dataTypes.TEXT,
        allowNull: true,
      },
      reference: {
        type: dataTypes.STRING(100),
        allowNull: true,
      },
      blockchainHash: {
        type: dataTypes.STRING(255),
        allowNull: true,
      },
      metadata: {
        type: dataTypes.JSON,
        allowNull: true,
      },
      createdAt: {
        type: dataTypes.DATE,
        allowNull: false,
        defaultValue: dataTypes.NOW,
      },
      updatedAt: {
        type: dataTypes.DATE,
        allowNull: false,
        defaultValue: dataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Transaction",
      tableName: "transactions",
      // Hooks for data validation and processing
      hooks: {
        beforeValidate: (transaction: Transaction) => {
          // Set default transaction date if not provided
          if (!transaction.transactionDate) {
            transaction.transactionDate = new Date();
          }

          // Ensure amount has max 2 decimal places
          if (transaction.amount) {
            transaction.amount = parseFloat(transaction.amount.toFixed(2));
          }
        },
        beforeCreate: (transaction: Transaction) => {
          // Transaction type specific validations
          if (
            transaction.transactionType === TransactionType.SALE &&
            !transaction.harvestId
          ) {
            throw new Error("Harvest ID is required for sale transactions");
          }
        },
      },
      indexes: [
        { fields: ["farmerId"] },
        { fields: ["buyerId"] },
        { fields: ["harvestId"] },
        { fields: ["transactionType"] },
        { fields: ["status"] },
        { fields: ["transactionDate"] },
      ],
    }
  );

  return Transaction;
};

export default Transaction;
