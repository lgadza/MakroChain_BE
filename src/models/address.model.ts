import { Model, DataTypes, Sequelize, Optional, Op } from "sequelize";
import User from "./user.model.js";

export interface AddressAttributes {
  id: string;
  userId: string;
  addressType: string; // e.g., 'HOME', 'WORK', 'SHIPPING', 'BILLING'
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressCreationAttributes
  extends Optional<
    AddressAttributes,
    | "id"
    | "street2"
    | "isDefault"
    | "latitude"
    | "longitude"
    | "createdAt"
    | "updatedAt"
  > {}

class Address
  extends Model<AddressAttributes, AddressCreationAttributes>
  implements AddressAttributes
{
  public id!: string;
  public userId!: string;
  public addressType!: string;
  public street1!: string;
  public street2!: string;
  public city!: string;
  public state!: string;
  public postalCode!: string;
  public country!: string;
  public isDefault!: boolean;
  public latitude!: number;
  public longitude!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initAddress = (sequelize: Sequelize) => {
  Address.init(
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
      addressType: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [["HOME", "WORK", "SHIPPING", "BILLING"]],
        },
      },
      street1: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      street2: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      postalCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
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
      modelName: "Address",
      tableName: "addresses",
      hooks: {
        beforeCreate: async (address: Address) => {
          // If this address is marked as default, unset any other default addresses for this user
          if (address.isDefault) {
            await Address.update(
              { isDefault: false },
              {
                where: {
                  userId: address.userId,
                  addressType: address.addressType,
                  isDefault: true,
                },
              }
            );
          }
        },
        beforeUpdate: async (address: Address) => {
          // If this address is being updated to be the default, unset any other default addresses
          if (address.changed("isDefault") && address.isDefault) {
            await Address.update(
              { isDefault: false },
              {
                where: {
                  userId: address.userId,
                  addressType: address.addressType,
                  isDefault: true,
                  id: { [Op.ne]: address.id }, // Exclude the current address
                },
              }
            );
          }
        },
      },
    }
  );

  return Address;
};

export const initAddressAssociations = () => {
  // Define association with User model
  Address.belongsTo(User, { foreignKey: "userId", as: "user" });
  User.hasMany(Address, { foreignKey: "userId", as: "addresses" });
};

export default Address;
