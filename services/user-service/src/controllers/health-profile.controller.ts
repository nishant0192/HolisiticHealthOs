// src/controllers/health-profile.controller.ts
import { Request, Response, NextFunction } from 'express';
import { HealthProfileService } from '../services/health-profile.service';

export class HealthProfileController {
  private healthProfileService: HealthProfileService;

  constructor() {
    this.healthProfileService = new HealthProfileService();
  }

  /**
   * Get user health profile
   */
  getHealthProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const healthProfile = await this.healthProfileService.getHealthProfile(userId);
      
      res.status(200).json({
        status: 'success',
        data: healthProfile
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user health profile
   */
  updateHealthProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const profileData = req.body;
      
      const updatedProfile = await this.healthProfileService.updateHealthProfile(userId, profileData);
      
      res.status(200).json({
        status: 'success',
        message: 'Health profile updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get latest measurements
   */
  getLatestMeasurements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const measurements = await this.healthProfileService.getLatestMeasurements(userId);
      
      res.status(200).json({
        status: 'success',
        data: measurements
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update measurements
   */
  updateMeasurements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { height, weight } = req.body;
      
      const updatedProfile = await this.healthProfileService.updateMeasurements(
        userId, 
        height !== undefined ? parseFloat(height) : undefined,
        weight !== undefined ? parseFloat(weight) : undefined
      );
      
      res.status(200).json({
        status: 'success',
        message: 'Measurements updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  };
}