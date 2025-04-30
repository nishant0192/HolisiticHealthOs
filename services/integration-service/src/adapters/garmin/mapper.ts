import { GarminActivity, GarminSleep, GarminNutrition } from './types';
import { CreateActivityParams } from '../../models/activity.model';
import { CreateSleepParams } from '../../models/sleep.model';
import { CreateNutritionParams } from '../../models/nutrition.model';
import { CreateHealthDataParams } from '../../models/health-data.model';

// Helper function to map Garmin sleep stages to our format
const mapSleepStage = (garminStage: string): string => {
  switch (garminStage.toLowerCase()) {
    case 'deep':
      return 'deep';
    case 'light':
      return 'light';
    case 'rem':
      return 'rem';
    case 'awake':
      return 'awake';
    default:
      return 'unknown';
  }
};

/**
 * Map Garmin activities to our activity format
 */
export const mapActivities = (
  activities: GarminActivity[],
  userId: string
): CreateActivityParams[] => {
  return activities.map(activity => ({
    user_id: userId,
    activity_type: activity.type.toLowerCase().replace(/ /g, '_'),
    start_time: new Date(activity.startTime),
    end_time: new Date(activity.startTime + (activity.durationInSeconds * 1000)),
    duration_seconds: activity.durationInSeconds,
    distance: activity.distanceInMeters ? activity.distanceInMeters / 1000 : undefined, // Convert meters to km
    distance_unit: 'km',
    calories_burned: activity.calories,
    steps: activity.steps,
    heart_rate_avg: activity.averageHeartRate,
    heart_rate_max: activity.maxHeartRate,
    source_provider: 'garmin',
    source_device_id: activity.deviceName,
    metadata: {
      original_id: activity.id,
      source_name: activity.deviceName,
      activity_name: activity.name
    }
  }));
};

/**
 * Map Garmin sleep data to our sleep format
 */
export const mapSleepData = (
  sleepData: GarminSleep[],
  userId: string
): CreateSleepParams[] => {
  return sleepData.map(sleep => ({
    user_id: userId,
    start_time: new Date(sleep.startTimeInSeconds * 1000),
    end_time: new Date(sleep.endTimeInSeconds * 1000),
    duration_seconds: sleep.durationInSeconds,
    sleep_stages: sleep.sleepStages.map(stage => ({
      stage: mapSleepStage(stage.stage),
      start_time: new Date(stage.startTimeInSeconds * 1000),
      end_time: new Date(stage.endTimeInSeconds * 1000),
      duration_seconds: stage.durationInSeconds
    })),
    quality: sleep.sleepQualityScore || undefined,
    source_provider: 'garmin',
    source_device_id: sleep.deviceName,
    metadata: {
      original_id: sleep.id,
      source_name: sleep.deviceName,
      unmeasurable_sleep: sleep.unmeasurableSleep,
      validation_time: sleep.validationTime
    }
  }));
};

/**
 * Map Garmin nutrition data to our nutrition format
 */
export const mapNutritionData = (
  nutritionData: GarminNutrition[],
  userId: string
): CreateNutritionParams[] => {
  return nutritionData.map(nutrition => ({
    user_id: userId,
    timestamp: new Date(nutrition.date),
    meal_type: nutrition.mealType,
    foods: nutrition.foods.map(food => ({
      name: food.name,
      quantity: food.quantity,
      unit: food.unit,
      calories: food.calories,
      macronutrients: {
        protein: food.nutrients.protein,
        carbohydrates: food.nutrients.carbs,
        fat: food.nutrients.fat,
        fiber: food.nutrients.fiber
      }
    })),
    total_calories: nutrition.totalCalories,
    total_macronutrients: {
      protein: nutrition.totalNutrients.protein,
      carbohydrates: nutrition.totalNutrients.carbs,
      fat: nutrition.totalNutrients.fat,
      fiber: nutrition.totalNutrients.fiber
    },
    water_intake_ml: nutrition.waterIntake,
    source_provider: 'garmin',
    source_app_id: nutrition.deviceName,
    metadata: {
      original_id: nutrition.id,
      source_name: nutrition.deviceName
    }
  }));
};

/**
 * Map Garmin data to generic health data format for trends and aggregations
 */
export const mapToHealthData = (
  activities: GarminActivity[],
  sleepData: GarminSleep[],
  nutritionData: GarminNutrition[],
  userId: string
): CreateHealthDataParams[] => {
  const healthData: CreateHealthDataParams[] = [];

  // Map activities to health data
  activities.forEach(activity => {
    // Add steps if available
    if (activity.steps && activity.steps > 0) {
      healthData.push({
        user_id: userId,
        data_type: 'activity',
        data_subtype: 'steps',
        value: activity.steps,
        unit: 'count',
        start_time: new Date(activity.startTime),
        end_time: new Date(activity.startTime + (activity.durationInSeconds * 1000)),
        source_provider: 'garmin',
        source_device_id: activity.deviceName,
        metadata: {
          original_id: activity.id,
          activity_type: activity.type
        }
      });
    }

    // Add calories if available
    if (activity.calories && activity.calories > 0) {
      healthData.push({
        user_id: userId,
        data_type: 'activity',
        data_subtype: 'calories',
        value: activity.calories,
        unit: 'kcal',
        start_time: new Date(activity.startTime),
        end_time: new Date(activity.startTime + (activity.durationInSeconds * 1000)),
        source_provider: 'garmin',
        source_device_id: activity.deviceName,
        metadata: {
          original_id: activity.id,
          activity_type: activity.type
        }
      });
    }

    // Add distance if available
    if (activity.distanceInMeters && activity.distanceInMeters > 0) {
      healthData.push({
        user_id: userId,
        data_type: 'activity',
        data_subtype: 'distance',
        value: activity.distanceInMeters / 1000, // Convert to km
        unit: 'km',
        start_time: new Date(activity.startTime),
        end_time: new Date(activity.startTime + (activity.durationInSeconds * 1000)),
        source_provider: 'garmin',
        source_device_id: activity.deviceName,
        metadata: {
          original_id: activity.id,
          activity_type: activity.type
        }
      });
    }

    // Add heart rate if available
    if (activity.averageHeartRate && activity.averageHeartRate > 0) {
      healthData.push({
        user_id: userId,
        data_type: 'vitals',
        data_subtype: 'heart_rate',
        value: activity.averageHeartRate,
        unit: 'bpm',
        start_time: new Date(activity.startTime),
        end_time: new Date(activity.startTime + (activity.durationInSeconds * 1000)),
        source_provider: 'garmin',
        source_device_id: activity.deviceName,
        metadata: {
          original_id: activity.id,
          activity_type: activity.type,
          max_heart_rate: activity.maxHeartRate
        }
      });
    }
  });

  // Map sleep to health data
  sleepData.forEach(sleep => {
    const startTime = new Date(sleep.startTimeInSeconds * 1000);
    const endTime = new Date(sleep.endTimeInSeconds * 1000);

    healthData.push({
      user_id: userId,
      data_type: 'sleep',
      data_subtype: 'duration',
      value: sleep.durationInSeconds / 3600, // Convert to hours
      unit: 'hours',
      start_time: startTime,
      end_time: endTime,
      source_provider: 'garmin',
      source_device_id: sleep.deviceName,
      metadata: {
        original_id: sleep.id,
        sleep_quality: sleep.sleepQualityScore
      }
    });
    
    // Add sleep quality if available
    if (sleep.sleepQualityScore) {
      healthData.push({
        user_id: userId,
        data_type: 'sleep',
        data_subtype: 'quality',
        value: sleep.sleepQualityScore,
        unit: 'score',
        start_time: startTime,
        end_time: endTime,
        source_provider: 'garmin',
        source_device_id: sleep.deviceName,
        metadata: {
          original_id: sleep.id
        }
      });
    }
    
    // Add deep sleep duration if available
    const deepSleepStages = sleep.sleepStages.filter(stage => 
      mapSleepStage(stage.stage) === 'deep');
    
    if (deepSleepStages.length > 0) {
      const deepSleepDuration = deepSleepStages.reduce(
        (sum, stage) => sum + stage.durationInSeconds, 0) / 3600; // Convert to hours
      
      healthData.push({
        user_id: userId,
        data_type: 'sleep',
        data_subtype: 'deep_sleep',
        value: deepSleepDuration,
        unit: 'hours',
        start_time: startTime,
        end_time: endTime,
        source_provider: 'garmin',
        source_device_id: sleep.deviceName,
        metadata: {
          original_id: sleep.id
        }
      });
    }
    
    // Add REM sleep duration if available
    const remSleepStages = sleep.sleepStages.filter(stage => 
      mapSleepStage(stage.stage) === 'rem');
    
    if (remSleepStages.length > 0) {
      const remSleepDuration = remSleepStages.reduce(
        (sum, stage) => sum + stage.durationInSeconds, 0) / 3600; // Convert to hours
      
      healthData.push({
        user_id: userId,
        data_type: 'sleep',
        data_subtype: 'rem_sleep',
        value: remSleepDuration,
        unit: 'hours',
        start_time: startTime,
        end_time: endTime,
        source_provider: 'garmin',
        source_device_id: sleep.deviceName,
        metadata: {
          original_id: sleep.id
        }
      });
    }
  });

  // Map nutrition to health data
  nutritionData.forEach(nutrition => {
    const date = new Date(nutrition.date);
    
    // Add calories
    if (nutrition.totalCalories > 0) {
      healthData.push({
        user_id: userId,
        data_type: 'nutrition',
        data_subtype: 'calories',
        value: nutrition.totalCalories,
        unit: 'kcal',
        start_time: date,
        source_provider: 'garmin',
        source_app_id: nutrition.deviceName,
        metadata: {
          original_id: nutrition.id,
          meal_type: nutrition.mealType
        }
      });
    }

    // Add protein
    if (nutrition.totalNutrients.protein > 0) {
      healthData.push({
        user_id: userId,
        data_type: 'nutrition',
        data_subtype: 'protein',
        value: nutrition.totalNutrients.protein,
        unit: 'g',
        start_time: date,
        source_provider: 'garmin',
        source_app_id: nutrition.deviceName,
        metadata: {
          original_id: nutrition.id,
          meal_type: nutrition.mealType
        }
      });
    }

    // Add carbs
    if (nutrition.totalNutrients.carbs > 0) {
      healthData.push({
        user_id: userId,
        data_type: 'nutrition',
        data_subtype: 'carbohydrates',
        value: nutrition.totalNutrients.carbs,
        unit: 'g',
        start_time: date,
        source_provider: 'garmin',
        source_app_id: nutrition.deviceName,
        metadata: {
          original_id: nutrition.id,
          meal_type: nutrition.mealType
        }
      });
    }

    // Add fat
    if (nutrition.totalNutrients.fat > 0) {
      healthData.push({
        user_id: userId,
        data_type: 'nutrition',
        data_subtype: 'fat',
        value: nutrition.totalNutrients.fat,
        unit: 'g',
        start_time: date,
        source_provider: 'garmin',
        source_app_id: nutrition.deviceName,
        metadata: {
          original_id: nutrition.id,
          meal_type: nutrition.mealType
        }
      });
    }

    // Add fiber
    if (nutrition.totalNutrients.fiber > 0) {
      healthData.push({
        user_id: userId,
        data_type: 'nutrition',
        data_subtype: 'fiber',
        value: nutrition.totalNutrients.fiber,
        unit: 'g',
        start_time: date,
        source_provider: 'garmin',
        source_app_id: nutrition.deviceName,
        metadata: {
          original_id: nutrition.id,
          meal_type: nutrition.mealType
        }
      });
    }

    // Add water intake if available
    if (nutrition.waterIntake && nutrition.waterIntake > 0) {
      healthData.push({
        user_id: userId,
        data_type: 'nutrition',
        data_subtype: 'water',
        value: nutrition.waterIntake,
        unit: 'ml',
        start_time: date,
        source_provider: 'garmin',
        source_app_id: nutrition.deviceName,
        metadata: {
          original_id: nutrition.id
        }
      });
    }
  });

  return healthData;
};