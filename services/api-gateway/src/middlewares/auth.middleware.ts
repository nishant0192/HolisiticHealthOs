import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { appConfig } from '../config';
import { asyncHandler } from '../utils/async-handler';

// Extend the Express Request interface to include user property
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

/**
 * Middleware to validate JWT token by forwarding to auth service
 */
export const validateToken = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required. Please provide a valid token.'
            });
            return; // Ends function execution without returning a Response
        }

        try {
            const response = await axios.get(
                `${appConfig.serviceUrls.auth}/auth/validate-token`,
                {
                    headers: { Authorization: authHeader },
                    timeout: appConfig.timeouts.auth
                }
            );

            // Attach user data to the request
            req.user = response.data.data.user;
            next();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    res.status(error.response.status).json(error.response.data);
                    return;
                } else if (error.code === 'ECONNABORTED') {
                    res.status(503).json({
                        status: 'error',
                        message: 'Authentication service is unavailable. Please try again later.'
                    });
                    return;
                }
            }
            res.status(500).json({
                status: 'error',
                message: 'Authentication failed due to an unexpected error.'
            });
            return;
        }
    }
);

/**
 * Middleware to check if user has required roles
 */
export const hasRoles = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                status: 'error',
                message: 'Authentication required'
            });
            return;
        }

        const userRoles = req.user.roles || [];
        const hasRequiredRole = roles.some(role => userRoles.includes(role));

        if (!hasRequiredRole) {
            res.status(403).json({
                status: 'error',
                message: 'You do not have permission to access this resource'
            });
            return;
        }

        next();
    };
};
