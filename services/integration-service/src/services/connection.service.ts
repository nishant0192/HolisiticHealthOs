// src/services/connection.service.ts
import { ConnectionModel, Connection, CreateConnectionParams, Provider, UpdateConnectionParams } from '../models/connection.model';
import { ApiError } from '../middlewares/error.middleware';
import { logger } from '../middlewares/logging.middleware';
// import * as appleHealth from '../adapters/apple-health';
// import * as googleFit from '../adapters/google-fit';
// import * as fitbit from '../adapters/fitbit';
// import * as garmin from '../adapters/garmin';
import * as oauth from '../utils/oauth';

export class ConnectionService {
    private connectionModel: ConnectionModel;

    constructor() {
        this.connectionModel = new ConnectionModel();
    }

    /**
     * Get connection by ID
     */
    async getConnectionById(id: string): Promise<Connection> {
        try {
            const connection = await this.connectionModel.findById(id);

            if (!connection) {
                throw new ApiError('Connection not found', 404);
            }

            return connection;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            logger.error('Error in ConnectionService.getConnectionById:', error);
            throw new ApiError('Failed to get connection', 500);
        }
    }

    /**
     * Get connection by user ID and provider
     */
    async getConnectionByUserAndProvider(userId: string, provider: Provider): Promise<Connection | null> {
        try {
            return await this.connectionModel.findByUserAndProvider(userId, provider);
        } catch (error) {
            logger.error('Error in ConnectionService.getConnectionByUserAndProvider:', error);
            throw new ApiError('Failed to get connection', 500);
        }
    }

    /**
     * Get all active connections for a user
     */
    async getActiveConnectionsByUser(userId: string): Promise<Connection[]> {
        try {
            return await this.connectionModel.findActiveByUser(userId);
        } catch (error) {
            logger.error('Error in ConnectionService.getActiveConnectionsByUser:', error);
            throw new ApiError('Failed to get connections', 500);
        }
    }

    /**
     * Create connection with OAuth code
     */
    async createConnectionWithCode(
        userId: string,
        provider: Provider,
        code: string
    ): Promise<Connection> {
        try {
            let tokenData;

            // Get access token from provider
            switch (provider) {
                case 'apple_health':
                    // Apple Health is handled differently since it doesn't use OAuth
                    throw new ApiError('Apple Health connections must be created via the mobile app', 400);

                case 'google_fit':
                    tokenData = await oauth.exchangeCodeForToken(provider, code);
                    break;

                case 'fitbit':
                    tokenData = await oauth.exchangeCodeForToken(provider, code);
                    break;

                case 'garmin':
                    tokenData = await oauth.exchangeCodeForToken(provider, code);
                    break;

                default:
                    throw new ApiError(`Unsupported provider: ${provider}`, 400);
            }

            // Calculate token expiry time
            const tokenExpiresAt = new Date();
            tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + tokenData.expires_in);

            // Create connection in database
            const connectionParams: CreateConnectionParams = {
                user_id: userId,
                provider,
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                token_expires_at: tokenExpiresAt,
                scopes: tokenData.scope ? tokenData.scope.split(' ') : []
            };

            const connection = await this.connectionModel.create(connectionParams);

            return connection;
        } catch (error) {
            logger.error('Error in ConnectionService.createConnectionWithCode:', error);

            if (error instanceof ApiError) {
                throw error;
            }

            throw new ApiError('Failed to create connection', 500);
        }
    }

    /**
     * Create direct connection (for Apple Health)
     */
    async createDirectConnection(
        userId: string,
        provider: Provider,
        accessToken: string,
        refreshToken?: string,
        expiresIn?: number
    ): Promise<Connection> {
        try {
            // For Apple Health, the tokens come directly from the mobile app
            if (provider !== 'apple_health') {
                throw new ApiError('Direct connections are only supported for Apple Health', 400);
            }

            // Calculate token expiry time if provided
            let tokenExpiresAt = null;
            if (expiresIn) {
                tokenExpiresAt = new Date();
                tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + expiresIn);
            }

            // Create connection in database
            const connectionParams: CreateConnectionParams = {
                user_id: userId,
                provider,
                access_token: accessToken,
                refresh_token: refreshToken,
                token_expires_at: tokenExpiresAt || undefined
            };

            const connection = await this.connectionModel.create(connectionParams);

            return connection;
        } catch (error) {
            logger.error('Error in ConnectionService.createDirectConnection:', error);

            if (error instanceof ApiError) {
                throw error;
            }

            throw new ApiError('Failed to create connection', 500);
        }
    }

    /**
     * Refresh token for a connection
     */
    async refreshConnectionToken(id: string): Promise<Connection> {
        try {
            const connection = await this.connectionModel.findById(id);

            if (!connection) {
                throw new ApiError('Connection not found', 404);
            }

            if (!connection.refresh_token) {
                throw new ApiError('Connection does not have a refresh token', 400);
            }

            let tokenData;

            // Refresh token with provider
            switch (connection.provider) {
                case 'apple_health':
                    // Apple Health tokens are handled by the mobile app
                    throw new ApiError('Apple Health tokens must be refreshed via the mobile app', 400);

                case 'google_fit':
                    tokenData = await oauth.refreshAccessToken(connection.provider, connection.refresh_token);
                    break;

                case 'fitbit':
                    tokenData = await oauth.refreshAccessToken(connection.provider, connection.refresh_token);
                    break;

                case 'garmin':
                    tokenData = await oauth.refreshAccessToken(connection.provider, connection.refresh_token);
                    break;

                default:
                    throw new ApiError(`Unsupported provider: ${connection.provider}`, 400);
            }

            // Calculate token expiry time
            const tokenExpiresAt = new Date();
            tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + tokenData.expires_in);

            // Update connection in database
            const updateParams: UpdateConnectionParams = {
                access_token: tokenData.access_token,
                token_expires_at: tokenExpiresAt,
                status: 'active'
            };

            // Some providers return a new refresh token
            if (tokenData.refresh_token) {
                updateParams.refresh_token = tokenData.refresh_token;
            }

            const updatedConnection = await this.connectionModel.update(id, updateParams);

            return updatedConnection;
        } catch (error) {
            logger.error('Error in ConnectionService.refreshConnectionToken:', error);

            if (error instanceof ApiError) {
                throw error;
            }

            throw new ApiError('Failed to refresh connection token', 500);
        }
    }

    /**
     * Update connection status
     */
    async updateConnectionStatus(id: string, status: 'active' | 'expired' | 'revoked'): Promise<Connection> {
        try {
            const connection = await this.connectionModel.findById(id);

            if (!connection) {
                throw new ApiError('Connection not found', 404);
            }

            const updatedConnection = await this.connectionModel.update(id, { status });

            return updatedConnection;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            logger.error('Error in ConnectionService.updateConnectionStatus:', error);
            throw new ApiError('Failed to update connection status', 500);
        }
    }

    /**
     * Delete connection
     */
    async deleteConnection(id: string): Promise<boolean> {
        try {
            const connection = await this.connectionModel.findById(id);

            if (!connection) {
                throw new ApiError('Connection not found', 404);
            }

            // TODO: Handle revoking access with the provider if needed

            const deleted = await this.connectionModel.delete(id);

            return deleted;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            logger.error('Error in ConnectionService.deleteConnection:', error);
            throw new ApiError('Failed to delete connection', 500);
        }
    }

    /**
     * Update last synced timestamp
     */
    async updateLastSynced(id: string): Promise<Connection> {
        try {
            const connection = await this.connectionModel.findById(id);

            if (!connection) {
                throw new ApiError('Connection not found', 404);
            }

            const updatedConnection = await this.connectionModel.updateLastSynced(id);

            return updatedConnection;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            logger.error('Error in ConnectionService.updateLastSynced:', error);
            throw new ApiError('Failed to update last synced timestamp', 500);
        }
    }
}
