// src/controllers/profile.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service';

export class ProfileController {
  private profileService: ProfileService;

  constructor() {
    this.profileService = new ProfileService();
  }

  /**
   * Get user profile
   */
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const profile = await this.profileService.getProfile(userId);
      
      res.status(200).json({
        status: 'success',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user profile
   */
  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const profileData = req.body;
      
      const updatedProfile = await this.profileService.updateProfile(userId, profileData);
      
      res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get profile by user ID (admin only)
   */
  getProfileByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId;
      const profile = await this.profileService.getProfile(userId);
      
      res.status(200).json({
        status: 'success',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  };
}