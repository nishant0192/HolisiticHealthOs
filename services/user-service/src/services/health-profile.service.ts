// src/services/health-profile.service.ts
import { HealthProfileModel } from '../models/health-profile.model';
import { ApiError } from '../middlewares/error.middleware';
import { transformHealthProfileResponse, transformHealthProfileRequest } from '../utils/transform';

export class HealthProfileService {
  private healthProfileModel: HealthProfileModel;

  constructor() {
    this.healthProfileModel = new HealthProfileModel();
  }

  /**
   * Get health profile by user ID
   */
  async getHealthProfile(userId: string) {
    try {
      const healthProfile = await this.healthProfileModel.findByUserId(userId);
      
      if (!healthProfile) {
        // Return default health profile if none exists
        return transformHealthProfileResponse({
          user_id: userId,
          health_conditions: [],
          medications: [],
          allergies: [],
          dietary_preferences: [],
          activity_level: 'moderate',
          sleep_goal_hours: 8,
          fitness_experience: 'beginner',
          motivation_factors: [],
          stress_level: 5,
          height_cm: null,
          weight_kg: null,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      
      return transformHealthProfileResponse(healthProfile);
    } catch (error) {
      console.error('Error in getHealthProfile:', error);
      throw new ApiError('Failed to get health profile', 500);
    }
  }

  /**
   * Update or create health profile
   */
  async updateHealthProfile(userId: string, profileData: any) {
    try {
      // Transform the input data
      const transformedData = transformHealthProfileRequest(profileData);
      
      // Create or update the health profile
      const updatedProfile = await this.healthProfileModel.createOrUpdate(userId, transformedData);
      return transformHealthProfileResponse(updatedProfile);
    } catch (error) {
      console.error('Error in updateHealthProfile:', error);
      throw new ApiError('Failed to update health profile', 500);
    }
  }

  /**
   * Get latest measurements (height and weight)
   */
  async getLatestMeasurements(userId: string) {
    try {
      return await this.healthProfileModel.getLatestMeasurements(userId);
    } catch (error) {
      console.error('Error in getLatestMeasurements:', error);
      throw new ApiError('Failed to get latest measurements', 500);
    }
  }

  /**
   * Update health measurements (height and weight)
   */
  async updateMeasurements(userId: string, height?: number, weight?: number) {
    try {
      const updateData: any = {};
      
      if (height !== undefined) updateData.height_cm = height;
      if (weight !== undefined) updateData.weight_kg = weight;
      
      if (Object.keys(updateData).length === 0) {
        return await this.getHealthProfile(userId);
      }
      
      const updatedProfile = await this.healthProfileModel.createOrUpdate(userId, updateData);
      return transformHealthProfileResponse(updatedProfile);
    } catch (error) {
      console.error('Error in updateMeasurements:', error);
      throw new ApiError('Failed to update measurements', 500);
    }
  }
}