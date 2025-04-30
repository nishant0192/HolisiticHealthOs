import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { appConfig } from '../config';
import { ApiError } from './error.middleware';

// Extend the Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

interface DecodedToken {
  userId: string;
  email: string;
  roles: string[];
}

export const authenticateJwt = (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Check if there's an authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Authentication required. Please provide a valid token.', 401);
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, appConfig.auth.jwtSecret) as DecodedToken;
      
      // Attach user data to request object
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        roles: decoded.roles
      };
      
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError('Token has expired. Please login again.', 401);
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError('Invalid token. Please login again.', 401);
      } else {
        throw new ApiError('Authentication failed.', 401);
      }
    }
  } catch (error) {
    next(error);
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError('Authentication required', 401));
    }
    
    const hasRole = req.user.roles.some((role: string) => roles.includes(role));
    
    if (!hasRole) {
      return next(new ApiError('Insufficient permissions', 403));
    }
    
    next();
  };
};