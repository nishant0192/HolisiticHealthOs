import axios from 'axios';
import querystring from 'querystring';
import { appConfig } from '../../config';
import { logger } from '../../middlewares/logging.middleware';
import { GoogleFitToken, GoogleFitProfile, GoogleFitActivity, GoogleFitSleep, GoogleFitNutrition } from './types';

const BASE_URL = 'https://www.googleapis.com';
const FITNESS_API_URL = 'https://fitness.googleapis.com';

/**
 * Exchange authorization code for access token
 */
export const getAccessToken = async (code: string): Promise<GoogleFitToken> => {
  try {
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
 * Get activities
 */
export const getActivities = async (
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<GoogleFitActivity[]> => {
  try {
    const startTimeMillis = startDate.getTime();
    const endTimeMillis = endDate.getTime();
    
    const datasetId = `${startTimeMillis}-${endTimeMillis}`;
    
    const response = await axios.get(
      `${FITNESS_API_URL}/fitness/v1/users/me/sessions?startTime=${startDate.toISOString()}&endTime=${endDate.toISOString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    // This is a simplified example - in reality, you would need to fetch additional data
    // like calories, steps, and distance using the Fitness REST API
    
    return response.data.session.map((session: any) => ({
      id: session.id,
      activityType: session.activityType,
      startTimeMillis: session.startTimeMillis,
      endTimeMillis: session.endTimeMillis,
      modifiedTimeMillis: session.modifiedTimeMillis,
      activitySegments: [],
      application: session.application,
      calories: { value: 0, unit: 'kcal' },
      distance: { value: 0, unit: 'm' },
      steps: { value: 0 }
    }));
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
    const startTimeMillis = startDate.getTime();
    const endTimeMillis = endDate.getTime();
    
    const datasetId = `${startTimeMillis}-${endTimeMillis}`;
    
    const response = await axios.get(
      `${FITNESS_API_URL}/fitness/v1/users/me/sessions?startTime=${startDate.toISOString()}&endTime=${endDate.toISOString()}&activityType=72`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    // This is a simplified example - in reality, you would need to fetch sleep stage data
    // using additional API calls
    
    return response.data.session.map((session: any) => ({
      id: session.id,
      startTimeMillis: session.startTimeMillis,
      endTimeMillis: session.endTimeMillis,
      modifiedTimeMillis: session.modifiedTimeMillis,
      sleepSegments: [],
      application: session.application
    }));
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
    const startTimeMillis = startDate.getTime();
    const endTimeMillis = endDate.getTime();
    
    const datasetId = `${startTimeMillis}-${endTimeMillis}`;
    
    const response = await axios.get(
      `${FITNESS_API_URL}/fitness/v1/users/me/dataSources/derived:com.google.nutrition:com.google.android.gms:merged/datasets/${datasetId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    // This is a simplified example - in reality, you would need to process the raw nutrition
    // data points and convert them to meal records
    
    return []; // Placeholder
  } catch (error) {
    logger.error('Error in getNutritionData (Google Fit):', error);
    throw error;
  }
};