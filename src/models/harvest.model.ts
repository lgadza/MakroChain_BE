import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import {
  QualityGrade,
  MarketStatus,
  UnitOfMeasure,
} from "../constants/harvestTypes.js";

export interface HarvestAttributes {
  id: string;
  farmerId: string;
  cropType: string;
  variety: string | null;
  quantity: number;
  unitOfMeasure: string;
  qualityGrade: string;
  harvestDate: Date;
  storageLocation: string | null;
  expectedPrice: number;
  marketStatus: string;
  buyerId: string | null;
  transactionId: string | null;
  blockchainHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HarvestCreationAttributes
  extends Optional<
    HarvestAttributes,
    | "id"
    | "variety"
    | "storageLocation"
    | "buyerId"
    | "transactionId"
    | "blockchainHash"
    | "createdAt"
    | "updatedAt"
  > {}

class Harvest
  extends Model<HarvestAttributes, HarvestCreationAttributes>
  implements HarvestAttributes
{
  public id!: string;
  public farmerId!: string;
  public cropType!: string;
  public variety!: string | null;
  public quantity!: number;
  public unitOfMeasure!: string;
  public qualityGrade!: string;
  public harvestDate!: Date;
  public storageLocation!: string | null;
  public expectedPrice!: number;
  public marketStatus!: string;
  public buyerId!: string | null;
  public transactionId!: string | null;
  public blockchainHash!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper methods
  public isAvailable(): boolean {
    return this.marketStatus === MarketStatus.AVAILABLE;
  }

  public calculateTotalValue(): number {
    return this.quantity * this.expectedPrice;
  }

  public canBeSold(): boolean {
    return [MarketStatus.AVAILABLE, MarketStatus.RESERVED].includes(
      this.marketStatus as MarketStatus
    );
  }
}

export const initHarvest = (
  sequelize: Sequelize,
  dataTypes: typeof DataTypes
) => {
  Harvest.init(
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
          model: "users", // Assuming farmers are in the users table
          key: "id",
        },
      },
      cropType: {
        type: dataTypes.STRING(100),
        allowNull: false,
      },
      variety: {
        type: dataTypes.STRING(100),
        allowNull: true,
      },
      quantity: {
        type: dataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0.01,
        },
      },
      unitOfMeasure: {
        type: dataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [Object.values(UnitOfMeasure)],
        },
      },
      qualityGrade: {
        type: dataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [Object.values(QualityGrade)],
        },
      },
      harvestDate: {
        type: dataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: true,
          // Ensure harvest date is not in the future
          isNotInFuture(value: Date) {
            if (value > new Date()) {
              throw new Error("Harvest date cannot be in the future");
            }
          },
        },
      },
      storageLocation: {
        type: dataTypes.STRING(255),
        allowNull: true,
      },
      expectedPrice: {
        type: dataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0,
        },
      },
      marketStatus: {
        type: dataTypes.STRING(20),
        allowNull: false,
        defaultValue: MarketStatus.AVAILABLE,
        validate: {
          isIn: [Object.values(MarketStatus)],
        },
      },
      buyerId: {
        type: dataTypes.UUID,
        allowNull: true,
        references: {
          model: "users", // Assuming buyers are in the users table
          key: "id",
        },
      },
      transactionId: {
        type: dataTypes.UUID,
        allowNull: true,
        references: {
          model: "transactions", // This will need to be created if it doesn't exist
          key: "id",
        },
      },
      blockchainHash: {
        type: dataTypes.STRING(255),
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
      modelName: "Harvest",
      tableName: "harvests",
      // Hooks for data validation and transformation
      hooks: {
        beforeValidate: (harvest: Harvest) => {
          // Normalize crop type to uppercase
          if (harvest.cropType) {
            harvest.cropType = harvest.cropType.trim();
          }

          // Set marketStatus to AVAILABLE if not specified during creation
          if (!harvest.marketStatus) {
            harvest.marketStatus = MarketStatus.AVAILABLE;
          }

          // Round quantity to 2 decimal places if necessary
          if (harvest.quantity) {
            harvest.quantity = Number(harvest.quantity.toFixed(2));
          }
        },
        beforeCreate: (harvest: Harvest) => {
          // Additional validation for transactions
          if (harvest.marketStatus === MarketStatus.SOLD && !harvest.buyerId) {
            throw new Error(
              "Buyer ID must be provided when market status is SOLD"
            );
          }
        },
      },
      indexes: [
        // Add indexes for frequently queried columns
        { fields: ["farmerId"] },
        { fields: ["marketStatus"] },
        { fields: ["harvestDate"] },
        { fields: ["cropType"] },
        // Composite index for common filtered queries
        { fields: ["farmerId", "marketStatus"] },
      ],
    }
  );

  return Harvest;
};

export default Harvest;
