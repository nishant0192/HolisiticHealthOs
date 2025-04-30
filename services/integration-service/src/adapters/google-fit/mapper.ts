import {
    GoogleFitActivity,
    GoogleFitSleep,
    GoogleFitNutrition
} from './types';
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
        activity_type: activity.activityType,
        start_time: new Date(parseInt(activity.startTimeMillis)),
        end_time: new Date(parseInt(activity.endTimeMillis)),
        duration_seconds: (parseInt(activity.endTimeMillis) - parseInt(activity.startTimeMillis)) / 1000,
        distance: activity.distance ? activity.distance.value / 1000 : undefined, // Convert meters to km
        distance_unit: 'km',
        calories_burned: activity.calories ? activity.calories.value : undefined,
        steps: activity.steps ? activity.steps.value : undefined,
        heart_rate_avg: activity.heartRate ? activity.heartRate.average : undefined,
        heart_rate_max: activity.heartRate ? activity.heartRate.max : undefined,
        source_provider: 'google_fit',
        source_device_id: activity.application ? activity.application.packageName : undefined,
        metadata: {
            original_id: activity.id,
            application_version: activity.application ? activity.application.version : undefined,
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
        sleep_stages: sleep.sleepStages.map(stage => ({
            stage: stage.stage,
            start_time: new Date(parseInt(stage.startTimeMillis)),
            end_time: new Date(parseInt(stage.endTimeMillis)),
            duration_seconds: stage.durationMillis / 1000
        })),
        source_provider: 'google_fit',
        source_device_id: sleep.application ? sleep.application.packageName : undefined,
        metadata: {
            original_id: sleep.id,
            application_version: sleep.application ? sleep.application.version : undefined,
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
        // Google Fit doesn't provide detailed food items in the same way as other providers
        // So we create a placeholder food item
        const foodItem = {
            name: 'Daily Nutrition', // Placeholder name
            quantity: 1,
            unit: 'day',
            calories: nutrition.nutrients.calories,
            macronutrients: {
                protein: nutrition.nutrients.protein,
                carbohydrates: nutrition.nutrients.carbohydrates,
                fat: nutrition.nutrients.fat,
                fiber: nutrition.nutrients.fiber
            }
        };

        return {
            user_id: userId,
            timestamp: new Date(parseInt(nutrition.startTimeMillis)),
            meal_type: nutrition.meal.toLowerCase(),
            foods: nutrition.foodItems.length > 0 ? nutrition.foodItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                calories: item.calories,
                macronutrients: {
                    protein: item.nutrients.find(n => n.name === 'protein')?.amount || 0,
                    carbohydrates: item.nutrients.find(n => n.name === 'carbohydrates')?.amount || 0,
                    fat: item.nutrients.find(n => n.name === 'fat')?.amount || 0,
                    fiber: item.nutrients.find(n => n.name === 'fiber')?.amount || 0
                }
            })) : [foodItem],
            total_calories: nutrition.nutrients.calories,
            total_macronutrients: {
                protein: nutrition.nutrients.protein,
                carbohydrates: nutrition.nutrients.carbohydrates,
                fat: nutrition.nutrients.fat,
                fiber: nutrition.nutrients.fiber
            },
            source_provider: 'google_fit',
            source_app_id: nutrition.application ? nutrition.application.packageName : undefined,
            metadata: {
                original_id: nutrition.id,
                application_version: nutrition.application ? nutrition.application.version : undefined,
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
                source_device_id: activity.application ? activity.application.packageName : undefined,
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
                source_device_id: activity.application ? activity.application.packageName : undefined,
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
                value: activity.distance.value / 1000, // Convert to km
                unit: 'km',
                start_time: new Date(parseInt(activity.startTimeMillis)),
                end_time: new Date(parseInt(activity.endTimeMillis)),
                source_provider: 'google_fit',
                source_device_id: activity.application ? activity.application.packageName : undefined,
                metadata: {
                    original_id: activity.id,
                    activity_type: activity.activityType
                }
            });
        }

        // Add heart rate if available
        if (activity.heartRate && activity.heartRate.average > 0) {
            healthData.push({
                user_id: userId,
                data_type: 'vitals',
                data_subtype: 'heart_rate',
                value: activity.heartRate.average,
                unit: 'bpm',
                start_time: new Date(parseInt(activity.startTimeMillis)),
                end_time: new Date(parseInt(activity.endTimeMillis)),
                source_provider: 'google_fit',
                source_device_id: activity.application ? activity.application.packageName : undefined,
                metadata: {
                    original_id: activity.id,
                    activity_type: activity.activityType,
                    max_value: activity.heartRate.max
                }
            });
        }
    });

    // Map sleep data to health data
    sleepData.forEach(sleep => {
        // Add sleep duration
        const durationHours = (parseInt(sleep.endTimeMillis) - parseInt(sleep.startTimeMillis)) / (1000 * 60 * 60);

        healthData.push({
            user_id: userId,
            data_type: 'sleep',
            data_subtype: 'duration',
            value: durationHours,
            unit: 'hours',
            start_time: new Date(parseInt(sleep.startTimeMillis)),
            end_time: new Date(parseInt(sleep.endTimeMillis)),
            source_provider: 'google_fit',
            source_device_id: sleep.application ? sleep.application.packageName : undefined,
            metadata: {
                original_id: sleep.id,
                sleep_stages: sleep.sleepStages.map(stage => ({
                    stage: stage.stage,
                    duration_minutes: stage.durationMillis / (1000 * 60)
                }))
            }
        });

        // Add sleep quality metrics if available
        // Calculate deep sleep percentage
        const deepSleepMinutes = sleep.sleepStages
            .filter(stage => stage.stage === 'deep')
            .reduce((total, stage) => total + stage.durationMillis / (1000 * 60), 0);

        const totalSleepMinutes = sleep.sleepStages
            .reduce((total, stage) => total + stage.durationMillis / (1000 * 60), 0);

        if (totalSleepMinutes > 0) {
            const deepSleepPercentage = (deepSleepMinutes / totalSleepMinutes) * 100;

            healthData.push({
                user_id: userId,
                data_type: 'sleep',
                data_subtype: 'quality',
                value: deepSleepPercentage,
                unit: 'percentage',
                start_time: new Date(parseInt(sleep.startTimeMillis)),
                end_time: new Date(parseInt(sleep.endTimeMillis)),
                source_provider: 'google_fit',
                source_device_id: sleep.application ? sleep.application.packageName : undefined,
                metadata: {
                    original_id: sleep.id,
                    metric_type: 'deep_sleep_percentage'
                }
            });
        }
    });

    // Map nutrition data to health data
    nutritionData.forEach(nutrition => {
        // Add calories
        if (nutrition.nutrients.calories > 0) {
            healthData.push({
                user_id: userId,
                data_type: 'nutrition',
                data_subtype: 'calories',
                value: nutrition.nutrients.calories,
                unit: 'kcal',
                start_time: new Date(parseInt(nutrition.startTimeMillis)),
                end_time: new Date(parseInt(nutrition.endTimeMillis)),
                source_provider: 'google_fit',
                source_device_id: nutrition.application ? nutrition.application.packageName : undefined,
                metadata: {
                    original_id: nutrition.id,
                    meal_type: nutrition.meal
                }
            });
        }

        // Add macronutrients
        const macronutrients = [
            { name: 'protein', value: nutrition.nutrients.protein, unit: 'g' },
            { name: 'carbohydrates', value: nutrition.nutrients.carbohydrates, unit: 'g' },
            { name: 'fat', value: nutrition.nutrients.fat, unit: 'g' },
            { name: 'fiber', value: nutrition.nutrients.fiber, unit: 'g' }
        ];

        macronutrients.forEach(macro => {
            if (macro.value > 0) {
                healthData.push({
                    user_id: userId,
                    data_type: 'nutrition',
                    data_subtype: macro.name,
                    value: macro.value,
                    unit: macro.unit,
                    start_time: new Date(parseInt(nutrition.startTimeMillis)),
                    end_time: new Date(parseInt(nutrition.endTimeMillis)),
                    source_provider: 'google_fit',
                    source_device_id: nutrition.application ? nutrition.application.packageName : undefined,
                    metadata: {
                        original_id: nutrition.id,
                        meal_type: nutrition.meal
                    }
                });
            }
        });
    });

    return healthData;
};

/**
 * Synchronize Google Fit data
 */
export const synchronizeGoogleFitData = async (
    userId: string,
    accessToken: string,
    startDate: Date,
    endDate: Date,
    activityService: any,
    sleepService: any,
    nutritionService: any,
    healthDataService: any
): Promise<{
    activities: number;
    sleep: number;
    nutrition: number;
    healthData: number;
}> => {
    // Import the Google Fit client
    const googleFitClient = require('./google-fit-client');

    // Get data from Google Fit
    const activities = await googleFitClient.getActivities(accessToken, startDate, endDate);
    const sleepData = await googleFitClient.getSleepData(accessToken, startDate, endDate);
    const nutritionData = await googleFitClient.getNutritionData(accessToken, startDate, endDate);

    // Map data to our format
    const mappedActivities = mapActivities(activities, userId);
    const mappedSleepData = mapSleepData(sleepData, userId);
    const mappedNutritionData = mapNutritionData(nutritionData, userId);

    // Map to health data for trends and aggregations
    const healthData = mapToHealthData(activities, sleepData, nutritionData, userId);

    // Save data to database
    const savedActivities = await activityService.bulkCreate(mappedActivities);
    const savedSleep = await sleepService.bulkCreate(mappedSleepData);
    const savedNutrition = await nutritionService.bulkCreate(mappedNutritionData);
    const savedHealthData = await healthDataService.bulkCreate(healthData);

    // Return counts of synchronized data
    return {
        activities: savedActivities.length,
        sleep: savedSleep.length,
        nutrition: savedNutrition.length,
        healthData: savedHealthData.length
    };
};