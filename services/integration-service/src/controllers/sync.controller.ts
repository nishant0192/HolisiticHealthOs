// src/controllers/sync.controller.ts
import { Request, Response, NextFunction } from 'express';
import { SyncService } from '../services/sync.service';
import { Provider } from '../models/connection.model';
import { ApiError } from '../middlewares/error.middleware';
import { asyncHandler } from '../utils/async-handler';

export class SyncController {
  private syncService: SyncService;

  constructor() {
    this.syncService = new SyncService();
  }

  /**
   * Sync data from a specific provider
   */
  syncProvider = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.id;
    const provider = req.params.provider as Provider;
    
    // Parse date parameters
    const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
    const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;
    
    // Validate provider
    if (!['apple_health', 'google_fit', 'fitbit', 'garmin'].includes(provider)) {
      throw new ApiError(`Invalid provider: ${provider}`, 400);
    }
    
    const syncResult = await this.syncService.syncData(userId, provider, startDate, endDate);
    
    return res.status(200).json({
      status: 'success',
      message: `Data sync completed for ${provider}`,
      data: syncResult
    });
  });

  /**
   * Sync data from all active connections
   */
  syncAll = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.id;
    
    // Parse date parameters
    const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
    const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;
    
    const syncResults = await this.syncService.syncAllForUser(userId, startDate, endDate);
    
    return res.status(200).json({
      status: 'success',
      message: 'Data sync completed for all connections',
      data: syncResults
    });
  });

  /**
   * Get sync status for all connections
   */
  getSyncStatus = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.id;
    
    // Get all active connections with last_synced_at info
    const connections = await this.syncService.getSyncStatus(userId);
    
    return res.status(200).json({
      status: 'success',
      data: connections
    });
  });
}