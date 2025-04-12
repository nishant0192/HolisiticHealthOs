import { GoogleFitActivity, GoogleFitSleep, GoogleFitNutrition } from './types';
import { CreateActivityParams } from '../../models/activity.model';
import { CreateSleepParams } from '../../models/sleep.model';
import { CreateNutritionParams } from '../../models/nutrition.model';
import { CreateHealthDataParams } from '../../models/health-data.model';

/**
 * Map Google Fit activities to our activity format
 */
export const mapActivities = (
    activities: GoogleFitActivity[],
    userId: string
): CreateActivityParams[] => {
    return activities.map(activity => ({
        user_id: userId,
        activity_type: activity.activityType.toLowerCase(),
        start_time: new Date(parseInt(activity.startTimeMillis)),
        end_time: new Date(parseInt(activity.endTimeMillis)),
        duration_seconds: (parseInt(activity.endTimeMillis) - parseInt(activity.startTimeMillis)) / 1000,
        distance: activity.distance ? activity.distance.value : null,
        distance_unit: activity.distance ? activity.distance.unit : null,
        calories_burned: activity.calories ? activity.calories.value : null,
        steps: activity.steps ? activity.steps.value : null,
        source_provider: 'google_fit',
        source_device_id: activity.application ? activity.application.packageName : null,
        metadata: {
            original_id: activity.id,
            application_version: activity.application ? activity.application.version : null,
            modified_time: new Date(parseInt(activity.modifiedTimeMillis))
        }
    }));
};

/**
 * Map Google Fit sleep data to our sleep format
 */
export const mapSleepData = (
    sleepData: GoogleFitSleep[],
    userId: string
): CreateSleepParams[] => {
    return sleepData.map(sleep => ({
        user_id: userId,
        start_time: new Date(parseInt(sleep.startTimeMillis)),
        end_time: new Date(parseInt(sleep.endTimeMillis)),
        duration_seconds: (parseInt(sleep.endTimeMillis) - parseInt(sleep.startTimeMillis)) / 1000,
        sleep_stages: sleep.sleepSegments.map(segment => {
            let stage = 'unknown';

            // Map Google Fit sleep stages to our format
            switch (segment.sleepStage) {
                case 'awake':
                    stage = 'awake';
                    break;
                case 'light':
                    stage = 'light';
                    break;
                case 'deep':
                    stage = 'deep';
                    break;
                case 'rem':
                    stage = 'rem';
                    break;
            }

            return {
                stage,
                start_time: new Date(parseInt(segment.startTimeMillis)),
                end_time: new Date(parseInt(segment.endTimeMillis)),
                duration_seconds: (parseInt(segment.endTimeMillis) - parseInt(segment.startTimeMillis)) / 1000
            };
        }),
        source_provider: 'google_fit',
        source_device_id: sleep.application ? sleep.application.packageName : null,
        metadata: {
            original_id: sleep.id,
            application_version: sleep.application ? sleep.application.version : null,
            modified_time: new Date(parseInt(sleep.modifiedTimeMillis))
        }
    }));
};

/**
 * Map Google Fit nutrition data to our nutrition format
 */
export const mapNutritionData = (
    nutritionData: GoogleFitNutrition[],
    userId: string
): CreateNutritionParams[] => {
    return nutritionData.map(nutrition => {
        return {
            user_id: userId,
            timestamp: new Date(parseInt(nutrition.startTimeMillis)),
            meal_type: nutrition.meal ? nutrition.meal.toLowerCase() : 'unknown',
            foods: nutrition.foodItems.map(item => ({
                name: item.name,
                quantity: item.amount.value,
                unit: item.amount.unit,
                calories: item.nutrients.calories,
                macronutrients: {
                    protein: item.nutrients.protein,
                    carbohydrates: item.nutrients.carbohydrates,
                    fat: item.nutrients.fat,
                    fiber: item.nutrients.fiber
                }
            })),
            total_calories: nutrition.nutrients.calories,
            total_macronutrients: {
                protein: nutrition.nutrients.protein,
                carbohydrates: nutrition.nutrients.carbohydrates,
                fat: nutrition.nutrients.fat,
                fiber: nutrition.nutrients.fiber
            },
            source_provider: 'google_fit',
            source_app_id: nutrition.application ? nutrition.application.packageName : null,
            metadata: {
                original_id: nutrition.id,
                application_version: nutrition.application ? nutrition.application.version : null,
                modified_time: new Date(parseInt(nutrition.modifiedTimeMillis))
            }
        };
    });
};

/**
 * Map Google Fit data to generic health data format for trends and aggregations
 */
export const mapToHealthData = (
    activities: GoogleFitActivity[],
    sleepData: GoogleFitSleep[],
    nutritionData: GoogleFitNutrition[],
    userId: string
): CreateHealthDataParams[] => {
    const healthData: CreateHealthDataParams[] = [];

    // Map activities to health data
    activities.forEach(activity => {
        // Add steps if available
        if (activity.steps && activity.steps.value > 0) {
            healthData.push({
                user_id: userId,
                data_type: 'activity',
                data_subtype: 'steps',
                value: activity.steps.value,
                unit: 'count',
                start_time: new Date(parseInt(activity.startTimeMillis)),
                end_time: new Date(parseInt(activity.endTimeMillis)),
                source_provider: 'google_fit',
                source_device_id: activity.application ? activity.application.packageName : null,
                metadata: {
                    original_id: activity.id,
                    activity_type: activity.activityType
                }
            });
        }

        // Add calories if available
        if (activity.calories && activity.calories.value > 0) {
            healthData.push({
                user_id: userId,
                data_type: 'activity',
                data_subtype: 'calories',
                value: activity.calories.value,
                unit: activity.calories.unit,
                start_time: new Date(parseInt(activity.startTimeMillis)),
                end_time: new Date(parseInt(activity.endTimeMillis)),
                source_provider: 'google_fit',
                source_device_id: activity.application ? activity.application.packageName : null,
                metadata: {
                    original_id: activity.id,
                    activity_type: activity.activityType
                }
            });
        }

        // Add distance if available
        if (activity.distance && activity.distance.value > 0) {
            healthData.push({
                user_id: userId,
                data_type: 'activity',
                data_subtype: 'distance',
                value: activity.distance.value,
                unit: activity.distance.unit,
                start_time: new Date(parseInt(activity.startTimeMillis)),
                end_time: new Date(parseInt(activity.endTimeMillis)),
                source_provider: 'google_fit',
                source_device_id: activity.application ? activity.application.packageName : null,
                metadata: {
                    original_id: activity.id,
                    activity_type: activity.activityType
                }
            });
        }
    });

    // Map sleep to health data
    sleepData.forEach(sleep => {
        healthData.push({
            user_id: userId,
            data_type: 'sleep',
            data_subtype: 'duration',
            value: (parseInt(sleep.endTimeMillis) - parseInt(sleep.startTimeMillis)) / 3600000, // Convert to hours
            unit: 'hours',
            start_time: new Date(parseInt(sleep.startTimeMillis)),
            end_time: new Date(parseInt(sleep.endTimeMillis)),
            source_provider: 'google_fit',
            source_device_id: sleep.application ? sleep.application.packageName : null,
            metadata: {
                original_id: sleep.id,
                sleep_stages: sleep.sleepSegments.map(segment => segment.sleepStage)
            }
        });

        // Add sleep stages
        const deepSleepSegments = sleep.sleepSegments.filter(segment => segment.sleepStage === 'deep');
        if (deepSleepSegments.length > 0) {
            const deepSleepDuration = deepSleepSegments.reduce(
                (sum, segment) => sum + (parseInt(segment.endTimeMillis) - parseInt(segment.startTimeMillis)),
                0
            );

            healthData.push({
                user_id: userId,
                data_type: 'sleep',
                data_subtype: 'deep_sleep',
                value: deepSleepDuration / 3600000, // Convert to hours
                unit: 'hours',
                start_time: new Date(parseInt(sleep.startTimeMillis)),
                end_time: new Date(parseInt(sleep.endTimeMillis)),
                source_provider: 'google_fit',
                source_device_id: sleep.application ? sleep.application.packageName : null,
                metadata: {
                    original_id: sleep.id
                }
            });
        }
    });

    // Map nutrition to health data
    nutritionData.forEach(nutrition => {
        // Add calories
        healthData.push({
            user_id: userId,
            data_type: 'nutrition',
            data_subtype: 'calories',
            value: nutrition.nutrients.calories,
            unit: 'kcal',
            start_time: new Date(parseInt(nutrition.startTimeMillis)),
            source_provider: 'google_fit',
            source_app_id: nutrition.application ? nutrition.application.packageName : null,
            metadata: {
                original_id: nutrition.id,
                meal_type: nutrition.meal
            }
        });

        // Add macronutrients
        healthData.push({
            user_id: userId,
            data_type: 'nutrition',
            data_subtype: 'protein',
            value: nutrition.nutrients.protein,
            unit: 'g',
            start_time: new Date(parseInt(nutrition.startTimeMillis)),
            source_provider: 'google_fit',
            source_app_id: nutrition.application ? nutrition.application.packageName : null,
            metadata: {
                original_id: nutrition.id,
                meal_type: nutrition.meal
            }
        });

        healthData.push({
            user_id: userId,
            data_type: 'nutrition',
            data_subtype: 'carbohydrates',
            value: nutrition.nutrients.carbohydrates,
            unit: 'g',
            start_time: new Date(parseInt(nutrition.startTimeMillis)),
            source_provider: 'google_fit',
            source_app_id: nutrition.application ? nutrition.application.packageName : null,
            metadata: {
                original_id: nutrition.id,
                meal_type: nutrition.meal
            }
        });

        healthData.push({
            user_id: userId,
            data_type: 'nutrition',
            data_subtype: 'fat',
            value: nutrition.nutrients.fat,
            unit: 'g',
            start_time: new Date(parseInt(nutrition.startTimeMillis)),
            source_provider: 'google_fit',
            source_app_id: nutrition.application ? nutrition.application.packageName : null,
            metadata: {
                original_id: nutrition.id,
                meal_type: nutrition.meal
            }
        });
    });

    return healthData;
};