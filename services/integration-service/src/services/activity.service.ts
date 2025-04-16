// src/services/activity.service.ts
import { ActivityModel, Activity, CreateActivityParams } from '../models/activity.model';
import { HealthDataModel, CreateHealthDataParams } from '../models/health-data.model';
import { ApiError } from '../middlewares/error.middleware';
import { logger } from '../middlewares/logging.middleware';

export class ActivityService {
    private activityModel: ActivityModel;
    private healthDataModel: HealthDataModel;

    constructor() {
        this.activityModel = new ActivityModel();
        this.healthDataModel = new HealthDataModel();
    }

    /**
     * Create a new activity record
     */
    async createActivity(params: CreateActivityParams): Promise<Activity> {
        try {
            // Create health data entries for activity metrics
            let healthDataId = null;

            if (params.calories_burned) {
                const healthData: CreateHealthDataParams = {
                    user_id: params.user_id,
                    data_type: 'activity',
                    data_subtype: 'calories',
                    value: params.calories_burned,
                    unit: 'kcal',
                    start_time: params.start_time,
                    end_time: params.end_time,
                    source_provider: params.source_provider,
                    source_device_id: params.source_device_id,
                    metadata: params.metadata
                };

                const createdHealthData = await this.healthDataModel.create(healthData);
                healthDataId = createdHealthData.id;
            }

            // Create activity record with reference to health data
            const activityParams = {
                ...params,
                health_data_id: healthDataId
            };

            const activity = await this.activityModel.create(activityParams);

            return activity;
        } catch (error) {
            logger.error('Error in ActivityService.createActivity:', error);
            throw new ApiError('Failed to create activity', 500);
        }
    }

    /**
     * Bulk create activity records
     */
    async bulkCreate(paramsArray: CreateActivityParams[]): Promise<number> {
        try {
            if (!paramsArray.length) {
                return 0;
            }

            // For bulk operations, we don't create health data records for each activity
            // This is done separately by the sync service

            const count = await this.activityModel.bulkCreate(paramsArray);

            return count;
        } catch (error) {
            logger.error('Error in ActivityService.bulkCreate:', error);
            throw new ApiError('Failed to bulk create activities', 500);
        }
    }

    /**
     * Get activity by ID
     */
    async getActivityById(id: string): Promise<Activity> {
        try {
            const activity = await this.activityModel.findById(id);

            if (!activity) {
                throw new ApiError('Activity not found', 404);
            }

            return activity;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            logger.error('Error in ActivityService.getActivityById:', error);
            throw new ApiError('Failed to get activity', 500);
        }
    }

    /**
     * Get activities for a user
     */
    async getActivitiesByUser(
        userId: string,
        startDate?: Date,
        endDate?: Date,
        activityType?: string,
        limit?: number
    ): Promise<Activity[]> {
        try {
            return await this.activityModel.findByUser(userId, startDate, endDate, activityType, limit);
        } catch (error) {
            logger.error('Error in ActivityService.getActivitiesByUser:', error);
            throw new ApiError('Failed to get activities', 500);
        }
    }
}