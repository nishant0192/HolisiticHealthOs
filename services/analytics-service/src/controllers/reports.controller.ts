import { Request, Response, NextFunction } from 'express';
import reportsService from '../services/reports.service';
import { logger } from '@shared/logger';
import { ApiError } from '@shared/common';
// import { ReportType, ReportPeriod } from '../models/reports.model';

export const getReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;
    const { type, period, start_date, end_date, limit, offset } = req.query;

    // Validate required userId
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }

    // Parse filter parameters
    const filter: any = { userId };
    
    if (type) {
      filter.type = type as string;
    }
    
    if (period) {
      filter.period = period as string;
    }
    
    if (start_date) {
      filter.startDate = start_date as string;
    }
    
    if (end_date) {
      filter.endDate = end_date as string;
    }
    
    if (limit) {
      filter.limit = parseInt(limit as string, 10);
    }
    
    if (offset) {
      filter.offset = parseInt(offset as string, 10);
    }

    const reports = await reportsService.getReports(filter);

    res.status(200).json({
      success: true,
      message: 'Reports retrieved successfully',
      data: reports
    });
  } catch (error) {
    logger.error('Error in getReports controller:', error);
    
    if (error instanceof ApiError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
        error: error.details
      });
    } else {
      next(error);
    }
  }
};

export const getReportById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    // Validate required parameters
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }
    
    if (!id) {
      throw new ApiError('Report ID is required', 400);
    }

    const report = await reportsService.getReportById(id, userId);

    res.status(200).json({
      success: true,
      message: 'Report retrieved successfully',
      data: report
    });
  } catch (error) {
    logger.error('Error in getReportById controller:', error);
    
    if (error instanceof ApiError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
        error: error.details
      });
    } else {
      next(error);
    }
  }
};

export const createReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;
    const reportData = req.body;

    // Validate required parameters
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }
    
    // Add userId to report data
    const reportWithUserId = {
      ...reportData,
      userId
    };

    const report = await reportsService.createReport(reportWithUserId);

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: report
    });
  } catch (error) {
    logger.error('Error in createReport controller:', error);
    
    if (error instanceof ApiError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
        error: error.details
      });
    } else {
      next(error);
    }
  }
};

export const updateReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const updates = req.body;

    // Validate required parameters
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }
    
    if (!id) {
      throw new ApiError('Report ID is required', 400);
    }

    const report = await reportsService.updateReport(id, userId, updates);

    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });
  } catch (error) {
    logger.error('Error in updateReport controller:', error);
    
    if (error instanceof ApiError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
        error: error.details
      });
    } else {
      next(error);
    }
  }
};

export const deleteReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    // Validate required parameters
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }
    
    if (!id) {
      throw new ApiError('Report ID is required', 400);
    }

    await reportsService.deleteReport(id, userId);

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteReport controller:', error);
    
    if (error instanceof ApiError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
        error: error.details
      });
    } else {
      next(error);
    }
  }
};

export const generateActivityReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;

    // Validate required parameters
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }

    const report = await reportsService.generateActivityReport(userId);

    res.status(201).json({
      success: true,
      message: 'Activity report generated successfully',
      data: report
    });
  } catch (error) {
    logger.error('Error in generateActivityReport controller:', error);
    
    if (error instanceof ApiError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
        error: error.details
      });
    } else {
      next(error);
    }
  }
};

export const generateSleepReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;

    // Validate required parameters
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }

    const report = await reportsService.generateSleepReport(userId);

    res.status(201).json({
      success: true,
      message: 'Sleep report generated successfully',
      data: report
    });
  } catch (error) {
    logger.error('Error in generateSleepReport controller:', error);
    
    if (error instanceof ApiError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
        error: error.details
      });
    } else {
      next(error);
    }
  }
};

export const generateNutritionReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;

    // Validate required parameters
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }

    const report = await reportsService.generateNutritionReport(userId);

    res.status(201).json({
      success: true,
      message: 'Nutrition report generated successfully',
      data: report
    });
  } catch (error) {
    logger.error('Error in generateNutritionReport controller:', error);
    
    if (error instanceof ApiError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
        error: error.details
      });
    } else {
      next(error);
    }
  }
};

export const generateHealthReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;

    // Validate required parameters
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }

    const report = await reportsService.generateHealthReport(userId);

    res.status(201).json({
      success: true,
      message: 'Health report generated successfully',
      data: report
    });
  } catch (error) {
    logger.error('Error in generateHealthReport controller:', error);
    
    if (error instanceof ApiError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
        error: error.details
      });
    } else {
      next(error);
    }
  }
};

export const generateCustomReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;
    const { title, metrics, days } = req.body;

    // Validate required parameters
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }
    
    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      throw new ApiError('At least one metric type is required', 400);
    }

    // Parse days parameter
    const daysParam = days ? parseInt(days as string, 10) : 30;
    
    // Validate days parameter
    if (isNaN(daysParam) || daysParam < 1 || daysParam > 365) {
      throw new ApiError('Days parameter must be a number between 1 and 365', 400);
    }

    const report = await reportsService.generateCustomReport(
      userId, 
      title || 'Custom Health Report', 
      metrics, 
      daysParam
    );

    res.status(201).json({
      success: true,
      message: 'Custom report generated successfully',
      data: report
    });
  } catch (error) {
    logger.error('Error in generateCustomReport controller:', error);
    
    if (error instanceof ApiError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
        error: error.details
      });
    } else {
      next(error);
    }
  }
};