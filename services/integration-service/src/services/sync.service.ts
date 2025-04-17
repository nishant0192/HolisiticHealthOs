// src/services/sync.service.ts
import { ConnectionService } from './connection.service';
import { ActivityService } from './activity.service';
import { SleepService } from './sleep.service';
import { NutritionService } from './nutrition.service';
import { HealthDataModel } from '../models/health-data.model';
import { ActivityModel } from '../models/activity.model';
import { SleepModel } from '../models/sleep.model';
import { NutritionModel } from '../models/nutrition.model';
import { Provider } from '../models/connection.model';
import { ApiError } from '../middlewares/error.middleware';
import { logger } from '../middlewares/logging.middleware';
import { rateLimiter } from '../utils/rate-limiter';
import { tokenEncryption } from '../utils/token-encryption';
import * as appleHealth from '../adapters/apple-health';
import * as googleFit from '../adapters/google-fit';
import * as fitbit from '../adapters/fitbit';
import * as garmin from '../adapters/garmin';
// import * as samsungHealth from '../adapters/samsung-health';
// import * as withings from '../adapters/withings';

export class SyncService {
    private connectionService: ConnectionService;
    private activityService: ActivityService;
    private sleepService: SleepService;
    private nutritionService: NutritionService;
    private healthDataModel: HealthDataModel;
    private activityModel: ActivityModel;
    private sleepModel: SleepModel;
    private nutritionModel: NutritionModel;

    constructor() {
        this.connectionService = new ConnectionService();
        this.activityService = new ActivityService();
        this.sleepService = new SleepService();
        this.nutritionService = new NutritionService();
        this.healthDataModel = new HealthDataModel();
        this.activityModel = new ActivityModel();
        this.sleepModel = new SleepModel();
        this.nutritionModel = new NutritionModel();
    }

    /**
     * Sync data from a provider for a user
     */
    async syncData(
        userId: string,
        provider: Provider,
        startDate: Date = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)), // Default to last 30 days
        endDate: Date = new Date()
    ): Promise<{
        activitiesCount: number;
        sleepCount: number;
        nutritionCount: number;
        healthDataCount: number;
    }> {
        try {
            // Get connection for user and provider
            const connection = await this.connectionService.getConnectionByUserAndProvider(userId, provider);

            if (!connection) {
                throw new ApiError(`No connection found for provider: ${provider}`, 404);
            }

            if (connection.status !== 'active') {
                throw new ApiError(`Connection is not active: ${connection.status}`, 400);
            }

            // Decrypt access token
            const accessToken = tokenEncryption.decrypt(connection.access_token);
            let refreshToken = connection.refresh_token ? tokenEncryption.decrypt(connection.refresh_token) : null;

            // Check if token is expired
            if (connection.token_expires_at && new Date() > connection.token_expires_at) {
                // Try to refresh token
                try {
                    await this.connectionService.refreshConnectionToken(connection.id);

                    // Get updated connection with new token
                    const updatedConnection = await this.connectionService.getConnectionById(connection.id);

                    // Decrypt the new tokens
                    refreshToken = updatedConnection.refresh_token ?
                        tokenEncryption.decrypt(updatedConnection.refresh_token) : null;
                } catch (error) {
                    logger.error('Failed to refresh token during sync:', error);
                    throw new ApiError('Connection token has expired and could not be refreshed', 401);
                }
            }

            // Delete existing data from this provider for clean sync
            await this.activityModel.deleteByUserAndSource(userId, provider);
            await this.sleepModel.deleteByUserAndSource(userId, provider);
            await this.nutritionModel.deleteByUserAndSource(userId, provider);
            await this.healthDataModel.deleteByUserAndSource(userId, provider);

            // Fetch data from provider and sync to database
            let activitiesCount = 0;
            let sleepCount = 0;
            let nutritionCount = 0;
            let healthDataCount = 0;

            switch (provider) {
                case 'apple_health':
                    const appleHealthResult = await this.syncAppleHealthData(accessToken, userId, startDate, endDate);
                    activitiesCount = appleHealthResult.activitiesCount;
                    sleepCount = appleHealthResult.sleepCount;
                    nutritionCount = appleHealthResult.nutritionCount;
                    healthDataCount = appleHealthResult.healthDataCount;
                    break;

                case 'google_fit':
                    const googleFitResult = await this.syncGoogleFitData(accessToken, userId, startDate, endDate);
                    activitiesCount = googleFitResult.activitiesCount;
                    sleepCount = googleFitResult.sleepCount;
                    nutritionCount = googleFitResult.nutritionCount;
                    healthDataCount = googleFitResult.healthDataCount;
                    break;

                case 'fitbit':
                    const fitbitResult = await this.syncFitbitData(accessToken, userId, startDate, endDate);
                    activitiesCount = fitbitResult.activitiesCount;
                    sleepCount = fitbitResult.sleepCount;
                    nutritionCount = fitbitResult.nutritionCount;
                    healthDataCount = fitbitResult.healthDataCount;
                    break;

                case 'garmin':
                    // Garmin uses OAuth 1.0a so we need a token object
                    const garminToken = {
                        oauth_token: accessToken,
                        oauth_token_secret: refreshToken || '',
                        user_id: connection.metadata?.user_id || ''
                    };

                    const garminResult = await this.syncGarminData(garminToken, userId, startDate, endDate);
                    activitiesCount = garminResult.activitiesCount;
                    sleepCount = garminResult.sleepCount;
                    nutritionCount = garminResult.nutritionCount;
                    healthDataCount = garminResult.healthDataCount;
                    break;

                case 'samsung_health':
                    const samsungHealthResult = await this.syncSamsungHealthData(accessToken, userId, startDate, endDate);
                    activitiesCount = samsungHealthResult.activitiesCount;
                    sleepCount = samsungHealthResult.sleepCount;
                    nutritionCount = samsungHealthResult.nutritionCount;
                    healthDataCount = samsungHealthResult.healthDataCount;
                    break;

                case 'withings':
                    const withingsResult = await this.syncWithingsData(accessToken, userId, startDate, endDate);
                    activitiesCount = withingsResult.activitiesCount;
                    sleepCount = withingsResult.sleepCount;
                    nutritionCount = withingsResult.nutritionCount;
                    healthDataCount = withingsResult.healthDataCount;
                    break;

                default:
                    throw new ApiError(`Unsupported provider: ${provider}`, 400);
            }

            // Update last synced timestamp
            await this.connectionService.updateLastSynced(connection.id);

            // Reset error count in rate limiter
            rateLimiter.resetErrorCount(`${provider}-api`);

            return {
                activitiesCount,
                sleepCount,
                nutritionCount,
                healthDataCount
            };
        } catch (error) {
            // Record error for rate limiting backoff
            rateLimiter.recordError(`${provider}-api`);

            if (error instanceof ApiError) {
                throw error;
            }

            logger.error('Error in SyncService.syncData:', error);
            throw new ApiError('Failed to sync data', 500);
        }
    }

    /**
     * Sync data from Apple Health
     */
    private async syncAppleHealthData(
        accessToken: string,
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        activitiesCount: number;
        sleepCount: number;
        nutritionCount: number;
        healthDataCount: number;
    }> {
        try {
            // Fetch data from Apple Health
            const activities = await appleHealth.client.getActivities(accessToken, startDate, endDate);
            const sleepData = await appleHealth.client.getSleepData(accessToken, startDate, endDate);
            const nutritionData = await appleHealth.client.getNutritionData(accessToken, startDate, endDate);

            // Map data to our format
            const mappedActivities = appleHealth.mapper.mapActivities(activities, userId);
            const mappedSleepData = appleHealth.mapper.mapSleepData(sleepData, userId);
            const mappedNutritionData = appleHealth.mapper.mapNutritionData(nutritionData, userId);
            const mappedHealthData = appleHealth.mapper.mapToHealthData(activities, sleepData, nutritionData, userId);

            // Save data to database
            const activityCount = await this.activityModel.bulkCreate(mappedActivities);
            const sleepCount = await this.sleepService.bulkCreate(mappedSleepData);
            const nutritionCount = await this.nutritionService.bulkCreate(mappedNutritionData);
            const healthDataCount = await this.healthDataModel.bulkCreate(mappedHealthData);

            return {
                activitiesCount: activityCount,
                sleepCount,
                nutritionCount,
                healthDataCount
            };
        } catch (error) {
            logger.error('Error in SyncService.syncAppleHealthData:', error);
            throw error;
        }
    }

    /**
     * Sync data from Google Fit
     */
    private async syncGoogleFitData(
        accessToken: string,
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        activitiesCount: number;
        sleepCount: number;
        nutritionCount: number;
        healthDataCount: number;
    }> {
        try {
            // Fetch data from Google Fit
            const activities = await googleFit.client.getActivities(accessToken, startDate, endDate);
            const sleepData = await googleFit.client.getSleepData(accessToken, startDate, endDate);
            const nutritionData = await googleFit.client.getNutritionData(accessToken, startDate, endDate);

            // Map data to our format
            const mappedActivities = googleFit.mapper.mapActivities(activities, userId);
            const mappedSleepData = googleFit.mapper.mapSleepData(sleepData, userId);
            const mappedNutritionData = googleFit.mapper.mapNutritionData(nutritionData, userId);
            const mappedHealthData = googleFit.mapper.mapToHealthData(activities, sleepData, nutritionData, userId);

            // Save data to database
            const activityCount = await this.activityModel.bulkCreate(mappedActivities);
            const sleepCount = await this.sleepService.bulkCreate(mappedSleepData);
            const nutritionCount = await this.nutritionService.bulkCreate(mappedNutritionData);
            const healthDataCount = await this.healthDataModel.bulkCreate(mappedHealthData);

            return {
                activitiesCount: activityCount,
                sleepCount,
                nutritionCount,
                healthDataCount
            };
        } catch (error) {
            logger.error('Error in SyncService.syncGoogleFitData:', error);
            throw error;
        }
    }

    /**
     * Sync data from Fitbit
     */
    private async syncFitbitData(
        accessToken: string,
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        activitiesCount: number;
        sleepCount: number;
        nutritionCount: number;
        healthDataCount: number;
    }> {
        try {
            // Fetch data from Fitbit
            const activities = await fitbit.client.getActivities(accessToken, startDate, endDate);
            const sleepData = await fitbit.client.getSleepData(accessToken, startDate, endDate);
            const nutritionData = await fitbit.client.getNutritionData(accessToken, startDate, endDate);

            // Map data to our format
            const mappedActivities = fitbit.mapper.mapActivities(activities, userId);
            const mappedSleepData = fitbit.mapper.mapSleepData(sleepData, userId);
            const mappedNutritionData = fitbit.mapper.mapNutritionData(nutritionData, userId);
            const mappedHealthData = fitbit.mapper.mapToHealthData(activities, sleepData, nutritionData, userId);

            // Save data to database using batch operations
            const activityBatches = this.chunkArray(mappedActivities, 50);
            let activityCount = 0;

            for (const batch of activityBatches) {
                activityCount += await this.activityModel.bulkCreate(batch);
            }

            // Create sleep records (these typically need to be processed individually due to sleep stages)
            let sleepCount = 0;
            for (const sleepRecord of mappedSleepData) {
                try {
                    await this.sleepService.createSleep(sleepRecord);
                    sleepCount++;
                } catch (error) {
                    logger.error(`Error creating sleep record: ${error}`);
                    // Continue with other records
                }
            }

            // Create nutrition records
            const nutritionBatches = this.chunkArray(mappedNutritionData, 50);
            let nutritionCount = 0;

            for (const batch of nutritionBatches) {
                nutritionCount += await this.nutritionService.bulkCreate(batch);
            }

            // Create health data records
            const healthDataBatches = this.chunkArray(mappedHealthData, 100);
            let healthDataCount = 0;

            for (const batch of healthDataBatches) {
                healthDataCount += await this.healthDataModel.bulkCreate(batch);
            }

            return {
                activitiesCount: activityCount,
                sleepCount,
                nutritionCount,
                healthDataCount
            };
        } catch (error) {
            logger.error('Error in SyncService.syncFitbitData:', error);
            throw error;
        }
    }

    /**
     * Sync data from Garmin
     */
    private async syncGarminData(
        token: {
            oauth_token: string;
            oauth_token_secret: string;
            user_id: string;
        },
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        activitiesCount: number;
        sleepCount: number;
        nutritionCount: number;
        healthDataCount: number;
    }> {
        try {
            // Fetch data from Garmin
            const activities = await garmin.client.getActivities(token, startDate, endDate);
            const sleepData = await garmin.client.getSleepData(token, startDate, endDate);
            const nutritionData = await garmin.client.getNutritionData(token, startDate, endDate);

            // Map data to our format
            const mappedActivities = garmin.mapper.mapActivities(activities, userId);
            const mappedSleepData = garmin.mapper.mapSleepData(sleepData, userId);
            const mappedNutritionData = garmin.mapper.mapNutritionData(nutritionData, userId);
            const mappedHealthData = garmin.mapper.mapToHealthData(activities, sleepData, nutritionData, userId);

            // Save data to database using batch operations
            const activityBatches = this.chunkArray(mappedActivities, 50);
            let activityCount = 0;

            for (const batch of activityBatches) {
                activityCount += await this.activityModel.bulkCreate(batch);
            }

            // Create sleep records (these typically need to be processed individually due to sleep stages)
            let sleepCount = 0;
            for (const sleepRecord of mappedSleepData) {
                try {
                    await this.sleepService.createSleep(sleepRecord);
                    sleepCount++;
                } catch (error) {
                    logger.error(`Error creating sleep record: ${error}`);
                    // Continue with other records
                }
            }

            // Create nutrition records
            const nutritionBatches = this.chunkArray(mappedNutritionData, 50);
            let nutritionCount = 0;

            for (const batch of nutritionBatches) {
                nutritionCount += await this.nutritionService.bulkCreate(batch);
            }

            // Create health data records
            const healthDataBatches = this.chunkArray(mappedHealthData, 100);
            let healthDataCount = 0;

            for (const batch of healthDataBatches) {
                healthDataCount += await this.healthDataModel.bulkCreate(batch);
            }

            return {
                activitiesCount: activityCount,
                sleepCount,
                nutritionCount,
                healthDataCount
            };
        } catch (error) {
            logger.error('Error in SyncService.syncGarminData:', error);
            throw error;
        }
    }

    /**
     * Sync data from Samsung Health
     */
    private async syncSamsungHealthData(
        _accessToken: string,
        _userId: string,
        _startDate: Date,
        _endDate: Date
    ): Promise<{
        activitiesCount: number;
        sleepCount: number;
        nutritionCount: number;
        healthDataCount: number;
    }> {
        try {
            // For now, this is a placeholder since Samsung Health is not fully implemented
            logger.info('Samsung Health sync requested but not fully implemented');

            return {
                activitiesCount: 0,
                sleepCount: 0,
                nutritionCount: 0,
                healthDataCount: 0
            };
        } catch (error) {
            logger.error('Error in SyncService.syncSamsungHealthData:', error);
            throw error;
        }
    }

    /**
     * Sync data from Withings
     */
    private async syncWithingsData(
        _accessToken: string,
        _userId: string,
        _startDate: Date,
        _endDate: Date
    ): Promise<{
        activitiesCount: number;
        sleepCount: number;
        nutritionCount: number;
        healthDataCount: number;
    }> {
        try {
            // For now, this is a placeholder since Withings is not fully implemented
            logger.info('Withings sync requested but not fully implemented');

            return {
                activitiesCount: 0,
                sleepCount: 0,
                nutritionCount: 0,
                healthDataCount: 0
            };
        } catch (error) {
            logger.error('Error in SyncService.syncWithingsData:', error);
            throw error;
        }
    }

    /**
     * Sync all connections for a user
     */
    async syncAllForUser(
        userId: string,
        startDate: Date = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)), // Default to last 30 days
        endDate: Date = new Date()
    ): Promise<{
        [provider: string]: {
            success: boolean;
            error?: string;
            activitiesCount?: number;
            sleepCount?: number;
            nutritionCount?: number;
            healthDataCount?: number;
        }
    }> {
        try {
            // Get all active connections for user
            const connections = await this.connectionService.getActiveConnectionsByUser(userId);

            if (connections.length === 0) {
                throw new ApiError('No active connections found for user', 404);
            }

            const results: {
                [provider: string]: {
                    success: boolean;
                    error?: string;
                    activitiesCount?: number;
                    sleepCount?: number;
                    nutritionCount?: number;
                    healthDataCount?: number;
                }
            } = {};

            // Sync data for each connection
            for (const connection of connections) {
                try {
                    const syncResult = await this.syncData(userId, connection.provider, startDate, endDate);

                    results[connection.provider] = {
                        success: true,
                        ...syncResult
                    };
                } catch (error) {
                    logger.error(`Error syncing data for provider ${connection.provider}:`, error);

                    results[connection.provider] = {
                        success: false,
                        error: error instanceof ApiError ? error.message : 'Unknown error'
                    };
                }
            }

            return results;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            logger.error('Error in SyncService.syncAllForUser:', error);
            throw new ApiError('Failed to sync data for user', 500);
        }
    }

    /**
     * Get sync status for all connections
     */
    async getSyncStatus(userId: string): Promise<any[]> {
        try {
            const connections = await this.connectionService.getActiveConnectionsByUser(userId);

            return connections.map(conn => ({
                id: conn.id,
                provider: conn.provider,
                status: conn.status,
                last_synced_at: conn.last_synced_at,
                token_expires_at: conn.token_expires_at
            }));
        } catch (error) {
            logger.error('Error in SyncService.getSyncStatus:', error);
            throw new ApiError('Failed to get sync status', 500);
        }
    }

    /**
     * Helper method to chunk an array into smaller arrays
     */
    private chunkArray<T>(array: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
}