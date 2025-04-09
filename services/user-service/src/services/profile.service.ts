// src/services/profile.service.ts
import { ProfileModel } from '../models/profile.model';
import { UserModel } from '../models/user.model';
import { ApiError } from '../middlewares/error.middleware';
import { transformProfileResponse, transformProfileRequest } from '../utils/transform';

export class ProfileService {
  private profileModel: ProfileModel;
  private userModel: UserModel;

  constructor() {
    this.profileModel = new ProfileModel();
    this.userModel = new UserModel();
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    try {
      const user = await this.userModel.findById(userId);
      
      if (!user) {
        throw new ApiError('User not found', 404);
      }
      
      const profile = await this.profileModel.findByUserId(userId);
      
      if (!profile) {
        // Create default profile if none exists
        return transformProfileResponse({
          user_id: userId,
          first_name: user.first_name,
          last_name: user.last_name,
          date_of_birth: user.date_of_birth,
          gender: user.gender,
          phone_number: user.phone_number,
          profile_picture: user.profile_picture,
          preferred_units: { weight: 'kg', height: 'cm', distance: 'km' },
          notification_preferences: { email: true, push: true, sms: false },
          created_at: user.created_at,
          updated_at: user.updated_at
        });
      }
      
      return transformProfileResponse(profile);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error('Error in getProfile:', error);
      throw new ApiError('Failed to get user profile', 500);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, profileData: any) {
    try {
      // Ensure user exists
      const userExists = await this.userModel.findById(userId);
      
      if (!userExists) {
        throw new ApiError('User not found', 404);
      }
      
      // Transform the input data
      const transformedData = transformProfileRequest(profileData);
      
      // Update profile
      const updatedProfile = await this.profileModel.update(userId, transformedData);
      return transformProfileResponse(updatedProfile);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error('Error in updateProfile:', error);
      throw new ApiError('Failed to update user profile', 500);
    }
  }

  /**
   * Get multiple user profiles by IDs
   */
  async getProfilesByIds(userIds: string[]) {
    try {
      const profiles = await this.profileModel.findByUserIds(userIds);
      return profiles.map(profile => transformProfileResponse(profile));
    } catch (error) {
      console.error('Error in getProfilesByIds:', error);
      throw new ApiError('Failed to get user profiles', 500);
    }
  }
}