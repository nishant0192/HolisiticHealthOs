import axios from 'axios';
import querystring from 'querystring';
import { appConfig } from '../../config';
import { logger } from '../../middlewares/logging.middleware';
import { rateLimiter } from '../../utils/rate-limiter';
import { 
  WithingsToken, 
  WithingsProfile, 
  WithingsActivity, 
  WithingsSleep, 
  WithingsNutrition 
} from './types';

const BASE_URL = 'https://wbsapi.withings.net/v2';
// const NOTIFY_URL = 'https://wbsapi.withings.net/notify';

/**
 * Exchange authorization code for access token
 */
export const getAccessToken = async (code: string): Promise<WithingsToken> => {
  try {
    // Use rate limiter
    await rateLimiter.consume('withings-api', 1);

    const params = {
      action: 'requesttoken',
      client_id: appConfig.providers.withings.clientId,
      client_secret: appConfig.providers.withings.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: appConfig.providers.withings.redirectUri
    };
    
    const response = await axios.post(`${BASE_URL}/oauth2`, querystring.stringify(params), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.data.status !== 0) {
      throw new Error(`Withings API error: ${response.data.error}`);
    }
    
    return {
      access_token: response.data.body.access_token,
      refresh_token: response.data.body.refresh_token,
      expires_in: response.data.body.expires_in,
      token_type: 'Bearer',
      userid: response.data.body.userid
    };
  } catch (error) {
    logger.error('Error in getAccessToken (Withings):', error);
    throw error;
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<WithingsToken> => {
  try {
    // Use rate limiter
    await rateLimiter.consume('withings-api', 1);

    const params = {
      action: 'requesttoken',
      client_id: appConfig.providers.withings.clientId,
      client_secret: appConfig.providers.withings.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    };
    
    const response = await axios.post(`${BASE_URL}/oauth2`, querystring.stringify(params), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.data.status !== 0) {
      throw new Error(`Withings API error: ${response.data.error}`);
    }
    
    return {
      access_token: response.data.body.access_token,
      refresh_token: response.data.body.refresh_token,
      expires_in: response.data.body.expires_in,
      token_type: 'Bearer',
      userid: response.data.body.userid
    };
  } catch (error) {
    logger.error('Error in refreshAccessToken (Withings):', error);
    throw error;
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async (accessToken: string): Promise<WithingsProfile> => {
  try {
    // Use rate limiter
    await rateLimiter.consume('withings-api', 1);

    const params = {
      action: 'getuser'
    };
    
    const response = await axios.post(`${BASE_URL}/user`, querystring.stringify(params), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.data.status !== 0) {
      throw new Error(`Withings API error: ${response.data.error}`);
    }
    
    const user = response.data.body.users[0];
    
    return {
      id: user.id.toString(),
      firstname: user.firstname,
      lastname: user.lastname,
      gender: user.gender,
      birthdate: user.birthdate,
      height: user.height / 100, // Convert to cm
      weight: user.weightkg // kg
    };
  } catch (error) {
    logger.error('Error in getUserProfile (Withings):', error);
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
): Promise<WithingsActivity[]> => {
  try {
    // Use rate limiter
    await rateLimiter.consume('withings-api', 1);

    // Convert dates to Unix timestamps
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);
    
    const params = {
      action: 'getworkouts',
      startdate: startTimestamp,
      enddate: endTimestamp,
      data_fields: 'calories,effduration,elevation,distance,steps,hr_average,hr_max,hr_min'
    };
    
    const response = await axios.post(`${BASE_URL}/measure`, querystring.stringify(params), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.data.status !== 0) {
      throw new Error(`Withings API error: ${response.data.error}`);
    }
    
    // Map the response to our activity format
    const activities: WithingsActivity[] = [];
    
    if (response.data.body.series) {
      for (const activity of response.data.body.series) {
        activities.push({
          id: activity.id.toString(),
          startdate: activity.startdate,
          enddate: activity.enddate,
          type: activity.category,
          category: activity.category_name,
          calories: activity.calories,
          distance: activity.distance,
          steps: activity.steps,
          elevation: activity.elevation,
          duration: activity.effduration,
          hr_average: activity.hr_average,
          hr_max: activity.hr_max,
          hr_min: activity.hr_min,
          deviceid: activity.deviceid
        });
      }
    }
    
    return activities;
  } catch (error) {
    logger.error('Error in getActivities (Withings):', error);
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
): Promise<WithingsSleep[]> => {
  try {
    // Use rate limiter
    await rateLimiter.consume('withings-api', 1);

    // Convert dates to Unix timestamps
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);
    
    const params = {
      action: 'get',
      startdate: startTimestamp,
      enddate: endTimestamp,
      data_fields: 'hr,rr,snoring'
    };
    
    const response = await axios.post(`${BASE_URL}/sleep`, querystring.stringify(params), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.data.status !== 0) {
      throw new Error(`Withings API error: ${response.data.error}`);
    }
    
    // Map the response to our sleep format
    const sleepData: WithingsSleep[] = [];
    
    if (response.data.body.series) {
      for (const sleep of response.data.body.series) {
        // For simplicity, we'll treat each night as a separate sleep session
        const sleepSessions: { [key: string]: any } = {};
        
        for (const stage of sleep) {
          const sessionDate = new Date(stage.startdate * 1000).toDateString();
          
          if (!sleepSessions[sessionDate]) {
            sleepSessions[sessionDate] = {
              id: stage.id,
              startdate: stage.startdate,
              enddate: 0, // Will be updated as we process stages
              duration: 0, // Will be calculated
              data: [],
              model: stage.model,
              model_id: stage.model_id,
              deviceid: stage.deviceid,
              hash_deviceid: stage.hash_deviceid,
              timezone: stage.timezone
            };
          }
          
          // Update session data
          sleepSessions[sessionDate].data.push({
            state: stage.sleep_state,
            startdate: stage.startdate,
            enddate: stage.enddate,
            duration: stage.enddate - stage.startdate
          });
          
          // Update end date if this stage ends later
          if (stage.enddate > sleepSessions[sessionDate].enddate) {
            sleepSessions[sessionDate].enddate = stage.enddate;
          }
        }
        
        // Calculate total duration and add sessions to result
        for (const date in sleepSessions) {
          const session = sleepSessions[date];
          session.duration = session.enddate - session.startdate;
          sleepData.push(session);
        }
      }
    }
    
    return sleepData;
  } catch (error) {
    logger.error('Error in getSleepData (Withings):', error);
    throw error;
  }
};

/**
 * Get nutrition data
 * Note: Withings doesn't have a comprehensive nutrition API, 
 * so this is a placeholder implementation
 */
export const getNutritionData = async (
  // accessToken: string,
  startDate: Date,
  // endDate: Date
): Promise<WithingsNutrition[]> => {
  try {
    // Use rate limiter
    await rateLimiter.consume('withings-api', 1);

    logger.info('Withings client: getting nutrition data (placeholder)');
    
    // This is a placeholder implementation since Withings doesn't have a comprehensive nutrition API
    return [
      {
        id: 1,
        date: Math.floor(startDate.getTime() / 1000) + 43200, // Noon of start date
        created: Math.floor(startDate.getTime() / 1000) + 43200,
        modified: Math.floor(startDate.getTime() / 1000) + 43200,
        meals: [
          {
            id: 1,
            name: 'Lunch',
            category: 2, // Lunch
            date: Math.floor(startDate.getTime() / 1000) + 43200,
            nutrients: {
              carbs: 50,
              fat: 15,
              protein: 30,
              fiber: 8,
              sodium: 500,
              water: 0
            },
            brands: ['Withings'],
            foodItems: [
              {
                id: 1,
                name: 'Chicken Salad',
                quantity: 1,
                unit: 'serving',
                calories: 350,
                nutrients: {
                  carbs: 15,
                  fat: 10,
                  protein: 25,
                  fiber: 5,
                  sodium: 300,
                  water: 0
                },
                brands: ['Withings']
              },
              {
                id: 2,
                name: 'Whole Grain Bread',
                quantity: 2,
                unit: 'slice',
                calories: 200,
                nutrients: {
                  carbs: 35,
                  fat: 5,
                  protein: 5,
                  fiber: 3,
                  sodium: 200,
                  water: 0
                },
                brands: ['Withings']
              }
            ]
          }
        ],
        waterIntake: 500
      }
    ];
  } catch (error) {
    logger.error('Error in getNutritionData (Withings):', error);
    throw error;
  }
};