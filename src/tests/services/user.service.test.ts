import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { Op } from "sequelize";

// Define interfaces to ensure type safety
interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Define the type of our mock model with all needed methods
interface MockUserModel {
  findByPk: jest.Mock;
  findAndCountAll: jest.Mock;
}

// Create mock functions before using them in the jest.mock call
const mockUserFunctions = {
  findByPk: jest.fn(),
  findAndCountAll: jest.fn(),
};

// Mock dependencies before importing service - using pre-defined mock functions
jest.mock("../../models/user.model.js", () => mockUserFunctions);

jest.mock("../../utils/logger.js", () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

// Now import the service and other dependencies
import { UserService } from "../../services/user.service.js";

// Get references to the mock functions
const mockUserModel = mockUserFunctions as MockUserModel;
const findByPkMock = mockUserModel.findByPk;
const findAndCountAllMock = mockUserModel.findAndCountAll;

interface PaginatedResult<T> {
  count: number;
  rows: T[];
}

interface UserServiceMethods {
  getAllUsers(
    page?: number,
    limit?: number
  ): Promise<{
    users: UserData[];
    total: number;
    pages: number;
  }>;
  getUserById(id: string): Promise<UserData>;
  updateUser(id: string, data: Partial<UserData>): Promise<UserData>;
  deleteUser(id: string): Promise<void>;
  deactivateUser(id: string): Promise<void>;
  activateUser(id: string): Promise<void>;
  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void>;
  searchUsers(
    query: string,
    page?: number,
    limit?: number
  ): Promise<{
    users: UserData[];
    total: number;
    pages: number;
  }>;
}

describe("UserService", () => {
  let userService: UserService & UserServiceMethods;
  const mockUserData: UserData = {
    id: "123",
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "USER",
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    userService = new UserService() as UserService & UserServiceMethods;
    jest.clearAllMocks();
  });

  describe("getAllUsers", () => {
    it("should return paginated users and metadata", async () => {
      const mockCount = 25;
      const mockRows = [mockUserData, { ...mockUserData, id: "456" }];

      const mockResult = {
        count: mockCount,
        rows: mockRows,
      };

      findAndCountAllMock.mockResolvedValue(mockResult);

      const page = 2;
      const limit = 10;
      const result = await userService.getAllUsers(page, limit);

      expect(findAndCountAllMock).toHaveBeenCalledWith({
        attributes: [
          "id",
          "email",
          "firstName",
          "lastName",
          "role",
          "isActive",
          "lastLogin",
          "createdAt",
          "updatedAt",
        ],
        offset: 10, // (page - 1) * limit = (2 - 1) * 10 = 10
        limit: 10,
      });

      expect(result).toEqual({
        users: mockRows,
        total: mockCount,
        pages: 3, // Math.ceil(25 / 10) = 3
      });
    });

    it("should throw an error when database query fails", async () => {
      findAndCountAllMock.mockImplementation(() => {
        throw new Error("Database error");
      });

      await expect(userService.getAllUsers()).rejects.toThrow(
        "Failed to fetch users from database"
      );
    });
  });

  describe("getUserById", () => {
    it("should return a user when valid ID is provided", async () => {
      findByPkMock.mockResolvedValue(mockUserData);

      const result = await userService.getUserById("123");

      expect(findByPkMock).toHaveBeenCalledWith("123", {
        attributes: [
          "id",
          "email",
          "firstName",
          "lastName",
          "role",
          "isActive",
          "lastLogin",
          "createdAt",
          "updatedAt",
        ],
      });
      expect(result).toEqual(mockUserData);
    });

    it("should throw an error when user is not found", async () => {
      findByPkMock.mockResolvedValue(null);

      await expect(userService.getUserById("nonexistentId")).rejects.toThrow(
        "User not found"
      );
    });
  });

  describe("updateUser", () => {
    it("should update and return user when valid data is provided", async () => {
      const updateMock = jest
        .fn()
        .mockImplementation(function (this: UserData & { update: any }, data) {
          Object.assign(this, data);
          return Promise.resolve(this);
        });

      const mockUser = {
        ...mockUserData,
        update: updateMock,
      };

      findByPkMock.mockResolvedValue(mockUser);

      const updateData = { firstName: "Jane", lastName: "Smith" };
      const result = await userService.updateUser("123", updateData);

      expect(findByPkMock).toHaveBeenCalledWith("123");
      expect(updateMock).toHaveBeenCalledWith(updateData);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        isActive: mockUser.isActive,
        lastLogin: mockUser.lastLogin,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it("should throw an error when user is not found", async () => {
      findByPkMock.mockResolvedValue(null);

      await expect(userService.updateUser("nonexistentId", {})).rejects.toThrow(
        "User not found"
      );
    });

    it("should throw an error when invalid role is provided", async () => {
      const updateMock = jest.fn();

      const mockUser = {
        id: "123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
        isActive: true,
        lastLogin: null as Date | null,
        createdAt: new Date(),
        updatedAt: new Date(),
        update: updateMock,
      };

      findByPkMock.mockResolvedValue(mockUser);

      await expect(
        userService.updateUser("123", { role: "INVALID_ROLE" })
      ).rejects.toThrow("Invalid role");

      expect(updateMock).not.toHaveBeenCalled();
    });
  });

  describe("deleteUser", () => {
    it("should delete a user when valid ID is provided", async () => {
      const destroyMock = jest.fn().mockResolvedValue(undefined);

      const mockUser = {
        id: "123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
        isActive: true,
        lastLogin: null as Date | null,
        createdAt: new Date(),
        updatedAt: new Date(),
        destroy: destroyMock,
      };

      findByPkMock.mockResolvedValue(mockUser);

      await userService.deleteUser("123");

      expect(findByPkMock).toHaveBeenCalledWith("123");
      expect(destroyMock).toHaveBeenCalled();
    });

    it("should throw an error when user is not found", async () => {
      findByPkMock.mockResolvedValue(null);

      await expect(userService.deleteUser("nonexistentId")).rejects.toThrow(
        "User not found"
      );
    });

    it("should throw an error when deletion fails", async () => {
      const destroyMock = jest.fn().mockImplementation(() => {
        throw new Error("Database error");
      });

      const mockUser = {
        id: "123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
        isActive: true,
        lastLogin: null as Date | null,
        createdAt: new Date(),
        updatedAt: new Date(),
        destroy: destroyMock,
      };

      findByPkMock.mockResolvedValue(mockUser);

      await expect(userService.deleteUser("123")).rejects.toThrow(
        "Failed to delete user"
      );
    });
  });

  describe("deactivateUser", () => {
    it("should set isActive to false", async () => {
      const updateMock = jest.fn().mockResolvedValue(undefined);

      const mockUser = {
        id: "123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
        isActive: true,
        lastLogin: null as Date | null,
        createdAt: new Date(),
        updatedAt: new Date(),
        update: updateMock,
      };

      findByPkMock.mockResolvedValue(mockUser);

      await userService.deactivateUser("123");

      expect(findByPkMock).toHaveBeenCalledWith("123");
      expect(updateMock).toHaveBeenCalledWith({ isActive: false });
    });

    it("should throw an error when user is not found", async () => {
      findByPkMock.mockResolvedValue(null);

      await expect(userService.deactivateUser("nonexistentId")).rejects.toThrow(
        "User not found"
      );
    });
  });

  describe("activateUser", () => {
    it("should set isActive to true", async () => {
      const updateMock = jest.fn().mockResolvedValue(undefined);

      const mockUser = {
        id: "123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
        isActive: true,
        lastLogin: null as Date | null,
        createdAt: new Date(),
        updatedAt: new Date(),
        update: updateMock,
      };

      findByPkMock.mockResolvedValue(mockUser);

      await userService.activateUser("123");

      expect(findByPkMock).toHaveBeenCalledWith("123");
      expect(updateMock).toHaveBeenCalledWith({ isActive: true });
    });

    it("should throw an error when user is not found", async () => {
      findByPkMock.mockResolvedValue(null);

      await expect(userService.activateUser("nonexistentId")).rejects.toThrow(
        "User not found"
      );
    });
  });

  describe("changePassword", () => {
    it("should update password when current password is correct", async () => {
      const updateMock = jest.fn().mockResolvedValue(undefined);
      const comparePasswordMock = jest.fn().mockResolvedValue(true);

      const mockUser = {
        id: "123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
        isActive: true,
        lastLogin: null as Date | null,
        createdAt: new Date(),
        updatedAt: new Date(),
        comparePassword: comparePasswordMock,
        update: updateMock,
      };

      findByPkMock.mockResolvedValue(mockUser);

      await userService.changePassword("123", "currentPass", "newPass");

      expect(findByPkMock).toHaveBeenCalledWith("123");
      expect(comparePasswordMock).toHaveBeenCalledWith("currentPass");
      expect(updateMock).toHaveBeenCalledWith({ password: "newPass" });
    });

    it("should throw an error when user is not found", async () => {
      findByPkMock.mockResolvedValue(null);

      await expect(
        userService.changePassword("nonexistentId", "currentPass", "newPass")
      ).rejects.toThrow("User not found");
    });

    it("should throw an error when current password is incorrect", async () => {
      const updateMock = jest.fn();
      const comparePasswordMock = jest.fn().mockResolvedValue(false);

      const mockUser = {
        id: "123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
        isActive: true,
        lastLogin: null as Date | null,
        createdAt: new Date(),
        updatedAt: new Date(),
        comparePassword: comparePasswordMock,
        update: updateMock,
      };

      findByPkMock.mockResolvedValue(mockUser);

      await expect(
        userService.changePassword("123", "wrongPass", "newPass")
      ).rejects.toThrow("Current password is incorrect");

      expect(updateMock).not.toHaveBeenCalled();
    });
  });

  describe("searchUsers", () => {
    it("should return users matching the search query", async () => {
      const mockCount = 2;
      const mockRows = [mockUserData, { ...mockUserData, id: "456" }];

      const mockResult = {
        count: mockCount,
        rows: mockRows,
      };

      findAndCountAllMock.mockResolvedValue(mockResult);

      const result = await userService.searchUsers("John", 1, 10);

      expect(findAndCountAllMock).toHaveBeenCalledWith({
        attributes: [
          "id",
          "email",
          "firstName",
          "lastName",
          "role",
          "isActive",
          "lastLogin",
          "createdAt",
          "updatedAt",
        ],
        where: {
          [Op.or]: [
            { firstName: { [Op.iLike]: "%John%" } },
            { lastName: { [Op.iLike]: "%John%" } },
            { email: { [Op.iLike]: "%John%" } },
          ],
        },
        offset: 0,
        limit: 10,
      });

      expect(result).toEqual({
        users: mockRows,
        total: mockCount,
        pages: 1, // Math.ceil(2 / 10) = 1
      });
    });

    it("should throw an error when search fails", async () => {
      findAndCountAllMock.mockImplementation(() => {
        throw new Error("Database error");
      });

      await expect(userService.searchUsers("John")).rejects.toThrow(
        "Failed to search users"
      );
    });
  });
});
