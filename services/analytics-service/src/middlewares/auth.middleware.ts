import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { appConfig } from '../config';
import { ApiError } from '@shared/common';
import { logger } from '@shared/logger';

// Extend the Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Middleware to verify JWT token
 */
export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  // Skip authentication for specific routes
  const skipAuthPaths = ['/health', '/metrics'];
  if (skipAuthPaths.some(path => req.path.includes(path))) {
    return next();
  }

  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, appConfig.auth.jwtSecret);
    
    // Attach user to request
    req.user = decoded;
    
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      next(new ApiError('Invalid token', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError('Token expired', 401));
    } else {
      logger.error('Auth middleware error:', { error });
      next(error);
    }
  }
};

/**
 * Middleware to check if user has required roles
 */
export const checkRole = (roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError('Access denied. User not authenticated.', 401));
      return;
    }

    const userRoles = req.user.roles || [];
    
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    if (!hasRequiredRole) {
      next(new ApiError('Access denied. Insufficient permissions.', 403));
      return;
    }

    next();
  };
};