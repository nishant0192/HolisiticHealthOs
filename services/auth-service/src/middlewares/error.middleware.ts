import { Request, Response, NextFunction } from 'express';
import { appConfig } from '../config';

// Custom error class
export class AppError extends Error {
    isOperational: boolean;

    constructor(message: string, public statusCode: number, public errors?: Record<string, string>) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Handle 404 errors
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
    const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
    next(error);
};

// Global error handler
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Log error
    console.error('Error:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Send error response based on environment
    const response = {
        success: false,
        message,
        ...(appConfig.env === 'development' && {
            stack: err.stack,
            isOperational: err.isOperational || false
        })
    };

    // If this is a validation error, add validation details
    if (err.name === 'ValidationError' && err.errors) {
        Object.assign(response, { errors: err.errors });
    }

    res.status(statusCode).json(response);
};

// Unhandled rejection handler
export const setupUnhandledRejectionHandler = () => {
    process.on('unhandledRejection', (reason: Error) => {
        console.error('Unhandled Rejection:', reason);

        if (reason instanceof AppError && reason.isOperational) {
            // For operational errors, we can just log them
            console.error('Operational error:', reason);
        } else {
            // For programming or other unknown errors, we should terminate
            console.error('Shutting down due to unhandled promise rejection');
            process.exit(1);
        }
    });
};

// Uncaught exception handler
export const setupUncaughtExceptionHandler = () => {
    process.on('uncaughtException', (err: Error) => {
        console.error('Uncaught Exception:', err);
        console.error('Shutting down due to uncaught exception');
        process.exit(1);
    });
};