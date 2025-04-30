import { logger } from '@shared/logger';
import reportsModel, { Report, ReportFilter, ReportType, ReportPeriod } from '../models/reports.model';
import analyticsService from './analytics.service';
import { subDays, format } from 'date-fns';
import { ApiError } from '@shared/common';

class ReportsService {
  /**
   * Create a new report
   */
  async createReport(report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report> {
    try {
      // Validate report data
      this.validateReportData(report);
      
      // Create the report
      return await reportsModel.createReport(report);
    } catch (error) {
      logger.error('Error creating report:', error);
      throw error;
    }
  }
  
  /**
   * Get reports with filtering options
   */
  async getReports(filter: ReportFilter): Promise<Report[]> {
    try {
      return await reportsModel.getReports(filter);
    } catch (error) {
      logger.error('Error retrieving reports:', error);
      throw error;
    }
  }
  
  /**
   * Get a report by ID
   */
  async getReportById(id: string, userId: string): Promise<Report> {
    try {
      const report = await reportsModel.getReportById(id, userId);
      
      if (!report) {
        throw new ApiError(`Report with ID ${id} not found`, 404);
      }
      
      return report;
    } catch (error) {
      logger.error('Error retrieving report by ID:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing report
   */
  async updateReport(id: string, userId: string, updates: Partial<Report>): Promise<Report> {
    try {
      const updatedReport = await reportsModel.updateReport(id, userId, updates);
      
      if (!updatedReport) {
        throw new ApiError(`Report with ID ${id} not found or access denied`, 404);
      }
      
      return updatedReport;
    } catch (error) {
      logger.error('Error updating report:', error);
      throw error;
    }
  }
  
  /**
   * Delete a report
   */
  async deleteReport(id: string, userId: string): Promise<boolean> {
    try {
      const deleted = await reportsModel.deleteReport(id, userId);
      
      if (!deleted) {
        throw new ApiError(`Report with ID ${id} not found or access denied`, 404);
      }
      
      return true;
    } catch (error) {
      logger.error('Error deleting report:', error);
      throw error;
    }
  }
  
  /**
   * Generate a weekly activity report
   */
  async generateActivityReport(userId: string): Promise<Report> {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 7);
      
      // Get activity insights
      const activityInsights = await analyticsService.getActivityInsights(userId, 7);
      
      // Create report data
      const reportData = {
        summary: activityInsights.summary,
        trends: activityInsights.trends,
        dailyStats: activityInsights.dailyStats,
        recommendations: activityInsights.recommendations
      };
      
      // Create the report
      const report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        title: `Weekly Activity Report (${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')})`,
        type: ReportType.ACTIVITY,
        period: ReportPeriod.WEEKLY,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        data: reportData
      };
      
      return await this.createReport(report);
    } catch (error) {
      logger.error('Error generating activity report:', error);
      throw error;
    }
  }
  
  /**
   * Generate a weekly sleep report
   */
  async generateSleepReport(userId: string): Promise<Report> {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 7);
      
      // Get sleep insights
      const sleepInsights = await analyticsService.getSleepInsights(userId, 7);
      
      // Create report data
      const reportData = {
        summary: sleepInsights.summary,
        trends: sleepInsights.trends,
        dailyStats: sleepInsights.dailyStats,
        recommendations: sleepInsights.recommendations
      };
      
      // Create the report
      const report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        title: `Weekly Sleep Report (${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')})`,
        type: ReportType.SLEEP,
        period: ReportPeriod.WEEKLY,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        data: reportData
      };
      
      return await this.createReport(report);
    } catch (error) {
      logger.error('Error generating sleep report:', error);
      throw error;
    }
  }
  
  /**
   * Generate a weekly nutrition report
   */
  async generateNutritionReport(userId: string): Promise<Report> {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 7);
      
      // Get nutrition insights
      const nutritionInsights = await analyticsService.getNutritionInsights(userId, 7);
      
      // Create report data
      const reportData = {
        summary: nutritionInsights.summary,
        trends: nutritionInsights.trends,
        dailyStats: nutritionInsights.dailyStats,
        recommendations: nutritionInsights.recommendations
      };
      
      // Create the report
      const report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        title: `Weekly Nutrition Report (${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')})`,
        type: ReportType.NUTRITION,
        period: ReportPeriod.WEEKLY,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        data: reportData
      };
      
      return await this.createReport(report);
    } catch (error) {
      logger.error('Error generating nutrition report:', error);
      throw error;
    }
  }
  
  /**
   * Generate a comprehensive health report
   */
  async generateHealthReport(userId: string): Promise<Report> {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 7);
      
      // Get comprehensive health summary
      const healthSummary = await analyticsService.getHealthSummary(userId, 7);
      
      // Get activity, sleep and nutrition insights
      const [activityInsights, sleepInsights, nutritionInsights] = await Promise.all([
        analyticsService.getActivityInsights(userId, 7),
        analyticsService.getSleepInsights(userId, 7),
        analyticsService.getNutritionInsights(userId, 7)
      ]);
      
      // Create report data
      const reportData = {
        summary: healthSummary,
        activity: {
          summary: activityInsights.summary,
          trends: activityInsights.trends
        },
        sleep: {
          summary: sleepInsights.summary,
          trends: sleepInsights.trends
        },
        nutrition: {
          summary: nutritionInsights.summary,
          trends: nutritionInsights.trends
        },
        recommendations: [
          ...activityInsights.recommendations || [],
          ...sleepInsights.recommendations || [],
          ...nutritionInsights.recommendations || []
        ]
      };
      
      // Create the report
      const report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        title: `Weekly Health Report (${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')})`,
        type: ReportType.HEALTH,
        period: ReportPeriod.WEEKLY,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        data: reportData
      };
      
      return await this.createReport(report);
    } catch (error) {
      logger.error('Error generating comprehensive health report:', error);
      throw error;
    }
  }
  
  /**
   * Generate a custom report based on specific metrics
   */
  async generateCustomReport(
    userId: string, 
    title: string, 
    metrics: string[], 
    days: number = 30
  ): Promise<Report> {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, days);
      
      // Get data for each metric
      const metricData = await Promise.all(
        metrics.map(async metric => {
          const data = await analyticsService.getTrendAnalysis(userId, metric, days);
          return {
            type: metric,
            ...data
          };
        })
      );
      
      // Generate correlations between metrics if there are multiple
      const correlations = [];
      if (metrics.length > 1) {
        for (let i = 0; i < metrics.length - 1; i++) {
          for (let j = i + 1; j < metrics.length; j++) {
            const correlation = await analyticsService.getCorrelationAnalysis(
              userId, 
              metrics[i], 
              metrics[j], 
              days
            );
            
            if (correlation.dataPoints >= 5) { // Only include if there's enough data
              correlations.push(correlation);
            }
          }
        }
      }
      
      // Create report data
      const reportData = {
        metrics: metricData,
        correlations,
        period: {
          days,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd')
        }
      };
      
      // Create the report
      const report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        title: title || `Custom Health Report (${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')})`,
        type: ReportType.CUSTOM,
        period: days <= 7 ? ReportPeriod.WEEKLY : (days <= 31 ? ReportPeriod.MONTHLY : ReportPeriod.CUSTOM),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        data: reportData
      };
      
      return await this.createReport(report);
    } catch (error) {
      logger.error('Error generating custom report:', error);
      throw error;
    }
  }
  
  /**
   * Helper to validate report data
   */
  private validateReportData(report: Partial<Report>): void {
    if (!report.userId) {
      throw new ApiError('User ID is required', 400);
    }
    
    if (!report.title) {
      throw new ApiError('Report title is required', 400);
    }
    
    if (!report.type) {
      throw new ApiError('Report type is required', 400);
    }
    
    if (!report.startDate || !report.endDate) {
      throw new ApiError('Start and end dates are required', 400);
    }
    
    if (new Date(report.startDate) > new Date(report.endDate)) {
      throw new ApiError('Start date must be before end date', 400);
    }
    
    if (!report.data) {
      throw new ApiError('Report data is required', 400);
    }
  }
}

export default new ReportsService();