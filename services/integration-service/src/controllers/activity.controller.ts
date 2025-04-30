// src/controllers/activity.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ActivityService } from '../services/activity.service';
import { ApiError } from '../middlewares/error.middleware';
import { asyncHandler } from '../utils/async-handler';

export class ActivityController {
  private activityService: ActivityService;

  constructor() {
    this.activityService = new ActivityService();
  }

  /**
   * Get activities for a user
   */
  getActivities = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.id;
    
    // Parse query parameters
    const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
    const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;
    const activityType = req.query.activity_type as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    
    const activities = await this.activityService.getActivitiesByUser(
      userId,
      startDate,
      endDate,
      activityType,
      limit
    );
    
    return res.status(200).json({
      status: 'success',
      data: activities
    });
  });

  /**
   * Get activity by ID
   */
  getActivityById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.id;
    const activityId = req.params.id;
    
    const activity = await this.activityService.getActivityById(activityId);
    
    // Check if activity belongs to user
    if (activity.user_id !== userId) {
      throw new ApiError('Unauthorized', 403);
    }
    
    return res.status(200).json({
      status: 'success',
      data: activity
    });
  });

  /**
   * Create a manual activity
   */
  createActivity = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.id;
    
    // Prepare activity data
    const activityData = {
      user_id: userId,
      activity_type: req.body.activity_type,
      start_time: new Date(req.body.start_time),
      end_time: new Date(req.body.end_time),
      duration_seconds: req.body.duration_seconds,
      distance: req.body.distance,
      distance_unit: req.body.distance_unit,
      calories_burned: req.body.calories_burned,
      steps: req.body.steps,
      source_provider: 'manual_entry',
      metadata: req.body.metadata || {}
    };
    
    const activity = await this.activityService.createActivity(activityData);
    
    return res.status(201).json({
      status: 'success',
      message: 'Activity created successfully',
      data: activity
    });
  });
}