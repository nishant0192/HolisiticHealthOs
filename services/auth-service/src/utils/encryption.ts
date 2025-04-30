import bcrypt from 'bcryptjs';
import { authConfig } from '../config';

export const encryptPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, authConfig.saltRounds);
};

export const comparePasswords = (plainPassword: string, hashedPassword: string): boolean => {
  return bcrypt.compareSync(plainPassword, hashedPassword);
};