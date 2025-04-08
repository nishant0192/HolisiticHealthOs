// src/utils/jwt.ts
import jwt, { SignOptions } from 'jsonwebtoken';
import { authConfig } from '../config';

export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
}

export const generateToken = (
  payload: TokenPayload,
  secret: string = authConfig.jwtSecret,
  expiresIn: string = authConfig.jwtExpiresIn
): string => {
  const options: SignOptions = { expiresIn: expiresIn as unknown as number };
  return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string, secret: string = authConfig.jwtSecret): TokenPayload | null => {
  try {
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    return null;
  }
};