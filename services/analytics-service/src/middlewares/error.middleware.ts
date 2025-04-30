import { Request, Response, NextFunction, Application, RequestHandler } from 'express';
import { logger } from '@shared/logger';
import { ApiError } from '@shared/common';

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new ApiError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Global error handler for all routes
 */
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log all errors
  if (status >= 500) {
    logger.error(`Error: ${message}`, {
      stack: err.stack,
      status
    });
  } else {
    logger.warn(`Error: ${message}`, {
      status
    });
  }

  // Create error response
  const errorResponse: any = {
    success: false,
    message,
    status
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.stack = err.stack;
  }

  res.status(status).json(errorResponse);
};

/**
 * Configure express error handlers
 */
export const setupErrorHandlers = (app: Application): void => {
  // Add global error handler
  app.use(errorHandler);
};

/**
 * Async error handler wrapper to catch errors in async routes
 * This properly types the function to match Express's RequestHandler
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};