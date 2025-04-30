import { 
    SamsungHealthActivity, 
    SamsungHealthSleep, 
    SamsungHealthNutrition 
  } from './types';
  import { CreateActivityParams } from '../../models/activity.model';
  import { CreateSleepParams } from '../../models/sleep.model';
  import { CreateNutritionParams } from '../../models/nutrition.model';
  import { CreateHealthDataParams } from '../../models/health-data.model';
  
  // Helper function to map Samsung Health sleep stages to our format
  const mapSleepStage = (samsungStage: string): string => {
    switch (samsungStage.toLowerCase()) {
      case 'deep':
        return 'deep';
      case 'light':
        return 'light';
      case 'rem':
        return 'rem';
      case 'awake':
      case 'wake':
        return 'awake';
      default:
        return 'unknown';
    }
  };
  
  /**
   * Map Samsung Health activities to our activity format
   */
  export const mapActivities = (
    activities: SamsungHealthActivity[],
    userId: string
  ): CreateActivityParams[] => {
    return activities.map(activity => ({
      user_id: userId,
      activity_type: activity.type.toLowerCase().replace(/ /g, '_'),
      start_time: new Date(activity.startTime),
      end_time: new Date(activity.endTime),
      duration_seconds: activity.duration / 1000, // Convert milliseconds to seconds
      distance: activity.distance ? activity.distance / 1000 : undefined, // Convert meters to km
      distance_unit: 'km',
      calories_burned: activity.calories,
      steps: activity.steps,
      source_provider: 'samsung_health',
      source_device_id: activity.device?.uuid,
      metadata: {
        original_id: activity.id,
        source_name: activity.device?.name,
        source_model: activity.device?.model,
        source_manufacturer: activity.device?.manufacturer
      }
    }));
  };
  
  /**
   * Map Samsung Health sleep data to our sleep format
   */
  export const mapSleepData = (
    sleepData: SamsungHealthSleep[],
    userId: string
  ): CreateSleepParams[] => {
    return sleepData.map(sleep => ({
      user_id: userId,
      start_time: new Date(sleep.startTime),
      end_time: new Date(sleep.endTime),
      duration_seconds: sleep.duration / 1000, // Convert milliseconds to seconds
      sleep_stages: sleep.stages.map(stage => ({
        stage: mapSleepStage(stage.stage),
        start_time: new Date(stage.startTime),
        end_time: new Date(stage.endTime),
        duration_seconds: stage.duration / 1000 // Convert milliseconds to seconds
      })),
      quality: sleep.quality,
      source_provider: 'samsung_health',
      source_device_id: sleep.device?.uuid,
      metadata: {
        original_id: sleep.id,
        source_name: sleep.device?.name,
        source_model: sleep.device?.model,
        source_manufacturer: sleep.device?.manufacturer
      }
    }));
  };
  
  /**
   * Map Samsung Health nutrition data to our nutrition format
   */
  export const mapNutritionData = (
    nutritionData: SamsungHealthNutrition[],
    userId: string
  ): CreateNutritionParams[] => {
    return nutritionData.map(nutrition => ({
      user_id: userId,
      timestamp: new Date(nutrition.timestamp),
      meal_type: nutrition.mealType,
      foods: nutrition.foodItems.map(food => ({
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
      source_provider: 'samsung_health',
      source_app_id: `${nutrition.device?.manufacturer}_${nutrition.device?.model}`,
      metadata: {
        original_id: nutrition.id,
        source_name: nutrition.device?.name,
        source_model: nutrition.device?.model,
        source_manufacturer: nutrition.device?.manufacturer
      }
    }));
  };
  
  /**
   * Map Samsung Health data to generic health data format for trends and aggregations
   */
  export const mapToHealthData = (
    activities: SamsungHealthActivity[],
    sleepData: SamsungHealthSleep[],
    nutritionData: SamsungHealthNutrition[],
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
          end_time: new Date(activity.endTime),
          source_provider: 'samsung_health',
          source_device_id: activity.device?.uuid,
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
          end_time: new Date(activity.endTime),
          source_provider: 'samsung_health',
          source_device_id: activity.device?.uuid,
          metadata: {
            original_id: activity.id,
            activity_type: activity.type
          }
        });
      }
  
      // Add distance if available
      if (activity.distance && activity.distance > 0) {
        healthData.push({
          user_id: userId,
          data_type: 'activity',
          data_subtype: 'distance',
          value: activity.distance / 1000, // Convert meters to km
          unit: 'km',
          start_time: new Date(activity.startTime),
          end_time: new Date(activity.endTime),
          source_provider: 'samsung_health',
          source_device_id: activity.device?.uuid,
          metadata: {
            original_id: activity.id,
            activity_type: activity.type
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
        value: sleep.duration / 3600000, // Convert milliseconds to hours
        unit: 'hours',
        start_time: new Date(sleep.startTime),
        end_time: new Date(sleep.endTime),
        source_provider: 'samsung_health',
        source_device_id: sleep.device?.uuid,
        metadata: {
          original_id: sleep.id,
          quality: sleep.quality
        }
      });
      
      // Add sleep quality if available
      if (sleep.quality) {
        healthData.push({
          user_id: userId,
          data_type: 'sleep',
          data_subtype: 'quality',
          value: sleep.quality,
          unit: 'score',
          start_time: new Date(sleep.startTime),
          end_time: new Date(sleep.endTime),
          source_provider: 'samsung_health',
          source_device_id: sleep.device?.uuid,
          metadata: {
            original_id: sleep.id
          }
        });
      }
      
      // Add deep sleep duration if available
      const deepSleepStages = sleep.stages.filter(stage => stage.stage.toLowerCase() === 'deep');
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
          source_provider: 'samsung_health',
          source_device_id: sleep.device?.uuid,
          metadata: {
            original_id: sleep.id
          }
        });
      }
      
      // Add REM sleep duration if available
      const remSleepStages = sleep.stages.filter(stage => stage.stage.toLowerCase() === 'rem');
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
          source_provider: 'samsung_health',
          source_device_id: sleep.device?.uuid,
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
          start_time: new Date(nutrition.timestamp),
          source_provider: 'samsung_health',
          source_app_id: `${nutrition.device?.manufacturer}_${nutrition.device?.model}`,
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
          start_time: new Date(nutrition.timestamp),
          source_provider: 'samsung_health',
          source_app_id: `${nutrition.device?.manufacturer}_${nutrition.device?.model}`,
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
          start_time: new Date(nutrition.timestamp),
          source_provider: 'samsung_health',
          source_app_id: `${nutrition.device?.manufacturer}_${nutrition.device?.model}`,
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
          start_time: new Date(nutrition.timestamp),
          source_provider: 'samsung_health',
          source_app_id: `${nutrition.device?.manufacturer}_${nutrition.device?.model}`,
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
          start_time: new Date(nutrition.timestamp),
          source_provider: 'samsung_health',
          source_app_id: `${nutrition.device?.manufacturer}_${nutrition.device?.model}`,
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
          start_time: new Date(nutrition.timestamp),
          source_provider: 'samsung_health',
          source_app_id: `${nutrition.device?.manufacturer}_${nutrition.device?.model}`,
          metadata: {
            original_id: nutrition.id
          }
        });
      }
    });
  
    return healthData;
  };