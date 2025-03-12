import User from "../models/user.model.js";

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return User.findByPk(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    // Ensure username is provided, use email as default if not
    const username = userData.username || userData.email;
    return User.create({ ...userData, username } as any);
  }

  async update(id: string, userData: Partial<User>): Promise<[number, User[]]> {
    const [affectedCount, affectedRows] = await User.update(userData, {
      where: { id },
      returning: true,
    });
    return [affectedCount, affectedRows];
  }

  async delete(id: string): Promise<number> {
    return User.destroy({ where: { id } });
  }
}

export default new UserRepository();
