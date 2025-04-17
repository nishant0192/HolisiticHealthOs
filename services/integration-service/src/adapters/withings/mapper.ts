import {
    WithingsActivity,
    WithingsSleep,
    WithingsNutrition
  } from './types';
  import { CreateActivityParams } from '../../models/activity.model';
  import { CreateSleepParams } from '../../models/sleep.model';
  import { CreateNutritionParams } from '../../models/nutrition.model';
  import { CreateHealthDataParams } from '../../models/health-data.model';
  
  // Helper function to map Withings sleep stages to our format
  const mapSleepStage = (withingsState: number): string => {
    switch (withingsState) {
      case 0:
        return 'awake';
      case 1:
        return 'light';
      case 2:
        return 'deep';
      case 3:
        return 'rem';
      default:
        return 'unknown';
    }
  };
  
  /**
   * Map Withings activities to our activity format
   */
  export const mapActivities = (
    activities: WithingsActivity[],
    userId: string
  ): CreateActivityParams[] => {
    return activities.map(activity => ({
      user_id: userId,
      activity_type: activity.category.toLowerCase().replace(/ /g, '_'),
      start_time: new Date(activity.startdate * 1000),
      end_time: new Date(activity.enddate * 1000),
      duration_seconds: activity.duration,
      distance: activity.distance / 1000, // Convert meters to km
      distance_unit: 'km',
      calories_burned: activity.calories,
      steps: activity.steps,
      heart_rate_avg: activity.hr_average,
      heart_rate_max: activity.hr_max,
      source_provider: 'withings',
      source_device_id: activity.deviceid,
      metadata: {
        original_id: activity.id,
        elevation: activity.elevation,
        hr_min: activity.hr_min
      }
    }));
  };
  
  /**
   * Map Withings sleep data to our sleep format
   */
  export const mapSleepData = (
    sleepData: WithingsSleep[],
    userId: string
  ): CreateSleepParams[] => {
    return sleepData.map(sleep => ({
      user_id: userId,
      start_time: new Date(sleep.startdate * 1000),
      end_time: new Date(sleep.enddate * 1000),
      duration_seconds: sleep.duration,
      sleep_stages: sleep.data.map(stage => ({
        stage: mapSleepStage(stage.state),
        start_time: new Date(stage.startdate * 1000),
        end_time: new Date(stage.enddate * 1000),
        duration_seconds: stage.duration
      })),
      source_provider: 'withings',
      source_device_id: sleep.deviceid,
      metadata: {
        original_id: sleep.id.toString(),
        model: sleep.model,
        model_id: sleep.model_id,
        timezone: sleep.timezone
      }
    }));
  };
  
  /**
   * Map Withings nutrition data to our nutrition format
   */
  export const mapNutritionData = (
    nutritionData: WithingsNutrition[],
    userId: string
  ): CreateNutritionParams[] => {
    const mappedData: CreateNutritionParams[] = [];
    
    // Each nutrition entry may have multiple meals
    nutritionData.forEach(nutrition => {
      nutrition.meals.forEach(meal => {
        let mealType = 'unknown';
        
        // Map meal category to meal type
        switch (meal.category) {
          case 1:
            mealType = 'breakfast';
            break;
          case 2:
            mealType = 'lunch';
            break;
          case 3:
            mealType = 'dinner';
            break;
          case 4:
            mealType = 'snack';
            break;
        }
        
        // Calculate total calories
        const totalCalories = meal.foodItems.reduce((sum, food) => sum + food.calories, 0);
        
        mappedData.push({
          user_id: userId,
          timestamp: new Date(meal.date * 1000),
          meal_type: mealType,
          foods: meal.foodItems.map(food => ({
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
          total_calories: totalCalories,
          total_macronutrients: {
            protein: meal.nutrients.protein,
            carbohydrates: meal.nutrients.carbs,
            fat: meal.nutrients.fat,
            fiber: meal.nutrients.fiber
          },
          water_intake_ml: nutrition.waterIntake,
          source_provider: 'withings',
          source_app_id: 'withings_app',
          metadata: {
            original_id: `${nutrition.id}_${meal.id}`,
            created: nutrition.created,
            modified: nutrition.modified
          }
        });
      });
    });
    
    return mappedData;
  };
  
  /**
   * Map Withings data to generic health data format for trends and aggregations
   */
  export const mapToHealthData = (
    activities: WithingsActivity[],
    sleepData: WithingsSleep[],
    nutritionData: WithingsNutrition[],
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
          start_time: new Date(activity.startdate * 1000),
          end_time: new Date(activity.enddate * 1000),
          source_provider: 'withings',
          source_device_id: activity.deviceid,
          metadata: {
            original_id: activity.id,
            activity_type: activity.category
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
          start_time: new Date(activity.startdate * 1000),
          end_time: new Date(activity.enddate * 1000),
          source_provider: 'withings',
          source_device_id: activity.deviceid,
          metadata: {
            original_id: activity.id,
            activity_type: activity.category
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
          start_time: new Date(activity.startdate * 1000),
          end_time: new Date(activity.enddate * 1000),
          source_provider: 'withings',
          source_device_id: activity.deviceid,
          metadata: {
            original_id: activity.id,
            activity_type: activity.category
          }
        });
      }
  
      // Add heart rate if available
      if (activity.hr_average && activity.hr_average > 0) {
        healthData.push({
          user_id: userId,
          data_type: 'vitals',
          data_subtype: 'heart_rate',
          value: activity.hr_average,
          unit: 'bpm',
          start_time: new Date(activity.startdate * 1000),
          end_time: new Date(activity.enddate * 1000),
          source_provider: 'withings',
          source_device_id: activity.deviceid,
          metadata: {
            original_id: activity.id,
            activity_type: activity.category,
            hr_max: activity.hr_max,
            hr_min: activity.hr_min
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
        value: sleep.duration / 3600, // Convert seconds to hours
        unit: 'hours',
        start_time: new Date(sleep.startdate * 1000),
        end_time: new Date(sleep.enddate * 1000),
        source_provider: 'withings',
        source_device_id: sleep.deviceid,
        metadata: {
          original_id: sleep.id.toString(),
          model: sleep.model
        }
      });
      
      // Add deep sleep duration if available
      const deepSleepStages = sleep.data.filter(stage => stage.state === 2);
      if (deepSleepStages.length > 0) {
        const deepSleepDuration = deepSleepStages.reduce(
          (sum, stage) => sum + stage.duration, 0) / 3600; // Convert to hours
        
        healthData.push({
          user_id: userId,
          data_type: 'sleep',
          data_subtype: 'deep_sleep',
          value: deepSleepDuration,
          unit: 'hours',
          start_time: new Date(sleep.startdate * 1000),
          end_time: new Date(sleep.enddate * 1000),
          source_provider: 'withings',
          source_device_id: sleep.deviceid,
          metadata: {
            original_id: sleep.id.toString()
          }
        });
      }
      
      // Add REM sleep duration if available
      const remSleepStages = sleep.data.filter(stage => stage.state === 3);
      if (remSleepStages.length > 0) {
        const remSleepDuration = remSleepStages.reduce(
          (sum, stage) => sum + stage.duration, 0) / 3600; // Convert to hours
        
        healthData.push({
          user_id: userId,
          data_type: 'sleep',
          data_subtype: 'rem_sleep',
          value: remSleepDuration,
          unit: 'hours',
          start_time: new Date(sleep.startdate * 1000),
          end_time: new Date(sleep.enddate * 1000),
          source_provider: 'withings',
          source_device_id: sleep.deviceid,
          metadata: {
            original_id: sleep.id.toString()
          }
        });
      }
    });
  
    // Map nutrition to health data
    nutritionData.forEach(nutrition => {
      // Process each meal
      nutrition.meals.forEach(meal => {
        // Add calories
        healthData.push({
          user_id: userId,
          data_type: 'nutrition',
          data_subtype: 'calories',
          value: meal.foodItems.reduce((sum, food) => sum + food.calories, 0),
          unit: 'kcal',
          start_time: new Date(meal.date * 1000),
          source_provider: 'withings',
          source_app_id: 'withings_app',
          metadata: {
            original_id: `${nutrition.id}_${meal.id}`,
            meal_type: ['breakfast', 'lunch', 'dinner', 'snack'][meal.category - 1] || 'unknown'
          }
        });
  
        // Add carbs
        if (meal.nutrients.carbs > 0) {
          healthData.push({
            user_id: userId,
            data_type: 'nutrition',
            data_subtype: 'carbohydrates',
            value: meal.nutrients.carbs,
            unit: 'g',
            start_time: new Date(meal.date * 1000),
            source_provider: 'withings',
            source_app_id: 'withings_app',
            metadata: {
              original_id: `${nutrition.id}_${meal.id}`,
              meal_type: ['breakfast', 'lunch', 'dinner', 'snack'][meal.category - 1] || 'unknown'
            }
          });
        }
  
        // Add protein
        if (meal.nutrients.protein > 0) {
          healthData.push({
            user_id: userId,
            data_type: 'nutrition',
            data_subtype: 'protein',
            value: meal.nutrients.protein,
            unit: 'g',
            start_time: new Date(meal.date * 1000),
            source_provider: 'withings',
            source_app_id: 'withings_app',
            metadata: {
              original_id: `${nutrition.id}_${meal.id}`,
              meal_type: ['breakfast', 'lunch', 'dinner', 'snack'][meal.category - 1] || 'unknown'
            }
          });
        }
  
        // Add fat
        if (meal.nutrients.fat > 0) {
          healthData.push({
            user_id: userId,
            data_type: 'nutrition',
            data_subtype: 'fat',
            value: meal.nutrients.fat,
            unit: 'g',
            start_time: new Date(meal.date * 1000),
            source_provider: 'withings',
            source_app_id: 'withings_app',
            metadata: {
              original_id: `${nutrition.id}_${meal.id}`,
              meal_type: ['breakfast', 'lunch', 'dinner', 'snack'][meal.category - 1] || 'unknown'
            }
          });
        }
  
        // Add fiber
        if (meal.nutrients.fiber > 0) {
          healthData.push({
            user_id: userId,
            data_type: 'nutrition',
            data_subtype: 'fiber',
            value: meal.nutrients.fiber,
            unit: 'g',
            start_time: new Date(meal.date * 1000),
            source_provider: 'withings',
            source_app_id: 'withings_app',
            metadata: {
              original_id: `${nutrition.id}_${meal.id}`,
              meal_type: ['breakfast', 'lunch', 'dinner', 'snack'][meal.category - 1] || 'unknown'
            }
          });
        }
  
        // Add sodium
        if (meal.nutrients.sodium > 0) {
          healthData.push({
            user_id: userId,
            data_type: 'nutrition',
            data_subtype: 'sodium',
            value: meal.nutrients.sodium,
            unit: 'mg',
            start_time: new Date(meal.date * 1000),
            source_provider: 'withings',
            source_app_id: 'withings_app',
            metadata: {
              original_id: `${nutrition.id}_${meal.id}`,
              meal_type: ['breakfast', 'lunch', 'dinner', 'snack'][meal.category - 1] || 'unknown'
            }
          });
        }
      });
  
      // Add water intake if available
      if (nutrition.waterIntake && nutrition.waterIntake > 0) {
        healthData.push({
          user_id: userId,
          data_type: 'nutrition',
          data_subtype: 'water',
          value: nutrition.waterIntake,
          unit: 'ml',
          start_time: new Date(nutrition.date * 1000),
          source_provider: 'withings',
          source_app_id: 'withings_app',
          metadata: {
            original_id: nutrition.id.toString()
          }
        });
      }
    });
  
    return healthData;
  };