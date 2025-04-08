import { UserModel, User, CreateUserParams } from '../models/user.model';
import { compareSync } from 'bcrypt';
import { encryptPassword } from '../utils/encryption';

export class AuthService {
  private userModel: UserModel;

  constructor() {
    this.userModel = new UserModel();
  }

  async createUser(params: CreateUserParams): Promise<User> {
    const passwordHash = await encryptPassword(params.password);
    return this.userModel.create(params, passwordHash);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findByEmail(email);
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userModel.findByEmail(email);
    
    if (!user || !compareSync(password, user.password_hash)) {
      return null;
    }
    
    return user;
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.userModel.updateEmailVerification(userId, true);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await encryptPassword(newPassword);
    await this.userModel.updatePassword(userId, passwordHash);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userModel.updateLastLogin(userId);
  }
}