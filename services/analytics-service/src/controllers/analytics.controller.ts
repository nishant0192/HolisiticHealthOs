import { Request, Response, NextFunction } from 'express';
import analyticsService from '../services/analytics.service';
import { logger } from '@shared/logger';
import { ApiError } from '@shared/common';

export const getHealthData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;
    const { type, source, start_date, end_date, limit, offset } = req.query;

    // Validate required userId
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }

    // Parse filter parameters
    const filter: any = { userId };
    
    if (type) {
      filter.type = type as string;
    }
    
    if (source) {
      filter.source = source as string;
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

    const data = await analyticsService.getHealthData(filter);

    res.status(200).json({
      success: true,
      message: 'Health data retrieved successfully',
      data
    });
  } catch (error) {
    logger.error('Error in getHealthData controller:', error);
    
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

export const getHealthStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;
    const { type, source, start_date, end_date } = req.query;

    // Validate required parameters
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }
    
    if (!type) {
      throw new ApiError('Health data type is required', 400);
    }

    // Parse filter parameters
    const filter: any = { 
      userId,
      type: type as string
    };
    
    if (source) {
      filter.source = source as string;
    }
    
    if (start_date) {
      filter.startDate = start_date as string;
    }
    
    if (end_date) {
      filter.endDate = end_date as string;
    }

    const stats = await analyticsService.getHealthDataStats(filter);

    res.status(200).json({
      success: true,
      message: 'Health statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    logger.error('Error in getHealthStats controller:', error);
    
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

export const getDailyAggregates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;
    const { type, source, start_date, end_date, limit, offset } = req.query;

    // Validate required parameters
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }
    
    if (!type) {
      throw new ApiError('Health data type is required', 400);
    }

    // Parse filter parameters
    const filter: any = {
      userId,
      type: type as string
    };
    
    if (source) {
      filter.source = source as string;
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

    const aggregates = await analyticsService.getDailyAggregates(filter);

    res.status(200).json({
      success: true,
      message: 'Daily aggregates retrieved successfully',
      data: aggregates
    });
  } catch (error) {
    logger.error('Error in getDailyAggregates controller:', error);
    
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

export const getActivityInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;
    const { days } = req.query;

    // Validate required parameters
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }

    // Parse days parameter
    const daysParam = days ? parseInt(days as string, 10) : 30;
    
    // Validate days parameter
    if (isNaN(daysParam) || daysParam < 1 || daysParam > 90) {
      throw new ApiError('Days parameter must be a number between 1 and 90', 400);
    }

    const insights = await analyticsService.getActivityInsights(userId, daysParam);

    res.status(200).json({
      success: true,
      message: 'Activity insights retrieved successfully',
      data: insights
    });
  } catch (error) {
    logger.error('Error in getActivityInsights controller:', error);
    
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

export const getSleepInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;
    const { days } = req.query;

    // Validate required parameters
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }

    // Parse days parameter
    const daysParam = days ? parseInt(days as string, 10) : 30;
    
    // Validate days parameter
    if (isNaN(daysParam) || daysParam < 1 || daysParam > 90) {
      throw new ApiError('Days parameter must be a number between 1 and 90', 400);
    }

    const insights = await analyticsService.getSleepInsights(userId, daysParam);

    res.status(200).json({
      success: true,
      message: 'Sleep insights retrieved successfully',
      data: insights
    });
  } catch (error) {
    logger.error('Error in getSleepInsights controller:', error);
    
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

export const getNutritionInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;
    const { days } = req.query;

    // Validate required parameters
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }

    // Parse days parameter
    const daysParam = days ? parseInt(days as string, 10) : 30;
    
    // Validate days parameter
    if (isNaN(daysParam) || daysParam < 1 || daysParam > 90) {
      throw new ApiError('Days parameter must be a number between 1 and 90', 400);
    }

    const insights = await analyticsService.getNutritionInsights(userId, daysParam);

    res.status(200).json({
      success: true,
      message: 'Nutrition insights retrieved successfully',
      data: insights
    });
  } catch (error) {
    logger.error('Error in getNutritionInsights controller:', error);
    
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

export const getTrendAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;
    const { metric_type, days } = req.query;

    // Validate required parameters
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }
    
    if (!metric_type) {
      throw new ApiError('Metric type is required', 400);
    }

    // Parse days parameter
    const daysParam = days ? parseInt(days as string, 10) : 30;
    
    // Validate days parameter
    if (isNaN(daysParam) || daysParam < 1 || daysParam > 365) {
      throw new ApiError('Days parameter must be a number between 1 and 365', 400);
    }

    const analysis = await analyticsService.getTrendAnalysis(
      userId, 
      metric_type as string, 
      daysParam
    );

    res.status(200).json({
      success: true,
      message: 'Trend analysis retrieved successfully',
      data: analysis
    });
  } catch (error) {
    logger.error('Error in getTrendAnalysis controller:', error);
    
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

export const getCorrelationAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;
    const { metric1, metric2, days } = req.query;

    // Validate required parameters
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }
    
    if (!metric1 || !metric2) {
      throw new ApiError('Two metric types are required', 400);
    }

    // Parse days parameter
    const daysParam = days ? parseInt(days as string, 10) : 30;
    
    // Validate days parameter
    if (isNaN(daysParam) || daysParam < 7 || daysParam > 365) {
      throw new ApiError('Days parameter must be a number between 7 and 365', 400);
    }

    const analysis = await analyticsService.getCorrelationAnalysis(
      userId, 
      metric1 as string, 
      metric2 as string, 
      daysParam
    );

    res.status(200).json({
      success: true,
      message: 'Correlation analysis retrieved successfully',
      data: analysis
    });
  } catch (error) {
    logger.error('Error in getCorrelationAnalysis controller:', error);
    
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

export const getHealthSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;
    const { days } = req.query;

    // Validate required parameters
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }

    // Parse days parameter
    const daysParam = days ? parseInt(days as string, 10) : 7;
    
    // Validate days parameter
    if (isNaN(daysParam) || daysParam < 1 || daysParam > 90) {
      throw new ApiError('Days parameter must be a number between 1 and 90', 400);
    }

    const summary = await analyticsService.getHealthSummary(userId, daysParam);

    res.status(200).json({
      success: true,
      message: 'Health summary retrieved successfully',
      data: summary
    });
  } catch (error) {
    logger.error('Error in getHealthSummary controller:', error);
    
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

export const getMetricComparison = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;
    const { metric_type } = req.query;

    // Validate required parameters
    if (!userId) {
      throw new ApiError('User ID is required', 400);
    }
    
    if (!metric_type) {
      throw new ApiError('Metric type is required', 400);
    }

    const comparison = await analyticsService.getMetricComparison(
      userId, 
      metric_type as string
    );

    res.status(200).json({
      success: true,
      message: 'Metric comparison retrieved successfully',
      data: comparison
    });
  } catch (error) {
    logger.error('Error in getMetricComparison controller:', error);
    
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