import { AppleHealthActivity, AppleHealthSleep, AppleHealthNutrition } from './types';
import { CreateActivityParams } from '../../models/activity.model';
import { CreateSleepParams } from '../../models/sleep.model';
import { CreateNutritionParams } from '../../models/nutrition.model';
import { CreateHealthDataParams } from '../../models/health-data.model';

/**
 * Map Apple Health activities to our activity format
 */
export const mapActivities = (
    activities: AppleHealthActivity[],
    userId: string
): CreateActivityParams[] => {
    return activities.map(activity => ({
        user_id: userId,
        activity_type: activity.workoutActivityType,
        start_time: new Date(activity.startDate),
        end_time: new Date(activity.endDate),
        duration_seconds: activity.duration,
        distance: activity.distance,
        distance_unit: activity.distanceUnit,
        calories_burned: activity.activeEnergyBurned,
        source_provider: 'apple_health',
        source_device_id: activity.sourceId,
        metadata: {
            original_id: activity.id,
            source_name: activity.sourceName
        }
    }));
};

/**
 * Map Apple Health sleep data to our sleep format
 */
export const mapSleepData = (
    sleepData: AppleHealthSleep[],
    userId: string
): CreateSleepParams[] => {
    return sleepData.map(sleep => ({
        user_id: userId,
        start_time: new Date(sleep.startDate),
        end_time: new Date(sleep.endDate),
        duration_seconds: sleep.duration,
        sleep_stages: sleep.sleepStages.map(stage => ({
            stage: stage.stage,
            start_time: new Date(stage.startDate),
            end_time: new Date(stage.endDate),
            duration_seconds: stage.duration
        })),
        source_provider: 'apple_health',
        source_device_id: sleep.sourceId,
        metadata: {
            original_id: sleep.id,
            source_name: sleep.sourceName
        }
    }));
};

/**
 * Map Apple Health nutrition data to our nutrition format
 */
export const mapNutritionData = (
    nutritionData: AppleHealthNutrition[],
    userId: string
): CreateNutritionParams[] => {
    return nutritionData.map(nutrition => {
        // Calculate total calories and macronutrients
        const totalCalories = nutrition.foodItems.reduce((sum, item) => sum + item.calories, 0);
        const totalMacronutrients = {
            protein: nutrition.foodItems.reduce((sum, item) => sum + item.protein, 0),
            carbohydrates: nutrition.foodItems.reduce((sum, item) => sum + item.carbohydrates, 0),
            fat: nutrition.foodItems.reduce((sum, item) => sum + item.fat, 0),
            fiber: nutrition.foodItems.reduce((sum, item) => sum + item.fiber, 0)
        };

        return {
            user_id: userId,
            timestamp: new Date(nutrition.date),
            meal_type: nutrition.meal,
            foods: nutrition.foodItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                calories: item.calories,
                macronutrients: {
                    protein: item.protein,
                    carbohydrates: item.carbohydrates,
                    fat: item.fat,
                    fiber: item.fiber
                }
            })),
            total_calories: totalCalories,
            total_macronutrients: totalMacronutrients,
            source_provider: 'apple_health',
            source_app_id: nutrition.sourceId,
            metadata: {
                original_id: nutrition.id,
                source_name: nutrition.sourceName
            }
        };
    });
};

/**
 * Map Apple Health data to generic health data format for trends and aggregations
 */
export const mapToHealthData = (
    activities: AppleHealthActivity[],
    sleepData: AppleHealthSleep[],
    nutritionData: AppleHealthNutrition[],
    userId: string
): CreateHealthDataParams[] => {
    const healthData: CreateHealthDataParams[] = [];

    // Map activities to health data
    activities.forEach(activity => {
        // Add step count if available
        if (activity.workoutActivityType === 'walking' || activity.workoutActivityType === 'running') {
            healthData.push({
                user_id: userId,
                data_type: 'activity',
                data_subtype: 'steps',
                value: Math.round(activity.distance * 1300), // Rough estimate of steps based on distance
                unit: 'count',
                start_time: new Date(activity.startDate),
                end_time: new Date(activity.endDate),
                source_provider: 'apple_health',
                source_device_id: activity.sourceId,
                metadata: {
                    original_id: activity.id,
                    activity_type: activity.workoutActivityType
                }
            });
        }

        // Add calories
        healthData.push({
            user_id: userId,
            data_type: 'activity',
            data_subtype: 'calories',
            value: activity.activeEnergyBurned,
            unit: 'kcal',
            start_time: new Date(activity.startDate),
            end_time: new Date(activity.endDate),
            source_provider: 'apple_health',
            source_device_id: activity.sourceId,
            metadata: {
                original_id: activity.id,
                activity_type: activity.workoutActivityType
            }
        });

        // Add distance
        healthData.push({
            user_id: userId,
            data_type: 'activity',
            data_subtype: 'distance',
            value: activity.distance,
            unit: activity.distanceUnit,
            start_time: new Date(activity.startDate),
            end_time: new Date(activity.endDate),
            source_provider: 'apple_health',
            source_device_id: activity.sourceId,
            metadata: {
                original_id: activity.id,
                activity_type: activity.workoutActivityType
            }
        });
    });

    // Map sleep to health data
    sleepData.forEach(sleep => {
        healthData.push({
            user_id: userId,
            data_type: 'sleep',
            data_subtype: 'duration',
            value: sleep.duration / 3600, // Convert to hours
            unit: 'hours',
            start_time: new Date(sleep.startDate),
            end_time: new Date(sleep.endDate),
            source_provider: 'apple_health',
            source_device_id: sleep.sourceId,
            metadata: {
                original_id: sleep.id,
                sleep_stages: sleep.sleepStages.map(stage => stage.stage)
            }
        });

        // Add sleep stages
        const deepSleepStages = sleep.sleepStages.filter(stage => stage.stage === 'deep');
        if (deepSleepStages.length > 0) {
            const deepSleepDuration = deepSleepStages.reduce((sum, stage) => sum + stage.duration, 0);

            healthData.push({
                user_id: userId,
                data_type: 'sleep',
                data_subtype: 'deep_sleep',
                value: deepSleepDuration / 3600, // Convert to hours
                unit: 'hours',
                start_time: new Date(sleep.startDate),
                end_time: new Date(sleep.endDate),
                source_provider: 'apple_health',
                source_device_id: sleep.sourceId,
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
            value: nutrition.foodItems.reduce((sum, item) => sum + item.calories, 0),
            unit: 'kcal',
            start_time: new Date(nutrition.date),
            source_provider: 'apple_health',
            source_app_id: nutrition.sourceId,
            metadata: {
                original_id: nutrition.id,
                meal_type: nutrition.meal
            }
        });

        // Add macronutrients
        const protein = nutrition.foodItems.reduce((sum, item) => sum + item.protein, 0);
        const carbs = nutrition.foodItems.reduce((sum, item) => sum + item.carbohydrates, 0);
        const fat = nutrition.foodItems.reduce((sum, item) => sum + item.fat, 0);

        healthData.push({
            user_id: userId,
            data_type: 'nutrition',
            data_subtype: 'protein',
            value: protein,
            unit: 'g',
            start_time: new Date(nutrition.date),
            source_provider: 'apple_health',
            source_app_id: nutrition.sourceId,
            metadata: {
                original_id: nutrition.id,
                meal_type: nutrition.meal
            }
        });

        healthData.push({
            user_id: userId,
            data_type: 'nutrition',
            data_subtype: 'carbohydrates',
            value: carbs,
            unit: 'g',
            start_time: new Date(nutrition.date),
            source_provider: 'apple_health',
            source_app_id: nutrition.sourceId,
            metadata: {
                original_id: nutrition.id,
                meal_type: nutrition.meal
            }
        });

        healthData.push({
            user_id: userId,
            data_type: 'nutrition',
            data_subtype: 'fat',
            value: fat,
            unit: 'g',
            start_time: new Date(nutrition.date),
            source_provider: 'apple_health',
            source_app_id: nutrition.sourceId,
            metadata: {
                original_id: nutrition.id,
                meal_type: nutrition.meal
            }
        });
    });

    return healthData;
};