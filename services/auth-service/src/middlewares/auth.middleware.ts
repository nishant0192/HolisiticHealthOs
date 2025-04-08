import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';
import { UserModel } from '../models/user.model';
import { AppError } from './error.middleware';

// Extend the Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const tokenService = new TokenService();
const userModel = new UserModel();

export const authenticateJwt = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AppError('No authorization token provided', 401);
    }
    
    // Check if the header format is correct
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError('Invalid authorization format. Format is: Bearer [token]', 401);
    }
    
    const token = parts[1];
    
    // Verify the token
    const payload = tokenService.verifyAccessToken(token);
    
    if (!payload) {
      throw new AppError('Invalid or expired token', 401);
    }
    
    // Find the user
    const user = await userModel.findById(payload.userId);
    
    if (!user) {
      throw new AppError('User not found', 401);
    }
    
    if (!user.is_active) {
      throw new AppError('User account is disabled', 403);
    }
    
    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      roles: user.roles
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authorization required', 401));
    }
    
    const hasRole = req.user.roles.some((role: string) => roles.includes(role));
    
    if (!hasRole) {
      return next(new AppError('Insufficient permissions', 403));
    }
    
    next();
  };
};