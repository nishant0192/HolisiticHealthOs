import { FitbitActivity, FitbitSleep, FitbitNutrition, FitbitHeartRateZone } from './types';
import { CreateActivityParams } from '../../models/activity.model';
import { CreateSleepParams } from '../../models/sleep.model';
import { CreateNutritionParams } from '../../models/nutrition.model';
import { CreateHealthDataParams } from '../../models/health-data.model';

// Helper function to calculate average heart rate from heart rate zones
const calculateAvgHeartRate = (heartRateZones: FitbitHeartRateZone[]): number => {
  let totalMinutes = 0;
  let weightedSum = 0;
  
  heartRateZones.forEach(zone => {
    if (zone.minutes > 0) {
      // Use the middle of the zone range as the average for that zone
      const zoneAvg = (zone.min + zone.max) / 2;
      weightedSum += zoneAvg * zone.minutes;
      totalMinutes += zone.minutes;
    }
  });
  
  return totalMinutes > 0 ? Math.round(weightedSum / totalMinutes) : 0;
};

// Helper function to find the max heart rate
const calculateMaxHeartRate = (heartRateZones: FitbitHeartRateZone[]): number => {
  // Find the highest max value from zones that had activity time
  return Math.max(...heartRateZones
    .filter(zone => zone.minutes > 0)
    .map(zone => zone.max));
};

// Helper function to map Fitbit sleep stages to our format
const mapSleepStage = (fitbitStage: string): string => {
  switch (fitbitStage.toLowerCase()) {
    case 'deep':
      return 'deep';
    case 'light':
      return 'light';
    case 'rem':
      return 'rem';
    case 'wake':
    case 'awake':
      return 'awake';
    default:
      return 'unknown';
  }
};

/**
 * Map Fitbit activities to our activity format
 */
export const mapActivities = (
  activities: FitbitActivity[],
  userId: string
): CreateActivityParams[] => {
  return activities.map(activity => ({
    user_id: userId,
    activity_type: activity.name.toLowerCase().replace(/ /g, '_'),
    start_time: new Date(activity.startTime),
    end_time: new Date(new Date(activity.startTime).getTime() + activity.duration),
    duration_seconds: Math.round(activity.duration / 1000),
    distance: activity.distance,
    distance_unit: activity.distanceUnit || 'km',
    calories_burned: activity.calories,
    steps: activity.steps,
    heart_rate_avg: activity.heartRateZones ? 
      calculateAvgHeartRate(activity.heartRateZones) : null,
    heart_rate_max: activity.heartRateZones ? 
      calculateMaxHeartRate(activity.heartRateZones) : null,
    source_provider: 'fitbit',
    source_device_id: activity.sourceDevice?.id || null,
    metadata: {
      original_id: activity.id,
      source_name: activity.sourceDevice?.name,
      source_type: activity.sourceDevice?.type,
      tcx_link: activity.tcxLink,
      heart_rate_zones: activity.heartRateZones
    }
  }));
};

/**
 * Map Fitbit sleep data to our sleep format
 */
export const mapSleepData = (
  sleepData: FitbitSleep[],
  userId: string
): CreateSleepParams[] => {
  return sleepData.map(sleep => ({
    user_id: userId,
    start_time: new Date(sleep.startTime),
    end_time: new Date(sleep.endTime),
    duration_seconds: Math.round(sleep.duration / 1000),
    sleep_stages: sleep.sleepStages.map(stage => ({
      stage: mapSleepStage(stage.stage),
      start_time: new Date(stage.startTime),
      end_time: new Date(new Date(stage.startTime).getTime() + stage.duration),
      duration_seconds: Math.round(stage.duration / 1000)
    })),
    quality: sleep.efficiency,
    source_provider: 'fitbit',
    source_device_id: sleep.sourceDevice?.id || null,
    metadata: {
      original_id: sleep.id,
      source_name: sleep.sourceDevice?.name,
      source_type: sleep.sourceDevice?.type,
      minutes_asleep: sleep.minutesAsleep,
      minutes_awake: sleep.minutesAwake,
      minutes_to_fall_asleep: sleep.minutesToFallAsleep,
      time_in_bed: sleep.timeInBed,
      is_main_sleep: sleep.isMainSleep
    }
  }));
};

/**
 * Map Fitbit nutrition data to our nutrition format
 */
export const mapNutritionData = (
  nutritionData: FitbitNutrition[],
  userId: string
): CreateNutritionParams[] => {
  return nutritionData.map(nutrition => ({
    user_id: userId,
    timestamp: new Date(nutrition.date),
    meal_type: nutrition.mealType,
    foods: nutrition.foods.map(food => ({
      name: food.name,
      quantity: food.amount,
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
    water_intake_ml: nutrition.waterConsumption,
    source_provider: 'fitbit',
    source_app_id: nutrition.sourceDevice?.id || null,
    metadata: {
      original_id: nutrition.id,
      source_name: nutrition.sourceDevice?.name,
      source_type: nutrition.sourceDevice?.type
    }
  }));
};

/**
 * Map Fitbit data to generic health data format for trends and aggregations
 */
export const mapToHealthData = (
  activities: FitbitActivity[],
  sleepData: FitbitSleep[],
  nutritionData: FitbitNutrition[],
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
        end_time: new Date(new Date(activity.startTime).getTime() + activity.duration),
        source_provider: 'fitbit',
        source_device_id: activity.sourceDevice?.id || null,
        metadata: {
          original_id: activity.id,
          activity_type: activity.name
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
        end_time: new Date(new Date(activity.startTime).getTime() + activity.duration),
        source_provider: 'fitbit',
        source_device_id: activity.sourceDevice?.id || null,
        metadata: {
          original_id: activity.id,
          activity_type: activity.name
        }
      });
    }

    // Add distance if available
    if (activity.distance && activity.distance > 0) {
      healthData.push({
        user_id: userId,
        data_type: 'activity',
        data_subtype: 'distance',
        value: activity.distance,
        unit: activity.distanceUnit || 'km',
        start_time: new Date(activity.startTime),
        end_time: new Date(new Date(activity.startTime).getTime() + activity.duration),
        source_provider: 'fitbit',
        source_device_id: activity.sourceDevice?.id || null,
        metadata: {
          original_id: activity.id,
          activity_type: activity.name
        }
      });
    }

    // Add heart rate if available
    if (activity.heartRateZones && activity.heartRateZones.length > 0) {
      const avgHeartRate = calculateAvgHeartRate(activity.heartRateZones);
      
      if (avgHeartRate > 0) {
        healthData.push({
          user_id: userId,
          data_type: 'vitals',
          data_subtype: 'heart_rate',
          value: avgHeartRate,
          unit: 'bpm',
          start_time: new Date(activity.startTime),
          end_time: new Date(new Date(activity.startTime).getTime() + activity.duration),
          source_provider: 'fitbit',
          source_device_id: activity.sourceDevice?.id || null,
          metadata: {
            original_id: activity.id,
            activity_type: activity.name
          }
        });
      }
    }
  });

  // Map sleep to health data
  sleepData.forEach(sleep => {
    healthData.push({
      user_id: userId,
      data_type: 'sleep',
      data_subtype: 'duration',
      value: sleep.duration / 3600000, // Convert to hours
      unit: 'hours',
      start_time: new Date(sleep.startTime),
      end_time: new Date(sleep.endTime),
      source_provider: 'fitbit',
      source_device_id: sleep.sourceDevice?.id || null,
      metadata: {
        original_id: sleep.id,
        efficiency: sleep.efficiency
      }
    });
    
    // Add sleep efficiency
    if (sleep.efficiency) {
      healthData.push({
        user_id: userId,
        data_type: 'sleep',
        data_subtype: 'efficiency',
        value: sleep.efficiency,
        unit: 'percent',
        start_time: new Date(sleep.startTime),
        end_time: new Date(sleep.endTime),
        source_provider: 'fitbit',
        source_device_id: sleep.sourceDevice?.id || null,
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
        (sum, stage) => sum + stage.duration, 0) / 3600000; // Convert to hours
      
      healthData.push({
        user_id: userId,
        data_type: 'sleep',
        data_subtype: 'deep_sleep',
        value: deepSleepDuration,
        unit: 'hours',
        start_time: new Date(sleep.startTime),
        end_time: new Date(sleep.endTime),
        source_provider: 'fitbit',
        source_device_id: sleep.sourceDevice?.id || null,
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
        (sum, stage) => sum + stage.duration, 0) / 3600000; // Convert to hours
      
      healthData.push({
        user_id: userId,
        data_type: 'sleep',
        data_subtype: 'rem_sleep',
        value: remSleepDuration,
        unit: 'hours',
        start_time: new Date(sleep.startTime),
        end_time: new Date(sleep.endTime),
        source_provider: 'fitbit',
        source_device_id: sleep.sourceDevice?.id || null,
        metadata: {
          original_id: sleep.id
        }
      });
    }
  });

  // Map nutrition to health data
  nutritionData.forEach(nutrition => {
    // Add calories
    if (nutrition.totalCalories > 0) {
      healthData.push({
        user_id: userId,
        data_type: 'nutrition',
        data_subtype: 'calories',
        value: nutrition.totalCalories,
        unit: 'kcal',
        start_time: new Date(nutrition.date),
        source_provider: 'fitbit',
        source_app_id: nutrition.sourceDevice?.id || null,
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
        start_time: new Date(nutrition.date),
        source_provider: 'fitbit',
        source_app_id: nutrition.sourceDevice?.id || null,
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
        start_time: new Date(nutrition.date),
        source_provider: 'fitbit',
        source_app_id: nutrition.sourceDevice?.id || null,
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
        start_time: new Date(nutrition.date),
        source_provider: 'fitbit',
        source_app_id: nutrition.sourceDevice?.id || null,
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
        start_time: new Date(nutrition.date),
        source_provider: 'fitbit',
        source_app_id: nutrition.sourceDevice?.id || null,
        metadata: {
          original_id: nutrition.id,
          meal_type: nutrition.mealType
        }
      });
    }

    // Add water intake if available
    if (nutrition.waterConsumption && nutrition.waterConsumption > 0) {
      healthData.push({
        user_id: userId,
        data_type: 'nutrition',
        data_subtype: 'water',
        value: nutrition.waterConsumption,
        unit: 'ml',
        start_time: new Date(nutrition.date),
        source_provider: 'fitbit',
        source_app_id: nutrition.sourceDevice?.id || null,
        metadata: {
          original_id: nutrition.id
        }
      });
    }
  });

  return healthData;
};