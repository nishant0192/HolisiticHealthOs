// src/services/sleep.service.ts
import { SleepModel, Sleep, CreateSleepParams } from '../models/sleep.model';
import { HealthDataModel, CreateHealthDataParams } from '../models/health-data.model';
import { ApiError } from '../middlewares/error.middleware';
import { logger } from '../middlewares/logging.middleware';

export class SleepService {
    private sleepModel: SleepModel;
    private healthDataModel: HealthDataModel;

    constructor() {
        this.sleepModel = new SleepModel();
        this.healthDataModel = new HealthDataModel();
    }

    /**
     * Create a new sleep record
     */
    async createSleep(params: CreateSleepParams): Promise<Sleep> {
        try {
            // Create health data entry for sleep duration
            const healthData: CreateHealthDataParams = {
                user_id: params.user_id,
                data_type: 'sleep',
                data_subtype: 'duration',
                value: params.duration_seconds ? params.duration_seconds / 3600 : // Convert to hours
                    (params.end_time.getTime() - params.start_time.getTime()) / 3600000,
                unit: 'hours',
                start_time: params.start_time,
                end_time: params.end_time,
                source_provider: params.source_provider,
                source_device_id: params.source_device_id,
                metadata: params.metadata
            };

            const createdHealthData = await this.healthDataModel.create(healthData);

            // Create sleep record with reference to health data
            const sleepParams = {
                ...params,
                health_data_id: createdHealthData.id
            };

            const sleep = await this.sleepModel.create(sleepParams);

            return sleep;
        } catch (error) {
            logger.error('Error in SleepService.createSleep:', error);
            throw new ApiError('Failed to create sleep record', 500);
        }
    }

    /**
     * Bulk create sleep records
     */
    async bulkCreate(paramsArray: CreateSleepParams[]): Promise<number> {
        try {
            if (!paramsArray.length) {
                return 0;
            }

            // For bulk operations, we don't create health data records for each sleep record
            // This is done separately by the sync service

            let count = 0;

            // Sleep records need to be created one by one due to sleep stages
            for (const params of paramsArray) {
                await this.sleepModel.create(params);
                count++;
            }

            return count;
        } catch (error) {
            logger.error('Error in SleepService.bulkCreate:', error);
            throw new ApiError('Failed to bulk create sleep records', 500);
        }
    }

    /**
     * Get sleep record by ID
     */
    async getSleepById(id: string): Promise<Sleep> {
        try {
            const sleep = await this.sleepModel.findById(id);

            if (!sleep) {
                throw new ApiError('Sleep record not found', 404);
            }

            return sleep;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            logger.error('Error in SleepService.getSleepById:', error);
            throw new ApiError('Failed to get sleep record', 500);
        }
    }

    /**
     * Get sleep records for a user
     */
    async getSleepByUser(
        userId: string,
        startDate?: Date,
        endDate?: Date,
        limit?: number
    ): Promise<Sleep[]> {
        try {
            return await this.sleepModel.findByUser(userId, startDate, endDate, limit);
        } catch (error) {
            logger.error('Error in SleepService.getSleepByUser:', error);
            throw new ApiError('Failed to get sleep records', 500);
        }
    }
}