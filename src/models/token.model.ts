import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import {
  TokenStatus,
  BlockchainStatus,
  TokenType,
} from "../constants/tokenTypes.js";

export interface TokenAttributes {
  id: string;
  harvestId: string;
  farmerId: string;
  tokenAmount: number;
  earnedDate: Date;
  expiryDate?: Date | null;
  status: string;
  tokenType: string;
  blockchainStatus: string;
  blockchainTxId?: string | null;
  contractAddress?: string | null;
  tokenId?: string | null;
  metadata?: object | null;
  redemptionDate?: Date | null;
  redemptionAmount?: number | null;
  redemptionTxId?: string | null;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenCreationAttributes
  extends Optional<
    TokenAttributes,
    | "id"
    | "status"
    | "tokenType"
    | "blockchainStatus"
    | "blockchainTxId"
    | "contractAddress"
    | "tokenId"
    | "metadata"
    | "expiryDate"
    | "redemptionDate"
    | "redemptionAmount"
    | "redemptionTxId"
    | "lastUpdated"
    | "createdAt"
    | "updatedAt"
  > {}

class Token
  extends Model<TokenAttributes, TokenCreationAttributes>
  implements TokenAttributes
{
  public id!: string;
  public harvestId!: string;
  public farmerId!: string;
  public tokenAmount!: number;
  public earnedDate!: Date;
  public expiryDate!: Date | null;
  public status!: string;
  public tokenType!: string;
  public blockchainStatus!: string;
  public blockchainTxId!: string | null;
  public contractAddress!: string | null;
  public tokenId!: string | null;
  public metadata!: object | null;
  public redemptionDate!: Date | null;
  public redemptionAmount!: number | null;
  public redemptionTxId!: string | null;
  public lastUpdated!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper methods
  public isPending(): boolean {
    return this.status === TokenStatus.PENDING;
  }

  public isActive(): boolean {
    return this.status === TokenStatus.ACTIVE;
  }

  public isRedeemed(): boolean {
    return this.status === TokenStatus.REDEEMED;
  }

  public isExpired(): boolean {
    return this.status === TokenStatus.EXPIRED;
  }

  public isMinted(): boolean {
    return this.blockchainStatus === BlockchainStatus.MINTED;
  }

  public getStatusDisplay(): string {
    return this.status.charAt(0) + this.status.slice(1).toLowerCase();
  }

  public getBlockchainStatusDisplay(): string {
    const statusParts = this.blockchainStatus.split("_");
    return statusParts
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(" ");
  }
}

export const initToken = (sequelize: Sequelize): typeof Token => {
  Token.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      harvestId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "harvests",
          key: "id",
        },
      },
      farmerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      tokenAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0,
        },
      },
      earnedDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      expiryDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: TokenStatus.PENDING,
        validate: {
          isIn: [Object.values(TokenStatus)],
        },
      },
      tokenType: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: TokenType.HARVEST,
        validate: {
          isIn: [Object.values(TokenType)],
        },
      },
      blockchainStatus: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: BlockchainStatus.UNMINTED,
        validate: {
          isIn: [Object.values(BlockchainStatus)],
        },
      },
      blockchainTxId: {
        type: DataTypes.STRING(66), // Size to accommodate Ethereum tx hash
        allowNull: true,
      },
      contractAddress: {
        type: DataTypes.STRING(42), // Size for Ethereum address
        allowNull: true,
      },
      tokenId: {
        type: DataTypes.STRING(66), // Size for token ID
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      redemptionDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      redemptionAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          isDecimal: true,
          min: 0,
        },
      },
      redemptionTxId: {
        type: DataTypes.STRING(66),
        allowNull: true,
      },
      lastUpdated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
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
      modelName: "Token",
      tableName: "tokens",
      hooks: {
        beforeValidate: (token: Token) => {
          if (!token.earnedDate) {
            token.earnedDate = new Date();
          }
          // Update lastUpdated time
          token.lastUpdated = new Date();
        },
        beforeCreate: (token: Token) => {
          // Ensure tokenAmount has max 2 decimal places
          if (token.tokenAmount) {
            token.tokenAmount = parseFloat(token.tokenAmount.toFixed(2));
          }
        },
      },
      indexes: [
        { fields: ["harvestId"] },
        { fields: ["farmerId"] },
        { fields: ["status"] },
        { fields: ["blockchainStatus"] },
        { fields: ["earnedDate"] },
      ],
    }
  );

  return Token;
};

export default Token;
