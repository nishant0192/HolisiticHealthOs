// src/controllers/sleep.controller.ts
import { Request, Response, NextFunction } from 'express';
import { SleepService } from '../services/sleep.service';
import { ApiError } from '../middlewares/error.middleware';
import { asyncHandler } from '../utils/async-handler';

export class SleepController {
  private sleepService: SleepService;

  constructor() {
    this.sleepService = new SleepService();
  }

  /**
   * Get sleep records for a user
   */
  getSleepRecords = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.id;
    
    // Parse query parameters
    const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
    const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    
    const sleepRecords = await this.sleepService.getSleepByUser(
      userId,
      startDate,
      endDate,
      limit
    );
    
    return res.status(200).json({
      status: 'success',
      data: sleepRecords
    });
  });

  /**
   * Get sleep record by ID
   */
  getSleepById = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.id;
    const sleepId = req.params.id;
    
    const sleepRecord = await this.sleepService.getSleepById(sleepId);
    
    // Check if sleep record belongs to user
    if (sleepRecord.user_id !== userId) {
      throw new ApiError('Unauthorized', 403);
    }
    
    return res.status(200).json({
      status: 'success',
      data: sleepRecord
    });
  });

  /**
   * Create a manual sleep record
   */
  createSleepRecord = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.id;
    
    // Prepare sleep data
    const sleepData = {
      user_id: userId,
      start_time: new Date(req.body.start_time),
      end_time: new Date(req.body.end_time),
      duration_seconds: req.body.duration_seconds,
      sleep_stages: req.body.sleep_stages,
      source_provider: 'manual_entry',
      metadata: req.body.metadata || {}
    };
    
    const sleepRecord = await this.sleepService.createSleep(sleepData);
    
    return res.status(201).json({
      status: 'success',
      message: 'Sleep record created successfully',
      data: sleepRecord
    });
  });
}