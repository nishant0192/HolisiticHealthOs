import axios from 'axios';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { appConfig } from '../../config';
import { logger } from '../../middlewares/logging.middleware';
import { GarminToken, GarminProfile, GarminActivity, GarminSleep, GarminNutrition } from './types';
import { rateLimiter } from '../../utils/rate-limiter';

const BASE_URL = 'https://apis.garmin.com/wellness-api/rest';
const API_VERSION = 'v1';

// Create OAuth 1.0a instance for Garmin Connect API
const oauth = new OAuth({
    consumer: {
        key: appConfig.providers.garmin.consumerKey,
        secret: appConfig.providers.garmin.consumerSecret
    },
    signature_method: 'HMAC-SHA1',
    hash_function(baseString, key) {
        return crypto.createHmac('sha1', key).update(baseString).digest('base64');
    }
});

/**
 * Exchange authorization code for access token
 * Garmin uses OAuth 1.0a with three-legged authentication
 */
export const getAccessToken = async (
    oauthToken: string,
    oauthVerifier: string
): Promise<GarminToken> => {
    try {
        // Use rate limiter
        await rateLimiter.consume('garmin-token', 1);

        // Prepare the request
        const requestData = {
            url: `${BASE_URL}/oauth/access_token`,
            method: 'POST'
        };

        // Get authorization header
        const authHeader = oauth.toHeader(oauth.authorize(requestData, {
            key: oauthToken,
            secret: ''
        }));

        // Add the oauth_verifier to the request body
        const requestBody = `oauth_verifier=${oauthVerifier}`;

        // Make the request
        const response = await axios.post(
            requestData.url,
            requestBody,
            {
                headers: {
                    ...authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        // Parse the response which comes as a query string
        const responseParams = new URLSearchParams(response.data);

        return {
            oauth_token: responseParams.get('oauth_token') || '',
            oauth_token_secret: responseParams.get('oauth_token_secret') || '',
            user_id: responseParams.get('user_id') || ''
        };
    } catch (error) {
        logger.error('Error in getAccessToken (Garmin):', error);
        throw error;
    }
};

/**
 * Get request token (step 1 of OAuth 1.0a flow)
 */
export const getRequestToken = async (): Promise<{
    oauth_token: string;
    oauth_token_secret: string;
}> => {
    try {
        // Use rate limiter
        await rateLimiter.consume('garmin-token', 1);

        // Prepare the request
        const requestData = {
            url: `${BASE_URL}/oauth/request_token`,
            method: 'POST',
            data: {
                oauth_callback: appConfig.providers.garmin.redirectUri
            }
        };

        // Get authorization header
        const authHeader = oauth.toHeader(oauth.authorize(requestData));

        // Make the request
        const response = await axios.post(
            requestData.url,
            null,
            {
                headers: authHeader as unknown as Record<string, string>
            }
        );

        // Parse the response which comes as a query string
        const responseParams = new URLSearchParams(response.data);

        return {
            oauth_token: responseParams.get('oauth_token') || '',
            oauth_token_secret: responseParams.get('oauth_token_secret') || ''
        };
    } catch (error) {
        logger.error('Error in getRequestToken (Garmin):', error);
        throw error;
    }
};

/**
 * Get user profile
 */
export const getUserProfile = async (token: GarminToken): Promise<GarminProfile> => {
    try {
        // Use rate limiter
        await rateLimiter.consume('garmin-api', 1);

        // Prepare the request
        const requestData = {
            url: `${BASE_URL}/${API_VERSION}/user/profile`,
            method: 'GET'
        };

        // Get authorization header
        const authHeader = oauth.toHeader(oauth.authorize(requestData, {
            key: token.oauth_token,
            secret: token.oauth_token_secret
        }));

        // Make the request
        const response = await axios.get(
            requestData.url,
            {
                headers: authHeader as unknown as Record<string, string>
            }
        );

        const profile = response.data;

        return {
            id: token.user_id,
            displayName: profile.fullName || `${profile.firstName} ${profile.lastName}`,
            firstName: profile.firstName,
            lastName: profile.lastName,
            gender: profile.gender,
            age: profile.age,
            heightCm: profile.height,
            weightKg: profile.weight
        };
    } catch (error) {
        logger.error('Error in getUserProfile (Garmin):', error);
        throw error;
    }
};

/**
 * Get activities
 */
export const getActivities = async (
    token: GarminToken,
    startDate: Date,
    endDate: Date
): Promise<GarminActivity[]> => {
    try {
        // Format dates as required by Garmin API (yyyy-MM-dd)
        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);

        // Use rate limiter
        await rateLimiter.consume('garmin-api', 1);

        // Prepare the request
        const requestData = {
            url: `${BASE_URL}/${API_VERSION}/activities?startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
            method: 'GET'
        };

        // Get authorization header
        const authHeader = oauth.toHeader(oauth.authorize(requestData, {
            key: token.oauth_token,
            secret: token.oauth_token_secret
        }));

        // Make the request
        const response = await axios.get(
            requestData.url,
            {
                headers: authHeader as unknown as Record<string, string>
            }
        );

        const activities: GarminActivity[] = [];

        // Process the activities
        for (const activitySummary of response.data) {
            await rateLimiter.consume('garmin-api', 1);

            // Get detailed activity data
            const detailRequestData = {
                url: `${BASE_URL}/${API_VERSION}/activity/${activitySummary.activityId}`,
                method: 'GET'
            };

            const detailAuthHeader = oauth.toHeader(oauth.authorize(detailRequestData, {
                key: token.oauth_token,
                secret: token.oauth_token_secret
            }));

            const detailResponse = await axios.get(
                detailRequestData.url,
                {
                    headers: detailAuthHeader as unknown as Record<string, string>
                }
            );

            const activityDetail = detailResponse.data;

            activities.push({
                id: activitySummary.activityId,
                name: activitySummary.activityName,
                type: activitySummary.activityType,
                startTime: activitySummary.startTimeInSeconds * 1000, // Convert to milliseconds
                durationInSeconds: activitySummary.durationInSeconds,
                distanceInMeters: activitySummary.distanceInMeters,
                averageHeartRate: activityDetail.averageHeartRateInBeatsPerMinute,
                maxHeartRate: activityDetail.maxHeartRateInBeatsPerMinute,
                calories: activityDetail.caloriesInKiloCalories,
                steps: activityDetail.steps,
                deviceName: activityDetail.deviceName || activitySummary.deviceName
            });
        }

        return activities;
    } catch (error) {
        logger.error('Error in getActivities (Garmin):', error);
        throw error;
    }
};

/**
 * Get sleep data
 */
export const getSleepData = async (
    token: GarminToken,
    startDate: Date,
    endDate: Date
): Promise<GarminSleep[]> => {
    try {
        // Format dates as required by Garmin API (yyyy-MM-dd)
        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);

        // Use rate limiter
        await rateLimiter.consume('garmin-api', 1);

        // Prepare the request
        const requestData = {
            url: `${BASE_URL}/${API_VERSION}/sleep?startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
            method: 'GET'
        };

        // Get authorization header
        const authHeader = oauth.toHeader(oauth.authorize(requestData, {
            key: token.oauth_token,
            secret: token.oauth_token_secret
        }));

        // Make the request
        const response = await axios.get(
            requestData.url,
            {
                headers: authHeader as unknown as Record<string, string>
            }
        );

        const sleepData: GarminSleep[] = [];

        // Process the sleep data
        for (const sleep of response.data) {
            // Get sleep stages
            const sleepStages = [];

            if (sleep.sleepLevels && sleep.sleepLevels.length > 0) {
                for (const level of sleep.sleepLevels) {
                    sleepStages.push({
                        stage: level.sleepLevel.toLowerCase(),
                        startTimeInSeconds: level.startTimeInSeconds,
                        endTimeInSeconds: level.endTimeInSeconds,
                        durationInSeconds: level.durationInSeconds
                    });
                }
            }

            // Calculate total duration
            const totalDuration = sleepStages.reduce((sum, level) => sum + level.durationInSeconds, 0);

            sleepData.push({
                id: sleep.dailySleepId || `${sleep.startTimeInSeconds}-${sleep.endTimeInSeconds}`,
                startTimeInSeconds: sleep.startTimeInSeconds,
                endTimeInSeconds: sleep.endTimeInSeconds,
                durationInSeconds: totalDuration || (sleep.endTimeInSeconds - sleep.startTimeInSeconds),
                sleepStages: sleepStages,
                sleepQualityScore: sleep.sleepScores?.overall || null,
                unmeasurableSleep: sleep.unmeasurableSleepInSeconds || 0,
                validationTime: sleep.validation?.validationTime || null,
                deviceName: sleep.deviceName
            });
        }

        return sleepData;
    } catch (error) {
        logger.error('Error in getSleepData (Garmin):', error);
        throw error;
    }
};

/**
 * Get nutrition data
 */
export const getNutritionData = async (
    token: GarminToken,
    startDate: Date,
    endDate: Date
): Promise<GarminNutrition[]> => {
    try {
        // Format dates as required by Garmin API (yyyy-MM-dd)
        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        const nutritionData: GarminNutrition[] = [];

        // Iterate through each day in the date range
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const formattedDate = formatDate(currentDate);

            // Use rate limiter
            await rateLimiter.consume('garmin-api', 1);

            // Prepare the request
            const requestData = {
                url: `${BASE_URL}/${API_VERSION}/nutrition/daily/${formattedDate}`,
                method: 'GET'
            };

            // Get authorization header
            const authHeader = oauth.toHeader(oauth.authorize(requestData, {
                key: token.oauth_token,
                secret: token.oauth_token_secret
            }));

            try {
                // Make the request
                const response = await axios.get(
                    requestData.url,
                    {
                        headers: authHeader as unknown as Record<string, string>
                    }
                );

                const nutrition = response.data;

                // Process meals if they exist
                if (nutrition.meals && nutrition.meals.length > 0) {
                    for (const meal of nutrition.meals) {
                        // Process foods for this meal
                        const foods = meal.components?.map((comp: { description: any; amount: any; unit: any; calories: any; macronutrients: { carbohydrates: any; fat: any; protein: any; fiber: any; }; }) => ({
                            name: comp.description,
                            quantity: comp.amount,
                            unit: comp.unit,
                            calories: comp.calories,
                            nutrients: {
                                carbs: comp.macronutrients?.carbohydrates || 0,
                                fat: comp.macronutrients?.fat || 0,
                                protein: comp.macronutrients?.protein || 0,
                                fiber: comp.macronutrients?.fiber || 0
                            }
                        })) || [];

                        // Calculate totals
                        const totalCalories = foods.reduce((sum: any, food: { calories: any; }) => sum + food.calories, 0);
                        const totalProtein = foods.reduce((sum: any, food: { nutrients: { protein: any; }; }) => sum + food.nutrients.protein, 0);
                        const totalCarbs = foods.reduce((sum: any, food: { nutrients: { carbs: any; }; }) => sum + food.nutrients.carbs, 0);
                        const totalFat = foods.reduce((sum: any, food: { nutrients: { fat: any; }; }) => sum + food.nutrients.fat, 0);
                        const totalFiber = foods.reduce((sum: any, food: { nutrients: { fiber: any; }; }) => sum + food.nutrients.fiber, 0);

                        nutritionData.push({
                            id: `${formattedDate}-${meal.mealType}`,
                            date: formattedDate,
                            mealType: meal.mealType.toLowerCase(),
                            foods: foods,
                            totalCalories: totalCalories,
                            totalNutrients: {
                                carbs: totalCarbs,
                                fat: totalFat,
                                protein: totalProtein,
                                fiber: totalFiber
                            },
                            waterIntake: nutrition.dailyWaterIntakeInMilliliters,
                            deviceName: nutrition.deviceName || 'Garmin Connect'
                        });
                    }
                }
            } catch (error) {
                // Log but continue - some days might not have nutrition data
                logger.warn(`No nutrition data available for date ${formattedDate}`);
            }

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return nutritionData;
    } catch (error) {
        logger.error('Error in getNutritionData (Garmin):', error);
        throw error;
    }
};