import axios from 'axios';
import querystring from 'querystring';
import { appConfig } from '../../config';
import { logger } from '../../middlewares/logging.middleware';
import { FitbitToken, FitbitProfile, FitbitActivity, FitbitSleep, FitbitNutrition } from './types';
import { rateLimiter } from '../../utils/rate-limiter';

const BASE_URL = 'https://api.fitbit.com';
const API_VERSION = '1.2';

/**
 * Exchange authorization code for access token
 */
export const getAccessToken = async (code: string): Promise<FitbitToken> => {
  try {
    // Use rate limiter to avoid hitting Fitbit API limits
    await rateLimiter.consume('fitbit-token', 1);

    const params = {
      code,
      grant_type: 'authorization_code',
      client_id: appConfig.providers.fitbit.clientId,
      redirect_uri: appConfig.providers.fitbit.redirectUri
    };
    
    // Fitbit requires client ID and secret in Authorization header
    const auth = Buffer.from(
      `${appConfig.providers.fitbit.clientId}:${appConfig.providers.fitbit.clientSecret}`
    ).toString('base64');
    
    const response = await axios.post(`${BASE_URL}/oauth2/token`, querystring.stringify(params), {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error('Error in getAccessToken (Fitbit):', error);
    throw error;
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<FitbitToken> => {
  try {
    // Use rate limiter to avoid hitting Fitbit API limits
    await rateLimiter.consume('fitbit-token', 1);

    const params = {
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    };
    
    // Fitbit requires client ID and secret in Authorization header
    const auth = Buffer.from(
      `${appConfig.providers.fitbit.clientId}:${appConfig.providers.fitbit.clientSecret}`
    ).toString('base64');
    
    const response = await axios.post(`${BASE_URL}/oauth2/token`, querystring.stringify(params), {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error('Error in refreshAccessToken (Fitbit):', error);
    throw error;
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async (accessToken: string): Promise<FitbitProfile> => {
  try {
    // Use rate limiter
    await rateLimiter.consume('fitbit-api', 1);

    const response = await axios.get(`${BASE_URL}/${API_VERSION}/user/-/profile.json`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const { user } = response.data;
    
    return {
      id: user.encodedId,
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      memberSince: user.memberSince
    };
  } catch (error) {
    logger.error('Error in getUserProfile (Fitbit):', error);
    throw error;
  }
};

/**
 * Get activities
 */
export const getActivities = async (
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<FitbitActivity[]> => {
  try {
    // Format dates as required by Fitbit API (yyyy-MM-dd)
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    
    // Use rate limiter
    await rateLimiter.consume('fitbit-api', 1);

    // Get activity list for date range
    const response = await axios.get(
      `${BASE_URL}/${API_VERSION}/user/-/activities/list.json?beforeDate=${formattedEndDate}&offset=0&limit=100&sort=desc&afterDate=${formattedStartDate}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    const activities: FitbitActivity[] = [];
    
    // Process the activities
    for (const activity of response.data.activities) {
      await rateLimiter.consume('fitbit-api', 1);
      
      // Get detailed activity info if needed
      // const detailResponse = await axios.get(
      //   `${BASE_URL}/${API_VERSION}/user/-/activities/${activity.logId}.json`,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${accessToken}`
      //     }
      //   }
      // );
      
      // const activityDetail = detailResponse.data;
      
      activities.push({
        id: activity.logId.toString(),
        name: activity.activityName,
        activityType: activity.activityTypeId,
        startTime: activity.startTime,
        duration: activity.duration,
        distance: activity.distance,
        distanceUnit: 'km',
        calories: activity.calories,
        steps: activity.steps,
        heartRateZones: activity.heartRateZones || [],
        tcxLink: activity.tcxLink,
        source: activity.source,
        sourceDevice: {
          id: activity.source.id,
          name: activity.source.name,
          type: activity.source.type
        }
      });
    }
    
    return activities;
  } catch (error) {
    logger.error('Error in getActivities (Fitbit):', error);
    throw error;
  }
};

/**
 * Get sleep data
 */
export const getSleepData = async (
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<FitbitSleep[]> => {
  try {
    // Format dates as required by Fitbit API (yyyy-MM-dd)
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    
    // Use rate limiter
    await rateLimiter.consume('fitbit-api', 1);

    // Get sleep data for date range
    const response = await axios.get(
      `${BASE_URL}/${API_VERSION}/user/-/sleep/date/${formattedStartDate}/${formattedEndDate}.json`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    const sleepData: FitbitSleep[] = [];
    
    // Process the sleep data
    for (const sleep of response.data.sleep) {
      // Skip naps or invalid entries if needed
      if (sleep.isMainSleep === false && sleep.duration < 3600000) { // Less than 1 hour
        continue;
      }
      
      const sleepStages = [];
      
      // Process sleep stages if available, otherwise use levels
      if (sleep.levels && sleep.levels.data) {
        for (const stage of sleep.levels.data) {
          sleepStages.push({
            stage: stage.level,
            startTime: stage.dateTime,
            duration: stage.seconds * 1000 // Convert to milliseconds
          });
        }
      } else if (sleep.levels && sleep.levels.shortData) {
        for (const stage of sleep.levels.shortData) {
          sleepStages.push({
            stage: stage.level,
            startTime: stage.dateTime,
            duration: stage.seconds * 1000 // Convert to milliseconds
          });
        }
      }
      
      sleepData.push({
        id: sleep.logId.toString(),
        startTime: sleep.startTime,
        endTime: sleep.endTime,
        duration: sleep.duration,
        efficiency: sleep.efficiency,
        isMainSleep: sleep.isMainSleep,
        sleepStages,
        minutesAsleep: sleep.minutesAsleep,
        minutesAwake: sleep.minutesAwake,
        minutesToFallAsleep: sleep.minutesToFallAsleep,
        timeInBed: sleep.timeInBed,
        sourceDevice: {
          id: sleep.sourceDevice?.id,
          name: sleep.sourceDevice?.name,
          type: sleep.sourceDevice?.type
        }
      });
    }
    
    return sleepData;
  } catch (error) {
    logger.error('Error in getSleepData (Fitbit):', error);
    throw error;
  }
};

/**
 * Get nutrition data
 */
export const getNutritionData = async (
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<FitbitNutrition[]> => {
  try {
    // Format dates as required by Fitbit API (yyyy-MM-dd)
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    const nutritionData: FitbitNutrition[] = [];
    
    // Iterate through each day in the date range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const formattedDate = formatDate(currentDate);
      
      // Use rate limiter
      await rateLimiter.consume('fitbit-api', 1);

      // Get food log for the day
      const response = await axios.get(
        `${BASE_URL}/${API_VERSION}/user/-/foods/log/date/${formattedDate}.json`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      const foodLog = response.data;
      
      // Group foods by meal
      const meals: { [key: string]: { name: string; foods: any[] } } = {};
      for (const food of foodLog.foods) {
        if (!meals[food.loggedFood.mealTypeId]) {
          meals[food.loggedFood.mealTypeId] = {
            name: food.loggedFood.mealTypeName,
            foods: []
          };
        }
        
        meals[food.loggedFood.mealTypeId].foods.push({
          name: food.loggedFood.name,
          amount: food.loggedFood.amount,
          unit: food.loggedFood.unit,
          calories: food.loggedFood.calories,
          nutrients: {
            carbs: food.loggedFood.carbs,
            fat: food.loggedFood.fat,
            protein: food.loggedFood.protein,
            fiber: food.loggedFood.fiber || 0
          }
        });
      }
      
      // Create nutrition entries for each meal
      for (const [mealId, meal] of Object.entries(meals)) {
        // Calculate total nutrients
        const totalCalories = meal.foods.reduce((sum, food) => sum + food.calories, 0);
        const totalCarbs = meal.foods.reduce((sum, food) => sum + food.nutrients.carbs, 0);
        const totalFat = meal.foods.reduce((sum, food) => sum + food.nutrients.fat, 0);
        const totalProtein = meal.foods.reduce((sum, food) => sum + food.nutrients.protein, 0);
        const totalFiber = meal.foods.reduce((sum, food) => sum + food.nutrients.fiber, 0);
        
        nutritionData.push({
          id: `${formattedDate}-${mealId}`,
          date: formattedDate,
          mealType: meal.name.toLowerCase(),
          foods: meal.foods,
          totalCalories,
          totalNutrients: {
            carbs: totalCarbs,
            fat: totalFat,
            protein: totalProtein,
            fiber: totalFiber
          },
          waterConsumption: foodLog.summary.water || 0,
          sourceDevice: {
            id: undefined,
            name: 'Fitbit',
            type: 'App'
          }
        });
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return nutritionData;
  } catch (error) {
    logger.error('Error in getNutritionData (Fitbit):', error);
    throw error;
  }
};