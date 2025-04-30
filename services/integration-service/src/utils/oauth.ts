// src/utils/oauth.ts
import axios from 'axios';
import querystring from 'querystring';
import { appConfig } from '../config';
import { Provider } from '../models/connection.model';

/**
 * Get OAuth authorization URL for a provider
 */
export const getAuthorizationUrl = (provider: Provider): string => {
  switch (provider) {
    case 'google_fit':
      return `https://accounts.google.com/o/oauth2/auth?client_id=${
        appConfig.providers.googleFit.clientId
      }&redirect_uri=${encodeURIComponent(
        appConfig.providers.googleFit.redirectUri
      )}&scope=${encodeURIComponent(
        'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.sleep.read'
      )}&response_type=code&access_type=offline&prompt=consent`;

    case 'fitbit':
      return `https://www.fitbit.com/oauth2/authorize?client_id=${
        appConfig.providers.fitbit.clientId
      }&redirect_uri=${encodeURIComponent(
        appConfig.providers.fitbit.redirectUri
      )}&scope=${encodeURIComponent(
        'activity heartrate sleep nutrition'
      )}&response_type=code`;

    case 'garmin':
      return `https://connect.garmin.com/oauthConfirm?client_id=${
        appConfig.providers.garmin.consumerKey
      }&redirect_uri=${encodeURIComponent(
        appConfig.providers.garmin.redirectUri
      )}&response_type=code&scope=activity sleep nutrition`;

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
};

/**
 * Exchange authorization code for access token
 */
export const exchangeCodeForToken = async (provider: Provider, code: string): Promise<any> => {
  try {
    switch (provider) {
      case 'google_fit':
        const googleParams = {
          code,
          client_id: appConfig.providers.googleFit.clientId,
          client_secret: appConfig.providers.googleFit.clientSecret,
          redirect_uri: appConfig.providers.googleFit.redirectUri,
          grant_type: 'authorization_code'
        };
        
        const googleResponse = await axios.post(
          'https://oauth2.googleapis.com/token',
          querystring.stringify(googleParams),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );
        
        return googleResponse.data;
      
      case 'fitbit':
        const fitbitParams = {
          code,
          client_id: appConfig.providers.fitbit.clientId,
          grant_type: 'authorization_code',
          redirect_uri: appConfig.providers.fitbit.redirectUri
        };
        
        // Fitbit requires Basic Auth with client_id:client_secret
        const fitbitAuth = Buffer.from(
          `${appConfig.providers.fitbit.clientId}:${appConfig.providers.fitbit.clientSecret}`
        ).toString('base64');
        
        const fitbitResponse = await axios.post(
          'https://api.fitbit.com/oauth2/token',
          querystring.stringify(fitbitParams),
          {
            headers: {
              'Authorization': `Basic ${fitbitAuth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );
        
        return fitbitResponse.data;
      
      case 'garmin':
        // Garmin has a more complex OAuth flow with request tokens
        // This is a simplified example
        const garminParams = {
          code,
          client_id: appConfig.providers.garmin.consumerKey,
          client_secret: appConfig.providers.garmin.consumerSecret,
          redirect_uri: appConfig.providers.garmin.redirectUri,
          grant_type: 'authorization_code'
        };
        
        const garminResponse = await axios.post(
          'https://connectapi.garmin.com/oauth-service/token',
          querystring.stringify(garminParams),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );
        
        return garminResponse.data;
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error exchanging code for token with ${provider}:`, error);
    throw error;
  }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (provider: Provider, refreshToken: string): Promise<any> => {
  try {
    switch (provider) {
      case 'google_fit':
        const googleParams = {
          refresh_token: refreshToken,
          client_id: appConfig.providers.googleFit.clientId,
          client_secret: appConfig.providers.googleFit.clientSecret,
          grant_type: 'refresh_token'
        };
        
        const googleResponse = await axios.post(
          'https://oauth2.googleapis.com/token',
          querystring.stringify(googleParams),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );
        
        return googleResponse.data;
      
      case 'fitbit':
        const fitbitParams = {
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        };
        
        // Fitbit requires Basic Auth with client_id:client_secret
        const fitbitAuth = Buffer.from(
          `${appConfig.providers.fitbit.clientId}:${appConfig.providers.fitbit.clientSecret}`
        ).toString('base64');
        
        const fitbitResponse = await axios.post(
          'https://api.fitbit.com/oauth2/token',
          querystring.stringify(fitbitParams),
          {
            headers: {
              'Authorization': `Basic ${fitbitAuth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );
        
        return fitbitResponse.data;
      
      case 'garmin':
        // Simplified example for Garmin
        const garminParams = {
          refresh_token: refreshToken,
          client_id: appConfig.providers.garmin.consumerKey,
          client_secret: appConfig.providers.garmin.consumerSecret,
          grant_type: 'refresh_token'
        };
        
        const garminResponse = await axios.post(
          'https://connectapi.garmin.com/oauth-service/token',
          querystring.stringify(garminParams),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );
        
        return garminResponse.data;
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error refreshing token for ${provider}:`, error);
    throw error;
  }
};