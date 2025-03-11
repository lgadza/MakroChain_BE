import { Model, DataTypes, Sequelize, Optional } from "sequelize";
import bcrypt from "bcrypt";
// Change this import to use relative path
import config from "../config/index.js";

// Define User attributes
interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  role: string;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define optional attributes for creating a new User
interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "isActive" | "role"> {}

// User model class
class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public isActive!: boolean;
  public role!: string;
  public lastLogin!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Method to validate password
  public async validPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

// Initialize User model with Sequelize
export const initUser = (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  User.init(
    {
      id: {
        type: dataTypes.INTEGER,
        autoIncrement: true,
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
        allowNull: true,
      },
      lastName: {
        type: dataTypes.STRING(50),
        allowNull: true,
      },
      isActive: {
        type: dataTypes.BOOLEAN,
        defaultValue: true,
      },
      role: {
        type: dataTypes.STRING(20),
        defaultValue: "user",
      },
      lastLogin: {
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

  // Add any associations here
  //   User.associate = (models: any) => {
  //     // Example: User.hasMany(models.Post)
  //   };

  return User;
};

export default User;
