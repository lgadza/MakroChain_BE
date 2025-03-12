import { Model, DataTypes, Sequelize, Optional, Op } from "sequelize";
import User from "./user.model.js";

export interface PhoneAttributes {
  id: string;
  userId: string;
  phoneType: string; // e.g., 'MOBILE', 'HOME', 'WORK', 'FAX', 'OTHER'
  countryCode: string;
  number: string;
  extension?: string;
  isDefault: boolean;
  isVerified: boolean;
  verificationCode?: string;
  verificationExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhoneCreationAttributes
  extends Optional<
    PhoneAttributes,
    | "id"
    | "extension"
    | "isDefault"
    | "isVerified"
    | "verificationCode"
    | "verificationExpires"
    | "createdAt"
    | "updatedAt"
  > {}

class Phone
  extends Model<PhoneAttributes, PhoneCreationAttributes>
  implements PhoneAttributes
{
  public id!: string;
  public userId!: string;
  public phoneType!: string;
  public countryCode!: string;
  public number!: string;
  public extension!: string;
  public isDefault!: boolean;
  public isVerified!: boolean;
  public verificationCode!: string;
  public verificationExpires!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Format phone number with country code
   */
  public getFormattedNumber(): string {
    return `+${this.countryCode}${this.number}${
      this.extension ? ` ext. ${this.extension}` : ""
    }`;
  }
}

export const initPhone = (sequelize: Sequelize) => {
  Phone.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      phoneType: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [["MOBILE", "HOME", "WORK", "FAX", "OTHER"]],
        },
      },
      countryCode: {
        type: DataTypes.STRING(5),
        allowNull: false,
        validate: {
          is: /^\d+$/,
        },
      },
      number: {
        type: DataTypes.STRING(15),
        allowNull: false,
        validate: {
          is: /^\d+$/,
        },
      },
      extension: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      verificationCode: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      verificationExpires: {
        type: DataTypes.DATE,
        allowNull: true,
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
      modelName: "Phone",
      tableName: "phones",
      hooks: {
        beforeCreate: async (phone: Phone) => {
          // If this phone is marked as default, unset any other default phones for this user
          if (phone.isDefault) {
            await Phone.update(
              { isDefault: false },
              {
                where: {
                  userId: phone.userId,
                  phoneType: phone.phoneType,
                  isDefault: true,
                },
              }
            );
          }
        },
        beforeUpdate: async (phone: Phone) => {
          // If this phone is being updated to be the default, unset any other default phones
          if (phone.changed("isDefault") && phone.isDefault) {
            await Phone.update(
              { isDefault: false },
              {
                where: {
                  userId: phone.userId,
                  phoneType: phone.phoneType,
                  isDefault: true,
                  id: { [Op.ne]: phone.id }, // Exclude the current phone
                },
              }
            );
          }
        },
      },
    }
  );

  return Phone;
};

export const initPhoneAssociations = () => {
  // Define association with User model
  Phone.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(Phone, { foreignKey: "userId", as: "phones" });
};

export default Phone;
