// src/controllers/connection.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ConnectionService } from '../services/connection.service';
import { Provider } from '../models/connection.model';
import { ApiError } from '../middlewares/error.middleware';
import { logger } from '../middlewares/logging.middleware';
import { asyncHandler } from '../utils/async-handler';

export class ConnectionController {
    private connectionService: ConnectionService;

    constructor() {
        this.connectionService = new ConnectionService();
    }

    /**
     * Get all active connections for a user
     */
    getActiveConnections = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const userId = req.user.id;

        const connections = await this.connectionService.getActiveConnectionsByUser(userId);

        return res.status(200).json({
            status: 'success',
            data: connections
        });
    });

    /**
     * Get connection by provider
     */
    getConnectionByProvider = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const userId = req.user.id;
        const provider = req.params.provider as Provider;

        // Validate provider
        if (!['apple_health', 'google_fit', 'fitbit', 'garmin'].includes(provider)) {
            throw new ApiError(`Invalid provider: ${provider}`, 400);
        }

        const connection = await this.connectionService.getConnectionByUserAndProvider(userId, provider);

        if (!connection) {
            throw new ApiError(`Connection not found for provider: ${provider}`, 404);
        }

        return res.status(200).json({
            status: 'success',
            data: connection
        });
    });

    /**
     * Create a new connection
     */
    createConnection = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const userId = req.user.id;
        const { provider, code, access_token, refresh_token } = req.body;

        let connection;

        // If access_token is provided, use direct connection (for Apple Health)
        if (access_token) {
            connection = await this.connectionService.createDirectConnection(
                userId,
                provider,
                access_token,
                refresh_token
            );
        } else if (code) {
            // Otherwise, use code to create connection (for OAuth providers)
            connection = await this.connectionService.createConnectionWithCode(
                userId,
                provider,
                code
            );
        } else {
            throw new ApiError('Either code or access_token must be provided', 400);
        }

        return res.status(201).json({
            status: 'success',
            message: 'Connection created successfully',
            data: connection
        });
    });

    /**
     * Delete a connection
     */
    deleteConnection = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const userId = req.user.id;
        const connectionId = req.params.id;

        // Verify the connection belongs to the user
        const connection = await this.connectionService.getConnectionById(connectionId);

        if (!connection) {
            throw new ApiError('Connection not found', 404);
        }

        if (connection.user_id !== userId) {
            throw new ApiError('Unauthorized', 403);
        }

        await this.connectionService.deleteConnection(connectionId);

        return res.status(200).json({
            status: 'success',
            message: 'Connection deleted successfully'
        });
    });

    /**
     * Get OAuth authorization URL
     */
    getAuthorizationUrl = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const provider = req.params.provider as Provider;

        // Apple Health doesn't use OAuth in the same way
        if (provider === 'apple_health') {
            throw new ApiError('Apple Health integration is handled through the mobile app', 400);
        }

        // Get authorization URL based on provider
        let authUrl: string;

        switch (provider) {
            case 'google_fit':
                authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.GOOGLE_FIT_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GOOGLE_FIT_REDIRECT_URI)}&scope=${encodeURIComponent('https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.sleep.read')}&response_type=code&access_type=offline&prompt=consent`;
                break;
            case 'fitbit':
                authUrl = `https://www.fitbit.com/oauth2/authorize?client_id=${process.env.FITBIT_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.FITBIT_REDIRECT_URI)}&scope=${encodeURIComponent('activity heartrate sleep nutrition')}&response_type=code`;
                break;
            case 'garmin':
                authUrl = `https://connect.garmin.com/oauthConfirm?client_id=${process.env.GARMIN_CONSUMER_KEY}&redirect_uri=${encodeURIComponent(process.env.GARMIN_REDIRECT_URI)}&response_type=code&scope=activity sleep nutrition`;
                break;
            default:
                throw new ApiError(`Unsupported provider: ${provider}`, 400);
        }

        return res.status(200).json({
            status: 'success',
            data: { authUrl }
        });
    });

    /**
     * Handle OAuth callback
     */
    handleOAuthCallback = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
        const provider = req.params.provider as Provider;
        const { code, state, error } = req.query;

        // Check for error in callback
        if (error) {
            logger.error(`OAuth error for provider ${provider}:`, error);
            return res.redirect(`${process.env.FRONTEND_URL}/connect?status=error&provider=${provider}&error=${error}`);
        }

        if (!code) {
            logger.error(`No code provided in OAuth callback for provider ${provider}`);
            return res.redirect(`${process.env.FRONTEND_URL}/connect?status=error&provider=${provider}&error=no_code`);
        }

        // In a real implementation, we would save the code temporarily
        // and let the frontend exchange it for a token

        return res.redirect(`${process.env.FRONTEND_URL}/connect?status=success&provider=${provider}&code=${code}`);
    });
}