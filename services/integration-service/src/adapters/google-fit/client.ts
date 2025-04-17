import axios from 'axios';
import querystring from 'querystring';
import { appConfig } from '../../config';
import { logger } from '../../middlewares/logging.middleware';
import { rateLimiter } from '../../utils/rate-limiter';
import { 
  GoogleFitToken, 
  GoogleFitProfile, 
  GoogleFitActivity, 
  GoogleFitSleep, 
  GoogleFitNutrition,
  GoogleFitSessionResponse,
  GoogleFitDatasetResponse,
  GoogleFitSleepStage
} from './types';

const BASE_URL = 'https://www.googleapis.com';
const FITNESS_API_URL = 'https://fitness.googleapis.com';
const API_VERSION = 'v1';

/**
 * Exchange authorization code for access token
 */
export const getAccessToken = async (code: string): Promise<GoogleFitToken> => {
  try {
    // Use rate limiter
    await rateLimiter.consume('google-fit-token', 1);

    const params = {
      code,
      client_id: appConfig.providers.googleFit.clientId,
      client_secret: appConfig.providers.googleFit.clientSecret,
      redirect_uri: appConfig.providers.googleFit.redirectUri,
      grant_type: 'authorization_code'
    };
    
    const response = await axios.post(`${BASE_URL}/oauth2/v4/token`, querystring.stringify(params), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error('Error in getAccessToken (Google Fit):', error);
    throw error;
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<GoogleFitToken> => {
  try {
    // Use rate limiter
    await rateLimiter.consume('google-fit-token', 1);

    const params = {
      refresh_token: refreshToken,
      client_id: appConfig.providers.googleFit.clientId,
      client_secret: appConfig.providers.googleFit.clientSecret,
      grant_type: 'refresh_token'
    };
    
    const response = await axios.post(`${BASE_URL}/oauth2/v4/token`, querystring.stringify(params), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.data;
  } catch (error) {
    logger.error('Error in refreshAccessToken (Google Fit):', error);
    throw error;
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async (accessToken: string): Promise<GoogleFitProfile> => {
  try {
    // Use rate limiter
    await rateLimiter.consume('google-fit-api', 1);

    const response = await axios.get(`${BASE_URL}/oauth2/v3/userinfo`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return {
      id: response.data.sub,
      name: response.data.name,
      email: response.data.email,
      picture: response.data.picture
    };
  } catch (error) {
    logger.error('Error in getUserProfile (Google Fit):', error);
    throw error;
  }
};

/**
 * Get activities by querying sessions
 */
export const getActivities = async (
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<GoogleFitActivity[]> => {
  try {
    // Use rate limiter
    await rateLimiter.consume('google-fit-api', 1);

    // Convert dates to milliseconds
    const startTimeMillis = startDate.getTime();
    const endTimeMillis = endDate.getTime();
    
    // Fetch sessions
    const response = await axios.get(
      `${FITNESS_API_URL}/fitness/${API_VERSION}/users/me/sessions?startTime=${startDate.toISOString()}&endTime=${endDate.toISOString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    const sessionResponse: GoogleFitSessionResponse = response.data;
    const activities: GoogleFitActivity[] = [];
    
    // Process each session
    for (const session of sessionResponse.session) {
      // Skip non-activity sessions
      if (!session.activityType) {
        continue;
      }
      
      // Use rate limiter for additional API calls
      await rateLimiter.consume('google-fit-api', 1);
      
      // Fetch activity details using datasets
      const activityDetailResponse = await getDatasetForTimeRange(
        accessToken,
        'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended',
        parseInt(session.startTimeMillis),
        parseInt(session.endTimeMillis)
      );
      
      // Fetch step count
      const stepsResponse = await getDatasetForTimeRange(
        accessToken,
        'derived:com.google.step_count.delta:com.google.android.gms:merge_step_deltas',
        parseInt(session.startTimeMillis),
        parseInt(session.endTimeMillis)
      );
      
      // Fetch distance
      const distanceResponse = await getDatasetForTimeRange(
        accessToken,
        'derived:com.google.distance.delta:com.google.android.gms:merge_distance_delta',
        parseInt(session.startTimeMillis),
        parseInt(session.endTimeMillis)
      );
      
      // Calculate calories
      let calories = 0;
      if (activityDetailResponse.point && activityDetailResponse.point.length > 0) {
        for (const point of activityDetailResponse.point) {
          calories += point.value[0];
        }
      }
      
      // Calculate steps
      let steps = 0;
      if (stepsResponse.point && stepsResponse.point.length > 0) {
        for (const point of stepsResponse.point) {
          steps += point.value[0];
        }
      }
      
      // Calculate distance
      let distance = 0;
      if (distanceResponse.point && distanceResponse.point.length > 0) {
        for (const point of distanceResponse.point) {
          distance += point.value[0];
        }
      }
      
      // Create activity object
      const activity: GoogleFitActivity = {
        id: session.id,
        activityType: mapActivityType(session.activityType),
        startTimeMillis: session.startTimeMillis,
        endTimeMillis: session.endTimeMillis,
        modifiedTimeMillis: session.modifiedTimeMillis,
        activitySegments: [], // We could fetch detailed segments if needed
        application: session.application,
        calories: {
          value: calories,
          unit: 'kcal'
        },
        distance: {
          value: distance,
          unit: 'm'
        },
        steps: {
          value: steps
        }
      };
      
      activities.push(activity);
    }
    
    return activities;
  } catch (error) {
    logger.error('Error in getActivities (Google Fit):', error);
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
): Promise<GoogleFitSleep[]> => {
  try {
    // Use rate limiter
    await rateLimiter.consume('google-fit-api', 1);

    // Convert dates to milliseconds
    const startTimeMillis = startDate.getTime();
    const endTimeMillis = endDate.getTime();
    
    // Fetch sleep sessions
    const response = await axios.get(
      `${FITNESS_API_URL}/fitness/${API_VERSION}/users/me/sessions?startTime=${startDate.toISOString()}&endTime=${endDate.toISOString()}&activityType=72`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    const sessionResponse: GoogleFitSessionResponse = response.data;
    const sleepData: GoogleFitSleep[] = [];
    
    // Process each sleep session
    for (const session of sessionResponse.session) {
      // Use rate limiter for additional API calls
      await rateLimiter.consume('google-fit-api', 1);
      
      // Fetch sleep stage data
      const sleepStageResponse = await getDatasetForTimeRange(
        accessToken,
        'derived:com.google.sleep.segment:com.google.android.gms:merged',
        parseInt(session.startTimeMillis),
        parseInt(session.endTimeMillis)
      );
      
      const sleepStages: GoogleFitSleepStage[] = [];
      
      if (sleepStageResponse.point && sleepStageResponse.point.length > 0) {
        for (const point of sleepStageResponse.point) {
          const startTime = parseInt(point.startTimeNanos) / 1000000; // Convert to millis
          const endTime = parseInt(point.endTimeNanos) / 1000000; // Convert to millis
          
          sleepStages.push({
            stage: mapSleepStage(point.value[0]),
            startTimeMillis: startTime.toString(),
            endTimeMillis: endTime.toString(),
            durationMillis: endTime - startTime
          });
        }
      }
      
      // Create sleep object
      const sleep: GoogleFitSleep = {
        id: session.id,
        startTimeMillis: session.startTimeMillis,
        endTimeMillis: session.endTimeMillis,
        modifiedTimeMillis: session.modifiedTimeMillis,
        sleepStages,
        application: session.application
      };
      
      sleepData.push(sleep);
    }
    
    return sleepData;
  } catch (error) {
    logger.error('Error in getSleepData (Google Fit):', error);
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
): Promise<GoogleFitNutrition[]> => {
  try {
    // Use rate limiter
    await rateLimiter.consume('google-fit-api', 1);

    // Convert dates to milliseconds and nanoseconds
    const startTimeMillis = startDate.getTime();
    const endTimeMillis = endDate.getTime();
    const startTimeNanos = startTimeMillis * 1000000;
    const endTimeNanos = endTimeMillis * 1000000;
    
    // Google Fit doesn't have a dedicated nutrition API, so we'll use datasets
    // for calories, protein, fat, and carbs
    const nutrientDatasets = [
      {
        type: 'calories',
        dataSource: 'derived:com.google.nutrition.summary:com.google.android.gms:merged'
      },
      {
        type: 'protein',
        dataSource: 'derived:com.google.protein.summary:com.google.android.gms:merged'
      },
      {
        type: 'fat',
        dataSource: 'derived:com.google.fat.summary:com.google.android.gms:merged'
      },
      {
        type: 'carbs',
        dataSource: 'derived:com.google.carbs.summary:com.google.android.gms:merged'
      },
      {
        type: 'fiber',
        dataSource: 'derived:com.google.dietary_fiber.summary:com.google.android.gms:merged'
      }
    ];
    
    // Create a map to hold nutrition data by day
    const nutritionByDay = new Map<string, any>();
    
    // Fetch each nutrient type
    for (const dataset of nutrientDatasets) {
      await rateLimiter.consume('google-fit-api', 1);
      
      try {
        const response = await axios.get(
          `${FITNESS_API_URL}/fitness/${API_VERSION}/users/me/dataSources/${dataset.dataSource}/datasets/${startTimeNanos}-${endTimeNanos}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );
        
        const datasetResponse: GoogleFitDatasetResponse = response.data;
        
        if (datasetResponse.point && datasetResponse.point.length > 0) {
          for (const point of datasetResponse.point) {
            const startTimeMs = parseInt(point.startTimeNanos) / 1000000;
            const date = new Date(startTimeMs);
            const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
            
            if (!nutritionByDay.has(dateKey)) {
              nutritionByDay.set(dateKey, {
                date: dateKey,
                startTimeMillis: startTimeMs.toString(),
                endTimeMillis: (parseInt(point.endTimeNanos) / 1000000).toString(),
                nutrients: {
                  calories: 0,
                  protein: 0,
                  fat: 0,
                  carbohydrates: 0,
                  fiber: 0
                },
                foodItems: []
              });
            }
            
            const dayData = nutritionByDay.get(dateKey);
            
            // Update the nutrient values
            switch (dataset.type) {
              case 'calories':
                dayData.nutrients.calories += point.value[0];
                break;
              case 'protein':
                dayData.nutrients.protein += point.value[0];
                break;
              case 'fat':
                dayData.nutrients.fat += point.value[0];
                break;
              case 'carbs':
                dayData.nutrients.carbohydrates += point.value[0];
                break;
              case 'fiber':
                dayData.nutrients.fiber += point.value[0];
                break;
            }
            
            // Add source info
            if (point.originDataSourceId) {
              dayData.application = {
                packageName: point.originDataSourceId.split(':')[0],
                version: '1.0' // Default version since we don't have actual version
              };
            }
          }
        }
      } catch (error) {
        logger.warn(`Error fetching ${dataset.type} data:`, error);
        // Continue with other nutrients
      }
    }
    
    // Convert map to array
    const nutritionData: GoogleFitNutrition[] = [];
    
    nutritionByDay.forEach((dayData, dateKey) => {
      // Google Fit doesn't provide detailed food items, so we create a placeholder
      const nutrition: GoogleFitNutrition = {
        id: `nutrition-${dateKey}`,
        startTimeMillis: dayData.startTimeMillis,
        endTimeMillis: dayData.endTimeMillis,
        modifiedTimeMillis: dayData.startTimeMillis, // No modified time available
        nutrients: dayData.nutrients,
        application: dayData.application || {
          packageName: 'com.google.android.apps.fitness',
          version: '1.0'
        },
        meal: 'unknown', // Google Fit doesn't categorize meals
        foodItems: []
      };
      
      nutritionData.push(nutrition);
    });
    
    return nutritionData;
  } catch (error) {
    logger.error('Error in getNutritionData (Google Fit):', error);
    throw error;
  }
};

/**
 * Helper function to get dataset for a time range
 */
async function getDatasetForTimeRange(
  accessToken: string,
  dataSourceId: string,
  startTimeMillis: number,
  endTimeMillis: number
): Promise<GoogleFitDatasetResponse> {
  const startTimeNanos = startTimeMillis * 1000000;
  const endTimeNanos = endTimeMillis * 1000000;
  
  try {
    const response = await axios.get(
      `${FITNESS_API_URL}/fitness/${API_VERSION}/users/me/dataSources/${dataSourceId}/datasets/${startTimeNanos}-${endTimeNanos}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    logger.error(`Error fetching dataset for ${dataSourceId}:`, error);
    return { 
      minStartTimeNs: startTimeNanos.toString(),
      maxEndTimeNs: endTimeNanos.toString(),
      dataSourceId,
      point: [] 
    };
  }
}

/**
 * Map Google Fit activity type to readable string
 */
function mapActivityType(activityTypeId: number): string {
  // Based on Google Fit activity types
  // https://developers.google.com/fit/rest/v1/reference/activity-types
  const activityTypes: Record<number, string> = {
    9: 'aerobics',
    10: 'badminton',
    11: 'baseball',
    12: 'basketball',
    13: 'biking',
    1: 'biking',
    17: 'conditioning_exercises',
    18: 'cricket',
    19: 'dancing',
    20: 'elliptical',
    21: 'fencing',
    23: 'football_american',
    24: 'football_australian',
    25: 'football_soccer',
    26: 'frisbee',
    27: 'gardening',
    29: 'golf',
    30: 'gymnastics',
    31: 'handball',
    32: 'hiking',
    33: 'hockey',
    34: 'horseback_riding',
    35: 'housework',
    36: 'ice_skating',
    37: 'jumping_rope',
    38: 'kayaking',
    39: 'kettlebell_training',
    40: 'kickboxing',
    41: 'kitesurfing',
    42: 'martial_arts',
    43: 'meditation',
    44: 'mixed_martial_arts',
    45: 'p90x_exercises',
    46: 'paragliding',
    47: 'pilates',
    48: 'polo',
    49: 'racquetball',
    50: 'rock_climbing',
    51: 'rowing',
    52: 'rowing_machine',
    53: 'rugby',
    54: 'running',
    8: 'running',
    55: 'sailing',
    56: 'scuba_diving',
    57: 'skateboarding',
    58: 'skating',
    59: 'skiing',
    60: 'snowboarding',
    61: 'snowshoeing',
    62: 'softball',
    63: 'squash',
    64: 'stair_climbing',
    65: 'stair_climbing_machine',
    66: 'standup_paddleboarding',
    67: 'strength_training',
    68: 'surfing',
    69: 'swimming',
    70: 'swimming_pool',
    71: 'swimming_open_water',
    72: 'table_tennis',
    73: 'team_sports',
    74: 'tennis',
    75: 'treadmill',
    76: 'volleyball',
    77: 'walking',
    78: 'water_polo',
    79: 'weightlifting',
    80: 'wheelchair',
    81: 'windsurfing',
    82: 'yoga',
    83: 'zumba',
    84: 'other'
  };
  
  return activityTypes[activityTypeId] || 'unknown';
}

/**
 * Map Google Fit sleep stage to readable string
 */
function mapSleepStage(stageValue: number): string {
  // Based on Google Fit sleep stage values
  const sleepStages: Record<number, string> = {
    1: 'awake',
    2: 'light',
    3: 'deep',
    4: 'rem'
  };
  
  return sleepStages[stageValue] || 'unknown';
}