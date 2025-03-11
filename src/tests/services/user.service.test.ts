import {
  jest,
  expect,
  describe,
  it,
  beforeEach,
} from "../../tests/test-utils.js";
import { UserService } from "../../services/user.service.js";
import User from "../../models/user.model.js";
import { Op } from "sequelize";

// Mock the User model and other dependencies
jest.mock("../../models/user.model.js");
jest.mock("../../utils/logger.js", () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

describe("UserService", () => {
  let userService: UserService;
  const mockUserData: any = {
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
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe("getAllUsers", () => {
    it("should return paginated users and metadata", async () => {
      const mockCount = 25;
      const mockRows = [mockUserData, { ...mockUserData, id: "456" }];

      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        count: mockCount,
        rows: mockRows,
      });

      const page = 2;
      const limit = 10;
      const result = await userService.getAllUsers(page, limit);

      expect(User.findAndCountAll).toHaveBeenCalledWith({
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
      (User.findAndCountAll as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(userService.getAllUsers()).rejects.toThrow(
        "Failed to fetch users from database"
      );
    });
  });

  describe("getUserById", () => {
    it("should return a user when valid ID is provided", async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(mockUserData);

      const result = await userService.getUserById("123");

      expect(User.findByPk).toHaveBeenCalledWith("123", {
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
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(userService.getUserById("nonexistentId")).rejects.toThrow(
        "User not found"
      );
    });
  });

  describe("updateUser", () => {
    it("should update and return user when valid data is provided", async () => {
      const mockUser = {
        id: "123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        update: jest.fn().mockImplementation(function (this: any, data: any) {
          Object.assign(this, data);
          return Promise.resolve();
        }),
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const updateData = { firstName: "Jane", lastName: "Smith" };
      const result = await userService.updateUser("123", updateData);

      expect(User.findByPk).toHaveBeenCalledWith("123");
      expect(mockUser.update).toHaveBeenCalledWith(updateData);

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
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(userService.updateUser("nonexistentId", {})).rejects.toThrow(
        "User not found"
      );
    });

    it("should throw an error when invalid role is provided", async () => {
      const mockUser = {
        id: "123",
        update: jest.fn(),
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        userService.updateUser("123", { role: "INVALID_ROLE" })
      ).rejects.toThrow("Invalid role");

      expect(mockUser.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteUser", () => {
    it("should delete a user when valid ID is provided", async () => {
      const mockUser = {
        id: "123",
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await userService.deleteUser("123");

      expect(User.findByPk).toHaveBeenCalledWith("123");
      expect(mockUser.destroy).toHaveBeenCalled();
    });

    it("should throw an error when user is not found", async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(userService.deleteUser("nonexistentId")).rejects.toThrow(
        "User not found"
      );
    });

    it("should throw an error when deletion fails", async () => {
      const mockUser = {
        id: "123",
        destroy: jest.fn().mockRejectedValue(new Error("Database error")),
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await expect(userService.deleteUser("123")).rejects.toThrow(
        "Failed to delete user"
      );
    });
  });

  describe("deactivateUser", () => {
    it("should set isActive to false", async () => {
      const mockUser = {
        id: "123",
        update: jest.fn().mockResolvedValue(undefined),
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await userService.deactivateUser("123");

      expect(User.findByPk).toHaveBeenCalledWith("123");
      expect(mockUser.update).toHaveBeenCalledWith({ isActive: false });
    });

    it("should throw an error when user is not found", async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(userService.deactivateUser("nonexistentId")).rejects.toThrow(
        "User not found"
      );
    });
  });

  describe("activateUser", () => {
    it("should set isActive to true", async () => {
      const mockUser = {
        id: "123",
        update: jest.fn().mockResolvedValue(undefined),
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await userService.activateUser("123");

      expect(User.findByPk).toHaveBeenCalledWith("123");
      expect(mockUser.update).toHaveBeenCalledWith({ isActive: true });
    });

    it("should throw an error when user is not found", async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(userService.activateUser("nonexistentId")).rejects.toThrow(
        "User not found"
      );
    });
  });

  describe("changePassword", () => {
    it("should update password when current password is correct", async () => {
      const mockUser = {
        id: "123",
        comparePassword: jest.fn().mockResolvedValue(true),
        update: jest.fn().mockResolvedValue(undefined),
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await userService.changePassword("123", "currentPass", "newPass");

      expect(User.findByPk).toHaveBeenCalledWith("123");
      expect(mockUser.comparePassword).toHaveBeenCalledWith("currentPass");
      expect(mockUser.update).toHaveBeenCalledWith({ password: "newPass" });
    });

    it("should throw an error when user is not found", async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        userService.changePassword("nonexistentId", "currentPass", "newPass")
      ).rejects.toThrow("User not found");
    });

    it("should throw an error when current password is incorrect", async () => {
      const mockUser = {
        id: "123",
        comparePassword: jest.fn().mockResolvedValue(false),
        update: jest.fn(),
      };

      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        userService.changePassword("123", "wrongPass", "newPass")
      ).rejects.toThrow("Current password is incorrect");

      expect(mockUser.update).not.toHaveBeenCalled();
    });
  });

  describe("searchUsers", () => {
    it("should return users matching the search query", async () => {
      const mockCount = 2;
      const mockRows = [mockUserData, { ...mockUserData, id: "456" }];

      (User.findAndCountAll as jest.Mock).mockResolvedValue({
        count: mockCount,
        rows: mockRows,
      });

      const result = await userService.searchUsers("John", 1, 10);

      expect(User.findAndCountAll).toHaveBeenCalledWith({
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
      (User.findAndCountAll as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(userService.searchUsers("John")).rejects.toThrow(
        "Failed to search users"
      );
    });
  });
});
