import { Request, Response, NextFunction } from 'express';
import { appConfig } from '../config';
import { logger } from './logging.middleware';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// For 404 errors
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const err = new ApiError(`Not Found - ${req.originalUrl}`, 404);
  next(err);
};

// Global error handler
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Response object
  const errorResponse = {
    status: 'error',
    message,
  };

  // Add stack trace in development
  if (appConfig.env === 'development') {
    (errorResponse as any).stack = err.stack;
    (errorResponse as any).isOperational = err.isOperational || false;
  }

  res.status(statusCode).json(errorResponse);
};

// Unhandled rejection handler
export const setupUnhandledRejectionHandler = () => {
  process.on('unhandledRejection', (reason: Error) => {
    logger.error('Unhandled Rejection:', reason);
    
    // For operational errors we can just log them
    if (reason instanceof ApiError && reason.isOperational) {
      logger.error('Operational error:', reason);
    } else {
      // For programming or unknown errors, terminate
      logger.error('Shutting down due to unhandled promise rejection');
      process.exit(1);
    }
  });
};

// Uncaught exception handler
export const setupUncaughtExceptionHandler = () => {
  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught Exception:', err);
    logger.error('Shutting down');
    process.exit(1);
  });
};