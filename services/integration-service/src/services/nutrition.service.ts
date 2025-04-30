// src/services/nutrition.service.ts
import { NutritionModel, Nutrition, CreateNutritionParams } from '../models/nutrition.model';
import { HealthDataModel, CreateHealthDataParams } from '../models/health-data.model';
import { ApiError } from '../middlewares/error.middleware';
import { logger } from '../middlewares/logging.middleware';

export class NutritionService {
    private nutritionModel: NutritionModel;
    private healthDataModel: HealthDataModel;

    constructor() {
        this.nutritionModel = new NutritionModel();
        this.healthDataModel = new HealthDataModel();
    }

    /**
     * Create a new nutrition record
     */
    async createNutrition(params: CreateNutritionParams): Promise<Nutrition> {
        try {
            // Create health data entry for calories if provided
            let healthDataId = null;

            if (params.total_calories) {
                const healthData: CreateHealthDataParams = {
                    user_id: params.user_id,
                    data_type: 'nutrition',
                    data_subtype: 'calories',
                    value: params.total_calories,
                    unit: 'kcal',
                    start_time: params.timestamp,
                    source_provider: params.source_provider,
                    source_app_id: params.source_app_id,
                    metadata: {
                        meal_type: params.meal_type,
                        ...params.metadata
                    }
                };

                const createdHealthData = await this.healthDataModel.create(healthData);
                healthDataId = createdHealthData.id;
            }

            // Create nutrition record with reference to health data
            const nutritionParams = {
                ...params,
                health_data_id: healthDataId ? healthDataId : undefined
            };

            const nutrition = await this.nutritionModel.create(nutritionParams);

            return nutrition;
        } catch (error) {
            logger.error('Error in NutritionService.createNutrition:', error);
            throw new ApiError('Failed to create nutrition record', 500);
        }
    }

    /**
     * Bulk create nutrition records
     */
    async bulkCreate(paramsArray: CreateNutritionParams[]): Promise<number> {
        try {
            if (!paramsArray.length) {
                return 0;
            }

            // For bulk operations, we don't create health data records for each nutrition record
            // This is done separately by the sync service

            const count = await this.nutritionModel.bulkCreate(paramsArray);

            return count;
        } catch (error) {
            logger.error('Error in NutritionService.bulkCreate:', error);
            throw new ApiError('Failed to bulk create nutrition records', 500);
        }
    }

    /**
     * Get nutrition record by ID
     */
    async getNutritionById(id: string): Promise<Nutrition> {
        try {
            const nutrition = await this.nutritionModel.findById(id);

            if (!nutrition) {
                throw new ApiError('Nutrition record not found', 404);
            }

            return nutrition;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            logger.error('Error in NutritionService.getNutritionById:', error);
            throw new ApiError('Failed to get nutrition record', 500);
        }
    }

    /**
     * Get nutrition records for a user
     */
    async getNutritionByUser(
        userId: string,
        startDate?: Date,
        endDate?: Date,
        mealType?: string,
        limit?: number
    ): Promise<Nutrition[]> {
        try {
            return await this.nutritionModel.findByUser(userId, startDate, endDate, mealType, limit);
        } catch (error) {
            logger.error('Error in NutritionService.getNutritionByUser:', error);
            throw new ApiError('Failed to get nutrition records', 500);
        }
    }
}