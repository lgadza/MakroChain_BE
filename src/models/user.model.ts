import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import bcrypt from "bcrypt";
import config from "../config/index.js";
import { Roles } from "../constants/roles.js";

interface UserAttributes {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: string;
  lastLogin: Date | null;
  refreshToken: string | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | "id"
    | "isActive"
    | "role"
    | "lastLogin"
    | "refreshToken"
    | "passwordResetToken"
    | "passwordResetExpires"
    | "createdAt"
    | "updatedAt"
  > {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public username!: string;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public isActive!: boolean;
  public role!: string;
  public lastLogin!: Date | null;
  public refreshToken!: string | null;
  public passwordResetToken!: string | null;
  public passwordResetExpires!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Add comparePassword method that's used in auth service
  public async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // Keeping this for backward compatibility
  public async validPassword(password: string): Promise<boolean> {
    return this.comparePassword(password);
  }
}

export const initUser = (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  User.init(
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: dataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      email: {
        type: dataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: dataTypes.STRING(255),
        allowNull: false,
      },
      firstName: {
        type: dataTypes.STRING(50),
        allowNull: false,
      },
      lastName: {
        type: dataTypes.STRING(50),
        allowNull: false,
      },
      isActive: {
        type: dataTypes.BOOLEAN,
        defaultValue: true,
      },
      role: {
        type: dataTypes.STRING(20),
        defaultValue: Roles.USER,
        validate: {
          isIn: [Object.values(Roles)],
        },
      },
      lastLogin: {
        type: dataTypes.DATE,
        allowNull: true,
      },
      refreshToken: {
        type: dataTypes.STRING,
        allowNull: true,
      },
      passwordResetToken: {
        type: dataTypes.STRING,
        allowNull: true,
      },
      passwordResetExpires: {
        type: dataTypes.DATE,
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
      modelName: "User",
      tableName: "users",
      hooks: {
        beforeCreate: async (user: User) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user: User) => {
          if (user.changed("password")) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    }
  );

  return User;
};

export default User;
